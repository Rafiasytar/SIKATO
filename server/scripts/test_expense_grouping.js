import { pool } from '../src/db.js';

function parseExpenseToNumber(str) {
  if (!str) return 0;
  const s = String(str).trim().toUpperCase();
  if (s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK TENTU' || s === 'BELUM ADA') return 0;
  
  if (s.includes('JUTA') || s.includes('JT')) {
    const num = parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      if (num < 100) return num * 1000000;
    }
  }

  const digitsOnly = s.replace(/[^0-9]/g, '');
  const val = parseInt(digitsOnly, 10);
  if (isNaN(val) || val <= 0) return 0;

  if (val < 100) return val * 1000000;
  return val;
}

function categorizeExpense(val) {
  const num = parseExpenseToNumber(val);
  if (num <= 0) return 'Tidak Terdata / Kosong';
  if (num < 1000000) return '< Rp 1 Juta';
  if (num <= 2000000) return 'Rp 1 - 2 Juta';
  if (num <= 3000000) return 'Rp 2 - 3 Juta';
  if (num <= 5000000) return 'Rp 3 - 5 Juta';
  return '> Rp 5 Juta';
}

async function test() {
  const res = await pool.query('SELECT berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah FROM sensus_keluarga');
  const counts = {
    '< Rp 1 Juta': 0,
    'Rp 1 - 2 Juta': 0,
    'Rp 2 - 3 Juta': 0,
    'Rp 3 - 5 Juta': 0,
    '> Rp 5 Juta': 0,
    'Tidak Terdata / Kosong': 0
  };

  res.rows.forEach(r => {
    const cat = categorizeExpense(r.berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah);
    counts[cat] = (counts[cat] || 0) + 1;
  });

  console.log('Grouped Expense Breakdown for 594 KKs:', counts);
  pool.end();
}

test();
