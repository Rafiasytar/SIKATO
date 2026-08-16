# 🏛️ SIKATO — Sistem Informasi Kependudukan & Topografi

**SIKATO** (*Sistem Informasi Kependudukan & Topografi*) adalah platform Business Intelligence (BI) & Web GIS Spasial terpadu untuk pendataan kependudukan, pemetaan topografi wilayah, serta evaluasi kesejahteraan warga **Nagari Tabek Patah**, Kecamatan Tanjung Emas, Kabupaten Tanah Datar, Sumatera Barat.

---

## 🎓 Tim Pengembang & Kredit

- **Pengembang Web Utama (Lead Developer)**: **Muhammad Rafi Asytar** (NIM: 2311522030)
- **Tim Pengembang**: Tim KKN Universitas Andalas Reguler Periode 2 Tahun 2026
- **Mitra Pemerintahan**: Pemerintahan Nagari Tabek Patah, Kabupaten Tanah Datar
- **Tahun Rilis**: 2026 (Versi 1.0.0)

---

## 📁 Struktur Monorepo

```
SIKATO/
├── client/                 # Frontend Web App (React 19 + Vite + Leaflet GIS)
│   ├── src/                # Component, Pages, Utilities, GIS Data
│   ├── public/             # Static Assets (Logos & Favicons)
│   ├── package.json
│   └── vite.config.js
├── server/                 # Backend API Server (Node.js + Express + PostgreSQL)
│   ├── src/                # Controllers, Routes, DB Pool, Utils
│   ├── scripts/            # Database Maintenance & Audit Scripts
│   ├── sql/                # SQL Schema Migration Scripts
│   └── package.json
├── .gitignore              # Ignored files (node_modules, .env, *.csv, dist)
├── package.json            # Root monorepo configuration & runner scripts
└── README.md               # Dokumentasi utama proyek SIKATO
```

---

## 📋 Prasyarat Sistem (*System Requirements*)

Sebelum menjalankan proyek ini di komputer lokal, pastikan aplikasi berikut telah ter-instal:

1. **[Node.js](https://nodejs.org)** (v18.x atau v20.x LTS)
2. **[PostgreSQL](https://www.postgresql.org)** (v14.x atau lebih baru)
3. **[Git](https://git-scm.com)**
4. **[Visual Studio Code](https://code.visualstudio.com)** (Code Editor disarankan)

---

## 🚀 Panduan Memulai (*Quick Start Guide*)

### 1. Clone Repository
```bash
git clone <URL-REPOSITORY-GITHUB-ANDA>
cd SIKATO
```

### 2. Instalasi Dependensi Monorepo
Jalankan perintah ini di root folder `SIKATO` untuk menginstal dependensi Client & Server sekaligus:

```bash
npm run install:all
```

### 3. Buat Database di PostgreSQL
Buka **pgAdmin** atau **psql**, lalu jalankan query berikut:

```sql
CREATE DATABASE sikato_db;
```

### 4. Konfigurasi Environment (`server/.env`)
Buat file bernama `.env` di dalam folder `server/` (lokasi: `SIKATO/server/.env`), lalu isi dengan konfigurasi PostgreSQL Anda:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sikato_db
DB_USER=postgres
DB_PASSWORD=masukkan_password_postgresql_anda
JWT_SECRET=sikato_secret_key_2026
```

### 5. Inisialisasi Skema Database (Opsional)
Backend SIKATO otomatis membuat tabel saat pertama kali dinyalakan. Namun jika ingin menjalankan skema SQL secara manual:

```bash
psql -U postgres -d sikato_db -f server/sql_schema_bulan7.sql
```

### 6. Menjalankan Aplikasi SIKATO

```bash
# Jalankan Frontend & Backend sekaligus
npm run dev

# Atau jalankan salah satu modul saja:
npm run dev:client   # Frontend di http://localhost:5173
npm run dev:server   # Backend API di http://localhost:5000
```

---

## 🔑 Akses Default Admin

- **Username**: `admin`
- **Password**: `admin123` *(Dapat diubah via menu Kelola Akun Admin)*

---

## 🛠️ Teknologi Yang Digunakan

- **Frontend**: React 19, Vite, Leaflet GIS, Lucide Icons, Custom CSS3 Design System.
- **Backend**: Node.js, Express.js, PostgreSQL (`pg` driver), JWT Authentication, Bcrypt.
- **Data Spasial GIS**: GeoJSON Layers (Batas Jorong, Fasilitas Kesehatan, Sekolah, Rumah Ibadah, Jalur Evakuasi Bencana).

---

© 2026 **Pemerintahan Nagari Tabek Patah** & **Muhammad Rafi Asytar** (KKN Universitas Andalas Reguler Periode 2 Tahun 2026). All rights reserved.
