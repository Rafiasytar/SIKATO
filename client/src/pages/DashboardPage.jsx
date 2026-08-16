import { useMemo, useState } from 'react'
import CategoryDashboards from '../components/CategoryDashboards'
import DynamicDataTable from '../components/DynamicDataTable'
import FileUploadPanel from '../components/FileUploadPanel'
import KpiCard from '../components/KpiCard'
import SchemaPanel from '../components/SchemaPanel'
import Sidebar from '../components/Sidebar'
import VisualSummary from '../components/VisualSummary'
import { fixedTableSchema } from '../data/tableSchema'
import { importSensusRows } from '../services/api'
import { parseResponseFile } from '../utils/fileParser'

const schema = fixedTableSchema

function DashboardPage({ onPageChange }) {
  const [activeSection, setActiveSection] = useState('#ringkasan')
  const [fileName, setFileName] = useState('Database PostgreSQL')
  const [rows, setRows] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('')

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) {
      return rows
    }

    return rows.filter((row) =>
      schema.some((field) => String(row[field.id] ?? '').toLowerCase().includes(query)),
    )
  }, [rows, searchQuery])

  const handleFileChange = async (event) => {
    const [file] = event.target.files

    if (!file) {
      return
    }

    try {
      setError('')
      const parsedFile = await parseResponseFile(file, schema)
      setFileName(parsedFile.fileName)
      setRows(parsedFile.rows)
      setSearchQuery('')
      setSaveStatus('')
    } catch (parseError) {
      setError(parseError.message)
      setFileName(file.name)
      setRows([])
    }
  }

  const saveToBackend = async () => {
    try {
      setSaveStatus('Menyimpan data ke backend...')
      const result = await importSensusRows(visibleRows)
      setSaveStatus(`${result.inserted} baris berhasil disimpan ke PostgreSQL.`)
    } catch (saveError) {
      setSaveStatus(saveError.message)
    }
  }

  const exportCsv = () => {
    if (!schema.length) {
      return
    }

    const csvRows = [
      schema.map((field) => escapeCsvValue(field.label)).join(','),
      ...visibleRows.map((row) =>
        schema.map((field) => escapeCsvValue(row[field.id])).join(','),
      ),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'respons-google-form-tabek-patah.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        onNavigate={(target) => {
          if (target === 'map' || target === 'dashboard') {
            onPageChange(target)
            return
          }

          setActiveSection(target)
        }}
      />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard Business Intelligence</p>
            <h1>Data Sensus Masyarakat Tabek Patah</h1>
          </div>
          <div className="toolbar status-toolbar" aria-label="Status file">
            <span>{fileName}</span>
          </div>
        </header>

        <section id="ringkasan" className="kpi-grid" aria-label="Ringkasan dataset">
          <KpiCard label="Total Respons" value={rows.length.toLocaleString('id-ID')} meta="Database PostgreSQL / File Upload" />
          <KpiCard label="Kolom Fixed" value={schema.length.toLocaleString('id-ID')} meta="Tidak berubah dari table schema" />
          <KpiCard label="Data Tampil" value={visibleRows.length.toLocaleString('id-ID')} meta="Sesuai pencarian aktif" />
          <KpiCard label="Schema" value="Locked" meta="Tabel fixed" metaClass="is-up" />
        </section>

        <VisualSummary rows={rows} />
        <CategoryDashboards rows={visibleRows} />
        <FileUploadPanel fileName={fileName} error={error} onFileChange={handleFileChange} />
        <div className="reset-row">
          <button className="primary-button" type="button" onClick={saveToBackend} disabled={!visibleRows.length}>
            Simpan ke PostgreSQL
          </button>
        </div>
        {saveStatus && <p className="save-status">{saveStatus}</p>}
        <SchemaPanel schema={schema} />
        <DynamicDataTable
          schema={schema}
          rows={rows}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          onExport={exportCsv}
        />
      </main>
    </div>
  )
}

function escapeCsvValue(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export default DashboardPage
