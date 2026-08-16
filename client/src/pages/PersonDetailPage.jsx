import { useEffect, useMemo, useState } from 'react'
import HouseLocationMapModal from '../components/HouseLocationMapModal'
import Icon from '../components/Icon'
import Sidebar from '../components/Sidebar'
import { buildSectionsFromSchema } from '../data/formSectionSchema'
import { fixedTableSchema } from '../data/tableSchema'
import { fetchIndividuRows } from '../services/api'
import { readCachedRows } from '../utils/dataCache'
import { getGoogleDriveFallbackUrl, getGoogleDriveThumbnailUrl, isPhotoField } from '../utils/imageHelper'

function PersonDetailPage({ row: propsRow, allRows = [], allIndividuRows = [], onViewDetailIndividu, onBack, onNavigate, onStartEdit, isSidebarOpen, onToggleSidebar, currentUser, onLogout, onOpenSettings }) {
  const [localIndividuRows, setLocalIndividuRows] = useState(() => {
    if (Array.isArray(allIndividuRows) && allIndividuRows.length > 0) return allIndividuRows
    return readCachedRows('bi_tabek_patah_rows_individu') || []
  })

  useEffect(() => {
    window.scrollTo(0, 0)
    const mainEl = document.querySelector('.main-content')
    if (mainEl) mainEl.scrollTop = 0

    if (Array.isArray(allIndividuRows) && allIndividuRows.length > 0) {
      setLocalIndividuRows(allIndividuRows)
    } else {
      fetchIndividuRows()
        .then((res) => {
          if (Array.isArray(res) && res.length > 0) {
            setLocalIndividuRows(res)
          }
        })
        .catch(() => {})
    }
  }, [allIndividuRows])

  const [zoomImage, setZoomImage] = useState(null)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const schema = fixedTableSchema

  const row = propsRow || (() => {
    try {
      const saved = localStorage.getItem('bi_tabek_patah_selected_person')
      if (saved) return JSON.parse(saved)
    } catch {}
    return (allRows && allRows.length > 0) ? allRows[0] : null
  })()

  if (!row) {
    return (
      <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
        <Sidebar
          activePage="crud"
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
            <h2>Data tidak ditemukan.</h2>
            <button className="primary-button" type="button" onClick={onBack} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="chevron_left" size={16} />
              <span>Kembali</span>
            </button>
          </div>
        </main>
      </div>
    )
  }

  const sections = buildSectionsFromSchema(schema)

  const categorizedIds = new Set(sections.flatMap((s) => s.fields.map((f) => f.id)))
  const uncategorized = schema.filter((f) => !categorizedIds.has(f.id))
  if (uncategorized.length > 0) {
    sections[0].fields.push(...uncategorized)
  }

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const personName = row.nama_kepala_keluarga || row.nama_responden || 'Responden'

  return (
    <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage="crud"
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
            <button className="secondary-button" type="button" onClick={onBack}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="chevron_left" size={16} />
              <span>Kembali</span>
            </button>
          </div>
          <div className="toolbar status-toolbar">
            <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
              No. KK: {row.nomor_kk || '-'}
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
              <p className="eyebrow">Detail Responden Sensus</p>
              <h1 className="detail-hero-name">{personName}</h1>
              <div className="detail-hero-meta-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: '12px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="rumah" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Alamat:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.alamat_lengkap || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="identitas" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Responden:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.nama_responden || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="kawasan_nagari" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>No. HP:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.nomor_hp || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="pendidikan" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Enumerator:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.nama_enumerator_mahasiswa || '-'}</strong>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}><Icon name="pkh" size={15} /></span>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Periode:</span>
                  <strong style={{ color: '#1e293b', fontWeight: 700 }}>{row.periode_pendataan || '-'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-hero-actions">
            {onStartEdit && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onStartEdit(row)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Icon name="file_text" size={16} />
                Edit Data
              </button>
            )}
            <button
              type="button"
              className="primary-button"
              onClick={() => setIsMapModalOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Icon name="map" size={16} />
              Peta Lokasi
            </button>
          </div>
        </section>

                {/* Family Members Connected Section */}
        {(() => {
          const cleanNum = (str) => String(str || '').replace(/[^0-9]/g, '').trim()
          const cleanStr = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim()

          const targetKk = cleanNum(row.nomor_kk)
          const targetKepala = cleanStr(row.nama_kepala_keluarga || row.nama_responden)

          // 1. PRIMARY: Match strictly by exact Nomor KK (prioritas utama agar tidak bentrok nama sama)
          let familyMembers = []
          if (targetKk && targetKk.length >= 6) {
            familyMembers = (localIndividuRows || []).filter((ind) => {
              const indKk = cleanNum(ind.nomor_kk)
              return indKk === targetKk
            })
          }

          // 2. SECONDARY: Fallback hanya jika nomor KK kosong / belum ada kecocokan
          if ((!familyMembers || familyMembers.length === 0) && targetKepala && targetKepala.length >= 3) {
            familyMembers = (localIndividuRows || []).filter((ind) => {
              const indKk = cleanNum(ind.nomor_kk)
              const indKepala = cleanStr(ind.nama_kepala_keluarga)
              // Jangan tarik anggota yang jelas-jelas punya nomor KK berbeda
              if (targetKk && indKk && indKk !== targetKk) return false
              return indKepala === targetKepala
            })
          }

          return (
            <section className="panel" style={{ padding: '20px 24px', marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-teal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}>
                    <Icon name="keluarga" size={22} />
                  </span>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-dark)' }}>
                    Daftar Anggota Keluarga
                  </h2>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '20px' }}>
                  {familyMembers.length} Anggota Terdaftar
                </span>
              </div>

              {familyMembers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                  {familyMembers.map((member, mIdx) => (
                    <div
                      key={member.id || mIdx}
                      onClick={() => onViewDetailIndividu && onViewDetailIndividu(member)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #e2e8f0',
                        background: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary-teal)'
                        e.currentTarget.style.background = '#f0fdf4'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0'
                        e.currentTarget.style.background = '#ffffff'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                      title="Klik untuk melihat Detail Identitas Individu"
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon name="user" size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.nama || member.nama_kepala_keluarga || 'Anggota Keluarga'}
                        </h4>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          NIK: <strong>{member.nomor_nik || '-'}</strong>
                        </div>
                        {member.jenis_kelamin && (
                          <div style={{ fontSize: '0.74rem', color: '#0d9488', marginTop: '2px', fontWeight: 500 }}>
                            {member.jenis_kelamin} {member.usia ? `• ${member.usia} Thn` : ''}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.9rem', color: 'var(--primary-teal)', fontWeight: 700 }}>→</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Belum ada anggota keluarga terdaftar di Data Individu dengan No. KK ({row.nomor_kk || '-'}).
                </div>
              )}
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

        {/* GIS Map Modal */}
        {isMapModalOpen && (
          <HouseLocationMapModal
            personName={personName}
            alamat={row.alamat_lengkap}
            coordX={row.titik_koordinat_x}
            coordY={row.titik_koordinat_y}
            onClose={() => setIsMapModalOpen(false)}
          />
        )}

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
  const proxyUrl = `/api/sensus/image-proxy?url=${encodeURIComponent(url)}`

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
                {item.count === 'Lebih dari 5' || item.count === '> 5' ? '> 5 kali' : `${item.count} kali`}
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

export default PersonDetailPage
