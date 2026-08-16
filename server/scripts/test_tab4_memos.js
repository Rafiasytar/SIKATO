import { pool } from '../src/db.js';

async function testTab4Memos() {
  const [famRes, indRes] = await Promise.all([
    pool.query('SELECT * FROM sensus_keluarga'),
    pool.query('SELECT * FROM sensus_individu')
  ]);

  const familyRows = famRes.rows;
  const individuRows = indRes.rows;

  console.log(`Analyzing ${familyRows.length} families and ${individuRows.length} individuals for Tab 4:\n`);

  // 1. Pendidikan Terakhir (5 Tiers)
  let sd = 0, smp = 0, sma = 0, pt = 0, noSchool = 0;
  individuRows.forEach(r => {
    const s = String(r.pendidikan_terakhir || '').toUpperCase().trim();
    if (s.includes('S1') || s.includes('S2') || s.includes('DIPLOMA') || s.includes('PERGURUAN') || s.includes('SARJANA')) pt++;
    else if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA') || s.includes('MA ')) sma++;
    else if (s.includes('SMP') || s.includes('MTS') || s.includes('SLTP')) smp++;
    else if (s.includes('SD') || s.includes('MI')) sd++;
    else noSchool++;
  });
  console.log('1. Pendidikan Terakhir (Pillar Column):', { sd, sma, smp, noSchool, pt });

  // 2. Matriks Pendidikan VS Internet
  // rows: SD, SMP, SMA, PT
  // cols: Aktif Internet (Ya), Tidak Aktif (Tidak)
  const matrix = [
    [0, 0], // SD
    [0, 0], // SMP
    [0, 0], // SMA
    [0, 0], // PT
  ];
  individuRows.forEach(r => {
    const s = String(r.pendidikan_terakhir || '').toUpperCase().trim();
    const net = String(r.apakah_aktif_menggunakan_internet_sebulan_terakhir || '').toUpperCase().trim() === 'YA' ? 0 : 1;
    if (s.includes('S1') || s.includes('S2') || s.includes('DIPLOMA') || s.includes('PERGURUAN') || s.includes('SARJANA')) matrix[3][net]++;
    else if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA')) matrix[2][net]++;
    else if (s.includes('SMP') || s.includes('MTS')) matrix[1][net]++;
    else if (s.includes('SD') || s.includes('MI')) matrix[0][net]++;
  });
  console.log('2. Matriks Pendidikan VS Internet (Heatmap Matrix):', matrix);

  // 3. Media Akses Internet (Treemap)
  let hp = 0, wifi = 0, hpWifi = 0;
  individuRows.forEach(r => {
    const s = String(r.jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui || '').toUpperCase().trim();
    if (s.includes('WIFI') && s.includes('HANDPHONE')) hpWifi++;
    else if (s.includes('WIFI')) wifi++;
    else if (s.includes('HANDPHONE') || s.includes('HP')) hp++;
  });
  console.log('3. Media Akses Internet (Treemap):', { 'Smartphone (HP)': hp, 'Wi-Fi Rumah': wifi, 'HP + Wi-Fi': hpWifi });

  // 4. Kecepatan Akses Internet (Radial Gauge)
  let cepat = 0, sedang = 0, lambat = 0;
  individuRows.forEach(r => {
    const s = String(r.kecepatan_akses_internet || '').toUpperCase().trim();
    if (s.includes('CEPAT')) cepat++;
    else if (s.includes('SEDANG')) sedang++;
    else if (s.includes('LAMBAT')) lambat++;
  });
  console.log('4. Kecepatan Internet (Speedometer Gauge):', { cepat, sedang, lambat });

  // 5. Jenis Dinding Rumah (100% Stacked Ribbon)
  let semen = 0, kayu = 0, triplek = 0, lainDinding = 0;
  familyRows.forEach(r => {
    const s = String(r.jenis_dinding_sebagian_besar_rumah || '').toUpperCase().trim();
    if (s.includes('SEMEN') || s.includes('BATA') || s.includes('BATAKO') || s.includes('PERMANEN')) semen++;
    else if (s.includes('KAYU') || s.includes('PAPAN')) kayu++;
    else if (s.includes('TRIPLEK') || s.includes('ANYAMAN') || s.includes('BAMBU')) triplek++;
    else if (s && s !== '-') lainDinding++;
    else semen++;
  });
  console.log('5. Dinding Rumah (100% Stacked Ribbon):', { semen, kayu, triplek, lainDinding });

  // 6. Daya Listrik PLN (Waterfall Chart)
  let va450 = 0, va900 = 0, va1300Plus = 0, numpangPln = 0;
  familyRows.forEach(r => {
    const s = String(r.besar_daya_listrik_pln || '').toUpperCase().trim();
    if (s.includes('450') || s.includes('200') || s.includes('230') || s.includes('300') || s.includes('400')) va450++;
    else if (s.includes('900') || s.includes('950')) va900++;
    else if (s.includes('1300') || s.includes('2200') || s.includes('3500')) va1300Plus++;
    else numpangPln++;
  });
  console.log('6. Daya Listrik PLN (Waterfall Flow):', { '450 VA (Subsidi)': va450, '900 VA (Standar)': va900, '1300 VA+ (Komersial)': va1300Plus, 'Menumpang / Belum Meteran': numpangPln });

  // 7. Pengelolaan Sampah (Bullet Ranking Chart)
  let bakar = 0, lubang = 0, angkut = 0, belumSampah = 0;
  familyRows.forEach(r => {
    const s = String(r.tempat_pembuangan_sampah || '').toUpperCase().trim();
    if (s.includes('DIBAKAR')) bakar++;
    else if (s.includes('LUBANG TANAH')) lubang++;
    else if (s.includes('ANGKUT') || s.includes('REGULER')) angkut++;
    else belumSampah++;
  });
  console.log('7. Pengelolaan Sampah (Bullet Ranking):', { 'Dibakar': bakar, 'Lubang Tanah': lubang, 'Diangkut Petugas': angkut, 'Dibuang ke Kebun / Belum Terdata': belumSampah });

  // 8. Risiko Bencana Alam (Polygonal Radar/Spider)
  let lereng = 0, sutet = 0, gempa = 0, longsor = 0, putingBeliung = 0;
  familyRows.forEach(r => {
    if (String(r.rumah_di_lereng_bukit_gunung || '').toUpperCase().trim() === 'YA') lereng++;
    if (String(r.rumah_berada_di_bawah_sutet_sutt_suttas || '').toUpperCase().trim() === 'YA') sutet++;
    const b = String(r.data_kejadian_bencana || '').toUpperCase().trim();
    if (b.includes('GEMPA')) gempa++;
    if (b.includes('LONGSOR')) longsor++;
    if (b.includes('PUTING') || b.includes('BADAI')) putingBeliung++;
  });
  console.log('8. Risiko Bencana Alam (Polygonal Radar):', { 'Lereng Bukit / Gunung': lereng, 'Bawah SUTET Listrik': sutet, 'Riwayat Gempa Bumi': gempa, 'Tanah Longsor': longsor, 'Angin Puting Beliung': putingBeliung });

  // 9. Kepuasan Layanan Desa (Executive Scorecard 2.0)
  let baikLayanan = 0, cukupLayanan = 0, burukLayanan = 0;
  individuRows.forEach(r => {
    const s = String(r.jika_iya_bagaimana_pelayanannya || '').toUpperCase().trim();
    if (s.includes('BAIK') || s.includes('RAMAH') || s.includes('BAGUS')) baikLayanan++;
    else if (s.includes('CUKUP')) cukupLayanan++;
    else if (s.includes('BURUK') || s.includes('LAMA') || s.includes('KURANG')) burukLayanan++;
  });
  console.log('9. Kepuasan Layanan Desa (Executive Scorecard):', { 'Pelayanan Baik & Ramah': baikLayanan, 'Pelayanan Cukup': cukupLayanan, 'Perlu Perbaikan / Kurang': burukLayanan });

  // 10. Partisipasi Musrenbang (Waffle Chart 10x10)
  let usulanYa = 0, usulanTidak = 0;
  individuRows.forEach(r => {
    const s = String(r.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran || '').toUpperCase().trim();
    if (s === 'YA' || s === 'PERNAH') usulanYa++;
    else usulanTidak++;
  });
  console.log('10. Partisipasi Musrenbang (Waffle Chart 10x10):', { 'Aktif Memberi Usulan': usulanYa, 'Belum Memberi Usulan': usulanTidak });

  // 11. Funnel Pemulihan Psikososial Bencana (Funnel Chart)
  let terpaparBencana = 0, terdampakFisikMental = 0, dapatPendampingan = 0;
  individuRows.forEach(r => {
    if (String(r.dalam_setahun_terakhir_apakah_terjadi_bencana || '').toUpperCase().trim() === 'YA') terpaparBencana++;
    if (String(r.apakah_anda_terkena_dampak_bencana || '').toUpperCase().trim() === 'YA') terdampakFisikMental++;
    if (String(r.apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana || '').toUpperCase().trim() === 'YA') dapatPendampingan++;
  });
  console.log('11. Pemulihan Psikososial (Funnel Chart):', { 'Wilayah Terpapar Bencana': terpaparBencana, 'Warga Terdampak Bencana': terdampakFisikMental, 'Menerima Pendampingan': dapatPendampingan });

  // 12. Kerawanan Akses Jalan Terputus (Alert Progress Ring)
  let jalanPutus = 0, jalanAman = 0;
  familyRows.forEach(r => {
    const s = String(r.apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana || '').toUpperCase().trim();
    if (s.includes('PERNAH') || s.includes('YA') || (s !== '-' && s !== 'TIDAK' && s !== '0' && s !== 'TUDAK ADA' && s !== 'TIDAK ADA' && s !== '' && !isNaN(parseInt(s, 10)) && parseInt(s, 10) > 0 && !s.includes('BIDANG'))) {
      jalanPutus++;
    } else {
      jalanAman++;
    }
  });
  console.log('12. Akses Jalan Terputus (Alert Progress Ring):', { 'Pernah Terputus': jalanPutus, 'Akses Jalan Aman': jalanAman });

  // 13. Bedah Rumah RTLH (Bullet Target Chart)
  let rehapYa = 0, rehapTidak = 0;
  familyRows.forEach(r => {
    const s = String(r.bantuan_rehap_rumah_tidak_layak_huni || '').toUpperCase().trim();
    if (s === 'IYA' || s === 'YA') rehapYa++;
    else rehapTidak++;
  });
  console.log('13. Bantuan Bedah Rumah RTLH (Bullet Target):', { 'Telah Menerima Bedah Rumah': rehapYa, 'Belum Menerima': rehapTidak });

  pool.end();
}

testTab4Memos();
