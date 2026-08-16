import fs from 'fs';
import { pool } from '../src/db.js';

const content = fs.readFileSync('D:/project web/real_sensus.csv', 'utf8');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let inQuotes = false;
  let field = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++; }
      else { inQuotes = !inQuotes; }
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

async function fixLokasiUsahaDb() {
  const rows = parseCsv(content);
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const kkIdx = headers.findIndex(h => h.toLowerCase().includes('nomor kk'));
  const namaIdx = headers.findIndex(h => h.toLowerCase().includes('nama kepala keluarga'));
  const lokasiIdx = headers.findIndex(h => h.toLowerCase() === 'lokasi usaha');

  console.log(`Matching by KK (col ${kkIdx}) and Nama (col ${namaIdx}) to update lokasi_usaha (col ${lokasiIdx})...`);

  // First, set any toilet/sanitation values in lokasi_usaha to '-' or NULL
  await pool.query(`
    UPDATE sensus_keluarga 
    SET lokasi_usaha = '-' 
    WHERE lokasi_usaha ILIKE '%LEHER ANGSA%' 
       OR lokasi_usaha ILIKE '%JONGKOK%' 
       OR lokasi_usaha ILIKE '%DUDUK%' 
       OR lokasi_usaha ILIKE '%CEMPLUNG%'
  `);

  let updatedCount = 0;
  for (const r of dataRows) {
    const kk = String(r[kkIdx] || '').trim();
    const nama = String(r[namaIdx] || '').trim();
    const loc = String(r[lokasiIdx] || '').trim();

    if (loc && loc !== '-' && loc !== 'LEHER ANGSA (JONGKOK)' && loc !== 'DUDUK') {
      const res = await pool.query(`
        UPDATE sensus_keluarga
        SET lokasi_usaha = $1
        WHERE nomor_kk = $2 OR nama_kepala_keluarga ILIKE $3
      `, [loc, kk, nama]);
      if (res.rowCount > 0) updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} families with accurate lokasi_usaha!`);

  const check = await pool.query(`
    SELECT lokasi_usaha, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY lokasi_usaha 
    ORDER BY COUNT(*) DESC
    LIMIT 20
  `);
  console.log('=== DATA LOKASI USAHA TERKINI DI DATABASE ===');
  console.log(check.rows);

  pool.end();
}

fixLokasiUsahaDb();
