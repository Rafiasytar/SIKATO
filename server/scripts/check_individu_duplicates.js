import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  console.log('=== PENGECEKAN DATA SENSUS INDIVIDU DI DATABASE POSTGRESQL ===');
  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM sensus_individu');
    console.log(`Total Data Individu di Database: ${countRes.rows[0].count}`);

    // 1. Cek NIK ganda di tabel sensus_individu
    const res = await pool.query(`
      SELECT nomor_nik, COUNT(*) as total, array_agg(id) as ids, array_agg(nama) as names, array_agg(nomor_kk) as kks
      FROM sensus_individu
      WHERE nomor_nik IS NOT NULL AND nomor_nik != ''
      GROUP BY nomor_nik
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `);
    console.log(`\nJumlah NIK Duplikat di Database: ${res.rows.length}`);
    res.rows.forEach((r, i) => {
      console.log(`${i + 1}. NIK: "${r.nomor_nik}" (${r.total} baris) -> Nama: [${r.names.join(', ')}], No. KK: [${r.kks.join(', ')}]`);
    });

    // 2. Cek format Scientific / Rusak (E+, E-) di tabel sensus_individu
    const sciRes = await pool.query(`
      SELECT id, nomor_nik, nomor_kk, nama
      FROM sensus_individu
      WHERE nomor_nik ILIKE '%E+%' OR nomor_nik ILIKE '%E-%' OR nomor_kk ILIKE '%E+%'
    `);
    console.log(`\nJumlah Baris dengan Format Ilmiah (E+) di Database: ${sciRes.rows.length}`);
    sciRes.rows.forEach((r, i) => {
      console.log(`${i + 1}. ID: ${r.id} | Nama: "${r.nama}" | NIK: "${r.nomor_nik}" | KK: "${r.nomor_kk}"`);
    });

  } catch (err) {
    console.log('Database query error:', err.message);
  } finally {
    pool.end();
  }
}

main();
