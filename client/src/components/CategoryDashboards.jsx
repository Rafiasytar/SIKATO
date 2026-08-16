import { useMemo, useState } from 'react'
import { getJorongLabel } from '../utils/jorongParser'

const categoryDefinitions = [
  {
    id: 'sanitasi',
    label: 'Sanitasi',
    eyebrow: 'Kesehatan Lingkungan',
    views: [
      { label: 'MCK', field: 'fasilitas_mck' },
      { label: 'Jamban', field: 'fasilitas_jamban' },
      { label: 'Kloset', field: 'jenis_kloset' },
      { label: 'Sampah', field: 'tempat_pembuangan_sampah' },
      { label: 'Drainase', field: 'kondisi_drainase_disekitar_rumah' },
    ],
  },
  {
    id: 'air_bersih',
    label: 'Penerima Air Bersih',
    eyebrow: 'Akses Air',
    views: [
      { label: 'Air Minum', field: 'sumber_air_minum_terbanyak_dari' },
      { label: 'Air Mandi', field: 'sumber_air_mandi_terbanyak_dari' },
    ],
  },
  {
    id: 'pendidikan',
    label: 'Pendidikan',
    eyebrow: 'Anak dan Bantuan',
    views: [
      { label: 'Bantuan Pendidikan', field: 'bantuan_pendidikan_anak' },
      { label: 'Putus Sekolah', field: 'apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma' },
    ],
  },
  {
    id: 'stunting',
    label: 'Stunting',
    eyebrow: 'Monitoring Balita',
    views: [
      { label: 'Balita per KK', field: 'jumlah_balita_0_5_tahun' },
    ],
  },
  {
    id: 'pkh',
    label: 'Penerima PKH',
    eyebrow: 'Bantuan Sosial',
    views: [
      { label: 'PKH', field: 'program_keluarga_harapan_pkh' },
    ],
  },
  {
    id: 'blt_kesra',
    label: 'Penerima BLT Kesra',
    eyebrow: 'Bantuan Sosial',
    views: [
      { label: 'Bansos Tunai', field: 'bantuan_sosial_tunai' },
      { label: 'Bantuan Lainnya', field: 'bantuan_lainnya' },
    ],
  },
  {
    id: 'bapanas',
    label: 'Penerima Bapanas',
    eyebrow: 'Bantuan Pangan',
    views: [
      { label: 'Bantuan Lainnya', field: 'bantuan_lainnya' },
    ],
  },
  {
    id: 'blt_nagari',
    label: 'Penerima BLT Nagari',
    eyebrow: 'Dana Desa',
    views: [
      { label: 'BLT Dana Desa', field: 'blt_dana_desa' },
    ],
  },
  {
    id: 'sumber_daya_air',
    label: 'Sumber Daya Air',
    eyebrow: 'Lahan dan Air',
    views: [
      { label: 'Air Minum', field: 'sumber_air_minum_terbanyak_dari' },
      { label: 'Air Mandi', field: 'sumber_air_mandi_terbanyak_dari' },
      { label: 'Intensitas Padi', field: 'intensitas_tanam_padi_dalam_setahun' },
    ],
  },
  {
    id: 'kawasan_nagari',
    label: 'Kawasan Nagari',
    eyebrow: 'Wilayah dan Spasial',
    views: [
      { label: 'Jorong', field: 'alamat_lengkap' },
      { label: 'Kondisi Rumah', field: 'secara_keseluruhan_kondisi_rumah' },
      { label: 'Bencana', field: 'data_kejadian_bencana' },
    ],
  },
]

