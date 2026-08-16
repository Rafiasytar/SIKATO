import { useState } from 'react'
import { INDIVIDU_SECTIONS_CONFIG } from '../data/formSectionSchemaIndividu'

function IndividuDetailModal({ row, schema, onClose, onFullDetail }) {
  const [activeTab, setActiveTab] = useState('deskripsi-individu')

  if (!row) return null

  const schemaMap = new Map(schema.map((f) => [f.id, f]))

  const currentSection =
    INDIVIDU_SECTIONS_CONFIG.find((sec) => sec.id === activeTab) || INDIVIDU_SECTIONS_CONFIG[0]

  const currentFields = currentSection.fieldIds
    .map((id) => schemaMap.get(id))
    .filter(Boolean)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="eyebrow">Detail Penduduk Individu</span>
            <h2>{row.nama || row.nama_kepala_keluarga || 'Detail Individu'}</h2>
            <p className="modal-sub">
              <strong>NIK:</strong> {row.nomor_nik || '-'} | <strong>No. KK:</strong>{' '}
              {row.nomor_kk || '-'} ({row.nama_kepala_keluarga || '-'})
            </p>
          </div>
          <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Tutup modal">
            ✕
          </button>
        </header>

        <nav className="modal-tabs">
          {INDIVIDU_SECTIONS_CONFIG.map((sec) => (
            <button
              key={sec.id}
              type="button"
              className={`modal-tab-btn ${activeTab === sec.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(sec.id)}
            >
              {sec.title}
            </button>
          ))}
        </nav>

        <div className="modal-body">
          <div className="detail-grid">
            {currentFields.map((field) => {
              const val = row[field.id]
              const isMedia =
                ['foto_akta_kelahiran'].includes(field.id) && val

              return (
                <div className={`detail-item ${isMedia ? 'is-media-item' : ''}`} key={field.id}>
                  <span className="detail-label">{field.label}</span>
                  <div className="detail-value">
                    {val !== undefined && val !== null && String(val).trim() !== '' ? (
                      isMedia && String(val).startsWith('http') ? (
                        <a href={val} target="_blank" rel="noopener noreferrer" className="detail-link">
                          📎 Lihat Lampiran Foto / Berkas
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

        <footer className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onFullDetail ? (
            <button className="primary-button btn-sm" type="button" onClick={onFullDetail}>
              Buka Halaman Detail Penuh →
            </button>
          ) : <div />}
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

export default IndividuDetailModal
