import { pool } from '../src/db.js';

async function printInfraValues() {
  const pln = await pool.query('SELECT besar_daya_listrik_pln, COUNT(*) FROM sensus_keluarga GROUP BY besar_daya_listrik_pln ORDER BY COUNT(*) DESC');
  console.log('=== PLN (594 KK) ===', pln.rows);

  const net = await pool.query('SELECT apakah_aktif_menggunakan_internet_sebulan_terakhir, COUNT(*) FROM sensus_individu GROUP BY apakah_aktif_menggunakan_internet_sebulan_terakhir ORDER BY COUNT(*) DESC');
  console.log('\n=== AKTIF INTERNET (1.991 Individu) ===', net.rows);

  const media = await pool.query('SELECT jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui, COUNT(*) FROM sensus_individu GROUP BY jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n=== MEDIA INTERNET (1.991 Individu) ===', media.rows);

  const speed = await pool.query('SELECT kecepatan_akses_internet, COUNT(*) FROM sensus_individu GROUP BY kecepatan_akses_internet ORDER BY COUNT(*) DESC');
  console.log('\n=== SPEED INTERNET (1.991 Individu) ===', speed.rows);

  const wall = await pool.query('SELECT jenis_dinding_sebagian_besar_rumah, COUNT(*) FROM sensus_keluarga GROUP BY jenis_dinding_sebagian_besar_rumah ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n=== DINDING (594 KK) ===', wall.rows);

  const roof = await pool.query('SELECT jenis_atap, COUNT(*) FROM sensus_keluarga GROUP BY jenis_atap ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n=== ATAP (594 KK) ===', roof.rows);

  const floor = await pool.query('SELECT jenis_lantai_tempat_tinggal_terluas, COUNT(*) FROM sensus_keluarga GROUP BY jenis_lantai_tempat_tinggal_terluas ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n=== LANTAI (594 KK) ===', floor.rows);

  const waste = await pool.query('SELECT tempat_pembuangan_sampah, COUNT(*) FROM sensus_keluarga GROUP BY tempat_pembuangan_sampah ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n=== SAMPAH (594 KK) ===', waste.rows);

  const cook = await pool.query('SELECT energi_untuk_memasak, COUNT(*) FROM sensus_keluarga GROUP BY energi_untuk_memasak ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n=== ENERGI MASAK (594 KK) ===', cook.rows);

  const lereng = await pool.query('SELECT rumah_di_lereng_bukit_gunung, COUNT(*) FROM sensus_keluarga GROUP BY rumah_di_lereng_bukit_gunung ORDER BY COUNT(*) DESC');
  console.log('\n=== LERENG BUKIT (594 KK) ===', lereng.rows);

  const sutet = await pool.query('SELECT rumah_berada_di_bawah_sutet_sutt_suttas, COUNT(*) FROM sensus_keluarga GROUP BY rumah_berada_di_bawah_sutet_sutt_suttas ORDER BY COUNT(*) DESC');
  console.log('\n=== SUTET (594 KK) ===', sutet.rows);

  pool.end();
}

printInfraValues();
