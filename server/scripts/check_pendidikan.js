import { pool } from '../src/db.js';

async function checkPendidikan() {
  const res = await pool.query(`
    SELECT pendidikan_terakhir, COUNT(*) 
    FROM sensus_individu 
    GROUP BY pendidikan_terakhir 
    ORDER BY COUNT(*) DESC
  `);
  console.log('=== PENDIDIKAN TERAKHIR WARGA (1.991 Individu) ===');
  console.log(res.rows);
  pool.end();
}

checkPendidikan();
