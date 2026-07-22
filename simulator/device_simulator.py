"""
Device simulator — PENGGANTI hardware sensor selama belum tersedia.

Membaca dataset baris demi baris dan mengirimkannya ke backend API dengan
interval waktu tertentu, PERSIS seperti sensor asli akan mengirim data.
Payload JSON-nya sengaja dibuat identik dengan skema SensorReading di
backend/main.py, sehingga saat hardware (ESP32/Arduino) sudah ada, cukup
ganti bagian "kirim data" ini dengan kode firmware yang publish ke endpoint
yang sama — tidak ada perubahan pada backend maupun frontend.

Jalankan: python simulator/device_simulator.py
"""
import time
import random
import sys
import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml"))
from preprocess import load_and_clean, FEATURES

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "water_potability.csv")
API_URL = os.environ.get("API_URL", "http://localhost:8000/api/sensor-data")
INTERVAL_SECONDS = float(os.environ.get("INTERVAL_SECONDS", "5"))
DEVICE_ID = os.environ.get("DEVICE_ID", "sim-01")
DEVICE_API_KEY = os.environ.get("DEVICE_API_KEY", "Aqua-Sensor-8257")
HEADERS = {"X-Device-Key": DEVICE_API_KEY}


def stream_rows(df: pd.DataFrame, shuffle: bool = True):
    order = df.index.tolist()
    if shuffle:
        random.shuffle(order)
    for idx in order:
        yield df.loc[idx]


def main():
    df = load_and_clean(DATA_PATH)
    print(f"[simulator] {len(df)} baris data siap di-stream sebagai sensor '{DEVICE_ID}'")
    print(f"[simulator] mengirim ke {API_URL} setiap {INTERVAL_SECONDS}s")

    while True:
        for row in stream_rows(df):
            payload = {"device_id": DEVICE_ID, **{f: float(row[f]) for f in FEATURES}}
            try:
                resp = requests.post(API_URL, json=payload, headers=HEADERS, timeout=5)
                resp.raise_for_status()
                result = resp.json()
                status = "LAYAK" if result["ml"]["prediction"] == 1 else "TIDAK LAYAK"
                print(f"[simulator] terkirim | pH={row['ph']:.2f} "
                      f"Turbidity={row['Turbidity']:.2f} -> prediksi: {status} "
                      f"(prob={result['ml']['probability']})")
            except requests.HTTPError as e:
                if resp.status_code == 401:
                    print("[simulator] DITOLAK: device API key salah. Cek env var DEVICE_API_KEY "
                          "harus sama dengan yang di-set pada backend.")
                else:
                    print(f"[simulator] gagal mengirim data: {e}")
            except requests.RequestException as e:
                print(f"[simulator] gagal mengirim data: {e}")
            time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
