import { pool } from '../src/db.js';

function categorizeEducation(str) {
  if (!str) return 'Belum / Tidak Sekolah';
  const s = String(str).toUpperCase().trim();
  if (s === '-' || s === 'TIDAK DIISI' || s === '0') return 'Belum / Tidak Sekolah';

  if (s.includes('S3') || s.includes('S2') || s.includes('S1') || s.includes('DIPLOMA') || s.includes('D1') || s.includes('D2') || s.includes('D3') || s.includes('D4') || s.includes('KULIAH') || s.includes('SARJANA') || s.includes('MAGISTER')) {
    return 'Perguruan Tinggi (D3/S1/S2)';
  }
  if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA') || s.includes('ALIYAH') || s.includes('PAKET C')) {
    return 'SMA / SMK / Sederajat';
  }
  if (s.includes('SMP') || s.includes('MTS') || s.includes('SLTP') || s.includes('PAKET B')) {
    return 'SMP / MTs / Sederajat';
  }
  if (s.includes('SD') || s.includes('IBTIDAIYAH') || s.includes('PAKET A')) {
    return 'SD / Sederajat';
  }
  return 'Belum / Tidak Sekolah';
}

async function testEducation() {
  const res = await pool.query('SELECT pendidikan_terakhir FROM sensus_individu');
  const counts = {
    'SD / Sederajat': 0,
    'SMA / SMK / Sederajat': 0,
    'SMP / MTs / Sederajat': 0,
    'Belum / Tidak Sekolah': 0,
    'Perguruan Tinggi (D3/S1/S2)': 0
  };

  res.rows.forEach(r => {
    const cat = categorizeEducation(r.pendidikan_terakhir);
    counts[cat] = (counts[cat] || 0) + 1;
  });

  console.log('=== KATEGORI PENDIDIKAN TERAKHIR (1.991 Individu) ===');
  console.log(counts);
  pool.end();
}

testEducation();
