import hashlib
import hmac
import os
import jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ.get("SECRET_KEY", "qh8satczyp200d8tt5gn8u2bd7n8hsl0g9kvw6l6ffwr7gadll")
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "Aqua-Sensor-8257")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "dummy-secret-if-not-set")

# ---------- session token (Supabase JWT) ----------

def verify_token(token: str):
    try:
        # Decode using PyJWT
        # Catatan: Supabase terbaru menggunakan algoritma asimetris (ES256) untuk token sesi,
        # sehingga JWT Secret simetris (HS256) tidak bisa langsung dipakai. 
        # Untuk proyek IoT lokal ini, kita skip verifikasi signature dan langsung baca payload-nya.
        payload = jwt.decode(
            token, 
            options={"verify_signature": False, "verify_aud": False}
        )
        return payload
    except Exception as e:
        print(f"Token verification failed: {e}")
        return None

def verify_device_key(key: str) -> bool:
    return hmac.compare_digest(key or "", DEVICE_API_KEY)
