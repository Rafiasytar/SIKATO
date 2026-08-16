import { pool } from '../src/db.js';

async function checkColumns() {
  const kendalaRes = await pool.query(`
    SELECT kendala_utama_usaha, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY kendala_utama_usaha 
    ORDER BY COUNT(*) DESC
    LIMIT 20
  `);
  console.log('=== NILAI KOLOM kendala_utama_usaha DI DATABASE ===');
  console.log(kendalaRes.rows);

  const asetRes = await pool.query(`
    SELECT kepemilikin_aset, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY kepemilikin_aset 
    ORDER BY COUNT(*) DESC
    LIMIT 20
  `);
  console.log('\n=== NILAI KOLOM kepemilikin_aset DI DATABASE ===');
  console.log(asetRes.rows);

  pool.end();
}

checkColumns();
