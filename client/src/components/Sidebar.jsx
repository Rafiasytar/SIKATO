import Icon from './Icon'

const mainNav = [
  { id: 'home', icon: 'home', label: 'Dashboard Utama' },
  { id: 'crud', icon: 'crud', label: 'Kelola Data Keluarga' },
  { id: 'crud_individu', icon: 'user', label: 'Kelola Data Individu' },
  { id: 'map', icon: 'map', label: 'Peta Spasial (GIS)' },
]

const categoryNav = [
  { id: 'cat:sanitasi', icon: 'sanitasi', label: 'Sanitasi' },
  { id: 'cat:air_bersih', icon: 'air_bersih', label: 'Penerima Air Bersih' },
  { id: 'cat:pendidikan', icon: 'pendidikan', label: 'Pendidikan' },
  { id: 'cat:stunting', icon: 'stunting', label: 'Stunting' },
  { id: 'cat:pkh', icon: 'pkh', label: 'Penerima PKH' },
  { id: 'cat:blt_kesra', icon: 'blt_kesra', label: 'Penerima BLT Kesra' },
  { id: 'cat:bapanas', icon: 'bapanas', label: 'Penerima Bapanas' },
  { id: 'cat:blt_nagari', icon: 'blt_nagari', label: 'Penerima BLT Nagari' },
  { id: 'cat:sumber_daya_air', icon: 'sumber_daya_air', label: 'Sumber Daya Air' },
  { id: 'cat:kawasan_nagari', icon: 'kawasan_nagari', label: 'Kawasan Nagari' },
]

function Sidebar({ activePage, onNavigate, isSidebarOpen = true, onToggleSidebar, currentUser, onLogout, onOpenSettings, onStartCreateFamily, onStartCreateIndividu }) {
  const isSuperAdmin = Boolean(
    currentUser &&
      (currentUser.username.toLowerCase() === 'admin' ||
        String(currentUser.role || '').toLowerCase().includes('super')),
  )

  const handleMobileClick = (action) => {
    if (typeof action === 'function') action()
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && onToggleSidebar) {
      onToggleSidebar()
    }
  }

  return (
    <>
      {isSidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onToggleSidebar}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${!isSidebarOpen ? 'is-collapsed' : ''}`} aria-label="Navigasi utama">
        <div className="brand">
          {isSidebarOpen && (
            <img src="/sikato-logo.png" alt="SIKATO Logo" className="brand-logo-img" style={{ width: '50px', height: '50px', objectFit: 'contain', filter: 'drop-shadow(0 3px 8px rgba(13, 148, 136, 0.35))' }} />
          )}
          {isSidebarOpen && (
            <div>
              <strong style={{ fontSize: '1.08rem', letterSpacing: '0.04em' }}>SIKATO</strong>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Kependudukan & Topografi</span>
            </div>
          )}
          <button
            className="sidebar-toggle-btn"
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
          >
            <Icon name={isSidebarOpen ? 'chevron_left' : 'chevron_right'} size={16} />
          </button>
        </div>

        <nav className="nav-list" aria-label="Menu dashboard">
          {isSuperAdmin ? (
            <>
              {isSidebarOpen && <div className="nav-group-label">NAVIGASI UTAMA</div>}
              {mainNav.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item nav-button ${activePage === item.id ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handleMobileClick(() => onNavigate(item.id))}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon name={item.icon} size={18} />
                  </span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              ))}

              {isSidebarOpen && (
                <div className="nav-group-label" style={{ marginTop: '8px' }}>
                  HALAMAN KATEGORI
                </div>
              )}
              {categoryNav.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item nav-button nav-sub-cat ${activePage === item.id ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => handleMobileClick(() => onNavigate(item.id))}
                  title={!isSidebarOpen ? item.label : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon name={item.icon} size={18} />
                  </span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </>
          ) : (
            <>
              {isSidebarOpen && <div className="nav-group-label">MENU INPUT ENTRY DATA</div>}
              <button
                className={`nav-item nav-button ${activePage === 'home' ? 'is-active' : ''}`}
                type="button"
                onClick={() => handleMobileClick(() => onNavigate('home'))}
                title={!isSidebarOpen ? 'Dashboard Input' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon name="home" size={18} />
                </span>
                {isSidebarOpen && <span>Dashboard Input</span>}
              </button>

              <button
                className={`nav-item nav-button ${activePage === 'edit' ? 'is-active' : ''}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleMobileClick(() => {
                    if (onStartCreateFamily) onStartCreateFamily()
                    else if (onNavigate) onNavigate('edit')
                  })
                }}
                title={!isSidebarOpen ? 'Tambah Data Keluarga' : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon name="plus" size={18} />
                </span>
                {isSidebarOpen && <span>Tambah Data Keluarga</span>}
              </button>

              <button
                className={`nav-item nav-button ${activePage === 'edit_individu' ? 'is-active' : ''}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  handleMobileClick(() => {
                    if (onStartCreateIndividu) onStartCreateIndividu()
                    else if (onNavigate) onNavigate('edit_individu')
                  })
                }}
                title={!isSidebarOpen ? 'Tambah Data Individu' : undefined}
              >
              <span className="nav-icon" aria-hidden="true">
                <Icon name="user_plus" size={18} />
              </span>
              {isSidebarOpen && <span>Tambah Data Individu</span>}
            </button>
          </>
        )}
      </nav>

      {/* Admin User & Settings Footer Section */}
      <div className="sidebar-auth-box" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.12)' }}>
        {currentUser ? (
          isSidebarOpen ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {/* Row 1: User Profile Card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="user" size={16} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.84rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.full_name || currentUser.username}
                  </strong>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
                </div>
              </div>

              {/* Row 2: Equal Action Buttons Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f1f5f9',
                    height: '36px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Pengaturan Akun & Tema"
                >
                  <Icon name="settings" size={15} />
                  <span>Pengaturan</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  style={{
                    background: 'rgba(239, 68, 68, 0.22)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    height: '36px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  title="Keluar / Logout"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={onOpenSettings}
                className="nav-item nav-button"
                title="Pengaturan (Akun & Tema)"
                style={{ justifyContent: 'center' }}
              >
                <Icon name="settings" size={16} />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="nav-item nav-button"
                title={`Logout (${currentUser.username})`}
                style={{ justifyContent: 'center', color: '#ef4444' }}
              >
                <Icon name="user" size={16} />
              </button>
            </div>
          )
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`nav-item nav-button ${activePage === 'login' ? 'is-active' : ''}`}
              onClick={() => onNavigate('login')}
              title="Login Admin System"
              style={{ flex: 1, background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.3) 0%, rgba(15, 118, 110, 0.4) 100%)', border: '1px solid rgba(13, 148, 136, 0.5)', color: '#5eead4' }}
            >
              <span className="nav-icon" aria-hidden="true">
                <Icon name="user" size={16} />
              </span>
              {isSidebarOpen && <span style={{ fontWeight: 700, fontSize: '0.78rem' }}>Login Admin</span>}
            </button>

            {isSidebarOpen && (
              <button
                type="button"
                onClick={onOpenSettings}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  color: '#e2e8f0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Pengaturan Tema"
              >
                <Icon name="settings" size={16} />
              </button>
            )}
          </div>
        )}
      </div>

    </aside>
  </>
)
}

export default Sidebar
