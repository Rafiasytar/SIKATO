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

headers.forEach((h, i) => {
  if (h.toLowerCase().includes('kendala') || h.toLowerCase().includes('aset') || h.toLowerCase().includes('permasalahan')) {
    console.log(`Col ${i}: "${h}"`);
    const sample = dataRows.slice(0, 10).map(r => r[i]).filter(Boolean);
    console.log('Sample values:', sample.slice(0, 5));
  }
});
