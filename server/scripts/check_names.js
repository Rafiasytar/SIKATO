import { pool } from '../src/db.js';

async function check() {
  const count = await pool.query('SELECT COUNT(*) FROM sensus_keluarga');
  console.log('Current sensus_keluarga count:', count.rows[0].count);
  const names = ['JAMALUS', 'NIBUS', 'BUKHARI', 'INDRA', 'HERMAN'];
  for (const n of names) {
    const res = await pool.query('SELECT id, nomor_kk, nama_kepala_keluarga FROM sensus_keluarga WHERE UPPER(nama_kepala_keluarga) LIKE $1', ['%' + n + '%']);
    console.log(`Query for ${n}:`, res.rows);
  }
  pool.end();
}

check();
