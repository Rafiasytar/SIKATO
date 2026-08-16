import { useState } from 'react'

function PersonDetailModal({ row, schema, onClose }) {
  const [activeTab, setActiveTab] = useState('identitas')

  if (!row) return null

  // Group schema fields into logical tabs/categories
  const groups = {
    identitas: {
      label: 'Identitas & Demografi',
      icon: '👤',
      fields: schema.filter((f) =>
        [
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
        ].includes(f.id),
      ),
    },
    rumah: {
      label: 'Fasilitas & Kelayakan Rumah',
      icon: '🏠',
      fields: schema.filter((f) =>
        [
          'tempat_tinggal_yang_ditempati',
          'status_tanah_bangunan_tempat_tinggal_yang_ditempati',
          'apakah_terdapat_retakan_pada_bangunan',
          'apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi',
          'luas_rumah',
          'jenis_lantai_tempat_tinggal_terluas',
          'jenis_dinding_sebagian_besar_rumah',
          'kondisi_ventilasi_rumah',
          'jenis_atap',
          'penerangan_rumah',
          'besar_daya_listrik_pln',
          'energi_untuk_memasak',
          'rumah_berada_di_bawah_sutet_sutt_suttas',
          'rumah_di_lereng_bukit_gunung',
          'secara_keseluruhan_kondisi_rumah',
          'data_kejadian_bencana',
          'apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana',
        ].includes(f.id),
      ),
    },
    sanitasi: {
      label: 'Sanitasi & Air Bersih',
      icon: '💧',
      fields: schema.filter((f) =>
        [
          'tempat_pembuangan_sampah',
          'fasilitas_mck',
          'fasilitas_jamban',
          'jenis_kloset',
          'sumber_air_mandi_terbanyak_dari',
          'sumber_air_minum_terbanyak_dari',
          'tempat_pembuangan_air_limbah_septic_tank',
          'kondisi_drainase_disekitar_rumah',
        ].includes(f.id),
      ),
    },
    ekonomi: {
      label: 'Lahan, Ekonomi & Bansos',
      icon: '💰',
      fields: schema.filter((f) =>
        [
          'luas_sawah',
          'luas_kebun_tanaman_muda',
          'luas_kebun_tanaman_tua',
          'luas_lahan_kosong',
          'intensitas_tanam_padi_dalam_setahun',
          'rata_rata_produksi_panen_padi_pangan_lainnya_per_musim_panen',
          'luas_kolam_ikan',
          'berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah',
          'kepemilikin_aset',
          'apakah_memelihara_ternak',
          'jumlah_kepemilikan_bidang_tanah',
          'jumlah_lembar_pbb',
          'nomor_nop_pbb',
          'blt_dana_desa',
          'bpjs_kis',
          'program_keluarga_harapan_pkh',
          'bantuan_sosial_tunai',
          'bantuan_rehap_rumah_tidak_layak_huni',
          'bantuan_pendidikan_anak',
          'bantuan_lainnya',
        ].includes(f.id),
      ),
    },
    umkm: {
      label: 'UMKM & Dokumen',
      icon: '🏪',
      fields: schema.filter((f) =>
        [
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
          'foto_kk',
          'foto_buku_nikah',
          'rumah_tampak_depan',
          'dalam_rumah_ruang_tamu',
        ].includes(f.id),
      ),
    },
  }

  const currentGroup = groups[activeTab] || groups.identitas

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">Detail Responden Sensus</span>
            <h2>{row.nama_kepala_keluarga || row.nama_responden || 'Detail Keluarga'}</h2>
            <p className="modal-sub">
              <strong>No. KK:</strong> {row.nomor_kk || '-'} | <strong>Alamat:</strong>{' '}
              {row.alamat_lengkap || '-'}
            </p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Tutup modal">
            ✕
          </button>
        </header>

        <nav className="modal-tabs">
          {Object.entries(groups).map(([key, group]) => (
            <button
              key={key}
              type="button"
              className={`modal-tab-btn ${activeTab === key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <span>{group.icon}</span> {group.label}
            </button>
          ))}
        </nav>

        <div className="modal-body">
          <div className="detail-grid">
            {currentGroup.fields.map((field) => {
              const val = row[field.id]
              const isMedia =
                ['foto_kk', 'foto_buku_nikah', 'rumah_tampak_depan', 'dalam_rumah_ruang_tamu'].includes(
                  field.id,
                ) && val

              return (
                <div className={`detail-item ${isMedia ? 'is-media-item' : ''}`} key={field.id}>
                  <span className="detail-label">{field.label}</span>
                  <div className="detail-value">
                    {val !== undefined && val !== null && String(val).trim() !== '' ? (
                      isMedia && String(val).startsWith('http') ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="detail-link">
                          📎 Lihat Lampiran Foto / File
                        </a>
                      ) : (
                        <MultiSelectFieldValue val={val} fieldId={field.id} />
                      )
                    ) : (
                      <em className="text-muted">Tidak diisi / Kosong</em>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <footer className="modal-footer">
          <button className="secondary-button" type="button" onClick={onClose}>
            Tutup
          </button>
        </footer>
      </div>
    </div>
  )
}

const MULTI_CHECKBOX_FIELDS = new Set([
  'energi_untuk_memasak',
  'tempat_pembuangan_sampah',
  'sumber_air_mandi_terbanyak_dari',
  'sumber_air_minum_terbanyak_dari',
  'tempat_pembuangan_air_limbah_septic_tank',
  'data_kejadian_bencana',
  'kepemilikin_aset',
  'apakah_memelihara_ternak',
  'permasalahan_nomor_induk_berusaha_nib_dan_sertifikat_halal_pada_umkm',
  'jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui',
])

function MultiSelectFieldValue({ val, fieldId }) {
  if (val === undefined || val === null || String(val).trim() === '') {
    return null
  }

  const str = String(val).trim()
  const key = (fieldId || '').toLowerCase().trim()

  if (MULTI_CHECKBOX_FIELDS.has(key)) {
    const items = (str.includes(',') || str.includes(';'))
      ? str.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      : [str]

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 8px', marginTop: '4px' }}>
        {items.map((item, idx) => (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.86rem',
              fontWeight: 600,
              background: '#f8fafc',
              color: '#1e293b',
              border: '1px solid #e2e8f0'
            }}
          >
            {item}
          </span>
        ))}
      </div>
    )
  }

  return <span>{str}</span>
}

export default PersonDetailModal
