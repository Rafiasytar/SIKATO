import fs from 'fs';

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

const rows = parseCsv(content);
const headers = rows[0];
const dataRows = rows.slice(1);

const umkmIdx = headers.findIndex(h => h.toLowerCase().includes('mempunyai umkm'));
const lokasiIdx = headers.findIndex(h => h.toLowerCase() === 'lokasi usaha');
const klosetIdx = headers.findIndex(h => h.toLowerCase().includes('jenis kloset'));

console.log('Headers:');
console.log(`- Col ${umkmIdx}: ${headers[umkmIdx]}`);
console.log(`- Col ${lokasiIdx}: ${headers[lokasiIdx]}`);
console.log(`- Col ${klosetIdx}: ${headers[klosetIdx]}`);

const lokasiCounts = {};
dataRows.forEach(r => {
  const umkm = String(r[umkmIdx] || '').toUpperCase().trim();
  const loc = String(r[lokasiIdx] || '').trim();
  if (loc) {
    lokasiCounts[loc] = (lokasiCounts[loc] || 0) + 1;
  }
});

console.log('\n=== NILAI LOKASI USAHA ASLI DARI CSV (Col 43) ===');
console.log(lokasiCounts);
