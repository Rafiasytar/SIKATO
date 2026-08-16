import React from 'react'
import { cleanupOversizedDataCache } from '../utils/dataCache'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.warn('⚠️ Auto-cleaning cache & recovering from render exception:', error)
    try {
      cleanupOversizedDataCache()
      localStorage.removeItem('bi_tabek_patah_editing_person')
      localStorage.removeItem('bi_tabek_patah_editing_individu')
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-card, #ffffff)', borderRadius: '12px', margin: '20px', border: '1px solid #fca5a5' }}>
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>⚠️ Terjadi Kesalahan Tampilan</h3>
          <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.88rem', marginBottom: '14px' }}>
            Aplikasi mengalami kendala sementara saat memuat komponen ini.
          </p>
          {this.state.error && (
            <div style={{ margin: '12px 0', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.78rem', textAlign: 'left', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>
              <strong>Error Details:</strong> {this.state.error.toString()}
              {this.state.error.stack && <div style={{ fontSize: '0.7rem', marginTop: '6px', opacity: 0.8 }}>{this.state.error.stack}</div>}
            </div>
          )}
          <button
            type="button"
            className="primary-button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Muat Ulang Komponen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
