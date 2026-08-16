import { useEffect, useMemo, useState } from 'react'
import FormValidationModal from '../components/FormValidationModal'
import Icon from '../components/Icon'
import Sidebar from '../components/Sidebar'

function isFieldEmpty(val) {
  if (val === undefined || val === null) return true
  const str = String(val).trim()
  if (!str) return true
  const upper = str.toUpperCase()
  if (
    upper === '-' ||
    upper === '--' ||
    upper === 'NULL' ||
    upper === 'UNDEFINED' ||
    upper === 'N/A' ||
    upper === 'SELECT' ||
    upper === '-- PILIH --' ||
    upper === 'PILIH'
  ) {
    return true
  }
  return false
}
import { buildIndividuSectionsFromSchema } from '../data/formSectionSchemaIndividu'
import { fixedTableSchemaIndividu } from '../data/individuTableSchema'
import { fileToDataURL, getGoogleDriveFallbackUrl, getGoogleDriveThumbnailUrl, isPhotoField } from '../utils/imageHelper'

// Full Field Configuration Dictionary for All 44 Individual Questions (Uppercase)
const FIELD_CONFIG = {
  nama_kepala_keluarga: { required: true, type: 'text' },
  nomor_kk: { required: true, type: 'text' },
  nomor_nik: { required: true, type: 'text' },
  nama: { required: true, type: 'text' },
  jenis_kelamin: {
    required: true,
    type: 'select',
    options: ['PEREMPUAN', 'LAKI-LAKI'],
  },
  tempat_lahir: { required: true, type: 'text' },
  tanggal_lahir: { required: true, type: 'date' },
  usia: { required: true, type: 'text' },
  apakah_sudah_melakukan_update_kk_ktp: {
    required: true,
    type: 'select-other',
    options: ['SUDAH', 'BELUM'],
  },
  status_pernikahan: {
    required: true,
    type: 'select',
    options: ['BELUM KAWIN', 'KAWIN', 'CERAI HIDUP', 'CERAI MATI'],
  },
  bila_kawin_cerai_hidup_cerai_mati_berapa_usia_saat_menikah_pertama: { required: false, type: 'text' },
  agama: {
    required: true,
    type: 'select-other',
    options: ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDHA', 'KHONGHUCU'],
  },
  suku_bangsa: { required: true, type: 'text' },
  warganegara: {
    required: true,
    type: 'select',
    options: ['WNI', 'WNA'],
  },
  nomor_hp: { required: false, type: 'text' },
  apakah_aktif_menggunakan_internet_sebulan_terakhir: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui: {
    required: false,
    type: 'select',
    placeholderLabel: 'Akses Internet Melalui',
    options: ['WIFI', 'HANDPHONE', 'WIFI DAN HANDPHONE'],
  },
  kecepatan_akses_internet: {
    required: false,
    type: 'select',
    placeholderLabel: 'Kecepatan Akses Internet',
    options: ['LAMBAT', 'SEDANG', 'CEPAT'],
  },
  kondisi_pekerjaan: {
    required: true,
    type: 'select-other',
    options: ['BEKERJA', 'TIDAK BEKERJA', 'PELAJAR/MAHASISWA'],
  },
  pekerjaan_utama: {
    required: false,
    type: 'select-other',
    options: [
      'IBU RUMAH TANGGA',
      'PETANI PEMILIK LAHAN',
      'PETANI MENYEWA',
      'BURUH TANI',
      'GURU',
      'PEDAGANG',
      'PENGOLAHAN/INDUSTRI',
      'PNS',
      'PERANGKAT DESA',
      'PEGAWAI KANTOR DESA',
      'TKI',
      'PELAJAR/MAHASISWA',
    ],
  },
  jaminan_sosial_ketenagakerjaan: {
    required: true,
    type: 'select',
    options: ['PESERTA', 'BUKAN PESERTA'],
  },
  sumber_penghasilan: {
    required: true,
    type: 'multi-checkbox',
    options: [
      'TIDAK ADA',
      'PADI',
      'KOPI',
      'TEBU',
      'CABE MERAH',
      'CABE RAWIT',
      'KACANG',
      'SAYUR PAHIT',
      'SAYUR MANIS',
      'SAYUR BOLA/SAWI',
      'SAYUR BUNGA KOL',
      'TOMAT',
      'JAPAN',
      'LABU',
      'JAGUNG',
      'UBI-UBIAN',
      'TERNAK BESAR (SAPI)',
      'PERDAGANGAN',
      'WARUNG/RUMAH MAKAN',
      'PERGUDANGAN',
      'KARYAWAN TETAP',
      'TNI',
      'PNS',
      'TKI',
      'OTHER:',
    ],
  },
  jumlah_panen_pertahun_ton_kg_ekor: { required: false, type: 'text' },
  penghasilan_setahun_rp: { required: false, type: 'text', note: 'Jabarkan tiap sumber penghasilan' },
  jaminan_sosial_kesehatan: {
    required: true,
    type: 'select',
    options: ['PESERTA', 'BUKAN PESERTA'],
  },
  jika_punya: {
    required: true,
    type: 'select-other',
    placeholderLabel: 'Jenis/Status BPJS/KIS',
    options: ['MANDIRI', 'PEMERINTAH (APBD/APBN)'],
  },
  penyakit_yang_diderita_setahun_terakhir: {
    required: true,
    type: 'multi-checkbox',
    options: [
      'TIDAK ADA',
      'MALARIA',
      'HEPATITIS B',
      'GIZI BURUK',
      'JANTUNG',
      'TBC PARU',
      'KANKER/TUMOR GANAS',
      'DIABETES',
      'STROKE',
      'REMATIK',
      'HIPERTENSI (DARAH TINGGI)',
      'ASMA',
      'GAGAL GINJAL',
      'HEMOFILIA',
      'HIV/AIDS',
      'KOLESTEROL',
      'SIROSIS HATI',
      'PIKUN',
      'TALASEMIA',
      'LEUKIMIA',
      'OTHER:',
    ],
  },
  apakah_mempunyai_alergi_terhadap_obat: {
    required: false,
    type: 'select',
    note: 'Efek Samping: sesak napas (sampai tidak sadarkan diri), gatal, hidung berair, mata berair, ruam kulit, diare',
    options: ['TIDAK', 'YA'],
  },
  berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir: {
    required: false,
    type: 'faskes-grid',
  },
  apakah_ibu_sedang_mengandung: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  disabilitas: {
    required: false,
    type: 'multi-checkbox',
    options: [
      'TUNANETRA (BUTA)',
      'TUNARUNGU (TULI)',
      'TUNAWICARA (BISU)',
      'TUNADAKSA (CACAT TUBUH)',
      'TUNAGRAHITA (CACAT MENTAL, KETERBATASAN MENTAL)',
      'TUNALARAS (SAKIT JIWA)',
      'CACAT EKS SAKIT KUSTA (YANG DINYATAKAN SEMBUH OLEH DOKTER)',
      'CACAT GANDA (CACAT FISIK-MENTAL)',
      'DIPASUNG',
    ],
  },
  pendidikan_terakhir: {
    required: true,
    type: 'select-other',
    options: [
      'BELUM SEKOLAH',
      'TIDAK SEKOLAH',
      'SD DAN SEDERAJAT',
      'SMP DAN SEDERAJAT',
      'SMA DAN SEDERAJAT',
      'DIPLOMA 1-3',
      'S1 SEDERAJAT',
      'S2 SEDERAJAT',
      'S3 SEDERAJAT',
      'PENDIDIKAN NON FORMAL',
    ],
  },
  berapa_tahun_mengenyam_pendidikan_dasar_sd_smp_sma: {
    required: false,
    type: 'text',
    note: 'Yang sudah tamat SMA saja, standar 12 Tahun',
  },
  apakah_mendapatkan_layanan_desa_pada_1_tahun_terakhir: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  jika_iya_bagaimana_pelayanannya: {
    required: false,
    type: 'select-other',
    options: ['BAIK', 'CUKUP', 'BURUK'],
  },
  dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran_pada_pihak_nagari: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  dalam_setahun_terakhir_apakah_terjadi_bencana: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  apakah_anda_terkena_dampak_bencana: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  apakah_menerima_pemenuhan_kebutuhan_dasar_saat_bencana: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana: {
    required: false,
    type: 'select',
    options: ['YA', 'TIDAK'],
  },
  foto_akta_kelahiran: { required: false, type: 'photo' },
}

