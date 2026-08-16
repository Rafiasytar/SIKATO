import { pool } from '../src/db.js';

async function analyze() {
  const count = await pool.query('SELECT COUNT(*) FROM sensus_keluarga');
  console.log('Total count in sensus_keluarga:', count.rows[0].count);

  const distinctKk = await pool.query('SELECT COUNT(DISTINCT nomor_kk) FROM sensus_keluarga WHERE nomor_kk IS NOT NULL AND nomor_kk != \'\'');
  console.log('Distinct non-empty Nomor KK count:', distinctKk.rows[0].count);

  const emptyKk = await pool.query('SELECT COUNT(*) FROM sensus_keluarga WHERE nomor_kk IS NULL OR nomor_kk = \'\'');
  console.log('Empty Nomor KK count:', emptyKk.rows[0].count);

  pool.end();
}

analyze();
