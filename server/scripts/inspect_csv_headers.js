import fs from 'fs';

const content = fs.readFileSync('D:/project web/real_sensus.csv', 'utf8');

function parseCsvHeader(text) {
  let inQuotes = false;
  let field = '';
  let fields = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') { field += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (c === ',' && !inQuotes) {
      fields.push(field.trim());
      field = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      fields.push(field.trim());
      break;
    } else {
      field += c;
    }
  }
  return fields;
}

const headers = parseCsvHeader(content);
console.log('Total CSV Headers:', headers.length);
headers.forEach((h, idx) => {
  console.log(`${idx}. "${h}"`);
});