function normalizeDateForInput(val) {
  if (!val) return ''
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(s)) {
    const parts = s.split(/[-/.]/)
    const day = parts[0].padStart(2, '0')
    const month = parts[1].padStart(2, '0')
    const year = parts[2]
    return `${year}-${month}-${day}`
  }
  return s
}

function calculateUsiaFromTanggalLahir(val) {
  if (!val) return ''
  const s = String(val).trim()
  let birthYear = NaN
  if (/^\d{4}[-/.]/.test(s)) {
    birthYear = parseInt(s.substring(0, 4), 10)
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(s)) {
    const parts = s.split(/[-/.]/)
    birthYear = parseInt(parts[2], 10)
  } else {
    const match = s.match(/\b(19\d\d|20\d\d)\b/)
    if (match) birthYear = parseInt(match[1], 10)
  }
  const currentYear = new Date().getFullYear()
  if (!isNaN(birthYear) && birthYear > 1900 && birthYear <= currentYear) {
    return String(currentYear - birthYear)
  }
  return ''
}

function EditIndividuPage({
  person,
  onSave,
  onCancel,
  onNavigate,
  isSidebarOpen = true,
  onToggleSidebar,
  currentUser,
  onLogout,
  onOpenSettings,
  onStartCreateFamily,
  onStartCreateIndividu,
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
    const mainEl = document.querySelector('.main-content')
    if (mainEl) mainEl.scrollTop = 0
  }, [])

  const schema = fixedTableSchemaIndividu
  const isEditing = Boolean(person && person.id)

  const resolveFieldVal = (obj, fieldId) => {
    if (!obj) return ''
    let val = obj[fieldId] ?? obj[fieldId.substring(0, 63)]
    if ((val === undefined || val === null || val === '') && fieldId === 'berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir') {
      val = obj.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak ??
            obj.frekuensi_kunjungan_faskes ??
            obj.faskes ??
            obj.frekuensi_faskes ??
            ''
    }
    return val !== undefined && val !== null ? String(val) : ''
  }

  const [formData, setFormData] = useState({})
  const [missingFields, setMissingFields] = useState([])

  useEffect(() => {
    if (!person) return
    const initial = {}
    schema.forEach((field) => {
      initial[field.id] = resolveFieldVal(person, field.id)
    })
    setFormData(initial)
  }, [person])

  const sections = buildIndividuSectionsFromSchema(schema)

  const handleChange = (e) => {
    const { name, value } = e.target
    let finalValue = value
    if (typeof value === 'string') {
      const isUrlField =
        name.includes('foto') ||
        name.includes('link') ||
        name.includes('url') ||
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('data:image')
      const isDateField = name.includes('tanggal')
      if (!isUrlField && !isDateField) {
        finalValue = value.toUpperCase()
      }
    }
    setFormData((prev) => {
      const next = { ...prev, [name]: finalValue }
      if (name === 'tanggal_lahir' && value) {
        const calcUsia = calculateUsiaFromTanggalLahir(value)
        if (calcUsia) {
          next.usia = calcUsia
        }
      }
      return next
    })
  }

  const handleFocusField = (fieldId) => {
    if (!fieldId) return
    const el =
      document.getElementById(`field-${fieldId}`) ||
      document.getElementById(fieldId) ||
      document.querySelector(`[name="${fieldId}"]`)

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
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate mandatory required fields based on FIELD_CONFIG
    const missingRequired = []
    Object.entries(FIELD_CONFIG).forEach(([id, conf]) => {
      if (conf.required) {
        const val = formData[id]
        if (isFieldEmpty(val)) {
          const fieldObj = schema.find((f) => f.id === id)
          missingRequired.push({
            id,
            label: fieldObj ? fieldObj.label : id,
            section: fieldObj ? fieldObj.section : undefined,
          })
        }
      }
    })

    // Check conditional requirement: status BPJS
    const isHealthParticipant = String(formData.jaminan_sosial_kesehatan || '')
      .trim()
      .toUpperCase() === 'PESERTA'

    if (isHealthParticipant && isFieldEmpty(formData.jika_punya)) {
      if (!missingRequired.some((f) => f.id === 'jika_punya')) {
        missingRequired.push({
          id: 'jika_punya',
          label: 'Status BPJS / KIS (MANDIRI / PEMERINTAH)',
          section: 'Jaminan Kesehatan',
        })
      }
    }

    if (missingRequired.length > 0) {
      setMissingFields(missingRequired)
      return
    }

    // Pastikan seluruh data string tersimpan dalam huruf besar / CAPSLOCK (kecuali URL & Tanggal)
    const upperFormData = {}
    Object.keys(formData).forEach((k) => {
      const val = formData[k]
      if (typeof val === 'string') {
        const isUrl =
          k.includes('foto') ||
          k.includes('link') ||
          k.includes('url') ||
          val.startsWith('http://') ||
          val.startsWith('https://') ||
          val.startsWith('data:image')
        const isDate = k.includes('tanggal')
        upperFormData[k] = !isUrl && !isDate ? val.toUpperCase() : val
      } else {
        upperFormData[k] = val
      }
    })

    const payload = {
      ...upperFormData,
      id: person?.id || undefined,
      _last_updated: Date.now(),
    }

    onSave(payload)
  }

  return (
    <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage="edit_individu"
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
        onStartCreateFamily={onStartCreateFamily}
        onStartCreateIndividu={onStartCreateIndividu}
      />

      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-toggle-btn"
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
            >
              <Icon name="menu" size={20} />
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onCancel}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="chevron_left" size={16} />
              <span>Kembali</span>
            </button>
          </div>
        </header>

        {/* Pengantar & Petunjuk Pengisian */}
        <div className="panel" style={{ padding: '20px 24px', marginBottom: '8px', borderLeft: '4px solid var(--primary-teal)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ color: 'var(--primary-teal)', flexShrink: 0, marginTop: '2px' }}>
              <Icon name="info" size={20} />
            </span>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-dark)' }}>Pengantar & Petunjuk Pengisian</h2>
              <p style={{ margin: '0 0 12px', fontSize: '0.84rem', color: '#475569', lineHeight: 1.6 }}>
                Formulir ini disusun untuk mengumpulkan data kependudukan yang akurat dan komprehensif di wilayah Nagari Tabek Patah. Data yang terkumpul akan digunakan semata-mata untuk kepentingan perencanaan pembangunan, peningkatan pelayanan publik, dan penyusunan profil Nagari Tabek Patah. Informasi yang diberikan akan dijaga kerahasiaannya dan dikelola sesuai dengan peraturan perundang-undangan tentang perlindungan data pribadi. Partisipasi dan ketelitian Bapak/Ibu/Saudara/i dalam mengisi formulir ini sangat kami hargai dan menjadi dasar bagi kemajuan nagari kita bersama.
              </p>
              <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.7 }}>
                <strong>Petunjuk Pengisian:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                  <li>Harap diisi dengan huruf kapital (BESAR) yang jelas.</li>
                  <li>Beri tanda centang (✓) atau silang (X) pada pilihan yang sesuai.</li>
                  <li>Isilah semua pertanyaan sesuai dengan kondisi sebenarnya.</li>
                  <li>Untuk pertanyaan yang tidak sesuai, dapat diisi dengan garis datar (—) atau &quot;TIDAK ADA&quot;.</li>
                  <li>Kolom bertanda <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span> wajib diisi.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Single-Page Sequential Form */}
        <form onSubmit={handleSubmit} noValidate className="sequential-form-layout">
          {sections.map((section, secIdx) => (
            <section key={section.id} className="panel form-section-panel">
              <div className="section-panel-header">
                <span className="section-panel-icon">
                  <Icon name={section.icon} size={22} />
                </span>
                <div style={{ flex: 1 }}>
                  <h2>{section.title}</h2>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e2e8f0', color: '#475569', padding: '3px 10px', borderRadius: '20px' }}>
                  {secIdx + 1}/{sections.length}
                </span>
              </div>

              <div className="form-grid-sequential">
                {section.fields.map((field) => {
                  const val = formData[field.id] || ''
                  const config = FIELD_CONFIG[field.id] || {}
                  const isRequired = config.required ?? false
                  const isPhoto = isPhotoField(field.id)
                  const isLongText =
                    config.type === 'textarea' ||
                    config.type === 'faskes-grid' ||
                    field.id.includes('putus_sekolah') ||
                    field.id.includes('permasalahan')

                  // Conditional Visibility for Internet sub-fields
                  const isInternetSubField =
                    field.id === 'jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui' ||
                    field.id === 'kecepatan_akses_internet'

                  const activeInternetVal = String(formData.apakah_aktif_menggunakan_internet_sebulan_terakhir || '')
                    .trim()
                    .toUpperCase()

                  if (isInternetSubField && activeInternetVal !== 'YA') {
                    return null
                  }

                  // Conditional Visibility for BPJS/KIS sub-field (jika_punya)
                  const isBpjsDetailField = field.id === 'jika_punya'
                  const isHealthParticipant = String(formData.jaminan_sosial_kesehatan || '')
                    .trim()
                    .toUpperCase() === 'PESERTA'

                  if (isBpjsDetailField && !isHealthParticipant) {
                    return null
                  }

                  return (
                    <div
                      key={field.id}
                      className={`form-group-sequential ${isLongText || isPhoto || config.type === 'multi-checkbox' ? 'full-width' : ''}`}
                    >
                      <label htmlFor={`field-${field.id}`} style={{ display: 'block', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>
                          {field.label}
                          {isRequired && <span className="required-star" style={{ color: '#ef4444', marginLeft: '3px' }}>*</span>}
                        </span>
                        {config.note && (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>
                            ({config.note})
                          </span>
                        )}
                      </label>

                      <CustomFieldInput
                        field={field}
                        config={config}
                        val={val}
                        isPhoto={isPhoto}
                        isLongText={isLongText}
                        onChange={handleChange}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          {/* Bottom Save Action Bar (Fixed) */}
          <div className="form-bottom-actions">
            <button className="primary-button" type="submit" style={{ minWidth: '220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Icon name="save" size={18} />
              <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Data Baru'}</span>
            </button>
          </div>
        </form>

        <FormValidationModal
          missingFields={missingFields}
          onClose={() => setMissingFields([])}
          onFocusField={handleFocusField}
        />
      </main>
    </div>
  )
}

function normalizeFaskesCount(rawCount) {
  if (!rawCount && rawCount !== 0) return '0'
  const str = String(rawCount).trim().toUpperCase().replace(/KALI/gi, '').trim()
  if (
    str.includes('LEBIH') ||
    str.includes('DIATAS') ||
    str.includes('DI ATAS') ||
    str.includes('>') ||
    str === '5+' ||
    str === '+5' ||
    str === 'LEBIH DARI 5' ||
    str === 'DIATAS 5' ||
    str === 'DI ATAS 5'
  ) {
    return 'LEBIH DARI 5'
  }
  const parsed = parseInt(str, 10)
  if (!isNaN(parsed)) {
    if (parsed > 5) return 'LEBIH DARI 5'
    if (parsed >= 0 && parsed <= 5) return String(parsed)
  }
  return str || '0'
}

function FaskesGridInput({ field, config, val, onChange }) {
  const faskesRows = [
    'RUMAH SAKIT',
    'PUSKESMAS TANPA RAWAT INAP',
    'PUSKESMAS PEMBANTU',
    'POLIKLINIK',
    'TEMPAT PRAKTIK DOKTER',
    'TEMPAT PRAKTIK BIDAN',
    'APOTIK',
    'TOKO KHUSUS/JAMU',
    'TEMPAT DUKUN BAYI/BERSALIN/PARAJI',
  ]

  const colOptions = ['0', '1', '2', '3', '4', '5', 'LEBIH DARI 5']

  const matchRowName = (rawName) => {
    if (!rawName) return null
    const clean = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!clean) return null
    return faskesRows.find((r) => {
      const rClean = r.toUpperCase().replace(/[^A-Z0-9]/g, '')
      return rClean === clean || rClean.includes(clean) || clean.includes(rClean)
    })
  }

  const parseValObj = () => {
    const obj = {}
    faskesRows.forEach((r) => { obj[r] = '0' })
    if (!val || val === 'null' || val === 'undefined') return obj

    const sVal = String(val).trim().toUpperCase()
    if (!sVal || sVal.includes('TIDAK ADA KUNJUNGAN')) return obj

    // 1. Format titik dua: "RUMAH SAKIT: 5, PUSKESMAS...: DIATAS 5"
    if (sVal.includes(':')) {
      let count = 0
      sVal.split(',').forEach((item) => {
        const parts = item.split(':')
        if (parts.length >= 2) {
          const k = parts[0].trim()
          const v = parts.slice(1).join(':').trim()
          const matched = matchRowName(k)
          if (matched && v) {
            obj[matched] = normalizeFaskesCount(v)
            count++
          }
        }
      })
      if (count > 0) return obj
    }

    // 2. Format kurung: "RUMAH SAKIT (DIATAS 5 KALI)" atau "SEMUA FASILITAS KESEHATAN (DIATAS 5)"
    if (sVal.includes('(')) {
      if (sVal.includes('SEMUA FASILITAS KESEHATAN')) {
        const match = sVal.match(/\((.*?)\)/)
        const count = normalizeFaskesCount(match ? match[1] : '5')
        faskesRows.forEach((r) => { obj[r] = count })
        return obj
      }
      let count = 0
      const segments = sVal.split(';')
      segments.forEach((seg) => {
        const match = seg.match(/^(.*?)\((.*?)\)/)
        if (match) {
          const names = match[1].split(',').map((n) => n.trim())
          const c = normalizeFaskesCount(match[2])
          names.forEach((name) => {
            const matched = matchRowName(name)
            if (matched && c) {
              obj[matched] = c
              count++
            }
          })
        }
      })
      if (count > 0) return obj
    }

    // 3. Format CSV angka: "5, 5, LEBIH DARI 5, 0, 0, ..."
    if (sVal.includes(',')) {
      const items = sVal.split(',').map((s) => s.trim())
      items.forEach((item, idx) => {
        if (faskesRows[idx] && item !== '') {
          obj[faskesRows[idx]] = normalizeFaskesCount(item)
        }
      })
      return obj
    }

    // 4. Format angka/string tunggal: "5", "DIATAS 5", "LEBIH DARI 5 KALI", ">5"
    if (
      /^\d+$/.test(sVal) ||
      sVal.includes('KALI') ||
      sVal.includes('DIATAS') ||
      sVal.includes('DI ATAS') ||
      sVal.includes('LEBIH') ||
      sVal.includes('>')
    ) {
      const cleanVal = normalizeFaskesCount(sVal)
      if (cleanVal) {
        faskesRows.forEach((r) => { obj[r] = cleanVal })
      }
      return obj
    }

    return obj
  }

  const currentObj = parseValObj()

  const handleRadioSelect = (rowName, selectedCol) => {
    const nextObj = { ...currentObj, [rowName]: selectedCol }
    const combinedStr = faskesRows
      .map((r) => `${r}: ${nextObj[r] || '0'}`)
      .join(', ')
    onChange({ target: { name: field.id, value: combinedStr } })
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', marginTop: '8px', marginBottom: '12px' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.86rem',
          background: '#ffffff',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#334155', minWidth: '180px' }}>
              Fasilitas Kesehatan
            </th>
            {colOptions.map((col) => (
              <th
                key={col}
                style={{
                  padding: '12px 6px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#475569',
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  minWidth: col === 'LEBIH DARI 5' ? '95px' : '40px',
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {faskesRows.map((rowName, rIdx) => {
            const selectedCol = currentObj[rowName] || ''
            return (
              <tr
                key={rowName}
                style={{
                  background: rIdx % 2 === 0 ? '#ffffff' : '#f9fafb',
                  borderBottom: rIdx < faskesRows.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1e293b', fontSize: '0.86rem' }}>
                  {rowName}
                </td>
                {colOptions.map((col) => {
                  const isChecked = String(selectedCol).toUpperCase() === String(col).toUpperCase()
                  return (
                    <td
                      key={col}
                      onClick={() => handleRadioSelect(rowName, col)}
                      style={{
                        padding: '8px 4px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isChecked ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name={'faskes_' + field.id + '_' + rIdx}
                        checked={isChecked}
                        onChange={() => handleRadioSelect(rowName, col)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#047857' }}
                      />
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function parseMultiValue(val, standardOpts = []) {
  if (!val) return { selectedStandard: [], customText: '' }
  let remaining = String(val).trim()
  if (!remaining) return { selectedStandard: [], customText: '' }

  // Sort standardOpts by length descending so longer strings match first
  const sortedOpts = [...standardOpts].sort((a, b) => b.length - a.length)
  const selectedStandard = []

  for (const opt of sortedOpts) {
    const optTrimmed = opt.trim()
    if (!optTrimmed) continue

    const idx = remaining.toUpperCase().indexOf(optTrimmed.toUpperCase())
    if (idx !== -1) {
      selectedStandard.push(opt)
      // Remove matched opt from remaining text
      remaining = remaining.substring(0, idx) + remaining.substring(idx + optTrimmed.length)
    }
  }

  // Clean customText: replace leftover delimiters like commas, semicolons, extra spaces
  const customText = remaining
    .replace(/^[\s,;]+|[\s,;]+$/g, '')
    .replace(/[\s,;]{2,}/g, ', ')
    .trim()
    .toUpperCase()

  return { selectedStandard, customText }
}

function MultiCheckboxInput({ field, config, val, onChange }) {
  const hasOtherInConfig = config.options.some((o) => o.toUpperCase() === 'OTHER:' || o.toUpperCase() === 'LAINNYA')
  const standardOpts = useMemo(
    () => config.options.filter((o) => o.toUpperCase() !== 'OTHER:' && o.toUpperCase() !== 'LAINNYA'),
    [config.options]
  )

  const { selectedStandard, customText } = useMemo(
    () => parseMultiValue(val, standardOpts),
    [val, standardOpts]
  )

  const [isOtherChecked, setIsOtherChecked] = useState(Boolean(customText))
  const [otherText, setOtherText] = useState(customText)

  useEffect(() => {
    setIsOtherChecked(Boolean(customText))
    setOtherText(customText)
  }, [customText])

  const isOptSelected = (opt) => selectedStandard.some((v) => v.toUpperCase() === opt.toUpperCase())

  const updateCombinedValue = (newStandardArr, isOther, textValue) => {
    const combined = newStandardArr.map((s) => s.toUpperCase())
    if (isOther && textValue && textValue.trim()) {
      combined.push(textValue.trim().toUpperCase())
    }
    onChange({ target: { name: field.id, value: combined.join(', ') } })
  }

  const handleStandardToggle = (opt, isChecked) => {
    const nextStandard = isChecked
      ? [...selectedStandard, opt]
      : selectedStandard.filter((o) => o.toUpperCase() !== opt.toUpperCase())
    updateCombinedValue(nextStandard, isOtherChecked, otherText)
  }

  const handleOtherToggle = (isChecked) => {
    setIsOtherChecked(isChecked)
    if (!isChecked) {
      setOtherText('')
      updateCombinedValue(selectedStandard, false, '')
    } else {
      updateCombinedValue(selectedStandard, true, otherText)
    }
  }

  const handleOtherTextChange = (e) => {
    const text = e.target.value.toUpperCase()
    setOtherText(text)
    updateCombinedValue(selectedStandard, isOtherChecked, text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px', width: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px 12px', width: '100%' }}>
        {standardOpts.map((opt) => {
          const isChecked = isOptSelected(opt)
          return (
            <label
              key={opt}
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${isChecked ? 'var(--primary-teal)' : '#cbd5e1'}`,
                background: isChecked ? '#f0fdf4' : '#ffffff',
                color: isChecked ? '#047857' : '#334155',
                fontWeight: isChecked ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.86rem',
                width: '100%',
                minHeight: '50px',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                boxShadow: isChecked ? '0 1px 3px rgba(4,120,87,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
              }}
            >
              <input
                type="checkbox"
                name={`${field.id}_chk_${opt}`}
                checked={isChecked}
                onChange={(e) => handleStandardToggle(opt, e.target.checked)}
                style={{ flexShrink: 0, width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }}
              />
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35, wordBreak: 'break-word' }}>{opt}</span>
            </label>
          )
        })}

        {hasOtherInConfig && (
          <label
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${isOtherChecked ? 'var(--primary-teal)' : '#cbd5e1'}`,
              background: isOtherChecked ? '#f0fdf4' : '#ffffff',
              color: isOtherChecked ? '#047857' : '#334155',
              fontWeight: isOtherChecked ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.86rem',
              width: '100%',
              minHeight: '50px',
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
              userSelect: 'none',
              boxShadow: isOtherChecked ? '0 1px 3px rgba(4,120,87,0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            <input
              type="checkbox"
              name={`${field.id}_chk_other`}
              checked={isOtherChecked}
              onChange={(e) => handleOtherToggle(e.target.checked)}
              style={{ flexShrink: 0, width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }}
            />
            <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>LAINNYA (SEBUTKAN)</span>
          </label>
        )}
      </div>

      {hasOtherInConfig && isOtherChecked && (
        <input
          type="text"
          value={otherText}
          onChange={handleOtherTextChange}
          placeholder="Tuliskan keterangan lainnya secara spesifik (HURUF BESAR)..."
          autoFocus
          style={{ width: '100%', marginTop: '4px', textTransform: 'uppercase' }}
        />
      )}
    </div>
  )
}

function SelectOtherInput({ field, config, val, onChange }) {
  const isRequired = config.required ?? false

  const standardOpts = config.options.filter((o) => o.toUpperCase() !== 'OTHER:' && o.toUpperCase() !== 'LAINNYA')
  const matchedOpt = standardOpts.find((opt) => opt.toUpperCase() === String(val || '').trim().toUpperCase())
  const isCustomAnswer = Boolean(val && !matchedOpt)

  const [mode, setMode] = useState(() => (isCustomAnswer ? 'other' : 'select'))
  const [otherText, setOtherText] = useState(() => (isCustomAnswer ? String(val).toUpperCase() : ''))

  useEffect(() => {
    const isCustom = Boolean(val && !standardOpts.some((o) => o.toUpperCase() === String(val).trim().toUpperCase()))
    if (isCustom) {
      setMode('other')
      setOtherText(String(val).toUpperCase())
    } else {
      setMode('select')
    }
  }, [val])

  const handleSelect = (e) => {
    const v = e.target.value
    if (v === 'OTHER_TRIGGER') {
      setMode('other')
      setOtherText('')
      onChange({ target: { name: field.id, value: '' } })
    } else {
      setMode('select')
      onChange({ target: { name: field.id, value: v.toUpperCase() } })
    }
  }

  const handleOtherText = (e) => {
    const text = e.target.value.toUpperCase()
    setOtherText(text)
    onChange({ target: { name: field.id, value: text } })
  }

  const handleReturnToSelect = () => {
    setMode('select')
    setOtherText('')
    onChange({ target: { name: field.id, value: '' } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {mode === 'select' ? (
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <select
            id={`field-${field.id}`}
            name={field.id}
            value={matchedOpt ? matchedOpt.toUpperCase() : ''}
            onChange={handleSelect}
            required={isRequired && !val}
            style={{ width: '100%', textTransform: 'uppercase' }}
          >
            <option value="">-- PILIH {field.label.toUpperCase()} --</option>
            {standardOpts.map((opt) => (
              <option key={opt} value={opt.toUpperCase()}>
                {opt.toUpperCase()}
              </option>
            ))}
            <option value="OTHER_TRIGGER">+ LAINNYA (ISIAN MANUAL / SEBUTKAN)</option>
          </select>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <input
              id={`field-${field.id}`}
              type="text"
              name={field.id}
              value={otherText}
              onChange={handleOtherText}
              placeholder={`Tuliskan ${field.label} lainnya (HURUF BESAR)...`}
              required={isRequired}
              autoFocus
              style={{ flex: 1, textTransform: 'uppercase' }}
            />
            <button
              type="button"
              onClick={handleReturnToSelect}
              className="secondary-button"
              style={{ fontSize: '0.82rem', padding: '0 14px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="menu" size={14} />
              <span>Kembali ke Pilihan Dropdown</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoUploadInput({ field, config, val, onChange }) {
  const isRequired = config.required ?? false
  const [activeMode, setActiveMode] = useState('upload') // 'upload' | 'url'

  const rawValStr = String(val || '').trim()
  const hasPhoto = rawValStr !== '' && rawValStr !== 'null' && rawValStr !== 'undefined' && rawValStr !== '-'

  const previewUrl = getGoogleDriveThumbnailUrl(val)
  const isDataUrl = String(val || '').startsWith('data:image')
  const isDriveUrl =
    String(val || '').includes('drive.google.com') ||
    String(val || '').includes('googleusercontent.com')

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar (maksimal 10 MB). Mohon pilih foto lain.')
      return
    }

    try {
      const dataUrl = await fileToDataURL(file)
      onChange({ target: { name: field.id, value: dataUrl } })
    } catch (err) {
      console.error('Gagal membaca file foto:', err)
      alert('Gagal memproses file foto.')
    }
  }

  const handleClear = () => {
    onChange({ target: { name: field.id, value: '' } })
  }

  return (
    <div
      className="photo-upload-box"
      style={{
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '16px',
        background: '#ffffff',
        marginTop: '6px',
      }}
    >
      {!hasPhoto ? (
        <>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              style={{
                background: activeMode === 'upload' ? 'var(--primary-teal)' : '#f1f5f9',
                color: activeMode === 'upload' ? '#ffffff' : '#334155',
                fontWeight: 600,
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon name="upload" size={16} />
              <span>Unggah File Foto</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('url')}
              style={{
                background: activeMode === 'url' ? 'var(--primary-teal)' : '#f1f5f9',
                color: activeMode === 'url' ? '#ffffff' : '#334155',
                fontWeight: 600,
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon name="link" size={16} />
              <span>Tautan Google Drive / URL</span>
            </button>
          </div>

          {activeMode === 'upload' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <label
                htmlFor={`file-upload-${field.id}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  border: '2px dashed var(--line)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  textAlign: 'center',
                  gap: '8px',
                }}
              >
                <Icon name="upload" size={24} style={{ color: 'var(--primary-teal)' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Pilih file gambar dari komputer/HP
                </span>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Format JPG, PNG, WEBP (Maks 10 MB)
                </span>
              </label>
              <input
                id={`file-upload-${field.id}`}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
              <input
                id={`field-${field.id}`}
                type="url"
                name={field.id}
                value={val}
                onChange={onChange}
                placeholder="Tempelkan Tautan Google Drive Foto (Contoh: https://drive.google.com/file/d/...)..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}
                required={isRequired && !val}
              />
            </div>
          )}
        </>
      ) : (
        /* Live Preview Card */
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '84px',
              height: '84px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid #cbd5e1',
              background: '#e2e8f0',
            }}
          >
            <img
              src={previewUrl}
              alt={field.label}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = getGoogleDriveFallbackUrl(val)
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  background: isDataUrl ? '#dcfce7' : isDriveUrl ? '#e0f2fe' : '#f1f5f9',
                  color: isDataUrl ? '#15803d' : isDriveUrl ? '#0369a1' : '#334155',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Icon name={isDataUrl ? 'check' : 'link'} size={12} />
                <span>{isDataUrl ? 'Foto Tersimpan (Local)' : isDriveUrl ? 'Tautan Google Drive' : 'URL Foto'}</span>
              </span>
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                color: '#64748b',
                wordBreak: 'break-all',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {isDataUrl ? 'Foto tersimpan secara langsung di database lokal.' : val}
            </span>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              {isDriveUrl && (
                <a
                  href={String(val)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary-button btn-xs"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Icon name="link" size={14} />
                  <span>Buka Google Drive</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="secondary-button btn-xs"
                style={{ color: '#ef4444', borderColor: '#fca5a5' }}
              >
                Hapus / Ganti Foto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CustomFieldInput({ field, config, val, isPhoto, isLongText, onChange }) {
  const isRequired = config.required ?? false

  if (config.type === 'faskes-grid') {
    return <FaskesGridInput field={field} config={config} val={val} onChange={onChange} />
  }

  if (config.type === 'date' || field.id === 'tanggal_lahir') {
    const normalizedVal = normalizeDateForInput(val)
    return (
      <input
        id={'field-' + field.id}
        type="date"
        name={field.id}
        value={normalizedVal}
        onChange={onChange}
        style={{ width: '100%' }}
      />
    )
  }

  // Handle Photo Upload / Drive Link Component
  if (isPhoto) {
    return <PhotoUploadInput field={field} config={config} val={val} onChange={onChange} />
  }

  // Handle Multi-Checkbox
  if (config.type === 'multi-checkbox') {
    return <MultiCheckboxInput field={field} config={config} val={val} onChange={onChange} />
  }

  // Handle Select with "Other: (Custom Answer)"
  if (config.type === 'select-other') {
    return <SelectOtherInput field={field} config={config} val={val} onChange={onChange} />
  }

  // Handle Standard Select (Case-Insensitive Match)
  if (config.type === 'select') {
    const matched = config.options.find(
      (opt) => opt.toUpperCase() === String(val || '').trim().toUpperCase()
    )
    const currentVal = matched ? matched.toUpperCase() : (val ? String(val).toUpperCase() : '')

    return (
      <select
        id={`field-${field.id}`}
        name={field.id}
        value={currentVal}
        onChange={onChange}
        style={{ width: '100%', textTransform: 'uppercase' }}
      >
        <option value="">-- PILIH {field.label.toUpperCase()} --</option>
        {config.options.map((opt) => (
          <option key={opt} value={opt.toUpperCase()}>
            {opt.toUpperCase()}
          </option>
        ))}
      </select>
    )
  }

  // Handle Textarea
  if (isLongText) {
    return (
      <textarea
        id={`field-${field.id}`}
        name={field.id}
        value={val}
        onChange={onChange}
        rows={3}
        placeholder={`Isikan ${field.label}...`}
        style={{ width: '100%', textTransform: 'uppercase' }}
      />
    )
  }

  // Default Text Input
  return (
    <input
      id={`field-${field.id}`}
      type="text"
      name={field.id}
      value={val}
      onChange={onChange}
      placeholder={`Isikan ${field.label}...`}
      style={{ width: '100%', textTransform: 'uppercase' }}
    />
  )
}

export default EditIndividuPage
