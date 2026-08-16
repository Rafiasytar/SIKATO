import Icon from '../components/Icon'
import KpiCard from '../components/KpiCard'
import Sidebar from '../components/Sidebar'

const categoryConfigs = {
  'cat:sanitasi': {
    title: 'Halaman Kategori: Sanitasi Warga',
    eyebrow: 'Sektor Kesehatan & Lingkungan',
    icon: 'sanitasi',
    desc: 'Visualisasi lengkap ketersediaan fasilitas MCK, Jenis Jamban, Kloset, Pengelolaan Sampah, dan Drainase di Nagari Tabek Patah.',
  },
  'cat:air_bersih': {
    title: 'Halaman Kategori: Penerima Air Bersih',
    eyebrow: 'Sektor Akses Air',
    icon: 'air_bersih',
    desc: 'Pemetaan sumber air minum dan air mandi yang digunakan oleh masyarakat.',
  },
  'cat:pendidikan': {
    title: 'Halaman Kategori: Sektor Pendidikan',
    eyebrow: 'Sektor Pendidikan & Anak',
    icon: 'pendidikan',
    desc: 'Monitoring anak putus sekolah dan sebaran bantuan pendidikan anak sekolah.',
  },
  'cat:stunting': {
    title: 'Halaman Kategori: Monitoring Stunting & Balita',
    eyebrow: 'Sektor Kesehatan Ibu & Anak',
    icon: 'stunting',
    desc: 'Pendataan jumlah balita (0-5 tahun) per keluarga untuk pencegahan dan intervensi stunting.',
  },
  'cat:pkh': {
    title: 'Halaman Kategori: Penerima PKH',
    eyebrow: 'Bantuan Sosial Nasional',
    icon: 'pkh',
    desc: 'Analisis keluarga penerima Program Keluarga Harapan (PKH) di Nagari Tabek Patah.',
  },
  'cat:blt_kesra': {
    title: 'Halaman Kategori: Penerima BLT Kesra',
    eyebrow: 'Bantuan Sosial Tunai',
    icon: 'blt_kesra',
    desc: 'Visualisasi penyaluran Bantuan Sosial Tunai (BST) dan bantuan kesejahteraan lainnya.',
  },
  'cat:bapanas': {
    title: 'Halaman Kategori: Penerima Bapanas (Pangan)',
    eyebrow: 'Ketahanan Pangan',
    icon: 'bapanas',
    desc: 'Data keluarga penerima bantuan cadangan pangan beras/bapanas.',
  },
  'cat:blt_nagari': {
    title: 'Halaman Kategori: Penerima BLT Nagari',
    eyebrow: 'Bantuan Dana Desa',
    icon: 'blt_nagari',
    desc: 'Cakupan dan penyaluran Bantuan Langsung Tunai (BLT) Dana Desa Nagari.',
  },
  'cat:sumber_daya_air': {
    title: 'Halaman Kategori: Sumber Daya Air & Pertanian',
    eyebrow: 'Sektor Pertanian & Air',
    icon: 'sumber_daya_air',
    desc: 'Analisis sumber air minum, mandi, dan intensitas tanam padi/pertanian warga dalam setahun.',
  },
  'cat:kawasan_nagari': {
    title: 'Halaman Kategori: Kawasan & Kebencanaan Nagari',
    eyebrow: 'Sektor Geografis & Permukiman',
    icon: 'kawasan_nagari',
    desc: 'Sebaran per wilayah Jorong, kondisi fisik rumah, serta potensi dan riwayat kejadian bencana.',
  },
}

