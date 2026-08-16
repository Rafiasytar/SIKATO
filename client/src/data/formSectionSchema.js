// 4 Original Form Categories configuration
export const ORIGINAL_SECTIONS_CONFIG = [
  {
    id: 'deskripsi-keluarga',
    title: '1. DESKRIPSI KELUARGA',
    icon: 'identitas',
    fieldIds: [
      'nomor_kk',
      'nama_kepala_keluarga',
      'nama_responden',
      'nama_enumerator_mahasiswa',
      'alamat_lengkap',
      'nomor_hp',
      'periode_pendataan',
      'titik_koordinat_x',
      'titik_koordinat_y',
      'jumlah_anggota_dalam_keluarga',
      'jumlah_anggota_yang_benar_benar_tinggal_dirumah_ini',
      'jumlah_balita_0_5_tahun',
      'jumlah_anak_anak_6_12_tahun',
      'jumlah_remaja_produktif_13_59_tahun',
      'jumlah_lansia_60_tahun_ke_atas',
      'apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma',
      'tempat_tinggal_yang_ditempati',
      'status_tanah_bangunan_tempat_tinggal_yang_ditempati',
      'apakah_terdapat_retakan_pada_bangunan',
      'apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi',
      'luas_rumah',
      'luas_sawah',
      'luas_kebun_tanaman_muda',
      'luas_kebun_tanaman_tua',
      'luas_lahan_kosong',
      'intensitas_tanam_padi_dalam_setahun',
      'rata_rata_produksi_panen_padi_pangan_lainnya_per_musim_panen',
      'luas_kolam_ikan',
      'jenis_lantai_tempat_tinggal_terluas',
      'jenis_dinding_sebagian_besar_rumah',
      'kondisi_ventilasi_rumah',
      'jenis_atap',
      'penerangan_rumah',
      'besar_daya_listrik_pln',
      'energi_untuk_memasak',
      'tempat_pembuangan_sampah',
      'fasilitas_mck',
      'apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana',
      'fasilitas_jamban',
      'jenis_kloset',
      'sumber_air_mandi_terbanyak_dari',
      'sumber_air_minum_terbanyak_dari',
      'tempat_pembuangan_air_limbah_septic_tank',
      'kondisi_drainase_disekitar_rumah',
      'rumah_berada_di_bawah_sutet_sutt_suttas',
      'rumah_di_lereng_bukit_gunung',
      'secara_keseluruhan_kondisi_rumah',
      'data_kejadian_bencana',
    ],
  },
  {
    id: 'penerima-program',
    title: '2. PEMANFAAT/PENERIMA PROGRAM PEMERINTAH',
    icon: 'ekonomi',
    fieldIds: [
      'blt_dana_desa',
      'bpjs_kis',
      'program_keluarga_harapan_pkh',
      'bantuan_sosial_tunai',
      'bantuan_rehap_rumah_tidak_layak_huni',
      'bantuan_pendidikan_anak',
      'bantuan_lainnya',
      'berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah',
      'kepemilikin_aset',
      'apakah_memelihara_ternak',
      'jumlah_kepemilikan_bidang_tanah',
      'jumlah_lembar_pbb',
      'nomor_nop_pbb',
    ],
  },
  {
    id: 'umkm',
    title: '3. UMKM (Usaha Mikro, Kecil, dan Menengah)',
    icon: 'umkm',
    fieldIds: [
      'apakah_mempunyai_umkm',
      'bantuan_umkm',
      'jika_punya_apa_nama_usahanya_dan_dibidang_apa',
      'lokasi_usaha',
      'permasalahan_nomor_induk_berusaha_nib_dan_sertifikat_halal_pada_umkm',
      'perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan',
      'apakah_lokasi_usahanya_sudah_ada_di_google_maps',
      'apakah_sudah_mengetahui_metode_pembayaran_qris',
      'apakah_ingin_membuat_qris_di_usahanya',
      'kendala_utama_usaha',
    ],
  },
  {
    id: 'lampiran-foto',
    title: '4. LAMPIRAN FOTO',
    icon: 'rumah',
    fieldIds: [
      'foto_kk',
      'foto_buku_nikah',
      'rumah_tampak_depan',
      'dalam_rumah_ruang_tamu',
    ],
  },
]

export function buildSectionsFromSchema(schema) {
  const schemaMap = new Map(schema.map((f) => [f.id, f]))
  const categorizedIds = new Set()

  const sections = ORIGINAL_SECTIONS_CONFIG.map((cfg) => {
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

  // Append any uncategorized fields to the first section
  const uncategorized = schema.filter((f) => !categorizedIds.has(f.id))
  if (uncategorized.length > 0) {
    sections[0].fields.push(...uncategorized)
  }

  return sections
}
