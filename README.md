# AquaWare — Monitoring Kelayakan Air (Context-Aware IoT)

Web app monitoring kelayakan air bersih. Karena hardware sensor belum
tersedia, sistem ini memakai **dataset sekunder** ([Kaggle Water
Potability](https://www.kaggle.com/datasets/adityakadiwal/water-potability))
yang di-*replay* oleh sebuah *device simulator* seolah-olah data datang dari
sensor asli — dengan protokol dan skema payload yang identik dengan yang
akan dipakai hardware nanti. Saat sensor fisik sudah ada, cukup ganti
`simulator/device_simulator.py` dengan firmware ESP32/Arduino yang
POST/publish ke endpoint yang sama; backend dan frontend tidak perlu diubah.

## Struktur project

```
data/                      dataset & script pembuat sample data
ml/                        preprocessing, training, model tersimpan (model.pkl)
backend/main.py            FastAPI: sensor data, prediksi, riwayat, WebSocket
backend/auth.py            login, hashing password, device API key
simulator/                 device simulator (pengganti hardware)
frontend/                  dashboard React/Vite (UI modern)
```

## 1. Siapkan dataset asli

Unduh `water_potability.csv` dari Kaggle lalu ganti file di
`data/water_potability.csv` (saat ini terisi data sample sintetis untuk
development — lihat `data/generate_sample_data.py`).

## 2. Instal dependency

```bash
pip install -r requirements.txt
```

## 3. Latih model

```bash
python ml/train_model.py
```
Menghasilkan `ml/model.pkl`. Jalankan ulang setiap kali dataset berganti.

## 4. Jalankan backend

```bash
uvicorn backend.main:app --reload --port 8000
```
Endpoint utama:
- `POST /api/sensor-data` — terima 1 pembacaan sensor (JSON)
- `GET /api/latest?limit=N` — pembacaan terbaru
- `GET /api/history?limit=N` — riwayat
- `WS /ws` — stream realtime untuk dashboard

## 5. Jalankan device simulator (di terminal terpisah)

```bash
python simulator/device_simulator.py
```
Atur interval dan device id lewat env var:
```bash
INTERVAL_SECONDS=5 DEVICE_ID=sim-tandon-01 python simulator/device_simulator.py
```

## 6. Jalankan Frontend (Dashboard)

Buka terminal baru, masuk ke folder `frontend`, lalu install *dependencies* dan jalankan server *development*:

```bash
cd frontend
npm install
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`). Pastikan backend juga sudah berjalan.

## Keamanan: login &amp; device key

Sistem punya dua jalur autentikasi terpisah, sesuai kelaziman arsitektur IoT:

| Jalur | Dipakai oleh | Cara kerja |
|---|---|---|
| **Login user** | Orang yang membuka dashboard | Login di halaman web → dapat session token (berlaku 8 jam) → disimpan di browser → dikirim di setiap request dan koneksi WebSocket |
| **Device API key** | Simulator/sensor pengirim data | Header `X-Device-Key` yang harus cocok dengan key di backend |

Dipisah karena manusia dan perangkat perlu cara autentikasi yang berbeda — perangkat tidak bisa "mengisi form login" tiap kali mengirim data, tapi tetap harus diverifikasi supaya orang lain tidak bisa mengirim data sensor palsu ke sistem kamu.

### Sebelum dipakai / didemokan

1. **Ganti nilai default.** Jalankan backend dengan environment variable sendiri, jangan pakai default di kode:
   ```bash
   SECRET_KEY="rahasia-panjang-acak-punya-kamu" \
   DEVICE_API_KEY="key-perangkat-punya-kamu" \
   ADMIN_PASSWORD="password-admin-yang-kuat" \
   uvicorn backend.main:app --port 8000
   ```
   Kalau tidak di-set, backend tetap jalan pakai nilai default (`ubah-secret-key-ini-sebelum-deploy`, dst) — cukup untuk demo lokal, **tidak untuk deployment publik**.

2. **Set device key yang sama di simulator:**
   ```bash
   DEVICE_API_KEY="key-perangkat-punya-kamu" python simulator/device_simulator.py
   ```

3. **Login pertama kali** pakai username `admin` dan password yang tercetak di log backend saat pertama kali dijalankan (atau `ADMIN_PASSWORD` yang kamu set). Segera ganti lewat endpoint `POST /api/auth/change-password`.

### Batasan implementasi saat ini

Ini keamanan level prototipe/tugas kuliah, cukup untuk mendemonstrasikan konsep autentikasi dalam sistem IoT. Untuk produksi sungguhan, tambahkan minimal:
- HTTPS (saat ini token dikirim polos lewat HTTP)
- Rate limiting di endpoint login (cegah brute-force)
- Refresh token / revocation list (saat ini token tidak bisa "dicabut" sebelum kedaluwarsa)
- Role-based access (saat ini semua user login punya akses yang sama)

## Catatan untuk laporan/presentasi

Sampaikan secara eksplisit bahwa data sensor pada tahap ini berasal dari
simulasi dataset sekunder, bukan hardware fisik, karena kendala waktu
pengadaan. Tekankan bahwa arsitektur (skema payload, endpoint, database,
context engine) sudah dirancang siap-hardware — migrasi ke sensor asli
nantinya tidak mengubah backend maupun frontend, hanya mengganti sumber
pengiriman data.
