import { pool } from '../src/db.js';

async function auditTab4Columns() {
  console.log('=== AUDIT TAB 4: PENDIDIKAN, INFRASTRUKTUR & BENCANA ===\n');

  // 1. Pendidikan Terakhir (Individu)
  const eduRes = await pool.query('SELECT pendidikan_terakhir, COUNT(*) FROM sensus_individu GROUP BY pendidikan_terakhir ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('1. Pendidikan Terakhir (Individu):', eduRes.rows);

  // 2. Anak Putus Sekolah (Keluarga)
  const putusRes = await pool.query('SELECT apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma, COUNT(*) FROM sensus_keluarga GROUP BY apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n2. Anak Putus Sekolah (Keluarga):', putusRes.rows);

  // 3. Putus Sekolah Tingkat (Keluarga)
  const putusTingkatRes = await pool.query('SELECT putus_sekolah_pada_tingkat_misal_1_orang_tingkat_sd_2_orang_tingkat_smp, COUNT(*) FROM sensus_keluarga GROUP BY putus_sekolah_pada_tingkat_misal_1_orang_tingkat_sd_2_orang_tingkat_smp ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n3. Putus Sekolah Tingkat (Keluarga):', putusTingkatRes.rows);

  // 4. Internet di Individu (apakah_memiliki_akses_internet_hp_wifi, dll)
  const netAccessRes = await pool.query('SELECT apakah_memiliki_akses_internet_hp_wifi, COUNT(*) FROM sensus_individu GROUP BY apakah_memiliki_akses_internet_hp_wifi ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n4. Akses Internet Individu:', netAccessRes.rows);

  const netMediaRes = await pool.query('SELECT jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui, COUNT(*) FROM sensus_individu GROUP BY jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n5. Media Akses Internet (Individu):', netMediaRes.rows);

  const netSpeedRes = await pool.query('SELECT kecepatan_akses_internet, COUNT(*) FROM sensus_individu GROUP BY kecepatan_akses_internet ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n6. Kecepatan Akses Internet (Individu):', netSpeedRes.rows);

  // 5. Daya Listrik PLN & Penerangan (Keluarga)
  const plnRes = await pool.query('SELECT besar_daya_listrik_pln, COUNT(*) FROM sensus_keluarga GROUP BY besar_daya_listrik_pln ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n7. Daya Listrik PLN (Keluarga):', plnRes.rows);

  const peneranganRes = await pool.query('SELECT penerangan_rumah, COUNT(*) FROM sensus_keluarga GROUP BY penerangan_rumah ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n8. Penerangan Rumah (Keluarga):', peneranganRes.rows);

  // 6. Bahan Bangunan (Dinding, Atap, Lantai, Ventilasi)
  const dindingRes = await pool.query('SELECT jenis_dinding_sebagian_besar_rumah, COUNT(*) FROM sensus_keluarga GROUP BY jenis_dinding_sebagian_besar_rumah ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n9. Jenis Dinding (Keluarga):', dindingRes.rows);

  const atapRes = await pool.query('SELECT jenis_atap, COUNT(*) FROM sensus_keluarga GROUP BY jenis_atap ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n10. Jenis Atap (Keluarga):', atapRes.rows);

  const lantaiRes = await pool.query('SELECT jenis_lantai_tempat_tinggal_terluas, COUNT(*) FROM sensus_keluarga GROUP BY jenis_lantai_tempat_tinggal_terluas ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n11. Jenis Lantai (Keluarga):', lantaiRes.rows);

  // 7. Pengelolaan Sampah & Energi Memasak
  const sampahRes = await pool.query('SELECT tempat_pembuangan_sampah, COUNT(*) FROM sensus_keluarga GROUP BY tempat_pembuangan_sampah ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n12. Tempat Sampah (Keluarga):', sampahRes.rows);

  const masakRes = await pool.query('SELECT energi_untuk_memasak, COUNT(*) FROM sensus_keluarga GROUP BY energi_untuk_memasak ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n13. Energi Memasak (Keluarga):', masakRes.rows);

  // 8. Risiko Bencana Alam (Lereng Bukit, SUTET, Retakan, Akses Jalan Terputus, Kejadian Bencana)
  const lerengRes = await pool.query('SELECT rumah_di_lereng_bukit_gunung, COUNT(*) FROM sensus_keluarga GROUP BY rumah_di_lereng_bukit_gunung ORDER BY COUNT(*) DESC');
  console.log('\n14. Rumah di Lereng Bukit (Keluarga):', lerengRes.rows);

  const sutetRes = await pool.query('SELECT rumah_berada_di_bawah_sutet_sutt_suttas, COUNT(*) FROM sensus_keluarga GROUP BY rumah_berada_di_bawah_sutet_sutt_suttas ORDER BY COUNT(*) DESC');
  console.log('\n15. Rumah di Bawah SUTET (Keluarga):', sutetRes.rows);

  const retakanRes = await pool.query('SELECT apakah_terdapat_retakan_pada_bangunan, COUNT(*) FROM sensus_keluarga GROUP BY apakah_terdapat_retakan_pada_bangunan ORDER BY COUNT(*) DESC');
  console.log('\n16. Retakan Bangunan (Keluarga):', retakanRes.rows);

  const aksesTerputusRes = await pool.query('SELECT apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana, COUNT(*) FROM sensus_keluarga GROUP BY apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana ORDER BY COUNT(*) DESC');
  console.log('\n17. Akses Terputus Bencana (Keluarga):', aksesTerputusRes.rows);

  const bencanaRes = await pool.query('SELECT data_kejadian_bencana, COUNT(*) FROM sensus_keluarga GROUP BY data_kejadian_bencana ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n18. Kejadian Bencana (Keluarga):', bencanaRes.rows);

  // 9. Bantuan Rehap Rumah RTLH
  const rtlhRes = await pool.query('SELECT bantuan_rehap_rumah_tidak_layak_huni, COUNT(*) FROM sensus_keluarga GROUP BY bantuan_rehap_rumah_tidak_layak_huni ORDER BY COUNT(*) DESC');
  console.log('\n19. Bantuan Rehap RTLH (Keluarga):', rtlhRes.rows);

  // 10. Partisipasi & Psikososial di Individu/Keluarga
  const musrenbangRes = await pool.query('SELECT apakah_pernah_memberikan_masukan_usulan_dalam_musrenbang_atau_forum_warga, COUNT(*) FROM sensus_individu GROUP BY apakah_pernah_memberikan_masukan_usulan_dalam_musrenbang_atau_forum_warga ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n20. Musrenbang / Forum Warga (Individu):', musrenbangRes.rows);

  const psikoRes = await pool.query('SELECT apakah_membutuhkan_layanan_psikososial_pasca_bencana, COUNT(*) FROM sensus_individu GROUP BY apakah_membutuhkan_layanan_psikososial_pasca_bencana ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n21. Layanan Psikososial Pasca Bencana (Individu):', psikoRes.rows);

  const layananDesaRes = await pool.query('SELECT bagaimana_evaluasi_layanan_kantor_desa_nagari, COUNT(*) FROM sensus_individu GROUP BY bagaimana_evaluasi_layanan_kantor_desa_nagari ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n22. Evaluasi Layanan Desa (Individu):', layananDesaRes.rows);

  pool.end();
}

auditTab4Columns();
