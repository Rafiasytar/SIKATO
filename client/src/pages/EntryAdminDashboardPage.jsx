import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon'
import Sidebar from '../components/Sidebar'
import { fetchActivityLogs } from '../services/api'

function EntryAdminDashboardPage({
  currentUser,
  rows = [],
  rowsIndividu = [],
  onStartCreateFamily,
  onStartCreateIndividu,
  onOpenUploadModal,
  onNavigate,
  isSidebarOpen,
  onToggleSidebar,
  onLogout,
  onOpenSettings,
}) {
  const [logs, setLogs] = useState([])
  const adminName = currentUser?.full_name || currentUser?.username || 'Admin'

  useEffect(() => {
    fetchActivityLogs()
      .then((data) => {
        if (Array.isArray(data)) {
          const myFname = String(currentUser?.full_name || '').toLowerCase().trim()
          const myUname = String(currentUser?.username || '').toLowerCase().trim()

          // Filter ALL logs belonging to this specific admin
          const myLogs = data.filter((l) => {
            const uName = String(l.user_name || l.userName || '').toLowerCase().trim()
            if (!uName) return false
            return (
              (myFname && uName.includes(myFname)) ||
              (myUname && uName.includes(myUname)) ||
              (myFname && myFname.includes(uName)) ||
              (myUname && myUname.includes(uName))
            )
          })
          setLogs(myLogs)
        }
      })
      .catch(() => {})
  }, [adminName, currentUser])

  // Count records added by this admin (strictly matching admin creator tags or specific admin activity logs)
  const myFamilyCount = useMemo(() => {
    if (!currentUser) return 0
    const uname = String(currentUser.username || '').toLowerCase().trim()
    const fname = String(currentUser.full_name || '').toLowerCase().trim()

    // 1. Count from database rows created strictly by this admin
    const rowMatches = rows.filter((r) => {
      const createdByAdmin = String(r.created_by_admin || '').toLowerCase().trim()
      const createdByName = String(r.created_by_name || '').toLowerCase().trim()

      if (createdByAdmin) return createdByAdmin === uname
      if (createdByName) return createdByName === fname
      return false
    }).length

    // 2. Count from CREATE activity logs for family / KK created by this admin
    const logMatches = logs.filter((l) => {
      const logUser = String(l.user_name || l.userName || '').toLowerCase().trim()
      const isMyUser = (uname && logUser === uname) || (fname && logUser === fname)
      const isCreate = String(l.action_type || l.actionType || '').toUpperCase() === 'CREATE'
      const desc = String(l.description || '').toLowerCase()
      const isFamilyDesc = desc.includes('kk') || desc.includes('keluarga') || desc.includes('sensus')
      return isMyUser && isCreate && isFamilyDesc
    }).length

    return Math.max(rowMatches, logMatches)
  }, [rows, logs, currentUser])

  const myIndividuCount = useMemo(() => {
    if (!currentUser) return 0
    const uname = String(currentUser.username || '').toLowerCase().trim()
    const fname = String(currentUser.full_name || '').toLowerCase().trim()

    // 1. Count from database rowsIndividu created strictly by this admin
    const rowMatches = rowsIndividu.filter((r) => {
      const createdByAdmin = String(r.created_by_admin || '').toLowerCase().trim()
      const createdByName = String(r.created_by_name || '').toLowerCase().trim()

      if (createdByAdmin) return createdByAdmin === uname
      if (createdByName) return createdByName === fname
      return false
    }).length

    // 2. Count from CREATE activity logs for individu created by this admin
    const logMatches = logs.filter((l) => {
      const logUser = String(l.user_name || l.userName || '').toLowerCase().trim()
      const isMyUser = (uname && logUser === uname) || (fname && logUser === fname)
      const isCreate = String(l.action_type || l.actionType || '').toUpperCase() === 'CREATE'
      const desc = String(l.description || '').toLowerCase()
      const isIndividuDesc = desc.includes('individu')
      return isMyUser && isCreate && isIndividuDesc
    }).length

    return Math.max(rowMatches, logMatches)
  }, [rowsIndividu, logs, currentUser])

  return (
    <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage="home"
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
      />

      <main className="main-content">
        {/* Mobile / Desktop Header Topbar */}
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
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Portal Entry Data</p>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Dashboard Entry Admin</h2>
            </div>
          </div>
        </header>

        {/* Top Header Greeting Banner */}
        <div
          className="panel"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: '#ffffff',
            padding: '20px clamp(16px, 3vw, 28px)',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(13, 148, 136, 0.25)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                Akses Khusus Entry Data
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', fontWeight: 800, color: '#ffffff' }}>
              Selamat Datang, {adminName}! 👋
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.84rem', opacity: 0.9, lineHeight: 1.4 }}>
              Portal Khusus Petugas Enumerator / Entry Data Sensus Nagari Tabek Patah.
            </p>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            className="panel"
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Data Keluarga Ditambahkan
              </span>
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="home" size={20} />
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {myFamilyCount} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>KK</span>
            </div>
          </div>

          <div
            className="panel"
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Data Individu Ditambahkan
              </span>
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="user-check" size={20} />
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {myIndividuCount} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Orang</span>
            </div>
          </div>

          <div
            className="panel"
            style={{
              padding: '20px',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--line)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Total Kontribusi Input
              </span>
              <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="layers" size={20} />
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
              {myFamilyCount + myIndividuCount} <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Entri</span>
            </div>
          </div>
        </div>

        {/* Primary Entry Action Buttons Grid */}
        <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Aksi Utama Input Data
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          {/* Card 1: Add Family */}
          <div
            className="panel"
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1.5px solid rgba(13, 148, 136, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <span
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                  flexShrink: 0,
                }}
              >
                <Icon name="plus" size={22} />
              </span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Tambah Data Keluarga
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Isi kuesioner profil keluarga baru (deskripsi keluarga, aset, bansos, UMKM, sanitasi).
                </p>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={onStartCreateFamily}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.86rem',
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Icon name="plus" size={16} />
              <span>Input Data Keluarga Baru</span>
            </button>
          </div>

          {/* Card 2: Add Individu */}
          <div
            className="panel"
            style={{
              padding: '24px',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1.5px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <span
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  flexShrink: 0,
                }}
              >
                <Icon name="user_plus" size={22} />
              </span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Tambah Data Individu
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Isi kuesioner detail anggota keluarga (NIK, usia, pendidikan, pekerjaan, BPJS).
                </p>
              </div>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={onStartCreateIndividu}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.86rem',
                justifyContent: 'center',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              }}
            >
              <Icon name="plus" size={16} />
              <span>Input Data Individu Baru</span>
            </button>
          </div>
        </div>

        {/* Personal Activity Log */}
        <div
          className="panel"
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Icon name="clock" size={18} style={{ color: '#0d9488' }} />
            <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Riwayat Input Saya Terakhir
            </h3>
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Belum ada riwayat aktivitas input data untuk akun ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.slice(0, 5).map((log, i) => (
                <div
                  key={log.id || i}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    <strong>{log.action_type || log.actionType}</strong>: {log.description}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default EntryAdminDashboardPage
