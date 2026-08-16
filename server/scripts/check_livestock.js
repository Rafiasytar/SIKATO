import { pool } from '../src/db.js';

async function checkLivestock() {
  const res = await pool.query(`
    SELECT apakah_memelihara_ternak, COUNT(*) 
    FROM sensus_keluarga 
    GROUP BY apakah_memelihara_ternak 
    ORDER BY COUNT(*) DESC
  `);
  console.log('Total unique livestock text strings:', res.rows.length);
  console.log(res.rows.slice(0, 30));

  // Let's parse livestock animals and counts
  let tidak = 0;
  let ternakKeluarga = 0;
  const hewanCounts = {
    'Sapi': 0,
    'Kambing': 0,
    'Ayam': 0,
    'Itik / Bebek': 0,
    'Kerbau': 0,
    'Ikan': 0,
    'Lainnya / Tidak Disebutkan': 0
  };

  res.rows.forEach(r => {
    const s = String(r.apakah_memelihara_ternak || '').toUpperCase().trim();
    const cnt = parseInt(r.count, 10) || 1;

    if (!s || s === '-' || s === 'TIDAK' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK MEMELIHARA') {
      tidak += cnt;
      return;
    }

    if (s.startsWith('YA') || s.includes('EKOR') || s.includes('SAPI') || s.includes('KAMBING') || s.includes('AYAM') || s.includes('ITIK') || s.includes('KERBAU') || s.includes('IKAN')) {
      ternakKeluarga += cnt;
      let matched = false;
      if (s.includes('SAPI')) { hewanCounts['Sapi'] += cnt; matched = true; }
      if (s.includes('KAMBING')) { hewanCounts['Kambing'] += cnt; matched = true; }
      if (s.includes('AYAM')) { hewanCounts['Ayam'] += cnt; matched = true; }
      if (s.includes('ITIK') || s.includes('BEBEK')) { hewanCounts['Itik / Bebek'] += cnt; matched = true; }
      if (s.includes('KERBAU')) { hewanCounts['Kerbau'] += cnt; matched = true; }
      if (s.includes('IKAN') || s.includes('KOLAM')) { hewanCounts['Ikan'] += cnt; matched = true; }
      if (!matched) { hewanCounts['Lainnya / Tidak Disebutkan'] += cnt; }
    } else {
      tidak += cnt;
    }
  });

  console.log('\n=== REKAPITULASI PETERNAKAN NAGARI (594 KK) ===');
  console.log(`- Memelihara Ternak: ${ternakKeluarga} KK (${Math.round(ternakKeluarga/594*100)}%)`);
  console.log(`- Tidak Memelihara: ${tidak} KK (${Math.round(tidak/594*100)}%)`);
  console.log('\n=== POPULASI JENIS TERNAK YANG DIPELIHARA ===');
  console.log(hewanCounts);

  pool.end();
}

checkLivestock();
