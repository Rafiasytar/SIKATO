import { pool } from '../src/db.js';

async function checkQris() {
  const umkmRes = await pool.query(`
    SELECT apakah_mempunyai_umkm, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY apakah_mempunyai_umkm
  `);
  console.log('=== APAKAH MEMPUNYAI UMKM ===');
  console.log(umkmRes.rows);

  const qrisTahuRes = await pool.query(`
    SELECT apakah_sudah_mengetahui_metode_pembayaran_qris, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY apakah_sudah_mengetahui_metode_pembayaran_qris
  `);
  console.log('\n=== APAKAH TAHU QRIS (SEMUA KK) ===');
  console.log(qrisTahuRes.rows);

  const qrisInginRes = await pool.query(`
    SELECT apakah_ingin_membuat_qris_di_usahanya, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY apakah_ingin_membuat_qris_di_usahanya
  `);
  console.log('\n=== APAKAH INGIN BUAT QRIS (SEMUA KK) ===');
  console.log(qrisInginRes.rows);

  const crossRes = await pool.query(`
    SELECT 
      apakah_mempunyai_umkm,
      apakah_sudah_mengetahui_metode_pembayaran_qris,
      apakah_ingin_membuat_qris_di_usahanya,
      COUNT(*)
    FROM sensus_keluarga
    WHERE apakah_mempunyai_umkm ILIKE '%ya%' OR apakah_mempunyai_umkm ILIKE '%punya%' OR apakah_mempunyai_umkm = '1'
    GROUP BY apakah_mempunyai_umkm, apakah_sudah_mengetahui_metode_pembayaran_qris, apakah_ingin_membuat_qris_di_usahanya
  `);
  console.log('\n=== KHUSUS PELAKU UMKM: TAHU & INGIN BUAT QRIS ===');
  console.log(crossRes.rows);

  pool.end();
}

checkQris();
