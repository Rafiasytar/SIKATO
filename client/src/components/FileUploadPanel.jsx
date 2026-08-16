import { sourceFormUrl } from '../utils/formSchema'

function FileUploadPanel({ fileName, error, onFileChange }) {
  return (
    <section id="upload" className="panel upload-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Sumber Data</p>
          <h2>Excel Respons Google Form</h2>
        </div>
        <a className="source-link" href={sourceFormUrl} target="_blank" rel="noreferrer">Buka Form</a>
      </div>

      <label className="upload-box">
        <input type="file" accept=".xlsx,.xls,.csv" onChange={onFileChange} />
        <span>Pilih file Excel atau CSV</span>
        <strong>{fileName || 'Upload akan mengikuti table schema fixed'}</strong>
      </label>

      {error && <p className="error-text">{error}</p>}
    </section>
  )
}

export default FileUploadPanel
