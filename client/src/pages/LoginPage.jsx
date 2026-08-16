import { useState } from 'react'
import Icon from '../components/Icon'
import { loginAdmin } from '../services/api'

function LoginPage({ onLoginSuccess, onBack, theme, onToggleTheme }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.')
      return
    }

    try {
      setIsLoading(true)
      setError('')
      const result = await loginAdmin(username, password)
      if (result.success && result.user) {
        const normalizedUser = {
          ...result.user,
          role: String(result.user.role || '').toLowerCase().includes('super') ? 'Super Admin' : 'Admin',
        }
        onLoginSuccess(normalizedUser)
      } else {
        setError('Login gagal. Silakan periksa kembali data Anda.')
      }
    } catch (err) {
      // Fallback for offline testing with default admin credentials
      if (username.trim().toLowerCase() === 'admin' && password === 'admin123') {
        const dummyUser = {
          username: 'admin',
          full_name: 'Administrator Nagari',
          role: 'Super Admin',
        }
        onLoginSuccess(dummyUser)
      } else {
        setError(err.message || 'Username atau password salah.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page-container">
      {/* Top Left Navigation Back Button */}
      {onBack && (
        <button type="button" className="login-back-btn" onClick={onBack}>
          <Icon name="chevron_left" size={16} />
          <span>Kembali</span>
        </button>
      )}

      {/* Top Right Direct Theme Switcher Toggle (Sun / Moon) */}
      {onToggleTheme && (
        <button
          type="button"
          className="login-theme-toggle-btn"
          onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      )}

      {/* Main Centered Login Card */}
      <div className="login-card-panel">
        {/* Brand Icon Header */}
        <div className="login-badge-header" style={{ marginBottom: '18px' }}>
          <img src="/sikato-logo.png" alt="SIKATO Logo" style={{ width: '115px', height: '115px', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(13, 148, 136, 0.35))' }} />
        </div>

        <h1 className="login-title">SIKATO Admin Login</h1>
        <p className="login-subtitle">Sistem Informasi Kependudukan & Topografi Nagari Tabek Patah</p>

        {/* Error Alert Message */}
        {error && (
          <div className="login-error-alert">
            <Icon name="info" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* USERNAME Field */}
          <div className="login-form-group">
            <label htmlFor="login-username">USERNAME</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <Icon name="user" size={16} />
              </span>
              <input
                id="login-username"
                type="text"
                className="login-input-field"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* PASSWORD Field */}
          <div className="login-form-group">
            <label htmlFor="login-password">PASSWORD</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <Icon name="save" size={16} />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="login-eye-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                <Icon name="info" size={16} />
              </button>
            </div>
          </div>



          {/* Submit Button */}
          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <span>Masuk Sistem</span>
                <span className="btn-arrow">→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <footer className="login-footer" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <img src="/logo-tanah-datar.png" alt="Logo Kab. Tanah Datar" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} title="Kabupaten Tanah Datar" />
            <img src="/sikato-logo.png" alt="SIKATO Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(13,148,136,0.3))' }} title="SIKATO Nagari Tabek Patah" />
            <img src="/logo-unand.png" alt="Logo Universitas Andalas" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} title="Universitas Andalas" />
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.3 }}>
            <strong style={{ display: 'block', color: '#0f172a', fontWeight: 700 }}>© 2026 Pemerintahan Nagari Tabek Patah</strong>
            <span>Dikembangkan oleh Tim KKN Universitas Andalas Reguler Periode 2 Tahun 2026</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LoginPage
