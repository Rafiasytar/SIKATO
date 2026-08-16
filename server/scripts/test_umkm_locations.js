import { pool } from '../src/db.js';

function categorizeUmkmLocation(str, umkm) {
  const isUmkm = umkm === 'YA' || umkm === 'PUNYA' || umkm === 'PERNAH' || umkm === '1';
  if (!str || str === '-' || str === 'TIDAK ADA' || str === 'TIDAK' || str === '0') {
    return isUmkm ? 'Keliling / Belum Lokasi Tetap' : 'Bukan Pelaku Usaha';
  }

  const s = String(str).toUpperCase().trim();
  if (s.includes('LEHER ANGSA') || s.includes('JONGKOK') || s.includes('DUDUK') || s.includes('CEMPLUNG')) {
    return isUmkm ? 'Keliling / Belum Lokasi Tetap' : 'Bukan Pelaku Usaha';
  }

  if (s.includes('RUMAH') || s.includes('DEPAN RUMAH') || s.includes('DIRUMAH') || s.includes('DEKAT RUMAH')) {
    return 'Di Rumah / Halaman Sendiri';
  }
  if (s.includes('PASAR')) {
    return 'Pasar Nagari / Pasar Tradisional';
  }
  if (s.includes('KEBUN') || s.includes('LADANG') || s.includes('RIMBO') || s.includes('SAWAH')) {
    return 'Lahan Pertanian / Ladang / Kebun';
  }
  if (s.includes('SEKOLAH') || s.includes('SDN') || s.includes('MASJID') || s.includes('SURAU') || s.includes('MUSHOLA') || s.includes('CAMAT') || s.includes('POS')) {
    return 'Fasilitas Umum / Sekitar Sekolah & Masjid';
  }
  if (s.includes('PEKANBARU') || s.includes('TANJUNG BARU') || s.includes('SUMANIAK') || s.includes('BARULAK') || s.includes('LUAR')) {
    return 'Luar Nagari / Luar Daerah';
  }
  if (s.includes('KOTO ALAM') || s.includes('JORONG DATA') || s.includes('JORONG KOTO') || s.includes('TABEK PATAH') || s.includes('KOTO GADIANG') || s.includes('LUBUAK') || s.includes('SIMPANG') || s.includes('KEDAI')) {
    return 'Kios / Warung di Jorong Nagari';
  }

  return isUmkm ? 'Kios / Warung di Jorong Nagari' : 'Bukan Pelaku Usaha';
}

async function testLocations() {
  const res = await pool.query('SELECT lokasi_usaha, apakah_mempunyai_umkm, jika_punya_apa_nama_usahanya_dan_dibidang_apa FROM sensus_keluarga');
  
  const umkmLocations = {};
  let totalUmkm = 0;

  res.rows.forEach(r => {
    const isUmkm = r.apakah_mempunyai_umkm === 'YA' || r.apakah_mempunyai_umkm === 'PUNYA' || r.apakah_mempunyai_umkm === 'PERNAH' || (r.jika_punya_apa_nama_usahanya_dan_dibidang_apa && r.jika_punya_apa_nama_usahanya_dan_dibidang_apa.trim() !== '-' && r.jika_punya_apa_nama_usahanya_dan_dibidang_apa.trim() !== '');
    if (isUmkm) {
      totalUmkm++;
      const cat = categorizeUmkmLocation(r.lokasi_usaha, 'YA');
      umkmLocations[cat] = (umkmLocations[cat] || 0) + 1;
    }
  });

  console.log(`=== DISTRIBUSI LOKASI USAHA KHUSUS ${totalUmkm} PELAKU UMKM ===`);
  console.log(umkmLocations);
  pool.end();
}

testLocations();
