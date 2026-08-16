import { pool } from '../src/db.js';

async function checkUmkmBidang() {
  const res = await pool.query(`
    SELECT jika_punya_apa_nama_usahanya_dan_dibidang_apa, COUNT(*) 
    FROM sensus_keluarga 
    WHERE jika_punya_apa_nama_usahanya_dan_dibidang_apa IS NOT NULL AND jika_punya_apa_nama_usahanya_dan_dibidang_apa != '-' AND jika_punya_apa_nama_usahanya_dan_dibidang_apa != ''
    GROUP BY jika_punya_apa_nama_usahanya_dan_dibidang_apa
    ORDER BY COUNT(*) DESC
    LIMIT 25
  `);
  console.log('=== BIDANG / NAMA USAHA UMKM ===');
  console.log(res.rows);

  const nibRes = await pool.query(`
    SELECT permasalahan_nomor_induk_berusaha_nib_dan_sertifikat_halal_pada_umkm, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY permasalahan_nomor_induk_berusaha_nib_dan_sertifikat_halal_pada_umkm
    ORDER BY COUNT(*) DESC
  `);
  console.log('\n=== PERMASALAHAN NIB & HALAL ===');
  console.log(nibRes.rows);

  pool.end();
}

checkUmkmBidang();