function CategoryViewPage({ categoryId, rows, onNavigate, onViewDetail, isSidebarOpen, onToggleSidebar, currentUser, onLogout, onOpenSettings }) {
  const config = categoryConfigs[categoryId] || categoryConfigs['cat:sanitasi']

  // Custom visual calculation per category
  const renderVisuals = () => {
    switch (categoryId) {
      case 'cat:sanitasi': {
        const mck = countBy(rows, 'fasilitas_mck')
        const jamban = countBy(rows, 'fasilitas_jamban')
        const kloset = countBy(rows, 'jenis_kloset')
        const sampah = countBy(rows, 'tempat_pembuangan_sampah')
        const drainase = countBy(rows, 'kondisi_drainase_disekitar_rumah')

        const hasJambanYes = rows.filter((r) => isYes(r.fasilitas_jamban)).length
        const total = rows.length || 1
        const pctJamban = Math.round((hasJambanYes / total) * 100)

        return (
          <>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <KpiCard label="Total Responden" value={total.toLocaleString('id-ID')} meta="Keluarga Sensus" icon="user" />
              <KpiCard label="Akses Jamban Layak" value={`${pctJamban}%`} meta={`${hasJambanYes} KK Memiliki`} metaClass="is-up" icon="sanitasi" />
              <KpiCard label="Tipe Kloset Terbanyak" value={getTop(kloset)} meta="Predominan" icon="sanitasi" />
              <KpiCard label="Pengelolaan Sampah" value={getTop(sampah)} meta="Dominan" icon="bapanas" />
            </section>

            <div className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Fasilitas</p><h2>Fasilitas MCK</h2></div></div>
                <CustomDonutChart data={mck} />
              </article>
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Sanitasi</p><h2>Jenis Jamban & Kloset</h2></div></div>
                <BarList data={jamban.concat(kloset)} variant="teal" />
              </article>
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Lingkungan</p><h2>Tempat Pembuangan Sampah</h2></div></div>
                <BarList data={sampah} variant="gold" />
              </article>
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Infrastruktur</p><h2>Kondisi Drainase Sekitar Rumah</h2></div></div>
                <BarList data={drainase} variant="accent" />
              </article>
            </div>
          </>
        )
      }

      case 'cat:air_bersih': {
        const airMinum = countBy(rows, 'sumber_air_minum_terbanyak_dari')
        const airMandi = countBy(rows, 'sumber_air_mandi_terbanyak_dari')
        const pdamCount = rows.filter(
          (r) =>
            String(r.sumber_air_minum_terbanyak_dari).toLowerCase().includes('pdam') ||
            String(r.sumber_air_mandi_terbanyak_dari).toLowerCase().includes('pdam'),
        ).length

        return (
          <>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <KpiCard label="Total KK" value={rows.length.toString()} meta="Tercatat" icon="home" />
              <KpiCard label="Pengguna PDAM/PAM" value={pdamCount.toString()} meta="Akses Terbuka" metaClass="is-up" icon="air_bersih" />
              <KpiCard label="Air Minum Utama" value={getTop(airMinum)} meta="Mayoritas" icon="sumber_daya_air" />
              <KpiCard label="Air Mandi Utama" value={getTop(airMandi)} meta="Mayoritas" icon="sanitasi" />
            </section>

            <div className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Air Minum</p><h2>Sumber Air Minum Utama</h2></div></div>
                <CustomDonutChart data={airMinum} />
              </article>
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Air Mandi</p><h2>Sumber Air Mandi & Cuci</h2></div></div>
                <BarList data={airMandi} variant="blue" />
              </article>
            </div>
          </>
        )
      }

      case 'cat:pendidikan': {
        const bantuanPendidikan = countBy(rows, 'bantuan_pendidikan_anak')
        const putusSekolahRows = rows.filter((r) => r.apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma && !['tidak', 'tidak ada', '-'].includes(String(r.apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma).toLowerCase().trim()))

        return (
          <>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <KpiCard label="Penerima Bantuan Pendidikan" value={countYes(rows, 'bantuan_pendidikan_anak').toString()} meta="Anak Sekolah" metaClass="is-up" icon="pendidikan" />
              <KpiCard label="Kasus Putus Sekolah" value={putusSekolahRows.length.toString()} meta="Perlu Intervensi" metaClass={putusSekolahRows.length ? 'is-down' : 'is-neutral'} icon="pendidikan" />
              <KpiCard label="Total Balita & Anak" value={rows.reduce((acc, r) => acc + (Number(r.jumlah_balita_0_5_tahun) || 0) + (Number(r.jumlah_anak_anak_6_12_tahun) || 0), 0).toString()} meta="Usia Dini - SD" icon="stunting" />
            </section>

            <div className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Bantuan</p><h2>Status Bantuan Pendidikan Anak</h2></div></div>
                <BarList data={bantuanPendidikan} variant="emerald" />
              </article>

              <article className="panel chart-panel" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header"><div><p className="eyebrow">Laporan Khusus</p><h2>Daftar Catatan Anak Putus Sekolah</h2></div></div>
                {putusSekolahRows.length === 0 ? (
                  <div className="empty-state">Tidak ada laporan anak putus sekolah dalam dataset ini.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Nama Kepala Keluarga</th>
                          <th>Alamat / Jorong</th>
                          <th>Keterangan Putus Sekolah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {putusSekolahRows.map((r, i) => (
                          <tr key={i} onClick={() => onViewDetail(r)} className="interactive-row">
                            <td><strong>{r.nama_kepala_keluarga || r.nama_responden}</strong></td>
                            <td>{r.alamat_lengkap || '-'}</td>
                            <td>{r.apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          </>
        )
      }

      case 'cat:stunting': {
        const balitaGroups = {
          '0 Balita': rows.filter((r) => !Number(r.jumlah_balita_0_5_tahun)).length,
          '1 Balita': rows.filter((r) => Number(r.jumlah_balita_0_5_tahun) === 1).length,
          '2 Balita': rows.filter((r) => Number(r.jumlah_balita_0_5_tahun) === 2).length,
          '3+ Balita': rows.filter((r) => Number(r.jumlah_balita_0_5_tahun) >= 3).length,
        }
        const balitaData = Object.entries(balitaGroups).map(([label, value]) => ({ label, value }))
        const totalBalita = rows.reduce((acc, r) => acc + (Number(r.jumlah_balita_0_5_tahun) || 0), 0)
        const kkAdaBalita = rows.filter((r) => Number(r.jumlah_balita_0_5_tahun) > 0)

        return (
          <>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <KpiCard label="Total Balita (0-5 Thn)" value={totalBalita.toString()} meta="Jumlah Jiwa" metaClass="is-up" icon="stunting" />
              <KpiCard label="KK Memiliki Balita" value={kkAdaBalita.length.toString()} meta="Rumah Tangga Target" icon="user" />
              <KpiCard label="KK 2+ Balita" value={(balitaGroups['2 Balita'] + balitaGroups['3+ Balita']).toString()} meta="Prioritas Posyandu" icon="stunting" />
            </section>

            <div className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Distribusi</p><h2>Sebaran Balita per Rumah Tangga</h2></div></div>
                <CustomDonutChart data={balitaData} />
              </article>

              <article className="panel chart-panel" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header"><div><p className="eyebrow">Posyandu Target</p><h2>Daftar Rumah Tangga dengan Balita</h2></div></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama KK</th>
                        <th>Alamat</th>
                        <th>Jumlah Balita</th>
                        <th>Jamban / Sanitasi</th>
                        <th>Sumber Air Minum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kkAdaBalita.slice(0, 15).map((r, i) => (
                        <tr key={i} onClick={() => onViewDetail(r)} className="interactive-row">
                          <td><strong>{r.nama_kepala_keluarga || r.nama_responden}</strong></td>
                          <td>{r.alamat_lengkap || '-'}</td>
                          <td><span className="badge-highlight">{r.jumlah_balita_0_5_tahun} Balita</span></td>
                          <td>{r.fasilitas_jamban || '-'}</td>
                          <td>{r.sumber_air_minum_terbanyak_dari || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </>
        )
      }

      case 'cat:pkh': {
        const pkhData = countBy(rows, 'program_keluarga_harapan_pkh')
        const pkhRecipients = rows.filter((r) => isYes(r.program_keluarga_harapan_pkh))

        return (
          <>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <KpiCard label="Penerima PKH" value={pkhRecipients.length.toString()} meta="KPM Terdaftar" metaClass="is-up" icon="pkh" />
              <KpiCard label="Non-Penerima PKH" value={(rows.length - pkhRecipients.length).toString()} meta="Bukan KPM PKH" icon="pkh" />
              <KpiCard label="Persentase Coverage" value={`${Math.round((pkhRecipients.length / (rows.length || 1)) * 100)}%`} meta="Dari Total Sensus" icon="table" />
            </section>

            <div className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Program PKH</p><h2>Status Penerima PKH</h2></div></div>
                <BarList data={pkhData} variant="gold" />
              </article>

              <article className="panel chart-panel" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header"><div><p className="eyebrow">Daftar KPM PKH</p><h2>Daftar Keluarga Penerima Manfaat PKH</h2></div></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama Kepala Keluarga</th>
                        <th>No. KK</th>
                        <th>Alamat</th>
                        <th>Anggota KK</th>
                        <th>Lansia / Balita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkhRecipients.slice(0, 15).map((r, i) => (
                        <tr key={i} onClick={() => onViewDetail(r)} className="interactive-row">
                          <td><strong>{r.nama_kepala_keluarga || r.nama_responden}</strong></td>
                          <td>{r.nomor_kk || '-'}</td>
                          <td>{r.alamat_lengkap || '-'}</td>
                          <td>{r.jumlah_anggota_dalam_keluarga || '-'} Orang</td>
                          <td>Balita: {r.jumlah_balita_0_5_tahun || 0} | Lansia: {r.jumlah_lansia_60_tahun_ke_atas || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </>
        )
      }

      default: {
        // Fallback for general categories
        const primaryField = getPrimaryFieldForCategory(categoryId)
        const summaryData = countBy(rows, primaryField)
        const recipients = rows.filter((r) => isYes(r[primaryField]))

        return (
          <>
            <section className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
              <KpiCard label="Total Responden" value={rows.length.toString()} meta="Terdata" icon="user" />
              <KpiCard label="Penerima / Sesuai Status" value={recipients.length.toString()} meta="Positif/Tercatat" metaClass="is-up" icon="pkh" />
              <KpiCard label="Cakupan Sektor" value={`${Math.round((recipients.length / (rows.length || 1)) * 100)}%`} meta="Rasio" icon="table" />
            </section>

            <div className="dashboard-grid">
              <article className="panel chart-panel">
                <div className="panel-header"><div><p className="eyebrow">Analisis Sektor</p><h2>Sebaran Data Status</h2></div></div>
                <BarList data={summaryData} variant="teal" />
              </article>

              <article className="panel chart-panel" style={{ gridColumn: 'span 2' }}>
                <div className="panel-header"><div><p className="eyebrow">Tabel Sampel</p><h2>Daftar Baris Terkait</h2></div></div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nama KK</th>
                        <th>Alamat</th>
                        <th>Status / Nilai Kategori</th>
                        <th>Kondisi Rumah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 15).map((r, i) => (
                        <tr key={i} onClick={() => onViewDetail(r)} className="interactive-row">
                          <td><strong>{r.nama_kepala_keluarga || r.nama_responden}</strong></td>
                          <td>{r.alamat_lengkap || '-'}</td>
                          <td>{r[primaryField] || '-'}</td>
                          <td>{r.secara_keseluruhan_kondisi_rumah || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>
          </>
        )
      }
    }
  }

  return (
    <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage={categoryId}
        onNavigate={onNavigate}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
      />

      <main className="main-content">
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
              <p className="eyebrow">{config.eyebrow}</p>
              <h1>
                <Icon name={config.icon} size={28} className="title-icon" /> {config.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>{config.desc}</p>
            </div>
          </div>
        </header>

        {renderVisuals()}
      </main>
    </div>
  )
}

function BarList({ data, variant = 'teal' }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  if (!data.length) return <div className="empty-state">Belum ada data.</div>

  return (
    <div className="mini-bars">
      {data.map((item) => (
        <div className="mini-bar-row" key={item.label}>
          <div className="mini-bar-meta">
            <span>{item.label || 'Lainnya'}</span>
            <strong>{item.value.toLocaleString('id-ID')}</strong>
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill is-${variant}`}
              style={{ width: `${Math.max(6, Math.round((item.value / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function CustomDonutChart({ data }) {
  const total = data.reduce((acc, i) => acc + i.value, 0) || 1

  return (
    <div className="custom-donut-wrap">
      <div className="donut-stat-center">
        <strong>{total}</strong>
        <span>Total Data</span>
      </div>
      <div className="donut-legend-list">
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100)
          return (
            <div className="donut-legend-item" key={item.label || idx}>
              <span className={`donut-dot is-color-${idx % 5}`} />
              <div className="donut-legend-info">
                <span>{item.label || 'Lainnya'}</span>
                <strong>{item.value} ({pct}%)</strong>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getPrimaryFieldForCategory(catId) {
  switch (catId) {
    case 'cat:blt_kesra': return 'bantuan_sosial_tunai'
    case 'cat:bapanas': return 'bantuan_lainnya'
    case 'cat:blt_nagari': return 'blt_dana_desa'
    case 'cat:sumber_daya_air': return 'intensitas_tanam_padi_dalam_setahun'
    case 'cat:kawasan_nagari': return 'secara_keseluruhan_kondisi_rumah'
    default: return 'tempat_tinggal_yang_ditempati'
  }
}

function countBy(rows, key) {
  const map = new Map()
  rows.forEach((r) => {
    const val = String(r[key] || 'Belum Diisi').trim()
    map.set(val, (map.get(val) || 0) + 1)
  })
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
}

function countYes(rows, key) {
  return rows.filter((r) => isYes(r[key])).length
}

function isYes(val) {
  if (!val) return false
  const s = String(val).trim().toLowerCase()
  return s === 'ya' || s === 'iya' || s === 'ada' || s === 'punya'
}

function getTop(arr) {
  if (!arr || !arr.length) return '-'
  const sorted = [...arr].sort((a, b) => b.value - a.value)
  return sorted[0]?.label || '-'
}

export default CategoryViewPage
