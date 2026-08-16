# 🏛️ SIKATO — Sistem Informasi Kependudukan & Topografi

**SIKATO** (*Sistem Informasi Kependudukan & Topografi*) adalah platform Business Intelligence (BI) & Web GIS Spasial terpadu untuk pendataan kependudukan, pemetaan topografi wilayah, serta evaluasi kesejahteraan warga **Nagari Tabek Patah**, Kecamatan Tanjung Emas, Kabupaten Tanah Datar, Sumatera Barat.

---

## 🎓 Tim Pengembang & Kredit

- **Pengembang Web (Lead Developer)**: **Muhammad Rafi Asytar** (NIM: 2311522030)
- **Tim Pengembang**: Tim KKN Universitas Andalas Reguler Periode 2 Tahun 2026
- **Mitra Pemerintahan**: Pemerintahan Nagari Tabek Patah, Kabupaten Tanah Datar
- **Tahun Rilis**: 2026 (Versi 1.0.0)

---

## 📁 Struktur Monorepo

```
SIKATO/
├── client/                 # Frontend Web App (React 19 + Vite + Leaflet GIS)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── server/                 # Backend API Server (Node.js + Express + PostgreSQL)
│   ├── src/
│   ├── routes/
│   ├── scripts/
│   └── package.json
├── real_sensus.csv         # File sampel data sensus kependudukan
├── package.json            # Root monorepo configuration
└── README.md               # Dokumentasi utama proyek
```

---

## 🚀 Panduan Memulai (Quick Start)

### 1. Prasyarat System
- Node.js versi 18+ atau 20+
- PostgreSQL Server 14+
- Git

### 2. Instalasi Dependensi
Jalankan perintah berikut di root folder `SIKATO`:

```bash
# Instal dependensi client & server sekaligus
npm run install:all
```

### 3. Konfigurasi Database & Environment
Buat file `.env` di folder `server/` dengan konfigurasi PostgreSQL Anda:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sikato_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=sikato_secret_key_2026
```

### 4. Menjalankan Aplikasi (Development)

```bash
# Jalankan Frontend & Backend sekaligus
npm run dev

# Atau jalankan salah satu saja:
npm run dev:client   # Frontend di http://localhost:5173
npm run dev:server   # Backend di http://localhost:5000
```

---

## 🛠️ Teknologi Yang Penggunaannya

- **Frontend**: React 19, Vite, Leaflet GIS, Lucide React, Vanilla CSS3 (Custom Design System).
- **Backend**: Node.js, Express.js, PostgreSQL (pg driver), JWT Authentication, Bcrypt.
- **Geospatial Data**: GeoJSON layer (Batas Jorong, Fasilitas Kesehatan, Sekolah, Rumah Ibadah, Evakuasi Bencana).

---

© 2026 Pemerintahan Nagari Tabek Patah & Tim KKN Universitas Andalas Reguler Periode 2.
