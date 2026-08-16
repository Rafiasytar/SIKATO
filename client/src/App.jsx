import { useEffect, useState } from 'react'
import SettingsModal from './components/SettingsModal'
import CategoryViewPage from './pages/CategoryViewPage'
import CrudDataPage from './pages/CrudDataPage'
import CrudIndividuPage from './pages/CrudIndividuPage'
import EditPersonPage from './pages/EditPersonPage'
import EditIndividuPage from './pages/EditIndividuPage'
import HomeDashboardPage from './pages/HomeDashboardPage'
import LoginPage from './pages/LoginPage'
import PersonDetailPage from './pages/PersonDetailPage'
import IndividuDetailPage from './pages/IndividuDetailPage'
import SpatialMapPage from './pages/SpatialMapPage'
import EntryAdminDashboardPage from './pages/EntryAdminDashboardPage'
import { fixedTableSchemaIndividu } from './data/individuTableSchema'
import { fetchIndividuRows, fetchSensusRows, importIndividuRows, importSensusRows, logActivity } from './services/api'
import { cleanupOversizedDataCache, readCachedRows, writeCachedRows } from './utils/dataCache'

cleanupOversizedDataCache()

function safeJsonParse(str, fallback = null) {
  if (!str || str === 'undefined' || str === 'null') return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

function App() {
  const [activePage, setActivePage] = useState(() => {
    const hash = window.location.hash.replace('#', '')
    return hash || 'home'
  })

  const [previousPage, setPreviousPage] = useState('crud')
  const [lastMainPage, setLastMainPage] = useState('crud')
  const [editSourcePage, setEditSourcePage] = useState(null)

  const [selectedPerson, setSelectedPerson] = useState(() => {
    return safeJsonParse(localStorage.getItem('bi_tabek_patah_selected_person'), null)
  })

  const [editingPerson, setEditingPerson] = useState(() => {
    return safeJsonParse(localStorage.getItem('bi_tabek_patah_editing_person'), null)
  })

  const [selectedIndividu, setSelectedIndividu] = useState(() => {
    return safeJsonParse(localStorage.getItem('bi_tabek_patah_selected_individu'), null)
  })

  const [editingIndividu, setEditingIndividu] = useState(() => {
    return safeJsonParse(localStorage.getItem('bi_tabek_patah_editing_individu'), null)
  })

  const [rows, setRows] = useState(() => readCachedRows('bi_tabek_patah_rows'))
  const [rowsIndividu, setRowsIndividu] = useState(() => readCachedRows('bi_tabek_patah_rows_individu'))
  const [isLoadingData, setIsLoadingData] = useState(() => {
    const cachedSensus = readCachedRows('bi_tabek_patah_rows')
    const cachedIndividu = readCachedRows('bi_tabek_patah_rows_individu')
    return (!cachedSensus || !cachedSensus.length) && (!cachedIndividu || !cachedIndividu.length)
  })
  const [dataLoadError, setDataLoadError] = useState('')

  const updateRowsState = (newRows) => {
    setRows(Array.isArray(newRows) ? newRows : [])
    writeCachedRows('bi_tabek_patah_rows', newRows)
  }

  const updateIndividuRowsState = (newRows) => {
    setRowsIndividu(Array.isArray(newRows) ? newRows : [])
    writeCachedRows('bi_tabek_patah_rows_individu', newRows)
  }

  const mapDbRows = (data) =>
    (Array.isArray(data) ? data : []).map((row) => {
      const mapped = { ...row }
      const faskesVal =
        mapped.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir ??
        mapped.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak ??
        mapped.frekuensi_kunjungan_faskes ??
        mapped.faskes ??
        mapped.frekuensi_faskes
      if (faskesVal !== undefined && faskesVal !== null) {
        mapped.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir = String(faskesVal)
        mapped.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak = String(faskesVal)
      }

      const nikahVal =
        mapped.bila_kawin_cerai_hidup_cerai_mati_berapa_usia_saat_menikah_pertama ??
        mapped.bila_kawin_cerai_hidup_cerai_mati_berapa_usia_saat_menikah_pert
      if (nikahVal !== undefined && nikahVal !== null) {
        mapped.bila_kawin_cerai_hidup_cerai_mati_berapa_usia_saat_menikah_pertama = String(nikahVal)
        mapped.bila_kawin_cerai_hidup_cerai_mati_berapa_usia_saat_menikah_pert = String(nikahVal)
      }

      const saranVal =
        mapped.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran_pada_pihak_nagari ??
        mapped.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran
      if (saranVal !== undefined && saranVal !== null) {
        mapped.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran_pada_pihak_nagari = String(saranVal)
        mapped.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran = String(saranVal)
      }

      return {
        ...mapped,
        _last_updated: mapped.last_updated_ms ? Number(mapped.last_updated_ms) : (mapped._last_updated ? Number(mapped._last_updated) : 0),
      }
    })

  const [fileName, setFileName] = useState('Database PostgreSQL')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // System Theme State ('light' | 'dark')
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('bi_tabek_patah_theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('bi_tabek_patah_theme', theme)
    } catch (e) {
      console.error(e)
    }
  }, [theme])

  // Auth User Session State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bi_tabek_patah_admin')
      if (!saved) return null
      const parsed = JSON.parse(saved)
      if (parsed) {
        parsed.role = String(parsed.role || '').toLowerCase().includes('super') || parsed.username === 'admin' ? 'Super Admin' : 'Admin'
      }
      return parsed
    } catch {
      return null
    }
  })

  // Ambil data langsung dari PostgreSQL backend saat aplikasi dibuka.
  useEffect(() => {
    let isMounted = true

    async function loadDatabaseRows() {
      const hasCached = (rows && rows.length > 0) || (rowsIndividu && rowsIndividu.length > 0)
      if (!hasCached) {
        setIsLoadingData(true)
      }
      setDataLoadError('')

      try {
        const [sensusData, individuData] = await Promise.all([fetchSensusRows(), fetchIndividuRows()])

        if (!isMounted) return

        updateRowsState(mapDbRows(sensusData))
        updateIndividuRowsState(mapDbRows(individuData))
        setFileName('Database PostgreSQL (Loaded)')
      } catch (err) {
        if (!isMounted) return
        console.warn('⚠️ Gagal memuat data dari backend PostgreSQL:', err.message)
        if (!rows.length && !rowsIndividu.length) {
          setFileName('Server Backend Offline')
          setDataLoadError(
            'Gagal memuat data dari server backend. Pastikan backend berjalan di port 5000.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoadingData(false)
        }
      }
    }

    loadDatabaseRows()

    return () => {
      isMounted = false
    }
  }, [])

  const PAGE_PATH_MAP = {
    home: 'beranda',
    crud: 'data-keluarga',
    crud_individu: 'data-individu',
    map: 'peta-spasial',
    category: 'kategori-statistik',
    activity: 'log-aktivitas',
    settings: 'pengaturan',
    detail: 'detail-keluarga',
    detail_individu: 'detail-individu',
    edit: 'form-keluarga',
    edit_individu: 'form-individu',
  }

  const PATH_PAGE_REVERSE = {
    'beranda': 'home',
    'data-keluarga': 'crud',
    'data-individu': 'crud_individu',
    'peta-spasial': 'map',
    'kategori-statistik': 'category',
    'log-aktivitas': 'activity',
    'pengaturan': 'settings',
    'detail-keluarga': 'detail',
    'detail-individu': 'detail_individu',
    'form-keluarga': 'edit',
    'form-individu': 'edit_individu',
    'tambah-data-keluarga': 'edit',
    'edit-keluarga': 'edit',
    'tambah-data-individu': 'edit_individu',
    'edit-individu': 'edit_individu',
  }

  // Support Browser BACK & FORWARD Buttons (popstate listener)
  useEffect(() => {
    const handlePopState = (event) => {
      const pathName = window.location.pathname.replace(/^\/+/, '').split('/')[0] || ''
      const targetPage = PATH_PAGE_REVERSE[pathName] || (event.state && event.state.page) || 'crud'
      setActivePage(targetPage)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const [returnPage, setReturnPage] = useState('crud')

  const handlePageChange = (targetPage) => {
    if (targetPage === 'edit') {
      handleStartCreate()
      return
    }
    if (targetPage === 'edit_individu') {
      handleStartCreateIndividu()
      return
    }
    const mainPages = ['home', 'crud', 'crud_individu', 'map', 'category', 'activity', 'settings']
    if (mainPages.includes(targetPage) || String(targetPage).startsWith('cat:')) {
      setLastMainPage(targetPage)
      setPreviousPage(targetPage)
    }
    setActivePage(targetPage)
    const path = PAGE_PATH_MAP[targetPage] || targetPage
    window.history.pushState({ page: targetPage }, '', `/${path}`)
  }

  const handleViewDetail = (personRow) => {
    setSelectedPerson(personRow)
    try {
      localStorage.setItem('bi_tabek_patah_selected_person', JSON.stringify(personRow))
    } catch (e) {}

    if (activePage !== 'detail' && activePage !== 'edit') {
      setReturnPage(activePage)
    }

    setActivePage('detail')
    const path = personRow?.nama_kepala_keluarga
      ? `detail-keluarga/${encodeURIComponent(personRow.nama_kepala_keluarga.toLowerCase().replace(/\s+/g, '-'))}`
      : 'detail-keluarga'
    window.history.pushState({ page: 'detail' }, '', `/${path}`)
  }

  const handleViewDetailIndividu = (personRow) => {
    if (!personRow) return
    setSelectedIndividu(personRow)
    try {
      localStorage.setItem('bi_tabek_patah_selected_individu', JSON.stringify(personRow))
    } catch (e) {}

    if (activePage !== 'detail_individu' && activePage !== 'edit_individu') {
      setReturnPage(activePage)
    }

    setActivePage('detail_individu')
    const path = personRow?.nama
      ? `detail-individu/${encodeURIComponent(personRow.nama.toLowerCase().replace(/\s+/g, '-'))}`
      : 'detail-individu'
    window.history.pushState({ page: 'detail_individu' }, '', `/${path}`)
  }

  const handleStartCreate = () => {
    setEditingPerson(null)
    try {
      localStorage.removeItem('bi_tabek_patah_editing_person')
    } catch (e) {}
    if (activePage !== 'edit') {
      setReturnPage(activePage)
    }
    setActivePage('edit')
    window.history.pushState({ page: 'edit' }, '', '/tambah-data-keluarga')
  }

  const handleStartEdit = (personRow) => {
    setEditingPerson(personRow)
    try {
      localStorage.setItem('bi_tabek_patah_editing_person', JSON.stringify(personRow))
    } catch (e) {}
    if (activePage !== 'edit') {
      setReturnPage(activePage)
    }
    setActivePage('edit')
    const path = personRow?.id ? `edit-keluarga/${personRow.id}` : 'edit-keluarga'
    window.history.pushState({ page: 'edit' }, '', `/${path}`)
  }

  const handleStartCreateIndividu = () => {
    setEditingIndividu(null)
    try {
      localStorage.removeItem('bi_tabek_patah_editing_individu')
    } catch (e) {}
    if (activePage !== 'edit_individu') {
      setReturnPage(activePage)
    }
    setActivePage('edit_individu')
    window.history.pushState({ page: 'edit_individu' }, '', '/tambah-data-individu')
  }

  const handleStartEditIndividu = (personRow) => {
    setEditingIndividu(personRow)
    try {
      localStorage.setItem('bi_tabek_patah_editing_individu', JSON.stringify(personRow))
    } catch (e) {}
    if (activePage !== 'edit_individu') {
      setReturnPage(activePage)
    }
    setActivePage('edit_individu')
    const path = personRow?.id ? `edit-individu/${personRow.id}` : 'edit-individu'
    window.history.pushState({ page: 'edit_individu' }, '', `/${path}`)
  }

  const handleSavePerson = async (formData) => {
    let updatedRows = []
    const isEdit = Boolean(formData.id)
    const personName = formData.nama_kepala_keluarga || formData.nama_responden || 'Responden'
    const adminName = currentUser?.full_name || currentUser?.username || 'Administrator'
    const nowTimestamp = Date.now()

    let updatedItem = null
    if (isEdit) {
      updatedItem = {
        ...formData,
        _last_updated: nowTimestamp,
      }
      const targetId = String(formData.id)
      const originalKk = String(editingPerson?.nomor_kk || '').trim()
      const targetKk = String(formData.nomor_kk || '').trim()
      const otherRows = rows.filter((item) => {
        if (String(item.id) === targetId) return false
        if (originalKk && String(item.nomor_kk || '').trim() === originalKk) return false
        if (targetKk && String(item.nomor_kk || '').trim() === targetKk) return false
        return true
      })
      updatedRows = [updatedItem, ...otherRows]
      setSelectedPerson(updatedItem)
      try {
        localStorage.setItem('bi_tabek_patah_selected_person', JSON.stringify(updatedItem))
      } catch (e) {}
    } else {
      const newRow = {
        id: `custom_${nowTimestamp}`,
        ...formData,
        created_by_admin: currentUser?.username || '',
        created_by_name: currentUser?.full_name || currentUser?.username || '',
        nama_enumerator_mahasiswa: formData.nama_enumerator_mahasiswa?.trim() ? formData.nama_enumerator_mahasiswa : (currentUser?.full_name || currentUser?.username || ''),
        _last_updated: nowTimestamp,
      }
      updatedRows = [newRow, ...rows]
    }
    updateRowsState(updatedRows)

    try {
      await importSensusRows(updatedRows)
      const freshData = await fetchSensusRows()
      if (Array.isArray(freshData) && freshData.length > 0) {
        updateRowsState(mapDbRows(freshData))
      }
      setFileName('Database PostgreSQL (Tersinkron)')
      if (isEdit) {
        await logActivity('EDIT', `Mengubah data sensus KK: "${personName}" (No. KK: ${formData.nomor_kk || '-'})`, adminName)
      } else {
        await logActivity('CREATE', `Menambahkan data KK baru: "${personName}" (No. KK: ${formData.nomor_kk || '-'})`, adminName)
      }
    } catch (err) {
      console.warn('Auto-save background sync:', err.message)
    }

    const returnTarget = editSourcePage === 'detail' ? 'detail' : (lastMainPage || 'crud')
    setEditSourcePage(null)
    handlePageChange(returnTarget)
  }

  const handleSaveIndividu = async (formData) => {
    let updatedRows = []
    const isEdit = Boolean(formData.id)
    const personName = formData.nama || formData.nama_kepala_keluarga || 'Individu'
    const adminName = currentUser?.full_name || currentUser?.username || 'Administrator'
    const nowTimestamp = Date.now()

    let updatedItem = null
    if (isEdit) {
      updatedItem = {
        ...formData,
        _last_updated: nowTimestamp,
      }
      const targetId = String(formData.id)
      const originalNik = String(editingIndividu?.nomor_nik || '').trim()
      const targetNik = String(formData.nomor_nik || '').trim()
      const otherRows = rowsIndividu.filter((item) => {
        if (String(item.id) === targetId) return false
        if (originalNik && String(item.nomor_nik || '').trim() === originalNik) return false
        if (targetNik && String(item.nomor_nik || '').trim() === targetNik) return false
        return true
      })
      updatedRows = [updatedItem, ...otherRows]
      setSelectedIndividu(updatedItem)
      try {
        localStorage.setItem('bi_tabek_patah_selected_individu', JSON.stringify(updatedItem))
      } catch (e) {}
    } else {
      const newRow = {
        id: `ind_${nowTimestamp}`,
        ...formData,
        created_by_admin: currentUser?.username || '',
        created_by_name: currentUser?.full_name || currentUser?.username || '',
        nama_enumerator_mahasiswa: formData.nama_enumerator_mahasiswa?.trim() ? formData.nama_enumerator_mahasiswa : (currentUser?.full_name || currentUser?.username || ''),
        _last_updated: nowTimestamp,
      }
      updatedRows = [newRow, ...rowsIndividu]
    }
    updateIndividuRowsState(updatedRows)

    try {
      await importIndividuRows(updatedRows)
      const freshData = await fetchIndividuRows()
      if (Array.isArray(freshData) && freshData.length > 0) {
        updateIndividuRowsState(mapDbRows(freshData))
      }
      if (isEdit) {
        await logActivity('EDIT', `Mengubah data individu: "${personName}" (NIK: ${formData.nomor_nik || '-'})`, adminName)
      } else {
        await logActivity('CREATE', `Menambahkan data individu baru: "${personName}" (NIK: ${formData.nomor_nik || '-'})`, adminName)
      }
    } catch (err) {
      console.warn('Auto-save background sync individu:', err.message)
    }

    const returnTarget = editSourcePage === 'detail_individu' ? 'detail_individu' : (lastMainPage === 'crud' ? 'crud_individu' : (lastMainPage || 'crud_individu'))
    setEditSourcePage(null)
    handlePageChange(returnTarget)
  }

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  // Auth & Profile Handlers
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData)
    try {
      localStorage.setItem('bi_tabek_patah_admin', JSON.stringify(userData))
    } catch (e) {
      console.error(e)
    }
    handlePageChange(previousPage || 'crud')
  }

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser)
    try {
      localStorage.setItem('bi_tabek_patah_admin', JSON.stringify(updatedUser))
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem('bi_tabek_patah_admin')
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  // GATEKEEPER: Force Login Page if user is not authenticated
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBack={null}
        theme={theme}
        onToggleTheme={(newTheme) => setTheme(newTheme)}
      />
    )
  }

  // LOGIN PAGE RENDER FOR LOGGED-IN USERS
  if (activePage === 'login') {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBack={() => handlePageChange(previousPage || 'crud')}
          onOpenSettings={handleOpenSettings}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUser}
          onUpdateUser={handleUpdateUser}
          theme={theme}
          onToggleTheme={(newTheme) => setTheme(newTheme)}
        />
      </>
    )
  }

  const isSuperAdmin = Boolean(
    currentUser &&
      (currentUser.username.toLowerCase() === 'admin' ||
        String(currentUser.role || '').toLowerCase().includes('super')),
  )

  const knownPages = [
    'home',
    'crud',
    'crud_individu',
    'map',
    'detail',
    'detail_individu',
    'edit',
    'edit_individu',
  ]

  let pageToRender = activePage
  if (!knownPages.includes(pageToRender) && !pageToRender.startsWith('cat:')) {
    pageToRender = isSuperAdmin ? 'crud' : 'home'
  }

  // Security Gate for Admin Biasa / Entry Admin: Block browsing list data / maps / logs
  if (!isSuperAdmin && pageToRender !== 'edit' && pageToRender !== 'edit_individu') {
    pageToRender = 'home'
  }

  return (
    <>
      {(dataLoadError || (isLoadingData && (!rows || !rows.length) && (!rowsIndividu || !rowsIndividu.length))) && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999999,
            maxWidth: '760px',
            width: 'calc(100% - 32px)',
            padding: '12px 18px',
            borderRadius: '12px',
            background: dataLoadError ? '#fef2f2' : '#eff6ff',
            color: dataLoadError ? '#991b1b' : '#1d4ed8',
            border: dataLoadError ? '1px solid #fecaca' : '1px solid #bfdbfe',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)',
            fontSize: '0.92rem',
            fontWeight: 600,
          }}
        >
          {dataLoadError || 'Memuat data keluarga dan individu dari database PostgreSQL...'}
        </div>
      )}

      {pageToRender === 'detail' && (
        <PersonDetailPage
          row={selectedPerson || (rows && rows[0])}
          allRows={rows}
          allIndividuRows={rowsIndividu}
          onViewDetailIndividu={handleViewDetailIndividu}
          onBack={() => handlePageChange(returnPage || 'crud')}
          onNavigate={handlePageChange}
          onStartEdit={handleStartEdit}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender === 'detail_individu' && (
        <IndividuDetailPage
          row={selectedIndividu || (rowsIndividu && rowsIndividu[0])}
          allRows={rowsIndividu}
          allFamilyRows={rows}
          onViewDetailFamily={handleViewDetail}
          onBack={() => handlePageChange(returnPage || 'crud_individu')}
          onNavigate={handlePageChange}
          onStartEdit={handleStartEditIndividu}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender === 'edit' && (
        <EditPersonPage
          key={editingPerson?.id ? `person_${editingPerson.id}` : 'new_person'}
          initialData={editingPerson}
          onSave={handleSavePerson}
          onBack={() => handlePageChange(returnPage || 'crud')}
          onNavigate={handlePageChange}
          onStartCreateFamily={handleStartCreate}
          onStartCreateIndividu={handleStartCreateIndividu}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender === 'edit_individu' && (
        <EditIndividuPage
          key={editingIndividu?.id ? `ind_${editingIndividu.id}` : 'new_ind'}
          person={editingIndividu}
          onSave={handleSaveIndividu}
          onCancel={() => handlePageChange(returnPage || 'crud_individu')}
          onNavigate={handlePageChange}
          onStartCreateFamily={handleStartCreate}
          onStartCreateIndividu={handleStartCreateIndividu}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender === 'map' && (
        <SpatialMapPage
          rows={rows}
          onViewDetail={handleViewDetail}
          onStartEdit={handleStartEdit}
          onPageChange={handlePageChange}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
          theme={theme}
        />
      )}

      {pageToRender === 'crud' && (
        <CrudDataPage
          rows={rows}
          setRows={updateRowsState}
          fileName={fileName}
          setFileName={setFileName}
          onNavigate={handlePageChange}
          onViewDetail={handleViewDetail}
          onStartCreate={handleStartCreate}
          onStartEdit={handleStartEdit}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender === 'crud_individu' && (
        <CrudIndividuPage
          rows={rowsIndividu}
          setRows={updateIndividuRowsState}
          fileName="Database Individu PostgreSQL"
          setFileName={() => {}}
          onNavigate={handlePageChange}
          onViewDetail={handleViewDetailIndividu}
          onStartCreate={handleStartCreateIndividu}
          onStartEdit={handleStartEditIndividu}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender.startsWith('cat:') && (
        <CategoryViewPage
          categoryId={pageToRender}
          rows={rows}
          onNavigate={handlePageChange}
          onViewDetail={handleViewDetail}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
      )}

      {pageToRender === 'home' &&
        (!isSuperAdmin ? (
          <EntryAdminDashboardPage
            currentUser={currentUser}
            rows={rows}
            rowsIndividu={rowsIndividu}
            onStartCreateFamily={handleStartCreate}
            onStartCreateIndividu={handleStartCreateIndividu}
            onOpenUploadModal={() => handlePageChange('crud')}
            onNavigate={handlePageChange}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            onLogout={handleLogout}
            onOpenSettings={handleOpenSettings}
          />
        ) : (
          <HomeDashboardPage
            rows={rows}
            rowsIndividu={rowsIndividu}
            onViewDetailFamily={handleViewDetail}
            onViewDetailIndividu={handleViewDetailIndividu}
            onNavigate={handlePageChange}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={handleToggleSidebar}
            currentUser={currentUser}
            onLogout={handleLogout}
            onOpenSettings={handleOpenSettings}
          />
        ))}

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateUser}
        theme={theme}
        onToggleTheme={(newTheme) => setTheme(newTheme)}
      />
    </>
  )
}

export default App
