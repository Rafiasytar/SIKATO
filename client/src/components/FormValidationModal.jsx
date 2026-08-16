import Icon from './Icon'

function FormValidationModal({ missingFields, onClose, onFocusField }) {
  if (!missingFields || missingFields.length === 0) return null

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 11000 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25), 0 0 0 1.5px rgba(239, 68, 68, 0.4)',
          border: '1.5px solid rgba(239, 68, 68, 0.3)',
          animation: 'popupGlassEntrance 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 6px 18px rgba(239, 68, 68, 0.35)',
              flexShrink: 0,
            }}
          >
            <Icon name="bencana" size={24} />
          </div>
          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 900,
                color: '#dc2626',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: '3px 9px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '4px',
              }}
            >
              ⚠️ Validasi Pengisian Formulir
            </span>
            <h3 style={{ margin: '2px 0 0', fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', fontFamily: 'var(--font-heading)' }}>
              {missingFields.length} Kolom Wajib Belum Diisi!
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', lineHeight: '1.45' }}>
              Daftar kolom di bawah ini wajib dilengkapi sebelum data dapat disimpan ke database:
            </p>
          </div>
        </div>

        {/* Missing Fields List Container */}
        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            background: 'var(--bg-main, #f8fafc)',
            borderRadius: '14px',
            padding: '12px',
            border: '1px solid var(--line, #e2e8f0)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {missingFields.map((field, idx) => (
            <div
              key={field.id || idx}
              onClick={() => {
                if (onFocusField && field.id) onFocusField(field.id)
                onClose()
              }}
              title="Klik untuk langsung menuju ke kolom ini"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.83rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              className="missing-field-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {idx + 1}
                </span>
                <strong style={{ color: 'var(--text-main, #0f172a)', fontWeight: 700 }}>{field.label || field.id}</strong>
              </div>
              {field.section && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#b91c1c',
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                  }}
                >
                  {field.section}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'var(--bg-main, #f1f5f9)',
              color: 'var(--text-main, #334155)',
              border: '1px solid var(--line, #cbd5e1)',
              cursor: 'pointer',
            }}
          >
            Tutup & Periksa
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              if (onFocusField && missingFields.length > 0 && missingFields[0].id) {
                onFocusField(missingFields[0].id)
              }
              onClose()
            }}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🎯 Arahkan Ke Kolom Pertama</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FormValidationModal
