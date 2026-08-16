import { pool } from '../src/db.js';

async function check() {
  const res = await pool.query(`
    SELECT berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah as val, COUNT(*) as cnt
    FROM sensus_keluarga
    GROUP BY berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah
    ORDER BY COUNT(*) DESC
    LIMIT 40
  `);
  console.log('Total unique expense strings:', res.rows.length);
  console.log(res.rows);
  pool.end();
}

check();
