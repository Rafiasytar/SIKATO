import { pool } from '../src/db.js';

async function listCols() {
  const kCols = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'sensus_keluarga' 
    ORDER BY ordinal_position
  `);
  console.log('=== KOLOM sensus_keluarga (' + kCols.rows.length + ' kolom) ===');
  kCols.rows.forEach((r, i) => console.log(`${i+1}. ${r.column_name}`));

  const iCols = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'sensus_individu' 
    ORDER BY ordinal_position
  `);
  console.log('\n=== KOLOM sensus_individu (' + iCols.rows.length + ' kolom) ===');
  iCols.rows.forEach((r, i) => console.log(`${i+1}. ${r.column_name}`));

  pool.end();
}

listCols();
