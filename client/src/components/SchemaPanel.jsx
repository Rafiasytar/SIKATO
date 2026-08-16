import { buildCreateTableSql } from '../utils/formSchema'

function SchemaPanel({ schema }) {
  const sql = schema.length ? buildCreateTableSql(schema) : ''

  return (
    <section id="schema" className="panel schema-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Database</p>
          <h2>Table Schema Berdasarkan Header Form</h2>
        </div>
      </div>

      {!schema.length && <div className="empty-state">Upload file respons untuk membaca kolom.</div>}

      {schema.length > 0 && (
        <>
          <div className="schema-grid">
            {schema.map((field) => (
              <article className="schema-card" key={field.id}>
                <span>{field.id}</span>
                <strong>{field.label}</strong>
                <small>{field.sqlType}</small>
              </article>
            ))}
          </div>
          <pre className="sql-preview">{sql}</pre>
        </>
      )}
    </section>
  )
}

export default SchemaPanel
