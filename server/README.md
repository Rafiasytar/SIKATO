# Backend BI Tabek Patah

Backend Node.js + Express untuk menerima data dari frontend dan menyimpan ke PostgreSQL/PostGIS.

## Fungsi

- `GET /api/health` cek server backend.
- `GET /api/sensus` ambil data dari PostgreSQL.
- `POST /api/sensus/import` simpan banyak baris data sensus.
- `GET /api/spatial/layers` ambil daftar tabel spasial dari PostGIS.
- `GET /api/spatial/:layer` ambil layer PostGIS sebagai GeoJSON.

## Menjalankan

```bash
npm install
npm run dev
```

Backend default berjalan di `http://localhost:5000`.

## Setup Database

1. Buat database PostgreSQL, misalnya `bi_tabek_patah`.
2. Jalankan file SQL:

```bash
psql -U postgres -d bi_tabek_patah -f sql/001_create_sensus_keluarga.sql
```

3. Copy `.env.example` menjadi `.env`.
4. Ubah `DATABASE_URL`.

Contoh:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/bi_tabek_patah
```

## Struktur Penting

- `src/server.js` entry server Express.
- `src/db.js` koneksi PostgreSQL.
- `src/routes/sensus.js` route API data sensus.
- `src/routes/spatial.js` route API data spasial GeoJSON.
- `src/schema.js` daftar kolom fixed.
- `sql/001_create_sensus_keluarga.sql` schema PostgreSQL + PostGIS.

## Import Data Spasial

File spasial dari folder `D:\data\data spasial` bisa diimport dengan script:

```powershell
.\scripts\import-spatial.ps1 -Database bi_tabek_patah -User postgres
```

Script akan meminta password PostgreSQL sekali saja.

Kalau ingin langsung menulis password di command:

```powershell
.\scripts\import-spatial.ps1 -Database bi_tabek_patah -User postgres -Password "password_kamu"
```

Kalau port, host, atau SRID berbeda:

```powershell
.\scripts\import-spatial.ps1 -Database bi_tabek_patah -User postgres -HostName localhost -Port 5432 -Srid 4326
```

Script ini akan:

- mengaktifkan PostGIS,
- import semua `.shp`,
- mencoba ekstrak semua `.mpk` memakai 7-Zip,
- import `.shp` yang ditemukan dari hasil ekstrak `.mpk`,
- membuat spatial index otomatis.
