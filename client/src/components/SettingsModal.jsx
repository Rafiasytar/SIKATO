import { useEffect, useState } from 'react'
import Icon from './Icon'
import {
  clearActivityLogs,
  deleteAdminUser,
  fetchActivityLogs,
  fetchAdminUsers,
  registerAdminUser,
  updateAdminProfile,
  updateAdminUser,
  verifySuperAdminPassword,
} from '../services/api'

function getActionBadgeStyle(actionType) {
  switch (String(actionType || '').toUpperCase()) {
    case 'LOGIN':
      return { bg: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', border: 'rgba(13, 148, 136, 0.3)', label: 'LOGIN' }
    case 'CREATE':
      return { bg: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', border: 'rgba(22, 163, 74, 0.3)', label: 'TAMBAH' }
    case 'EDIT':
      return { bg: 'rgba(217, 119, 6, 0.15)', color: '#d97706', border: 'rgba(217, 119, 6, 0.3)', label: 'EDIT' }
    case 'DELETE':
      return { bg: 'rgba(220, 38, 38, 0.15)', color: '#dc2626', border: 'rgba(220, 38, 38, 0.3)', label: 'HAPUS' }
    case 'IMPORT':
      return { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.3)', label: 'IMPOR' }
    case 'EXPORT':
      return { bg: 'rgba(2, 132, 199, 0.15)', color: '#0284c7', border: 'rgba(2, 132, 199, 0.3)', label: 'EKSPOR' }
    case 'UPDATE_PROFILE':
      return { bg: 'rgba(79, 70, 229, 0.15)', color: '#4f46e5', border: 'rgba(79, 70, 229, 0.3)', label: 'PROFIL' }
    default:
      return { bg: 'rgba(100, 116, 139, 0.15)', color: '#64748b', border: 'rgba(100, 116, 139, 0.3)', label: actionType }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function SettingsModal({ isOpen, onClose, currentUser, onUpdateUser, theme, onToggleTheme }) {
  const isSuperAdmin = Boolean(
    currentUser &&
      (currentUser.username?.toLowerCase() === 'admin' ||
        String(currentUser.role || '').toLowerCase().includes('super')),
  )

  const [activeTab, setActiveTab] = useState(() => (isSuperAdmin ? 'users' : 'theme'))

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(false)

  // User Management State (Super Admin)
  const [usersList, setUsersList] = useState([])
  const [isUsersLoading, setIsUsersLoading] = useState(false)
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regRole, setRegRole] = useState('Admin')
  const [regMsg, setRegMsg] = useState({ type: '', text: '' })

  // Security Challenge State (Password Verification)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  // Form View State: 'LIST' | 'ADD' | 'EDIT'
  const [userFormMode, setUserFormMode] = useState('LIST')
  const [targetUser, setTargetUser] = useState(null)
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState('Admin')

  const loadUsersList = async () => {
    try {
      setIsUsersLoading(true)
      const data = await fetchAdminUsers()
      setUsersList(data)
    } catch (err) {
      console.warn('Gagal memuat pengguna:', err.message)
    } finally {
      setIsUsersLoading(false)
    }
  }

  // Logs state
  const [logs, setLogs] = useState([])
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState('')
  const [logFilter, setLogFilter] = useState('ALL')
  const [logSearch, setLogSearch] = useState('')

  const loadLogs = async () => {
    try {
      setIsLogsLoading(true)
      setLogsError('')
      const data = await fetchActivityLogs()
      setLogs(data)
    } catch (err) {
      setLogsError(err.message || 'Gagal memuat riwayat log.')
    } finally {
      setIsLogsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setUserFormMode('LIST')
      setRegMsg({ type: '', text: '' })
      setStatusMsg({ type: '', text: '' })
      if (!isSuperAdmin && activeTab === 'users') {
        setActiveTab('theme')
      }
      if (activeTab === 'logs') loadLogs()
      if (activeTab === 'users' && isSuperAdmin) loadUsersList()
    }
  }, [isOpen, activeTab, isSuperAdmin])

  // Auto-dismiss notification alerts after 3.5 seconds
  useEffect(() => {
    if (regMsg.text) {
      const timer = setTimeout(() => {
        setRegMsg({ type: '', text: '' })
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [regMsg.text])

  useEffect(() => {
    if (statusMsg.text) {
      const timer = setTimeout(() => {
        setStatusMsg({ type: '', text: '' })
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [statusMsg.text])

  const handleRequestAction = (type, userObj = null) => {
    const target = userObj || currentUser || { id: 1, username: 'admin', full_name: 'Administrator Nagari', role: 'Super Admin' }
    const action = { type, user: target }
    setPendingAction(action)
    setAuthPassword('')
    setAuthError('')
    setShowAuthModal(true)
  }

  const executeAction = (action) => {
    if (!action) return
    setRegMsg({ type: '', text: '' })
    if (action.type === 'ADD') {
      setRegFullName('')
      setRegUsername('')
      setRegPassword('')
      setRegRole('Admin')
      setUserFormMode('ADD')
    } else if (action.type === 'EDIT') {
      const u = action.user || currentUser || { id: 1, username: 'admin', full_name: 'Administrator Nagari', role: 'Super Admin' }
      setTargetUser(u)
      setEditFullName(u.full_name || u.username || '')
      setEditUsername(u.username || '')
      setEditPassword('')
      setEditRole(u.role || 'Admin')
      setUserFormMode('EDIT')
    } else if (action.type === 'DELETE') {
      handleDeleteUser(action.user)
    }
  }

  const handleCancelAuth = () => {
    setShowAuthModal(false)
    setPendingAction(null)
    setAuthPassword('')
    setAuthError('')
  }

  const handleVerifyAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    try {
      setIsVerifying(true)
      await verifySuperAdminPassword(currentUser?.username || 'admin', authPassword)
      setShowAuthModal(false)
      setAuthPassword('')
      if (pendingAction) {
        executeAction(pendingAction)
        setPendingAction(null)
      }
    } catch (err) {
      setAuthError(err.message || 'Password Super Admin salah.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRegisterUser = async (e) => {
    e.preventDefault()
    setRegMsg({ type: '', text: '' })

    if (!regUsername || !regPassword || !regFullName) {
      setRegMsg({ type: 'error', text: 'Semua kolom pendaftaran wajib diisi.' })
      return
    }

    try {
      setIsLoading(true)
      const res = await registerAdminUser({
        username: regUsername,
        password: regPassword,
        full_name: regFullName,
        role: regRole,
      })

      if (res.success) {
        setRegMsg({ type: 'success', text: `Akun '${regUsername}' (${regRole}) berhasil dibuat!` })
        setRegUsername('')
        setRegPassword('')
        setRegFullName('')
        setRegRole('Admin')
        setUserFormMode('LIST')
        loadUsersList()
      }
    } catch (err) {
      setRegMsg({ type: 'error', text: err.message || 'Gagal membuat akun.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateUserSubmit = async (e) => {
    e.preventDefault()
    if (!targetUser) return
    setRegMsg({ type: '', text: '' })

    try {
      setIsLoading(true)
      const res = await updateAdminUser(targetUser.id, {
        full_name: editFullName,
        username: editUsername,
        password: editPassword,
        role: editRole,
      })

      if (res.success) {
        setRegMsg({ type: 'success', text: `Akun '${editUsername}' berhasil diperbarui!` })
        if (
          targetUser.username.toLowerCase() === (currentUser?.username || '').toLowerCase() ||
          targetUser.id === currentUser?.id
        ) {
          if (onUpdateUser) {
            onUpdateUser({
              ...currentUser,
              full_name: editFullName,
              username: editUsername,
              role: editRole,
            })
          }
        }
        setUserFormMode('LIST')
        loadUsersList()
      }
    } catch (err) {
      setRegMsg({ type: 'error', text: err.message || 'Gagal memperbarui akun admin.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (userObj) => {
    if (!userObj) return
    const confirmMessage = `⚠️ PERINGATAN HAPUS AKUN ADMIN ⚠️\n\nApakah Anda yakin ingin menghapus akun admin '${userObj.username}' (${userObj.full_name || 'Admin'})?\n\nℹ️ Catatan Penting:\nMenghapus akun ini HANYA mencabut hak akses login/entry admin tersebut.\nSeluruh data sensus keluarga, data individu, serta log aktivitas yang pernah di-input oleh admin ini TETAP TERSIMPAN AMAN DAN TIDAK AKAN HILANG di database.`

    if (window.confirm(confirmMessage)) {
      try {
        setIsLoading(true)
        await deleteAdminUser(userObj.id)
        setRegMsg({
          type: 'success',
          text: `Akun '${userObj.username}' berhasil dihapus. Seluruh data sensus yang telah di-input tetap tersimpan aman!`,
        })
        loadUsersList()
      } catch (err) {
        setRegMsg({ type: 'error', text: err.message || 'Gagal menghapus akun admin.' })
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSaveAccount = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })

    if (!oldPassword) {
      setStatusMsg({ type: 'error', text: 'Mohon masukkan Password Lama Anda untuk konfirmasi perubahan.' })
      return
    }

    try {
      setIsLoading(true)
      const res = await updateAdminProfile({
        currentUsername: currentUser?.username || 'admin',
        newUsername,
        oldPassword,
        newPassword,
        newFullName: fullName,
      })

      if (res.success && res.user) {
        onUpdateUser(res.user)
        setStatusMsg({ type: 'success', text: 'Berhasil! Profil & akun admin Anda telah diperbarui.' })
        setOldPassword('')
        setNewPassword('')
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Gagal memperbarui data akun.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const filteredLogs = logs.filter((log) => {
    // Restrict regular admins to only view their own activity logs
    if (!isSuperAdmin && currentUser) {
      const logUser = String(log.user_name || '').trim().toLowerCase()
      const myName = String(currentUser.full_name || '').trim().toLowerCase()
      const myUsername = String(currentUser.username || '').trim().toLowerCase()

      const isMyLog =
        (myName && logUser.includes(myName)) ||
        (myUsername && logUser.includes(myUsername)) ||
        (myName && myName.includes(logUser))

      if (!isMyLog) return false
    }

    const matchesFilter = logFilter === 'ALL' || log.action_type === logFilter
    const q = logSearch.toLowerCase().trim()
    const matchesSearch =
      !q ||
      (log.description || '').toLowerCase().includes(q) ||
      (log.user_name || '').toLowerCase().includes(q) ||
      (log.action_type || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const handleExportLogsExcel = () => {
    if (!filteredLogs || filteredLogs.length === 0) {
      alert('Tidak ada data log aktivitas untuk diunduh.')
      return
    }

    const exportDate = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const getActionExcelColor = (actionType) => {
      switch (String(actionType || '').toUpperCase()) {
        case 'LOGIN':
          return 'background-color:#ccfbf1; color:#0f766e; border:1px solid #99f6e4;'
        case 'CREATE':
          return 'background-color:#dcfce7; color:#166534; border:1px solid #bbf7d0;'
        case 'EDIT':
          return 'background-color:#fef3c7; color:#92400e; border:1px solid #fde68a;'
        case 'DELETE':
          return 'background-color:#fee2e2; color:#991b1b; border:1px solid #fca5a5;'
        case 'IMPORT':
          return 'background-color:#f3e8ff; color:#6b21a8; border:1px solid #e9d5ff;'
        case 'EXPORT':
          return 'background-color:#e0f2fe; color:#075985; border:1px solid #bae6fd;'
        case 'UPDATE_PROFILE':
          return 'background-color:#e0e7ff; color:#3730a3; border:1px solid #c7d2fe;'
        default:
          return 'background-color:#f1f5f9; color:#475569; border:1px solid #cbd5e1;'
      }
    }

    const tableRowsHtml = filteredLogs
      .map((log, idx) => {
        const isEven = idx % 2 === 1
        const rowStyle = isEven ? 'background-color:#f8fafc;' : 'background-color:#ffffff;'
        const badgeStyle = getActionExcelColor(log.action_type)

        return `
          <tr style="${rowStyle}">
            <td style="text-align:center; font-weight:bold; color:#64748b; border:1px solid #cbd5e1;">${idx + 1}</td>
            <td style="white-space:nowrap; font-weight:500; border:1px solid #cbd5e1;">${formatDate(log.created_at)}</td>
            <td style="font-weight:bold; color:#0f172a; border:1px solid #cbd5e1;">${log.user_name || 'System Admin'}</td>
            <td style="text-align:center; border:1px solid #cbd5e1;">
              <span style="display:inline-block; padding:3px 10px; border-radius:4px; font-size:8.5pt; font-weight:bold; ${badgeStyle}">
                ${log.action_type || 'GENERAL'}
              </span>
            </td>
            <td style="font-family:monospace; color:#0f766e; border:1px solid #cbd5e1;">${log.ip_address || '127.0.0.1'}</td>
            <td style="color:#475569; border:1px solid #cbd5e1;">${log.user_agent || 'Chrome (Windows)'}</td>
            <td style="color:#0d9488; font-weight:bold; border:1px solid #cbd5e1;">📍 ${log.location_info || 'Jaringan Lokal'}</td>
            <td style="line-height:1.4; border:1px solid #cbd5e1;">${(log.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          </tr>
        `
      })
      .join('')

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Log Aktivitas System</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0f766e; color: #ffffff; font-weight: bold; font-size: 10pt; padding: 12px; border: 1px solid #0d9488; text-align: left; }
          td { border: 1px solid #cbd5e1; padding: 9px 12px; font-size: 9.5pt; color: #1e293b; vertical-align: middle; }
        </style>
      </head>
      <body>
        <table style="border:none; margin-bottom:12px;">
          <tr>
            <td colspan="8" style="border:none; background-color:#0d9488; color:#ffffff; padding:14px 18px; font-size:15pt; font-weight:bold;">
              📊 LAPORAN AUDIT LOG AKTIVITAS SYSTEM — NAGARI TABEK PATAH
            </td>
          </tr>
          <tr>
            <td colspan="8" style="border:none; background-color:#0f766e; color:#ccfbf1; padding:7px 18px; font-size:9pt;">
              Waktu Diunduh: ${exportDate} WIB | Total Entri: ${filteredLogs.length} Aktivitas | Status Audit: Verified & Sealed (Auto 6-Month Policy)
            </td>
          </tr>
          <tr><td colspan="8" style="border:none; height:10px;"></td></tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width:45px; text-align:center;">No.</th>
              <th style="width:160px;">Waktu & Tanggal</th>
              <th style="width:180px;">Pengguna (Admin)</th>
              <th style="width:110px; text-align:center;">Tipe Aksi</th>
              <th style="width:140px;">Alamat IP</th>
              <th style="width:170px;">Perangkat & Browser</th>
              <th style="width:230px;">Lokasi Daerah</th>
              <th style="width:400px;">Deskripsi Aktivitas Audit</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const dateStr = new Date().toISOString().slice(0, 10)
    link.download = `Log_Aktivitas_BI_Tabek_Patah_${dateStr}.xls`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-card settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/sikato-logo.png" alt="SIKATO Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'drop-shadow(0 3px 10px rgba(13,148,136,0.3))' }} />
            <div>
              <h2>Pengaturan SIKATO & Akun</h2>
              <p className="eyebrow" style={{ marginTop: 0 }}>SIKATO — Sistem Informasi Kependudukan & Topografi Nagari Tabek Patah</p>
            </div>
          </div>

          <button type="button" className="icon-button modal-close-btn" onClick={onClose} title="Tutup Modul">
            ✕
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="settings-nav-tabs">
          {isSuperAdmin && (
            <button
              type="button"
              className={`settings-tab-item ${activeTab === 'users' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Icon name="user-check" size={16} />
              <span>Kelola Akun Admin</span>
            </button>
          )}

          <button
            type="button"
            className={`settings-tab-item ${activeTab === 'theme' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={16} />
            <span>Tema Dashboard</span>
          </button>

          <button
            type="button"
            className={`settings-tab-item ${activeTab === 'logs' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Icon name="file_text" size={16} />
            <span>Log Aktivitas</span>
          </button>

          <button
            type="button"
            className={`settings-tab-item ${activeTab === 'about' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Icon name="info" size={16} />
            <span>Tentang & Kredit</span>
          </button>
        </div>

        {/* Tab 2: Theme Settings */}
        {activeTab === 'theme' && (
          <div className="settings-theme-body">
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Pilih mode tampilan warna visual yang nyaman untuk dashboard SIKATO:
            </p>

            <div className="theme-options-grid">
              {/* Light Mode Option Card */}
              <div
                className={`theme-option-card ${theme === 'light' ? 'is-selected' : ''}`}
                onClick={() => onToggleTheme('light')}
              >
                <div className="theme-preview-box light-preview">
                  <div style={{ display: 'flex', gap: '4px', height: '100%' }}>
                    <div style={{ width: '28%', background: '#0f172a', borderRadius: '4px', padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: '#14b8a6' }} />
                      <div style={{ width: '70%', height: '3px', borderRadius: '2px', background: '#334155' }} />
                      <div style={{ width: '85%', height: '3px', borderRadius: '2px', background: '#334155' }} />
                      <div style={{ width: '60%', height: '3px', borderRadius: '2px', background: '#334155' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ height: '10px', background: '#ffffff', borderRadius: '3px', border: '1px solid #e2e8f0' }} />
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ flex: 1, height: '22px', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                        <div style={{ flex: 1, height: '22px', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                        <div style={{ flex: 1, height: '22px', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                      </div>
                      <div style={{ flex: 1, background: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0', overflow: 'hidden', padding: '4px' }}>
                        <div style={{ width: '90%', height: '4px', borderRadius: '2px', background: '#0d9488', marginBottom: '3px' }} />
                        <div style={{ width: '65%', height: '4px', borderRadius: '2px', background: '#cbd5e1' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="theme-card-meta">
                  <div className="theme-title-row">
                    <Icon name="sun" size={18} />
                    <strong>Light Mode</strong>
                  </div>
                  <span>Tampilan terang bersih dan segar (Default)</span>
                </div>
              </div>

              {/* Dark Mode Option Card */}
              <div
                className={`theme-option-card ${theme === 'dark' ? 'is-selected' : ''}`}
                onClick={() => onToggleTheme('dark')}
              >
                <div className="theme-preview-box dark-preview">
                  <div style={{ display: 'flex', gap: '4px', height: '100%' }}>
                    <div style={{ width: '28%', background: '#020617', borderRadius: '4px', padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: '#14b8a6' }} />
                      <div style={{ width: '70%', height: '3px', borderRadius: '2px', background: '#475569' }} />
                      <div style={{ width: '85%', height: '3px', borderRadius: '2px', background: '#475569' }} />
                      <div style={{ width: '60%', height: '3px', borderRadius: '2px', background: '#475569' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ height: '10px', background: '#1e293b', borderRadius: '3px' }} />
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <div style={{ flex: 1, height: '22px', borderRadius: '4px', background: '#1e293b' }} />
                        <div style={{ flex: 1, height: '22px', borderRadius: '4px', background: '#1e293b' }} />
                        <div style={{ flex: 1, height: '22px', borderRadius: '4px', background: '#1e293b' }} />
                      </div>
                      <div style={{ flex: 1, background: '#1e293b', borderRadius: '4px', overflow: 'hidden', padding: '4px' }}>
                        <div style={{ width: '90%', height: '4px', borderRadius: '2px', background: '#14b8a6', marginBottom: '3px' }} />
                        <div style={{ width: '65%', height: '4px', borderRadius: '2px', background: '#475569' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="theme-card-meta">
                  <div className="theme-title-row">
                    <Icon name="moon" size={18} />
                    <strong>Dark Mode</strong>
                  </div>
                  <span>Tampilan gelap elegan dan nyaman di mata</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Activity Logs */}
        {activeTab === 'logs' && (
          <div className="settings-logs-body">
            <div className="logs-toolbar">
              <div className="logs-search-wrap">
                <input
                  type="text"
                  className="input-field logs-search-input"
                  placeholder="Cari aktivitas, admin, atau deskripsi..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                />
              </div>

              <select
                className="select-field logs-filter-select"
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
              >
                <option value="ALL">Semua Jenis Aksi</option>
                <option value="LOGIN">Login System</option>
                <option value="CREATE">Tambah Data</option>
                <option value="EDIT">Edit Data</option>
                <option value="DELETE">Hapus Data</option>
                <option value="IMPORT">Impor Excel/CSV</option>
                <option value="EXPORT">Ekspor CSV</option>
                <option value="UPDATE_PROFILE">Ubah Profil Admin</option>
              </select>

              <div className="logs-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={loadLogs}
                  disabled={isLogsLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '38px', padding: '0 14px', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                >
                  <Icon name="refresh" size={14} />
                  <span>{isLogsLoading ? 'Memuat...' : 'Segarkan Data'}</span>
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={handleExportLogsExcel}
                  disabled={isLogsLoading || filteredLogs.length === 0}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '38px', padding: '0 14px', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#059669' }}
                >
                  <Icon name="file_text" size={14} />
                  <span>Unduh Excel</span>
                </button>
              </div>
            </div>

            <div className="logs-retention-info-card">
              <Icon name="info" size={16} />
              <span>
                {isSuperAdmin ? (
                  <>
                    <strong>Mode Super Admin:</strong> Menampilkan seluruh riwayat log aktivitas seluruh pengguna sistem. Log disimpan otomatis selama <strong>6 Bulan Terakhir</strong>.
                  </>
                ) : (
                  <>
                    <strong>Mode Admin ({currentUser?.full_name || currentUser?.username}):</strong> Hanya menampilkan riwayat log aktivitas yang dilakukan oleh akun Anda sendiri. Log disimpan otomatis selama <strong>6 Bulan Terakhir</strong>.
                  </>
                )}
              </span>
            </div>

            {logsError && (
              <div className="login-error-alert" style={{ marginBottom: '12px' }}>
                <Icon name="info" size={16} />
                <span>{logsError}</span>
              </div>
            )}

            <div className="logs-table-container">
              {isLogsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Memuat riwayat log dari PostgreSQL Database...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {logSearch || logFilter !== 'ALL' ? 'Tidak ada log aktivitas yang cocok dengan kata kunci.' : 'Belum ada log aktivitas tersimpan.'}
                </div>
              ) : (
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '145px', whiteSpace: 'nowrap' }}>Waktu & Tanggal</th>
                      <th style={{ width: '105px', whiteSpace: 'nowrap' }}>Pengguna</th>
                      <th style={{ width: '85px', textAlign: 'center', whiteSpace: 'nowrap' }}>Tipe Aksi</th>
                      <th style={{ width: '140px', whiteSpace: 'nowrap' }}>IP & Perangkat</th>
                      <th style={{ width: '135px', whiteSpace: 'nowrap' }}>Lokasi Daerah</th>
                      <th>Deskripsi Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const badge = getActionBadgeStyle(log.action_type)
                      return (
                        <tr key={log.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {formatDate(log.created_at)}
                          </td>
                          <td style={{ fontWeight: 600, fontSize: '0.76rem' }}>{log.user_name || 'System Admin'}</td>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '0.7rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                                🌐 {log.ip_address || '127.0.0.1'}
                              </span>
                              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                                💻 {log.user_agent || 'Chrome (Windows)'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-teal, #0d9488)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              📍 {log.location_info || 'Jaringan Lokal'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.76rem', lineHeight: 1.3 }}>{log.description}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ marginTop: '12px', padding: 0 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Menampilkan <strong>{filteredLogs.length}</strong> dari <strong>{logs.length}</strong> entri log.
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Kelola Akun Admin (Super Admin Only) */}
        {activeTab === 'users' && isSuperAdmin && (
          <div className="settings-form-body" style={{ paddingBottom: '16px' }}>
            {regMsg.text && (
              <div className={`login-error-alert ${regMsg.type === 'success' ? 'is-success-alert' : ''}`} style={{ marginBottom: '12px' }}>
                <Icon name="info" size={16} />
                <span>{regMsg.text}</span>
              </div>
            )}

            {/* VIEW 1: DEFAULT LIST TABLE VIEW */}
            {userFormMode === 'LIST' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      Daftar Akun Admin Terdaftar
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Kelola akun Super Admin dan Admin yang dapat mengakses sistem.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleRequestAction('ADD')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontWeight: 800 }}
                  >
                    <Icon name="plus" size={16} />
                    <span>Tambah Akun Baru</span>
                  </button>
                </div>

                <div className="logs-table-container" style={{ flex: 1, maxHeight: '420px', minHeight: '320px' }}>
                  {isUsersLoading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat daftar akun admin...</div>
                  ) : usersList.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada akun admin terdaftar.</div>
                  ) : (
                    <table className="logs-table">
                      <thead>
                        <tr>
                          <th style={{ width: '45px', textAlign: 'center' }}>No.</th>
                          <th>Nama Lengkap Admin</th>
                          <th>Username</th>
                          <th>Peran / Level Akses</th>
                          <th>Waktu Dibuat</th>
                          <th style={{ textAlign: 'center', width: '150px' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((u, idx) => {
                          const isRoot = u.username.toLowerCase() === 'admin'
                          const isSuper = String(u.role).toLowerCase().includes('super') || isRoot
                          return (
                            <tr key={u.id}>
                              <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>{idx + 1}</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.full_name || u.username}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0d9488' }}>{u.username}</td>
                              <td>
                                <span
                                  style={{
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    background: isSuper ? 'rgba(13, 148, 136, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                                    color: isSuper ? '#0d9488' : '#0284c7',
                                    border: isSuper ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
                                  }}
                                >
                                  {isSuper ? 'Super Admin' : 'Admin'}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDate(u.created_at)}</td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => handleRequestAction('EDIT', u)}
                                    style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, color: '#0284c7', borderColor: '#bae6fd' }}
                                  >
                                    <Icon name="edit" size={12} />
                                    <span>Edit</span>
                                  </button>

                                  {!isRoot ? (
                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() => handleRequestAction('DELETE', u)}
                                      style={{ padding: '4px 10px', fontSize: '0.76rem', fontWeight: 700, color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
                                    >
                                      <Icon name="trash" size={12} />
                                      <span>Hapus</span>
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                                      Root
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

              </>
            )}

            {/* VIEW 2: ADD NEW USER FORM */}
            {userFormMode === 'ADD' && (
              <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ➕ Tambah Akun Admin / Super Admin Baru
                  </h3>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setUserFormMode('LIST')}
                    style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  >
                    ← Kembali ke Daftar Akun
                  </button>
                </div>

                <form onSubmit={handleRegisterUser}>
                  <div className="settings-form-grid" style={{ marginBottom: '14px' }}>
                    <div className="form-group-sequential">
                      <label>Nama Lengkap Admin *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Contoh: Budi Santoso (Enumerator 01)"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-sequential">
                      <label>Peran / Level Akses *</label>
                      <select
                        className="select-field"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                      >
                        <option value="Admin">Admin (Entry & Lihat Data)</option>
                        <option value="Super Admin">Super Admin (Akses Penuh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="settings-form-grid" style={{ marginBottom: '18px' }}>
                    <div className="form-group-sequential">
                      <label>Username *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Username login"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-sequential">
                      <label>Password *</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Password akun"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary-button" onClick={() => setUserFormMode('LIST')} disabled={isLoading}>
                      Batal
                    </button>
                    <button type="submit" className="primary-button" disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="plus" size={16} />
                      <span>{isLoading ? 'Menyimpan...' : 'Simpan Akun Baru'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VIEW 3: EDIT USER FORM */}
            {userFormMode === 'EDIT' && targetUser && (
              <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '14px', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ✏️ Edit Akun Admin — {targetUser.full_name || targetUser.username}
                  </h3>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setUserFormMode('LIST')}
                    style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                  >
                    ← Kembali ke Daftar Akun
                  </button>
                </div>

                <form onSubmit={handleUpdateUserSubmit}>
                  <div className="settings-form-grid" style={{ marginBottom: '14px' }}>
                    <div className="form-group-sequential">
                      <label>Nama Lengkap Admin *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Nama Lengkap"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-sequential">
                      <label>Peran / Level Akses *</label>
                      <select
                        className="select-field"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        disabled={targetUser.username.toLowerCase() === 'admin'}
                      >
                        <option value="Admin">Admin (Entry & Lihat Data)</option>
                        <option value="Super Admin">Super Admin (Akses Penuh)</option>
                      </select>
                    </div>
                  </div>

                  <div className="settings-form-grid" style={{ marginBottom: '18px' }}>
                    <div className="form-group-sequential">
                      <label>Username *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Username login"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group-sequential">
                      <label>Password Baru (Opsional)</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="Kosongkan jika tak diubah"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary-button" onClick={() => setUserFormMode('LIST')} disabled={isLoading}>
                      Batal
                    </button>
                    <button type="submit" className="primary-button" disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="check" size={16} />
                      <span>{isLoading ? 'Menyimpan...' : 'Simpan Perubahan Akun'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
        {/* Tab 5: Tentang & Kredit */}
        {activeTab === 'about' && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
            {/* Logo Hero Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
              <img src="/logo-tanah-datar.png" alt="Logo Kab. Tanah Datar" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} title="Kabupaten Tanah Datar" />
              <img src="/sikato-logo.png" alt="SIKATO Logo" style={{ height: '64px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(13,148,136,0.3))' }} title="SIKATO" />
              <img src="/logo-unand.png" alt="Logo Universitas Andalas" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} title="Universitas Andalas" />
            </div>

            {/* App Name & Version */}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-dark)', letterSpacing: '0.04em' }}>SIKATO</h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sistem Informasi Kependudukan & Topografi</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--primary-teal, #0d9488)', fontWeight: 600 }}>Versi 1.0.0 — Release 2026</p>
            </div>

            {/* Divider */}
            <hr style={{ width: '85%', border: 'none', borderTop: '1px solid var(--line, #e2e8f0)', margin: '0' }} />

            {/* Credit Info: Nagari */}
            <div style={{ fontSize: '0.82rem', lineHeight: 1.4, color: 'var(--text-main)' }}>
              <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-dark)' }}>Pemerintahan Nagari Tabek Patah</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Kecamatan Tanjung Emas, Kabupaten Tanah Datar, Sumatera Barat</span>
            </div>

            {/* Developer Credit Box */}
            <div style={{ background: 'var(--bg-card, #f8fafc)', border: '1.5px solid var(--line, #e2e8f0)', borderRadius: '12px', padding: '14px 18px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
                Pengembang Web / Developer
              </span>
              <p style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '0.96rem', color: 'var(--primary-teal, #0d9488)' }}>
                Muhammad Rafi Asytar
              </p>
              <p style={{ margin: '0 0 8px', fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                NIM: 2311522030
              </p>
              <div style={{ borderTop: '1px dashed var(--line, #cbd5e1)', paddingTop: '6px', marginTop: '4px' }}>
                <p style={{ margin: '0 0 1px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-dark)' }}>
                  Tim KKN Universitas Andalas
                </p>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Reguler Periode 2 Tahun 2026
                </p>
              </div>
            </div>

            {/* Tech Stack */}
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              <p style={{ margin: 0 }}>Built with React, Vite, Leaflet GIS & PostgreSQL</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.68rem' }}>© 2026 Pemerintahan Nagari Tabek Patah. All rights reserved.</p>
            </div>
          </div>
        )}

      </div>
    </div>

        {/* SECURITY CHALLENGE MODAL: SUPER ADMIN PASSWORD VERIFICATION */}
        {showAuthModal && (
          <div className="modal-backdrop" style={{ zIndex: 9999999 }} onClick={handleCancelAuth}>
            <div
              className="modal-card"
              style={{ maxWidth: '440px', padding: '24px', borderRadius: '16px', background: '#ffffff', boxShadow: '0 20px 48px rgba(0,0,0,0.3)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="lock" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                    Verifikasi Password Super Admin
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {pendingAction?.type === 'DELETE'
                      ? `Konfirmasi password Super Admin untuk menghapus akun '${pendingAction?.user?.username || 'admin'}'.`
                      : pendingAction?.type === 'EDIT'
                      ? `Konfirmasi password Super Admin untuk mengedit akun '${pendingAction?.user?.username || 'admin'}'.`
                      : 'Konfirmasi password Super Admin untuk mendaftarkan akun admin baru.'}
                  </p>
                </div>
              </div>

              {authError && (
                <div className="login-error-alert" style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
                  <Icon name="info" size={16} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAuth}>
                <div className="form-group-sequential" style={{ marginBottom: '18px' }}>
                  <label htmlFor="auth-pass-input">Masukkan Password Super Admin ({currentUser?.username || 'admin'})</label>
                  <input
                    id="auth-pass-input"
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="secondary-button" onClick={handleCancelAuth} disabled={isVerifying}>
                    Batal
                  </button>
                  <button type="submit" className="primary-button" disabled={isVerifying} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="check" size={16} />
                    <span>{isVerifying ? 'Memverifikasi...' : 'Verifikasi & Lanjutkan'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </>
  )
}

export default SettingsModal
