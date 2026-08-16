import { pool } from '../src/db.js';

async function testAssetBreakdown() {
  const res = await pool.query('SELECT kepemilikin_aset FROM sensus_keluarga');
  const assetCounts = {
    'Handphone (HP)': 0,
    'Sepeda Motor': 0,
    'Televisi (TV)': 0,
    'Kulkas / Lemari Es': 0,
    'Sepeda': 0,
    'Mobil': 0,
    'Emas / Perhiasan': 0,
    'Tidak Memiliki Aset Terdaftar': 0
  };

  res.rows.forEach(r => {
    const s = String(r.kepemilikin_aset || '').toUpperCase();
    if (!s || s === '-' || s === 'TIDAK ADA' || s === '0') {
      assetCounts['Tidak Memiliki Aset Terdaftar']++;
      return;
    }
    if (s.includes('HP') || s.includes('HANDPHONE') || s.includes('SMARTPHONE')) assetCounts['Handphone (HP)']++;
    if (s.includes('MOTOR')) assetCounts['Sepeda Motor']++;
    if (s.includes('TV') || s.includes('TELEVISI')) assetCounts['Televisi (TV)']++;
    if (s.includes('KULKAS') || s.includes('LEMARI ES')) assetCounts['Kulkas / Lemari Es']++;
    if (s.includes('SEPEDA') && !s.includes('SEPEDA MOTOR')) assetCounts['Sepeda']++;
    if (s.includes('MOBIL')) assetCounts['Mobil']++;
    if (s.includes('EMAS')) assetCounts['Emas / Perhiasan']++;
  });

  console.log('=== RINGKASAN KEPEMILIKAN ASET KELUARGA (594 KK) ===');
  console.log(assetCounts);
  pool.end();
}

testAssetBreakdown();
