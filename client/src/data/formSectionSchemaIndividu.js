export const INDIVIDU_SECTIONS_CONFIG = [
  {
    id: 'deskripsi-individu',
    title: '1. DESKRIPSI INDIVIDU',
    icon: 'identitas',
    fieldIds: [
      'nama_kepala_keluarga',
      'nomor_kk',
      'nomor_nik',
      'nama',
      'jenis_kelamin',
      'tempat_lahir',
      'tanggal_lahir',
      'usia',
      'apakah_sudah_melakukan_update_kk_ktp',
      'status_pernikahan',
      'bila_kawin_cerai_hidup_cerai_mati_berapa_usia_saat_menikah_pertama',
      'agama',
      'suku_bangsa',
      'warganegara',
      'nomor_hp',
      'apakah_aktif_menggunakan_internet_sebulan_terakhir',
      'jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui',
      'kecepatan_akses_internet',
    ],
  },
  {
    id: 'deskripsi-pekerjaan',
    title: '2. DESKRIPSI PEKERJAAN',
    icon: 'ekonomi',
    fieldIds: [
      'kondisi_pekerjaan',
      'pekerjaan_utama',
      'jaminan_sosial_ketenagakerjaan',
      'sumber_penghasilan',
      'jumlah_panen_pertahun_ton_kg_ekor',
      'penghasilan_setahun_rp',
    ],
  },
  {
    id: 'deskripsi-kesehatan',
    title: '3. DESKRIPSI KESEHATAN',
    icon: 'sanitasi',
    fieldIds: [
      'jaminan_sosial_kesehatan',
      'jika_punya',
      'penyakit_yang_diderita_setahun_terakhir',
      'apakah_mempunyai_alergi_terhadap_obat',
      'berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir',
      'apakah_ibu_sedang_mengandung',
      'apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif',
      'disabilitas',
    ],
  },
  {
    id: 'deskripsi-pendidikan',
    title: '4. DESKRIPSI PENDIDIKAN',
    icon: 'pendidikan',
    fieldIds: [
      'pendidikan_terakhir',
      'berapa_tahun_mengenyam_pendidikan_dasar_sd_smp_sma',
      'apakah_mendapatkan_layanan_desa_pada_1_tahun_terakhir',
      'jika_iya_bagaimana_pelayanannya',
      'dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran_pada_pihak_nagari',
    ],
  },
  {
    id: 'deskripsi-lingkungan',
    title: '5. DESKRIPSI LINGKUNGAN',
    icon: 'bencana',
    fieldIds: [
      'dalam_setahun_terakhir_apakah_terjadi_bencana',
      'apakah_anda_terkena_dampak_bencana',
      'apakah_menerima_pemenuhan_kebutuhan_dasar_saat_bencana',
      'apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana',
    ],
  },
  {
    id: 'lampiran-foto-individu',
    title: '6. FOTO LAMPIRAN',
    icon: 'rumah',
    fieldIds: [
      'foto_akta_kelahiran',
    ],
  },
]

export function buildIndividuSectionsFromSchema(schema) {
  const schemaMap = new Map(schema.map((f) => [f.id, f]))
  const categorizedIds = new Set()

  const sections = INDIVIDU_SECTIONS_CONFIG.map((cfg) => {
    const fields = cfg.fieldIds
      .map((id) => {
        categorizedIds.add(id)
        return schemaMap.get(id)
      })
      .filter(Boolean)

    return {
      id: cfg.id,
      title: cfg.title,
      icon: cfg.icon,
      fields,
    }
  })

  const uncategorized = schema.filter((f) => !categorizedIds.has(f.id))
  if (uncategorized.length > 0) {
    sections[0].fields.push(...uncategorized)
  }

  return sections
}
