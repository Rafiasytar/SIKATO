const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Tarompa1@localhost:5432/bi_tabek_patah'
  });
  await client.connect();

  // Fetch all sensus_keluarga
  const familyRes = await client.query(`SELECT * FROM sensus_keluarga`);
  const familyRows = familyRes.rows;

  let rtlhCount = 0;
  let bansosCount = 0;

  familyRows.forEach(r => {
    // RTLH
    const cond = String(r.secara_keseluruhan_kondisi_rumah || '').toUpperCase().trim();
    if (cond === 'KUMUH' || cond.includes('KUMUH') || cond.includes('RUSAK') || cond.includes('TIDAK LAYAK')) {
      rtlhCount++;
    }

    // Bansos
    const blt = String(r.blt_dana_desa || '').toUpperCase();
    const pkh = String(r.program_keluarga_harapan_pkh || '').toUpperCase();
    const bst = String(r.bantuan_sosial_tunai || '').toUpperCase();
    const pip = String(r.bantuan_pendidikan_anak || '').toUpperCase();
    const rehap = String(r.bantuan_rehap_rumah_tidak_layak_huni || '').toUpperCase();
    const lain = String(r.bantuan_lainnya || '').toUpperCase();

    const isBlt = blt.includes('YA') || blt.includes('COVID') || blt.includes('SEMBAKO');
    const isPkh = pkh === 'YA';
    const isBst = bst === 'YA';
    const isPip = pip === 'YA';
    const isRehap = rehap === 'IYA' || rehap === 'YA';
    const isLain = lain.includes('BPNT') || lain.includes('SEMBAKO') || lain.includes('BERAS') || lain.includes('BAZNAS') || lain.includes('KIP') || lain.includes('KKS') || lain.includes('LANSIA') || lain.includes('KESTRA');

    if (isBlt || isPkh || isBst || isPip || isRehap || isLain) {
      bansosCount++;
    }
  });

  console.log(`Total KK: ${familyRows.length}`);
  console.log(`RTLH (Kumuh) KK: ${rtlhCount} (${Math.round((rtlhCount/familyRows.length)*100)}%) -> Layak Huni: ${familyRows.length - rtlhCount} (${Math.round(((familyRows.length - rtlhCount)/familyRows.length)*100)}%)`);
  console.log(`Penerima Bansos KK: ${bansosCount} (${Math.round((bansosCount/familyRows.length)*100)}%)`);

  // Fetch all sensus_individu
  const indRes = await client.query(`SELECT * FROM sensus_individu`);
  const indRows = indRes.rows;

  let bpjsCount = 0;
  let bekerjaCount = 0;

  indRows.forEach(r => {
    // BPJS
    const bpjsKes = String(r.jaminan_sosial_kesehatan || '').toUpperCase().trim();
    if (bpjsKes === 'PESERTA' || bpjsKes.includes('YA') || bpjsKes.includes('BPJS') || bpjsKes.includes('KIS')) {
      bpjsCount++;
    }

    // Bekerja
    const condPekerjaan = String(r.kondisi_pekerjaan || '').toUpperCase().trim();
    const pekerjaanUtama = String(r.pekerjaan_utama || '').toUpperCase().trim();
    if (condPekerjaan === 'BEKERJA' || (pekerjaanUtama !== '' && pekerjaanUtama !== '-' && pekerjaanUtama !== 'NULL' && pekerjaanUtama !== 'SEKOLAH')) {
      bekerjaCount++;
    }
  });

  console.log(`\nTotal Jiwa: ${indRows.length}`);
  console.log(`Cakupan BPJS Kesehatan: ${bpjsCount} Jiwa (${Math.round((bpjsCount/indRows.length)*100)}%)`);
  console.log(`Penduduk Bekerja (kondisi_pekerjaan = BEKERJA): ${indRows.filter(r => String(r.kondisi_pekerjaan).toUpperCase() === 'BEKERJA').length}`);
  console.log(`Penduduk Bekerja (Bekerja + Ada Pekerjaan): ${bekerjaCount}`);

  await client.end();
}

main().catch(err => console.error(err));
