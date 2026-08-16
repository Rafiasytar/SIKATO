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

const qrisIdx = headers.findIndex(h => h.toLowerCase().includes('mengetahui metode pembayaran qris'));
const qrisInginIdx = headers.findIndex(h => h.toLowerCase().includes('ingin membuat qris'));
const umkmIdx = headers.findIndex(h => h.toLowerCase().includes('mempunyai umkm'));

console.log('Headers found:');
console.log(`- UMKM Index: ${umkmIdx} (${headers[umkmIdx]})`);
console.log(`- QRIS Tahu Index: ${qrisIdx} (${headers[qrisIdx]})`);
console.log(`- QRIS Ingin Index: ${qrisInginIdx} (${headers[qrisInginIdx]})`);

let totalUmkm = 0;
let qrisTahuAll = 0;
let qrisInginAll = 0;
let umkmTahuQris = 0;
let umkmInginQris = 0;

dataRows.forEach(r => {
  const umkm = String(r[umkmIdx] || '').toUpperCase().trim();
  const qris = String(r[qrisIdx] || '').toUpperCase().trim();
  const ingin = String(r[qrisInginIdx] || '').toUpperCase().trim();

  const isUmkm = umkm === 'YA' || umkm === 'PUNYA' || umkm === '1';
  const isTahu = qris === 'SUDAH' || qris === 'YA' || qris === 'TAHU';
  const isIngin = ingin === 'YA' || ingin === 'INGIN' || ingin === 'MAU';

  if (isUmkm) totalUmkm++;
  if (isTahu) qrisTahuAll++;
  if (isIngin) qrisInginAll++;
  if (isUmkm && isTahu) umkmTahuQris++;
  if (isUmkm && isIngin) umkmInginQris++;
});

console.log('\n=== STATISTIK ASLI DARI FILE SURVEI CSV ===');
console.log(`Total KK Pemilik UMKM di Nagari: ${totalUmkm} KK`);
console.log(`Total Seluruh Warga yang Tahu QRIS: ${qrisTahuAll} KK`);
console.log(`Total Seluruh Warga yang Ingin QRIS: ${qrisInginAll} KK`);
console.log(`\nKhusus Pelaku UMKM:`);
console.log(`- Pelaku UMKM yang SUDAH Tahu QRIS: ${umkmTahuQris} dari ${totalUmkm} UMKM (${totalUmkm ? Math.round((umkmTahuQris/totalUmkm)*100) : 0}%)`);
console.log(`- Pelaku UMKM yang INGIN Membuat QRIS: ${umkmInginQris} dari ${totalUmkm} UMKM (${totalUmkm ? Math.round((umkmInginQris/totalUmkm)*100) : 0}%)`);
