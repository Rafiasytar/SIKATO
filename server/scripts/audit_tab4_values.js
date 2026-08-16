import { pool } from '../src/db.js';

async function auditData() {
  console.log('=== AUDIT NILAI DATA TAB 4 (PENDIDIKAN, INFRASTRUKTUR & BENCANA) ===\n');

  // 1. Pendidikan Terakhir (Individu)
  const q1 = await pool.query('SELECT pendidikan_terakhir, COUNT(*) FROM sensus_individu GROUP BY pendidikan_terakhir ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('1. [Individu] pendidikan_terakhir:');
  console.log(q1.rows);

  // 2. Anak Putus Sekolah (Keluarga)
  const q2 = await pool.query('SELECT apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutka, COUNT(*) FROM sensus_keluarga GROUP BY apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutka ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n2. [Keluarga] Anak Putus Sekolah:');
  console.log(q2.rows);

  // 3. Internet Aktif (Individu)
  const q3 = await pool.query('SELECT apakah_aktif_menggunakan_internet_sebulan_terakhir, COUNT(*) FROM sensus_individu GROUP BY apakah_aktif_menggunakan_internet_sebulan_terakhir ORDER BY COUNT(*) DESC');
  console.log('\n3. [Individu] apakah_aktif_menggunakan_internet_sebulan_terakhir:');
  console.log(q3.rows);

  // 4. Media Akses Internet (Individu)
  const q4 = await pool.query('SELECT jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui, COUNT(*) FROM sensus_individu GROUP BY jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n4. [Individu] Media Akses Internet:');
  console.log(q4.rows);

  // 5. Kecepatan Akses Internet (Individu)
  const q5 = await pool.query('SELECT kecepatan_akses_internet, COUNT(*) FROM sensus_individu GROUP BY kecepatan_akses_internet ORDER BY COUNT(*) DESC');
  console.log('\n5. [Individu] Kecepatan Akses Internet:');
  console.log(q5.rows);

  // 6. Penerangan & Daya Listrik PLN (Keluarga)
  const q6 = await pool.query('SELECT besar_daya_listrik_pln, COUNT(*) FROM sensus_keluarga GROUP BY besar_daya_listrik_pln ORDER BY COUNT(*) DESC');
  console.log('\n6. [Keluarga] besar_daya_listrik_pln:');
  console.log(q6.rows);

  const q6b = await pool.query('SELECT penerangan_rumah, COUNT(*) FROM sensus_keluarga GROUP BY penerangan_rumah ORDER BY COUNT(*) DESC');
  console.log('\n6B. [Keluarga] penerangan_rumah:');
  console.log(q6b.rows);

  // 7. Konstruksi Fisik Rumah: Dinding, Atap, Lantai (Keluarga)
  const q7a = await pool.query('SELECT jenis_dinding_sebagian_besar_rumah, COUNT(*) FROM sensus_keluarga GROUP BY jenis_dinding_sebagian_besar_rumah ORDER BY COUNT(*) DESC');
  console.log('\n7A. [Keluarga] jenis_dinding_sebagian_besar_rumah:');
  console.log(q7a.rows);

  const q7b = await pool.query('SELECT jenis_atap, COUNT(*) FROM sensus_keluarga GROUP BY jenis_atap ORDER BY COUNT(*) DESC');
  console.log('\n7B. [Keluarga] jenis_atap:');
  console.log(q7b.rows);

  const q7c = await pool.query('SELECT jenis_lantai_tempat_tinggal_terluas, COUNT(*) FROM sensus_keluarga GROUP BY jenis_lantai_tempat_tinggal_terluas ORDER BY COUNT(*) DESC');
  console.log('\n7C. [Keluarga] jenis_lantai_tempat_tinggal_terluas:');
  console.log(q7c.rows);

  // 8. Pengelolaan Sampah & Bahan Bakar Masak (Keluarga)
  const q8a = await pool.query('SELECT tempat_pembuangan_sampah, COUNT(*) FROM sensus_keluarga GROUP BY tempat_pembuangan_sampah ORDER BY COUNT(*) DESC');
  console.log('\n8A. [Keluarga] tempat_pembuangan_sampah:');
  console.log(q8a.rows);

  const q8b = await pool.query('SELECT energi_untuk_memasak, COUNT(*) FROM sensus_keluarga GROUP BY energi_untuk_memasak ORDER BY COUNT(*) DESC');
  console.log('\n8B. [Keluarga] energi_untuk_memasak:');
  console.log(q8b.rows);

  // 9. Mitigasi Bencana & Kerawanan Fisik (Keluarga)
  const q9a = await pool.query('SELECT rumah_di_lereng_bukit_gunung, COUNT(*) FROM sensus_keluarga GROUP BY rumah_di_lereng_bukit_gunung ORDER BY COUNT(*) DESC');
  console.log('\n9A. [Keluarga] rumah_di_lereng_bukit_gunung:');
  console.log(q9a.rows);

  const q9b = await pool.query('SELECT rumah_berada_di_bawah_sutet_sutt_suttas, COUNT(*) FROM sensus_keluarga GROUP BY rumah_berada_di_bawah_sutet_sutt_suttas ORDER BY COUNT(*) DESC');
  console.log('\n9B. [Keluarga] rumah_berada_di_bawah_sutet_sutt_suttas:');
  console.log(q9b.rows);

  const q9c = await pool.query('SELECT apakah_terdapat_retakan_pada_bangunan, COUNT(*) FROM sensus_keluarga GROUP BY apakah_terdapat_retakan_pada_bangunan ORDER BY COUNT(*) DESC');
  console.log('\n9C. [Keluarga] apakah_terdapat_retakan_pada_bangunan:');
  console.log(q9c.rows);

  const q9d = await pool.query('SELECT apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana, COUNT(*) FROM sensus_keluarga GROUP BY apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana ORDER BY COUNT(*) DESC');
  console.log('\n9D. [Keluarga] apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana:');
  console.log(q9d.rows);

  const q9e = await pool.query('SELECT data_kejadian_bencana, COUNT(*) FROM sensus_keluarga GROUP BY data_kejadian_bencana ORDER BY COUNT(*) DESC LIMIT 10');
  console.log('\n9E. [Keluarga] data_kejadian_bencana:');
  console.log(q9e.rows);

  // 10. Dampak Bencana di Individu
  const q10a = await pool.query('SELECT dalam_setahun_terakhir_apakah_terjadi_bencana, COUNT(*) FROM sensus_individu GROUP BY dalam_setahun_terakhir_apakah_terjadi_bencana ORDER BY COUNT(*) DESC');
  console.log('\n10A. [Individu] dalam_setahun_terakhir_apakah_terjadi_bencana:');
  console.log(q10a.rows);

  const q10b = await pool.query('SELECT apakah_anda_terkena_dampak_bencana, COUNT(*) FROM sensus_individu GROUP BY apakah_anda_terkena_dampak_bencana ORDER BY COUNT(*) DESC');
  console.log('\n10B. [Individu] apakah_anda_terkena_dampak_bencana:');
  console.log(q10b.rows);

  const q10c = await pool.query('SELECT apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana, COUNT(*) FROM sensus_individu GROUP BY apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana ORDER BY COUNT(*) DESC');
  console.log('\n10C. [Individu] penanganan psikososial bencana:');
  console.log(q10c.rows);

  // 11. Bantuan Rehap RTLH (Keluarga)
  const q11 = await pool.query('SELECT bantuan_rehap_rumah_tidak_layak_huni, COUNT(*) FROM sensus_keluarga GROUP BY bantuan_rehap_rumah_tidak_layak_huni ORDER BY COUNT(*) DESC');
  console.log('\n11. [Keluarga] bantuan_rehap_rumah_tidak_layak_huni:');
  console.log(q11.rows);

  // 12. Layanan Desa & Partisipasi Musrenbang (Individu)
  const q12a = await pool.query('SELECT apakah_mendapatkan_layanan_desa_pada_1_tahun_terakhir, COUNT(*) FROM sensus_individu GROUP BY apakah_mendapatkan_layanan_desa_pada_1_tahun_terakhir ORDER BY COUNT(*) DESC');
  console.log('\n12A. [Individu] apakah_mendapatkan_layanan_desa:');
  console.log(q12a.rows);

  const q12b = await pool.query('SELECT jika_iya_bagaimana_pelayanannya, COUNT(*) FROM sensus_individu GROUP BY jika_iya_bagaimana_pelayanannya ORDER BY COUNT(*) DESC');
  console.log('\n12B. [Individu] kepuasan layanan desa:');
  console.log(q12b.rows);

  const q12c = await pool.query('SELECT dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran, COUNT(*) FROM sensus_individu GROUP BY dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran ORDER BY COUNT(*) DESC');
  console.log('\n12C. [Individu] masukan/usulan musrenbang:');
  console.log(q12c.rows);

  pool.end();
}

auditData();
