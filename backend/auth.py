"""
Modul autentikasi sederhana — sengaja hanya pakai Python standard library
(hashlib, hmac, secrets) supaya tidak menambah dependency yang rawan gagal
install di berbagai OS/versi Python.

Dua jalur autentikasi terpisah, sesuai kelaziman sistem IoT:
1. USER LOGIN  -> dipakai orang (dashboard, lihat data)         -> session token
2. DEVICE KEY  -> dipakai perangkat/simulator (kirim data sensor) -> API key statis

PENTING UNTUK PRODUKSI:
- Ganti SECRET_KEY dan DEVICE_API_KEY lewat environment variable, jangan
  pakai nilai default di bawah ini.
- Ganti password admin default segera setelah instalasi pertama.
- Untuk deployment publik (bukan localhost/demo), tambahkan HTTPS,
  rate limiting pada endpoint login, dan pertimbangkan library auth yang
  lebih matang (mis. Authlib) untuk kebutuhan multi-role/refresh token.
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time

SECRET_KEY = os.environ.get("SECRET_KEY", "qh8satczyp200d8tt5gn8u2bd7n8hsl0g9kvw6l6ffwr7gadll")
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "Aqua-Sensor-8257")
TOKEN_TTL_SECONDS = 8 * 60 * 60  # sesi login berlaku 8 jam


# ---------- password hashing (PBKDF2-HMAC-SHA256, stdlib only) ----------
def hash_password(password: str, salt: bytes = None) -> str:
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return f"{salt.hex()}${dk.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split("$")
        salt = bytes.fromhex(salt_hex)
        dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
        return hmac.compare_digest(dk.hex(), hash_hex)
    except Exception:
        return False


# ---------- session token (HMAC-signed, mirip JWT tapi minimal) ----------
def create_token(username: str) -> str:
    payload = {"sub": username, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
    return f"{payload_b64}.{sig}"


def verify_token(token: str):
    try:
        payload_b64, sig = token.split(".")
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded))
        if payload["exp"] < time.time():
            return None
        return payload
    except Exception:
        return None


def verify_device_key(key: str) -> bool:
    return hmac.compare_digest(key or "", DEVICE_API_KEY)
