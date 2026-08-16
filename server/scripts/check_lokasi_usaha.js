import { pool } from '../src/db.js';

async function checkLokasiUsaha() {
  const res = await pool.query(`
    SELECT lokasi_usaha, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY lokasi_usaha 
    ORDER BY COUNT(*) DESC
    LIMIT 30
  `);
  console.log('=== NILAI KOLOM lokasi_usaha DI DATABASE ===');
  console.log(res.rows);

  const klosetRes = await pool.query(`
    SELECT jenis_kloset, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY jenis_kloset 
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  console.log('\n=== NILAI KOLOM jenis_kloset DI DATABASE ===');
  console.log(klosetRes.rows);

  pool.end();
}

checkLokasiUsaha();
