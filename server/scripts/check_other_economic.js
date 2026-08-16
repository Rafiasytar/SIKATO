import { pool } from '../src/db.js';

async function checkOtherEconomicColumns() {
  const bidangRes = await pool.query(`
    SELECT jumlah_kepemilikan_bidang_tanah, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY jumlah_kepemilikan_bidang_tanah 
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  console.log('=== JUMLAH KEPEMILIKAN BIDANG TANAH ===');
  console.log(bidangRes.rows);

  const sawahRes = await pool.query(`
    SELECT luas_sawah, COUNT(*) 
    FROM sensus_keluarga 
    WHERE luas_sawah IS NOT NULL AND luas_sawah != '-' AND luas_sawah != '0'
    GROUP BY luas_sawah 
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  console.log('\n=== KEPEMILIKAN LUAS SAWAH ===');
  console.log(sawahRes.rows);

  const omsetRes = await pool.query(`
    SELECT perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan, COUNT(*) 
    FROM sensus_keluarga 
    WHERE perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan IS NOT NULL AND perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan != '-'
    GROUP BY perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan 
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  console.log('\n=== OMSET PENDAPATAN BULANAN UMKM ===');
  console.log(omsetRes.rows);

  pool.end();
}

checkOtherEconomicColumns();
