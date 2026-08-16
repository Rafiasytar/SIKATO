import pg from 'pg';
import fs from 'fs';
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
  console.log('=== 1. PENGECEKAN DUPLIKAT DI DATABASE POSTGRESQL ===');
  try {
    const res = await pool.query(`
      SELECT nomor_kk, COUNT(*) as total, array_agg(id) as ids, array_agg(nama_kepala_keluarga) as names
      FROM sensus_keluarga
      WHERE nomor_kk IS NOT NULL AND nomor_kk != ''
      GROUP BY nomor_kk
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `);
    console.log(`Jumlah Nomor KK Duplikat di Database: ${res.rows.length}`);
    res.rows.forEach((r, i) => {
      console.log(`${i + 1}. No KK: "${r.nomor_kk}" (${r.total} baris) -> ID: [${r.ids.join(', ')}], Nama: [${r.names.join(', ')}]`);
    });

    const allRes = await pool.query('SELECT COUNT(*) FROM sensus_keluarga');
    console.log(`Total Semua Baris di Database saat ini: ${allRes.rows[0].count}`);
  } catch (err) {
    console.log('Database query error:', err.message);
  } finally {
    pool.end();
  }

  console.log('\n=== 2. PENGECEKAN DUPLIKAT DI FILE CSV ASAL (real_sensus.csv) ===');
  try {
    const csvPath = 'D:/project web/real_sensus.csv';
    if (!fs.existsSync(csvPath)) {
      console.log('File real_sensus.csv tidak ditemukan.');
      return;
    }
    const content = fs.readFileSync(csvPath, 'utf8');
    function parseCsv(text) {
      const rows = [];
      let row = [];
      let inQuotes = false;
      let field = '';
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(field);
          field = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(field);
          field = '';
          if (row.some(x => x.trim())) rows.push(row);
          row = [];
        } else {
          field += c;
        }
      }
      if (field || row.length) {
        row.push(field);
        if (row.some(x => x.trim())) rows.push(row);
      }
      return rows;
    }

    const rows = parseCsv(content);
    const dataRows = rows.slice(1);
    const kkMap = new Map();

    dataRows.forEach((r, idx) => {
      const kk = String(r[2] || '').trim();
      const name = String(r[3] || '').trim();
      const responden = String(r[61] || r[3] || '').trim();
      const jorong = String(r[56] || r[46] || '').trim();
      const lineNum = idx + 2;
      if (kk) {
        if (!kkMap.has(kk)) kkMap.set(kk, []);
        kkMap.get(kk).push({ lineNum, name, responden, jorong });
      }
    });

    const dups = [...kkMap.entries()].filter(([k, v]) => v.length > 1);
    console.log(`Jumlah Nomor KK Ganda di dalam CSV: ${dups.length}`);
    dups.forEach(([kk, items], i) => {
      console.log(`\n${i + 1}. NOMOR KK: "${kk}" (Muncul ${items.length} kali)`);
      items.forEach(it => {
        console.log(`   - Baris ke-${it.lineNum} di file -> Nama Kepala KK: "${it.name}"`);
      });
    });
  } catch (err) {
    console.log('CSV parse error:', err.message);
  }
}

main();