function CategoryDashboards({ rows }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categoryDefinitions[0].id)
  const [selectedViews, setSelectedViews] = useState({})
  const activeCategory = categoryDefinitions.find((category) => category.id === activeCategoryId) ?? categoryDefinitions[0]
  const activeView = selectedViews[activeCategory.id] ?? activeCategory.views[0].field
  const activeViewLabel = activeCategory.views.find((view) => view.field === activeView)?.label ?? 'Data'

  const dashboard = useMemo(
    () => buildDashboard(activeCategory.id, rows, activeView),
    [activeCategory.id, rows, activeView],
  )

  return (
    <section id="kategori" className="panel category-dashboard">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Dashboard Per Kategori</p>
          <h2>{activeCategory.label}</h2>
        </div>
        <div className="category-count">
          <strong>{rows.length.toLocaleString('id-ID')}</strong>
          <span>baris dianalisis</span>
        </div>
      </div>

      <div className="category-tabs" aria-label="Kategori visualisasi">
        {categoryDefinitions.map((category) => (
          <button
            className={`category-tab ${activeCategory.id === category.id ? 'is-active' : ''}`}
            type="button"
            key={category.id}
            onClick={() => setActiveCategoryId(category.id)}
          >
            <span>{category.eyebrow}</span>
            <strong>{category.label}</strong>
          </button>
        ))}
      </div>

      <div className="category-kpi-grid">
        {dashboard.metrics.map((metric) => (
          <article className="category-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.meta}</small>
          </article>
        ))}
      </div>

      <div className="category-layout">
        <article className="category-chart-card">
          <div className="category-card-header">
            <div>
              <p className="eyebrow">Distribusi</p>
              <h3>{activeViewLabel}</h3>
            </div>
            <div className="segmented-control" aria-label="Pilih kolom visualisasi">
              {activeCategory.views.map((view) => (
                <button
                  className={activeView === view.field ? 'is-active' : ''}
                  type="button"
                  key={`${activeCategory.id}-${view.field}`}
                  onClick={() => setSelectedViews((current) => ({ ...current, [activeCategory.id]: view.field }))}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>
          <HorizontalBars data={dashboard.primaryBars} />
        </article>

        <article className="category-chart-card">
          <div className="category-card-header">
            <div>
              <p className="eyebrow">{dashboard.secondary.eyebrow}</p>
              <h3>{dashboard.secondary.title}</h3>
            </div>
          </div>
          <SecondaryVisual visual={dashboard.secondary} />
        </article>
      </div>

      <div className="category-layout is-compact">
        <article className="category-chart-card">
          <div className="category-card-header">
            <div>
              <p className="eyebrow">Wilayah</p>
              <h3>Sebaran Jorong</h3>
            </div>
          </div>
          <HorizontalBars data={countBy(rows, (row) => extractJorong(row.alamat_lengkap))} compact />
        </article>

        <article className="category-chart-card">
          <div className="category-card-header">
            <div>
              <p className="eyebrow">Daftar Prioritas</p>
              <h3>{dashboard.listTitle}</h3>
            </div>
          </div>
          <PriorityList rows={dashboard.priorityRows} />
        </article>
      </div>
    </section>
  )
}

function buildDashboard(categoryId, rows, activeField) {
  const totalRows = rows.length

  if (categoryId === 'sanitasi') {
    const riskRows = rows.filter(isSanitationRisk)
    return {
      metrics: [
        metric('Total KK', totalRows, 'Data sensus aktif'),
        metric('Risiko Sanitasi', riskRows.length, 'MCK, jamban, drainase, sampah'),
        metric('Jamban Layak', countMatching(rows, 'fasilitas_jamban', ['sendiri']), 'Indikasi akses mandiri'),
        metric('Drainase Baik', countMatching(rows, 'kondisi_drainase_disekitar_rumah', ['baik']), 'Kondisi sekitar rumah'),
      ],
      primaryBars: countBy(rows, activeField),
      secondary: donutVisual('Status Risiko', 'Sanitasi', riskRows.length, totalRows - riskRows.length, 'Perlu perhatian', 'Relatif baik'),
      listTitle: 'KK dengan risiko sanitasi',
      priorityRows: buildPriorityRows(riskRows, ['fasilitas_mck', 'fasilitas_jamban', 'jenis_kloset', 'kondisi_drainase_disekitar_rumah']),
    }
  }

  if (categoryId === 'air_bersih') {
    const limitedRows = rows.filter(isLimitedWaterAccess)
    return {
      metrics: [
        metric('Total KK', totalRows, 'Data sensus aktif'),
        metric('Akses Terbatas', limitedRows.length, 'Tadah hujan / sumber tidak aman'),
        metric('Air Minum Layak', totalRows - limitedRows.length, 'Berdasarkan sumber air minum'),
        metric('Air Mandi Perpipaan', countMatching(rows, 'sumber_air_mandi_terbanyak_dari', ['pipa', 'pamsimas', 'ledeng']), 'Indikasi layanan air'),
      ],
      primaryBars: countBy(rows, activeField),
      secondary: donutVisual('Akses Air', 'Air bersih', totalRows - limitedRows.length, limitedRows.length, 'Layak', 'Terbatas'),
      listTitle: 'KK dengan akses air terbatas',
      priorityRows: buildPriorityRows(limitedRows, ['sumber_air_minum_terbanyak_dari', 'sumber_air_mandi_terbanyak_dari']),
    }
  }

  if (categoryId === 'pendidikan') {
    const dropoutRows = rows.filter(hasDropout)
    const educationHelp = countYes(rows, 'bantuan_pendidikan_anak')
    const children = sumField(rows, 'jumlah_anak_anak_6_12_tahun')
    const teens = sumField(rows, 'jumlah_remaja_produktif_13_59_tahun')
    return {
      metrics: [
        metric('Anak 6-12', children, 'Total anggota keluarga'),
        metric('Remaja 13-59', teens, 'Mengikuti kolom form'),
        metric('Bantuan Pendidikan', educationHelp, 'KK penerima bantuan'),
        metric('Putus Sekolah', dropoutRows.length, 'Perlu validasi nama anak'),
      ],
      primaryBars: countBy(rows, activeField),
      secondary: ageVisual(children, teens, sumField(rows, 'jumlah_balita_0_5_tahun')),
      listTitle: 'KK terkait pendidikan',
      priorityRows: buildPriorityRows([...dropoutRows, ...rows.filter((row) => isYes(row.bantuan_pendidikan_anak))], ['bantuan_pendidikan_anak', 'apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma']),
    }
  }

  if (categoryId === 'stunting') {
    const toddlers = sumField(rows, 'jumlah_balita_0_5_tahun')
    const toddlerRows = rows.filter((row) => toNumber(row.jumlah_balita_0_5_tahun) > 0)
    return {
      metrics: [
        metric('Balita Terdata', toddlers, 'Kolom tersedia di form'),
        metric('KK Punya Balita', toddlerRows.length, 'Target monitoring stunting'),
        metric('Kolom Status', 'Belum Ada', 'Perlu tambah status stunting'),
        metric('Kesiapan Data', toddlers ? 'Parsial' : 'Kosong', 'Belum bisa prevalensi'),
      ],
      primaryBars: countBy(rows, (row) => balitaBucket(row.jumlah_balita_0_5_tahun)),
      secondary: readinessVisual(),
      listTitle: 'KK prioritas monitoring balita',
      priorityRows: buildPriorityRows(toddlerRows, ['jumlah_balita_0_5_tahun', 'sumber_air_minum_terbanyak_dari', 'fasilitas_jamban']),
    }
  }

  if (categoryId === 'pkh') {
    return assistanceDashboard(rows, activeField, 'PKH', 'program_keluarga_harapan_pkh', ['Program Keluarga Harapan'])
  }

  if (categoryId === 'blt_kesra') {
    const kesraRows = rows.filter((row) => containsAny(row.bantuan_lainnya, ['kesra']) || isYes(row.bantuan_sosial_tunai))
    return {
      metrics: [
        metric('Proxy Penerima', kesraRows.length, 'Bansos tunai / bantuan_lainnya'),
        metric('Bansos Tunai', countYes(rows, 'bantuan_sosial_tunai'), 'Kolom tersedia'),
        metric('Kolom BLT Kesra', 'Belum Ada', 'Sebaiknya tambah kolom khusus'),
        metric('Total KK', totalRows, 'Data sensus aktif'),
      ],
      primaryBars: countBy(rows, activeField),
      secondary: donutVisual('Proxy BLT Kesra', 'Bantuan', kesraRows.length, totalRows - kesraRows.length, 'Terindikasi', 'Tidak'),
      listTitle: 'KK terindikasi BLT Kesra',
      priorityRows: buildPriorityRows(kesraRows, ['bantuan_sosial_tunai', 'bantuan_lainnya']),
    }
  }

  if (categoryId === 'bapanas') {
    const bapanasRows = rows.filter((row) => containsAny(row.bantuan_lainnya, ['bapanas', 'pangan', 'sembako']))
    return {
      metrics: [
        metric('Terindikasi', bapanasRows.length, 'Dari bantuan_lainnya'),
        metric('Kolom Bapanas', 'Belum Ada', 'Perlu tambah kolom khusus'),
        metric('Bantuan Lainnya Terisi', rows.filter((row) => hasText(row.bantuan_lainnya)).length, 'Sumber sementara'),
        metric('Total KK', totalRows, 'Data sensus aktif'),
      ],
      primaryBars: countBy(rows, activeField),
      secondary: donutVisual('Proxy Bapanas', 'Bantuan pangan', bapanasRows.length, totalRows - bapanasRows.length, 'Terindikasi', 'Tidak'),
      listTitle: 'KK terindikasi bantuan pangan',
      priorityRows: buildPriorityRows(bapanasRows, ['bantuan_lainnya', 'jumlah_anggota_dalam_keluarga']),
    }
  }

  if (categoryId === 'blt_nagari') {
    return assistanceDashboard(rows, activeField, 'BLT Nagari', 'blt_dana_desa', ['BLT Dana Desa'])
  }

  if (categoryId === 'sumber_daya_air') {
    const riceArea = sumField(rows, 'luas_sawah')
    const pondArea = sumField(rows, 'luas_kolam_ikan')
    const farmRows = rows.filter((row) => toNumber(row.luas_sawah) > 0 || toNumber(row.luas_kolam_ikan) > 0)
    return {
      metrics: [
        metric('Luas Sawah', formatArea(riceArea), 'Total meter persegi'),
        metric('Luas Kolam', formatArea(pondArea), 'Total meter persegi'),
        metric('KK Punya SDA', farmRows.length, 'Sawah / kolam ikan'),
        metric('Air Perpipaan', countMatching(rows, 'sumber_air_minum_terbanyak_dari', ['pipa', 'pamsimas', 'ledeng']), 'Sumber air minum'),
      ],
      primaryBars: countBy(rows, activeField),
      secondary: landUseVisual(rows),
      listTitle: 'KK dengan aset sumber daya air',
      priorityRows: buildPriorityRows(farmRows, ['luas_sawah', 'luas_kolam_ikan', 'intensitas_tanam_padi_dalam_setahun']),
    }
  }

  const coordinateRows = rows.filter((row) => hasText(row.titik_koordinat_x) && hasText(row.titik_koordinat_y))
  return {
    metrics: [
      metric('Total KK', totalRows, 'Data sensus aktif'),
      metric('Koordinat Ada', coordinateRows.length, 'Siap dipetakan'),
      metric('Jorong Terbaca', countBy(rows, (row) => extractJorong(row.alamat_lengkap)).length, 'Dari alamat_lengkap'),
      metric('Kondisi Kumuh', countMatching(rows, 'secara_keseluruhan_kondisi_rumah', ['kumuh']) - countMatching(rows, 'secara_keseluruhan_kondisi_rumah', ['tidak kumuh']), 'Perlu intervensi kawasan'),
    ],
    primaryBars: activeField === 'alamat_lengkap' ? countBy(rows, (row) => extractJorong(row.alamat_lengkap)) : countBy(rows, activeField),
    secondary: coordinateVisual(coordinateRows.length, totalRows),
    listTitle: 'KK siap dipetakan',
    priorityRows: buildPriorityRows(coordinateRows, ['alamat_lengkap', 'titik_koordinat_x', 'titik_koordinat_y']),
  }
}

function assistanceDashboard(rows, activeField, title, field, aliases) {
  const totalRows = rows.length
  const recipientRows = rows.filter((row) => isYes(row[field]))

  return {
    metrics: [
      metric(`Penerima ${title}`, recipientRows.length, aliases.join(' / ')),
      metric('Tidak Menerima', Math.max(totalRows - recipientRows.length, 0), 'Berdasarkan jawaban Ya/Tidak'),
      metric('Persentase', formatPercent(recipientRows.length, totalRows), 'Dari total KK'),
      metric('Total KK', totalRows, 'Data sensus aktif'),
    ],
    primaryBars: countBy(rows, activeField),
    secondary: donutVisual(title, 'Penerima bantuan', recipientRows.length, totalRows - recipientRows.length, 'Menerima', 'Tidak'),
    listTitle: `Daftar penerima ${title}`,
    priorityRows: buildPriorityRows(recipientRows, [field, 'jumlah_anggota_dalam_keluarga', 'berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah']),
  }
}

function SecondaryVisual({ visual }) {
  if (visual.type === 'donut') {
    return <DonutVisual visual={visual} />
  }

  if (visual.type === 'age') {
    return <AgeVisual visual={visual} />
  }

  if (visual.type === 'readiness') {
    return <ReadinessVisual />
  }

  if (visual.type === 'land') {
    return <LandUseVisual visual={visual} />
  }

  return <DonutVisual visual={visual} />
}

function HorizontalBars({ data, compact = false }) {
  const normalizedData = data.length ? data : [{ label: 'Tidak ada data', value: 0 }]
  const maxValue = Math.max(...normalizedData.map((item) => item.value), 1)

  return (
    <div className={`category-bars ${compact ? 'is-compact' : ''}`}>
      {normalizedData.slice(0, compact ? 5 : 8).map((item) => (
        <div className="category-bar-row" key={item.label}>
          <div className="category-bar-meta">
            <span>{item.label}</span>
            <strong>{item.value.toLocaleString('id-ID')}</strong>
          </div>
          <div className="category-bar-track">
            <i style={{ width: `${Math.max(item.value ? 8 : 0, Math.round((item.value / maxValue) * 100))}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonutVisual({ visual }) {
  const total = Math.max(visual.a + visual.b, 1)
  const angle = Math.round((visual.a / total) * 360)

  return (
    <div className="category-donut-wrap">
      <div
        className="category-donut"
        style={{ background: `conic-gradient(var(--primary) 0deg ${angle}deg, var(--blue-soft) ${angle}deg 360deg)` }}
      >
        <div>
          <strong>{formatPercent(visual.a, total)}</strong>
          <span>{visual.title}</span>
        </div>
      </div>
      <div className="category-legend-list">
        <span><i className="is-primary" />{visual.aLabel}: {visual.a.toLocaleString('id-ID')}</span>
        <span><i className="is-blue" />{visual.bLabel}: {visual.b.toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}

function AgeVisual({ visual }) {
  return (
    <div className="age-visual">
      {visual.items.map((item) => (
        <div className="age-column" key={item.label}>
          <strong>{item.value.toLocaleString('id-ID')}</strong>
          <div>
            <i style={{ height: `${Math.max(item.value ? 16 : 4, item.percent)}%` }} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function ReadinessVisual() {
  const rows = [
    { label: 'Jumlah balita', status: 'Ada' },
    { label: 'Status stunting', status: 'Belum ada' },
    { label: 'Tinggi/berat badan', status: 'Belum ada' },
    { label: 'Intervensi gizi', status: 'Belum ada' },
  ]

  return (
    <div className="readiness-list">
      {rows.map((row) => (
        <div className={row.status === 'Ada' ? 'is-ready' : ''} key={row.label}>
          <span>{row.label}</span>
          <strong>{row.status}</strong>
        </div>
      ))}
    </div>
  )
}

function LandUseVisual({ visual }) {
  return (
    <div className="land-use-grid">
      {visual.items.map((item) => (
        <div className="land-use-card" key={item.label}>
          <span>{item.label}</span>
          <strong>{formatArea(item.value)}</strong>
        </div>
      ))}
    </div>
  )
}

function PriorityList({ rows }) {
  if (!rows.length) {
    return <div className="empty-state">Belum ada data prioritas pada kategori ini.</div>
  }

  return (
    <div className="priority-list">
      {rows.slice(0, 6).map((row) => (
        <article className="priority-item" key={row.id}>
          <div>
            <strong>{row.name}</strong>
            <span>{row.address}</span>
          </div>
          <small>{row.detail}</small>
        </article>
      ))}
    </div>
  )
}

function metric(label, value, meta) {
  return {
    label,
    value: typeof value === 'number' ? value.toLocaleString('id-ID') : value,
    meta,
  }
}

function donutVisual(title, eyebrow, a, b, aLabel, bLabel) {
  return {
    type: 'donut',
    eyebrow,
    title,
    a,
    b: Math.max(b, 0),
    aLabel,
    bLabel,
  }
}

function ageVisual(children, teens, toddlers) {
  const items = [
    { label: 'Balita', value: toddlers },
    { label: 'Anak 6-12', value: children },
    { label: 'Remaja/Produktif', value: teens },
  ]
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return {
    type: 'age',
    eyebrow: 'Struktur Umur',
    title: 'Komposisi Anak',
    items: items.map((item) => ({ ...item, percent: Math.round((item.value / maxValue) * 100) })),
  }
}

function readinessVisual() {
  return {
    type: 'readiness',
    eyebrow: 'Kesiapan Data',
    title: 'Kolom Stunting',
  }
}

function landUseVisual(rows) {
  return {
    type: 'land',
    eyebrow: 'Aset Air',
    title: 'Luas Lahan Terkait Air',
    items: [
      { label: 'Sawah', value: sumField(rows, 'luas_sawah') },
      { label: 'Kolam Ikan', value: sumField(rows, 'luas_kolam_ikan') },
      { label: 'Kebun Muda', value: sumField(rows, 'luas_kebun_tanaman_muda') },
      { label: 'Kebun Tua', value: sumField(rows, 'luas_kebun_tanaman_tua') },
    ],
  }
}

function coordinateVisual(available, total) {
  return donutVisual('Koordinat KK', 'Kesiapan Spasial', available, total - available, 'Ada koordinat', 'Belum ada')
}

function countBy(rows, accessor) {
  const counts = new Map()

  rows.forEach((row) => {
    const label = typeof accessor === 'function' ? accessor(row) : row[accessor]
    const normalizedLabel = String(label || 'Kosong').trim() || 'Kosong'
    counts.set(normalizedLabel, (counts.get(normalizedLabel) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
}

function countYes(rows, field) {
  return rows.filter((row) => isYes(row[field])).length
}

function countMatching(rows, field, keywords) {
  return rows.filter((row) => containsAny(row[field], keywords)).length
}

function sumField(rows, field) {
  return rows.reduce((total, row) => total + toNumber(row[field]), 0)
}

function isSanitationRisk(row) {
  return (
    containsAny(row.fasilitas_mck, ['tidak', 'tetangga', 'umum', 'berkelompok']) ||
    containsAny(row.fasilitas_jamban, ['tidak', 'umum', 'bersama', 'tetangga']) ||
    containsAny(row.jenis_kloset, ['cemplung']) ||
    containsAny(row.kondisi_drainase_disekitar_rumah, ['tersumbat', 'rusak', 'tidak ada']) ||
    containsAny(row.tempat_pembuangan_sampah, ['tidak ada', 'lubang', 'dibakar'])
  )
}

function isLimitedWaterAccess(row) {
  return containsAny(row.sumber_air_minum_terbanyak_dari, ['tadah', 'hujan', 'sungai']) ||
    containsAny(row.sumber_air_mandi_terbanyak_dari, ['tadah', 'hujan', 'sungai'])
}

function hasDropout(row) {
  const value = String(row.apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma || '').trim().toLowerCase()
  return Boolean(value) && !['tidak', 'tidak ada', '-'].includes(value)
}

function buildPriorityRows(rows, fields) {
  return rows.map((row) => ({
    id: `${row.id}-${fields.join('-')}`,
    name: row.nama_kepala_keluarga || row.nama_responden || 'Tanpa nama',
    address: row.alamat_lengkap || 'Alamat belum terisi',
    detail: fields
      .map((field) => row[field])
      .filter((value) => hasText(value))
      .slice(0, 3)
      .join(' | ') || 'Detail belum terisi',
  }))
}

function balitaBucket(value) {
  const number = toNumber(value)

  if (number <= 0) return 'Tidak ada balita'
  if (number === 1) return '1 balita'
  return '2+ balita'
}

function extractJorong(address) {
  return getJorongLabel(address)
}

function containsAny(value, keywords) {
  const normalizedValue = String(value || '').toLowerCase()
  return keywords.some((keyword) => normalizedValue.includes(keyword.toLowerCase()))
}

function isYes(value) {
  const normalizedValue = String(value || '').trim().toLowerCase()
  return normalizedValue === 'ya' || normalizedValue === 'iya'
}

function hasText(value) {
  return String(value ?? '').trim().length > 0
}

function toNumber(value) {
  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatPercent(value, total) {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

function formatArea(value) {
  return `${Math.round(value).toLocaleString('id-ID')} m2`
}

export default CategoryDashboards
