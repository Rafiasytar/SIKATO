import { pool } from '../src/db.js';

async function checkHousing() {
  const res1 = await pool.query(`
    SELECT status_tanah_bangunan_tempat_tinggal_yang_ditempati, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY status_tanah_bangunan_tempat_tinggal_yang_ditempati 
    ORDER BY COUNT(*) DESC
  `);
  console.log('=== STATUS TANAH BANGUNAN TEMPAT TINGGAL (594 KK) ===');
  console.log(res1.rows);

  const res2 = await pool.query(`
    SELECT tempat_tinggal_yang_ditempati, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY tempat_tinggal_yang_ditempati 
    ORDER BY COUNT(*) DESC
  `);
  console.log('\n=== TEMPAT TINGGAL YANG DITEMPATI (594 KK) ===');
  console.log(res2.rows);

  pool.end();
}

checkHousing();
