import { useState } from 'react'
import FormValidationModal from './FormValidationModal'
import Icon from './Icon'
import { fixedTableSchema } from '../data/tableSchema'

function EditPersonModal({ initialData, onSave, onClose }) {
  const isEditing = Boolean(initialData && initialData.id)
  const [activeTab, setActiveTab] = useState('identitas')
  const [missingFields, setMissingFields] = useState([])
  const schema = fixedTableSchema

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return { ...initialData }
    }
    const defaultData = {}
    schema.forEach((f) => {
      defaultData[f.id] = ''
    })
    return defaultData
  })

  const groups = {
    identitas: {
      label: 'Identitas & Demografi',
      icon: 'identitas',
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
      label: 'Kelayakan & Fisik Rumah',
      icon: 'rumah',
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
      label: 'Sanitasi & Sumber Air',
      icon: 'sanitasi',
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
      icon: 'ekonomi',
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
      label: 'UMKM & Lampiran Foto',
      icon: 'umkm',
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

  // Any remaining fields not explicitly in groups
  const categorizedIds = new Set(
    Object.values(groups).flatMap((g) => g.fields.map((f) => f.id)),
  )
  const uncategorizedFields = schema.filter((f) => !categorizedIds.has(f.id))
  if (uncategorizedFields.length > 0) {
    groups.identitas.fields.push(...uncategorizedFields)
  }

  const currentGroup = groups[activeTab] || groups.identitas

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFocusField = (fieldId) => {
    if (!fieldId) return
    Object.entries(groups).forEach(([tabKey, groupObj]) => {
      if (groupObj.fields.some((f) => f.id === fieldId)) {
        setActiveTab(tabKey)
      }
    })

    setTimeout(() => {
      const el = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        try { el.focus() } catch (err) {}
        el.style.transition = 'all 0.3s ease'
        el.style.border = '2px solid #ef4444'
        el.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.35)'
        setTimeout(() => {
          el.style.border = ''
          el.style.boxShadow = ''
        }, 3000)
      }
    }, 150)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const missing = []
    const mandatoryFields = [
      { id: 'nomor_kk', label: 'Nomor Kartu Keluarga (KK)' },
      { id: 'nama_kepala_keluarga', label: 'Nama Kepala Keluarga' },
      { id: 'nama_responden', label: 'Nama Responden' },
      { id: 'alamat_lengkap', label: 'Alamat Lengkap (Jorong)' },
      { id: 'periode_pendataan', label: 'Periode Pendataan' },
    ]

    mandatoryFields.forEach((item) => {
      const val = formData[item.id]
      if (val === undefined || val === null || String(val).trim() === '') {
        missing.push({
          id: item.id,
          label: item.label,
          section: 'Identitas & Demografi',
        })
      }
    })

    if (missing.length > 0) {
      setMissingFields(missing)
      return
    }
    onSave(formData)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card crud-modal-full" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">{isEditing ? 'Mode Edit Data Sensus' : 'Tambah Data Sensus Baru'}</span>
            <h2>{isEditing ? `Edit: ${formData.nama_kepala_keluarga || 'Responden'}` : 'Tambah Data Sensus 76+ Pertanyaan'}</h2>
            <p className="modal-sub">
              Lengkapi 76+ data atribut sensus keluarga Nagari Tabek Patah secara terstruktur per tab.
            </p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose}>
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
              <Icon name={group.icon} size={16} />
              <span>{group.label} ({group.fields.length})</span>
            </button>
          ))}
        </nav>

        <form onSubmit={handleSubmit} noValidate className="modal-body">
          <div className="form-grid">
            {currentGroup.fields.map((field) => {
              const val = formData[field.id] || ''
              const isLongText = field.id.length > 40 || field.id.includes('putus_sekolah') || field.id.includes('permasalahan')

              return (
                <div
                  className={`form-group ${isLongText ? 'full-width' : ''}`}
                  key={field.id}
                >
                  <label htmlFor={field.id}>{field.label}</label>
                  {isLongText ? (
                    <textarea
                      id={field.id}
                      name={field.id}
                      value={val}
                      onChange={handleChange}
                      rows={2}
                      placeholder={`Isikan ${field.label}...`}
                    />
                  ) : (
                    <input
                      id={field.id}
                      type="text"
                      name={field.id}
                      value={val}
                      onChange={handleChange}
                      placeholder={`Isikan ${field.label}...`}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="modal-footer" style={{ marginTop: '1.5rem', padding: '1rem 0 0' }}>
            <button className="secondary-button" type="button" onClick={onClose}>
              Batal
            </button>
            <button className="primary-button" type="submit">
              💾 {isEditing ? 'Simpan Semua 76+ Perubahan' : 'Simpan Data Sensus Baru'}
            </button>
          </div>
        </form>

        <FormValidationModal
          missingFields={missingFields}
          onClose={() => setMissingFields([])}
          onFocusField={handleFocusField}
        />
      </div>
    </div>
  )
}

export default EditPersonModal
