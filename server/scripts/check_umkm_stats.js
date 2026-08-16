import { pool } from '../src/db.js';

async function checkUmkmStats() {
  const res = await pool.query(`
    SELECT 
      id, 
      nama_kepala_keluarga, 
      apakah_mempunyai_umkm, 
      jika_punya_apa_nama_usahanya_dan_dibidang_apa,
      apakah_lokasi_usahanya_sudah_ada_di_google_maps,
      apakah_sudah_mengetahui_metode_pembayaran_qris,
      apakah_ingin_membuat_qris_di_usahanya
    FROM sensus_keluarga
  `);

  let totalKk = res.rows.length;
  let umkmRows = [];

  res.rows.forEach(r => {
    const umkmAns = String(r.apakah_mempunyai_umkm || '').toUpperCase().trim();
    const hasName = r.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '';
    if (umkmAns === 'YA' || umkmAns === 'PUNYA' || umkmAns === 'PERNAH' || hasName) {
      umkmRows.push(r);
    }
  });

  console.log(`Total KK: ${totalKk}`);
  console.log(`Total Pelaku UMKM teridentifikasi: ${umkmRows.length} KK`);

  let tahuQris = 0;
  let inginQris = 0;
  let mapsAda = 0;

  umkmRows.forEach(r => {
    const qris = String(r.apakah_sudah_mengetahui_metode_pembayaran_qris || '').toUpperCase().trim();
    const ingin = String(r.apakah_ingin_membuat_qris_di_usahanya || '').toUpperCase().trim();
    const maps = String(r.apakah_lokasi_usahanya_sudah_ada_di_google_maps || '').toUpperCase().trim();

    if (qris === 'SUDAH' || qris === 'YA' || qris === 'TAHU') tahuQris++;
    if (ingin === 'YA' || ingin === 'INGIN' || ingin === 'MAU') inginQris++;
    if (maps === 'SUDAH' || maps === 'YA' || maps === 'ADA') mapsAda++;
  });

  console.log(`Pelaku UMKM yang SUDAH TAHU QRIS: ${tahuQris} / ${umkmRows.length} (${Math.round(tahuQris/umkmRows.length*100)}%)`);
  console.log(`Pelaku UMKM yang INGIN BUAT QRIS: ${inginQris} / ${umkmRows.length} (${Math.round(inginQris/umkmRows.length*100)}%)`);
  console.log(`Pelaku UMKM yang LOKASINYA ADA DI GOOGLE MAPS: ${mapsAda} / ${umkmRows.length} (${Math.round(mapsAda/umkmRows.length*100)}%)`);

  pool.end();
}

checkUmkmStats();
