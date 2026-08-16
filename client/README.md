# Frontend BI Tabek Patah

Frontend React + Vite untuk dashboard BI Tabek Patah.

## Fungsi

- Upload Excel/CSV respons Google Form.
- Parse data mengikuti table schema fixed.
- Menampilkan preview data dan visualisasi dummy/hasil upload.
- Menampilkan halaman peta spasial dari tabel PostGIS.
- Mengirim data ke backend lewat `POST /api/sensus/import`.

## Menjalankan

```bash
npm install
npm run dev
```

Jika backend berjalan di `http://localhost:5000`, request `/api` akan diteruskan lewat proxy Vite.

## Build

```bash
npm run build
```

## Struktur Penting

- `src/pages/DashboardPage.jsx` halaman utama.
- `src/pages/SpatialMapPage.jsx` halaman peta data spasial.
- `src/data/tableSchema.js` schema fixed frontend.
- `src/data/sampleResponses.js` data dummy visualisasi.
- `src/services/api.js` komunikasi ke backend.
- `src/utils/fileParser.js` parser Excel/CSV.
