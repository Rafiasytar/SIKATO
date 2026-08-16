import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import Sidebar from '../components/Sidebar'
import { buildIndividuSectionsFromSchema } from '../data/formSectionSchemaIndividu'
import { fixedTableSchemaIndividu } from '../data/individuTableSchema'
import { fetchSensusRows } from '../services/api'
import { readCachedRows } from '../utils/dataCache'
import { getGoogleDriveFallbackUrl, getGoogleDriveThumbnailUrl, isPhotoField } from '../utils/imageHelper'

function IndividuDetailPage({
  row: propsRow,
  allRows = [],
  allFamilyRows = [],
  onViewDetailFamily,
  onBack,
  onNavigate,
  onStartEdit,
  isSidebarOpen,
  onToggleSidebar,
  currentUser,
  onLogout,
  onOpenSettings,
}) {
  const [localFamilyRows, setLocalFamilyRows] = useState(() => {
    if (Array.isArray(allFamilyRows) && allFamilyRows.length > 0) return allFamilyRows
    return readCachedRows('bi_tabek_patah_rows') || []
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    const mainEl = document.querySelector('.main-content')
    if (mainEl) mainEl.scrollTop = 0

    if (Array.isArray(allFamilyRows) && allFamilyRows.length > 0) {
      setLocalFamilyRows(allFamilyRows)
    } else {
      fetchSensusRows()
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setLocalFamilyRows(res)
          }
        })
        .catch(() => {})
    }
  }, [allFamilyRows])

  const [zoomImage, setZoomImage] = useState(null)
  const schema = fixedTableSchemaIndividu

  const row = propsRow || (() => {
    try {
      const saved = localStorage.getItem('bi_tabek_patah_selected_individu')
      if (saved) return JSON.parse(saved)
    } catch {}
    return (allRows && allRows.length > 0) ? allRows[0] : null
  })()

  if (!row) {
    return (
      <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
        <Sidebar
          activePage="crud_individu"
          onNavigate={onNavigate}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={onToggleSidebar}
          currentUser={currentUser}
          onLogout={onLogout}
          onOpenSettings={onOpenSettings}
        />
        <main className="main-content">
          <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <span style={{ color: '#94a3b8', marginBottom: '12px', display: 'block' }}>
              <Icon name="info" size={32} />
            </span>
            <h2>Data individu tidak ditemukan.</h2>
            <button className="primary-button" type="button" onClick={() => onNavigate ? onNavigate('crud_individu') : (onBack && onBack())} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="chevron_left" size={16} />
              <span>Kembali</span>
            </button>
          </div>
        </main>
      </div>
    )
  }

  const sections = buildIndividuSectionsFromSchema(schema)

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const personName = row.nama || row.nama_kepala_keluarga || 'Individu'

  return (
    <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage="crud_individu"
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
      />

      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="secondary-button"
              type="button"
              onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon name="chevron_left" size={16} />
              <span>Kembali</span>
            </button>
          </div>
          <div className="toolbar status-toolbar">
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              NIK: {row.nomor_nik || '-'} | No. KK: {row.nomor_kk || '-'}
            </span>
          </div>
        </header>

        {/* Hero Summary Card */}
        <section className="panel detail-hero-card">
          <div className="detail-hero-left">
            <div className="detail-hero-avatar">
              <Icon name="user" size={30} />
            </div>
            <div className="detail-hero-info">
              <p className="eyebrow">Detail Penduduk Individu</p>
              <h1 className="detail-hero-name">{personName}</h1>
              <div className="detail-hero-meta-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: '12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="identitas" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Kepala KK:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.nama_kepala_keluarga || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="user" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Gender & Usia:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.jenis_kelamin || '-'} {row.usia ? `(${row.usia} Thn)` : ''}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="ekonomi" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Pekerjaan:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.pekerjaan_utama || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="pendidikan" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Pendidikan:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.pendidikan_terakhir || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="blt_kesra" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>BPJS:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.jika_punya || row.jaminan_sosial_kesehatan || '-'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-hero-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch', minWidth: '180px' }}>
            {onStartEdit && (
              <button
                type="button"
                className="primary-button"
                onClick={() => onStartEdit(row)}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
              >
                <Icon name="file_text" size={16} />
                Edit Data Individu
              </button>
            )}
          </div>
        </section>

        {/* Connected Family Data Header Card */}
        {(() => {
          const cleanNum = (str) => String(str || '').replace(/[^0-9]/g, '').trim()
          const cleanStr = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()

          const targetKk = cleanNum(row.nomor_kk)
          const targetKepala = cleanStr(row.nama_kepala_keluarga)

          // 1. PRIMARY: Match strictly by exact Nomor KK
          let familyRecord = null
          if (targetKk && targetKk.length >= 6) {
            familyRecord = (localFamilyRows || []).find((f) => {
              const fKk = cleanNum(f.nomor_kk)
              return fKk === targetKk
            })
          }

          // 2. SECONDARY: Fallback hanya jika nomor KK belum ada kecocokan
          if (!familyRecord && targetKepala && targetKepala.length >= 3) {
            familyRecord = (localFamilyRows || []).find((f) => {
              const fKk = cleanNum(f.nomor_kk)
              const fKepala = cleanStr(f.nama_kepala_keluarga || f.nama_responden)
              if (targetKk && fKk && fKk !== targetKk) return false
              return fKepala === targetKepala
            })
          }

          if (!familyRecord) return null

          return (
            <section className="panel" style={{ padding: '16px 22px', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-teal)', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="keluarga" size={22} />
                </span>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Data Keluarga Terhubung
                  </span>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    KK: {familyRecord.nama_kepala_keluarga || row.nama_kepala_keluarga || 'Kepala Keluarga'} (No. KK: {familyRecord.nomor_kk || row.nomor_kk || '-'})
                  </h3>
                  {familyRecord.alamat_lengkap && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      Jorong / Alamat: <strong>{familyRecord.alamat_lengkap}</strong>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="secondary-button btn-sm"
                onClick={() => onViewDetailFamily && onViewDetailFamily(familyRecord)}
                style={{ background: '#ffffff', borderColor: 'var(--primary-teal)', color: 'var(--primary-teal)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title={`Lihat Detail Data KK: ${familyRecord.nama_kepala_keluarga || 'Kepala Keluarga'}`}
              >
                <Icon name="eye" size={14} />
                <span>Lihat Detail Data Keluarga →</span>
              </button>
            </section>
          )
        })()}

        {/* Sticky Section Jump Navigation */}
        <nav className="panel quick-nav-panel">
          <span className="quick-nav-label">
            <Icon name="menu" size={15} />
            <span>Navigasi</span>
          </span>
          <div className="quick-nav-buttons">
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className="secondary-button btn-xs quick-jump-btn"
                onClick={() => scrollToSection(sec.id)}
              >
                <Icon name={sec.icon} size={14} />
                <span>{sec.title}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* All Data Sections */}
        <div className="detail-sections-container">
          {sections.map((sec, secIdx) => (
            <section key={sec.id} id={sec.id} className="panel detail-section-panel">
              {/* Section Header */}
              <div className="section-panel-header">
                <span className="section-panel-icon">
                  <Icon name={sec.icon} size={22} />
                </span>
                <div style={{ flex: 1 }}>
                  <h2>{sec.title}</h2>
                </div>
                <span className="section-counter-badge">
                  {secIdx + 1}/{sections.length}
                </span>
              </div>

              {/* Data Grid */}
              <div className="detail-grid-spacious">
                {sec.fields.map((field) => {
                  const val = row[field.id]
                  const isPhoto = isPhotoField(field.id)
                  const isFaskes = field.id.includes('fasilitas_kesehatan') || field.id.includes('faskes')
                  const rawUrl = String(val || '').trim()
                  const hasValue = val !== undefined && val !== null && String(val).trim() !== ''
                  const fieldKey = (field.id || '').toLowerCase().trim()
                  const isMulti = MULTI_CHECKBOX_FIELDS.has(fieldKey)
                  const isLong = isPhoto || isFaskes || isMulti || (hasValue && String(val).length > 80)

                  return (
                    <div
                      key={field.id}
                      className={`detail-card-item ${isLong ? 'full-width' : ''} ${!hasValue ? 'is-empty' : ''}`}
                    >
                      <span className="detail-label-clean">{field.label}</span>
                      <div className="detail-value-clean">
                        {hasValue ? (
                          isPhoto ? (
                            <PhotoFieldViewer
                              label={field.label}
                              url={rawUrl}
                              onZoom={(src) => setZoomImage({ label: field.label, url: src })}
                            />
                          ) : isFaskes ? (
                            <FaskesFrequencyViewer val={val} />
                          ) : (
                            <MultiSelectFieldValue val={val} fieldId={field.id} />
                          )
                        ) : (
                          <span className="val-empty">
                            <Icon name="info" size={13} />
                            <em>Tidak diisi</em>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Lightbox Zoom Modal */}
        {zoomImage && (
          <div className="modal-backdrop" onClick={() => setZoomImage(null)}>
            <div className="photo-zoom-card" onClick={(e) => e.stopPropagation()}>
              <header className="modal-header">
                <div>
                  <span className="eyebrow">Pratinjau Foto Dokumen</span>
                  <h2>{zoomImage.label} — {personName}</h2>
                </div>
                <button className="modal-close-btn" type="button" onClick={() => setZoomImage(null)}>✕</button>
              </header>
              <div className="photo-zoom-body">
                <img src={zoomImage.url} alt={zoomImage.label} className="zoomed-img" />
              </div>
              <footer className="modal-footer">
                <a
                  href={zoomImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                >
                  <Icon name="link" size={16} />
                  Buka Berkas Asli di Tab Baru
                </a>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function PhotoFieldViewer({ label, url, onZoom }) {
  const primaryUrl = getGoogleDriveThumbnailUrl(url)
  const fallbackUrl = getGoogleDriveFallbackUrl(url)
  const proxyUrl = `/api/individu/image-proxy?url=${encodeURIComponent(url)}`

  const [imgSrc, setImgSrc] = useState(primaryUrl)
  const [hasFailed, setHasFailed] = useState(false)

  const handleImageError = () => {
    if (imgSrc === primaryUrl && fallbackUrl) {
      setImgSrc(fallbackUrl)
    } else if (imgSrc === fallbackUrl) {
      setImgSrc(proxyUrl)
    } else {
      setHasFailed(true)
    }
  }

  if (!url || typeof url !== 'string' || !url.trim()) return null

  return (
    <div className="photo-card-direct">
      {!hasFailed ? (
        <div className="photo-img-container" onClick={() => onZoom(imgSrc || url)}>
          <img
            src={imgSrc}
            alt={label}
            className="direct-photo-img"
            onError={handleImageError}
            loading="lazy"
          />
          <span className="photo-zoom-hint">
            <Icon name="image" size={14} />
            Klik untuk Perbesar Foto
          </span>
        </div>
      ) : (
        <div className="photo-fallback-card" onClick={() => window.open(url, '_blank')}>
          <div className="fallback-badge-text">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <Icon name="camera" size={16} />
              Buka Foto Terlampir di Google Drive ↗
            </span>
            <small>Klik untuk melihat berkas asli di Google Drive</small>
          </div>
        </div>
      )}

      <div className="photo-card-footer">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="drive-btn-link"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Icon name="link" size={14} />
          Buka Tautan Google Drive Original
        </a>
      </div>
    </div>
  )
}

function parseFaskesData(val) {
  const faskesRows = [
    'Rumah Sakit',
    'Puskesmas Tanpa Rawat Inap',
    'Puskesmas Pembantu',
    'Poliklinik',
    'Tempat Praktik Dokter',
    'Tempat Praktik Bidan',
    'Apotik',
    'Toko Khusus/Jamu',
    'Tempat Dukun Bayi/Bersalin/Paraji',
  ]

  const obj = {}
  faskesRows.forEach((r) => { obj[r] = '0' })
  if (!val || val === 'null' || val === 'undefined') {
    return { list: faskesRows.map((r) => ({ name: r, count: '0', isActive: false })), activeCount: 0 }
  }

  const sVal = String(val).trim()
  if (!sVal || sVal.toLowerCase().includes('tidak ada')) {
    return { list: faskesRows.map((r) => ({ name: r, count: '0', isActive: false })), activeCount: 0 }
  }

  const matchRowName = (rawName) => {
    if (!rawName) return null
    const clean = rawName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!clean) return null
    return faskesRows.find((r) => {
      const rClean = r.toLowerCase().replace(/[^a-z0-9]/g, '')
      return rClean === clean || rClean.includes(clean) || clean.includes(rClean)
    })
  }

  const normalizeCountDisplay = (raw) => {
    if (!raw && raw !== 0) return '0'
    const s = String(raw).trim().toUpperCase().replace(/KALI/gi, '').trim()
    if (
      s.includes('LEBIH') ||
      s.includes('DIATAS') ||
      s.includes('DI ATAS') ||
      s.includes('>') ||
      s === '5+' ||
      s === '+5' ||
      s === 'LEBIH DARI 5'
    ) {
      return 'Lebih dari 5'
    }
    const num = parseInt(s, 10)
    if (!isNaN(num)) {
      if (num > 5) return 'Lebih dari 5'
      return String(num)
    }
    return s || '0'
  }

  if (sVal.includes(':')) {
    sVal.split(',').forEach((item) => {
      const parts = item.split(':')
      if (parts.length >= 2) {
        const k = parts[0].trim()
        const v = parts.slice(1).join(':').trim()
        const matched = matchRowName(k)
        if (matched) {
          obj[matched] = normalizeCountDisplay(v)
        }
      }
    })
  } else if (sVal.includes('(')) {
    const segments = sVal.split(';')
    segments.forEach((seg) => {
      const match = seg.match(/^(.*?)\((.*?)\)/)
      if (match) {
        const names = match[1].split(',').map((n) => n.trim())
        const c = normalizeCountDisplay(match[2])
        names.forEach((name) => {
          const matched = matchRowName(name)
          if (matched) obj[matched] = c
        })
      }
    })
  } else {
    const clean = normalizeCountDisplay(sVal)
    faskesRows.forEach((r) => { obj[r] = clean })
  }

  const list = faskesRows.map((r) => {
    const rawC = obj[r] || '0'
    const isAct = rawC !== '0' && rawC !== '-' && !rawC.toLowerCase().includes('tidak')
    return {
      name: r,
      count: rawC,
      isActive: Boolean(isAct),
    }
  })

  const activeCount = list.filter((item) => item.isActive).length

  return { list, activeCount }
}

function FaskesFrequencyViewer({ val }) {
  const { list, activeCount } = useMemo(() => parseFaskesData(val), [val])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '4px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '8px',
          background: activeCount > 0 ? '#f0fdf4' : '#f8fafc',
          border: `1.5px solid ${activeCount > 0 ? '#bbf7d0' : '#e2e8f0'}`,
          fontSize: '0.84rem',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span style={{ color: activeCount > 0 ? '#15803d' : '#64748b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="check" size={15} />
          {activeCount > 0
            ? `Terdapat ${activeCount} fasilitas kesehatan yang didatangi dalam setahun terakhir:`
            : 'Tidak ada catatan kunjungan ke fasilitas kesehatan dalam setahun terakhir (0 kunjungan)'}
        </span>
        <span
          style={{
            background: activeCount > 0 ? 'var(--primary-teal, #0d9488)' : '#94a3b8',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.75rem',
            padding: '3px 12px',
            borderRadius: '20px',
          }}
        >
          {activeCount > 0 ? `${activeCount} Faskes Dikunjungi` : '0 Kunjungan'}
        </span>
      </div>

      {/* Grid of Facility Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '8px 10px',
          width: '100%',
        }}
      >
        {list.map((item) => {
          const isVisited = item.isActive
          return (
            <div
              key={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: `1.5px solid ${isVisited ? 'var(--primary-teal, #0d9488)' : '#e2e8f0'}`,
                background: isVisited ? '#f0fdfa' : '#ffffff',
                boxShadow: isVisited ? '0 1px 3px rgba(13, 148, 136, 0.12)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isVisited ? 'var(--primary-teal, #0d9488)' : '#cbd5e1',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '0.83rem',
                    fontWeight: isVisited ? 700 : 500,
                    color: isVisited ? '#0f172a' : '#475569',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.name}
                </span>
              </div>

              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: isVisited ? '#dcfce7' : '#f1f5f9',
                  color: isVisited ? '#15803d' : '#64748b',
                  border: `1px solid ${isVisited ? '#86efac' : '#e2e8f0'}`,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
              </span>
            </div>
          )
        })}
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

  return <span className="val-text">{str}</span>
}

export default IndividuDetailPage
