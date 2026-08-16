function DynamicDataTable({ schema, rows, searchQuery, onSearch, onExport }) {
  const filteredRows = rows.filter((row) =>
    schema.some((field) => String(row[field.id] ?? '').toLowerCase().includes(searchQuery.trim().toLowerCase())),
  )
  const visibleSchema = schema

  return (
    <section id="data" className="panel table-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Dataset</p>
          <h2>Preview Data Respons</h2>
        </div>
        <div className="table-actions">
          <label className="search-field">
            <span className="sr-only">Cari data</span>
            <input
              type="search"
              placeholder="Cari isi respons"
              value={searchQuery}
              onChange={(event) => onSearch(event.target.value)}
            />
          </label>
          <button className="primary-button" type="button" onClick={onExport} disabled={!rows.length}>
            Ekspor CSV
          </button>
        </div>
      </div>

      {!schema.length && <div className="empty-state">Belum ada data untuk ditampilkan.</div>}

      {schema.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {visibleSchema.map((field) => (
                  <th key={field.id}>{field.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={visibleSchema.length}>Tidak ada data yang cocok.</td>
                </tr>
              )}
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  {visibleSchema.map((field) => (
                    <td key={field.id}>{row[field.id]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default DynamicDataTable
