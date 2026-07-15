"""
Backend API — Web App Monitoring Kelayakan Air (context-aware).

Endpoint dirancang dengan skema payload yang SAMA seperti yang nanti akan
dikirim oleh sensor hardware asli (ESP32 dsb). Saat ini payload datang dari
device_simulator.py yang me-replay dataset sekunder sebagai virtual sensor.

Jalankan: uvicorn backend.main:app --reload --port 8000
"""
import sys, os, json, sqlite3
from datetime import datetime, timezone
from typing import Optional, List

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))
sys.path.append(os.path.dirname(__file__))

import joblib
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header, Query, Request
from fastapi.responses import Response
import io, csv
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel

from preprocess import FEATURES, rule_based_status
import auth

DB_PATH = os.path.join(os.path.dirname(__file__), "readings.db")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "model.pkl")
DEFAULT_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "aquaware123")

app = FastAPI(title="Water Quality Monitoring API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost,http://127.0.0.1,null").split(",")
app.add_middleware(
    CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"]
)

# ---------- storage ----------
def init_db():
    con = sqlite3.connect(DB_PATH)
    con.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            device_id TEXT,
            ph REAL, Hardness REAL, Solids REAL, Chloramines REAL, Sulfate REAL,
            Conductivity REAL, Organic_carbon REAL, Trihalomethanes REAL, Turbidity REAL,
            prediction INTEGER, probability REAL, rule_based INTEGER
        )
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    """)
    # seed akun admin default kalau belum ada user sama sekali
    row = con.execute("SELECT COUNT(*) FROM users").fetchone()
    if row[0] == 0:
        con.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ("admin", auth.hash_password(DEFAULT_ADMIN_PASSWORD)),
        )
        print(f"[auth] Akun admin default dibuat -> username: admin, password: {DEFAULT_ADMIN_PASSWORD}")
        print("[auth] SEGERA ganti password ini setelah login pertama kali.")
    con.commit()
    con.close()

init_db()

# ---------- model ----------
_bundle = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None


class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


def require_user(authorization: str = Header(default=None)):
    """Dependency untuk endpoint yang dipakai manusia lewat dashboard."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token tidak ada. Silakan login.")
    payload = auth.verify_token(authorization.removeprefix("Bearer ").strip())
    if not payload:
        raise HTTPException(status_code=401, detail="Token tidak valid atau sudah kedaluwarsa.")
    return payload["sub"]


def require_device(x_device_key: str = Header(default=None)):
    """Dependency untuk endpoint yang dipakai perangkat/simulator sensor."""
    if not auth.verify_device_key(x_device_key):
        raise HTTPException(status_code=401, detail="Device API key tidak valid.")
    return True


class SensorReading(BaseModel):
    device_id: str = "sim-01"
    ph: Optional[float] = None
    Hardness: Optional[float] = None
    Solids: Optional[float] = None
    Chloramines: Optional[float] = None
    Sulfate: Optional[float] = None
    Conductivity: Optional[float] = None
    Organic_carbon: Optional[float] = None
    Trihalomethanes: Optional[float] = None
    Turbidity: Optional[float] = None


# ---------- websocket manager ----------
class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


def predict(reading: dict) -> dict:
    row = [[reading.get(f) or 0 for f in FEATURES]]
    if _bundle is None:
        return {"prediction": None, "probability": None}
    model = _bundle["model"]
    proba = model.predict_proba(row)[0]
    pred = int(model.predict(row)[0])
    return {"prediction": pred, "probability": round(float(proba[1]), 3)}


@app.post("/api/auth/login")
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    user = con.execute(
        "SELECT * FROM users WHERE username = ?", (body.username,)
    ).fetchone()
    con.close()
    if not user or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Username atau password salah.")
    return {"token": auth.create_token(user["username"]), "username": user["username"]}


@app.post("/api/auth/change-password")
def change_password(body: ChangePasswordRequest, username: str = Depends(require_user)):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    user = con.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user or not auth.verify_password(body.old_password, user["password_hash"]):
        con.close()
        raise HTTPException(status_code=401, detail="Password lama salah.")
    con.execute(
        "UPDATE users SET password_hash = ? WHERE username = ?",
        (auth.hash_password(body.new_password), username),
    )
    con.commit()
    con.close()
    return {"status": "ok", "message": "Password berhasil diganti."}


@app.post("/api/sensor-data")
@limiter.limit("120/minute")
async def ingest_sensor_data(request: Request, reading: SensorReading, _: bool = Depends(require_device)):
    data = reading.dict()
    ml_result = predict(data)
    rb_result = rule_based_status(data)

    ts = datetime.now(timezone.utc).isoformat()
    con = sqlite3.connect(DB_PATH)
    con.execute(
        f"""INSERT INTO readings
        (ts, device_id, {", ".join(FEATURES)}, prediction, probability, rule_based)
        VALUES (?, ?, {", ".join(["?"] * len(FEATURES))}, ?, ?, ?)""",
        [ts, data["device_id"]] + [data[f] for f in FEATURES]
        + [ml_result["prediction"], ml_result["probability"], int(rb_result["layak_rule_based"])],
    )
    con.commit()
    con.close()

    payload = {
        "ts": ts,
        "device_id": data["device_id"],
        "readings": {f: data[f] for f in FEATURES},
        "ml": ml_result,
        "rule_based": rb_result,
    }
    await manager.broadcast(payload)
    return payload


@app.get("/api/latest")
def get_latest(limit: int = 1, username: str = Depends(require_user)):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT * FROM readings ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    con.close()
    return [dict(r) for r in rows]


@app.get("/api/history")
def get_history(limit: int = 100, username: str = Depends(require_user)):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT * FROM (SELECT * FROM readings ORDER BY id DESC LIMIT ?) ORDER BY id ASC", (limit,)
    ).fetchall()
    con.close()
    return [dict(r) for r in rows]


@app.get("/api/export")
def export_csv(limit: int = 1000, username: str = Depends(require_user)):
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    rows = con.execute(
        "SELECT * FROM (SELECT * FROM readings ORDER BY id DESC LIMIT ?) ORDER BY id ASC", (limit,)
    ).fetchall()
    con.close()
    
    if not rows:
        return Response(content="No data", media_type="text/plain")
        
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(rows[0].keys())
    # Baris data
    for r in rows:
        writer.writerow(tuple(r))
        
    response = Response(content=output.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=aquaware_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return response


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(default=None)):
    payload = auth.verify_token(token) if token else None
    if not payload:
        await ws.close(code=4401)  # kode custom: unauthorized
        return
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive; client tidak wajib kirim apa-apa
    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.get("/")
def root():
    return {"status": "ok", "message": "Water Quality Monitoring API aktif"}
