# 🌊 AquaAware: Intelligent Water Quality Monitoring

![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![Machine Learning](https://img.shields.io/badge/AI-Random_Forest-FF6F00?logo=scikitlearn&logoColor=white)

**AquaAware** adalah sistem pemantauan kelayakan air bersih mutakhir berbasis *Internet of Things* (IoT) yang diperkuat dengan *Machine Learning*. 

Sistem ini dirancang untuk menganalisis kualitas air secara **Real-Time** melalui 9 parameter kimiawi krusial. Sistem secara otomatis memberikan keputusan kelayakan air menggunakan dua lapis analisis (Context-Aware):
1. **Machine Learning Model:** Mendeteksi pola kompleks secara holistik.
2. **Rule-Based Engine:** Memastikan kepatuhan ketat terhadap standar ambang batas air minum (WHO / Permenkes).

> [!IMPORTANT]
> **Status Perangkat Keras:** Sistem saat ini menggunakan **Device Simulator** (berbasis Python) yang me-replay dataset *Kaggle Water Potability* secara seketika untuk menggantikan sensor fisik. Arsitektur sistem sudah 100% *production-ready* untuk perangkat IoT fisik (ESP32/Arduino/Raspberry Pi) tanpa perlu mengubah satu baris pun kode *backend* maupun *frontend*.

---

## 🏗️ Struktur Direktori

Proyek ini menggunakan arsitektur *monorepo* yang memisahkan setiap komponen layanan:

```text
📁 aquaware-iot-system
├── 📂 backend/      # Core API, WebSocket, Auth (FastAPI)
├── 📂 frontend/     # Web Dashboard & UI (React + Vite)
├── 📂 ml/           # Model Training & Preprocessing Data (Scikit-Learn)
├── 📂 simulator/    # Skrip pengirim data sensor virtual
└── 📂 data/         # Dataset mentah & skrip generator sampel
```

---

## 🚀 Panduan Memulai Cepat (Quick Start)

Untuk menjalankan proyek ini secara penuh (Lokal), Anda membutuhkan 3 terminal terpisah:

### 1. Jalankan Backend (API & WebSocket Server)
Pastikan Anda sudah menjalankan perintah `pip install -r requirements.txt`.
```bash
uvicorn backend.main:app --reload --port 8000
```
*Server akan berjalan di `http://localhost:8000`*

### 2. Jalankan Frontend (Web Dashboard)
Masuk ke folder `frontend`, install modul, dan jalankan server pengembangan:
```bash
cd frontend
npm install
npm run dev
```
*Aplikasi web dapat diakses di `http://localhost:5173`*

### 3. Nyalakan Simulator (Sensor Hardware Virtual)
Simulator ini akan mulai menembakkan data sensor ke backend setiap 5 detik.
```bash
python simulator/device_simulator.py
```

---

## 🛡️ Sistem Keamanan & Autentikasi

AquaAware menggunakan arsitektur keamanan tingkat industri yang dirancang khusus untuk ekosistem IoT, memisahkan secara ketat antara **Hak Akses Manusia** dan **Hak Akses Mesin**.

| Metode | Pengguna | Cara Kerja |
|---|---|---|
| **User Auth** | Manusia (Admin/Operator) | Menggunakan Supabase Auth untuk menghasilkan *JWT Bearer Token* yang mengamankan rute dasbor dan WebSocket. |
| **Device Key** | Mesin (Sensor / Simulator) | Menggunakan *Static API Key* (`X-Device-Key`) yang diverifikasi secara aman oleh Backend di setiap pengiriman payload data. |

> [!WARNING]
> Sebelum melakukan *deployment* ke server publik, sangat diwajibkan untuk mengubah nilai default rahasia (seperti `SECRET_KEY`, `DEVICE_API_KEY`, dan *Database Credentials*) di dalam file `.env` Anda.

---

## 🔗 Referensi & Dokumentasi Lengkap

Untuk penjelasan arsitektur sistem yang lebih mendalam, diagram alur, dan penjabaran tentang bagaimana *Context-Engine* beroperasi, silakan baca dokumen:
👉 **[Project Overview & Architecture (project_overview.md)](project_overview.md)**
