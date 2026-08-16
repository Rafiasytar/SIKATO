function VisualSummary({ rows }) {
  const housing = countBy(rows, 'tempat_tinggal_yang_ditempati')
  const houseCondition = countBy(rows, 'secara_keseluruhan_kondisi_rumah')
  const umkm = countBy(rows, 'apakah_mempunyai_umkm')
  const assistance = [
    { label: 'BLT Dana Desa', value: countYes(rows, 'blt_dana_desa') },
    { label: 'BPJS/KIS', value: countYes(rows, 'bpjs_kis') },
    { label: 'PKH', value: countYes(rows, 'program_keluarga_harapan_pkh') },
    { label: 'Bansos Tunai', value: countYes(rows, 'bantuan_sosial_tunai') },
    { label: 'Bantuan Pendidikan', value: countYes(rows, 'bantuan_pendidikan_anak') },
  ]

  return (
    <section id="visualisasi" className="dashboard-grid">
      <article className="panel chart-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Permukiman</p>
            <h2>Tempat Tinggal</h2>
          </div>
        </div>
        <MiniBars data={housing} />
      </article>

      <article className="panel chart-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Kondisi Rumah</p>
            <h2>Kumuh / Tidak Kumuh</h2>
          </div>
        </div>
        <MiniBars data={houseCondition} variant="blue" />
      </article>

      <article className="panel chart-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Program Pemerintah</p>
            <h2>Penerima Bantuan</h2>
          </div>
        </div>
        <MiniBars data={assistance} variant="gold" />
      </article>

      <article className="panel chart-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Ekonomi</p>
            <h2>Kepemilikan UMKM</h2>
          </div>
        </div>
        <MiniBars data={umkm} variant="accent" />
      </article>
    </section>
  )
}

function MiniBars({ data, variant = 'teal' }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1)

  if (!data.length) {
    return <div className="empty-state">Belum ada data visualisasi.</div>
  }

  return (
    <div className="mini-bars">
      {data.map((item) => (
        <div className="mini-bar-row" key={item.label}>
          <div className="mini-bar-meta">
            <span>{item.label || 'Kosong'}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill is-${variant}`}
              style={{ width: `${Math.max(8, Math.round((item.value / maxValue) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function countBy(rows, key) {
  const counts = new Map()

  rows.forEach((row) => {
    const label = String(row[key] || 'Kosong').trim()
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })

  return [...counts.entries()].map(([label, value]) => ({ label, value }))
}

function countYes(rows, key) {
  return rows.filter((row) => {
    const value = String(row[key] || '').toLowerCase()
    return value === 'ya' || value === 'iya'
  }).length
}

export default VisualSummary
