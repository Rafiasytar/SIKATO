import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import KpiCard from '../components/KpiCard'
import Sidebar from '../components/Sidebar'
import { matchesJorongFilter } from '../utils/jorongParser'

function countBy(items = [], key) {
  return items.reduce((acc, item) => {
    const rawVal = item[key]
    const label = rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '' ? String(rawVal).trim().toUpperCase() : 'TIDAK DIISI'
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
}

function isPositiveAnswer(val) {
  if (!val) return false
  const s = String(val).toUpperCase().trim()
  return s === 'YA' || s === 'ADA' || s === 'DAPAT' || s === 'PENERIMA' || s === '1' || s === 'IYA' || s === 'PUNYA' || s === 'SUDAH' || (s.includes('YA') && !s.includes('TIDAK'))
}

function countYes(items = [], key) {
  return items.filter((item) => {
    const val = String(item[key] || '').toUpperCase().trim()
    return isPositiveAnswer(val) || val.includes('YA') || val.includes('ADA') || val.includes('PUNYA') || val.includes('1') || val.includes('TERCOVER') || val.includes('BPJS') || val.includes('MANDIRI') || val.includes('PESERTA') || val.includes('SUDAH') || val.includes('IYA')
  }).length
}

function parseAge(value) {
  const age = parseInt(String(value || '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(age) ? age : null
}

function normalizeMaritalStatus(value) {
  const raw = String(value || '').trim().toUpperCase()
  if (!raw || raw === '-' || raw === 'TIDAK DIISI') return 'TIDAK DIISI'
  if (raw.includes('BELUM')) return 'BELUM KAWIN'
  if (raw.includes('CERAI HIDUP')) return 'CERAI HIDUP'
  if (raw.includes('CERAI MATI')) return 'CERAI MATI'
  if (raw.includes('KAWIN') || raw.includes('MENIKAH')) return 'KAWIN'
  return raw
}

function countByNormalized(items = [], normalizeFn) {
  return items.reduce((acc, item) => {
    const label = String(normalizeFn(item) || '').toUpperCase()
    acc[label] = (acc[label] || 0) + 1
    return acc
  }, {})
}

function topCategoryData(items = [], key, limit = 5, otherLabel = 'LAINNYA') {
  const counts = countBy(items, key)
  const sorted = Object.entries(counts)
    .filter(([label]) => label !== 'TIDAK DIISI' && label !== '-')
    .sort((a, b) => b[1] - a[1])

  const top = sorted.slice(0, limit).map(([label, value], i) => ({
    label,
    value,
    color: PALETTE[i % PALETTE.length],
  }))

  const restTotal = sorted.slice(limit).reduce((sum, [, value]) => sum + value, 0)
  if (restTotal > 0) {
    top.push({ label: otherLabel, value: restTotal, color: '#94a3b8' })
  }

  return top
}

function isBpjsCovered(row) {
  const health = String(row.jaminan_sosial_kesehatan || '').toUpperCase().trim()
  const detail = String(row.jika_punya || '').toUpperCase().trim()
  const combined = `${health} ${detail}`
  if (combined.includes('BUKAN PESERTA') || combined.includes('TIDAK PUNYA') || combined.includes('BELUM')) return false
  return (
    combined.includes('BPJS') ||
    combined.includes('KIS') ||
    combined.includes('PBI') ||
    combined.includes('MANDIRI') ||
    combined.includes('PEMERINTAH') ||
    combined.includes('PESERTA')
  )
}

const PALETTE = ['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#ef4444', '#14b8a6', '#f97316', '#06b6d4', '#84cc16']

// Header Card Action Button dengan Icon & Typography Harmonis Setipe Web UI
function CardHeader({ title, subtitle, icon, onExpand }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px',
        gap: '10px',
        cursor: onExpand ? 'pointer' : 'default',
      }}
      onClick={(e) => {
        if (onExpand) {
          e.stopPropagation()
          onExpand()
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {icon && (
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #f0fdf4 0%, #e6f4f1 100%)', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', flexShrink: 0, marginTop: '1px', boxShadow: '0 2px 4px rgba(13,148,136,0.06)' }}>
            <Icon name={icon} size={18} />
          </div>
        )}
        <div>
          <h3 style={{ margin: '0', fontSize: '0.96rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>{title}</h3>
          {subtitle && <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#64748b', fontFamily: 'var(--font-body)' }}>{subtitle}</p>}
        </div>
      </div>
      {onExpand && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onExpand()
          }}
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1px solid #0d9488',
            borderRadius: '8px',
            padding: '5px 12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#0d9488',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(13,148,136,0.12)',
            zIndex: 10,
          }}
          title="Perbesar & Lihat Data Detail"
        >
          <Icon name="search" size={14} />
          <span>Perbesar</span>
        </button>
      )}
    </div>
  )
}

// 1. SVG Donut Chart dengan Ring Modern, Center KPI Core & Compact Legend
function SvgDonutChart({ data = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const actualTotal = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])
  const totalForCalc = actualTotal || 1

  const radius = 68, strokeWidth = 24
  const circumference = 2 * Math.PI * radius

  let cumulativeAngle = 0
  const slices = data.map((d, i) => {
    const pct = actualTotal === 0 ? 0 : d.value / totalForCalc
    const strokeDasharray = `${pct * circumference} ${circumference}`
    const strokeDashoffset = -cumulativeAngle * circumference
    cumulativeAngle += pct

    return {
      ...d,
      pct,
      percentage: actualTotal === 0 ? 0 : Math.round(pct * 100),
      strokeDasharray,
      strokeDashoffset,
      color: d.color || PALETTE[i % PALETTE.length],
    }
  })

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '22px 24px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: isExpanded ? 'wrap' : 'nowrap', flex: 1, marginTop: '6px' }}>
        {/* Ring Donut SVG - Enlarged to 340px when expanded */}
        <div style={{ position: 'relative', width: isExpanded ? '340px' : '210px', height: isExpanded ? '340px' : '210px', flexShrink: 0 }}>
          <svg viewBox="0 0 180 180" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
            {slices.map((slice, idx) => (
              <circle
                key={slice.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                opacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.35}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(slice)}
              />
            ))}
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              width: isExpanded ? '180px' : '105px',
              height: isExpanded ? '180px' : '105px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #ffffff 60%, #f8fafc 100%)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <strong style={{ display: 'block', fontSize: isExpanded ? '2.2rem' : '1.45rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
              {hoveredIdx !== null && slices[hoveredIdx] ? slices[hoveredIdx].percentage + '%' : actualTotal}
            </strong>
            <span style={{ fontSize: isExpanded ? '0.85rem' : '0.68rem', color: '#64748b', fontWeight: 700, marginTop: '2px', maxWidth: isExpanded ? '150px' : '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)' }}>
              {hoveredIdx !== null && slices[hoveredIdx] ? slices[hoveredIdx].label : 'Total Warga'}
            </span>
          </div>
        </div>

        {/* Compact Streamlined Right Side Legend Badges */}
        <div style={{ flex: 1, minWidth: '130px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          {slices.map((slice, idx) => (
            <div
              key={slice.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSliceClick && onSliceClick(slice)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: hoveredIdx === idx ? '#f1f5f9' : '#f8fafc',
                borderLeft: `4px solid ${slice.color}`,
                borderTop: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{slice.label}</span>
              </div>
              <strong style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.82rem', fontFamily: 'var(--font-heading)', marginLeft: '6px', flexShrink: 0 }}>
                {slice.value} <span style={{ fontSize: '0.7rem', color: slice.color, fontWeight: 800 }}>({slice.percentage}%)</span>
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 1B. SVG Classic Full Pie Chart (Diagram Lingkaran Klasik Penuh - Besar & Elegan)
function SvgPieChart({ data = [], title, subtitle, icon = 'pie_chart', onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const actualTotal = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])
  const totalForCalc = actualTotal === 0 ? 1 : actualTotal

  const cx = 105, cy = 105, r = 90

  const slices = useMemo(() => {
    let cumulativeAngle = -Math.PI / 2 // Start from top 12 o'clock (-90 deg)
    return data.map((d, i) => {
      const pct = actualTotal === 0 ? 0 : d.value / totalForCalc
      const angle = pct * 2 * Math.PI
      const startAngle = cumulativeAngle
      const endAngle = cumulativeAngle + angle
      cumulativeAngle += angle

      const x0 = cx + r * Math.cos(startAngle)
      const y0 = cy + r * Math.sin(startAngle)
      const x1 = cx + r * Math.cos(endAngle)
      const y1 = cy + r * Math.sin(endAngle)
      const largeArc = angle > Math.PI ? 1 : 0

      const midAngle = startAngle + angle / 2
      const labelRadius = r * 0.62
      const lx = cx + labelRadius * Math.cos(midAngle)
      const ly = cy + labelRadius * Math.sin(midAngle)

      const pathData = pct >= 0.999
        ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
        : `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z`

      return {
        ...d,
        pct,
        percentage: actualTotal === 0 ? 0 : Math.round(pct * 100),
        color: d.color || PALETTE[i % PALETTE.length],
        pathData,
        lx,
        ly,
        midAngle,
      }
    })
  }, [data, actualTotal, totalForCalc])

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', flex: 1, minHeight: '230px' }}>
        {/* Large Prominent Pie SVG - Enlarged when expanded */}
        <div style={{ position: 'relative', width: isExpanded ? '340px' : '205px', height: isExpanded ? '340px' : '205px', flexShrink: 0 }}>
          <svg viewBox="0 0 210 210" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <circle cx={cx} cy={cy} r={r} fill="#f1f5f9" />
            {slices.map((slice, idx) => {
              const isHov = hoveredIdx === idx
              const dx = isHov ? 6 * Math.cos(slice.midAngle) : 0
              const dy = isHov ? 6 * Math.sin(slice.midAngle) : 0
              return (
                <g key={slice.label}
                  transform={`translate(${dx}, ${dy})`}
                  style={{ transition: 'transform 0.25s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSliceClick && onSliceClick(slice)}
                >
                  <path
                    d={slice.pathData}
                    fill={slice.color}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    opacity={hoveredIdx === null || isHov ? 1 : 0.45}
                    style={{ transition: 'opacity 0.25s ease' }}
                  />
                  {slice.pct >= 0.07 && (
                    <text
                      x={slice.lx}
                      y={slice.ly + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="800"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.4)', fontFamily: 'var(--font-heading)' }}
                    >
                      {slice.percentage}%
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        {/* Compact & Clean Minimalist Legend List */}
        <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          {slices.map((slice, idx) => {
            const isHov = hoveredIdx === idx
            return (
              <div
                key={slice.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(slice)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: isHov ? '#f1f5f9' : '#f8fafc',
                  border: isHov ? `1px solid ${slice.color}` : '1px solid #e2e8f0',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: slice.color, flexShrink: 0 }} />
                  <span style={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {slice.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                  <strong style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {slice.value}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: slice.color, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    ({slice.percentage}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 2. SVG Horizontal Bar Chart dengan Circular Rank Counters, Pill Badges & Scrollable Support
function SvgBarChart({ data = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const totalVal = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])
  const isScrollable = data.length > (isExpanded ? 12 : 5)
  const maxContainerHeight = isExpanded ? '520px' : '270px'

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', height: '100%', borderRadius: '12px', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '16px' : '11px', flex: 1, maxHeight: maxContainerHeight, overflowY: isScrollable ? 'auto' : 'visible', paddingRight: isScrollable ? '6px' : '0' }}>
        {data.map((item, i) => {
          const widthPct = Math.round((item.value / maxVal) * 100)
          const realPct = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0
          const barColor = item.color || PALETTE[i % PALETTE.length]
          const isHov = hoveredIdx === i
          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSliceClick && onSliceClick(item)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                transform: isHov ? 'translateX(6px)' : 'none',
                opacity: hoveredIdx === null || isHov ? 1 : 0.45,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: isExpanded ? '0.9rem' : '0.8rem', marginBottom: '5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: isExpanded ? '26px' : '22px', height: isExpanded ? '26px' : '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #e6f4f1 0%, #f0fdf4 100%)', border: '1px solid #ccfbf1', color: '#0f766e', fontSize: isExpanded ? '0.8rem' : '0.72rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--font-heading)' }}>
                    #{i + 1}
                  </span>
                  <span style={{ fontWeight: 700, color: '#334155', fontSize: isExpanded ? '0.92rem' : '0.82rem', fontFamily: 'var(--font-body)' }}>{item.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#0f172a', fontSize: isExpanded ? '0.98rem' : '0.88rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{item.value} {item.unit || ''}</strong>
                  <span style={{ background: '#f0fdf4', color: '#0f766e', border: '1px solid #bbf7d0', fontSize: isExpanded ? '0.8rem' : '0.72rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {realPct}%
                  </span>
                </div>
              </div>
              <div style={{ height: isExpanded ? '16px' : '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', padding: '1.5px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: `${Math.max(widthPct, 4)}%`, height: '100%', background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`, borderRadius: '5px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 3. Grouped Bar Chart dengan Container Cards & Dual Gradient Progress Bars
function SvgGroupedBarChart({ data = [], categories = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredKey, setHoveredKey] = useState(null)
  const maxVal = useMemo(() => {
    let max = 1
    data.forEach((d) => {
      categories.forEach((cat) => {
        if ((d[cat.key] || 0) > max) max = d[cat.key]
      })
    })
    return max
  }, [data, categories])

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '16px' : '10px' }}>
        {data.map((item) => (
          <div key={item.groupLabel} style={{ background: '#f8fafc', padding: isExpanded ? '16px 20px' : '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: isExpanded ? '0.94rem' : '0.82rem', fontWeight: 700, color: '#0f172a', marginBottom: isExpanded ? '12px' : '8px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-heading)' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0d9488' }} />
              {item.groupLabel}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '12px' : '7px' }}>
              {categories.map((cat) => {
                const val = item[cat.key] || 0
                const widthPct = Math.round((val / maxVal) * 100)
                const uniqueKey = `${item.groupLabel}_${cat.key}`
                const isHov = hoveredKey === uniqueKey
                return (
                  <div
                    key={cat.key}
                    onMouseEnter={() => setHoveredKey(uniqueKey)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() => onSliceClick && onSliceClick({ label: `${item.groupLabel} (${cat.label})`, key: cat.key, value: val })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      transform: isHov ? 'translateX(6px)' : 'none',
                      opacity: hoveredKey === null || isHov ? 1 : 0.45,
                    }}
                  >
                    <span style={{ fontSize: isExpanded ? '0.86rem' : '0.76rem', width: isExpanded ? '135px' : '105px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.label}:
                    </span>
                    <div style={{ flex: 1, height: isExpanded ? '14px' : '9px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.max(widthPct, 4)}%`, height: '100%', background: cat.color, borderRadius: '5px', transition: 'width 0.5s ease' }} />
                    </div>
                    <strong style={{ fontSize: isExpanded ? '0.92rem' : '0.8rem', width: '40px', textAlign: 'right', color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
                      {val}
                    </strong>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 4. Power BI Multi-Segment Speedometer Gauge (Multi-Category Arc & Sub-Metrics)
function SvgRadialGauge({ value = 0, max = 100, title, subtitle, label, icon = 'signal', color = '#0d9488', subMetrics = [], isMultiSegment = false, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const radius = 90, cx = 120, cy = 110
  const ticks = [0, 25, 50, 75, 100]
  const semiCircumference = Math.PI * radius

  // Calculate total from subMetrics if available
  const subMetricsTotal = useMemo(() => {
    if (subMetrics && subMetrics.length > 0) {
      return subMetrics.reduce((sum, sm) => sum + (sm ? (sm.value || 0) : 0), 0)
    }
    return max || 100
  }, [subMetrics, max])

  // Order subMetrics logically for Speedometer dial (Lambat -> Sedang -> Cepat)
  const orderedMetrics = useMemo(() => {
    if (!subMetrics || subMetrics.length === 0) return []
    const copy = [...subMetrics]
    return copy.sort((a, b) => {
      const la = String(a.label || '').toLowerCase()
      const lb = String(b.label || '').toLowerCase()
      const score = (l) => {
        if (l.includes('lambat') || l.includes('buruk') || l.includes('tidak') || l.includes('belum')) return 1
        if (l.includes('sedang') || l.includes('cukup') || l.includes('paruh')) return 2
        if (l.includes('cepat') || l.includes('baik') || l.includes('ya') || l.includes('sudah')) return 3
        return 2
      }
      return score(la) - score(lb)
    })
  }, [subMetrics])

  // Multi-segment strokeDasharray calculations along top semi-circle (only if isMultiSegment is true)
  const segments = useMemo(() => {
    if (!isMultiSegment || !orderedMetrics || orderedMetrics.length === 0 || subMetricsTotal <= 0) return []
    let currentPct = 0
    return orderedMetrics.map((sm, idx) => {
      const itemPct = (sm.value / subMetricsTotal) * 100
      const startPct = currentPct
      const endPct = currentPct + itemPct
      currentPct = endPct

      const segLen = (itemPct / 100) * semiCircumference
      const offset = -((startPct / 100) * semiCircumference)
      const midPct = (startPct + endPct) / 2
      const midAngRad = ((180 - (midPct / 100) * 180) * Math.PI) / 180

      return {
        ...sm,
        itemPct: Math.round(itemPct),
        segLen,
        offset,
        midAngRad,
        color: sm.color || PALETTE[idx % PALETTE.length],
        originalIdx: subMetrics.findIndex(orig => orig.label === sm.label)
      }
    })
  }, [isMultiSegment, orderedMetrics, subMetricsTotal, semiCircumference, subMetrics])

  // Default single-gauge calculations
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const dashoffset = semiCircumference - (pct / 100) * semiCircumference

  // Active display metric & needle position
  let activeDisplayPct = pct
  let activeDisplayLabel = label || 'Literasi Digital'
  let needleRad = ((180 - (pct / 100) * 180) * Math.PI) / 180

  if (hoveredIdx !== null && subMetrics[hoveredIdx]) {
    const hov = subMetrics[hoveredIdx]
    const hovPct = max > 0 ? Math.round((hov.value / max) * 100) : (hov.pct || 0)
    activeDisplayPct = hovPct
    activeDisplayLabel = hov.label
    needleRad = ((180 - (hovPct / 100) * 180) * Math.PI) / 180
  } else if (isMultiSegment && segments.length > 0) {
    const fastOrGood = subMetrics.filter(s => s && !String(s.label || '').toLowerCase().includes('lambat') && !String(s.label || '').toLowerCase().includes('belum'))
    const goodVal = fastOrGood.reduce((sum, s) => sum + s.value, 0)
    const goodPct = Math.round((goodVal / subMetricsTotal) * 100)
    
    if (fastOrGood.length > 0 && segments.length >= 3) {
      activeDisplayPct = goodPct
      activeDisplayLabel = label || 'Sinyal Memadai'
      needleRad = ((180 - (goodPct / 100) * 180) * Math.PI) / 180
    }
  }

  const needleLen = radius - 15
  const nx = cx + needleLen * Math.cos(needleRad)
  const ny = cy - needleLen * Math.sin(needleRad)

  const basePathD = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon || 'signal'} onExpand={onExpand} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', flex: 1, minHeight: '230px' }}>
        {/* Left Side: Prominent Speedometer Gauge SVG */}
        <div style={{ position: 'relative', width: isExpanded ? '440px' : '255px', height: isExpanded ? '280px' : '160px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 240 135" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* Background Base Arc */}
            <path d={basePathD} fill="none" stroke="#f1f5f9" strokeWidth="16" strokeLinecap="round" />

            {/* Multi-Segment Arcs OR Single Gradient Arc */}
            {segments.length > 0 ? (
              segments.map((seg) => {
                const isHov = hoveredIdx === seg.originalIdx
                return (
                  <path
                    key={seg.label}
                    d={basePathD}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHov ? 20 : 16}
                    strokeDasharray={`${seg.segLen} ${semiCircumference}`}
                    strokeDashoffset={seg.offset}
                    style={{ transition: 'all 0.3s ease', opacity: hoveredIdx === null || isHov ? 1 : 0.4, cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIdx(seg.originalIdx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSliceClick && onSliceClick(seg)}
                  >
                    <title>{`${seg.label}: ${seg.value} (${seg.itemPct}%)`}</title>
                  </path>
                )
              })
            ) : (
              <path d={basePathD} fill="none" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round" strokeDasharray={semiCircumference} strokeDashoffset={dashoffset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            )}

            {/* Scale Markings */}
            {ticks.map(t => {
              const ang = (180 - (t / 100) * 180) * Math.PI / 180
              const tx = cx + (radius + 14) * Math.cos(ang)
              const ty = cy - (radius + 14) * Math.sin(ang)
              return (
                <text key={t} x={tx} y={ty} textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="700">{t}%</text>
              )
            })}

            {/* Indicator Needle */}
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" style={{ transition: 'all 0.4s ease' }} />
            <circle cx={cx} cy={cy} r="5.5" fill="#0f172a" />
            
            {/* Center Percentage Value & Label */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="#0f172a" fontSize="24" fontWeight="800" fontFamily="var(--font-heading)">{activeDisplayPct}%</text>
            <text x={cx} y={cy + 18} textAnchor="middle" fill="#0f766e" fontSize="11" fontWeight="800" fontFamily="var(--font-heading)">
              {activeDisplayLabel}
            </text>
          </svg>
        </div>

        {/* Right Side: Interactive Sub-Metrics List */}
        {subMetrics && subMetrics.length > 0 && (
          <div style={{ flex: 1, minWidth: '170px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
            {subMetrics.map((sm, idx) => {
              const isHov = hoveredIdx === idx
              const itemColor = sm.color || PALETTE[idx % PALETTE.length]
              const displayPct = (max && max > 0) ? Math.round((sm.value / max) * 100) : (sm.pct !== undefined ? sm.pct : 0)
              return (
                <div
                  key={sm.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSliceClick && onSliceClick(sm)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isHov ? '#f1f5f9' : '#f8fafc',
                    border: isHov ? `1.5px solid ${itemColor}` : '1px solid #e2e8f0',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    transform: isHov ? 'translateX(3px)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: itemColor, flexShrink: 0 }} />
                    <span style={{ color: isHov ? '#0f172a' : '#334155', fontWeight: isHov ? 800 : 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sm.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                    <strong style={{ fontSize: '0.84rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      {sm.value}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: itemColor, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      ({displayPct}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// 5. Heatmap Matrix Grid Component
function SvgHeatmapGrid({ matrixData = [], rowsLabels = [], colsLabels = [], title, onExpand }) {
  return (
    <div className="panel" style={{ padding: '18px 22px', height: '100%' }}>
      {title && <CardHeader title={title} subtitle="Matriks Kepadatan Layanan" onExpand={onExpand} />}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '6px', textTransform: 'uppercase', color: '#64748b', textAlign: 'left', fontSize: '0.7rem' }}>Pendidikan \ Akses</th>
              {colsLabels.map((c) => (
                <th key={c} style={{ padding: '6px', textAlign: 'center', color: '#475569', fontWeight: 700 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowsLabels.map((rowLabel, rIdx) => (
              <tr key={rowLabel}>
                <td style={{ padding: '6px', fontWeight: 600, color: '#1e293b' }}>{rowLabel}</td>
                {colsLabels.map((_, cIdx) => {
                  const val = matrixData[rIdx]?.[cIdx] || 0
                  const intensity = Math.min(val * 15, 100)
                  return (
                    <td
                      key={cIdx}
                      style={{
                        padding: '9px',
                        textAlign: 'center',
                        fontWeight: 800,
                        color: intensity > 40 ? '#ffffff' : '#0f172a',
                        backgroundColor: `rgba(13, 148, 136, ${Math.max(intensity / 100, 0.12)})`,
                        borderRadius: '6px',
                        border: '2px solid #ffffff',
                      }}
                    >
                      {val} Jiwa
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// 6. Polygonal Radar Vulnerability Chart
function SvgRadarChart({ data = [], title, onExpand }) {
  return (
    <div className="panel" style={{ padding: '18px 22px', height: '100%' }}>
      {title && <CardHeader title={title} subtitle="Kerawanan Risiko Bencana Nagari" onExpand={onExpand} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((item) => (
          <div key={item.label} style={{ background: '#fef2f2', padding: '9px 12px', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#dc2626' }}><Icon name="alert" size={16} /></span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b' }}>{item.label}</span>
            </div>
            <strong style={{ fontSize: '0.85rem', color: '#dc2626' }}>{item.value} Rumah <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>({item.percentage}%)</span></strong>
          </div>
        ))}
      </div>
    </div>
  )
}

// 7. Power BI Treemap — Squarified layout with proportional block sizes & Legend list
function SvgTreemapChart({ data = [], title, subtitle, onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  const blocks = useMemo(() => {
    if (!data.length || total === 0) return []
    const sorted = data.map((d, i) => ({ ...d, idx: i })).sort((a, b) => b.value - a.value)
    const result = []
    let x = 0, y = 0, w = 100, h = 100
    let remaining = [...sorted]
    let remainingTotal = total

    while (remaining.length > 0) {
      const isHorizontal = w >= h
      const side = isHorizontal ? h : w
      let row = []
      let rowTotal = 0
      let bestAspect = Infinity

      for (let i = 0; i < remaining.length; i++) {
        const testRow = [...row, remaining[i]]
        const testTotal = rowTotal + remaining[i].value
        const rowFraction = testTotal / remainingTotal
        const rowSize = isHorizontal ? w * rowFraction : h * rowFraction

        let worstAspect = 0
        testRow.forEach(item => {
          const itemFraction = item.value / testTotal
          const itemSize = side * itemFraction
          const aspect = Math.max(rowSize / itemSize, itemSize / rowSize)
          if (aspect > worstAspect) worstAspect = aspect
        })

        if (worstAspect <= bestAspect || row.length === 0) {
          bestAspect = worstAspect
          row = testRow
          rowTotal = testTotal
        } else {
          break
        }
      }

      const rowFraction = rowTotal / remainingTotal
      const rowSize = isHorizontal ? w * rowFraction : h * rowFraction
      let offset = 0

      row.forEach(item => {
        const itemFraction = item.value / rowTotal
        const itemSize = side * itemFraction
        const block = isHorizontal
          ? { x: x, y: y + offset, w: rowSize, h: itemSize }
          : { x: x + offset, y: y, w: itemSize, h: rowSize }
        result.push({ ...item, ...block })
        offset += itemSize
      })

      if (isHorizontal) { x += rowSize; w -= rowSize }
      else { y += rowSize; h -= rowSize }

      remaining = remaining.slice(row.length)
      remainingTotal -= rowTotal
    }
    return result
  }, [data, total])

  return (
    <div className="panel" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {title && <CardHeader title={title} subtitle={subtitle} onExpand={onExpand} />}

      {blocks.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '160px', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.82rem' }}>
          Belum ada data
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative', minHeight: '160px', borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
              {blocks.map((b, i) => {
                const pct = total > 0 ? Math.round((b.value / total) * 100) : 0
                const bg = b.color || PALETTE[b.idx % PALETTE.length]
                const isHovered = hoveredIdx === i
                return (
                  <g key={b.label}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => onSliceClick && onSliceClick(b)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect x={b.x + 0.3} y={b.y + 0.3} width={Math.max(b.w - 0.6, 0.1)} height={Math.max(b.h - 0.6, 0.1)} rx="0.8" fill={bg} opacity={isHovered ? 1 : 0.88} style={{ transition: 'opacity 0.2s ease' }} />
                    {b.w > 12 && b.h > 8 && (
                      <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 1.5} textAnchor="middle" fill="#fff" fontSize={Math.min(b.w / 8, 3.2)} fontWeight="700" style={{ pointerEvents: 'none' }}>
                        {b.label.length > 14 ? b.label.slice(0, 12) + '…' : b.label}
                      </text>
                    )}
                    {b.w > 10 && b.h > 12 && (
                      <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 3.5} textAnchor="middle" fill="#fff" fontSize={Math.min(b.w / 9, 2.8)} fontWeight="800" opacity="0.95" style={{ pointerEvents: 'none' }}>
                        {b.value} ({pct}%)
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Friendly Legend list below treemap for easy reading by laypeople */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.74rem' }}>
            {data.slice(0, 5).map((item, idx) => {
              const bg = item.color || PALETTE[idx % PALETTE.length]
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
              return (
                <div key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 7px', borderRadius: '4px', fontWeight: 600, color: '#334155' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: bg }} />
                  <span>{item.label}: <strong>{item.value}</strong> ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// 8. Power BI Population Pyramid / Horizontal Stacked Funnel
function SvgFunnelChart({ data = [], title, subtitle, onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])
  const totalAll = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const barH = data.length > 0 ? Math.min(18, Math.floor(120 / data.length)) : 18
  const gap = 4
  const totalH = data.length * (barH + gap) - gap

  return (
    <div className="panel" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {title && <CardHeader title={title} subtitle={subtitle} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '140px' }}>
        {totalAll === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', padding: '24px 0' }}>Belum ada data penduduk</div>
        ) : (
        <svg viewBox={`0 0 320 ${totalH + 10}`} style={{ width: '100%', maxHeight: '260px' }}>
          {data.map((item, idx) => {
            const widthPct = maxVal > 0 ? Math.max((item.value / maxVal) * 100, 8) : 8
            const barW = (widthPct / 100) * 130
            const y = idx * (barH + gap) + 5
            const color = item.color || PALETTE[idx % PALETTE.length]
            const isHov = hoveredIdx === idx
            const pct = totalAll > 0 ? Math.round((item.value / totalAll) * 100) : 0
            return (
              <g key={item.label} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)} onClick={() => onSliceClick && onSliceClick(item)} style={{ cursor: 'pointer' }}>
                <text x="88" y={y + barH / 2 + 1} textAnchor="end" fill="#334155" fontSize="7" fontWeight="600" style={{ pointerEvents: 'none' }}>
                  {item.label.length > 18 ? item.label.slice(0, 16) + '…' : item.label}
                </text>
                <rect x={160 - barW / 2} y={y} width={barW} height={barH} rx={barH / 2} fill={color} opacity={isHov ? 1 : 0.85} style={{ transition: 'all 0.3s ease' }} />
                {barW > 24 && (
                  <text x="160" y={y + barH / 2 + 1} textAnchor="middle" fill="#fff" fontSize="6.8" fontWeight="800" style={{ pointerEvents: 'none' }}>{item.value}</text>
                )}
                <text x="232" y={y + barH / 2 + 1} textAnchor="start" fill="#64748b" fontSize="6.8" fontWeight="700" style={{ pointerEvents: 'none' }}>{pct}%</text>
              </g>
            )
          })}
        </svg>
        )}
      </div>
    </div>
  )
}

// 5. Vertical Column Chart dengan 3D Gradient Pillars & Floating Value Tags
function SvgPillarColumnChart({ data = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const colW = 54
  const gap = 24
  const svgW = data.length * (colW + gap) + 30
  const chartH = 175

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isExpanded ? '440px' : '260px', overflow: 'hidden' }}>
        {data.length === 0 || data.every((d) => d.value === 0) ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: isExpanded ? '0.94rem' : '0.82rem', padding: '20px 0' }}>Belum ada data</div>
        ) : (
        <svg viewBox={`0 0 ${svgW} ${chartH + 60}`} style={{ width: '100%', maxWidth: isExpanded ? '800px' : '580px', maxHeight: isExpanded ? '420px' : '310px', overflow: 'visible' }}>
          <defs>
            {data.map((item, idx) => {
              const color = item.color || PALETTE[idx % PALETTE.length]
              return (
                <linearGradient key={`grad-${idx}`} id={`pillarGrad${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="1" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.8" />
                </linearGradient>
              )
            })}
          </defs>

          {/* Grid Background Lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1="5" y1={chartH * (1 - ratio) + 10} x2={svgW - 5} y2={chartH * (1 - ratio) + 10} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          ))}
          <line x1="2" y1={chartH + 10} x2={svgW - 2} y2={chartH + 10} stroke="#cbd5e1" strokeWidth="1.5" />

          {data.map((item, idx) => {
            const hasValue = item.value > 0
            const heightPct = maxVal > 0 && hasValue ? (item.value / maxVal) : 0
            const barH = chartH * heightPct * 0.88
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            const x = 15 + idx * (colW + gap)
            const y = chartH + 10 - barH
            const isHov = hoveredIdx === idx

            // Smart multiline label splitting
            const words = String(item.label || '').split(' ')
            let line1 = String(item.label || ''), line2 = ''
            if (words.length > 2) {
              const mid = Math.ceil(words.length / 2)
              line1 = words.slice(0, mid).join(' ')
              line2 = words.slice(mid).join(' ')
            } else if (words.length === 2 && String(item.label || '').length > 10) {
              line1 = words[0]
              line2 = words[1]
            }

            return (
              <g
                key={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  cursor: 'pointer',
                  opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                  transition: 'opacity 0.25s ease',
                }}
              >
                {/* Wrap the column elements in a translate group */}
                <g transform={`translate(0, ${isHov ? -6 : 0})`} style={{ transition: 'transform 0.25s ease' }}>
                  {hasValue ? (
                    <>
                      <rect x={x} y={y} width={colW} height={barH} rx="8" fill={`url(#pillarGrad${idx})`} opacity={0.88} />
                      
                      {/* Inside Bar Percentage Tag */}
                      {barH >= 40 && (
                        <text x={x + colW / 2} y={y + 18} textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800" style={{ pointerEvents: 'none', fontFamily: 'var(--font-heading)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                          {pct}%
                        </text>
                      )}

                      {/* Floating Value Tag (Jumlah + Persentase) */}
                      <rect x={x + colW / 2 - 26} y={y - 30} width="52" height="26" rx="6" fill="#0f172a" opacity={isHov ? 1 : 0.9} style={{ transition: 'all 0.2s ease', filter: isHov ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' : 'none' }} />
                      <text x={x + colW / 2} y={y - 17} textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="800" style={{ pointerEvents: 'none', fontFamily: 'var(--font-heading)' }}>
                        {item.value}
                      </text>
                      <text x={x + colW / 2} y={y - 7} textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="800" style={{ pointerEvents: 'none', fontFamily: 'var(--font-heading)' }}>
                        ({pct}%)
                      </text>
                    </>
                  ) : (
                    <text x={x + colW / 2} y={chartH + 2} textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="700" style={{ pointerEvents: 'none', fontFamily: 'var(--font-heading)' }}>
                      0 (0%)
                    </text>
                  )}
                </g>

                {/* X-Axis Category Label (Multi-line SVG tspan support) */}
                {line2 ? (
                  <text x={x + colW / 2} y={chartH + 24} textAnchor="middle" fill="#334155" fontSize="8.5" fontWeight="700" style={{ pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>
                    <tspan x={x + colW / 2} dy="0">{line1}</tspan>
                    <tspan x={x + colW / 2} dy="11.5">{line2}</tspan>
                  </text>
                ) : (
                  <text x={x + colW / 2} y={chartH + 26} textAnchor="middle" fill="#334155" fontSize="8.5" fontWeight="700" style={{ pointerEvents: 'none', fontFamily: 'var(--font-body)' }}>
                    {line1}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        )}
      </div>
    </div>
  )
}

// 6. Population Pyramid / Butterfly Chart dengan Dual Gradient Bars & Center Capsules
function SvgPopulationPyramid({ data = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredSegment, setHoveredSegment] = useState(null)
  const maxVal = useMemo(() => {
    let max = 1
    data.forEach((d) => {
      if ((d.laki || 0) > max) max = d.laki
      if ((d.perempuan || 0) > max) max = d.perempuan
    })
    return max
  }, [data])

  const totalLaki = useMemo(() => data.reduce((s, d) => s + (d.laki || 0), 0), [data])
  const totalPerempuan = useMemo(() => data.reduce((s, d) => s + (d.perempuan || 0), 0), [data])

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      {/* Header Summary Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isExpanded ? '20px' : '12px', gap: '10px' }}>
        <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', padding: isExpanded ? '6px 14px' : '4px 10px', borderRadius: '8px', fontSize: isExpanded ? '0.85rem' : '0.75rem', fontWeight: 800, color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>👨 Laki-laki:</span> <strong>{totalLaki} Jiwa</strong>
        </div>
        <div style={{ background: '#fce7f3', border: '1px solid #fbcfe8', padding: isExpanded ? '6px 14px' : '4px 10px', borderRadius: '8px', fontSize: isExpanded ? '0.85rem' : '0.75rem', fontWeight: 800, color: '#be185d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>👩 Perempuan:</span> <strong>{totalPerempuan} Jiwa</strong>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? '16px' : '9px', flex: 1, justifyContent: 'center' }}>
        {data.map((item) => {
          const lakiW = Math.round(((item.laki || 0) / maxVal) * 100)
          const perpW = Math.round(((item.perempuan || 0) / maxVal) * 100)

          const isLakiHov = hoveredSegment !== null && hoveredSegment.label === item.label && hoveredSegment.gender === 'Laki-laki'
          const isPerpHov = hoveredSegment !== null && hoveredSegment.label === item.label && hoveredSegment.gender === 'Perempuan'

          const lakiOpacity = hoveredSegment === null || isLakiHov ? 1 : 0.4
          const perpOpacity = hoveredSegment === null || isPerpHov ? 1 : 0.4
          const ageOpacity = hoveredSegment === null || hoveredSegment.label === item.label ? 1 : 0.6

          return (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: isExpanded ? '14px' : '8px' }}>
              {/* Laki-laki Bar (Left Side) */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: isExpanded ? '10px' : '6px', transition: 'opacity 0.25s ease', opacity: lakiOpacity }}>
                <span style={{ fontSize: isExpanded ? '0.88rem' : '0.74rem', fontWeight: 800, color: '#0284c7' }}>{item.laki || 0}</span>
                <div style={{ flex: 1, maxWidth: isExpanded ? '280px' : '125px', height: isExpanded ? '26px' : '18px', background: '#f1f5f9', borderRadius: '6px 0 0 6px', overflow: 'hidden', display: 'flex', justifyContent: 'flex-end', padding: '1px 0 1px 1px' }}>
                  <div
                    onMouseEnter={() => setHoveredSegment({ label: item.label, gender: 'Laki-laki' })}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => onSliceClick && onSliceClick({ label: `${item.label} (Laki-laki)`, value: item.laki })}
                    style={{
                      width: `${Math.max(lakiW, 4)}%`,
                      height: '100%',
                      background: 'linear-gradient(270deg, #0284c7, #38bdf8)',
                      borderRadius: '5px 0 0 5px',
                      transition: 'all 0.25s ease',
                      transform: isLakiHov ? 'scaleY(1.15) translateX(-4px)' : 'none',
                      cursor: 'pointer'
                    }}
                    title={`Laki-laki ${item.label}: ${item.laki}`}
                  />
                </div>
              </div>

              {/* Center Age Capsule */}
              <div style={{ width: isExpanded ? '130px' : '90px', textAlign: 'center', fontSize: isExpanded ? '0.82rem' : '0.72rem', fontWeight: 800, color: '#1e293b', background: '#f8fafc', padding: isExpanded ? '5px 10px' : '3px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', flexShrink: 0, transition: 'opacity 0.25s ease', opacity: ageOpacity }}>
                {item.label}
              </div>

              {/* Perempuan Bar (Right Side) */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: isExpanded ? '10px' : '6px', transition: 'opacity 0.25s ease', opacity: perpOpacity }}>
                <div style={{ flex: 1, maxWidth: isExpanded ? '280px' : '125px', height: isExpanded ? '26px' : '18px', background: '#f1f5f9', borderRadius: '0 6px 6px 0', overflow: 'hidden', padding: '1px 1px 1px 0' }}>
                  <div
                    onMouseEnter={() => setHoveredSegment({ label: item.label, gender: 'Perempuan' })}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() => onSliceClick && onSliceClick({ label: `${item.label} (Perempuan)`, value: item.perempuan })}
                    style={{
                      width: `${Math.max(perpW, 4)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ec4899, #f472b6)',
                      borderRadius: '0 5px 5px 0',
                      transition: 'all 0.25s ease',
                      transform: isPerpHov ? 'scaleY(1.15) translateX(4px)' : 'none',
                      cursor: 'pointer'
                    }}
                    title={`Perempuan ${item.label}: ${item.perempuan}`}
                  />
                </div>
                <span style={{ fontSize: isExpanded ? '0.88rem' : '0.74rem', fontWeight: 800, color: '#ec4899' }}>{item.perempuan || 0}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 7. Horizontal Stacked Bar Chart dengan Rounded Capsule Track & Legend Grid Cards
function SvgHorizontalStackedBar({ data = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isExpanded ? '24px' : '16px' }}>
        {/* Rounded Stacked Track */}
        <div style={{ height: isExpanded ? '42px' : '28px', background: '#f1f5f9', borderRadius: isExpanded ? '21px' : '14px', overflow: 'hidden', display: 'flex', border: '1.5px solid #e2e8f0', padding: '1px', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
          {data.map((item, i) => {
            const pct = total > 0 ? (item.value / total) * 100 : 0
            if (pct === 0) return null
            const color = item.color || PALETTE[i % PALETTE.length]
            const isHov = hoveredIdx === i
            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: isExpanded ? '0.86rem' : '0.74rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  borderRight: '2px solid #ffffff',
                  transform: isHov ? 'scaleY(1.15)' : 'none',
                  opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                }}
                title={`${item.label}: ${item.value} (${Math.round(pct)}%)`}
              >
                {pct >= 8 ? `${Math.round(pct)}%` : ''}
              </div>
            )
          })}
        </div>

        {/* Legend Grid of Micro Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isExpanded ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
          {data.map((item, i) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            const color = item.color || PALETTE[i % PALETTE.length]
            const isHov = hoveredIdx === i
            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  borderLeft: `4px solid ${color}`,
                  borderTop: '1px solid #e2e8f0',
                  borderRight: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                  padding: isExpanded ? '12px 18px' : '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  transform: isHov ? 'translateX(6px)' : 'none',
                  opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                }}
              >
                <span style={{ fontWeight: 700, color: '#334155', fontSize: isExpanded ? '0.9rem' : '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                <strong style={{ color: '#0f172a', fontWeight: 800, fontSize: isExpanded ? '0.94rem' : '0.84rem', fontFamily: 'var(--font-heading)', marginLeft: '6px' }}>
                  {item.value} <span style={{ fontSize: isExpanded ? '0.8rem' : '0.7rem', color: color, fontWeight: 800 }}>({pct}%)</span>
                </strong>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 7. KPI Alert Banner + Stacked Progress Bar for RTLH & Sanitasi MCK
function SvgKpiStackedProgressBar({ data = [], title, subtitle, icon = 'sanitasi', bannerHeader: customHeader, bannerMainText: customMainText, bannerSubText: customSubText, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]) || 1

  const rtlhItem = data.find((d) => String(d.label).toLowerCase().includes('tidak layak') || String(d.label).toLowerCase().includes('rtlh'))
  const odfItem = data.find((d) => String(d.label).toLowerCase().includes('odf') || String(d.label).toLowerCase().includes('sembarangan'))
  const sehatItem = data.find((d) => String(d.label).toLowerCase().includes('sehat') || String(d.label).toLowerCase().includes('sendiri') || String(d.label).toLowerCase().includes('layak'))

  const isRtlh = !!rtlhItem
  const isOdf = !!odfItem

  const alertVal = rtlhItem ? rtlhItem.value : (odfItem ? odfItem.value : 0)
  const alertPct = Math.round((alertVal / total) * 100)

  const sehatVal = sehatItem ? sehatItem.value : (total - alertVal)
  const sehatPct = Math.round((sehatVal / total) * 100)

  const topItem = data.length > 0 ? [...data].sort((a, b) => b.value - a.value)[0] : null
  const topVal = topItem ? topItem.value : 0

  let bannerHeader = customHeader || (title ? title.replace(/^[0-9.]+\s*/, '').toUpperCase() : 'DISTRIBUSI PROGRAM BANTUAN')
  let bannerMainText = customMainText || (topItem ? `${topVal} KK Penerima ${topItem.label}` : `${total} KK Terdata`)
  let bannerSubText = customSubText || (topItem && total > 0 ? `(${Math.round((topVal / total) * 100)}% Program Terbanyak)` : '')
  let bannerIcon = icon || 'blt_nagari'
  let isDanger = alertVal > 0 && isRtlh

  if (!customHeader && isRtlh) {
    bannerHeader = 'STATUS KELAYAKAN RUMAH NAGARI'
    bannerMainText = `${alertVal} Rumah RTLH`
    bannerSubText = `(${alertPct}%)`
    bannerIcon = 'rumah'
  } else if (!customHeader && isOdf) {
    bannerHeader = 'EVALUASI SANITASI & MCK NAGARI'
    bannerMainText = `${sehatVal} KK Memiliki Jamban Sendiri`
    bannerSubText = `(${sehatPct}% Cakupan Nagari)`
    bannerIcon = 'sanitasi'
    isDanger = alertVal > 15
  }

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: isExpanded ? '28px' : '14px' }}>
        {/* Executive Alert Banner */}
        <div style={{ background: isDanger ? 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: `1px solid ${isDanger ? '#fecdd3' : '#bbf7d0'}`, borderRadius: '12px', padding: isExpanded ? '22px 28px' : '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: isExpanded ? '0.88rem' : '0.68rem', fontWeight: 800, color: isDanger ? '#991b1b' : '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
              {bannerHeader}
            </span>
            <div style={{ fontSize: isExpanded ? '1.9rem' : '1.3rem', fontWeight: 800, color: isDanger ? '#e11d48' : '#15803d', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>
              {bannerMainText} <span style={{ fontSize: isExpanded ? '1.1rem' : '0.8rem', fontWeight: 700, color: isDanger ? '#be123c' : '#0d9488' }}>{bannerSubText}</span>
            </div>
          </div>
          <div style={{ width: isExpanded ? '60px' : '42px', height: isExpanded ? '60px' : '42px', borderRadius: '12px', background: isDanger ? '#ffe4e6' : '#ffffff', border: `1px solid ${isDanger ? '#fecdd3' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDanger ? '#e11d48' : '#0d9488', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <Icon name={bannerIcon} size={isExpanded ? 30 : 22} />
          </div>
        </div>

        <div>
          {/* Progress Track */}
          <div style={{ height: isExpanded ? '32px' : '18px', background: '#f1f5f9', borderRadius: isExpanded ? '16px' : '9px', overflow: 'hidden', display: 'flex', border: '1.5px solid #e2e8f0', padding: '1px' }}>
            {data.map((item, i) => {
              const pct = total > 0 ? (item.value / total) * 100 : 0
              if (pct === 0) return null
              const color = item.color || PALETTE[i % PALETTE.length]
              const isHov = hoveredIdx === i
              return (
                <div
                  key={item.label}
                  onClick={() => onSliceClick && onSliceClick(item)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: color,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    borderRight: '1.5px solid #ffffff',
                    transform: isHov ? 'scaleY(1.15)' : 'none',
                    opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                    position: 'relative',
                    zIndex: isHov ? 10 : 1,
                  }}
                  title={`${item.label}: ${item.value} KK (${Math.round(pct)}%)`}
                />
              )
            })}
          </div>

          {/* Micro Stat Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isExpanded ? '16px' : '8px', marginTop: isExpanded ? '20px' : '10px' }}>
            {data.map((item, i) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
              const color = item.color || PALETTE[i % PALETTE.length]
              const isHov = hoveredIdx === i
              return (
                <div
                  key={item.label}
                  onClick={() => onSliceClick && onSliceClick(item)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: isExpanded ? '12px 18px' : '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.25s ease',
                    transform: isHov ? 'translateX(6px)' : 'none',
                    opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <span style={{ width: isExpanded ? '10px' : '8px', height: isExpanded ? '10px' : '8px', borderRadius: '2.5px', background: color, flexShrink: 0 }} />
                    <span style={{ color: '#475569', fontWeight: 700, fontSize: isExpanded ? '0.88rem' : '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{item.label}</span>
                  </div>
                  <strong style={{ color: '#0f172a', fontWeight: 800, fontSize: isExpanded ? '0.94rem' : '0.78rem', fontFamily: 'var(--font-heading)', marginLeft: '4px', flexShrink: 0 }}>{item.value} <span style={{ fontSize: isExpanded ? '0.82rem' : '0.68rem', color: color }}>({pct}%)</span></strong>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// 12. Distribution Histogram + Top Average KPI Card for Ukuran Anggota Keluarga
function SvgHistogramWithKpi({ data = [], avgMember = 0, title, subtitle, icon, onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
        {/* KPI Banner */}
        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1px solid #bae6fd', borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>RATA-RATA ANGGOTA KELUARGA</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '1px' }}>{avgMember} Jiwa / KK</div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffffff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <Icon name="keluarga" size={20} />
          </div>
        </div>

        {/* Vertical Histogram Columns */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '110px', padding: '0 5px' }}>
          {data.map((item, i) => {
            const heightPct = Math.max((item.value / maxVal) * 100, 10)
            const color = item.color || PALETTE[i % PALETTE.length]
            const isHov = hoveredIdx === i
            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  transform: isHov ? 'translateY(-6px)' : 'none',
                  opacity: hoveredIdx === null || isHov ? 1 : 0.45
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f172a', marginBottom: '3px' }}>{item.value}</span>
                <div style={{ width: '100%', height: `${heightPct}%`, background: `linear-gradient(180deg, ${color}, #0284c7)`, borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease', boxShadow: '0 -2px 5px rgba(0,0,0,0.05)' }} title={`${item.label}: ${item.value} KK`} />
                <span style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 700, marginTop: '6px', whiteSpace: 'nowrap' }}>{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 10. Semi-Circle Gauge / Progress Ring dengan Gauge Scale Ticks & SVG Cards for Status Update KK/KTP
function SvgSemiCircleProgressRing({ data = [], totalAll = 0, title, subtitle, icon, onExpand, onSliceClick }) {
  const sudah = data.find((d) => String(d.label).toLowerCase().includes('sudah'))?.value || 0
  const total = totalAll || data.reduce((s, d) => s + d.value, 0) || 1
  const pct = Math.min(Math.round((sudah / total) * 100), 100)

  const radius = 62, cx = 85, cy = 80
  const semiCircumference = Math.PI * radius
  const dashoffset = semiCircumference - (pct / 100) * semiCircumference
  const ticks = [0, 25, 50, 75, 100]

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', width: '200px', height: '105px' }}>
          <svg viewBox="0 0 170 100" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="kkKtpGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>
            <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`} fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round" />
            <path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
              fill="none"
              stroke="url(#kkKtpGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={semiCircumference}
              strokeDashoffset={dashoffset}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            {/* Gauge Scale Markings */}
            {ticks.map((t) => {
              const ang = ((180 - (t / 100) * 180) * Math.PI) / 180
              const tx = cx + (radius + 11) * Math.cos(ang)
              const ty = cy - (radius + 11) * Math.sin(ang)
              return (
                <text key={t} x={tx} y={ty} textAnchor="middle" fill="#94a3b8" fontSize="5" fontWeight="700">
                  {t}%
                </text>
              )
            })}
            <text x={cx} y={cy - 12} textAnchor="middle" fill="#0f172a" fontSize="24" fontWeight="800">{pct}%</text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill="#64748b" fontSize="7.5" fontWeight="700">Tertib Adduk KK/KTP</text>
          </svg>
        </div>

        {/* Executive Detail Badges with SVG Icons */}
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          {data.map((item) => {
            const itemPct = total > 0 ? Math.round((item.value / total) * 100) : 0
            const isSudah = String(item.label).toLowerCase().includes('sudah')
            return (
              <div
                key={item.label}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  flex: 1,
                  background: isSudah ? '#ccfbf1' : '#fef3c7',
                  border: `1px solid ${isSudah ? '#99f6e4' : '#fde68a'}`,
                  borderRadius: '8px',
                  padding: '7px 10px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: isSudah ? '#0f766e' : '#b45309', fontWeight: 700 }}>
                  <Icon name={isSudah ? 'id_card' : 'info'} size={13} />
                  <span>{item.label}</span>
                </div>
                <strong style={{ fontSize: '0.95rem', color: isSudah ? '#0d9488' : '#d97706', display: 'block', margin: '2px 0' }}>{item.value} Warga</strong>
                <span style={{ fontSize: '0.68rem', color: isSudah ? '#0d9488' : '#d97706', fontWeight: 700 }}>({itemPct}%)</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 11. Power BI Waterfall Flow Chart for Electricity / Stepped Categories
function SvgWaterfallChart({ data = [], title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: isExpanded ? 'center' : 'flex-start', gap: isExpanded ? '20px' : '12px', marginTop: isExpanded ? '0' : '6px' }}>
        {data.map((item, idx) => {
          const widthPct = Math.round((item.value / maxVal) * 100)
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          const color = item.color || PALETTE[(idx + 2) % PALETTE.length]
          const isHov = hoveredIdx === idx
          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSliceClick && onSliceClick(item)}
              style={{
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                transform: isHov ? 'translateX(6px)' : 'none',
                opacity: hoveredIdx === null || isHov ? 1 : 0.45,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '5px' }}>
                <span style={{ fontWeight: 700, color: '#334155', fontFamily: 'var(--font-body)' }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{item.value} KK</strong>
                  <span style={{ background: '#f0fdf4', color: '#0f766e', border: '1px solid #bbf7d0', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{pct}%</span>
                </div>
              </div>
              <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', padding: '1.5px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: `${Math.max(widthPct, 4)}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}dd)`, borderRadius: '5px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 12. Power BI Executive Distribution Gauge & Stacked Progress Bar (Dynamic & Context-Aware)
function SvgBulletChart({ data = [], title, subtitle, icon, onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]) || 1

  const isSanitasi = data.some(d => String(d.label).toLowerCase().includes('jamban') || String(d.label).toLowerCase().includes('mck'))

  const urgentItem = data.find(d => d.isUrgent || String(d.label).toLowerCase().includes('tanpa') || String(d.label).toLowerCase().includes('odf') || String(d.label).toLowerCase().includes('rentan')) || data[2] || data[0]
  const mainItem = data.find(d => d !== urgentItem && (String(d.label).toLowerCase().includes('sendiri') || String(d.label).toLowerCase().includes('layak') || String(d.label).toLowerCase().includes('berhasil'))) || data[0]

  const urgentVal = urgentItem ? urgentItem.value : 0
  const urgentPct = Math.round((urgentVal / total) * 100)

  const mainVal = mainItem ? mainItem.value : 0
  const mainPct = Math.round((mainVal / total) * 100)

  const bannerTitle = isSanitasi ? 'CAKUPAN JAMBAN SENDIRI NAGARI' : 'PRIORITAS PERHATIAN & CAKUPAN'
  const bannerMainText = isSanitasi ? `${mainVal} KK Memiliki Jamban Sendiri` : `${mainVal} KK Tercover`
  const bannerSubText = `(${mainPct}% Cakupan Nagari)`
  const rightLabel = isSanitasi ? 'Tanpa Jamban (ODF):' : 'Prioritas Rentan:'
  const rightVal = `${urgentVal} KK (${urgentPct}%)`

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
        {/* Executive Realisation & Priority Banner */}
        <div style={{ background: isSanitasi ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fff1f2 0%, #f0fdf4 100%)', border: `1px solid ${isSanitasi ? '#bbf7d0' : '#fecdd3'}`, borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: isSanitasi ? '#047857' : '#e11d48', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
              {bannerTitle}
            </span>
            <div style={{ fontSize: '1.18rem', fontWeight: 800, color: isSanitasi ? '#065f46' : '#e11d48', marginTop: '2px', fontFamily: 'var(--font-heading)' }}>
              {bannerMainText} <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSanitasi ? '#059669' : '#be123c' }}>{bannerSubText}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.64rem', color: isSanitasi ? '#0f766e' : '#e11d48', fontWeight: 700 }}>{rightLabel}</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: isSanitasi ? '#0d9488' : '#be123c', fontFamily: 'var(--font-heading)' }}>{rightVal}</div>
          </div>
        </div>

        {/* Dynamic Segmented 100% Track */}
        <div>
          <div style={{ height: '18px', background: '#f1f5f9', borderRadius: '9px', overflow: 'hidden', display: 'flex', border: '1.5px solid #e2e8f0', padding: '1px' }}>
            {data.map((item, idx) => {
              const itemPct = Math.round((item.value / total) * 100)
              const color = item.color || PALETTE[idx % PALETTE.length]
              const isHov = hoveredIdx === idx
              return (
                <div
                  key={item.label}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{
                    width: `${itemPct}%`,
                    height: '100%',
                    background: color,
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    borderRight: idx < data.length - 1 ? '1.5px solid #ffffff' : 'none',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transform: isHov ? 'scaleY(1.15)' : 'none',
                    opacity: hoveredIdx === null || isHov ? 1 : 0.45
                  }}
                  title={`${item.label}: ${item.value} KK (${itemPct}%)`}
                  onClick={() => onSliceClick && onSliceClick(item)}
                >
                  {itemPct >= 4 ? `${itemPct}%` : ''}
                </div>
              )
            })}
          </div>
        </div>

        {/* Dynamic Micro Detail Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          {data.map((item, idx) => {
            const itemPct = Math.round((item.value / total) * 100)
            const color = item.color || PALETTE[idx % PALETTE.length]
            const isHov = hoveredIdx === idx
            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  background: isHov ? '#f1f5f9' : '#f8fafc',
                  border: `1px solid #e2e8f0`,
                  borderTop: `3px solid ${color}`,
                  borderRadius: '7px',
                  padding: '6px 6px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  transform: isHov ? 'translateY(-6px)' : 'none',
                  opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                  boxShadow: isHov ? '0 4px 10px rgba(15,23,42,0.08)' : 'none'
                }}
              >
                <div style={{ fontSize: '0.63rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                <strong style={{ fontSize: '0.82rem', color: '#0f172a', fontFamily: 'var(--font-heading)', display: 'block', marginTop: '1px' }}>{item.value} KK <span style={{ fontSize: '0.65rem', color: color }}>({itemPct}%)</span></strong>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 13. Power BI 10x10 Waffle Infographic Matrix for Citizen Participation
function SvgWaffleChart({
  activeCount = 0,
  totalCount = 100,
  activeLabel = 'Warga Aktif Berpartisipasi',
  inactiveLabel = 'Belum Memberi Usulan',
  unit = 'Jiwa',
  title,
  subtitle,
  icon,
  onExpand,
  onSliceClick,
  isExpanded = false
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const pct = totalCount > 0 ? Math.min(Math.round((activeCount / totalCount) * 100), 100) : 0
  const activeCells = Math.max(Math.round(pct), activeCount > 0 ? 1 : 0)

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: isExpanded ? '32px' : '16px', justifyContent: 'center', flexDirection: isExpanded ? 'row' : 'row', flexWrap: 'wrap' }}>
        {/* 10x10 Waffle Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: isExpanded ? '5px' : '3px', width: isExpanded ? '260px' : '130px', height: isExpanded ? '260px' : '130px', padding: '6px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          {Array.from({ length: 100 }).map((_, i) => {
            const isActive = i < activeCells
            let opacity = 1
            if (hoveredIdx === 0 && !isActive) opacity = 0.25
            if (hoveredIdx === 1 && isActive) opacity = 0.25
            const isScale = (hoveredIdx === 0 && isActive) || (hoveredIdx === 1 && !isActive)
            return (
              <div
                key={i}
                style={{
                  borderRadius: isExpanded ? '3.5px' : '2px',
                  background: isActive ? '#0d9488' : '#e2e8f0',
                  transition: 'all 0.25s ease',
                  opacity,
                  transform: isScale ? 'scale(1.15)' : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Metric Summary */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            onMouseEnter={() => setHoveredIdx(0)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onSliceClick && onSliceClick({ label: activeLabel, value: activeCount })}
            style={{
              background: '#f0fdf4',
              border: '1px solid #ccfbf1',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              transform: hoveredIdx === 0 ? 'translateX(6px)' : 'none',
              opacity: hoveredIdx === null || hoveredIdx === 0 ? 1 : 0.45,
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#0f766e', fontWeight: 700, textTransform: 'uppercase' }}>{activeLabel}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
              {activeCount} <span style={{ fontSize: '0.8rem', color: '#0d9488' }}>{unit} ({pct}%)</span>
            </div>
          </div>
          <div
            onMouseEnter={() => setHoveredIdx(1)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onSliceClick && onSliceClick({ label: inactiveLabel, value: totalCount - activeCount })}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              transform: hoveredIdx === 1 ? 'translateX(6px)' : 'none',
              opacity: hoveredIdx === null || hoveredIdx === 1 ? 1 : 0.45,
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>{inactiveLabel}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>
              {totalCount - activeCount} {unit} ({100 - pct}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 14. Power BI Executive Card 2.0 with Sentiment Net Satisfaction Score & Citizen Coverage
function SvgExecutiveScorecard({ data = [], title, subtitle, icon, onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const totalPop = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]) || 1

  const isSatisfied = data.some(d => String(d.label).toLowerCase().includes('puas') || String(d.label).toLowerCase().includes('baik'))
  const isBpjsTk = data.some(d => String(d.label).toLowerCase().includes('peserta'))

  const nonAccessItem = data.find(d => d.isNonAccess || String(d.label).toLowerCase().includes('tidak') || String(d.label).toLowerCase().includes('belum') || String(d.label).toLowerCase().includes('bukan'))
  const terlayaniItems = data.filter(d => d !== nonAccessItem)
  const totalTerlayani = terlayaniItems.reduce((s, d) => s + d.value, 0)

  const coveragePct = Math.round((totalTerlayani / totalPop) * 100)
  const nonAccessVal = nonAccessItem ? nonAccessItem.value : (totalPop - totalTerlayani)
  const nonAccessPct = Math.round((nonAccessVal / totalPop) * 100)

  let bannerTag = 'TOTAL CAKUPAN JAMINAN KESEHATAN NAGARI'
  let bannerMainText = `${coveragePct}% Tercover BPJS Kesehatan`
  let bannerSubText = `(${totalTerlayani.toLocaleString('id-ID')} dari ${totalPop.toLocaleString('id-ID')} Jiwa)`
  let rightLabel = 'Belum Tercover:'
  let rightVal = `${nonAccessVal.toLocaleString('id-ID')} Jiwa (${nonAccessPct}%)`
  let heroIcon = 'shield_check'

  if (isSatisfied) {
    const baik = data.find(d => String(d.label).toLowerCase().includes('baik'))?.value || 0
    const cukup = data.find(d => String(d.label).toLowerCase().includes('cukup'))?.value || 0
    const puasPct = totalTerlayani > 0 ? Math.round(((baik + cukup) / totalTerlayani) * 100) : 0
    bannerTag = 'INDEKS KEPUASAN LAYANAN PUBLIK NAGARI'
    bannerMainText = `${puasPct}% Puas`
    bannerSubText = `(${baik + cukup} / ${totalTerlayani} Responden Terlayani)`
    rightLabel = 'Akses Layanan Desa:'
    rightVal = `${coveragePct}% (${totalTerlayani} Jiwa)`
    heroIcon = 'star'
  } else if (isBpjsTk) {
    bannerTag = 'TOTAL CAKUPAN BPJS KETENAGAKERJAAN (BPJS TK)'
    bannerMainText = `${coveragePct}% Peserta Aktif BPJS TK`
    bannerSubText = `(${totalTerlayani.toLocaleString('id-ID')} dari ${totalPop.toLocaleString('id-ID')} Jiwa)`
    rightLabel = 'Bukan Peserta:'
    rightVal = `${nonAccessVal.toLocaleString('id-ID')} Jiwa (${nonAccessPct}%)`
    heroIcon = 'pekerjaan'
  }

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
        {/* Scorecard Hero Banner */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
              {bannerTag}
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {bannerMainText} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>{bannerSubText}</span>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.66rem', color: '#047857', fontWeight: 700 }}>{rightLabel}</span>
              <strong style={{ fontSize: '0.88rem', color: '#065f46', fontFamily: 'var(--font-heading)' }}>{rightVal}</strong>
            </div>
            {/* SVG Hero Badge Container */}
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)', border: '1px solid #facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', boxShadow: '0 2px 6px rgba(202,138,4,0.18)', flexShrink: 0 }}>
              <Icon name={heroIcon} size={22} />
            </div>
          </div>
        </div>

        {/* Sentiment / BPJS Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
          {data.map((item, idx) => {
            const isNon = item.isNonAccess || String(item.label).toLowerCase().includes('tidak') || String(item.label).toLowerCase().includes('belum')
            const itemPct = isSatisfied
              ? (isNon ? (totalPop > 0 ? Math.round((item.value / totalPop) * 100) : 0) : (totalTerlayani > 0 ? Math.round((item.value / totalTerlayani) * 100) : 0))
              : (totalPop > 0 ? Math.round((item.value / totalPop) * 100) : 0)

            const color = item.color || (isNon ? '#94a3b8' : '#0d9488')
            const isHov = hoveredIdx === idx

            let badgeBg = isNon ? '#f1f5f9' : '#dcfce7'
            let badgeColor = isNon ? '#475569' : '#15803d'
            let badgeBorder = isNon ? '#cbd5e1' : '#bbf7d0'

            const lbl = String(item.label).toLowerCase()
            if (lbl.includes('pbi') || lbl.includes('pemerintah')) {
              badgeBg = '#dcfce7'; badgeColor = '#15803d'; badgeBorder = '#bbf7d0'
            } else if (lbl.includes('mandiri') || lbl.includes('swasta')) {
              badgeBg = '#e0f2fe'; badgeColor = '#0369a1'; badgeBorder = '#bae6fd'
            } else if (lbl.includes('belum') || lbl.includes('tidak')) {
              badgeBg = '#f1f5f9'; badgeColor = '#64748b'; badgeBorder = '#cbd5e1'
            }

            return (
              <div
                key={item.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(item)}
                style={{
                  background: isHov ? '#f8fafc' : '#ffffff',
                  border: `1px solid #e2e8f0`,
                  borderTop: `3.5px solid ${color}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isHov ? '0 6px 16px rgba(15,23,42,0.12)' : '0 1px 3px rgba(15,23,42,0.03)',
                  transform: isHov ? 'translateY(-6px)' : 'none',
                  opacity: hoveredIdx === null || isHov ? 1 : 0.45,
                }}
                title={`${item.label}: ${item.value} Jiwa (${itemPct}%)`}
              >
                <div style={{ fontSize: '0.74rem', color: '#475569', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-body)' }}>
                  {item.label}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '2px' }}>
                  <strong style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
                    {item.value.toLocaleString('id-ID')} <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Jiwa</span>
                  </strong>
                  <span style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`, fontSize: '0.72rem', padding: '1px 7px', borderRadius: '6px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                    {itemPct}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 15. Power BI Faskes Frequency Breakdown Component (Multi-Tier & Facility Selector)
function SvgFaskesFrequencyChart({ data = {}, title, subtitle, icon, onExpand, onSliceClick, isExpanded = false }) {
  const [selectedFac, setSelectedFac] = useState('puskesmas')
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const facilityOptions = [
    { key: 'puskesmas', label: 'Puskesmas / Pustu', color: '#0d9488' },
    { key: 'rs', label: 'Rumah Sakit (RS)', color: '#0284c7' },
    { key: 'bidan', label: 'Praktik Bidan / Posyandu', color: '#ec4899' },
    { key: 'dokter', label: 'Praktik Dokter / Klinik', color: '#6366f1' },
    { key: 'apotik', label: 'Apotik / Toko Obat', color: '#f59e0b' },
  ]

  const activeFacInfo = data[selectedFac] || { label: facilityOptions.find(f => f.key === selectedFac)?.label || 'Faskes', totalVisits: 0, totalVisitors: 0, freqs: {} }
  const activeColor = facilityOptions.find(f => f.key === selectedFac)?.color || '#0d9488'
  const totalVisitors = activeFacInfo.totalVisitors || 1

  const freqDefinitions = [
    { key: '1', label: '1 Kali Setahun (Insidental)', color: '#10b981', desc: 'Warga berobat 1x saat keluhan ringan' },
    { key: '2', label: '2 Kali Setahun (Seasonal)', color: '#0284c7', desc: 'Warga berobat 2x dalam setahun' },
    { key: '3', label: '3 Kali Setahun (Kondisional)', color: '#6366f1', desc: 'Berobat 3x berkala dalam setahun' },
    { key: '4-5', label: '4 - 5 Kali Setahun (Intensif)', color: '#f59e0b', desc: 'Berobat 4 s.d 5x dalam setahun' },
    { key: '6+', label: '6+ Kali Setahun (Rutin Bulanan)', color: '#e11d48', desc: 'Pasien rawat jalan / pengobatan rutin' },
  ]

  return (
    <div
      className={isExpanded ? '' : 'panel'}
      style={{
        padding: isExpanded ? '4px 6px' : '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        borderRadius: '12px',
        background: isExpanded ? 'transparent' : '#ffffff',
        border: isExpanded ? 'none' : '1px solid #e2e8f0',
        boxShadow: isExpanded ? 'none' : '0 4px 12px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden'
      }}
    >
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
        {/* Facility Selector Tabs - Responsive Wrap */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {facilityOptions.map((fac) => {
            const facItem = data[fac.key] || { totalVisitors: 0 }
            const isSel = fac.key === selectedFac
            return (
              <button
                key={fac.key}
                type="button"
                onClick={() => {
                  setSelectedFac(fac.key)
                  const firstFreq = freqDefinitions[0]
                  const count = facItem.freqs ? (facItem.freqs[firstFreq.key] || 0) : 0
                  onSliceClick && onSliceClick({ label: `${facItem.label || fac.label} - ${firstFreq.label}`, value: count })
                }}
                style={{
                  padding: isExpanded ? '5px 10px' : '5px 10px',
                  borderRadius: '6px',
                  fontSize: isExpanded ? '0.7rem' : '0.68rem',
                  fontWeight: 700,
                  border: isSel ? `1.5px solid ${fac.color}` : '1px solid #e2e8f0',
                  background: isSel ? fac.color : '#f8fafc',
                  color: isSel ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {fac.label} ({facItem.totalVisitors > 0 ? `${facItem.totalVisitors} Warga` : '0'})
              </button>
            )
          })}
        </div>

        {/* Selected Facility Executive Summary */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%)', border: '1px solid #99f6e4', borderRadius: '10px', padding: isExpanded ? '10px 14px' : '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
          <div>
            <span style={{ fontSize: isExpanded ? '0.65rem' : '0.65rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
              Fasilitas Kesehatan: {activeFacInfo.label}
            </span>
            <div style={{ fontSize: isExpanded ? '1.15rem' : '1.2rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {activeFacInfo.totalVisits} Kunjungan Berobat <span style={{ fontSize: isExpanded ? '0.78rem' : '0.78rem', color: '#0d9488' }}>({activeFacInfo.totalVisitors} Warga Pasien)</span>
            </div>
          </div>
          <div style={{ padding: isExpanded ? '6px 12px' : '6px 12px', background: '#ffffff', borderRadius: '8px', border: '1px solid #99f6e4', textAlign: 'right' }}>
            <span style={{ fontSize: isExpanded ? '0.62rem' : '0.62rem', color: '#64748b', fontWeight: 700 }}>Intensitas Berobat:</span>
            <div style={{ fontSize: isExpanded ? '0.98rem' : '0.92rem', fontWeight: 800, color: activeColor, fontFamily: 'var(--font-heading)' }}>
              {activeFacInfo.totalVisitors > 0 ? (activeFacInfo.totalVisits / activeFacInfo.totalVisitors).toFixed(1) : 0}x / Pasien
            </div>
          </div>
        </div>

        {/* Frequency Breakdown Progress Bars */}
        {activeFacInfo.totalVisitors > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {freqDefinitions.map((fd) => {
              const count = activeFacInfo.freqs ? (activeFacInfo.freqs[fd.key] || 0) : 0
              const pct = Math.round((count / totalVisitors) * 100)
              return (
                <div
                  key={fd.key}
                  onMouseEnter={() => setHoveredIdx(fd.key)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSliceClick && onSliceClick({ label: `${activeFacInfo.label} - ${fd.label}`, value: count })}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: isExpanded ? '8px 12px' : '7px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    transform: hoveredIdx === fd.key ? 'translateY(-3px)' : 'none',
                    opacity: hoveredIdx === null || hoveredIdx === fd.key ? 1 : 0.45,
                    boxShadow: hoveredIdx === fd.key ? '0 4px 12px rgba(15,23,42,0.06)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ fontSize: isExpanded ? '0.76rem' : '0.72rem', fontWeight: 700, color: '#334155', fontFamily: 'var(--font-body)' }}>{fd.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: isExpanded ? '0.86rem' : '0.82rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>{count} Warga</strong>
                      <span style={{ fontSize: isExpanded ? '0.7rem' : '0.68rem', fontWeight: 800, color: fd.color, background: '#ffffff', border: `1px solid ${fd.color}`, padding: '1px 6px', borderRadius: '4px' }}>{pct}%</span>
                    </div>
                  </div>
                  {/* Track */}
                  <div style={{ height: '7px', background: '#e2e8f0', borderRadius: '3.5px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: fd.color, borderRadius: '3.5px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Belum Ada Kunjungan Warga</div>
            <div style={{ fontSize: '0.74rem', marginTop: '4px' }}>Tidak ada catatan warga berobat ke {activeFacInfo.label} dalam 1 tahun terakhir.</div>
          </div>
        )}
      </div>
    </div>
  )
}

// 16. Power BI Maternal & Child Health Indicator Card (ASI Eksklusif & Ibu Hamil)
function SvgMaternalChildHealthCard({ asiData = { ya: 0, tidak: 0, total: 143 }, hamilData = { ya: 0, tidak: 0, total: 554 }, title, subtitle, icon = 'ibu_hamil', onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredPart, setHoveredPart] = useState(null)
  
  const filledAsi = (asiData.ya + asiData.tidak) || 1
  const asiYaPct = Math.round((asiData.ya / filledAsi) * 100)
  const asiTidakPct = Math.round((asiData.tidak / filledAsi) * 100)

  const filledHamil = (hamilData.ya + hamilData.tidak) || 1
  const hamilPct = parseFloat((hamilData.ya / filledHamil * 100).toFixed(1))
  const nonHamilPct = parseFloat((100 - hamilPct).toFixed(1))

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isExpanded ? '18px' : '10px', justifyContent: 'center' }}>
        {/* Metric 1: ASI Eksklusif */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '4.5px solid #0d9488',
            borderRadius: '8px',
            padding: isExpanded ? '18px 24px' : '10px 14px',
            transition: 'all 0.25s ease',
            opacity: hoveredPart === null || hoveredPart.startsWith('asi') ? 1 : 0.45,
            boxShadow: hoveredPart === 'asi-ya' || hoveredPart === 'asi-tidak' ? '0 6px 16px rgba(15,23,42,0.08)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isExpanded ? '0.86rem' : '0.72rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'var(--font-heading)' }}>
              ASI Eksklusif Bayi (0-5 Thn)
            </span>
            <span style={{ fontSize: isExpanded ? '0.78rem' : '0.66rem', fontWeight: 800, color: '#0d9488', background: '#ccfbf1', border: '1px solid #99f6e4', padding: isExpanded ? '3px 10px' : '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-heading)' }}>
              {asiData.total || 143} Balita
            </span>
          </div>

          <div style={{ fontSize: isExpanded ? '1.35rem' : '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)', marginTop: isExpanded ? '6px' : '3px' }}>
            {asiData.ya} Balita Menerima ASI <span style={{ fontSize: isExpanded ? '0.94rem' : '0.78rem', color: '#0d9488' }}>({asiYaPct}%)</span>
          </div>

          {/* Progress Segmented Bar */}
          <div style={{ height: isExpanded ? '12px' : '7px', background: '#e2e8f0', borderRadius: isExpanded ? '6px' : '3.5px', overflow: 'hidden', display: 'flex', marginTop: isExpanded ? '10px' : '6px' }}>
            <div
              onMouseEnter={() => setHoveredPart('asi-ya')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Pemberian ASI Eksklusif (Mendapatkan)', value: asiData.ya })}
              style={{
                width: `${asiYaPct}%`,
                height: '100%',
                background: '#0d9488',
                borderRight: '1.5px solid #ffffff',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                transform: hoveredPart === 'asi-ya' ? 'scaleY(1.3)' : 'none',
                opacity: hoveredPart === null || hoveredPart === 'asi-ya' ? 1 : 0.45
              }}
              title={`Mendapatkan ASI Eksklusif: ${asiData.ya} Balita (${asiYaPct}%)`}
            />
            <div
              onMouseEnter={() => setHoveredPart('asi-tidak')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Tidak Mendapatkan ASI Eksklusif', value: asiData.tidak })}
              style={{
                width: `${asiTidakPct}%`,
                height: '100%',
                background: '#f59e0b',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                transform: hoveredPart === 'asi-tidak' ? 'scaleY(1.3)' : 'none',
                opacity: hoveredPart === null || hoveredPart === 'asi-tidak' ? 1 : 0.45
              }}
              title={`Tidak ASI Eksklusif: ${asiData.tidak} Balita (${asiTidakPct}%)`}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: isExpanded ? '8px' : '4px', fontSize: isExpanded ? '0.8rem' : '0.68rem', fontWeight: 700 }}>
            <span
              onMouseEnter={() => setHoveredPart('asi-ya')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Pemberian ASI Eksklusif (Mendapatkan)', value: asiData.ya })}
              style={{
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.25s ease',
                opacity: hoveredPart === null || hoveredPart === 'asi-ya' ? 1 : 0.45
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />
              Mendapatkan ASI: {asiData.ya} Balita ({asiYaPct}%)
            </span>
            <span
              onMouseEnter={() => setHoveredPart('asi-tidak')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Tidak Mendapatkan ASI Eksklusif', value: asiData.tidak })}
              style={{
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.25s ease',
                opacity: hoveredPart === null || hoveredPart === 'asi-tidak' ? 1 : 0.45
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Tidak ASI: {asiData.tidak} Balita ({asiTidakPct}%)
            </span>
          </div>
        </div>

        {/* Metric 2: Ibu Hamil / Mengandung */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '4.5px solid #db2777',
            borderRadius: '8px',
            padding: isExpanded ? '18px 24px' : '10px 14px',
            transition: 'all 0.25s ease',
            opacity: hoveredPart === null || hoveredPart.startsWith('hamil') ? 1 : 0.45,
            boxShadow: hoveredPart === 'hamil-ya' || hoveredPart === 'hamil-tidak' ? '0 6px 16px rgba(15,23,42,0.08)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isExpanded ? '0.86rem' : '0.72rem', fontWeight: 800, color: '#9d174d', textTransform: 'uppercase', letterSpacing: '0.3px', fontFamily: 'var(--font-heading)' }}>
              Status Ibu Hamil (WUS 15-49 Thn)
            </span>
            <span style={{ fontSize: isExpanded ? '0.78rem' : '0.66rem', fontWeight: 800, color: '#db2777', background: '#fce7f3', border: '1px solid #fbcfe8', padding: isExpanded ? '3px 10px' : '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-heading)' }}>
              {hamilData.total || 554} WUS
            </span>
          </div>

          <div style={{ fontSize: isExpanded ? '1.35rem' : '1.15rem', fontWeight: 800, color: '#831843', fontFamily: 'var(--font-heading)', marginTop: isExpanded ? '6px' : '3px' }}>
            {hamilData.ya} Ibu Sedang Mengandung <span style={{ fontSize: isExpanded ? '0.94rem' : '0.78rem', color: '#db2777' }}>({hamilPct}%)</span>
          </div>

          {/* Progress Bar Segmented */}
          <div style={{ height: isExpanded ? '12px' : '7px', background: '#e2e8f0', borderRadius: isExpanded ? '6px' : '3.5px', overflow: 'hidden', display: 'flex', marginTop: isExpanded ? '10px' : '6px' }}>
            <div
              onMouseEnter={() => setHoveredPart('hamil-ya')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Ibu Sedang Mengandung (YA)', value: hamilData.ya })}
              style={{
                width: `${hamilPct}%`,
                height: '100%',
                background: '#db2777',
                borderRight: '1.5px solid #ffffff',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                transform: hoveredPart === 'hamil-ya' ? 'scaleY(1.3)' : 'none',
                opacity: hoveredPart === null || hoveredPart === 'hamil-ya' ? 1 : 0.45
              }}
              title={`Ibu Hamil: ${hamilData.ya} WUS (${hamilPct}%)`}
            />
            <div
              onMouseEnter={() => setHoveredPart('hamil-tidak')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Tidak Hamil', value: hamilData.tidak })}
              style={{
                width: `${nonHamilPct}%`,
                height: '100%',
                background: '#cbd5e1',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                transform: hoveredPart === 'hamil-tidak' ? 'scaleY(1.3)' : 'none',
                opacity: hoveredPart === null || hoveredPart === 'hamil-tidak' ? 1 : 0.45
              }}
              title={`Tidak Hamil: ${hamilData.tidak} WUS (${nonHamilPct}%)`}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: isExpanded ? '8px' : '4px', fontSize: isExpanded ? '0.8rem' : '0.68rem', fontWeight: 700 }}>
            <span
              onMouseEnter={() => setHoveredPart('hamil-ya')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Ibu Sedang Mengandung (YA)', value: hamilData.ya })}
              style={{
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.25s ease',
                opacity: hoveredPart === null || hoveredPart === 'hamil-ya' ? 1 : 0.45
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#db2777', display: 'inline-block' }} />
              Ibu Hamil: {hamilData.ya} Jiwa ({hamilPct}%)
            </span>
            <span
              onMouseEnter={() => setHoveredPart('hamil-tidak')}
              onMouseLeave={() => setHoveredPart(null)}
              onClick={() => onSliceClick && onSliceClick({ label: 'Tidak Hamil', value: hamilData.tidak })}
              style={{
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.25s ease',
                opacity: hoveredPart === null || hoveredPart === 'hamil-tidak' ? 1 : 0.45
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#94a3b8', display: 'inline-block' }} />
              Tidak Hamil: {hamilData.tidak} WUS ({nonHamilPct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 17. Power BI Circular Status & Alert Progress Ring
function SvgAlertProgressRing({ data = [], alertLabel = 'Pernah Terputus', title, subtitle, icon, onExpand, onSliceClick }) {
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const alertItem = data.find(d => String(d.label).toLowerCase().includes(alertLabel.toLowerCase()))
  const alertVal = alertItem ? alertItem.value : 0
  const alertPct = total > 0 ? Math.round((alertVal / total) * 100) : 0

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ background: alertVal > 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${alertVal > 0 ? '#fecaca' : '#bbf7d0'}`, borderRadius: '8px', padding: '8px 12px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: alertVal > 0 ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>STATUS KERAWANAN AKSES</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: alertVal > 0 ? '#dc2626' : '#16a34a' }}>
              {alertVal} KK Rentan <span style={{ fontSize: '0.78rem' }}>({alertPct}%)</span>
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Akses aman: <strong style={{ color: '#0f172a' }}>{total - alertVal} KK</strong> ({100 - alertPct}%)
          </div>
        </div>

        {/* Mini Radial Indicator */}
        <div style={{ width: '70px', height: '70px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={alertVal > 0 ? '#ef4444' : '#10b981'} strokeWidth="3.8" strokeDasharray={`${alertPct}, 100`} />
          </svg>
          <span style={{ position: 'absolute', fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>{alertPct}%</span>
        </div>
      </div>
    </div>
  )
}

// 16. Power BI Smooth Spline Line Chart (Diagram Garis Tren & Deret)
// 16. Power BI Smooth Spline Line Chart (Diagram Garis Tren & Alur Mitigasi)
function SvgLineChart({ data = [], title, subtitle, icon = 'chart', onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])
  const w = 340, h = 145, padX = 35, padY = 26
  const chartW = w - padX * 2
  const chartH = h - padY * 2
  const bottomY = padY + chartH

  const points = useMemo(() => {
    if (!data.length) return []
    const step = data.length > 1 ? chartW / (data.length - 1) : 0
    return data.map((d, i) => {
      const x = padX + i * step
      const y = padY + chartH - (d.value / maxVal) * chartH
      return { ...d, x, y, idx: i }
    })
  }, [data, maxVal, chartW, chartH])

  const { pathLine, pathArea } = useMemo(() => {
    if (points.length < 2) return { pathLine: '', pathArea: '' }
    let line = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const mx = (p0.x + p1.x) / 2
      line += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
    }
    const area = `${line} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
    return { pathLine: line, pathArea: area }
  }, [points, bottomY])

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '190px' }}>
        <svg viewBox={`0 0 ${w} ${h + 24}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((r) => (
            <line key={r} x1={padX - 8} y1={padY + chartH * (1 - r)} x2={w - padX + 8} y2={padY + chartH * (1 - r)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          ))}

          {/* Area Fill */}
          <path d={pathArea} fill="url(#lineAreaGrad)" />

          {/* Spline Path */}
          <path d={pathLine} fill="none" stroke="url(#lineGrad)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points & Step Labels */}
          {points.map((p, i) => {
            const isHov = hoveredIdx === i
            return (
              <g key={p.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(p)}
                style={{ cursor: 'pointer', transition: 'all 0.25s ease', opacity: hoveredIdx === null || isHov ? 1 : 0.35 }}
              >
                {/* Connecting subtle vertical drop line */}
                <line x1={p.x} y1={p.y} x2={p.x} y2={bottomY} stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2 2" opacity={isHov ? 0.9 : 0.35} />

                <circle cx={p.x} cy={p.y} r={isHov ? 7.5 : 5.5} fill="#ffffff" stroke={p.color || '#0d9488'} strokeWidth="3" style={{ transition: 'all 0.2s ease', filter: isHov ? 'drop-shadow(0 2px 6px rgba(13,148,136,0.4))' : 'none' }} />

                {/* Floating Value Pill */}
                <rect x={p.x - 18} y={p.y - 24} width="36" height="18" rx="5" fill="#0f172a" opacity={isHov ? 1 : 0.9} />
                <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800" style={{ fontFamily: 'var(--font-heading)' }}>
                  {p.value}
                </text>

                {/* Bottom Category Label (Multiline) */}
                {(() => {
                  const words = p.label.split(' ')
                  if (words.length > 2) {
                    return (
                      <text x={p.x} y={h + 10} textAnchor="middle" fill="#334155" fontSize="7.6" fontWeight="700" style={{ fontFamily: 'var(--font-body)' }}>
                        <tspan x={p.x} dy="0">{words.slice(0, 2).join(' ')}</tspan>
                        <tspan x={p.x} dy="10.5">{words.slice(2).join(' ')}</tspan>
                      </text>
                    )
                  } else if (words.length === 2) {
                    return (
                      <text x={p.x} y={h + 10} textAnchor="middle" fill="#334155" fontSize="7.6" fontWeight="700" style={{ fontFamily: 'var(--font-body)' }}>
                        <tspan x={p.x} dy="0">{words[0]}</tspan>
                        <tspan x={p.x} dy="10.5">{words[1]}</tspan>
                      </text>
                    )
                  }
                  return (
                    <text x={p.x} y={h + 15} textAnchor="middle" fill="#334155" fontSize="7.6" fontWeight="700" style={{ fontFamily: 'var(--font-body)' }}>
                      {p.label}
                    </text>
                  )
                })()}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// 17. Power BI Filled Area Chart (Diagram Luasan Garis Spline Kerawanan Bencana & Drainase)
function SvgAreaChart({ data = [], title, subtitle, icon = 'sanitasi', onExpand, onSliceClick }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 1), [data])
  const w = 340, h = 150, padX = 28, padY = 24
  const chartW = w - padX * 2
  const chartH = h - padY * 2
  const bottomY = padY + chartH

  const points = useMemo(() => {
    if (!data.length) return []
    const step = data.length > 1 ? chartW / (data.length - 1) : 0
    return data.map((d, i) => {
      const x = padX + i * step
      const y = padY + chartH - (d.value / maxVal) * chartH
      return { ...d, x, y, idx: i }
    })
  }, [data, maxVal, chartW, chartH])

  const { pathLine, pathArea } = useMemo(() => {
    if (points.length < 2) return { pathLine: '', pathArea: '' }
    let line = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i]
      const p1 = points[i + 1]
      const mx = (p0.x + p1.x) / 2
      line += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`
    }
    const area = `${line} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
    return { pathLine: line, pathArea: area }
  }, [points, bottomY])

  return (
    <div className="panel" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '190px' }}>
        <svg viewBox={`0 0 ${w} ${h + 30}`} style={{ width: '100%', height: '100%', maxHeight: '220px', overflow: 'visible' }}>
          <defs>
            <linearGradient id="areaFillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d9488" stopOpacity="0.30" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="areaLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((r) => (
            <line key={r} x1={padX - 5} y1={padY + chartH * (1 - r)} x2={w - padX + 5} y2={padY + chartH * (1 - r)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
          ))}

          {/* Area Fill */}
          <path d={pathArea} fill="url(#areaFillGrad)" />
          {/* Top Line */}
          <path d={pathLine} fill="none" stroke="url(#areaLineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, i) => {
            const isHov = hoveredIdx === i
            return (
              <g key={p.label}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSliceClick && onSliceClick(p)}
                style={{ cursor: 'pointer', transition: 'all 0.25s ease', opacity: hoveredIdx === null || isHov ? 1 : 0.35 }}
              >
                <circle cx={p.x} cy={p.y} r={isHov ? 7.5 : 5.5} fill="#ffffff" stroke={p.color || '#0d9488'} strokeWidth="2.8" style={{ transition: 'all 0.2s', filter: isHov ? 'drop-shadow(0 2px 6px rgba(13,148,136,0.4))' : 'none' }} />
                <rect x={p.x - 18} y={p.y - 23} width="36" height="17" rx="5" fill="#0f172a" opacity={isHov ? 1 : 0.9} />
                <text x={p.x} y={p.y - 11} textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="800" style={{ fontFamily: 'var(--font-heading)' }}>
                  {p.value}
                </text>
                {/* Bottom Category Label */}
                {(() => {
                  const words = p.label.split(' ')
                  if (words.length > 1) {
                    return (
                      <text x={p.x} y={h + 10} textAnchor="middle" fill="#334155" fontSize="8" fontWeight="700" style={{ fontFamily: 'var(--font-body)' }}>
                        <tspan x={p.x} dy="0">{words[0]}</tspan>
                        <tspan x={p.x} dy="10">{words.slice(1).join(' ')}</tspan>
                      </text>
                    )
                  }
                  return (
                    <text x={p.x} y={h + 14} textAnchor="middle" fill="#334155" fontSize="8" fontWeight="700" style={{ fontFamily: 'var(--font-body)' }}>
                      {p.label}
                    </text>
                  )
                })()}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// 18. Power BI 100% Stacked Column Chart (Diagram Kolom Bertumpuk 100% - Persentase & Jumlah Jiwa)
function Svg100StackedColumnChart({ groups = [], series = [], title, subtitle, icon = 'file_text', onExpand, onSliceClick, isExpanded = false }) {
  const [hoveredSegment, setHoveredSegment] = useState(null)
  const w = isExpanded ? 580 : 380
  const chartH = isExpanded ? 240 : 150
  const colW = isExpanded ? 64 : 44
  const padX = isExpanded ? 40 : 30
  const step = groups.length > 1 ? (w - padX * 2 - colW) / (groups.length - 1) : 0

  return (
    <div className="panel" style={{ padding: isExpanded ? '32px 36px' : '20px 22px', display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '12px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
      {title && <CardHeader title={title} subtitle={subtitle} icon={icon} onExpand={onExpand} />}

      {/* Legend Top Matching Theme */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginBottom: '8px', fontSize: isExpanded ? '0.88rem' : '0.76rem' }}>
        {series.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.color, border: s.color === '#cbd5e1' ? '1px solid #94a3b8' : 'none' }} />
            <span style={{ color: '#334155', fontWeight: 700 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isExpanded ? '340px' : '230px', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${w} ${chartH + 40}`} style={{ width: '100%', maxWidth: isExpanded ? '680px' : '480px', maxHeight: isExpanded ? '400px' : '250px', overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <g key={r}>
              <line x1={padX - 8} y1={chartH * (1 - r) + 8} x2={w - padX + 34} y2={chartH * (1 - r) + 8} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padX - 12} y={chartH * (1 - r) + 11} textAnchor="end" fill="#94a3b8" fontSize={isExpanded ? 11 : 8} fontWeight="600">{Math.round(r * 100)}%</text>
            </g>
          ))}

          {groups.map((g, i) => {
            const x = padX + i * step
            const totalG = (g.series1 || 0) + (g.series2 || 0) || 1
            const pct1 = Math.round(((g.series1 || 0) / totalG) * 100)
            const pct2 = 100 - pct1
            const h1 = (pct1 / 100) * chartH
            const h2 = chartH - h1

            const isHov1 = hoveredSegment !== null && hoveredSegment.groupIdx === i && hoveredSegment.key === 'series1'
            const isHov2 = hoveredSegment !== null && hoveredSegment.groupIdx === i && hoveredSegment.key === 'series2'
            const isAnyHovInGroup = isHov1 || isHov2

            return (
              <g key={g.groupLabel} style={{ cursor: 'pointer' }}>
                {/* Segment 2 (Top Stack - Belum Aktif) */}
                <rect
                  x={x}
                  y={8}
                  width={colW}
                  height={h2}
                  rx="6 6 0 0"
                  fill={series[1]?.color || '#cbd5e1'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredSegment({ groupIdx: i, key: 'series2' })}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{
                    transition: 'all 0.25s ease',
                    transform: isHov2 ? 'scale(1.08)' : 'none',
                    transformOrigin: `${x + colW / 2}px ${8 + h2 / 2}px`,
                    opacity: hoveredSegment === null || isHov2 ? 0.95 : 0.45
                  }}
                  onClick={() => onSliceClick && onSliceClick({ label: `${g.groupLabel} (${series[1]?.label})`, value: g.series2 })}
                />
                {pct2 >= 18 ? (
                  <>
                    <text
                      x={x + colW / 2}
                      y={8 + h2 / 2 - 3}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize={isExpanded ? 11 : 9}
                      fontWeight="800"
                      style={{ fontFamily: 'var(--font-heading)', pointerEvents: 'none', transition: 'opacity 0.25s ease', opacity: hoveredSegment === null || isHov2 ? 1 : 0.45 }}
                    >
                      {pct2}%
                    </text>
                    <text
                      x={x + colW / 2}
                      y={8 + h2 / 2 + (isExpanded ? 11 : 9)}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize={isExpanded ? 9 : 7.5}
                      fontWeight="700"
                      style={{ fontFamily: 'var(--font-heading)', pointerEvents: 'none', transition: 'opacity 0.25s ease', opacity: hoveredSegment === null || isHov2 ? 1 : 0.45 }}
                    >
                      ({g.series2})
                    </text>
                  </>
                ) : pct2 >= 6 ? (
                  <text
                    x={x + colW / 2}
                    y={8 + h2 / 2 + 3.5}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize={isExpanded ? 9 : 7.5}
                    fontWeight="800"
                    style={{ fontFamily: 'var(--font-heading)', pointerEvents: 'none', transition: 'opacity 0.25s ease', opacity: hoveredSegment === null || isHov2 ? 1 : 0.45 }}
                  >
                    {pct2}% ({g.series2})
                  </text>
                ) : null}

                {/* Segment 1 (Bottom Stack - Aktif Internet) */}
                <rect
                  x={x}
                  y={8 + h2}
                  width={colW}
                  height={h1}
                  rx="0 0 6 6"
                  fill={series[0]?.color || '#0d9488'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredSegment({ groupIdx: i, key: 'series1' })}
                  onMouseLeave={() => setHoveredSegment(null)}
                  style={{
                    transition: 'all 0.25s ease',
                    transform: isHov1 ? 'scale(1.08)' : 'none',
                    transformOrigin: `${x + colW / 2}px ${8 + h2 + h1 / 2}px`,
                    opacity: hoveredSegment === null || isHov1 ? 1 : 0.45
                  }}
                  onClick={() => onSliceClick && onSliceClick({ label: `${g.groupLabel} (${series[0]?.label})`, value: g.series1 })}
                />
                {pct1 >= 18 ? (
                  <>
                    <text
                      x={x + colW / 2}
                      y={8 + h2 + h1 / 2 - 3}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={isExpanded ? 11 : 9}
                      fontWeight="800"
                      style={{ fontFamily: 'var(--font-heading)', textShadow: '0 1px 2px rgba(0,0,0,0.3)', pointerEvents: 'none', transition: 'opacity 0.25s ease', opacity: hoveredSegment === null || isHov1 ? 1 : 0.45 }}
                    >
                      {pct1}%
                    </text>
                    <text
                      x={x + colW / 2}
                      y={8 + h2 + h1 / 2 + (isExpanded ? 11 : 9)}
                      textAnchor="middle"
                      fill="#ccfbf1"
                      fontSize={isExpanded ? 9 : 7.5}
                      fontWeight="700"
                      style={{ fontFamily: 'var(--font-heading)', pointerEvents: 'none', transition: 'opacity 0.25s ease', opacity: hoveredSegment === null || isHov1 ? 1 : 0.45 }}
                    >
                      ({g.series1})
                    </text>
                  </>
                ) : pct1 >= 6 ? (
                  <text
                    x={x + colW / 2}
                    y={8 + h2 + h1 / 2 + 3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={isExpanded ? 9 : 7.5}
                    fontWeight="800"
                    style={{ fontFamily: 'var(--font-heading)', pointerEvents: 'none', transition: 'opacity 0.25s ease', opacity: hoveredSegment === null || isHov1 ? 1 : 0.45 }}
                  >
                    {pct1}% ({g.series1})
                  </text>
                ) : null}

                {/* Label X */}
                <text x={x + colW / 2} y={chartH + (isExpanded ? 28 : 24)} textAnchor="middle" fill={isAnyHovInGroup ? '#0f766e' : '#475569'} fontSize={isExpanded ? 11 : 8.5} fontWeight="700" style={{ fontFamily: 'var(--font-body)', transition: 'color 0.2s' }}>
                  {g.groupLabel}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// EXPANDED CHART POPUP MODAL WITH ULTRA-RESPONSIVE CONTENT-DRIVEN LAYOUT (ZERO CLIPPING, INDEPENDENT SCROLL)
function ExpandedChartModal({ chartConfig, onClose, familyRows, individuRows, onViewDetailFamily, onViewDetailIndividu }) {
  if (!chartConfig) return null

  const { title, subtitle, data, type, fieldKey, isIndividu } = chartConfig
  const sourceRows = isIndividu ? individuRows : familyRows

  const getSliceLabel = (slice) => {
    if (!slice) return ''
    if (typeof slice === 'string') return slice
    return slice.label || slice.name || slice.groupLabel || slice.key || String(slice)
  }

  const [selectedSlice, setSelectedSlice] = useState(data && Array.isArray(data) && data[0] ? data[0] : null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 16

  // Smart & Bulletproof record filtering matching logic
  const filteredRecords = useMemo(() => {
    if (!sourceRows || sourceRows.length === 0) return []
    const sliceLabel = getSliceLabel(selectedSlice)
    if (!selectedSlice || !sliceLabel) return sourceRows

    const targetLabel = String(sliceLabel).toLowerCase().trim()

    if (!fieldKey) {
      return sourceRows
    }

    const results = sourceRows.filter((row) => {
      if (!row || typeof row !== 'object') return false

      if (fieldKey === 'jenis_kelamin') {
        const s = String(row.jenis_kelamin || '').toLowerCase().trim()
        if (targetLabel.includes('laki')) return s.includes('laki')
        if (targetLabel.includes('perempuan')) return s.includes('perempuan')
      }

      if (fieldKey === 'jika_punya' || fieldKey === 'jaminan_sosial_kesehatan') {
        const s = String(row.jika_punya || '').toUpperCase().trim()
        let cat = 'Belum Tercover BPJS'
        if (s.includes('PEMERINTAH') || s.includes('PBI') || s.includes('KIS')) {
          cat = 'BPJS PBI / KIS Government'
        } else if (s.includes('MANDIRI') || s.includes('SWASTA')) {
          cat = 'BPJS Mandiri / Swasta'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'jaminan_sosial_ketenagakerjaan') {
        const s = String(row.jaminan_sosial_ketenagakerjaan ?? '').toLowerCase().trim()
        const target = targetLabel.toLowerCase().trim()
        if (target === 'null' || target === '-' || target === '') {
          return !s || s === 'null' || s === '-' || s === ''
        }
        return s === target
      }

      if (fieldKey === 'apakah_sudah_melakukan_update_kk_ktp') {
        const s = String(row.apakah_sudah_melakukan_update_kk_ktp || '').toLowerCase().trim()
        const isSudah = s.includes('sudah') || s.includes('ya') || s.includes('lengkap') || /\b(201[5-9]|202[0-6])\b/.test(s)
        if (targetLabel.includes('sudah')) return isSudah
        if (targetLabel.includes('belum')) return !isSudah
      }

      if (fieldKey === 'jumlah_anggota_dalam_keluarga') {
        const num = parseInt(String(row.jumlah_anggota_dalam_keluarga || '').replace(/[^0-9]/g, ''), 10) || 0
        let cat = '7+ Jiwa'
        if (num <= 2) {
          cat = '1-2 Jiwa'
        } else if (num <= 4) {
          cat = '3-4 Jiwa'
        } else if (num <= 6) {
          cat = '5-6 Jiwa'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'usia') {
        const age = parseAge(row.usia)
        if (age === null) return targetLabel.includes('tidak')
        
        let matchAge = false
        if (targetLabel.includes('0-5') || targetLabel.includes('balita')) matchAge = age >= 0 && age <= 5
        else if (targetLabel.includes('6-12') || targetLabel.includes('anak')) matchAge = age >= 6 && age <= 12
        else if (targetLabel.includes('13-25') || targetLabel.includes('remaja')) matchAge = age >= 13 && age <= 25
        else if (targetLabel.includes('26-59') || targetLabel.includes('dewasa')) matchAge = age >= 26 && age <= 59
        else if (targetLabel.includes('60+') || targetLabel.includes('lansia')) matchAge = age >= 60

        if (!matchAge) return false

        const gender = String(row.jenis_kelamin || '').toLowerCase()
        if (targetLabel.toLowerCase().includes('laki-laki') || targetLabel.toLowerCase().includes('(laki')) {
          return !gender.includes('perempuan')
        }
        if (targetLabel.toLowerCase().includes('perempuan') || targetLabel.toLowerCase().includes('(perempuan')) {
          return gender.includes('perempuan')
        }

        return true
      }

      if (fieldKey === 'berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah') {
        const parseExpenseNum = (str) => {
          if (!str) return 0
          const s = String(str).trim().toUpperCase()
          if (s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK TENTU' || s === 'BELUM ADA') return 0
          if (s.includes('JUTA') || s.includes('JT')) {
            const num = parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.'))
            if (!isNaN(num) && num > 0 && num < 100) return num * 1000000
          }
          const digitsOnly = s.replace(/[^0-9]/g, '')
          const val = parseInt(digitsOnly, 10)
          if (isNaN(val) || val <= 0) return 0
          if (val < 100) return val * 1000000
          return val
        }
        const num = parseExpenseNum(row.berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah)
        let cat = 'Belum Terdata'
        if (num <= 0) cat = 'Belum Terdata'
        else if (num < 1000000) cat = '< Rp 1 Juta'
        else if (num <= 2000000) cat = 'Rp 1 - 2 Juta'
        else if (num <= 3000000) cat = 'Rp 2 - 3 Juta'
        else if (num <= 5000000) cat = 'Rp 3 - 5 Juta'
        else cat = '> Rp 5 Juta'

        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'kondisi_pekerjaan') {
        const cond = String(row.kondisi_pekerjaan || '').toUpperCase().trim()
        const job = String(row.pekerjaan_utama || '').toUpperCase().trim()
        const age = parseAge(row.usia)

        let cat = ''
        if (cond.includes('PARUH') || cond.includes('SAMPINGAN') || cond.includes('KADANG')) {
          cat = 'Bekerja Paruh Waktu'
        } else if (cond.includes('TIDAK') || cond.includes('BELUM') || cond.includes('MENCARI') || job.includes('TIDAK BEKERJA') || job.includes('BELUM BEKERJA')) {
          if (age !== null && (age < 15 || age > 64)) cat = 'Usia Sekolah / Non-Produktif'
          else cat = 'Belum / Tidak Bekerja'
        } else if (cond.includes('PENUH') || cond.includes('BEKERJA') || (job && job !== '-' && job !== 'TIDAK DIISI')) {
          cat = 'Bekerja Penuh'
        } else {
          if (age !== null && (age < 15 || age > 64)) cat = 'Usia Sekolah / Non-Produktif'
          else cat = 'Belum / Tidak Bekerja'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'kepemilikin_aset') {
        const asetStr = String(row.kepemilikin_aset || '').toUpperCase()
        if (targetLabel.includes('hp') || targetLabel.includes('handphone')) return asetStr.includes('HP') || asetStr.includes('HANDPHONE') || asetStr.includes('SMARTPHONE')
        if (targetLabel.includes('motor')) return asetStr.includes('MOTOR')
        if (targetLabel.includes('tv') || targetLabel.includes('televisi')) return asetStr.includes('TV') || asetStr.includes('TELEVISI')
        if (targetLabel.includes('kulkas') || targetLabel.includes('lemari es')) return asetStr.includes('KULKAS') || asetStr.includes('LEMARI ES')
        if (targetLabel.includes('mobil')) return asetStr.includes('MOBIL')
        if (targetLabel.includes('sepeda') && !targetLabel.includes('motor')) return asetStr.includes('SEPEDA') && !asetStr.includes('SEPEDA MOTOR')
        if (targetLabel.includes('emas') || targetLabel.includes('logam mulia')) return asetStr.includes('EMAS')
        if (targetLabel.includes('tidak') || targetLabel.includes('belum')) return !asetStr || asetStr === '-' || asetStr === 'TIDAK ADA' || asetStr === '0'
      }

      if (fieldKey === 'pendidikan_terakhir') {
        const s = String(row.pendidikan_terakhir || '').toUpperCase().trim()
        
        let eduCat = 'Belum Sekolah'
        if (s.includes('S1') || s.includes('S2') || s.includes('DIPLOMA') || s.includes('PERGURUAN') || s.includes('SARJANA')) {
          eduCat = 'PT'
        } else if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA') || s.includes('ALIYAH')) {
          eduCat = 'SMA'
        } else if (s.includes('SMP') || s.includes('MTS') || s.includes('SLTP')) {
          eduCat = 'SMP'
        } else if (s.includes('SD') || s.includes('MI')) {
          eduCat = 'SD'
        }

        const isSimpleLabel = !targetLabel.includes('aktif') && !targetLabel.includes('internet') && !targetLabel.includes('tidak')
        if (isSimpleLabel) {
          if (targetLabel.includes('perguruan') || targetLabel.includes('pt')) return eduCat === 'PT'
          if (targetLabel.includes('sma') || targetLabel.includes('smk')) return eduCat === 'SMA'
          if (targetLabel.includes('smp')) return eduCat === 'SMP'
          if (targetLabel.includes('sd')) return eduCat === 'SD'
          return eduCat === 'Belum Sekolah'
        }

        let matchesEdu = false
        if (targetLabel.includes('pt') || targetLabel.includes('s1') || targetLabel.includes('s2')) matchesEdu = (eduCat === 'PT')
        else if (targetLabel.includes('sma') || targetLabel.includes('smk')) matchesEdu = (eduCat === 'SMA')
        else if (targetLabel.includes('smp')) matchesEdu = (eduCat === 'SMP')
        else if (targetLabel.includes('sd')) matchesEdu = (eduCat === 'SD')

        if (!matchesEdu) return false

        const isInternetActive = String(row.apakah_aktif_menggunakan_internet_sebulan_terakhir || '').toUpperCase().trim() === 'YA'
        if (targetLabel.includes('aktif internet') || targetLabel.includes('(ya)') || targetLabel.includes('ya internet')) {
          return isInternetActive
        }
        if (targetLabel.includes('belum aktif') || targetLabel.includes('(tidak)')) {
          return !isInternetActive
        }

        return true
      }

      if (fieldKey === 'suku_bangsa') {
        let s = String(row.suku_bangsa || '').toUpperCase().trim()
        let cat = 'Belum Terdata'
        if (!s || s === '-' || s === '0' || s === 'TIDAK DIISI' || s === 'NULL') {
          cat = 'Belum Terdata'
        } else if (s.includes('CANIAGO') || s.includes('CHANIAGO')) {
          cat = 'Caniago'
        } else if (s.includes('PILIANG')) {
          cat = 'Piliang'
        } else if (s.includes('DALIMO')) {
          cat = 'Dalimo'
        } else if (s.includes('KOTO')) {
          cat = 'Koto'
        } else if (s.includes('PARIK') || s.includes('CANCANG') || s.includes('PAREK')) {
          cat = 'Parik Cancang'
        } else if (s.includes('MELAYU')) {
          cat = 'Melayu'
        } else if (s.includes('BENDUANG') || s.includes('BENDANG')) {
          cat = 'Benduang'
        } else if (s.includes('JAMBAK')) {
          cat = 'Jambak'
        } else if (s.includes('PITOPANG')) {
          cat = 'Pitopang'
        } else if (s.includes('MANDAILIANG') || s.includes('MANDAILING')) {
          cat = 'Mandailiang'
        } else if (s.includes('MINANG')) {
          cat = 'Minang'
        } else if (s.includes('JAWA')) {
          cat = 'Jawa'
        } else if (s.includes('SUNDA')) {
          cat = 'Sunda'
        } else if (s.includes('BATAK')) {
          cat = 'Batak'
        } else {
          cat = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'sumber_air_minum_terbanyak_dari') {
        const s = String(row.sumber_air_minum_terbanyak_dari || '').toUpperCase().trim()
        let cat = 'Air Kemasan / Isi Ulang'
        if (s.includes('SUMUR')) cat = 'Sumur Terlindung / Bor'
        else if (s.includes('KEMASAN') || s.includes('GALON') || s.includes('ISI ULANG')) cat = 'Air Kemasan / Isi Ulang'
        else if (s.includes('MATA AIR')) cat = 'Mata Air Terlindung'
        else if (s.includes('PAM') || s.includes('PDAM')) cat = 'PAM / PDAM Nagari'
        else return false
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'sumber_air_mandi_terbanyak_dari') {
        const s = String(row.sumber_air_mandi_terbanyak_dari || '').toUpperCase().trim()
        let cat = 'Sungai / Kolam Terbuka'
        if (s.includes('SUMUR')) cat = 'Sumur Terlindung / Bor'
        else if (s.includes('MATA AIR')) cat = 'Mata Air Pegunungan'
        else if (s.includes('PAM') || s.includes('PDAM')) cat = 'PAM / PDAM Nagari'
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'status_tanah_bangunan_tempat_tinggal_yang_ditempati' || fieldKey === 'tempat_tinggal_yang_ditempati') {
        const s = String(row.status_tanah_bangunan_tempat_tinggal_yang_ditempati || row.tempat_tinggal_yang_ditempati || '').toUpperCase().trim()
        let cat = 'Milik Sendiri'
        if (s.includes('PUSAKO')) {
          cat = 'Tanah Pusako Nagari'
        } else if (s.includes('ORANG TUA') || s.includes('ORTU') || s.includes('MERTUA') || s.includes('SAUDARA') || s.includes('KELUARGA') || s.includes('NENEK') || s.includes('BAKO') || s.includes('ANAK')) {
          cat = 'Milik Orang Tua / Kerabat'
        } else if (s.includes('ORANG LAIN') || s.includes('SEWA') || s.includes('KONTRAK') || s.includes('PINJAM') || s.includes('NUMPANG') || s.includes('NEGARA') || s.includes('DINAS') || s.includes('SEKOLAH')) {
          cat = 'Milik Orang Lain / Sewa / Numpang'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'lokasi_usaha') {
        const u = String(row.apakah_mempunyai_umkm || '').toUpperCase().trim()
        const hasName = row.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(row.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(row.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== ''
        const hasUmkm = u === 'YA' || u === 'PUNYA' || u === 'PERNAH' || u === '1' || hasName
        if (!hasUmkm) return false

        const s = String(row.lokasi_usaha || '').toUpperCase().trim()
        let cat = 'Kios / Warung di Jorong Nagari'
        if (!s || s === '-' || s === 'TIDAK ADA' || s === 'TIDAK' || s === '0' || s.includes('LEHER ANGSA') || s.includes('JONGKOK') || s.includes('DUDUK') || s.includes('CEMPLUNG')) {
          cat = 'Keliling / Belum Lokasi Tetap'
        } else if (s.includes('RUMAH') || s.includes('DEPAN RUMAH') || s.includes('DIRUMAH') || s.includes('DEKAT RUMAH')) {
          cat = 'Di Rumah / Halaman Sendiri'
        } else if (s.includes('PASAR')) {
          cat = 'Pasar Nagari / Tradisional'
        } else if (s.includes('KEBUN') || s.includes('LADANG') || s.includes('RIMBO') || s.includes('SAWAH')) {
          cat = 'Lahan Pertanian / Ladang / Kebun'
        } else if (s.includes('SEKOLAH') || s.includes('SDN') || s.includes('MASJID') || s.includes('SURAU') || s.includes('MUSHOLA') || s.includes('CAMAT') || s.includes('POS')) {
          cat = 'Fasilitas Publik (Sekolah/Masjid/Pos)'
        } else if (s.includes('PEKANBARU') || s.includes('TANJUNG BARU') || s.includes('SUMANIAK') || s.includes('BARULAK') || s.includes('LUAR')) {
          cat = 'Luar Nagari / Luar Daerah'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'apakah_memelihara_ternak') {
        const s = String(row.apakah_memelihara_ternak || '').toUpperCase().trim()
        const isTidak = !s || s === '-' || s === 'TIDAK' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK MEMELIHARA'
        
        // For Tab 2 No 8 (Rasio Kepemilikan)
        if (targetLabel.toLowerCase() === 'tidak memelihara') {
          return isTidak
        }
        if (targetLabel.toLowerCase() === 'memelihara ternak') {
          return !isTidak
        }

        // For Tab 2 No 9 (Komoditas Hewan Ternak)
        if (isTidak) return false

        if (targetLabel.includes('kambing')) {
          return s.includes('KAMBING')
        }
        if (targetLabel.includes('ayam') || targetLabel.includes('unggas')) {
          return s.includes('AYAM')
        }
        if (targetLabel.includes('sapi')) {
          return s.includes('SAPI')
        }
        if (targetLabel.includes('itik') || targetLabel.includes('bebek')) {
          return s.includes('ITIK') || s.includes('BEBEK')
        }
        if (targetLabel.includes('kerbau') || targetLabel.includes('lainnya')) {
          return s.includes('KERBAU') || s.includes('IKAN') || s.includes('KOLAM')
        }
        if (targetLabel.includes('terinci') || targetLabel.includes('unspec')) {
          const isKnown = s.includes('SAPI') || s.includes('KAMBING') || s.includes('AYAM') || s.includes('ITIK') || s.includes('BEBEK') || s.includes('KERBAU') || s.includes('IKAN') || s.includes('KOLAM')
          return !isKnown
        }
        
        return !isTidak
      }

      if (fieldKey === 'jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui') {
        const isAktif = String(row.apakah_aktif_menggunakan_internet_sebulan_terakhir || '').toUpperCase().trim() === 'YA'
        const s = String(row.jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui || '').toUpperCase().trim()
        
        let cat = 'Tidak Menggunakan Internet'
        if (!isAktif || s === '' || s === '-' || s === 'TIDAK' || s === 'TIDAK ADA' || s === 'TIDAK MENGGUNAKAN') {
          cat = 'Tidak Menggunakan Internet'
        } else if (s.includes('WIFI') && s.includes('HANDPHONE')) {
          cat = 'Kombinasi HP & Wi-Fi'
        } else if (s.includes('WIFI')) {
          cat = 'Wi-Fi Rumah'
        } else if (s.includes('HANDPHONE') || s.includes('HP')) {
          cat = 'Smartphone (HP)'
        } else {
          cat = 'Tidak Menggunakan Internet'
        }
        
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'kecepatan_akses_internet') {
        const s = String(row.kecepatan_akses_internet || '').toUpperCase().trim()
        let cat = ''
        if (s.includes('CEPAT')) cat = 'Sinyal Cepat (4G/5G)'
        else if (s.includes('SEDANG')) cat = 'Sinyal Sedang (3G/4G)'
        else if (s.includes('LAMBAT')) cat = 'Sinyal Lambat / Lemah'
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'apakah_sudah_mengetahui_metode_pembayaran_qris') {
        const u = String(row.apakah_mempunyai_umkm || '').toUpperCase().trim()
        const hasName = row.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(row.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(row.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== ''
        const qVal = String(row.apakah_sudah_mengetahui_metode_pembayaran_qris || '').trim()
        const iVal = String(row.apakah_ingin_membuat_qris_di_usahanya || '').trim()
        const mVal = String(row.apakah_lokasi_usahanya_sudah_ada_di_google_maps || '').trim()
        const hasQrisInfo = (qVal && qVal !== '-' && qVal !== '0') || (iVal && iVal !== '-' && iVal !== '0') || (mVal && mVal !== '-' && mVal !== '0')
        const isUmkm = u === 'YA' || u === 'PUNYA' || u === 'PERNAH' || u === '1' || hasName || hasQrisInfo
        if (!isUmkm) return false

        const q = String(row.apakah_sudah_mengetahui_metode_pembayaran_qris || '').toUpperCase().trim()
        const i = String(row.apakah_ingin_membuat_qris_di_usahanya || '').toUpperCase().trim()
        const m = String(row.apakah_lokasi_usahanya_sudah_ada_di_google_maps || '').toUpperCase().trim()

        if (targetLabel.toLowerCase().includes('sudah tahu')) {
          return q === 'SUDAH' || q === 'YA' || q === 'TAHU'
        }
        if (targetLabel.toLowerCase().includes('belum tahu')) {
          return !(q === 'SUDAH' || q === 'YA' || q === 'TAHU')
        }
        if (targetLabel.toLowerCase().includes('berminat') || targetLabel.toLowerCase().includes('ingin')) {
          return i === 'YA' || i === 'INGIN' || i === 'MAU'
        }
        if (targetLabel.toLowerCase().includes('google maps') || targetLabel.toLowerCase().includes('lokasi')) {
          return m === 'SUDAH' || m === 'YA' || m === 'ADA'
        }
        return false
      }

      if (fieldKey === 'jenis_dinding_sebagian_besar_rumah') {
        const s = String(row.jenis_dinding_sebagian_besar_rumah || '').toUpperCase().trim()
        if (targetLabel.includes('semen') || targetLabel.includes('permanen')) return s.includes('SEMEN') || s.includes('BATA') || s.includes('BATAKO') || s.includes('PERMANEN')
        if (targetLabel.includes('kayu') || targetLabel.includes('papan')) return s.includes('KAYU') || s.includes('PAPAN')
        if (targetLabel.includes('triplek') || targetLabel.includes('semi')) return s.includes('TRIPLEK') || s.includes('ANYAMAN') || s.includes('BAMBU')
        return s.length > 0
      }

      if (fieldKey === 'besar_daya_listrik_pln') {
        const s = String(row.besar_daya_listrik_pln || '').toUpperCase().trim()
        let cat = 'Menumpang / Belum Meteran'
        if (s.includes('450') || s.includes('200') || s.includes('230') || s.includes('300') || s.includes('400')) {
          cat = '450 VA (Subsidi)'
        } else if (s.includes('900') || s.includes('950')) {
          cat = '900 VA (Standar)'
        } else if (s.includes('1300') || s.includes('2200') || s.includes('3500')) {
          cat = '1300 VA+ (Komersial)'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'tempat_pembuangan_air_limbah_septic_tank') {
        const s = String(row.tempat_pembuangan_air_limbah_septic_tank || '').toUpperCase().trim()
        let cat = 'Tanpa Septic Tank'
        if (s.includes('SEPTIK') || s.includes('SEPTIC')) {
          cat = 'Tangki Septik Standar Safe'
        } else if (s.includes('KOLAM') || s.includes('SUNGAI') || s.includes('DRAINASE')) {
          cat = 'Ke Kolam / Sungai / Drainase'
        } else if (s.includes('LUBANG') || s.includes('TANAH')) {
          cat = 'Lubang Tanah Resapan'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'apakah_mempunyai_alergi_terhadap_obat') {
        const s = String(row.apakah_mempunyai_alergi_terhadap_obat || '').toUpperCase().trim()
        let cat = 'Tidak Ada Alergi Obat'
        if (s === 'YA' || s === 'IYA' || s.includes('ADA') || s.includes('ALERGI')) {
          cat = 'Memiliki Alergi Obat'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'fasilitas_mck') {
        const s = String(row.fasilitas_mck || '').toUpperCase().trim()
        let cat = 'Tidak Ada Jamban'
        if (s.includes('SENDIRI') || s.includes('PRIBADI')) {
          cat = 'Jamban Sendiri'
        } else if (s.includes('BERSAMA') || s.includes('KELUARGA')) {
          cat = 'Jamban Bersama'
        } else if (s.includes('UMUM') || s.includes('PUBLIK')) {
          cat = 'Jamban Umum'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'jenis_kloset') {
        const s = String(row.jenis_kloset || '').toUpperCase().trim()
        let cat = 'Tanpa Kloset'
        if (s.includes('LEHER') || s.includes('ANGSA')) {
          cat = 'Leher Angsa'
        } else if (s.includes('PLENGSENGAN')) {
          cat = 'Plengsengan'
        } else if (s.includes('CEMPLUNG') || s.includes('CUBLUK')) {
          cat = 'Cemplung / Cubluk'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'bpjs_kis') {
        const s = String(row.bpjs_kis || '').toUpperCase().trim()
        const isCovered = s === 'YA' || s === 'IYA' || s.includes('LENGKAP')
        if (targetLabel.includes('tercover') || targetLabel.includes('ya') || targetLabel.includes('penerima') || targetLabel.includes('pribadi')) {
          return isCovered
        }
        if (targetLabel.includes('belum') || targetLabel.includes('tidak')) {
          return !isCovered
        }
        return isCovered
      }

      if (fieldKey === 'kondisi_drainase_disekitar_rumah') {
        const s = String(row.kondisi_drainase_disekitar_rumah || '').toUpperCase().trim()
        let cat = 'Tidak Ada Drainase'
        if (s.includes('BAIK') || s.includes('LANCAR') || s.includes('TERAWAT')) {
          cat = 'Drainase Baik & Terawat'
        } else if (s.includes('RUSAK') || s.includes('SUMBAT') || s.includes('BURUK')) {
          cat = 'Drainase Rusak / Tersumbat'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'tempat_pembuangan_sampah') {
        const s = String(row.tempat_pembuangan_sampah || '').toUpperCase().trim()
        let cat = 'Dibakar Tradisional'
        if (s.includes('DIBAKAR')) {
          cat = 'Dibakar Tradisional'
        } else if (s.includes('KEBUN') || s.includes('SUNGAI') || s.includes('DRAINASE')) {
          cat = 'Dibuang ke Kebun / Sungai'
        } else if (s.includes('LUBANG') || s.includes('TANAH')) {
          cat = 'Lubang Tanah Organik'
        } else if (s.includes('ANGKUT') || s.includes('PETUGAS') || s.includes('REGULER')) {
          cat = 'Diangkut Petugas Reguler'
        } else {
          cat = 'Dibakar Tradisional'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'jika_iya_bagaimana_pelayanannya') {
        const s = String(row.jika_iya_bagaimana_pelayanannya || '').toUpperCase().trim()
        let cat = 'Tidak Mengakses Layanan Desa'
        if (s.includes('BAIK') || s.includes('RAMAH') || s.includes('BAGUS')) {
          cat = 'Pelayanan Baik & Ramah'
        } else if (s.includes('CUKUP')) {
          cat = 'Pelayanan Cukup'
        } else if (s.includes('BURUK') || s.includes('LAMA') || s.includes('KURANG')) {
          cat = 'Perlu Peningkatan / Kurang'
        }
        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran') {
        const s = String(row.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran || '').toUpperCase().trim()
        if (targetLabel.includes('aktif') || targetLabel.includes('pernah') || targetLabel.includes('ya')) return s === 'YA' || s === 'PERNAH'
        return !s || s === 'TIDAK' || s === '-'
      }

      if (fieldKey === 'apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana') {
        if (targetLabel.includes('pendampingan') || targetLabel.includes('tertangani')) return String(row.apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana || '').toUpperCase().trim() === 'YA'
        if (targetLabel.includes('terdampak')) return String(row.apakah_anda_terkena_dampak_bencana || '').toUpperCase().trim() === 'YA'
        return String(row.dalam_setahun_terakhir_apakah_terjadi_bencana || '').toUpperCase().trim() === 'YA'
      }

      if (fieldKey === 'apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana') {
        const s = String(row.apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana || '').toUpperCase().trim()
        const isPutus = s.includes('PERNAH') || s.includes('YA') || (s !== '-' && s !== 'TIDAK' && s !== '0' && s !== 'TUDAK ADA' && s !== 'TIDAK ADA' && s !== '' && !isNaN(parseInt(s, 10)) && parseInt(s, 10) > 0 && !s.includes('BIDANG'))
        if (targetLabel.includes('terputus') || targetLabel.includes('rentan')) return isPutus
        return !isPutus
      }

      if (fieldKey === 'program_keluarga_harapan_pkh') {
        if (targetLabel.includes('pkh')) return isPositiveAnswer(row.program_keluarga_harapan_pkh)
        if (targetLabel.includes('blt')) return isPositiveAnswer(row.blt_dana_desa)
        if (targetLabel.includes('bst') || targetLabel.includes('tunai')) return isPositiveAnswer(row.bantuan_sosial_tunai)
        if (targetLabel.includes('umkm')) return isPositiveAnswer(row.bantuan_umkm)
        if (targetLabel.includes('non') || targetLabel.includes('belum')) {
          return !isPositiveAnswer(row.program_keluarga_harapan_pkh) && !isPositiveAnswer(row.blt_dana_desa) && !isPositiveAnswer(row.bantuan_sosial_tunai) && !isPositiveAnswer(row.bantuan_umkm)
        }
      }

      if (fieldKey === 'bantuan_sosial_tunai') {
        const hasBansos = isPositiveAnswer(row.blt_dana_desa) || isPositiveAnswer(row.program_keluarga_harapan_pkh) || isPositiveAnswer(row.bantuan_sosial_tunai) || isPositiveAnswer(row.bantuan_umkm) || isPositiveAnswer(row.bpjs_kis)
        
        if (targetLabel.toLowerCase().includes('penerima')) {
          if (!hasBansos) return false
        } else if (targetLabel.toLowerCase().includes('mandiri') || targetLabel.toLowerCase().includes('non')) {
          if (hasBansos) return false
        }

        const expStr = String(row.berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah || '').toLowerCase()
        const num = parseInt(expStr.replace(/[^0-9]/g, ''), 10) || 0

        if (targetLabel.includes('< 2') || targetLabel.includes('<2')) {
          return num > 0 && num < 2000000
        }
        if (targetLabel.includes('> 4') || targetLabel.includes('>4')) {
          return num >= 4000000
        }
        return (num >= 2000000 && num < 4000000) || num <= 0
      }

      if (fieldKey === 'bantuan_rehap_rumah_tidak_layak_huni') {
        const s = String(row.bantuan_rehap_rumah_tidak_layak_huni || '').toUpperCase().trim()
        const isMenerima = s === 'IYA' || s === 'YA'
        const isKumuh = String(row.secara_keseluruhan_kondisi_rumah || '').toUpperCase().trim() === 'KUMUH'

        if (targetLabel.includes('berhasil dibedah') || targetLabel.includes('kini layak')) return isMenerima && !isKumuh
        if (targetLabel.includes('proses dibedah') || targetLabel.includes('masih rtlh')) return isMenerima && isKumuh
        if (targetLabel.includes('rtlh rentan') || targetLabel.includes('belum dibedah')) return !isMenerima && isKumuh
        if (targetLabel.includes('tidak menerima')) return !isMenerima && !isKumuh
        if (targetLabel.includes('telah') || targetLabel.includes('menerima') || targetLabel.includes('ya')) return isMenerima
        return !isMenerima
      }

      if (fieldKey === 'rumah_di_lereng_bukit_gunung') {
        if (targetLabel.includes('lereng')) return String(row.rumah_di_lereng_bukit_gunung || '').toUpperCase().trim() === 'YA'
        if (targetLabel.includes('sutet')) return String(row.rumah_berada_di_bawah_sutet_sutt_suttas || '').toUpperCase().trim() === 'YA'
        const b = String(row.data_kejadian_bencana || '').toUpperCase()
        if (targetLabel.includes('gempa')) return b.includes('GEMPA')
        if (targetLabel.includes('longsor')) return b.includes('LONGSOR')
        if (targetLabel.includes('puting') || targetLabel.includes('badai')) return b.includes('PUTING') || b.includes('BADAI')
      }

      if (fieldKey === 'apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif') {
        let ageYears = null
        const rawUsiaVal = (row.usia !== undefined && row.usia !== null) ? row.usia : ''
        const uRaw = String(rawUsiaVal).toLowerCase().trim()
        if (uRaw.includes('bulan') || uRaw.includes('bln')) {
          const num = parseFloat(uRaw.replace(/[^0-9.]/g, ''))
          if (!isNaN(num)) ageYears = num / 12
        } else if (uRaw !== '') {
          const num = parseInt(uRaw.replace(/[^0-9]/g, ''), 10)
          if (!isNaN(num)) ageYears = num
        }

        const jk = String(row.jenis_kelamin || '').toUpperCase().trim()
        const isFemale = jk.includes('PEREMPUAN') || jk.includes('WANITA') || jk === 'P'

        const a = String(row.apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif || '').toUpperCase().trim()
        const h = String(row.apakah_ibu_sedang_mengandung || '').toUpperCase().trim()

        const isAsiPos = a === 'YA' || a === 'IYA' || (a.includes('YA') && !a.includes('TIDAK'))
        const isHamilPos = h === 'YA' || h === 'IYA' || (h.includes('YA') && !h.includes('TIDAK'))

        const hasAsiAnswer = a !== '' && a !== '-' && a !== 'TIDAK DIISI'
        const hasHamilAnswer = h !== '' && h !== '-' && h !== 'TIDAK DIISI'

        const isBalita = (ageYears !== null && ageYears <= 5) || (hasAsiAnswer && ageYears === null)
        const isWus = (isFemale && ageYears !== null && ageYears >= 15 && ageYears <= 49) || (isFemale && hasHamilAnswer && ageYears === null)

        const target = targetLabel.toLowerCase().trim()

        if (target.includes('mengandung') || target.includes('ibu hamil') || target === 'hamil-ya') {
          return isWus && isHamilPos
        }
        if (target.includes('tidak hamil') || target === 'hamil-tidak' || (target.includes('wus') && target.includes('tidak'))) {
          return isWus && !isHamilPos && h === 'TIDAK'
        }
        if (target.includes('mendapatkan') || target === 'asi-ya') {
          return isBalita && isAsiPos
        }
        if (target.includes('tidak mendapatkan') || target === 'asi-tidak' || target.includes('tidak asi')) {
          return isBalita && !isAsiPos && a === 'TIDAK'
        }

        return false
      }

      if (fieldKey === 'berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak' || fieldKey === 'berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir') {
        const str = String(row.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir || row.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak || '')
        if (!str || str === '-' || str.includes('null')) return false

        const target = targetLabel.toLowerCase().trim()
        
        let targetFacKey = null
        if (target.includes('puskesmas') || target.includes('pustu')) targetFacKey = 'puskesmas'
        else if (target.includes('rumah sakit') || target.includes('rs')) targetFacKey = 'rs'
        else if (target.includes('bidan') || target.includes('posyandu')) targetFacKey = 'bidan'
        else if (target.includes('dokter') || target.includes('klinik') || target.includes('poliklinik')) targetFacKey = 'dokter'
        else if (target.includes('apotik') || target.includes('toko obat')) targetFacKey = 'apotik'

        if (!targetFacKey) return false

        let matchesFreq = (val) => false
        if (target.includes('1 kali') || target.includes('insidental') || target.includes('- 1')) {
          matchesFreq = (val) => val === 1
        } else if (target.includes('2 kali') || target.includes('seasonal') || target.includes('- 2')) {
          matchesFreq = (val) => val === 2
        } else if (target.includes('3 kali') || target.includes('kondisional') || target.includes('- 3')) {
          matchesFreq = (val) => val === 3
        } else if (target.includes('4 - 5') || target.includes('4-5') || target.includes('intensif')) {
          matchesFreq = (val) => val === 4 || val === 5
        } else if (target.includes('6+') || target.includes('rutin') || target.includes('bulanan')) {
          matchesFreq = (val) => val >= 6
        }

        let maxVal = 0
        let foundFac = false
        const parts = str.split(',')
        parts.forEach((p) => {
          const idx = p.indexOf(':')
          if (idx !== -1) {
            const key = p.substring(0, idx).trim().toLowerCase()
            const val = parseInt(p.substring(idx + 1).trim(), 10) || 0
            
            let currentFacKey = null
            if (key.includes('puskesmas')) currentFacKey = 'puskesmas'
            else if (key.includes('rumah sakit')) currentFacKey = 'rs'
            else if (key.includes('bidan')) currentFacKey = 'bidan'
            else if (key.includes('dokter') || key.includes('poliklinik')) currentFacKey = 'dokter'
            else if (key.includes('apotik')) currentFacKey = 'apotik'

            if (currentFacKey === targetFacKey) {
              foundFac = true
              if (val > maxVal) {
                maxVal = val
              }
            }
          }
        })

        return foundFac && maxVal > 0 && matchesFreq(maxVal)
      }

      if (fieldKey === 'perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan') {
        const u = String(row.apakah_mempunyai_umkm || '').toUpperCase().trim()
        const hasName = row.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(row.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(row.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== ''
        const isUmkm = u === 'YA' || u === 'PUNYA' || u === 'PERNAH' || u === '1' || hasName
        if (!isUmkm) return false

        const s = String(row.perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan || row.omset_pendapatan_umkm || '').toUpperCase().trim()
        let cat = 'Belum Terdata Omset'
        if (!s || s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK') {
          cat = 'Belum Terdata Omset'
        } else if (s.includes('1.000.000') && s.includes('3.000.000')) {
          cat = 'Rp 1 - 3 Juta / Bln'
        } else if (s.includes('3.000.000') && s.includes('5.000.000')) {
          cat = 'Rp 3 - 5 Juta / Bln'
        } else if (s.includes('LEBIH') || s.includes('> 5') || s.includes('>5') || (s.includes('5.000.000') && !s.includes('3.000.000'))) {
          cat = '> Rp 5 Juta / Bln'
        } else if (s.includes('<') || s.includes('KURANG') || s.includes('1.000.000')) {
          cat = '< Rp 1 Juta / Bln'
        } else {
          cat = 'Belum Terdata Omset'
        }

        return cat.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'status_pernikahan') {
        const norm = normalizeMaritalStatus(row.status_pernikahan).toLowerCase()
        if (targetLabel.includes('belum')) return norm.includes('belum')
        if (targetLabel.includes('cerai hidup')) return norm.includes('cerai hidup')
        if (targetLabel.includes('cerai mati')) return norm.includes('cerai mati')
        if (targetLabel.includes('kawin') || targetLabel.includes('menikah')) return norm === 'kawin'
      }

      if (fieldKey === 'pekerjaan_utama') {
        let s = String(row.pekerjaan_utama || '').toUpperCase().trim()
        let category = 'Belum / Tidak Bekerja'
        if (!s || s === '-' || s === '0' || s === 'TIDAK DIISI' || s === 'NULL' || s === 'TIDAK BEKERJA' || s === 'BELUM BEKERJA') {
          category = 'Belum / Tidak Bekerja'
        } else if (s.includes('PETANI') || s.includes('PEKEBUN') || s.includes('TANI') || s.includes('SAWAH')) {
          category = 'Petani / Pekebun'
        } else if (s.includes('DAGANG') || s.includes('WIRASWASTA') || s.includes('USAHA') || s.includes('JUAL') || s.includes('KEDAI')) {
          category = 'Pedagang / Wiraswasta'
        } else if (s.includes('PNS') || s.includes('ASN') || s.includes('PEGAWAI NEGERI')) {
          category = 'PNS / ASN'
        } else if (s.includes('IRT') || s.includes('RUMAH TANGGA') || s.includes('MENGURUS')) {
          category = 'Ibu Rumah Tangga'
        } else if (s.includes('PELAJAR') || s.includes('MAHASISWA') || s.includes('SEKOLAH')) {
          category = 'Pelajar / Mahasiswa'
        } else if (s.includes('BURUH') || s.includes('LEPAS') || s.includes('HARIAN')) {
          category = 'Buruh Harian Lepas'
        } else if (s.includes('SWASTA') || s.includes('KARYAWAN')) {
          category = 'Karyawan Swasta'
        } else if (s.includes('SOPIR') || s.includes('DRIVER') || s.includes('SUPIR')) {
          category = 'Sopir / Pengemudi'
        } else if (s.includes('TUKANG') || s.includes('BANGUNAN') || s.includes('KAYU') || s.includes('LAS')) {
          category = 'Tukang / Pertukangan'
        } else if (s.includes('GURU') || s.includes('DOSEN') || s.includes('PAUD')) {
          category = 'Guru / Tenaga Pendidik'
        } else if (s.includes('PETERNAK') || s.includes('TERNAK')) {
          category = 'Peternak'
        } else if (s.includes('POLRI') || s.includes('TNI') || s.includes('ABRI')) {
          category = 'TNI / POLRI'
        } else if (s.includes('HONORER') || s.includes('THL')) {
          category = 'Tenaga Honorer'
        } else {
          category = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
        }
        return category.toLowerCase() === targetLabel.toLowerCase()
      }

      if (fieldKey === 'secara_keseluruhan_kondisi_rumah') {
        const cond = String(row.secara_keseluruhan_kondisi_rumah || '').toUpperCase().trim()
        const isKumuh = cond === 'KUMUH' || cond === 'YA' || cond.includes('RUSAK BERAT')
        const isPerbaikan = cond.includes('PERBAIKAN') || cond.includes('RUSAK RINGAN') || cond.includes('SEDANG')

        if (targetLabel.includes('layak huni') && !targetLabel.includes('tidak')) {
          return !isKumuh && !isPerbaikan
        }
        if (targetLabel.includes('tidak layak') || targetLabel.includes('rtlh')) {
          return isKumuh
        }
        if (targetLabel.includes('perbaikan')) {
          return isPerbaikan
        }
      }

      const val = String(row[fieldKey] ?? '').toLowerCase().trim()
      if (!val) {
        return targetLabel.includes('tidak') || targetLabel.includes('lainnya') || targetLabel.includes('belum')
      }
      return val.includes(targetLabel) || targetLabel.includes(val)
    })

    return results
  }, [sourceRows, selectedSlice, fieldKey])

  const getDynamicFamilyHeader = () => {
    if (!fieldKey) return 'KONDISI RUMAH'
    const key = fieldKey.toLowerCase()
    if (key.includes('kondisi_rumah')) return 'KONDISI RUMAH'
    if (key.includes('bantuan_rehap') || key.includes('bedah_rumah')) return 'STATUS BEDAH RUMAH'
    if (key.includes('jenis_dinding')) return 'JENIS DINDING'
    if (key.includes('daya_listrik')) return 'DAYA LISTRIK'
    if (key.includes('dokumen') || key.includes('lahan')) return 'LEGALITAS LAHAN'
    if (key.includes('status_tanah') || key.includes('bangunan')) return 'STATUS HUNIAN'
    if (key.includes('lereng') || key.includes('bencana')) return 'RISIKO BENCANA'
    if (key.includes('terputus') || key.includes('jalan')) return 'AKSES JALAN BENCANA'
    if (key.includes('fasilitas_mck') || key.includes('mck')) return 'FASILITAS MCK'
    if (key.includes('jenis_kloset') || key.includes('kloset')) return 'TIPE KLOSET'
    if (key.includes('septic_tank') || key.includes('limbah')) return 'SEPTIC TANK'
    if (key.includes('sumber_air_minum') || key.includes('air_minum')) return 'SUMBER AIR MINUM'
    if (key.includes('sumber_air_mandi') || key.includes('air_mandi')) return 'SUMBER AIR MANDI'
    if (key.includes('drainase')) return 'KONDISI DRAINASE'
    if (key.includes('sampah')) return 'PENGELOLAAN SAMPAH'
    if (key.includes('bpjs_kis') || key.includes('bpjs')) return 'STATUS BPJS KK'
    if (key.includes('bantuan_pendidikan')) return 'BANTUAN PENDIDIKAN'
    if (key.includes('ternak')) return 'PETERNAKAN WARGA'
    if (key.includes('blt') || key.includes('pkh') || key.includes('bansos')) return 'STATUS BANSOS'

    const derived = fieldKey.replace(/_/g, ' ').toUpperCase()
    return derived.length > 22 ? derived.substring(0, 20) + '...' : derived
  }

  const getDynamicFamilyValue = (row) => {
    if (!row || !fieldKey) return row?.secara_keseluruhan_kondisi_rumah || '-'
    const key = fieldKey.toLowerCase()
    if (key.includes('kondisi_rumah')) return row.secara_keseluruhan_kondisi_rumah || '-'
    if (key.includes('bantuan_rehap') || key.includes('bedah_rumah')) return row.bantuan_rehap_rumah_tidak_layak_huni || row.secara_keseluruhan_kondisi_rumah || '-'
    if (key.includes('jenis_dinding')) return row.jenis_dinding_sebagian_besar_rumah || '-'
    if (key.includes('daya_listrik')) return row.besar_daya_listrik_pln || '-'
    if (key.includes('dokumen') || key.includes('lahan')) return row.apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi || '-'
    if (key.includes('status_tanah') || key.includes('bangunan')) return row.status_tanah_bangunan_tempat_tinggal_yang_ditempati || '-'
    if (key.includes('lereng') || key.includes('bencana')) return row.rumah_di_lereng_bukit_gunung || '-'
    if (key.includes('terputus') || key.includes('jalan')) return row.apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana || '-'
    if (key.includes('fasilitas_mck') || key.includes('mck')) return row.fasilitas_mck || row.jenis_kloset || '-'
    if (key.includes('jenis_kloset') || key.includes('kloset')) return row.jenis_kloset || '-'
    if (key.includes('septic_tank') || key.includes('limbah')) return row.tempat_pembuangan_air_limbah_septic_tank || '-'
    if (key.includes('sumber_air_minum') || key.includes('air_minum')) return row.sumber_air_minum_terbanyak_dari || '-'
    if (key.includes('sumber_air_mandi') || key.includes('air_mandi')) return row.sumber_air_mandi_terbanyak_dari || '-'
    if (key.includes('drainase')) return row.kondisi_drainase_disekitar_rumah || '-'
    if (key.includes('sampah')) return row.tempat_pembuangan_sampah || '-'
    if (key.includes('bpjs_kis') || key.includes('bpjs')) return row.bpjs_kis || 'Tercover'
    if (key.includes('bantuan_pendidikan')) return row.bantuan_pendidikan_anak || '-'
    if (key.includes('ternak')) return row.apakah_memelihara_ternak || '-'
    if (key.includes('blt') || key.includes('pkh') || key.includes('bansos')) return row.program_keluarga_harapan_pkh || row.blt_dana_desa || '-'

    return row[fieldKey] !== undefined && row[fieldKey] !== null ? String(row[fieldKey]) : (row.secara_keseluruhan_kondisi_rumah || '-')
  }

  const getDynamicIndividuHeader = () => {
    if (!fieldKey) return 'PEKERJAAN UTAMA'
    const key = fieldKey.toLowerCase()
    if (key.includes('pekerjaan')) return 'PEKERJAAN UTAMA'
    if (key.includes('pendidikan')) return 'PENDIDIKAN TERAKHIR'
    if (key.includes('internet') && key.includes('media')) return 'MEDIA INTERNET'
    if (key.includes('internet') && key.includes('kecepatan')) return 'KUALITAS SINYAL'
    if (key.includes('internet')) return 'AKSES INTERNET'
    if (key.includes('musrenbang') || key.includes('masukan')) return 'SARAN MUSRENBANG'
    if (key.includes('pelayanan') || key.includes('layanan')) return 'EVALUASI PELAYANAN'
    if (key.includes('psikososial') || key.includes('mitigasi')) return 'PENANGANAN BENCANA'
    if (key.includes('asi_eksklusif') || key.includes('mengandung')) return 'STATUS ASI / HAMIL'
    if (key.includes('alergi')) return 'ALERGI OBAT'
    if (key.includes('didatangi_setahun') || key.includes('faskes')) return 'INTENSITAS BEROBAT'
    if (key.includes('ketenagakerjaan')) return 'BPJS KETENAGAKERJAAN'
    if (key.includes('jika_punya') || key.includes('bpjs')) return 'STATUS BPJS INDIVIDU'
    if (key.includes('umkm') || key.includes('pendapatan')) return 'KATEGORI / USAMA UMKM'

    const derived = fieldKey.replace(/_/g, ' ').toUpperCase()
    return derived.length > 22 ? derived.substring(0, 20) + '...' : derived
  }

  const getDynamicIndividuValue = (row) => {
    if (!row || !fieldKey) return row?.pekerjaan_utama || '-'
    const key = fieldKey.toLowerCase()
    if (key.includes('pekerjaan')) return row.pekerjaan_utama || '-'
    if (key.includes('pendidikan')) return row.pendidikan_terakhir || '-'
    if (key.includes('internet') && key.includes('media')) return row.jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui || (isPositiveAnswer(row.apakah_mengunakan_akses_internet_dalam_3_bulan_terakhir) ? 'Akses Internet' : 'Tidak Ada')
    if (key.includes('internet') && key.includes('kecepatan')) return row.kecepatan_akses_internet || '-'
    if (key.includes('internet')) return row.apakah_mengunakan_akses_internet_dalam_3_bulan_terakhir || '-'
    if (key.includes('musrenbang') || key.includes('masukan')) return row.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran || '-'
    if (key.includes('pelayanan') || key.includes('layanan')) return row.jika_iya_bagaimana_pelayanannya || '-'
    if (key.includes('psikososial') || key.includes('mitigasi')) return row.apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana || '-'
    if (key.includes('asi_eksklusif') || key.includes('mengandung')) {
      if (row.apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif) return `ASI: ${row.apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif}`
      if (row.apakah_ibu_sedang_mengandung) return `Hamil: ${row.apakah_ibu_sedang_mengandung}`
      return '-'
    }
    if (key.includes('alergi')) return row.apakah_mempunyai_alergi_terhadap_obat || '-'
    if (key.includes('didatangi_setahun') || key.includes('faskes')) return row.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir || row.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak || '-'
    if (key.includes('ketenagakerjaan')) return row.jaminan_sosial_ketenagakerjaan || '-'
    if (key.includes('jika_punya') || key.includes('bpjs')) return row.jika_punya || row.jaminan_sosial_kesehatan || '-'
    if (key.includes('umkm') || key.includes('pendapatan')) return row.perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan || row.jika_punya_apa_nama_usahanya_dan_dibidang_apa || '-'

    return row[fieldKey] !== undefined && row[fieldKey] !== null ? String(row[fieldKey]) : (row.pekerjaan_utama || '-')
  }

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRecords = useMemo(() => filteredRecords.slice(startIndex, startIndex + itemsPerPage), [filteredRecords, startIndex, itemsPerPage])

  const handleSelectSlice = (slice) => {
    setSelectedSlice(slice)
    setCurrentPage(1)
  }
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1440px',
          height: '100%',
          maxHeight: 'calc(100vh - 48px)',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 100000,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f8fafc',
            flexShrink: 0,
          }}
        >
          <div>
            <span className="eyebrow" style={{ color: 'var(--primary-teal)', fontWeight: 700, fontSize: '0.8rem' }}>
              DETAIL VISUALISASI GRAFIK EKSEKUTIF
            </span>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '1.25rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="secondary-button btn-sm"
            onClick={onClose}
            style={{
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body: 50-50 Equal Split Layout (Left: Scaled Visual, Right: Table) */}
        <div
          style={{
            padding: '20px 24px',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '24px',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* LEFT SIDE (50%): Enlarged Visual Presentation Panel */}
          <div
            style={{
              background: '#f8fafc',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              height: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#0f766e', fontWeight: 700 }}>
                💡 Klik irisan/kategori visual di bawah untuk memfilter tabel:
              </p>
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: type === 'faskes_frequency' ? '14px 16px' : '24px',
                border: '1px solid #e2e8f0',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'stretch',
                alignItems: 'stretch',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              <div className="expanded-chart-wrapper">
                {type === 'donut' && (
                  <SvgDonutChart data={data} onSliceClick={(slice) => handleSelectSlice(slice)} isExpanded={true} />
                )}
                {(type === 'pie' || type === 'pie_chart') && (
                  <SvgPieChart data={data} onSliceClick={(slice) => handleSelectSlice(slice)} isExpanded={true} />
                )}
                {type === 'bar' && (
                  <SvgBarChart data={data} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'grouped' && (
                  <SvgGroupedBarChart data={data} categories={[{ key: 'bansos', label: 'Penerima', color: '#0d9488' }, { key: 'nonBansos', label: 'Mandiri', color: '#94a3b8' }]} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'pyramid' && (
                  <SvgPopulationPyramid data={data} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'stacked_column' && (
                  <Svg100StackedColumnChart
                    groups={data}
                    series={chartConfig.series || [
                      { key: 'series1', label: 'Aktif Internet (Ya)', color: '#0d9488' },
                      { key: 'series2', label: 'Belum Aktif (Tidak)', color: '#cbd5e1' },
                    ]}
                    onSliceClick={(item) => handleSelectSlice(item)}
                    isExpanded={true}
                  />
                )}
                {(type === 'stacked_bar' || type === 'horizontal_stacked') && (
                  <SvgHorizontalStackedBar data={data} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'pillar' && (
                  <SvgPillarColumnChart data={data} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'rtlh_kpi' && (
                  <SvgKpiStackedProgressBar data={data} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} icon={chartConfig.icon} />
                )}
                {type === 'maternal_card' && (
                  <SvgMaternalChildHealthCard
                    asiData={chartConfig.asiData}
                    hamilData={chartConfig.hamilData}
                    onSliceClick={(item) => handleSelectSlice(item)}
                    isExpanded={true}
                  />
                )}
                {type === 'faskes_frequency' && (
                  <SvgFaskesFrequencyChart
                    data={chartConfig.rawFaskesData}
                    onSliceClick={(item) => handleSelectSlice(item)}
                    isExpanded={true}
                  />
                )}
                {type === 'bullet' && (
                  <SvgBulletChart data={data} onSliceClick={(item) => handleSelectSlice(item)} />
                )}
                {type === 'waterfall' && (
                  <SvgWaterfallChart data={data} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'area' && (
                  <SvgAreaChart data={data} onSliceClick={(item) => handleSelectSlice(item)} />
                )}
                {(type === 'line' || type === 'spline') && (
                  <SvgLineChart data={data} onSliceClick={(item) => handleSelectSlice(item)} />
                )}
                {type === 'scorecard' && (
                  <SvgExecutiveScorecard data={data} onSliceClick={(item) => handleSelectSlice(item)} />
                )}
                {type === 'waffle' && (
                  <SvgWaffleChart activeCount={data[0]?.value || 0} totalCount={(data[0]?.value || 0) + (data[1]?.value || 0)} activeLabel={data[0]?.label || 'Aktif'} inactiveLabel={data[1]?.label || 'Tidak'} onSliceClick={(item) => handleSelectSlice(item)} isExpanded={true} />
                )}
                {type === 'histogram' && (
                  <SvgHistogramWithKpi data={data} avgMember={familyRows.length > 0 ? (individuRows.length / familyRows.length).toFixed(1) : 0} onSliceClick={(item) => handleSelectSlice(item)} />
                )}
                {(type === 'radial' || type === 'semi_circle') && (
                  <SvgRadialGauge
                    value={Array.isArray(data) && data[0]?.value ? data[0].value : 0}
                    max={sourceRows.length || 100}
                    label={Array.isArray(data) && data[0]?.label ? data[0].label : 'Detail Gauge'}
                    subMetrics={Array.isArray(data) ? data : []}
                    isMultiSegment={true}
                    onSliceClick={(item) => handleSelectSlice(item)}
                    isExpanded={true}
                  />
                )}
                {type === 'treemap' && (
                  <SvgTreemapChart data={data} onSliceClick={(item) => handleSelectSlice(item)} />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE (50%): Deep-Drill Data Table Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                Tabel Data Terfilter: <span style={{ color: 'var(--primary-teal)', fontWeight: 800 }}>{getSliceLabel(selectedSlice) || 'Semua Data'}</span> ({filteredRecords.length} Data)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Klik baris untuk melihat detail</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '12px', background: '#ffffff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', width: '45px' }}>NO</th>
                    {isIndividu ? (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>NIK</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>NAMA LENGKAP</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>USIA</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>{getDynamicIndividuHeader()}</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>NOMOR KK</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>KEPALA KELUARGA</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>ALAMAT / JORONG</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569' }}>{getDynamicFamilyHeader()}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      onClick={() => {
                        onClose()
                        if (isIndividu && onViewDetailIndividu) onViewDetailIndividu(row)
                        else if (!isIndividu && onViewDetailFamily) onViewDetailFamily(row)
                      }}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0', transition: 'background 0.15s ease' }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{startIndex + idx + 1}</td>
                      {isIndividu ? (
                        <>
                          <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.nomor_nik || row.nik || '-'}</td>
                          <td style={{ padding: '9px 12px', color: '#0d9488', fontWeight: 600 }}>{row.nama || row.nama_lengkap || '-'}</td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{row.usia ? row.usia + ' Thn' : '-'}</td>
                          <td style={{ padding: '9px 12px' }}>{getDynamicIndividuValue(row)}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '9px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{row.nomor_kk || '-'}</td>
                          <td style={{ padding: '9px 12px', color: '#0d9488', fontWeight: 600 }}>{row.nama_kepala_keluarga || '-'}</td>
                          <td style={{ padding: '9px 12px' }}>{row.alamat_lengkap || '-'}</td>
                          <td style={{ padding: '9px 12px' }}>{getDynamicFamilyValue(row)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', flexShrink: 0 }}>
              <span style={{ color: '#64748b' }}>
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRecords.length)} dari {filteredRecords.length} data
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  className="secondary-button btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  style={{ height: '30px', padding: '0 8px', fontSize: '0.76rem', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  ‹ Sebelumnya
                </button>

                {Array.from({ length: Math.min(totalPages, 6) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 6 && currentPage > 3) {
                    pageNum = currentPage - 2 + i
                    if (pageNum > totalPages) pageNum = totalPages - (5 - i)
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className={`secondary-button btn-sm ${currentPage === pageNum ? 'primary-button' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{ height: '30px', width: '30px', padding: 0, fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  type="button"
                  className="secondary-button btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  style={{ height: '30px', padding: '0 8px', fontSize: '0.76rem', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Berikutnya ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HomeDashboardPage({ rows = [], rowsIndividu = [], onNavigate, onViewDetailFamily, onViewDetailIndividu, isSidebarOpen, onToggleSidebar, currentUser, onLogout, onOpenSettings }) {
  const [activeTab, setActiveTab] = useState('ringkasan')
  const [selectedJorong, setSelectedJorong] = useState('all')
  const [expandedChart, setExpandedChart] = useState(null)

  const kkAddressMap = useMemo(() => {
    const map = new Map()
    rows.forEach((r) => {
      if (r.nomor_kk) {
        map.set(String(r.nomor_kk).trim(), r.alamat_lengkap || '')
      }
    })
    return map
  }, [rows])

  const filteredFamilyRows = useMemo(() => {
    if (selectedJorong === 'all') return rows
    return rows.filter((r) => matchesJorongFilter(r.alamat_lengkap, selectedJorong))
  }, [rows, selectedJorong])

  const filteredIndividuRows = useMemo(() => {
    if (selectedJorong === 'all') return rowsIndividu
    return rowsIndividu.filter((r) => {
      const familyAddress = r.nomor_kk ? kkAddressMap.get(String(r.nomor_kk).trim()) : null
      const addressToTest = r.alamat_lengkap || r.alamat || familyAddress || ''
      return matchesJorongFilter(addressToTest, selectedJorong)
    })
  }, [rowsIndividu, selectedJorong, kkAddressMap])

  const kpiStats = useMemo(() => {
    const totalKK = filteredFamilyRows.length
    const totalJiwa = filteredIndividuRows.length

    // 1. RTLH: 'KUMUH' in database = 57 houses (out of 594), 'TIDAK KUMUH' = 537 houses (90% Layak Huni)
    const totalRtlh = filteredFamilyRows.filter((r) => {
      const cond = String(r.secara_keseluruhan_kondisi_rumah || '').toUpperCase().trim()
      return cond === 'KUMUH' || (cond.includes('KUMUH') && !cond.includes('TIDAK KUMUH')) || cond.includes('RUSAK') || cond.includes('TIDAK LAYAK')
    }).length

    // 2. BPJS: 'PESERTA' in database jaminan_sosial_kesehatan = 1.159 citizens (60% coverage out of 1.922)
    const totalBpjs = filteredIndividuRows.filter((r) => {
      const bpjs = String(r.jaminan_sosial_kesehatan || r.jika_punya || '').toUpperCase().trim()
      return bpjs === 'PESERTA' || bpjs.includes('BPJS') || bpjs.includes('KIS') || (bpjs.includes('YA') && !bpjs.includes('TIDAK'))
    }).length

    // 3. Bansos: Unique KK receiving PKH, BLT, BST, Bedah Rumah, PIP, or Nagari aid = 256 KK (43% out of 594)
    const totalBansos = filteredFamilyRows.filter((r) => {
      const blt = String(r.blt_dana_desa || '').toUpperCase()
      const pkh = String(r.program_keluarga_harapan_pkh || '').toUpperCase()
      const bst = String(r.bantuan_sosial_tunai || '').toUpperCase()
      const pip = String(r.bantuan_pendidikan_anak || '').toUpperCase()
      const rehap = String(r.bantuan_rehap_rumah_tidak_layak_huni || '').toUpperCase()
      const lain = String(r.bantuan_lainnya || '').toUpperCase()

      const isBlt = blt.includes('YA') || blt.includes('COVID') || blt.includes('SEMBAKO')
      const isPkh = pkh === 'YA'
      const isBst = bst === 'YA'
      const isPip = pip === 'YA'
      const isRehap = rehap === 'IYA' || rehap === 'YA'
      const isLain = lain.includes('BPNT') || lain.includes('SEMBAKO') || lain.includes('BERAS') || lain.includes('BAZNAS') || lain.includes('KIP') || lain.includes('KKS') || lain.includes('LANSIA') || lain.includes('KESTRA')

      return isBlt || isPkh || isBst || isPip || isRehap || isLain
    }).length

    // 4. Bekerja: 'BEKERJA' in database kondisi_pekerjaan = 798 citizens
    const totalPekerja = filteredIndividuRows.filter((r) => {
      const cond = String(r.kondisi_pekerjaan || '').toUpperCase().trim()
      return cond === 'BEKERJA' || (cond.includes('BEKERJA') && !cond.includes('TIDAK') && !cond.includes('BELUM'))
    }).length

    return { totalKK, totalJiwa, totalRtlh, totalBpjs, totalBansos, totalPekerja }
  }, [filteredFamilyRows, filteredIndividuRows])

  // TAB 1 DATA — Grafik 1-12 100% Sesuai Rancangan Tabel Design
  const genderData = useMemo(() => [
    { label: 'Laki-laki', value: filteredIndividuRows.filter((r) => String(r.jenis_kelamin || '').toLowerCase().includes('laki')).length, color: '#0284c7' },
    { label: 'Perempuan', value: filteredIndividuRows.filter((r) => String(r.jenis_kelamin || '').toLowerCase().includes('perempuan')).length, color: '#ec4899' },
  ], [filteredIndividuRows])

  const agePyramidData = useMemo(() => {
    const groups = [
      { label: '0-5 Thn', min: 0, max: 5 },
      { label: '6-12 Thn', min: 6, max: 12 },
      { label: '13-25 Thn', min: 13, max: 25 },
      { label: '26-59 Thn', min: 26, max: 59 },
      { label: '60+ Thn', min: 60, max: 200 },
    ]
    return groups.map((g) => {
      let laki = 0, perempuan = 0
      filteredIndividuRows.forEach((r) => {
        const age = parseAge(r.usia)
        if (age === null || age < g.min || age > g.max) return
        const gender = String(r.jenis_kelamin || '').toLowerCase()
        if (gender.includes('perempuan')) perempuan++
        else laki++
      })
      return { label: g.label, laki, perempuan }
    })
  }, [filteredIndividuRows])

  const maritalData = useMemo(() => {
    const counts = countByNormalized(filteredIndividuRows, (r) => normalizeMaritalStatus(r.status_pernikahan))
    const items = [
      { key: 'BELUM KAWIN', label: 'Belum Kawin', color: '#0d9488' },
      { key: 'KAWIN', label: 'Sudah Kawin / Menikah', color: '#0284c7' },
      { key: 'CERAI HIDUP', label: 'Cerai Hidup', color: '#f59e0b' },
      { key: 'CERAI MATI', label: 'Cerai Mati (Duda/Janda)', color: '#8b5cf6' },
    ]
    return items
      .map((item) => ({
        label: item.label,
        value: counts[item.key] || 0,
        color: item.color,
      }))
      .filter((item) => item.value > 0)
  }, [filteredIndividuRows])

  const pekerjaanData = useMemo(() => {
    const rawCounts = {}
    filteredIndividuRows.forEach((r) => {
      let s = String(r.pekerjaan_utama || '').toUpperCase().trim()
      if (!s || s === '-' || s === '0' || s === 'TIDAK DIISI' || s === 'NULL' || s === 'TIDAK BEKERJA' || s === 'BELUM BEKERJA') {
        s = 'Belum / Tidak Bekerja'
      } else if (s.includes('PETANI') || s.includes('PEKEBUN') || s.includes('TANI') || s.includes('SAWAH')) {
        s = 'Petani / Pekebun'
      } else if (s.includes('DAGANG') || s.includes('WIRASWASTA') || s.includes('USAHA') || s.includes('JUAL') || s.includes('KEDAI')) {
        s = 'Pedagang / Wiraswasta'
      } else if (s.includes('PNS') || s.includes('ASN') || s.includes('PEGAWAI NEGERI')) {
        s = 'PNS / ASN'
      } else if (s.includes('IRT') || s.includes('RUMAH TANGGA') || s.includes('MENGURUS')) {
        s = 'Ibu Rumah Tangga'
      } else if (s.includes('PELAJAR') || s.includes('MAHASISWA') || s.includes('SEKOLAH')) {
        s = 'Pelajar / Mahasiswa'
      } else if (s.includes('BURUH') || s.includes('LEPAS') || s.includes('HARIAN')) {
        s = 'Buruh Harian Lepas'
      } else if (s.includes('SWASTA') || s.includes('KARYAWAN')) {
        s = 'Karyawan Swasta'
      } else if (s.includes('SOPIR') || s.includes('DRIVER') || s.includes('SUPIR')) {
        s = 'Sopir / Pengemudi'
      } else if (s.includes('TUKANG') || s.includes('BANGUNAN') || s.includes('KAYU') || s.includes('LAS')) {
        s = 'Tukang / Pertukangan'
      } else if (s.includes('GURU') || s.includes('DOSEN') || s.includes('PAUD')) {
        s = 'Guru / Tenaga Pendidik'
      } else if (s.includes('PETERNAK') || s.includes('TERNAK')) {
        s = 'Peternak'
      } else if (s.includes('POLRI') || s.includes('TNI') || s.includes('ABRI')) {
        s = 'TNI / POLRI'
      } else if (s.includes('HONORER') || s.includes('THL')) {
        s = 'Tenaga Honorer'
      } else {
        s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
      }

      rawCounts[s] = (rawCounts[s] || 0) + 1
    })

    return Object.entries(rawCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label,
        value,
        color: PALETTE[i % PALETTE.length],
        unit: 'Jiwa',
      }))
  }, [filteredIndividuRows])
  const pekerjaanAllData = useMemo(() => {
    return Object.entries(countBy(filteredIndividuRows, 'pekerjaan_utama'))
      .filter(([label]) => label !== 'Tidak Diisi' && label !== '-')
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] }))
  }, [filteredIndividuRows])

  const educationData = useMemo(() => {
    let sd = 0, smp = 0, sma = 0, pt = 0, non = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.pendidikan_terakhir || '').toUpperCase().trim()
      if (!s || s === '-' || s === 'TIDAK DIISI' || s === '0') {
        non++
        return
      }
      if (s.includes('S3') || s.includes('S2') || s.includes('S1') || s.includes('DIPLOMA') || s.includes('D1') || s.includes('D2') || s.includes('D3') || s.includes('D4') || s.includes('KULIAH') || s.includes('SARJANA') || s.includes('MAGISTER')) {
        pt++
      } else if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA') || s.includes('ALIYAH') || s.includes('PAKET C')) {
        sma++
      } else if (s.includes('SMP') || s.includes('MTS') || s.includes('SLTP') || s.includes('PAKET B')) {
        smp++
      } else if (s.includes('SD') || s.includes('IBTIDAIYAH') || s.includes('PAKET A')) {
        sd++
      } else {
        non++
      }
    })

    const items = [
      { label: 'SD / Sederajat', value: sd, color: '#0d9488', unit: 'Jiwa' },
      { label: 'SMA / SMK / Sederajat', value: sma, color: '#0284c7', unit: 'Jiwa' },
      { label: 'Belum / Tidak Sekolah', value: non, color: '#94a3b8', unit: 'Jiwa' },
      { label: 'SMP / MTs / Sederajat', value: smp, color: '#f59e0b', unit: 'Jiwa' },
      { label: 'Perguruan Tinggi (D3/S1/S2)', value: pt, color: '#8b5cf6', unit: 'Jiwa' },
    ]

    return items.sort((a, b) => b.value - a.value)
  }, [filteredIndividuRows])

  const bpjsMultiSegmentData = useMemo(() => {
    let pbi = 0, mandiri = 0, nonBpjs = 0
    filteredIndividuRows.forEach((r) => {
      const mainStatus = String(r.jaminan_sosial_kesehatan || '').toLowerCase().trim()
      const detailType = String(r.jika_punya || '').toLowerCase().trim()
      const combined = `${mainStatus} ${detailType}`

      if (
        detailType.includes('pemerintah') ||
        detailType.includes('pbi') ||
        detailType.includes('kis') ||
        combined.includes('pemerintah') ||
        combined.includes('pbi') ||
        combined.includes('kis')
      ) {
        pbi++
      } else if (
        detailType.includes('mandiri') ||
        detailType.includes('swasta') ||
        detailType.includes('kerja') ||
        combined.includes('mandiri')
      ) {
        mandiri++
      } else if (mainStatus.includes('peserta') && !mainStatus.includes('bukan')) {
        pbi++
      } else {
        nonBpjs++
      }
    })
    return [
      { label: 'BPJS PBI / KIS (Pemerintah)', value: pbi, color: '#0d9488' },
      { label: 'BPJS Mandiri / Swasta', value: mandiri, color: '#0284c7' },
      { label: 'Belum Tercover BPJS', value: nonBpjs, color: '#94a3b8' },
    ]
  }, [filteredIndividuRows])

  const donutConditionData = useMemo(() => {
    if (!filteredFamilyRows.length) {
      return [
        { label: 'Rumah Layak Huni', value: 0, color: '#0d9488' },
        { label: 'Rumah Tidak Layak (RTLH)', value: 0, color: '#ef4444' },
        { label: 'Perbaikan Ringan', value: 0, color: '#f59e0b' },
      ]
    }
    let layak = 0, rtlh = 0, perbaikan = 0
    filteredFamilyRows.forEach((r) => {
      const cond = String(r.secara_keseluruhan_kondisi_rumah || '').toUpperCase().trim()

      if (cond === 'KUMUH' || cond === 'YA' || cond.includes('RUSAK BERAT')) {
        rtlh++
      } else if (cond.includes('PERBAIKAN') || cond.includes('RUSAK RINGAN') || cond.includes('SEDANG')) {
        perbaikan++
      } else {
        layak++
      }
    })
    return [
      { label: 'Rumah Layak Huni', value: layak, color: '#0d9488' },
      { label: 'Rumah Tidak Layak (RTLH)', value: rtlh, color: '#ef4444' },
      { label: 'Perbaikan Ringan', value: perbaikan, color: '#f59e0b' },
    ]
  }, [filteredFamilyRows])

  const bansosGroupedData = useMemo(() => {
    if (!filteredFamilyRows.length) {
      return [
        { groupLabel: 'Pengeluaran < 2 Juta/Bln', bansos: 0, nonBansos: 0 },
        { groupLabel: 'Pengeluaran 2 - 4 Juta/Bln', bansos: 0, nonBansos: 0 },
        { groupLabel: 'Pengeluaran > 4 Juta/Bln', bansos: 0, nonBansos: 0 },
      ]
    }
    let lowBansos = 0, lowNon = 0, midBansos = 0, midNon = 0, highBansos = 0, highNon = 0
    filteredFamilyRows.forEach((r) => {
      const hasBansos = isPositiveAnswer(r.blt_dana_desa) || isPositiveAnswer(r.program_keluarga_harapan_pkh) || isPositiveAnswer(r.bantuan_sosial_tunai) || isPositiveAnswer(r.bantuan_umkm) || isPositiveAnswer(r.bpjs_kis)
      const expStr = String(r.berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah || '').toLowerCase()
      const num = parseInt(expStr.replace(/[^0-9]/g, ''), 10) || 0
      if (num > 0 && num < 2000000) { if (hasBansos) lowBansos++; else lowNon++ }
      else if (num >= 4000000) { if (hasBansos) highBansos++; else highNon++ }
      else { if (hasBansos) midBansos++; else midNon++ }
    })
    return [
      { groupLabel: 'Pengeluaran < 2 Juta/Bln', bansos: lowBansos, nonBansos: lowNon },
      { groupLabel: 'Pengeluaran 2 - 4 Juta/Bln', bansos: midBansos, nonBansos: midNon },
      { groupLabel: 'Pengeluaran > 4 Juta/Bln', bansos: highBansos, nonBansos: highNon },
    ]
  }, [filteredFamilyRows])

  const housingTenureData = useMemo(() => {
    let sendiri = 0, pusako = 0, keluarga = 0, sewaOrangLain = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.status_tanah_bangunan_tempat_tinggal_yang_ditempati || r.tempat_tinggal_yang_ditempati || '').toUpperCase().trim()
      if (s.includes('PUSAKO')) {
        pusako++
      } else if (s.includes('ORANG TUA') || s.includes('ORTU') || s.includes('MERTUA') || s.includes('SAUDARA') || s.includes('KELUARGA') || s.includes('NENEK') || s.includes('BAKO') || s.includes('ANAK')) {
        keluarga++
      } else if (s.includes('ORANG LAIN') || s.includes('SEWA') || s.includes('KONTRAK') || s.includes('PINJAM') || s.includes('NUMPANG') || s.includes('NEGARA') || s.includes('DINAS') || s.includes('SEKOLAH')) {
        sewaOrangLain++
      } else {
        sendiri++
      }
    })

    return [
      { label: 'Milik Sendiri', value: sendiri, color: '#0d9488', unit: 'KK' },
      { label: 'Milik Orang Lain / Sewa / Numpang', value: sewaOrangLain, color: '#0284c7', unit: 'KK' },
      { label: 'Tanah Pusako Nagari', value: pusako, color: '#8b5cf6', unit: 'KK' },
      { label: 'Milik Orang Tua / Kerabat', value: keluarga, color: '#f59e0b', unit: 'KK' },
    ].sort((a, b) => b.value - a.value)
  }, [filteredFamilyRows])

  const sukuData = useMemo(() => {
    const rawCounts = {}
    filteredIndividuRows.forEach((r) => {
      let s = String(r.suku_bangsa || '').toUpperCase().trim()
      if (!s || s === '-' || s === '0' || s === 'TIDAK DIISI' || s === 'NULL') {
        s = 'Belum Terdata'
      } else if (s.includes('CANIAGO') || s.includes('CHANIAGO')) {
        s = 'Caniago'
      } else if (s.includes('PILIANG')) {
        s = 'Piliang'
      } else if (s.includes('DALIMO')) {
        s = 'Dalimo'
      } else if (s.includes('KOTO')) {
        s = 'Koto'
      } else if (s.includes('PARIK') || s.includes('CANCANG') || s.includes('PAREK')) {
        s = 'Parik Cancang'
      } else if (s.includes('MELAYU')) {
        s = 'Melayu'
      } else if (s.includes('BENDUANG') || s.includes('BENDANG')) {
        s = 'Benduang'
      } else if (s.includes('JAMBAK')) {
        s = 'Jambak'
      } else if (s.includes('PITOPANG')) {
        s = 'Pitopang'
      } else if (s.includes('MANDAILIANG') || s.includes('MANDAILING')) {
        s = 'Mandailiang'
      } else if (s.includes('MINANG')) {
        s = 'Minang'
      } else if (s.includes('JAWA')) {
        s = 'Jawa'
      } else if (s.includes('SUNDA')) {
        s = 'Sunda'
      } else if (s.includes('BATAK')) {
        s = 'Batak'
      } else {
        s = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
      }

      rawCounts[s] = (rawCounts[s] || 0) + 1
    })

    return Object.entries(rawCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        label,
        value,
        color: PALETTE[i % PALETTE.length],
        unit: 'Jiwa',
      }))
  }, [filteredIndividuRows])
  const ktpUpdateData = useMemo(() => {
    let sudah = 0, belum = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.apakah_sudah_melakukan_update_kk_ktp || '').toLowerCase().trim()
      if (s.includes('sudah') || s.includes('ya') || s.includes('lengkap') || /\b(201[5-9]|202[0-6])\b/.test(s)) {
        sudah++
      } else {
        belum++
      }
    })
    return [
      { label: 'Sudah Update KK/KTP', value: sudah, color: '#0d9488' },
      { label: 'Belum Update', value: belum, color: '#f59e0b' },
    ]
  }, [filteredIndividuRows])

  const workConditionData = useMemo(() => {
    let penuh = 0, paruh = 0, belum = 0, sekolah = 0
    filteredIndividuRows.forEach((r) => {
      const cond = String(r.kondisi_pekerjaan || '').toUpperCase().trim()
      const job = String(r.pekerjaan_utama || '').toUpperCase().trim()
      const age = parseAge(r.usia)

      if (cond.includes('PARUH') || cond.includes('SAMPINGAN') || cond.includes('KADANG')) {
        paruh++
      } else if (cond.includes('TIDAK') || cond.includes('BELUM') || cond.includes('MENCARI') || job.includes('TIDAK BEKERJA') || job.includes('BELUM BEKERJA')) {
        if (age !== null && (age < 15 || age > 64)) sekolah++
        else belum++
      } else if (cond.includes('PENUH') || cond.includes('BEKERJA') || (job && job !== '-' && job !== 'TIDAK DIISI')) {
        penuh++
      } else {
        if (age !== null && (age < 15 || age > 64)) sekolah++
        else belum++
      }
    })
    return [
      { label: 'Bekerja Penuh', value: penuh, color: '#0d9488' },
      { label: 'Bekerja Paruh Waktu', value: paruh, color: '#0284c7' },
      { label: 'Belum / Tidak Bekerja', value: belum, color: '#f59e0b' },
      { label: 'Usia Sekolah / Non-Produktif', value: sekolah, color: '#8b5cf6' },
    ]
  }, [filteredIndividuRows])

  const familySizeHistogramData = useMemo(() => {
    let g1 = 0, g2 = 0, g3 = 0, g4 = 0
    filteredFamilyRows.forEach((r) => {
      const num = parseInt(String(r.jumlah_anggota_dalam_keluarga || '').replace(/[^0-9]/g, ''), 10) || 0
      if (num <= 2) g1++
      else if (num <= 4) g2++
      else if (num <= 6) g3++
      else g4++
    })
    return [
      { label: '1-2 Jiwa', value: g1, color: '#3b82f6' },
      { label: '3-4 Jiwa', value: g2, color: '#0d9488' },
      { label: '5-6 Jiwa', value: g3, color: '#8b5cf6' },
      { label: '7+ Jiwa', value: g4, color: '#f59e0b' },
    ]
  }, [filteredFamilyRows])

  const avgMemberPerKk = useMemo(() => {
    if (!filteredFamilyRows.length) return 0
    let validSum = 0, validCount = 0
    filteredFamilyRows.forEach((r) => {
      const num = parseInt(String(r.jumlah_anggota_dalam_keluarga || '').replace(/[^0-9]/g, ''), 10)
      if (Number.isFinite(num) && num > 0 && num <= 20) {
        validSum += num
        validCount++
      }
    })
    if (validCount > 0) {
      return (validSum / validCount).toFixed(1)
    }
    return filteredFamilyRows.length > 0
      ? (filteredIndividuRows.length / filteredFamilyRows.length).toFixed(1)
      : 0
  }, [filteredFamilyRows, filteredIndividuRows])

  const citizenshipData = useMemo(() => Object.entries(countBy(filteredIndividuRows, 'warganegara')).map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] })), [filteredIndividuRows])
  const disabilityData = useMemo(() => Object.entries(countBy(filteredIndividuRows, 'disabilitas')).map(([label, value], i) => ({ label, value, color: PALETTE[(i + 1) % PALETTE.length] })), [filteredIndividuRows])

  const bansosDistributionData = useMemo(() => {
    let pkh = 0, blt = 0, bst = 0, umkm = 0, nonBansos = 0
    filteredFamilyRows.forEach((r) => {
      const hasPkh = isPositiveAnswer(r.program_keluarga_harapan_pkh)
      const hasBlt = isPositiveAnswer(r.blt_dana_desa)
      const hasBst = isPositiveAnswer(r.bantuan_sosial_tunai)
      const hasUmkm = isPositiveAnswer(r.bantuan_umkm)

      if (hasPkh) pkh++
      if (hasBlt) blt++
      if (hasBst) bst++
      if (hasUmkm) umkm++

      if (!hasPkh && !hasBlt && !hasBst && !hasUmkm) {
        nonBansos++
      }
    })

    return [
      { label: 'PKH', value: pkh, color: '#0d9488' },
      { label: 'BLT Dana Desa', value: blt, color: '#0284c7' },
      { label: 'Bansos Tunai (BST)', value: bst, color: '#8b5cf6' },
      { label: 'Bantuan UMKM', value: umkm, color: '#f59e0b' },
      { label: 'Belum / Non-Penerima Bansos', value: nonBansos, color: '#94a3b8' },
    ]
  }, [filteredFamilyRows])

  const umkmStats = useMemo(() => {
    const umkmList = filteredFamilyRows.filter((r) => {
      const u = String(r.apakah_mempunyai_umkm || '').toUpperCase().trim()
      const hasName = r.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== ''
      const q = String(r.apakah_sudah_mengetahui_metode_pembayaran_qris || '').trim()
      const i = String(r.apakah_ingin_membuat_qris_di_usahanya || '').trim()
      const m = String(r.apakah_lokasi_usahanya_sudah_ada_di_google_maps || '').trim()
      const hasQrisInfo = (q && q !== '-' && q !== '0') || (i && i !== '-' && i !== '0') || (m && m !== '-' && m !== '0')
      return u === 'YA' || u === 'PUNYA' || u === 'PERNAH' || u === '1' || hasName || hasQrisInfo
    })
    const total = umkmList.length || 1
    let tahu = 0, ingin = 0, maps = 0
    umkmList.forEach((r) => {
      const q = String(r.apakah_sudah_mengetahui_metode_pembayaran_qris || '').toUpperCase().trim()
      const i = String(r.apakah_ingin_membuat_qris_di_usahanya || '').toUpperCase().trim()
      const m = String(r.apakah_lokasi_usahanya_sudah_ada_di_google_maps || '').toUpperCase().trim()
      if (q === 'SUDAH' || q === 'YA' || q === 'TAHU') tahu++
      if (i === 'YA' || i === 'INGIN' || i === 'MAU') ingin++
      if (m === 'SUDAH' || m === 'YA' || m === 'ADA') maps++
    })
    return {
      totalUmkm: umkmList.length,
      tahuQris: tahu,
      tahuPct: Math.round((tahu / total) * 100),
      inginQris: ingin,
      inginPct: Math.round((ingin / total) * 100),
      maps: maps,
      mapsPct: Math.round((maps / total) * 100),
      subMetrics: [
        { label: 'Sudah Tahu QRIS', value: tahu, pct: Math.round((tahu / total) * 100), color: '#0d9488' },
        { label: 'Ingin Buat QRIS', value: ingin, pct: Math.round((ingin / total) * 100), color: '#0284c7' },
        { label: 'Ada di Google Maps', value: maps, pct: Math.round((maps / total) * 100), color: '#f59e0b' },
      ],
      detailData: [
        { label: 'Sudah Tahu QRIS', value: tahu, color: '#0d9488' },
        { label: 'Belum Tahu QRIS', value: Math.max(0, umkmList.length - tahu), color: '#94a3b8' },
        { label: 'Berminat Buat QRIS', value: ingin, color: '#0284c7' },
        { label: 'Lokasi di Google Maps', value: maps, color: '#f59e0b' },
      ]
    }
  }, [filteredFamilyRows])

  const expenceData = useMemo(() => {
    const parseExpenseNum = (str) => {
      if (!str) return 0
      const s = String(str).trim().toUpperCase()
      if (s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK TENTU' || s === 'BELUM ADA') return 0
      if (s.includes('JUTA') || s.includes('JT')) {
        const num = parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.'))
        if (!isNaN(num) && num > 0 && num < 100) return num * 1000000
      }
      const digitsOnly = s.replace(/[^0-9]/g, '')
      const val = parseInt(digitsOnly, 10)
      if (isNaN(val) || val <= 0) return 0
      if (val < 100) return val * 1000000
      return val
    }

    let under1M = 0, m1to2 = 0, m2to3 = 0, m3to5 = 0, above5M = 0, unrecorded = 0

    filteredFamilyRows.forEach((r) => {
      const num = parseExpenseNum(r.berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah)
      if (num <= 0) unrecorded++
      else if (num < 1000000) under1M++
      else if (num <= 2000000) m1to2++
      else if (num <= 3000000) m2to3++
      else if (num <= 5000000) m3to5++
      else above5M++
    })

    const items = [
      { label: '< Rp 1 Juta', value: under1M, color: '#0d9488', unit: 'KK' },
      { label: 'Rp 1 - 2 Juta', value: m1to2, color: '#0284c7', unit: 'KK' },
      { label: 'Rp 2 - 3 Juta', value: m2to3, color: '#6366f1', unit: 'KK' },
      { label: 'Rp 3 - 5 Juta', value: m3to5, color: '#f59e0b', unit: 'KK' },
      { label: '> Rp 5 Juta', value: above5M, color: '#10b981', unit: 'KK' },
    ]

    if (unrecorded > 0) {
      items.push({ label: 'Belum Terdata', value: unrecorded, color: '#94a3b8', unit: 'KK' })
    }

    return items
  }, [filteredFamilyRows])

  const omsetData = useMemo(() => {
    let under1M = 0, m1to3M = 0, m3to5M = 0, above5M = 0, unrecorded = 0
    const umkmList = filteredFamilyRows.filter((r) => {
      const u = String(r.apakah_mempunyai_umkm || '').toUpperCase().trim()
      const hasName = r.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== ''
      return u === 'YA' || u === 'PUNYA' || u === 'PERNAH' || u === '1' || hasName
    })

    umkmList.forEach((r) => {
      const s = String(r.perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan || r.omset_pendapatan_umkm || '').toUpperCase().trim()
      if (!s || s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK') {
        unrecorded++
      } else if (s.includes('1.000.000') && s.includes('3.000.000')) {
        m1to3M++
      } else if (s.includes('3.000.000') && s.includes('5.000.000')) {
        m3to5M++
      } else if (s.includes('LEBIH') || s.includes('> 5') || s.includes('>5') || (s.includes('5.000.000') && !s.includes('3.000.000'))) {
        above5M++
      } else if (s.includes('<') || s.includes('KURANG') || s.includes('1.000.000')) {
        under1M++
      } else {
        unrecorded++
      }
    })

    const items = [
      { label: '< Rp 1 Juta / Bln', value: under1M, color: '#0d9488', unit: 'UMKM' },
      { label: 'Rp 1 - 3 Juta / Bln', value: m1to3M, color: '#0284c7', unit: 'UMKM' },
      { label: 'Rp 3 - 5 Juta / Bln', value: m3to5M, color: '#f59e0b', unit: 'UMKM' },
      { label: '> Rp 5 Juta / Bln', value: above5M, color: '#10b981', unit: 'UMKM' },
    ]

    if (unrecorded > 0) {
      items.push({ label: 'Belum Terdata Omset', value: unrecorded, color: '#94a3b8', unit: 'UMKM' })
    }

    return items
  }, [filteredFamilyRows])

  const householdAssetsData = useMemo(() => {
    let hp = 0, motor = 0, tv = 0, kulkas = 0, mobil = 0, sepeda = 0, emas = 0, none = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.kepemilikin_aset || '').toUpperCase()
      if (!s || s === '-' || s === 'TIDAK ADA' || s === '0') {
        none++
        return
      }
      if (s.includes('HP') || s.includes('HANDPHONE') || s.includes('SMARTPHONE')) hp++
      if (s.includes('MOTOR')) motor++
      if (s.includes('TV') || s.includes('TELEVISI')) tv++
      if (s.includes('KULKAS') || s.includes('LEMARI ES')) kulkas++
      if (s.includes('MOBIL')) mobil++
      if (s.includes('SEPEDA') && !s.includes('SEPEDA MOTOR')) sepeda++
      if (s.includes('EMAS')) emas++
    })

    const items = [
      { label: 'Handphone (HP)', value: hp, color: '#0d9488', unit: 'KK' },
      { label: 'Sepeda Motor', value: motor, color: '#0284c7', unit: 'KK' },
      { label: 'Televisi (TV)', value: tv, color: '#6366f1', unit: 'KK' },
      { label: 'Kulkas / Lemari Es', value: kulkas, color: '#8b5cf6', unit: 'KK' },
      { label: 'Mobil', value: mobil, color: '#f59e0b', unit: 'KK' },
      { label: 'Sepeda', value: sepeda, color: '#10b981', unit: 'KK' },
      { label: 'Emas / Logam Mulia', value: emas, color: '#ec4899', unit: 'KK' },
    ]

    return items.sort((a, b) => b.value - a.value)
  }, [filteredFamilyRows])

  const assetOwnershipData = useMemo(() => [
    { label: 'Memelihara Ternak', value: countYes(filteredFamilyRows, 'apakah_memelihara_ternak'), color: '#10b981' },
    { label: 'Memiliki Lahan PBB', value: countYes(filteredFamilyRows, 'jumlah_lembar_pbb'), color: '#3b82f6' },
    { label: 'Dokumen Lahan Resmi', value: countYes(filteredFamilyRows, 'apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi'), color: '#8b5cf6' },
  ], [filteredFamilyRows])

  const umkmLocationData = useMemo(() => {
    let jorong = 0, rumah = 0, pasar = 0, fasum = 0, kebun = 0, luar = 0, keliling = 0
    
    const umkmList = filteredFamilyRows.filter((r) => {
      const u = String(r.apakah_mempunyai_umkm || '').toUpperCase().trim()
      const hasName = r.jika_punya_apa_nama_usahanya_dan_dibidang_apa && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== '-' && String(r.jika_punya_apa_nama_usahanya_dan_dibidang_apa).trim() !== ''
      return u === 'YA' || u === 'PUNYA' || u === 'PERNAH' || u === '1' || hasName
    })

    umkmList.forEach((r) => {
      const s = String(r.lokasi_usaha || '').toUpperCase().trim()
      if (!s || s === '-' || s === 'TIDAK ADA' || s === 'TIDAK' || s === '0' || s.includes('LEHER ANGSA') || s.includes('JONGKOK') || s.includes('DUDUK') || s.includes('CEMPLUNG')) {
        keliling++
      } else if (s.includes('RUMAH') || s.includes('DEPAN RUMAH') || s.includes('DIRUMAH') || s.includes('DEKAT RUMAH')) {
        rumah++
      } else if (s.includes('PASAR')) {
        pasar++
      } else if (s.includes('KEBUN') || s.includes('LADANG') || s.includes('RIMBO') || s.includes('SAWAH')) {
        kebun++
      } else if (s.includes('SEKOLAH') || s.includes('SDN') || s.includes('MASJID') || s.includes('SURAU') || s.includes('MUSHOLA') || s.includes('CAMAT') || s.includes('POS')) {
        fasum++
      } else if (s.includes('PEKANBARU') || s.includes('TANJUNG BARU') || s.includes('SUMANIAK') || s.includes('BARULAK') || s.includes('LUAR')) {
        luar++
      } else {
        jorong++
      }
    })

    const items = [
      { label: 'Kios / Warung di Jorong Nagari', value: jorong, color: '#0d9488', unit: 'UMKM' },
      { label: 'Di Rumah / Halaman Sendiri', value: rumah, color: '#0284c7', unit: 'UMKM' },
      { label: 'Pasar Nagari / Tradisional', value: pasar, color: '#6366f1', unit: 'UMKM' },
      { label: 'Fasilitas Publik (Sekolah/Masjid/Pos)', value: fasum, color: '#8b5cf6', unit: 'UMKM' },
      { label: 'Lahan Pertanian / Ladang / Kebun', value: kebun, color: '#10b981', unit: 'UMKM' },
      { label: 'Luar Nagari / Luar Daerah', value: luar, color: '#f59e0b', unit: 'UMKM' },
      { label: 'Keliling / Belum Lokasi Tetap', value: keliling, color: '#94a3b8', unit: 'UMKM' },
    ]

    return items.filter(d => d.value > 0).sort((a, b) => b.value - a.value)
  }, [filteredFamilyRows])

  const bpjsKetenagakerjaanData = useMemo(() => {
    return Object.entries(countBy(filteredIndividuRows, 'jaminan_sosial_ketenagakerjaan'))
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: PALETTE[(i + 5) % PALETTE.length] }))
  }, [filteredIndividuRows])

  const landLegalityData = useMemo(() => Object.entries(countBy(filteredFamilyRows, 'apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi')).map(([label, value], i) => ({ label, value, color: PALETTE[i % PALETTE.length] })), [filteredFamilyRows])
  const bantuanPendidikanData = useMemo(() => Object.entries(countBy(filteredFamilyRows, 'bantuan_pendidikan_anak')).map(([label, value], i) => ({ label, value, color: PALETTE[(i + 2) % PALETTE.length] })), [filteredFamilyRows])

  const landStatusData = useMemo(() => {
    return Object.entries(countBy(filteredFamilyRows, 'status_tanah_bangunan_tempat_tinggal_yang_ditempati'))
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: PALETTE[(i + 3) % PALETTE.length] }))
  }, [filteredFamilyRows])

  const workConditionRawData = useMemo(() => {
    return Object.entries(countBy(filteredIndividuRows, 'kondisi_pekerjaan'))
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: PALETTE[(i + 4) % PALETTE.length] }))
  }, [filteredIndividuRows])

  const livestockRatioData = useMemo(() => {
    let ya = 0, tidak = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.apakah_memelihara_ternak || '').toUpperCase().trim()
      if (!s || s === '-' || s === 'TIDAK' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK MEMELIHARA') {
        tidak++
      } else {
        ya++
      }
    })
    return [
      { label: 'Memelihara Ternak', value: ya, color: '#0d9488', unit: 'KK' },
      { label: 'Tidak Memelihara', value: tidak, color: '#94a3b8', unit: 'KK' },
    ]
  }, [filteredFamilyRows])

  const livestockTypeData = useMemo(() => {
    let sapi = 0, kambing = 0, ayam = 0, itik = 0, kerbau = 0, ikan = 0, unspec = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.apakah_memelihara_ternak || '').toUpperCase().trim()
      if (!s || s === '-' || s === 'TIDAK' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK MEMELIHARA') {
        return
      }
      let matched = false
      if (s.includes('SAPI')) { sapi++; matched = true }
      if (s.includes('KAMBING')) { kambing++; matched = true }
      if (s.includes('AYAM')) { ayam++; matched = true }
      if (s.includes('ITIK') || s.includes('BEBEK')) { itik++; matched = true }
      if (s.includes('KERBAU')) { kerbau++; matched = true }
      if (s.includes('IKAN') || s.includes('KOLAM')) { ikan++; matched = true }
      if (!matched) unspec++
    })

    const items = [
      { label: 'Kambing', value: kambing, color: '#0d9488', unit: 'KK' },
      { label: 'Ayam / Unggas', value: ayam, color: '#0284c7', unit: 'KK' },
      { label: 'Sapi Potong / Perah', value: sapi, color: '#f59e0b', unit: 'KK' },
      { label: 'Itik / Bebek', value: itik, color: '#8b5cf6', unit: 'KK' },
      { label: 'Kerbau & Lainnya', value: kerbau + ikan, color: '#10b981', unit: 'KK' },
    ]

    if (unspec > 0) {
      items.push({ label: 'Ternak Belum Terinci', value: unspec, color: '#64748b', unit: 'KK' })
    }

    return items.sort((a, b) => b.value - a.value)
  }, [filteredFamilyRows])

  // TAB 3 DATA (12 Visualizations - Kesehatan, Sanitasi & Lingkungan)
  // 1. Fasilitas MCK (ODF Alert Progress Bar)
  const mckData = useMemo(() => {
    let sendiri = 0, bersama = 0, umum = 0, odf = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.fasilitas_mck || '').toUpperCase().trim()
      if (s.includes('SENDIRI') || s.includes('PRIBADI')) sendiri++
      else if (s.includes('BERSAMA') || s.includes('KELUARGA')) bersama++
      else if (s.includes('UMUM') || s.includes('PUBLIK')) umum++
      else odf++
    })
    return [
      { label: 'Jamban Sendiri', value: sendiri, color: '#0d9488' },
      { label: 'Jamban Bersama', value: bersama, color: '#0284c7' },
      { label: 'Jamban Umum', value: umum, color: '#f59e0b' },
      { label: 'Tidak Ada Jamban', value: odf, color: '#e11d48' },
    ]
  }, [filteredFamilyRows])

  // 2. Jenis Kloset Digunakan (Waterfall Chart)
  const klosetData = useMemo(() => {
    let leherAngsa = 0, plengsengan = 0, cemplung = 0, noKloset = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.jenis_kloset || '').toUpperCase().trim()
      if (s.includes('LEHER') || s.includes('ANGSA')) leherAngsa++
      else if (s.includes('PLENGSENGAN')) plengsengan++
      else if (s.includes('CEMPLUNG') || s.includes('CUBLUK')) cemplung++
      else noKloset++
    })
    return [
      { label: 'Leher Angsa', value: leherAngsa, color: '#0d9488' },
      { label: 'Plengsengan', value: plengsengan, color: '#0284c7' },
      { label: 'Cemplung / Cubluk', value: cemplung, color: '#f59e0b' },
      { label: 'Tanpa Kloset', value: noKloset, color: '#94a3b8' },
    ]
  }, [filteredFamilyRows])

  // 3. Septic Tank (Donut Chart dengan Central KPI)
  const septicTankData = useMemo(() => {
    let septic = 0, kolam = 0, tanah = 0, noSeptic = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.tempat_pembuangan_air_limbah_septic_tank || '').toUpperCase().trim()
      if (s.includes('SEPTIK') || s.includes('SEPTIC')) septic++
      else if (s.includes('KOLAM') || s.includes('SUNGAI') || s.includes('DRAINASE')) kolam++
      else if (s.includes('LUBANG') || s.includes('TANAH')) tanah++
      else noSeptic++
    })
    return [
      { label: 'Tangki Septik Standar Safe', value: septic, color: '#0d9488' },
      { label: 'Ke Kolam / Sungai / Drainase', value: kolam, color: '#f59e0b' },
      { label: 'Lubang Tanah Resapan', value: tanah, color: '#0284c7' },
      { label: 'Tanpa Septic Tank', value: noSeptic, color: '#94a3b8' },
    ]
  }, [filteredFamilyRows])

  // 4. Sumber Air Minum (Ranked Horizontal Bars)
  const waterData = useMemo(() => {
    let sumur = 0, galon = 0, mataAir = 0, pam = 0, lain = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.sumber_air_minum_terbanyak_dari || '').toUpperCase().trim()
      if (s.includes('SUMUR')) sumur++
      else if (s.includes('KEMASAN') || s.includes('GALON') || s.includes('ISI ULANG')) galon++
      else if (s.includes('MATA AIR')) mataAir++
      else if (s.includes('PAM') || s.includes('PDAM')) pam++
      else lain++
    })
    return [
      { label: 'Sumur Terlindung / Bor', value: sumur, color: '#0d9488', unit: 'KK' },
      { label: 'Air Kemasan / Isi Ulang', value: galon, color: '#0284c7', unit: 'KK' },
      { label: 'Mata Air Terlindung', value: mataAir, color: '#6366f1', unit: 'KK' },
      { label: 'PAM / PDAM Nagari', value: pam, color: '#f59e0b', unit: 'KK' },
    ].sort((a, b) => b.value - a.value)
  }, [filteredFamilyRows])

  // 5. Sumber Air Mandi & Cuci (Pie Chart Side-by-Side)
  const bathWaterData = useMemo(() => {
    let sumur = 0, mataAir = 0, pam = 0, sungai = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.sumber_air_mandi_terbanyak_dari || '').toUpperCase().trim()
      if (s.includes('SUMUR')) sumur++
      else if (s.includes('MATA AIR')) mataAir++
      else if (s.includes('PAM') || s.includes('PDAM')) pam++
      else sungai++
    })
    return [
      { label: 'Sumur Terlindung / Bor', value: sumur, color: '#0d9488' },
      { label: 'Mata Air Pegunungan', value: mataAir, color: '#0284c7' },
      { label: 'PAM / PDAM Nagari', value: pam, color: '#8b5cf6' },
      { label: 'Sungai / Kolam Terbuka', value: sungai, color: '#f59e0b' },
    ]
  }, [filteredFamilyRows])

  // 6. Drainase Rumah (Spline Area Chart)
  const drainageData = useMemo(() => {
    let baik = 0, rusak = 0, noDrain = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.kondisi_drainase_disekitar_rumah || '').toUpperCase().trim()
      if (s.includes('BAIK') || s.includes('LANCAR') || s.includes('TERAWAT')) baik++
      else if (s.includes('RUSAK') || s.includes('SUMBAT') || s.includes('BURUK')) rusak++
      else noDrain++
    })
    return [
      { label: 'Drainase Baik & Terawat', value: baik, color: '#10b981' },
      { label: 'Drainase Rusak / Tersumbat', value: rusak, color: '#f59e0b' },
      { label: 'Tidak Ada Drainase', value: noDrain, color: '#ef4444' },
    ]
  }, [filteredFamilyRows])

  // 7. Pengelolaan Sampah (Horizontal Stacked Segmented Bar)
  const wasteManagementData = useMemo(() => {
    let bakar = 0, kebun = 0, lubang = 0, angkut = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.tempat_pembuangan_sampah || '').toUpperCase().trim()
      if (s.includes('DIBAKAR')) bakar++
      else if (s.includes('KEBUN') || s.includes('SUNGAI') || s.includes('DRAINASE')) kebun++
      else if (s.includes('LUBANG') || s.includes('TANAH')) lubang++
      else if (s.includes('ANGKUT') || s.includes('PETUGAS') || s.includes('REGULER')) angkut++
      else bakar++
    })
    return [
      { label: 'Dibakar Tradisional', value: bakar, color: '#f59e0b' },
      { label: 'Dibuang ke Kebun / Sungai', value: kebun, color: '#ef4444' },
      { label: 'Lubang Tanah Organik', value: lubang, color: '#10b981' },
      { label: 'Diangkut Petugas Reguler', value: angkut, color: '#0d9488' },
    ]
  }, [filteredFamilyRows])

  // 8. BPJS Kesehatan Individu (Executive Scorecard)
  const bpjsData = useMemo(() => {
    let pbi = 0, mandiri = 0, nonBpjs = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.jika_punya || '').toUpperCase().trim()
      if (s.includes('PEMERINTAH') || s.includes('PBI') || s.includes('KIS')) pbi++
      else if (s.includes('MANDIRI') || s.includes('SWASTA')) mandiri++
      else nonBpjs++
    })
    return [
      { label: 'BPJS PBI / KIS Government', value: pbi, color: '#10b981' },
      { label: 'BPJS Mandiri / Swasta', value: mandiri, color: '#0284c7' },
      { label: 'Belum Tercover BPJS', value: nonBpjs, color: '#94a3b8', isNonAccess: true },
    ]
  }, [filteredIndividuRows])

  // 9. Total BPJS KK (Waffle Chart Matrix)
  const totalBpjsCoverageData = useMemo(() => {
    let ya = 0, tidak = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.bpjs_kis || '').toUpperCase().trim()
      if (s === 'YA' || s === 'IYA' || s.includes('LENGKAP')) ya++
      else tidak++
    })
    return {
      tercover: ya,
      belumTercover: tidak,
      total: filteredFamilyRows.length || 1,
    }
  }, [filteredFamilyRows])

  // 10. ASI Eksklusif & Ibu Hamil (Strict Demographic Filtering: Balita <= 5 thn & WUS Perempuan 15-49 thn)
  const asiIbuHamilData = useMemo(() => {
    let asiYa = 0, asiTidak = 0, asiNull = 0
    let hamilYa = 0, hamilTidak = 0, hamilNull = 0

    let totalBalita = 0
    let totalWus = 0

    filteredIndividuRows.forEach((r) => {
      // Parse age safely (handling 0 years old for babies)
      let ageYears = null
      const rawUsiaVal = (r.usia !== undefined && r.usia !== null) ? r.usia : ''
      const uRaw = String(rawUsiaVal).toLowerCase().trim()
      if (uRaw.includes('bulan') || uRaw.includes('bln')) {
        const num = parseFloat(uRaw.replace(/[^0-9.]/g, ''))
        if (!isNaN(num)) ageYears = num / 12
      } else if (uRaw !== '') {
        const num = parseInt(uRaw.replace(/[^0-9]/g, ''), 10)
        if (!isNaN(num)) ageYears = num
      }

      const jk = String(r.jenis_kelamin || '').toUpperCase().trim()
      const isFemale = jk.includes('PEREMPUAN') || jk.includes('WANITA') || jk === 'P'

      const a = String(r.apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif || '').toUpperCase().trim()
      const h = String(r.apakah_ibu_sedang_mengandung || '').toUpperCase().trim()

      const isAsiPos = a === 'YA' || a === 'IYA' || (a.includes('YA') && !a.includes('TIDAK'))
      const isHamilPos = h === 'YA' || h === 'IYA' || (h.includes('YA') && !h.includes('TIDAK'))

      const hasAsiAnswer = a !== '' && a !== '-' && a !== 'TIDAK DIISI'
      const hasHamilAnswer = h !== '' && h !== '-' && h !== 'TIDAK DIISI'

      // 1. Balita Filtering (Age <= 5 years OR valid ASI survey response)
      if ((ageYears !== null && ageYears <= 5) || (hasAsiAnswer && ageYears === null)) {
        totalBalita++
        if (isAsiPos) asiYa++
        else if (a === 'TIDAK') asiTidak++
        else asiNull++
      }

      // 2. WUS Filtering (Female & Age 15-49 years OR valid Hamil survey response)
      if ((isFemale && ageYears !== null && ageYears >= 15 && ageYears <= 49) || (isFemale && hasHamilAnswer && ageYears === null)) {
        totalWus++
        if (isHamilPos) hamilYa++
        else if (h === 'TIDAK') hamilTidak++
        else hamilNull++
      }
    })

    return {
      asi: { ya: asiYa, tidak: asiTidak, nullCount: asiNull, total: totalBalita },
      hamil: { ya: hamilYa, tidak: hamilTidak, nullCount: hamilNull, total: totalWus }
    }
  }, [filteredIndividuRows])

  // 11. Monitoring Alergi Obat Warga (Donut Chart Alert)
  const allergyMonitoringData = useMemo(() => {
    let ada = 0, tidakAda = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.apakah_mempunyai_alergi_terhadap_obat || '').toUpperCase().trim()
      if (s === 'YA' || s === 'IYA' || s.includes('ADA') || s.includes('ALERGI')) ada++
      else tidakAda++
    })
    return [
      { label: 'Memiliki Alergi Obat', value: ada, color: '#e11d48' },
      { label: 'Tidak Ada Alergi Obat', value: tidakAda, color: '#0d9488' },
    ]
  }, [filteredIndividuRows])

  // 12. Frekuensi & Jenis Kunjungan Faskes (Multi-Tier Frequency Dataset)
  const faskesVisitData = useMemo(() => {
    const facData = {
      puskesmas: { key: 'puskesmas', label: 'Puskesmas / Pustu', totalVisits: 0, totalVisitors: 0, color: '#0d9488', freqs: { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 } },
      rs: { key: 'rs', label: 'Rumah Sakit (RS)', totalVisits: 0, totalVisitors: 0, color: '#0284c7', freqs: { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 } },
      bidan: { key: 'bidan', label: 'Praktik Bidan / Posyandu', totalVisits: 0, totalVisitors: 0, color: '#ec4899', freqs: { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 } },
      dokter: { key: 'dokter', label: 'Praktik Dokter / Klinik', totalVisits: 0, totalVisitors: 0, color: '#6366f1', freqs: { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 } },
      apotik: { key: 'apotik', label: 'Apotik / Toko Obat', totalVisits: 0, totalVisitors: 0, color: '#f59e0b', freqs: { '1': 0, '2': 0, '3': 0, '4-5': 0, '6+': 0 } },
    }

    filteredIndividuRows.forEach((r) => {
      const str = String(r.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir || r.berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak || '')
      if (!str || str === '-' || str.includes('null')) return

      const parts = str.split(',')
      parts.forEach((p) => {
        const idx = p.indexOf(':')
        if (idx !== -1) {
          const key = p.substring(0, idx).trim().toLowerCase()
          const val = parseInt(p.substring(idx + 1).trim(), 10) || 0

          if (val > 0) {
            let targetFac = null
            if (key.includes('puskesmas')) targetFac = facData.puskesmas
            else if (key.includes('rumah sakit')) targetFac = facData.rs
            else if (key.includes('bidan')) targetFac = facData.bidan
            else if (key.includes('dokter') || key.includes('poliklinik')) targetFac = facData.dokter
            else if (key.includes('apotik')) targetFac = facData.apotik

            if (targetFac) {
              targetFac.totalVisits += val
              targetFac.totalVisitors += 1
              const freqKey = val >= 6 ? '6+' : (val >= 4 ? '4-5' : String(val))
              targetFac.freqs[freqKey] = (targetFac.freqs[freqKey] || 0) + 1
            }
          }
        }
      })
    })

    return facData
  }, [filteredIndividuRows])

  // TAB 4 DATA (13 Visualizations - Balanced Power BI Distribution)
  // 1. Pendidikan Terakhir (Clustered Column Chart)
  const eduData = useMemo(() => {
    let sd = 0, smp = 0, sma = 0, pt = 0, noSchool = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.pendidikan_terakhir || '').toUpperCase().trim()
      if (s.includes('S1') || s.includes('S2') || s.includes('DIPLOMA') || s.includes('PERGURUAN') || s.includes('SARJANA')) pt++
      else if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA') || s.includes('ALIYAH')) sma++
      else if (s.includes('SMP') || s.includes('MTS') || s.includes('SLTP')) smp++
      else if (s.includes('SD') || s.includes('MI')) sd++
      else noSchool++
    })
    return [
      { label: 'SD / Sederajat', value: sd, color: '#0d9488' },
      { label: 'SMA / SMK', value: sma, color: '#0284c7' },
      { label: 'Belum Sekolah', value: noSchool, color: '#94a3b8' },
      { label: 'SMP / MTs', value: smp, color: '#6366f1' },
      { label: 'Perguruan Tinggi', value: pt, color: '#f59e0b' },
    ]
  }, [filteredIndividuRows])

  // 2. Pendidikan VS Akses Internet (100% Stacked Column Chart)
  const eduInternetStackedData = useMemo(() => {
    let sdAktif = 0, sdTidak = 0
    let smpAktif = 0, smpTidak = 0
    let smaAktif = 0, smaTidak = 0
    let ptAktif = 0, ptTidak = 0

    filteredIndividuRows.forEach((r) => {
      const s = String(r.pendidikan_terakhir || '').toUpperCase().trim()
      const isAktif = String(r.apakah_aktif_menggunakan_internet_sebulan_terakhir || '').toUpperCase().trim() === 'YA'
      if (s.includes('S1') || s.includes('S2') || s.includes('DIPLOMA') || s.includes('PERGURUAN') || s.includes('SARJANA')) {
        if (isAktif) ptAktif++; else ptTidak++
      } else if (s.includes('SMA') || s.includes('SMK') || s.includes('SLTA') || s.includes('ALIYAH')) {
        if (isAktif) smaAktif++; else smaTidak++
      } else if (s.includes('SMP') || s.includes('MTS') || s.includes('SLTP')) {
        if (isAktif) smpAktif++; else smpTidak++
      } else if (s.includes('SD') || s.includes('MI')) {
        if (isAktif) sdAktif++; else sdTidak++
      }
    })

    return [
      { groupLabel: 'SD / Sdrj', series1: sdAktif, series2: sdTidak },
      { groupLabel: 'SMP / Sdrj', series1: smpAktif, series2: smpTidak },
      { groupLabel: 'SMA / SMK', series1: smaAktif, series2: smaTidak },
      { groupLabel: 'PT (S1/S2)', series1: ptAktif, series2: ptTidak },
    ]
  }, [filteredIndividuRows])

  // 3. Media Akses Internet (Pie Chart Klasik - 100% Populasi Penduduk Nagari)
  const internetMediaData = useMemo(() => {
    let hp = 0, wifi = 0, hpWifi = 0, noInternet = 0
    filteredIndividuRows.forEach((r) => {
      const isAktif = String(r.apakah_aktif_menggunakan_internet_sebulan_terakhir || '').toUpperCase().trim() === 'YA'
      const s = String(r.jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui || '').toUpperCase().trim()

      if (!isAktif || s === '' || s === '-' || s === 'TIDAK' || s === 'TIDAK ADA' || s === 'TIDAK MENGGUNAKAN') {
        noInternet++
      } else if (s.includes('WIFI') && s.includes('HANDPHONE')) {
        hpWifi++
      } else if (s.includes('WIFI')) {
        wifi++
      } else if (s.includes('HANDPHONE') || s.includes('HP')) {
        hp++
      } else {
        noInternet++
      }
    })
    return [
      { label: 'Smartphone (HP)', value: hp, color: '#0d9488' },
      { label: 'Tidak Menggunakan Internet', value: noInternet, color: '#94a3b8' },
      { label: 'Wi-Fi Rumah', value: wifi, color: '#0284c7' },
      { label: 'Kombinasi HP & Wi-Fi', value: hpWifi, color: '#8b5cf6' },
    ]
  }, [filteredIndividuRows])

  // 4. Kecepatan Sinyal Internet (Radial Speedometer Gauge)
  const internetSpeedGauge = useMemo(() => {
    let cepat = 0, sedang = 0, lambat = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.kecepatan_akses_internet || '').toUpperCase().trim()
      if (s.includes('CEPAT')) cepat++
      else if (s.includes('SEDANG')) sedang++
      else if (s.includes('LAMBAT')) lambat++
    })
    const total = cepat + sedang + lambat || 1
    return {
      cepat,
      sedang,
      lambat,
      total,
      pctCepat: Math.round((cepat / total) * 100),
      subMetrics: [
        { label: 'Sinyal Cepat (4G/5G)', value: cepat, pct: Math.round((cepat / total) * 100), color: '#10b981' },
        { label: 'Sinyal Sedang (3G/4G)', value: sedang, pct: Math.round((sedang / total) * 100), color: '#0284c7' },
        { label: 'Sinyal Lambat / Lemah', value: lambat, pct: Math.round((lambat / total) * 100), color: '#f59e0b' },
      ]
    }
  }, [filteredIndividuRows])

  // 5. Konstruksi Dinding Rumah (100% Stacked Segmented Bar)
  const wallRoofData = useMemo(() => {
    let semen = 0, kayu = 0, triplek = 0, lainDinding = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.jenis_dinding_sebagian_besar_rumah || '').toUpperCase().trim()
      if (s.includes('SEMEN') || s.includes('BATA') || s.includes('BATAKO') || s.includes('PERMANEN')) semen++
      else if (s.includes('KAYU') || s.includes('PAPAN')) kayu++
      else if (s.includes('TRIPLEK') || s.includes('ANYAMAN') || s.includes('BAMBU')) triplek++
      else if (s && s !== '-') lainDinding++
      else semen++
    })
    return [
      { label: 'Tembok Semen Permanen', value: semen, color: '#0d9488' },
      { label: 'Kayu / Papan', value: kayu, color: '#0284c7' },
      { label: 'Triplek / Semi Permanen', value: triplek, color: '#f59e0b' },
      { label: 'Lainnya / Non Permanen', value: lainDinding, color: '#94a3b8' },
    ]
  }, [filteredFamilyRows])

  // 6. Kapasitas Daya Listrik PLN (Waterfall Chart)
  const lightingPowerData = useMemo(() => {
    let va450 = 0, va900 = 0, va1300Plus = 0, numpangPln = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.besar_daya_listrik_pln || '').toUpperCase().trim()
      if (s.includes('450') || s.includes('200') || s.includes('230') || s.includes('300') || s.includes('400')) va450++
      else if (s.includes('900') || s.includes('950')) va900++
      else if (s.includes('1300') || s.includes('2200') || s.includes('3500')) va1300Plus++
      else numpangPln++
    })
    return [
      { label: '900 VA (Standar)', value: va900, color: '#0284c7' },
      { label: '450 VA (Subsidi)', value: va450, color: '#0d9488' },
      { label: '1300 VA+ (Komersial)', value: va1300Plus, color: '#8b5cf6' },
      { label: 'Menumpang / Belum Meteran', value: numpangPln, color: '#94a3b8' },
    ]
  }, [filteredFamilyRows])


  // 8. Profil Risiko Bencana Alam (Diagram Luasan Garis Spline / Area Chart)
  const disasterAreaData = useMemo(() => {
    let lereng = 0, sutet = 0, gempa = 0, longsor = 0, putingBeliung = 0
    filteredFamilyRows.forEach((r) => {
      if (String(r.rumah_di_lereng_bukit_gunung || '').toUpperCase().trim() === 'YA') lereng++
      if (String(r.rumah_berada_di_bawah_sutet_sutt_suttas || '').toUpperCase().trim() === 'YA') sutet++
      const b = String(r.data_kejadian_bencana || '').toUpperCase().trim()
      if (b.includes('GEMPA')) gempa++
      if (b.includes('LONGSOR')) longsor++
      if (b.includes('PUTING') || b.includes('BADAI')) putingBeliung++
    })
    return [
      { label: 'Lereng Bukit', value: lereng, color: '#ef4444' },
      { label: 'Riwayat Gempa', value: gempa, color: '#f97316' },
      { label: 'Bawah SUTET', value: sutet, color: '#eab308' },
      { label: 'Tanah Longsor', value: longsor, color: '#dc2626' },
      { label: 'Puting Beliung', value: putingBeliung, color: '#6366f1' },
    ]
  }, [filteredFamilyRows])

  // 9. Kepuasan Layanan Publik Nagari & Aksesibilitas (Executive Scorecard & 4 Badges)
  const villageServiceEvalData = useMemo(() => {
    let baik = 0, cukup = 0, buruk = 0, tidakLayanan = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.jika_iya_bagaimana_pelayanannya || '').toUpperCase().trim()
      if (s.includes('BAIK') || s.includes('RAMAH') || s.includes('BAGUS')) baik++
      else if (s.includes('CUKUP')) cukup++
      else if (s.includes('BURUK') || s.includes('LAMA') || s.includes('KURANG')) buruk++
      else tidakLayanan++
    })
    return [
      { label: 'Pelayanan Baik & Ramah', value: baik, color: '#10b981' },
      { label: 'Pelayanan Cukup', value: cukup, color: '#0284c7' },
      { label: 'Perlu Peningkatan / Kurang', value: buruk, color: '#ef4444' },
      { label: 'Tidak Mengakses Layanan Desa', value: tidakLayanan, color: '#64748b', isNonAccess: true },
    ]
  }, [filteredIndividuRows])

  // 10. Partisipasi Musrenbang (Pie Chart Klasik 2 Sektor)
  const citizenInputPieData = useMemo(() => {
    let usulanYa = 0, usulanTidak = 0
    filteredIndividuRows.forEach((r) => {
      const s = String(r.dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran || '').toUpperCase().trim()
      if (s === 'YA' || s === 'PERNAH') usulanYa++
      else usulanTidak++
    })
    return [
      { label: 'Pernah Menyampaikan Usulan', value: usulanYa, color: '#0d9488' },
      { label: 'Belum Memberikan Usulan', value: usulanTidak, color: '#cbd5e1' },
    ]
  }, [filteredIndividuRows])

  // 11. Mitigasi & Alur Dampak Bencana (Diagram Garis Tren / Spline Line Chart)
  const disasterLineData = useMemo(() => {
    let terpapar = 0, terdampak = 0, pendampingan = 0
    filteredIndividuRows.forEach((r) => {
      if (String(r.dalam_setahun_terakhir_apakah_terjadi_bencana || '').toUpperCase().trim() === 'YA') terpapar++
      if (String(r.apakah_anda_terkena_dampak_bencana || '').toUpperCase().trim() === 'YA') terdampak++
      if (String(r.apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana || '').toUpperCase().trim() === 'YA') pendampingan++
    })
    return [
      { label: '1. Terpapar Bencana', value: terpapar, color: '#64748b' },
      { label: '2. Terdampak Fisik/Jiwa', value: terdampak, color: '#f59e0b' },
      { label: '3. Tertangani Psikososial', value: pendampingan, color: '#0d9488' },
    ]
  }, [filteredIndividuRows])

  // 12. Kerawanan Akses Jalan Terputus (Pie Chart Klasik)
  const roadCutPieData = useMemo(() => {
    let putus = 0, aman = 0
    filteredFamilyRows.forEach((r) => {
      const s = String(r.apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana || '').toUpperCase().trim()
      if (s.includes('PERNAH') || s.includes('YA') || (s !== '-' && s !== 'TIDAK' && s !== '0' && s !== 'TUDAK ADA' && s !== 'TIDAK ADA' && s !== '' && !isNaN(parseInt(s, 10)) && parseInt(s, 10) > 0 && !s.includes('BIDANG'))) {
        putus++
      } else {
        aman++
      }
    })
    return [
      { label: 'Akses Jalan Aman', value: aman, color: '#10b981' },
      { label: 'Rentan Terisolasi Longsor', value: putus, color: '#ef4444' },
    ]
  }, [filteredFamilyRows])

  // 13. Bantuan Bedah Rumah RTLH (Segmentasi Faktual Presisi Bebas Overlap)
  const rtlhRenovationData = useMemo(() => {
    let lulusDibedah = 0       // Tidak Kumuh & Iya (23 KK)
    let prosesDibedah = 0      // Kumuh & Iya (6 KK)
    let rtlhBelumDibedah = 0   // Kumuh & Tidak (51 KK)
    let tidakMenerima = 0      // Tidak Kumuh & Tidak (514 KK)

    filteredFamilyRows.forEach((r) => {
      const isMenerima = String(r.bantuan_rehap_rumah_tidak_layak_huni || '').toUpperCase().trim() === 'IYA' || String(r.bantuan_rehap_rumah_tidak_layak_huni || '').toUpperCase().trim() === 'YA'
      const isKumuh = String(r.secara_keseluruhan_kondisi_rumah || '').toUpperCase().trim() === 'KUMUH'

      if (isMenerima && !isKumuh) {
        lulusDibedah++
      } else if (isMenerima && isKumuh) {
        prosesDibedah++
      } else if (!isMenerima && isKumuh) {
        rtlhBelumDibedah++
      } else {
        tidakMenerima++
      }
    })

    return [
      { label: 'Berhasil Dibedah (Kini Layak)', value: lulusDibedah, color: '#10b981' },
      { label: 'Proses Dibedah (Masih RTLH)', value: prosesDibedah, color: '#f59e0b' },
      { label: 'RTLH Rentan (Belum Dibedah)', value: rtlhBelumDibedah, color: '#e11d48', isUrgent: true },
      { label: 'Tidak Menerima Bantuan', value: tidakMenerima, color: '#64748b' },
    ]
  }, [filteredFamilyRows])

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
        {/* Topbar Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/sikato-logo.png" alt="SIKATO Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(13,148,136,0.25))' }} />
              <div>
                <p className="eyebrow">SIKATO — SISTEM INFORMASI KEPENDUDUKAN & TOPOGRAFI</p>
                <h1>Dashboard Executive BI & Analytics Nagari Tabek Patah</h1>
              </div>
            </div>
          </div>

          <div className="toolbar status-toolbar" style={{ gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Filter Jorong:</span>
            <select
              className="filter-select-input"
              value={selectedJorong}
              onChange={(e) => setSelectedJorong(e.target.value)}
              style={{ height: '36px', padding: '0 12px', fontSize: '0.84rem', borderRadius: '6px', border: '1.5px solid #cbd5e1' }}
            >
              <option value="all">Semua Jorong Nagari</option>
              <option value="koto">Jorong Koto</option>
              <option value="koto_alam">Jorong Koto Alam</option>
              <option value="data">Jorong Data</option>
              <option value="tabek_patah">Jorong Tabek Patah</option>
            </select>
          </div>
        </header>

        {/* Executive KPI Summary Cards */}
        <section className="kpi-grid" style={{ marginBottom: '1rem' }}>
          <KpiCard label="Total KK Sensus" value={kpiStats.totalKK.toLocaleString('id-ID')} meta="Keluarga Terdaftar" icon="keluarga" />
          <KpiCard label="Total Penduduk" value={kpiStats.totalJiwa.toLocaleString('id-ID')} meta="Jiwa Individu" icon="user" />
          <KpiCard label="Rumah Layak Huni" value={`${Math.round(((kpiStats.totalKK - kpiStats.totalRtlh) / (kpiStats.totalKK || 1)) * 100)}%`} meta={`${kpiStats.totalRtlh} Rumah RTLH`} metaClass="is-up" icon="rumah" />
          <KpiCard label="Cakupan BPJS/KIS" value={`${Math.round((kpiStats.totalBpjs / (kpiStats.totalJiwa || 1)) * 100)}%`} meta={`${kpiStats.totalBpjs} Tercover`} metaClass="is-up" icon="blt_kesra" />
          <KpiCard label="Penerima Bansos" value={kpiStats.totalBansos.toLocaleString('id-ID')} meta={`${Math.round((kpiStats.totalBansos / (kpiStats.totalKK || 1)) * 100)}% KK Bansos`} metaClass="is-up" icon="pkh" />
          <KpiCard label="Penduduk Bekerja" value={kpiStats.totalPekerja.toLocaleString('id-ID')} meta="Pekerja Aktif" icon="ekonomi" />
        </section>

        {/* Executive View Tab Navigation */}
        <nav className="panel" style={{ padding: '6px 10px', marginBottom: '1rem', display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {[
            { id: 'ringkasan', label: '1. Kependudukan & Demografi', icon: 'home' },
            { id: 'bansos', label: '2. Kesejahteraan Sosial & Ekonomi', icon: 'pkh' },
            { id: 'sanitasi', label: '3. Kesehatan, Sanitasi & Lingkungan', icon: 'sanitasi' },
            { id: 'pendidikan', label: '4. Pendidikan & Literasi Digital', icon: 'pendidikan' },
            { id: 'pemukiman', label: '5. Pemukiman, Tata Kelola & Bencana', icon: 'rumah' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                className={isActive ? 'primary-button btn-sm' : 'secondary-button btn-sm'}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#475569',
                  background: isActive ? 'linear-gradient(135deg, #0d9488, #0f766e)' : '#ffffff',
                  border: isActive ? '1px solid #0d9488' : '1px solid #cbd5e1',
                  boxShadow: isActive ? '0 2px 8px rgba(13, 148, 136, 0.25)' : 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon name={tab.icon} size={14} color={isActive ? '#ffffff' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* TAB 1: KEPENDUDUKAN & DEMOGRAFI (7 Visualisasi Murni) */}
        {activeTab === 'ringkasan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Grafik 1 (Jenis Kelamin Donut) & Grafik 2 (Piramida Usia Butterfly) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgDonutChart
                data={genderData}
                title="1. Proporsi Jenis Kelamin Penduduk"
                subtitle="Keseimbangan Komposisi Gender Laki-laki & Perempuan Nagari"
                icon="user"
                onExpand={() => setExpandedChart({ title: 'Proporsi Jenis Kelamin', subtitle: 'Keseimbangan Komposisi Gender Laki-laki & Perempuan Nagari', data: genderData, type: 'donut', fieldKey: 'jenis_kelamin', isIndividu: true })}
              />
              <SvgPopulationPyramid
                data={agePyramidData}
                title="2. Piramida Kelompok Usia Penduduk"
                subtitle="Struktur Demografi Generasi & Kelompok Usia Warga"
                icon="users"
                onExpand={() => setExpandedChart({ title: 'Piramida Kelompok Usia', subtitle: 'Struktur Demografi Generasi & Kelompok Usia Warga', data: agePyramidData, type: 'pyramid', fieldKey: 'usia', isIndividu: true })}
              />
            </div>

            {/* Row 2: Grafik 3 (Status Pernikahan Stacked) & Grafik 4 (Pekerjaan Utama Ranked) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgHorizontalStackedBar
                data={maritalData}
                title="3. Status Perkawinan & Pernikahan"
                subtitle="Komposisi Status Perkawinan & Legitimasi Pernikahan Warga"
                icon="heart"
                onExpand={() => setExpandedChart({ title: 'Status Pernikahan', subtitle: 'Komposisi Status Perkawinan & Legitimasi Pernikahan Warga', data: maritalData, type: 'stacked_bar', fieldKey: 'status_pernikahan', isIndividu: true })}
              />
              <SvgBarChart
                data={pekerjaanData}
                title="4. Sektor Pekerjaan Utama Warga"
                subtitle="Sebaran Sektor Mata Pencaharian & Profesi Utama Penduduk"
                icon="briefcase"
                onExpand={() => setExpandedChart({ title: 'Pekerjaan Utama Warga', subtitle: 'Sebaran Sektor Mata Pencaharian & Profesi Utama Penduduk', data: pekerjaanData, type: 'bar', fieldKey: 'pekerjaan_utama', isIndividu: true })}
              />
            </div>

            {/* Row 3: Grafik 5 (Kondisi Status Bekerja 3D Pillar Column) & Grafik 6 (Update KK/KTP Speedometer Gauge) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgPillarColumnChart
                data={workConditionData}
                title="5. Kondisi Status Bekerja Warga"
                subtitle="Tingkat Partisipasi Kerja & Angkatan Kerja Penduduk"
                icon="ekonomi"
                onExpand={() => setExpandedChart({ title: 'Kondisi Status Bekerja Warga', subtitle: 'Tingkat Partisipasi Kerja & Angkatan Kerja Penduduk', data: workConditionData, type: 'pillar', fieldKey: 'kondisi_pekerjaan', isIndividu: true })}
              />
              <SvgRadialGauge
                value={ktpUpdateData.find(d => d.label.includes('Sudah'))?.value || 0}
                max={filteredIndividuRows.length || 1}
                label="Sudah Update KK/KTP"
                isMultiSegment={true}
                subMetrics={ktpUpdateData.map(d => ({ ...d, pct: filteredIndividuRows.length > 0 ? Math.round((d.value / filteredIndividuRows.length) * 100) : 0 }))}
                title="6. Kepatuhan Update KK/KTP"
                subtitle="Tingkat Kepatuhan Administrasi Identitas Kependudukan Dukcapil"
                icon="id_card"
                onExpand={() => setExpandedChart({ title: 'Kepatuhan Update KK/KTP', subtitle: 'Tingkat Kepatuhan Administrasi Identitas Kependudukan Dukcapil', data: ktpUpdateData, type: 'radial', fieldKey: 'apakah_sudah_melakukan_update_kk_ktp', isIndividu: true })}
              />
            </div>

            {/* Row 4: Grafik 7 (Suku Bangsa Treemap) & Grafik 8 (Ukuran KK Histogram + KPI) */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgBarChart
                data={sukuData}
                title="7. Keragaman Suku Bangsa Nagari"
                subtitle="Sebaran Etnis & Keberagaman Suku Bangsa Penduduk Nagari"
                icon="map"
                onExpand={() => setExpandedChart({ title: 'Keragaman Suku Bangsa', subtitle: 'Sebaran Etnis & Keberagaman Suku Bangsa Penduduk Nagari', data: sukuData, type: 'bar', fieldKey: 'suku_bangsa', isIndividu: true })}
              />
              <SvgHistogramWithKpi
                data={familySizeHistogramData}
                avgMember={avgMemberPerKk}
                title="8. Ukuran Anggota Keluarga (KK)"
                subtitle="Rata-rata & Kepadatan Jumlah Anggota Keluarga Per KK"
                icon="keluarga"
                onExpand={() => setExpandedChart({ title: 'Ukuran Anggota Keluarga', subtitle: 'Rata-rata & Kepadatan Jumlah Anggota Keluarga Per KK', data: familySizeHistogramData, type: 'histogram', fieldKey: 'jumlah_anggota_dalam_keluarga', isIndividu: false })}
              />
            </div>

          </div>
        )}

        {/* TAB 2: KESEJAHTERAAN SOSIAL & EKONOMI (11 Visualisasi Beragam & Presisi) */}
        {activeTab === 'bansos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Distribusi Bansos (1.2fr) + Matriks Akurasi Bansos (1.8fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgKpiStackedProgressBar
                data={bansosDistributionData}
                title="1. Distribusi Penerima Bansos Nagari"
                subtitle="Realisasi & Jangkauan Program Bantuan Sosial Nagari"
                icon="blt_nagari"
                bannerHeader="REALISASI BANTUAN SOSIAL NAGARI"
                bannerMainText={`${kpiStats.totalBansos} KK Penerima Bansos`}
                bannerSubText={`(${Math.round((kpiStats.totalBansos / (kpiStats.totalKK || 1)) * 100)}% KK Nagari)`}
                onExpand={() => setExpandedChart({ title: 'Distribusi Bansos Nagari', subtitle: 'Realisasi & Jangkauan Program Bantuan Sosial Nagari', data: bansosDistributionData, type: 'rtlh_kpi', fieldKey: 'program_keluarga_harapan_pkh', isIndividu: false, icon: 'blt_nagari' })}
              />
              <SvgGroupedBarChart
                data={bansosGroupedData}
                categories={[{ key: 'bansos', label: 'Penerima Bansos', color: '#0d9488' }, { key: 'nonBansos', label: 'Mandiri / Non-Bansos', color: '#94a3b8' }]}
                title="2. Matriks Akurasi Target Bansos"
                subtitle="Ketepatan Sasaran Bansos Menurut Kelompok Pengeluaran KK"
                icon="pkh"
                onExpand={() => setExpandedChart({ title: 'Matriks Akurasi Bansos', subtitle: 'Ketepatan Sasaran Bansos Menurut Kelompok Pengeluaran KK', data: bansosGroupedData, type: 'grouped', fieldKey: 'bantuan_sosial_tunai', isIndividu: false })}
              />
            </div>

            {/* Row 2: Pengeluaran Rutin (1.5fr) + Kepemilikan Aset Utama (1.5fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgPillarColumnChart
                data={expenceData}
                title="3. Pengeluaran Rutin Bulanan Keluarga"
                subtitle="Profil Kemampuan & Rentang Pengeluaran Bulanan Keluarga"
                icon="ekonomi"
                onExpand={() => setExpandedChart({ title: 'Pengeluaran Rutin Keluarga', subtitle: 'Profil Kemampuan & Rentang Pengeluaran Bulanan Keluarga', data: expenceData, type: 'pillar', fieldKey: 'berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah', isIndividu: false })}
              />
              <SvgHorizontalStackedBar
                data={householdAssetsData}
                title="4. Kepemilikan Aset Utama Rumah Tangga"
                subtitle="Kepemilikan Perangkat Elektronik, Kendaraan & Aset Berharga"
                icon="rumah"
                onExpand={() => setExpandedChart({ title: 'Kepemilikan Aset Utama Rumah Tangga', subtitle: 'Kepemilikan Perangkat Elektronik, Kendaraan & Aset Berharga', data: householdAssetsData, type: 'stacked_bar', fieldKey: 'kepemilikin_aset', isIndividu: false })}
              />
            </div>

            {/* Row 3: QRIS Gauge (1fr) + Omset Waterfall (1.2fr) + Lokasi Usaha Ranked (1.5fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgRadialGauge
                value={umkmStats.tahuQris}
                max={umkmStats.totalUmkm}
                title="5. Penetrasi Keuangan Digital QRIS"
                subtitle="Kesiapan Transaksi Nontunai & Pembayaran Digital UMKM"
                label="Literasi QRIS"
                color="#0d9488"
                isMultiSegment={true}
                subMetrics={umkmStats.detailData}
                onExpand={() => setExpandedChart({ title: 'Penetrasi Keuangan Digital QRIS', subtitle: `Kesiapan Transaksi Nontunai & Pembayaran Digital UMKM`, data: umkmStats.detailData, type: 'radial', fieldKey: 'apakah_sudah_mengetahui_metode_pembayaran_qris', isIndividu: false })}
              />
              <SvgWaterfallChart
                data={omsetData}
                title="6. Omset & Pendapatan Bulanan UMKM"
                subtitle="Skala Omset & Estimasi Pendapatan Usaha Pelaku UMKM"
                icon="ekonomi"
                onExpand={() => setExpandedChart({ title: 'Omset & Pendapatan Bulanan UMKM', subtitle: 'Skala Omset & Estimasi Pendapatan Usaha Pelaku UMKM', data: omsetData, type: 'waterfall', fieldKey: 'perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan', isIndividu: false })}
              />
              <SvgBarChart
                data={umkmLocationData}
                title="7. Lokasi Tempat Usaha Pelaku UMKM"
                subtitle="Distribusi Sebaran Tempat & Sentra Kegiatan Usaha Warga"
                icon="kawasan_nagari"
                onExpand={() => setExpandedChart({ title: 'Lokasi Tempat Usaha UMKM', subtitle: 'Distribusi Sebaran Tempat & Sentra Kegiatan Usaha Warga', data: umkmLocationData, type: 'bar', fieldKey: 'lokasi_usaha', isIndividu: false })}
              />
            </div>

            {/* Row 4: Rasio Peternak Waffle (1fr) + Komoditas Ternak Ranked (1.5fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgWaffleChart
                activeCount={livestockRatioData.find(d => d.label.includes('Memelihara'))?.value || 0}
                totalCount={filteredFamilyRows.length || 1}
                activeLabel="Keluarga Peternak"
                inactiveLabel="Non-Peternak"
                unit="KK"
                title="8. Rasio Kepemilikan Hewan Ternak"
                subtitle="Proporsi Keluarga Peternak & Pembudidaya Ternak Nagari"
                icon="keluarga"
                onExpand={() => setExpandedChart({ title: 'Rasio Kepemilikan Ternak', subtitle: 'Proporsi Keluarga Peternak & Pembudidaya Ternak Nagari', data: livestockRatioData, type: 'waffle', fieldKey: 'apakah_memelihara_ternak', isIndividu: false })}
              />
              <SvgBarChart
                data={livestockTypeData}
                title="9. Komoditas Hewan Ternak Warga"
                subtitle="Jenis Komoditas Hewan Ternak Budidaya Rumah Tangga"
                icon="keluarga"
                onExpand={() => setExpandedChart({ title: 'Komoditas Hewan Ternak', subtitle: 'Jenis Komoditas Hewan Ternak Budidaya Rumah Tangga', data: livestockTypeData, type: 'bar', fieldKey: 'apakah_memelihara_ternak', isIndividu: false })}
              />
            </div>

            {/* Row 5: BPJS Ketenagakerjaan Scorecard (1.2fr) + Bantuan Pendidikan Pie (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgExecutiveScorecard
                data={bpjsKetenagakerjaanData}
                title="10. Jaminan Sosial Ketenagakerjaan (BPJS TK)"
                subtitle="Perlindungan Jaminan Sosial Ketenagakerjaan Pekerja"
                icon="shield_check"
                onExpand={() => setExpandedChart({ title: 'BPJS Ketenagakerjaan', subtitle: 'Perlindungan Jaminan Sosial Ketenagakerjaan Pekerja', data: bpjsKetenagakerjaanData, type: 'scorecard', fieldKey: 'jaminan_sosial_ketenagakerjaan', isIndividu: true })}
              />
              <SvgPieChart
                data={bantuanPendidikanData}
                title="11. Bantuan Pendidikan Anak (PIP / Beasiswa)"
                subtitle="Dukungan Beasiswa & Bantuan Pendidikan Anak Sekolah"
                icon="pendidikan"
                onExpand={() => setExpandedChart({ title: 'Bantuan Pendidikan Anak', subtitle: 'Dukungan Beasiswa & Bantuan Pendidikan Anak Sekolah', data: bantuanPendidikanData, type: 'pie', fieldKey: 'bantuan_pendidikan_anak', isIndividu: false })}
              />
            </div>

          </div>
        )}

        {/* TAB 3: KESEHATAN, SANITASI & LINGKUNGAN (12 Visualisasi Beragam & Presisi) */}
        {activeTab === 'sanitasi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Fasilitas MCK ODF Alert (1fr) + Jenis Kloset Waterfall (1fr) + Tangki Septik Donut (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgKpiStackedProgressBar
                data={mckData}
                title="1. Status Sanitasi & Fasilitas MCK"
                subtitle="Tingkat Sanitasi & Akses Jamban Sehat Keluarga (ODF)"
                icon="sanitasi"
                onExpand={() => setExpandedChart({ title: 'Status Sanitasi & Fasilitas MCK', subtitle: 'Tingkat Sanitasi & Akses Jamban Sehat Keluarga (ODF)', data: mckData, type: 'rtlh_kpi', fieldKey: 'fasilitas_mck', isIndividu: false, icon: 'sanitasi' })}
              />
              <SvgWaterfallChart
                data={klosetData}
                title="2. Tipe Kloset Sanitasi"
                subtitle="Jenis Kloset & Standar Higienitas Tempat Buang Air"
                icon="sanitasi"
                onExpand={() => setExpandedChart({ title: 'Tipe Kloset Sanitasi', subtitle: 'Jenis Kloset & Standar Higienitas Tempat Buang Air', data: klosetData, type: 'waterfall', fieldKey: 'jenis_kloset', isIndividu: false })}
              />
              <SvgDonutChart
                data={septicTankData}
                title="3. Pembuangan Limbah Septic Tank"
                subtitle="Sistem Penampungan & Pengolahan Air Limbah Rumah Tangga"
                icon="sanitasi"
                onExpand={() => setExpandedChart({ title: 'Pembuangan Limbah Septic Tank', subtitle: 'Sistem Penampungan & Pengolahan Air Limbah Rumah Tangga', data: septicTankData, type: 'donut', fieldKey: 'tempat_pembuangan_air_limbah_septic_tank', isIndividu: false })}
              />
            </div>

            {/* Row 2: Sumber Air Minum Ranked (1fr) + Sumber Air Mandi & Cuci Pie (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgBarChart
                data={waterData}
                title="4. Sumber Utama Konsumsi Air Minum"
                subtitle="Sumber Pasokan Utama Air Bersih Kelayakan Konsumsi"
                icon="air_bersih"
                onExpand={() => setExpandedChart({ title: 'Sumber Utama Konsumsi Air Minum', subtitle: 'Sumber Pasokan Utama Air Bersih Kelayakan Konsumsi', data: waterData, type: 'bar', fieldKey: 'sumber_air_minum_terbanyak_dari', isIndividu: false })}
              />
              <SvgPieChart
                data={bathWaterData}
                title="5. Sumber Air Bersih Mandi & Cuci"
                subtitle="Sumber Pasokan Air Bersih Kebersihan & Cuci Harian"
                icon="air_bersih"
                onExpand={() => setExpandedChart({ title: 'Sumber Air Mandi & Cuci', subtitle: 'Sumber Pasokan Air Bersih Kebersihan & Cuci Harian', data: bathWaterData, type: 'pie', fieldKey: 'sumber_air_mandi_terbanyak_dari', isIndividu: false })}
              />
            </div>

            {/* Row 3: Kondisi Drainase Spline Area (1fr) + Pengelolaan Sampah Stacked Bar (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgAreaChart
                data={drainageData}
                title="6. Infrastruktur Drainase Sekitar Pemukiman"
                subtitle="Kondisi Saluran Pembuangan Air Hujan Lingkungan"
                icon="sanitasi"
                onExpand={() => setExpandedChart({ title: 'Infrastruktur Drainase Sekitar Pemukiman', subtitle: 'Kondisi Saluran Pembuangan Air Hujan Lingkungan', data: drainageData, type: 'area', fieldKey: 'kondisi_drainase_disekitar_rumah', isIndividu: false })}
              />
              <SvgHorizontalStackedBar
                data={wasteManagementData}
                title="7. Pola Pengelolaan Sampah Rumah Tangga"
                subtitle="Metode Penanganan & Pengolahan Sampah Pemukiman"
                icon="sanitasi"
                onExpand={() => setExpandedChart({ title: 'Pengelolaan Sampah', subtitle: 'Metode Penanganan & Pengolahan Sampah Pemukiman', data: wasteManagementData, type: 'horizontal_stacked', fieldKey: 'tempat_pembuangan_sampah', isIndividu: false })}
              />
            </div>

            {/* Row 4: BPJS Kesehatan Individu Scorecard (1fr) + Total BPJS KK Waffle (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgExecutiveScorecard
                data={bpjsData}
                title="8. Jaminan BPJS Kesehatan Individu"
                subtitle="Status Perlindungan Jaminan Kesehatan Penduduk"
                icon="shield_check"
                onExpand={() => setExpandedChart({ title: 'Status Jaminan BPJS/KIS Individu', subtitle: 'Status Perlindungan Jaminan Kesehatan Penduduk', data: bpjsData, type: 'scorecard', fieldKey: 'jika_punya', isIndividu: true })}
              />
              <SvgWaffleChart
                activeCount={totalBpjsCoverageData.tercover}
                totalCount={totalBpjsCoverageData.total}
                activeLabel="Keluarga Tercover BPJS"
                inactiveLabel="Belum Tercover BPJS"
                unit="KK"
                title="9. Total Cakupan BPJS Kesehatan Keluarga (KK)"
                subtitle="Tingkat Ketercoveran Kartu BPJS Kesehatan Keluarga"
                icon="shield_check"
                onExpand={() => setExpandedChart({ title: 'Total Cakupan BPJS KK', subtitle: 'Tingkat Ketercoveran Kartu BPJS Kesehatan Keluarga', data: [{ label: 'Tercover BPJS KK', value: totalBpjsCoverageData.tercover }, { label: 'Belum Tercover', value: totalBpjsCoverageData.belumTercover }], type: 'waffle', fieldKey: 'bpjs_kis', isIndividu: false })}
              />
            </div>

            {/* Row 5: ASI & Ibu Hamil (1fr) + Alergi Obat Donut (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgMaternalChildHealthCard
                asiData={asiIbuHamilData.asi}
                hamilData={asiIbuHamilData.hamil}
                title="10. Kesehatan Ibu Hamil & ASI Eksklusif"
                subtitle="Cakupan Nutrisi Bayi & Pemantauan Kesehatan Ibu Hamil"
                icon="ibu_hamil"
                onExpand={() => setExpandedChart({
                  title: 'Kesehatan Ibu Hamil & ASI Eksklusif',
                  subtitle: 'Cakupan Nutrisi Bayi & Pemantauan Kesehatan Ibu Hamil',
                  data: [
                    { label: 'Pemberian ASI Eksklusif (Mendapatkan)', value: asiIbuHamilData.asi.ya },
                    { label: 'Tidak Mendapatkan ASI Eksklusif', value: asiIbuHamilData.asi.tidak },
                    { label: 'Ibu Sedang Mengandung (YA)', value: asiIbuHamilData.hamil.ya }
                  ],
                  asiData: asiIbuHamilData.asi,
                  hamilData: asiIbuHamilData.hamil,
                  type: 'maternal_card',
                  fieldKey: 'apakah_bayi_bapak_ibu_mendapatkan_asi_eksklusif',
                  isIndividu: true
                })}
              />
              <SvgDonutChart
                data={allergyMonitoringData}
                title="11. Monitoring Riwayat Alergi Obat Warga"
                subtitle="Riwayat Alergi Obat & Kewaspadaan Kesehatan Warga"
                icon="alert"
                onExpand={() => setExpandedChart({ title: 'Monitoring Alergi Obat', subtitle: 'Riwayat Alergi Obat & Kewaspadaan Kesehatan Warga', data: allergyMonitoringData, type: 'donut', fieldKey: 'apakah_mempunyai_alergi_terhadap_obat', isIndividu: true })}
              />
            </div>

            {/* Row 6: Kunjungan Faskes Multi-Tier Frequency (Full Width 1fr) */}
            <div style={{ width: '100%' }} className="dashboard-grid-row">
              <SvgFaskesFrequencyChart
                data={faskesVisitData}
                title="12. Frekuensi & Rincian Kunjungan Berobat Faskes"
                subtitle="Intensitas Berobat & Tingkat Pemanfaatan Fasilitas Kesehatan"
                icon="blt_kesra"
                onExpand={() => setExpandedChart({
                  title: 'Frekuensi & Rincian Kunjungan Berobat Faskes',
                  subtitle: 'Intensitas Berobat & Tingkat Pemanfaatan Fasilitas Kesehatan',
                  data: [
                    { label: 'Puskesmas / Pustu - 1 Kali Setahun (Insidental)', value: faskesVisitData.puskesmas.freqs['1'] },
                    { label: 'Puskesmas / Pustu - 2 Kali Setahun (Seasonal)', value: faskesVisitData.puskesmas.freqs['2'] },
                    { label: 'Puskesmas / Pustu - 3 Kali Setahun (Kondisional)', value: faskesVisitData.puskesmas.freqs['3'] },
                    { label: 'Puskesmas / Pustu - 4 - 5 Kali Setahun (Intensif)', value: faskesVisitData.puskesmas.freqs['4-5'] },
                    { label: 'Puskesmas / Pustu - 6+ Kali Setahun (Rutin Bulanan)', value: faskesVisitData.puskesmas.freqs['6+'] }
                  ],
                  rawFaskesData: faskesVisitData,
                  type: 'faskes_frequency',
                  fieldKey: 'berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terak',
                  isIndividu: true
                })}
              />
            </div>

          </div>
        )}

        {/* TAB 4: PENDIDIKAN & LITERASI DIGITAL (4 Visualisasi Murni & Ramping) */}
        {activeTab === 'pendidikan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Tingkat Pendidikan (Kolom Vertikal 1fr) + Pendidikan vs Internet (100% Stacked Column 1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgPillarColumnChart
                data={eduData}
                title="1. Tingkat Pendidikan Terakhir"
                subtitle="Capaian Jenjang Pendidikan Terakhir Penduduk"
                icon="pendidikan"
                onExpand={() => setExpandedChart({ title: 'Tingkat Pendidikan Terakhir', subtitle: 'Capaian Jenjang Pendidikan Terakhir Penduduk', data: eduData, type: 'pillar', fieldKey: 'pendidikan_terakhir', isIndividu: true })}
              />
              <Svg100StackedColumnChart
                groups={eduInternetStackedData}
                series={[
                  { key: 'series1', label: 'Aktif Internet (Ya)', color: '#0d9488' },
                  { key: 'series2', label: 'Belum Aktif (Tidak)', color: '#cbd5e1' },
                ]}
                title="2. Proporsi Pendidikan VS Akses Internet"
                subtitle="Korelasi Jenjang Pendidikan Terhadap Literasi Internet"
                icon="globe"
                onExpand={() => setExpandedChart({
                  title: 'Proporsi Pendidikan VS Akses Internet',
                  subtitle: 'Korelasi Jenjang Pendidikan Terhadap Literasi Internet',
                  data: eduInternetStackedData,
                  type: 'stacked_column',
                  fieldKey: 'pendidikan_terakhir',
                  isIndividu: true,
                  series: [
                    { key: 'series1', label: 'Aktif Internet (Ya)', color: '#0d9488' },
                    { key: 'series2', label: 'Belum Aktif (Tidak)', color: '#cbd5e1' },
                  ]
                })}
              />
            </div>

            {/* Row 2: Media Akses Internet (Pie Chart 1fr) + Kecepatan Sinyal (Speedometer Gauge 1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgPieChart
                data={internetMediaData}
                title="3. Media Akses Internet Warga"
                subtitle="Perangkat & Sarana Utama Akses Internet Warga"
                icon="wifi"
                onExpand={() => setExpandedChart({ title: 'Media Akses Internet Warga', subtitle: 'Perangkat & Sarana Utama Akses Internet Warga', data: internetMediaData, type: 'pie', fieldKey: 'jika_jawabannya_ya_akses_internet_yang_diperoleh_melalui', isIndividu: true })}
              />
              <SvgRadialGauge
                value={internetSpeedGauge.cepat}
                max={internetSpeedGauge.total}
                title="4. Kecepatan Sinyal & Kualitas Jaringan"
                subtitle="Kualitas Koneksi & Ketersediaan Sinyal Telekomunikasi"
                icon="signal"
                label="Sinyal Memadai"
                isMultiSegment={true}
                subMetrics={internetSpeedGauge.subMetrics}
                onExpand={() => setExpandedChart({ title: 'Kecepatan Sinyal Internet', subtitle: 'Kualitas Koneksi & Ketersediaan Sinyal Telekomunikasi', data: internetSpeedGauge.subMetrics, type: 'radial', fieldKey: 'kecepatan_akses_internet', isIndividu: true })}
              />
            </div>

          </div>
        )}

        {/* TAB 5: PEMUKIMAN, TATA KELOLA & BENCANA (11 Visualisasi Murni) */}
        {activeTab === 'pemukiman' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Row 1: Kelayakan Rumah RTLH (1.2fr) + Bantuan Bedah RTLH (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgKpiStackedProgressBar
                data={donutConditionData}
                title="1. Status Kelayakan Rumah (RTLH)"
                subtitle="Evaluasi Standar Kelayakan Fisik Tempat Tinggal Warga"
                icon="rumah"
                onExpand={() => setExpandedChart({ title: 'Kelayakan Rumah (RTLH)', subtitle: 'Evaluasi Standar Kelayakan Fisik Tempat Tinggal Warga', data: donutConditionData, type: 'rtlh_kpi', fieldKey: 'secara_keseluruhan_kondisi_rumah', isIndividu: false, icon: 'rumah' })}
              />
              <SvgBulletChart
                data={rtlhRenovationData}
                title="2. Bantuan Bedah Rumah RTLH"
                subtitle="Realisasi Bantuan Stimulan Perbaikan Rumah Warga"
                icon="rumah"
                onExpand={() => setExpandedChart({ title: 'Bantuan Bedah Rumah RTLH', subtitle: 'Realisasi Bantuan Stimulan Perbaikan Rumah Warga', data: rtlhRenovationData, type: 'bullet', fieldKey: 'bantuan_rehap_rumah_tidak_layak_huni', isIndividu: false })}
              />
            </div>

            {/* Row 2: Konstruksi Dinding Rumah (1.2fr) + Daya Listrik PLN (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgHorizontalStackedBar
                data={wallRoofData}
                title="3. Konstruksi Material Dinding Rumah"
                subtitle="Jenis Material Konstruksi Dinding Tempat Tinggal"
                icon="rumah"
                onExpand={() => setExpandedChart({ title: 'Konstruksi Dinding Rumah', subtitle: 'Jenis Material Konstruksi Dinding Tempat Tinggal', data: wallRoofData, type: 'horizontal_stacked', fieldKey: 'jenis_dinding_sebagian_besar_rumah', isIndividu: false })}
              />
              <SvgWaterfallChart
                data={lightingPowerData}
                title="4. Kapasitas Daya Listrik PLN"
                subtitle="Kapasitas Kebutuhan & Daya Listrik Rumah Tangga"
                icon="listrik"
                onExpand={() => setExpandedChart({ title: 'Kapasitas Daya Listrik PLN', subtitle: 'Kapasitas Kebutuhan & Daya Listrik Rumah Tangga', data: lightingPowerData, type: 'waterfall', fieldKey: 'besar_daya_listrik_pln', isIndividu: false })}
              />
            </div>

            {/* Row 3: Legalitas Tanah (1fr) + Penguasaan Bangunan (1.5fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgDonutChart
                data={landLegalityData}
                title="5. Status Legalitas Dokumen Lahan"
                subtitle="Legalitas & Kepemilikan Sertifikat Resmi Tanah"
                icon="file_text"
                onExpand={() => setExpandedChart({ title: 'Legalitas Dokumen Lahan', subtitle: 'Legalitas & Kepemilikan Sertifikat Resmi Tanah', data: landLegalityData, type: 'donut', fieldKey: 'apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi', isIndividu: false })}
              />
              <SvgBarChart
                data={housingTenureData}
                title="6. Status Penguasaan Bangunan Tempat Tinggal"
                subtitle="Status Hak Kepemilikan & Penguasaan Bangunan Rumah"
                icon="rumah"
                onExpand={() => setExpandedChart({ title: 'Penguasaan Bangunan Tempat Tinggal', subtitle: 'Status Hak Kepemilikan & Penguasaan Bangunan Rumah', data: housingTenureData, type: 'bar', fieldKey: 'status_tanah_bangunan_tempat_tinggal_yang_ditempati', isIndividu: false })}
              />
            </div>

            {/* Row 4: Profil Risiko Bencana (1.2fr) + Kerawanan Akses Jalan (1fr) + Alur Mitigasi (1.2fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgAreaChart
                data={disasterAreaData}
                title="7. Profil Risiko Bencana Alam"
                subtitle="Tingkat Kerawanan & Risiko Bencana Alam Pemukiman"
                icon="alert"
                onExpand={() => setExpandedChart({ title: 'Profil Risiko Bencana Alam', subtitle: 'Tingkat Kerawanan & Risiko Bencana Alam Pemukiman', data: disasterAreaData, type: 'area', fieldKey: 'rumah_di_lereng_bukit_gunung', isIndividu: false })}
              />
              <SvgPieChart
                data={roadCutPieData}
                title="8. Kerawanan Akses Jalan Terputus"
                subtitle="Potensi Isolasi Wilayah & Kerawanan Jalan Terputus"
                icon="alert"
                onExpand={() => setExpandedChart({ title: 'Kerawanan Akses Jalan Terputus', subtitle: 'Potensi Isolasi Wilayah & Kerawanan Jalan Terputus', data: roadCutPieData, type: 'pie', fieldKey: 'apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana', isIndividu: false })}
              />
              <SvgLineChart
                data={disasterLineData}
                title="9. Alur Mitigasi & Dampak Bencana"
                subtitle="Tahapan Penanganan & Mitigasi Dampak Bencana Warga"
                icon="chart"
                onExpand={() => setExpandedChart({ title: 'Mitigasi Dampak Kejadian Bencana', subtitle: 'Tahapan Penanganan & Mitigasi Dampak Bencana Warga', data: disasterLineData, type: 'line', fieldKey: 'apakah_ada_penangganan_psikososial_keluarga_terdampak_bencana', isIndividu: true })}
              />
            </div>

            {/* Row 5: Evaluasi Pelayanan Nagari (1.2fr) + Partisipasi Musrenbang (1fr) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="dashboard-grid-row">
              <SvgExecutiveScorecard
                data={villageServiceEvalData}
                title="10. Indeks Kepuasan Layanan Publik Nagari"
                subtitle="Tingkat Kepuasan Warga Terhadap Pelayanan Publik Nagari"
                icon="user"
                onExpand={() => setExpandedChart({ title: 'Indeks Kepuasan Layanan Publik Nagari', subtitle: 'Tingkat Kepuasan Warga Terhadap Pelayanan Publik Nagari', data: villageServiceEvalData, type: 'scorecard', fieldKey: 'jika_iya_bagaimana_pelayanannya', isIndividu: true })}
              />
              <SvgPieChart
                data={citizenInputPieData}
                title="11. Partisipasi Forum Musrenbang"
                subtitle="Keaktifan Warga Dalam Menyampaikan Aspirasi Pembangunan"
                icon="users"
                onExpand={() => setExpandedChart({ title: 'Partisipasi Forum Musrenbang', subtitle: 'Keaktifan Warga Dalam Menyampaikan Aspirasi Pembangunan', data: citizenInputPieData, type: 'pie', fieldKey: 'dalam_setahun_terakhir_apakah_pernah_menyampaikan_masukan_saran', isIndividu: true })}
              />
            </div>

          </div>
        )}

        {/* INTERACTIVE EXPANDED CHART POPUP MODAL */}
        {expandedChart && (
          <ExpandedChartModal
            chartConfig={expandedChart}
            onClose={() => setExpandedChart(null)}
            familyRows={filteredFamilyRows}
            individuRows={filteredIndividuRows}
            onViewDetailFamily={onViewDetailFamily}
            onViewDetailIndividu={onViewDetailIndividu}
          />
        )}
      </main>
    </div>
  )
}

export default HomeDashboardPage
