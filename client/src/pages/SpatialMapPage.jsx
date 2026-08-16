import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Circle, GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import Icon from '../components/Icon'
import Sidebar from '../components/Sidebar'
import { fetchSpatialLayer, fetchSpatialLayers } from '../services/api'
import { getStaticSpatialLayer } from '../services/staticLayers'
import { getCompleteness } from '../utils/completeness'
import { classifyCoordinateStatus, parseCoords } from '../utils/coordParser'
import { matchesJorongFilter } from '../utils/jorongParser'
import { getGoogleDriveFallbackUrl, getGoogleDriveThumbnailUrl } from '../utils/imageHelper'

const layerPalette = [
  { line: '#0f766e', fill: '#14b8a6' },
  { line: '#2563eb', fill: '#60a5fa' },
  { line: '#c2410c', fill: '#fb923c' },
  { line: '#7c3aed', fill: '#a78bfa' },
  { line: '#b7791f', fill: '#fbbf24' },
  { line: '#be123c', fill: '#fb7185' },
]

// Category SVG Icons for Leaflet Pin Markers (Matching Website Design System)
function getCategorySvgIcon(categoryKey) {
  switch (categoryKey) {
    case 'health':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ffffff" fill-opacity="0.25"></path><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path><line x1="12" y1="7.5" x2="12" y2="13.5" stroke-width="2.2"></line><line x1="9" y1="10.5" x2="15" y2="10.5" stroke-width="2.2"></line></svg>`
    case 'school':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>`
    case 'worship':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.5 5.5 0 0 1-7.54-7.54C12.92 3.04 12.46 3 12 3z"></path></svg>`
    case 'tourism':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`
    case 'gov':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M3 7v14M21 7v14M6 11h12M6 15h12M12 3L3 7h18l-9-4z"></path></svg>`
    case 'shop':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`
    case 'evac':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    case 'water':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>`
    case 'home':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`
    default:
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="3" fill="#ffffff"></circle></svg>`
  }
}

function getFeatureDisplayName(props = {}, tableFallback = 'Titik Spasial') {
  const safeFallback = typeof tableFallback === 'string' && tableFallback
    ? tableFallback.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Titik Spasial'

  if (!props || typeof props !== 'object') return safeFallback

  const raw =
    props.nama ||
    props.name ||
    props.kettikum ||
    props.fasilitas ||
    props.keterangan ||
    props.label ||
    props.nama_obyek ||
    props.remark

  if (raw && typeof raw === 'string' && raw.trim()) {
    return raw.trim()
  }
  return safeFallback
}

function getLayerCategoryStyle(layerName = '', featureProps = {}) {
  const nameStr = String(layerName || '').toLowerCase()
  const propStr = JSON.stringify(featureProps || {}).toLowerCase()
  const combined = nameStr + ' ' + propStr

  // 1. Kesehatan (fasilitas_kesehatan, posyandu, puskesmas, klinik, bidan)
  if (combined.includes('kesehatan') || combined.includes('puskesmas') || combined.includes('posyandu') || combined.includes('klinik') || combined.includes('bidan')) {
    return { categoryKey: 'health', color: '#e11d48', label: 'Kesehatan', iconName: 'posyandu' }
  }

  // 2. Tempat Ibadah (ibadah, masjid, musholla, surau)
  if (combined.includes('ibadah') || combined.includes('masjid') || combined.includes('musholla') || combined.includes('surau')) {
    return { categoryKey: 'worship', color: '#059669', label: 'Tempat Ibadah', iconName: 'ibadah' }
  }

  // 3. Pariwisata (pariwisata, wisata, rekreasi, objek_wisata)
  if (combined.includes('wisata') || combined.includes('pariwisata') || combined.includes('rekreasi') || combined.includes('taman')) {
    return { categoryKey: 'tourism', color: '#ec4899', label: 'Pariwisata', iconName: 'kompas' }
  }

  // 4. Pasar / Perdagangan / UMKM (pasar, pasar_tabek_patah, umkm, toko, dagang)
  if (combined.includes('pasar') || combined.includes('umkm') || combined.includes('toko') || combined.includes('dagang') || combined.includes('warung')) {
    return { categoryKey: 'shop', color: '#f59e0b', label: 'Pasar & Perdagangan', iconName: 'bapanas' }
  }

  // 5. Pendidikan (pendidikan, pendidikan_tp, sekolah, sd, smp, sma)
  if (combined.includes('pendidikan') || combined.includes('sekolah') || combined.includes('sd') || combined.includes('smp') || combined.includes('sma') || combined.includes('paud') || combined.includes('tk')) {
    return { categoryKey: 'school', color: '#6366f1', label: 'Pendidikan', iconName: 'pendidikan' }
  }

  // 6. Perkantoran / Pemerintahan (perkantoran, kantor, pemerintah, nagari)
  if (combined.includes('kantor') || combined.includes('perkantoran') || combined.includes('pemerintah') || combined.includes('nagari') || combined.includes('fasilitas')) {
    return { categoryKey: 'gov', color: '#0284c7', label: 'Perkantoran', iconName: 'id_card' }
  }

  // 7. Titik Kumpul / Evakuasi / Bencana (titik_kumpul, evakuasi, bencana, mitigasi)
  if (combined.includes('kumpul') || combined.includes('titik_kumpul') || combined.includes('evakuasi') || combined.includes('bencana') || combined.includes('mitigasi')) {
    return { categoryKey: 'evac', color: '#ea580c', label: 'Titik Kumpul Evakuasi', iconName: 'bencana' }
  }

  // 8. Air Bersih / Sanitasi
  if (combined.includes('air') || combined.includes('sanitasi') || combined.includes('mck') || combined.includes('pamsimas')) {
    return { categoryKey: 'water', color: '#0891b2', label: 'Air & Sanitasi', iconName: 'sanitasi' }
  }

  // 9. Rumah Warga
  if (combined.includes('rumah') || combined.includes('warga') || combined.includes('penduduk') || combined.includes('kk')) {
    return { categoryKey: 'home', color: '#0d9488', label: 'Rumah Warga', iconName: 'home' }
  }

  return { categoryKey: 'point', color: '#8b5cf6', label: 'Titik Spasial', iconName: 'kawasan_nagari' }
}

function isLayerPointType(layer = {}, layerDataEntry) {
  // 1. Check feature geometry type if GeoJSON data is loaded
  const features = layerDataEntry?.data?.features || []
  if (features.length > 0) {
    const geomType = String(features[0]?.geometry?.type || '').toLowerCase()
    if (geomType.includes('point')) return true
    if (geomType.includes('polygon') || geomType.includes('line')) return false
  }

  // 2. Comprehensive keyword matching for point spatial layers
  const combined = (String(layer.name || '') + ' ' + String(layer.table || '')).toLowerCase()

  const pointKeywords = [
    'titik', 'point', 'fasilitas', 'sekolah', 'pendidikan', 'sd', 'smp', 'sma', 'paud', 'tk',
    'masjid', 'musholla', 'ibadah', 'surau', 'puskesmas', 'posyandu', 'kesehatan', 'klinik', 'bidan',
    'umkm', 'pasar', 'toko', 'dagang', 'warung', 'air', 'sanitasi', 'mck', 'pamsimas',
    'wisata', 'pariwisata', 'kantor', 'perkantoran', 'pemerintah', 'kumpul', 'evakuasi', 'mitigasi'
  ]

  return pointKeywords.some(kw => combined.includes(kw))
}

function isLayerLineType(layer = {}, layerDataEntry) {
  const features = layerDataEntry?.data?.features || []
  if (features.length > 0) {
    const geomType = String(features[0]?.geometry?.type || '').toLowerCase()
    if (geomType.includes('line') || geomType.includes('string')) return true
    if (geomType.includes('polygon') || geomType.includes('point')) return false
  }

  const combined = (String(layer.name || '') + ' ' + String(layer.table || '')).toLowerCase()
  return (
    combined.includes('jalan') ||
    combined.includes('gang') ||
    combined.includes('sungai') ||
    combined.includes('garis') ||
    combined.includes('rute') ||
    combined.includes('road') ||
    combined.includes('line')
  )
}

// Helper to generate distinct GeoJSON feature styling for Line vs Polygon features
function getGeoJsonFeatureStyle(feature, entryName, index) {
  const geomType = String(feature?.geometry?.type || '').toLowerCase()
  const isLine = geomType.includes('line') || geomType.includes('string')
  const combinedStr = (String(entryName || '') + ' ' + JSON.stringify(feature?.properties || '')).toLowerCase()
  const catStyle = getLayerCategoryStyle(entryName, feature?.properties || {})

  // 1. STYLING FOR JALAN / ROADS / LINESTRING FEATURES (Thick, rounded, bold strokes)
  if (isLine || combinedStr.includes('jalan') || combinedStr.includes('sungai') || combinedStr.includes('garis') || combinedStr.includes('rute')) {
    let strokeColor = '#ea580c' // Vibrant Amber Orange for roads
    let strokeWidth = 4.5
    let dashArray = null

    if (combinedStr.includes('utama') || combinedStr.includes('provinsi') || combinedStr.includes('aspal')) {
      strokeColor = '#e11d48' // Crimson Red for Main Roads
      strokeWidth = 5.5
    } else if (combinedStr.includes('sungai') || combinedStr.includes('air') || combinedStr.includes('drainase')) {
      strokeColor = '#0284c7' // Cyan Blue for Waterways
      strokeWidth = 4
      dashArray = '8, 4'
    } else if (combinedStr.includes('setapak') || combinedStr.includes('tanah') || combinedStr.includes('gang')) {
      strokeColor = '#d97706' // Brown/Amber for unpaved paths
      strokeWidth = 3.5
      dashArray = '6, 5'
    } else {
      const roadColors = ['#ea580c', '#ec4899', '#2563eb', '#059669', '#7c3aed', '#0891b2']
      strokeColor = roadColors[index % roadColors.length]
    }

    return {
      color: strokeColor,
      weight: strokeWidth,
      opacity: 0.95,
      dashArray: dashArray,
      lineCap: 'round',
      lineJoin: 'round',
    }
  }

  // 1.5 SPECIAL STYLING FOR KAWASAN RAWAN BENCHANA / LONGSOR
  if (combinedStr.includes('longsor') || combinedStr.includes('bencana') || combinedStr.includes('rawan')) {
    return {
      color: '#dc2626',
      weight: 2.5,
      opacity: 0.9,
      fillColor: '#ef4444',
      fillOpacity: 0.28,
      dashArray: '5, 5',
    }
  }

  // 2. STYLING FOR AREA / POLYGON FEATURES (Smooth glassmorphic semi-transparent color fills)
  const areaPalette = [
    { line: '#0f766e', fill: '#14b8a6' }, // Teal (Jorong)
    { line: '#1d4ed8', fill: '#3b82f6' }, // Royal Blue (Kecamatan)
    { line: '#be123c', fill: '#fb7185' }, // Crimson Rose (Longsor / Bencana)
    { line: '#b45309', fill: '#fbbf24' }, // Amber Gold (Batas Nagari)
    { line: '#6d28d9', fill: '#a78bfa' }, // Purple (Tanah Datar)
    { line: '#047857', fill: '#10b981' }, // Emerald Green
  ]

  const stylePair = areaPalette[index % areaPalette.length]
  const strokeColor = catStyle.color || stylePair.line
  const fillColor = stylePair.fill

  return {
    color: strokeColor,
    weight: 2,
    opacity: 0.85,
    fillColor: fillColor,
    fillOpacity: 0.2, // Smooth, low opacity so overlapping polygons are glass-like & transparent
    dashArray: index % 2 === 1 ? '6, 4' : null,
  }
}

// Custom Leaflet Micro-Dot Marker Generator for Resident Households
function createHouseMarkerIcon(isComplete, statusFilter = 'all') {
  let bgGradient = 'linear-gradient(135deg, #64748b 0%, #475569 100%)' // Soft Light Slate Navy / Dongker Lebih Muda
  let dotRgb = '100, 116, 139'

  if (statusFilter === 'complete') {
    bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)' // Green for 'Lengkap'
    dotRgb = '16, 185, 129'
  } else if (statusFilter === 'incomplete') {
    bgGradient = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' // Yellow/Amber for 'Belum Lengkap'
    dotRgb = '245, 158, 11'
  }

  const houseSvg = getCategorySvgIcon('home')

  return L.divIcon({
    className: 'modern-resident-dot-container',
    html: `
      <div class="modern-gis-dot-wrapper">
        <div class="modern-gis-dot-body" style="background: ${bgGradient}; --dot-rgb: ${dotRgb};">
          <div class="modern-gis-dot-icon">
            ${houseSvg}
          </div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    tooltipAnchor: [0, -16],
  })
}

// Custom Category Micro-Dot Marker Generator for PostGIS Vector Points
function createCustomCategoryPin(categoryKey, overrideColor) {
  const iconSvg = getCategorySvgIcon(categoryKey)
  const baseColor = overrideColor || '#8b5cf6'

  const colorMap = {
    '#e11d48': { bg: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)', rgb: '244, 63, 94' },
    '#059669': { bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', rgb: '16, 185, 129' },
    '#ec4899': { bg: 'linear-gradient(135deg, #f472b6 0%, #be185d 100%)', rgb: '244, 114, 182' },
    '#f59e0b': { bg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)', rgb: '251, 191, 36' },
    '#6366f1': { bg: 'linear-gradient(135deg, #818cf8 0%, #4338ca 100%)', rgb: '129, 140, 248' },
    '#0284c7': { bg: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)', rgb: '56, 189, 248' },
    '#ea580c': { bg: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)', rgb: '251, 146, 60' },
    '#0891b2': { bg: 'linear-gradient(135deg, #22d3ee 0%, #0e7490 100%)', rgb: '34, 211, 238' },
    '#0d9488': { bg: 'linear-gradient(135deg, #2dd4bf 0%, #0f766e 100%)', rgb: '45, 212, 191' },
  }

  const matched = colorMap[baseColor.toLowerCase()] || {
    bg: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 100%)`,
    rgb: '139, 92, 246',
  }

  return L.divIcon({
    className: 'modern-gis-dot-container',
    html: `
      <div class="modern-gis-dot-wrapper">
        <div class="modern-gis-dot-body" style="background: ${matched.bg}; --dot-rgb: ${matched.rgb};">
          <div class="modern-gis-dot-icon">
            ${iconSvg}
          </div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    tooltipAnchor: [0, -16],
  })
}

// Hero Destination Evacuation Point Marker Generator with pulsating radar ring & enlarged beacon
function createHeroEvacuationPin() {
  return L.divIcon({
    className: 'evac-hero-beacon-container',
    html: `
      <div class="evac-hero-beacon-wrapper">
        <div class="evac-beacon-pulse-ring-outer"></div>
        <div class="evac-beacon-pulse-ring-inner"></div>
        <div class="evac-hero-beacon-body">
          <div class="evac-hero-beacon-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="evac-hero-beacon-badge">EVAKUASI</div>
        </div>
      </div>
    `,
    iconSize: [54, 54],
    iconAnchor: [27, 27],
    popupAnchor: [0, -28],
    tooltipAnchor: [0, -30],
  })
}

// Highlight Origin Resident House Pin with glowing pulse
function createResidentOriginPin() {
  return L.divIcon({
    className: 'resident-origin-beacon-container',
    html: `
      <div class="res-origin-wrapper">
        <div class="res-origin-pulse-ring"></div>
        <div class="res-origin-body">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    tooltipAnchor: [0, -20],
  })
}

// Custom Glowing Pin for Straight Line Measurement Point 1 (Origin)
function createMeasureOriginPin() {
  return L.divIcon({
    className: 'measure-origin-beacon-container',
    html: `
      <div class="res-origin-wrapper">
        <div class="res-origin-pulse-ring"></div>
        <div class="res-origin-body" style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.6);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8"></path>
            <path d="M8 12h8"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
    tooltipAnchor: [0, -22],
  })
}

// Custom Glowing Pin for Straight Line Measurement Point 2 (Target)
function createMeasureTargetPin() {
  return L.divIcon({
    className: 'measure-target-beacon-container',
    html: `
      <div class="res-origin-wrapper">
        <div class="evac-beacon-pulse-ring-outer" style="border-color: #06b6d4; background: rgba(6, 182, 212, 0.35);"></div>
        <div class="res-origin-body" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.6);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="4"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -21],
    tooltipAnchor: [0, -23],
  })
}

// Custom Glowing Pin for GPS Live User Location
function createGpsUserLocationPin() {
  return L.divIcon({
    className: 'gps-user-beacon-container',
    html: `
      <div class="res-origin-wrapper">
        <div class="evac-beacon-pulse-ring-outer" style="border-color: #3b82f6; background: rgba(59, 130, 246, 0.35);"></div>
        <div class="res-origin-body" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: 2.5px solid #ffffff; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.7);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
    tooltipAnchor: [0, -23],
  })
}

// Universal Centroid Extractor for GeoJSON Features (Point, MultiPoint, Polygon, MultiPolygon)
function getFeatureCentroid(feat) {
  if (!feat || !feat.geometry) return null
  const { type, coordinates } = feat.geometry
  if (!coordinates || !coordinates.length) return null

  if (type === 'Point') {
    const [lng, lat] = coordinates
    const latNum = Number(lat)
    const lngNum = Number(lng)
    return !isNaN(latNum) && !isNaN(lngNum) ? { lat: latNum, lng: lngNum } : null
  }

  if (type === 'MultiPoint') {
    const [lng, lat] = coordinates[0] || []
    const latNum = Number(lat)
    const lngNum = Number(lng)
    return !isNaN(latNum) && !isNaN(lngNum) ? { lat: latNum, lng: lngNum } : null
  }

  if (type === 'Polygon') {
    const ring = coordinates[0] || []
    if (!ring.length) return null
    let sumLat = 0, sumLng = 0, count = 0
    ring.forEach(([lng, lat]) => {
      const latNum = Number(lat)
      const lngNum = Number(lng)
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        sumLat += latNum
        sumLng += lngNum
        count++
      }
    })
    return count > 0 ? { lat: sumLat / count, lng: sumLng / count } : null
  }

  if (type === 'MultiPolygon') {
    const poly = coordinates[0] || []
    const ring = poly[0] || []
    if (!ring.length) return null
    let sumLat = 0, sumLng = 0, count = 0
    ring.forEach(([lng, lat]) => {
      const latNum = Number(lat)
      const lngNum = Number(lng)
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        sumLat += latNum
        sumLng += lngNum
        count++
      }
    })
    return count > 0 ? { lat: sumLat / count, lng: sumLng / count } : null
  }

  return null
}

// Auto-fit bounds component for React Leaflet
function MapBoundsFitter({ points }) {
  const map = useMap()
  const fittedRef = useRef(false)

  useEffect(() => {
    if (!fittedRef.current && points && points.length > 0) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
        fittedRef.current = true
      }
    }
  }, [map, points])

  return null
}

// Auto-zoom map to fit active evacuation route line safely
function MapEvacuationFitter({ route }) {
  const map = useMap()

  useEffect(() => {
    if (route && Array.isArray(route.coords) && route.coords.length > 0) {
      try {
        const validCoords = route.coords.filter(
          (c) => Array.isArray(c) && c.length === 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1]))
        )
        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords.map(([lat, lng]) => [Number(lat), Number(lng)]))
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17, animate: true })
          }
        }
      } catch (err) {
        console.warn('MapEvacuationFitter fitBounds error:', err)
      }
    }
  }, [map, route])

  return null
}

// Leaflet map size invalidator helper
function MapResizer({ isPanelOpen, isSidebarOpen }) {
  const map = useMap()

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 200)
    return () => clearTimeout(timer)
  }, [map, isPanelOpen, isSidebarOpen])

  return null
}

// Interactive Map Click Coordinate Picker Listener for Straight Line Measurement & GPS Nav
function MapMeasureClickListener({ isMeasureMode, isGpsNavOpen, onPickMeasurePoint, onPickGpsPoint, residentPoints = [], layerData = {} }) {
  const map = useMap()

  useEffect(() => {
    if (!isMeasureMode && !isGpsNavOpen) return

    const handleMapClick = (e) => {
      if (!e || !e.latlng) return
      const lat = Number(e.latlng.lat)
      const lng = Number(e.latlng.lng)
      if (isNaN(lat) || isNaN(lng)) return

      // Find nearest named point (house or facility) within 80 meters
      let resolvedName = null
      let minDistance = 80

      // 1. Check resident points
      if (Array.isArray(residentPoints)) {
        residentPoints.forEach((pt) => {
          if (pt && !isNaN(Number(pt.lat)) && !isNaN(Number(pt.lng))) {
            const dist = getDistanceInMeters(lat, lng, pt.lat, pt.lng)
            if (dist < minDistance) {
              minDistance = dist
              const pName = pt.nama_kepala_keluarga || pt.nama_responden || 'Warga'
              resolvedName = `🏠 Rumah ${pName}`
            }
          }
        })
      }

      // 2. Check static spatial fallback for titik_kumpul
      try {
        const staticEvac = getStaticSpatialLayer('titik_kumpul')
        const evacFeatures = staticEvac?.data?.features || []
        evacFeatures.forEach((feat) => {
          const center = getFeatureCentroid(feat)
          if (center) {
            const dist = getDistanceInMeters(lat, lng, center.lat, center.lng)
            if (dist < minDistance) {
              minDistance = dist
              const fName = getFeatureDisplayName(feat.properties, 'Titik Kumpul Evakuasi')
              resolvedName = `📍 ${fName}`
            }
          }
        })
      } catch (errStatic) {}

      // 3. Check loaded layerData features
      if (layerData) {
        Object.entries(layerData).forEach(([tbl, pld]) => {
          const features = pld?.data?.features || []
          features.forEach((feat) => {
            const center = getFeatureCentroid(feat)
            if (center) {
              const dist = getDistanceInMeters(lat, lng, center.lat, center.lng)
              if (dist < minDistance) {
                minDistance = dist
                const fName = getFeatureDisplayName(feat.properties, tbl)
                resolvedName = `📍 ${fName}`
              }
            }
          })
        })
      }

      const pointName = resolvedName || `📍 Titik (${lat.toFixed(4)}, ${lng.toFixed(4)})`

      if (isMeasureModeRef.current) {
        onPickMeasurePoint(lat, lng, pointName)
      } else if (isGpsNavOpenRef.current) {
        onPickGpsPoint(lat, lng, pointName)
      }
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [map, isMeasureMode, isGpsNavOpen, onPickMeasurePoint, onPickGpsPoint, residentPoints, layerData])

  return null
}

function MapPointRouteFitter({ route }) {
  const map = useMap()

  useEffect(() => {
    if (route && route.coords && route.coords.length > 0) {
      try {
        const bounds = L.latLngBounds(route.coords)
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [70, 70], maxZoom: 17, animate: true })
        }
      } catch (err) {
        console.warn('fitBounds error:', err)
      }
    }
  }, [map, route])

  return null
}

async function fetchRoadRoute(fromLat, fromLng, toLat, toLng) {
  const routers = [
    `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`,
  ]

  for (const url of routers) {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
      const timer = controller ? setTimeout(() => controller.abort(), 7000) : null
      const res = await fetch(url, { signal: controller ? controller.signal : undefined })
      if (timer) clearTimeout(timer)
      if (res && res.ok) {
        const data = await res.json()
        const route = data.routes?.[0]
        if (route && route.geometry?.coordinates && route.geometry.coordinates.length >= 2) {
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
          const distanceMeters = Math.round(route.distance || 0)
          const durationSeconds = Math.round(route.duration || 0)
          return {
            coords,
            distanceMeters,
            durationMins: Math.max(1, Math.round(durationSeconds / 60)),
          }
        }
      }
    } catch (e) {
      // Try next fallback router
    }
  }
  return null
}

function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const nLat1 = Number(lat1)
  const nLon1 = Number(lon1)
  const nLat2 = Number(lat2)
  const nLon2 = Number(lon2)
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return 0

  const R = 6371000
  const dLat = (nLat2 - nLat1) * (Math.PI / 180)
  const dLon = (nLon2 - nLon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) * Math.cos(nLat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const safeA = Math.min(1, Math.max(0, a))
  const c = 2 * Math.atan2(Math.sqrt(safeA), Math.sqrt(1 - safeA))
  const dist = Math.round(R * c)
  return isNaN(dist) ? 0 : dist
}

function SpatialMapPage({ rows = [], onViewDetail, onStartEdit, onPageChange, isSidebarOpen, onToggleSidebar, currentUser, onLogout, onOpenSettings, theme }) {
  const [layers, setLayers] = useState([])
  const [activeLayers, setActiveLayers] = useState([])
  const [layerData, setLayerData] = useState({})
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(true)
  const [showResidentPins, setShowResidentPins] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJorong, setSelectedJorong] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [basemap, setBasemap] = useState('osm') // 'osm' | 'satellite' | 'dark'
  const [enableBuffer, setEnableBuffer] = useState(true)
  const [bufferRadius, setBufferRadius] = useState(500) // 300 | 500 | 1000
  const [activeEvacRoute, setActiveEvacRoute] = useState(null)

  // Interactive Straight Line Distance Measurement State
  const [isMeasureMode, setIsMeasureMode] = useState(false)
  const [measurePt1, setMeasurePt1] = useState(null)
  const [measurePt2, setMeasurePt2] = useState(null)
  const lastMeasureClickTimeRef = useRef(0)

  // GPS Geolocation Navigation & Rute State (Bottom-Right Control)
  const [isGpsNavOpen, setIsGpsNavOpen] = useState(false)
  const [gpsOriginMode, setGpsOriginMode] = useState('point1') // 'point1' (Map Clicking) | 'gps'
  const [isFetchingGps, setIsFetchingGps] = useState(false)
  const [gpsUserPos, setGpsUserPos] = useState(null)
  const [gpsNavOrigin, setGpsNavOrigin] = useState(null)
  const [gpsNavTarget, setGpsNavTarget] = useState(null)
  const [gpsErrorMsg, setGpsErrorMsg] = useState('')

  // Invalid Coordinates State & Modal (Top-Right)
  const [isInvalidPanelOpen, setIsInvalidPanelOpen] = useState(false)
  const [invalidFilterTab, setInvalidFilterTab] = useState('all') // 'all' | 'empty' | 'out_bounds'

  const handleRequestGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsErrorMsg('Fitur GPS Geolocation tidak didukung oleh browser ini.')
      return
    }
    setIsFetchingGps(true)
    setGpsErrorMsg('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsFetchingGps(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const userLoc = {
          id: 'user_gps_live',
          name: '📍 Lokasi GPS Saya Saat Ini',
          lat,
          lng,
        }
        setGpsUserPos(userLoc)
        setGpsNavOrigin(userLoc)
      },
      (err) => {
        setIsFetchingGps(false)
        console.warn('GPS Geolocation Error:', err.message)
        setGpsErrorMsg('Gagal mengakses GPS. Mohon izinkan akses lokasi di browser Anda.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const [gpsRoadRouteData, setGpsRoadRouteData] = useState(null)

  useEffect(() => {
    let isMounted = true
    if (gpsNavOrigin && gpsNavTarget && gpsNavOrigin.lat && gpsNavTarget.lat) {
      fetchRoadRoute(gpsNavOrigin.lat, gpsNavOrigin.lng, gpsNavTarget.lat, gpsNavTarget.lng).then((res) => {
        if (isMounted) setGpsRoadRouteData(res)
      })
    } else {
      setGpsRoadRouteData(null)
    }
    return () => {
      isMounted = false
    }
  }, [gpsNavOrigin, gpsNavTarget])

  const activeGpsCalculatedRoute = useMemo(() => {
    if (!gpsNavOrigin || !gpsNavTarget || !gpsNavOrigin.lat || !gpsNavTarget.lat) return null

    const origLat = Number(gpsNavOrigin.lat)
    const origLng = Number(gpsNavOrigin.lng)
    const destLat = Number(gpsNavTarget.lat)
    const destLng = Number(gpsNavTarget.lng)

    if (isNaN(origLat) || isNaN(origLng) || isNaN(destLat) || isNaN(destLng)) return null

    const fallbackDist = getDistanceInMeters(origLat, origLng, destLat, destLng)
    const distMeters = gpsRoadRouteData ? gpsRoadRouteData.distanceMeters : fallbackDist
    const walkMins = Math.max(1, Math.round(distMeters / 75))
    const motorMins = gpsRoadRouteData?.durationMins || Math.max(1, Math.round(distMeters / 350))
    const carMins = gpsRoadRouteData?.durationMins ? Math.max(1, Math.round(gpsRoadRouteData.durationMins * 0.9)) : Math.max(1, Math.round(distMeters / 450))

    const coords = gpsRoadRouteData?.coords || [
      [origLat, origLng],
      [destLat, destLng],
    ]

    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origLat},${origLng}&destination=${destLat},${destLng}&travelmode=driving`

    return {
      origLat,
      origLng,
      destLat,
      destLng,
      fromName: gpsNavOrigin.name || 'Titik Asal',
      toName: gpsNavTarget.name || 'Titik Tujuan',
      distanceMeters: distMeters,
      distanceKm: (distMeters / 1000).toFixed(2),
      walkMins,
      motorMins,
      carMins,
      coords,
      gmapsUrl,
      isRealRoad: !!gpsRoadRouteData,
    }
  }, [gpsNavOrigin, gpsNavTarget, gpsRoadRouteData])

  const isMeasureModeRef = useRef(isMeasureMode)
  const isGpsNavOpenRef = useRef(isGpsNavOpen)
  const gpsOriginModeRef = useRef(gpsOriginMode)

  useEffect(() => {
    isMeasureModeRef.current = isMeasureMode
    isGpsNavOpenRef.current = isGpsNavOpen
    gpsOriginModeRef.current = gpsOriginMode
  }, [isMeasureMode, isGpsNavOpen, gpsOriginMode])

  const handlePickGpsNavPoint = (lat, lng, name) => {
    const now = Date.now()
    if (now - lastMeasureClickTimeRef.current < 350) return
    lastMeasureClickTimeRef.current = now

    const latNum = Number(lat)
    const lngNum = Number(lng)
    if (isNaN(latNum) || isNaN(lngNum)) return

    const pointObj = {
      id: `picked_${Date.now()}`,
      name: name || `📍 Titik (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`,
      lat: latNum,
      lng: lngNum,
    }

    if (gpsOriginModeRef.current === 'point1') {
      setGpsNavOrigin((prevOrig) => {
        if (!prevOrig) {
          return pointObj
        } else {
          setGpsNavTarget(pointObj)
          return prevOrig
        }
      })
    } else {
      setGpsNavTarget(pointObj)
    }
  }

  const handlePickMeasurePoint = (lat, lng, name) => {
    const now = Date.now()
    if (now - lastMeasureClickTimeRef.current < 350) return // Prevent double click picking on single mouse click
    lastMeasureClickTimeRef.current = now

    const latNum = Number(lat)
    const lngNum = Number(lng)
    if (isNaN(latNum) || isNaN(lngNum)) return

    setMeasurePt1((prevPt1) => {
      if (!prevPt1) {
        return { lat: latNum, lng: lngNum, name: name || `📍 Titik (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})` }
      } else {
        setMeasurePt2((prevPt2) => {
          if (!prevPt2) {
            return { lat: latNum, lng: lngNum, name: name || `📍 Titik (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})` }
          }
          return prevPt2
        })
        return prevPt1
      }
    })
  }

  const straightMeasureDistance = useMemo(() => {
    if (!measurePt1 || !measurePt2) return null
    const dist = getDistanceInMeters(measurePt1.lat, measurePt1.lng, measurePt2.lat, measurePt2.lng)
    return {
      meters: dist,
      km: (dist / 1000).toFixed(2),
    }
  }, [measurePt1, measurePt2])

  // Interactive Route Measurement Panel State
  const [isRouteToolOpen, setIsRouteToolOpen] = useState(false)
  const [routeFromPt, setRouteFromPt] = useState(null)
  const [routeToPt, setRouteToPt] = useState(null)

  const requestedLayersRef = useRef(new Set())

  const handleShowEvacuationRouteSafe = async (e, pt) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault()
      if (typeof e.stopPropagation === 'function') e.stopPropagation()
      if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
        e.nativeEvent.stopImmediatePropagation()
      }
    }

    try {
      if (!pt) return
      const residentLat = Number(pt.lat)
      const residentLng = Number(pt.lng)
      if (isNaN(residentLat) || isNaN(residentLng)) return

      let features = layerData['titik_kumpul']?.data?.features
      if (!features || !features.length) {
        try {
          const staticRes = getStaticSpatialLayer('titik_kumpul')
          features = staticRes?.data?.features || []
        } catch (errStatic) {
          console.warn('Gagal memuat static layer titik_kumpul:', errStatic)
        }
      }

      if (!features || !features.length) {
        features = []
        Object.entries(layerData).forEach(([tbl, pld]) => {
          if (tbl.includes('kumpul') || tbl.includes('evakuasi') || tbl.includes('bencana')) {
            const fList = pld?.data?.features || []
            features.push(...fList)
          }
        })
      }

      if (!features || !features.length) return

      let nearestPt = null
      let minDistance = Infinity

      features.forEach((feat) => {
        const center = getFeatureCentroid(feat)
        if (center) {
          const dist = getDistanceInMeters(residentLat, residentLng, center.lat, center.lng)
          if (dist < minDistance) {
            minDistance = dist
            nearestPt = {
              lat: center.lat,
              lng: center.lng,
              name: getFeatureDisplayName(feat.properties, 'Titik Kumpul Evakuasi'),
            }
          }
        }
      })

      if (nearestPt) {
        const resName = pt.nama_kepala_keluarga || pt.nama_responden || 'Warga'
        const initialRoute = {
          residentName: resName,
          residentAddress: pt.alamat_lengkap || 'Nagari Tabek Patah',
          from: [residentLat, residentLng],
          to: [nearestPt.lat, nearestPt.lng],
          evacName: nearestPt.name,
          distance: minDistance,
          distanceKm: (minDistance / 1000).toFixed(2),
          walkMins: Math.max(1, Math.round(minDistance / 75)),
          motorMins: Math.max(1, Math.round(minDistance / 350)),
          coords: [
            [residentLat, residentLng],
            [nearestPt.lat, nearestPt.lng],
          ],
          gmapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${residentLat},${residentLng}&destination=${nearestPt.lat},${nearestPt.lng}&travelmode=driving`,
        }
        setActiveEvacRoute(initialRoute)

        // Fetch actual road network route from OSRM / OpenStreetMap Router
        fetchRoadRoute(residentLat, residentLng, nearestPt.lat, nearestPt.lng).then((roadRes) => {
          if (roadRes && roadRes.coords && roadRes.coords.length >= 2) {
            setActiveEvacRoute((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                coords: roadRes.coords,
                distance: roadRes.distanceMeters,
                distanceKm: (roadRes.distanceMeters / 1000).toFixed(2),
                walkMins: Math.max(1, Math.round(roadRes.distanceMeters / 75)),
                motorMins: roadRes.durationMins || Math.max(1, Math.round(roadRes.distanceMeters / 350)),
                isRealRoad: true,
              }
            })
          }
        })

        // Automatically activate Landslide Hazard Risk layers (longsor & longsortpatah) for critical mitigation context
        setActiveLayers((prev) => {
          const next = new Set(prev)
          next.add('longsor')
          next.add('longsortpatah')
          return Array.from(next)
        })

        const roadRes = await fetchRoadRoute(residentLat, residentLng, nearestPt.lat, nearestPt.lng)
        if (roadRes && roadRes.coords && roadRes.coords.length > 0) {
          setActiveEvacRoute((prev) => ({
            ...(prev || initialRoute),
            distance: roadRes.distanceMeters,
            distanceKm: (roadRes.distanceMeters / 1000).toFixed(2),
            walkMins: Math.max(1, Math.round(roadRes.distanceMeters / 75)),
            motorMins: roadRes.durationMins || Math.max(1, Math.round(roadRes.distanceMeters / 350)),
            coords: roadRes.coords,
            isRealRoad: true,
          }))
        }
      }
    } catch (errGlobal) {
      console.error('handleShowEvacuationRouteSafe error:', errGlobal)
    }
  }

  const handleCloseEvacRoute = () => {
    setActiveEvacRoute(null)
    setActiveLayers((prev) => prev.filter((table) => table !== 'longsor' && table !== 'longsortpatah'))
  }

  // Calculate evacuation buffer circles exclusively for titik_kumpul (Titik Kumpul Evakuasi Bencana)
  const bufferCircles = useMemo(() => {
    const isTitikKumpulActive = activeLayers.includes('titik_kumpul')
    if (!isTitikKumpulActive || !enableBuffer || !bufferRadius || bufferRadius <= 0) return []
    const circles = []

    let features = layerData['titik_kumpul']?.data?.features
    if (!features || !features.length) {
      try {
        const staticRes = getStaticSpatialLayer('titik_kumpul')
        features = staticRes?.data?.features || []
      } catch (errStatic) {}
    }

    if (!features || !features.length) {
      features = []
      Object.entries(layerData).forEach(([tbl, pld]) => {
        if (tbl.includes('kumpul') || tbl.includes('evakuasi') || tbl.includes('bencana')) {
          const fList = pld?.data?.features || []
          features.push(...fList)
        }
      })
    }

    features.forEach((feature, fIdx) => {
      const center = getFeatureCentroid(feature)
      if (center) {
        const name = getFeatureDisplayName(feature.properties, 'Titik Kumpul Evakuasi')
        circles.push({
          key: `titik_kumpul-${fIdx}-${center.lat}-${center.lng}`,
          lat: center.lat,
          lng: center.lng,
          color: '#ea580c',
          name,
          categoryKey: 'evac',
        })
      }
    })

    return circles
  }, [activeLayers, enableBuffer, bufferRadius, layerData])

  // Process rows and classify coordinates (Valid in Tabek Patah vs Invalid / Out-of-Bounds)
  const { validResidentPoints, invalidResidentPoints } = useMemo(() => {
    const valid = []
    const invalid = []

    const safeRows = Array.isArray(rows) ? rows : []
    safeRows.forEach((row) => {
      const clean = (val) => String(val || '').trim().replace(/^-+$/, '')
      const name = clean(row.nama_kepala_keluarga)
      const kk = clean(row.nomor_kk)
      const responden = clean(row.nama_responden)
      const alamat = clean(row.alamat_lengkap)

      // Skip blank ghost rows
      if (!name && !kk && !responden && !alamat) return

      const xVal = row.titik_koordinat_x
      const yVal = row.titik_koordinat_y
      const status = classifyCoordinateStatus(xVal, yVal)
      const comp = getCompleteness(row)

      const itemWithStatus = {
        ...row,
        _invalidStatus: status,
        comp,
      }

      if (status.isValid) {
        itemWithStatus.lat = status.parsedLat
        itemWithStatus.lng = status.parsedLng
        valid.push(itemWithStatus)
      } else {
        invalid.push(itemWithStatus)
      }
    })

    return { validResidentPoints: valid, invalidResidentPoints: invalid }
  }, [rows])

  // Only valid points inside Nagari Tabek Patah are rendered on the map pins!
  const residentPoints = validResidentPoints

  const invalidCounts = useMemo(() => {
    let empty = 0
    let outBounds = 0
    let formatError = 0
    invalidResidentPoints.forEach((pt) => {
      const code = pt._invalidStatus?.code
      if (code === 'EMPTY') empty++
      else if (code === 'OUT_OF_BOUNDS') outBounds++
      else formatError++
    })
    return { empty, outBounds, formatError }
  }, [invalidResidentPoints])

  const displayedInvalidPoints = useMemo(() => {
    if (invalidFilterTab === 'empty') {
      return invalidResidentPoints.filter((pt) => pt._invalidStatus?.code === 'EMPTY')
    }
    if (invalidFilterTab === 'out_bounds') {
      return invalidResidentPoints.filter((pt) => pt._invalidStatus?.code === 'OUT_OF_BOUNDS')
    }
    if (invalidFilterTab === 'format_error') {
      return invalidResidentPoints.filter((pt) => pt._invalidStatus?.code === 'FORMAT_ERROR')
    }
    return invalidResidentPoints
  }, [invalidResidentPoints, invalidFilterTab])

  // Filter resident points by Jorong, completeness filter, & search query
  const filteredResidentPoints = useMemo(() => {
    return residentPoints.filter((pt) => {
      // 1. Jorong Filter
      if (!matchesJorongFilter(pt.alamat_lengkap, selectedJorong)) return false

      // 2. Status Filter
      if (statusFilter === 'complete' && !pt.comp.isComplete) return false
      if (statusFilter === 'incomplete' && pt.comp.isComplete) return false

      // 3. Search Query Filter
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true

      const name = (pt.nama_kepala_keluarga || pt.nama_responden || '').toLowerCase()
      const kk = (pt.nomor_kk || '').toLowerCase()
      const alamat = (pt.alamat_lengkap || '').toLowerCase()

      return name.includes(q) || kk.includes(q) || alamat.includes(q)
    })
  }, [residentPoints, selectedJorong, statusFilter, searchQuery])

  // All selectable locations for route measurement dropdowns
  const selectablePlaces = useMemo(() => {
    const list = []

    // 1. Add Resident points
    residentPoints.forEach((pt, idx) => {
      const name = pt.nama_kepala_keluarga || pt.nama_responden || `Warga #${idx + 1}`
      list.push({
        id: `res-${idx}`,
        name: `🏠 Rumah ${name}`,
        lat: pt.lat,
        lng: pt.lng,
        category: 'Rumah Warga',
      })
    })

    // 2. Add Facilities & Titik Kumpul from loaded static/DB layerData
    Object.entries(layerData).forEach(([table, payload]) => {
      const features = payload?.data?.features || []
      features.forEach((feat, idx) => {
        if (feat.geometry?.type === 'Point') {
          const [lng, lat] = feat.geometry.coordinates || []
          if (lat && lng) {
            const name = getFeatureDisplayName(feat.properties, table)
            list.push({
              id: `${table}-${idx}`,
              name: `📍 ${name}`,
              lat,
              lng,
              category: 'Fasilitas Umum',
            })
          }
        }
      })
    })

    return list
  }, [residentPoints, layerData])

  const [roadRouteData, setRoadRouteData] = useState(null)

  useEffect(() => {
    let isMounted = true
    if (routeFromPt && routeToPt && routeFromPt.lat && routeToPt.lat) {
      fetchRoadRoute(routeFromPt.lat, routeFromPt.lng, routeToPt.lat, routeToPt.lng).then((res) => {
        if (isMounted) setRoadRouteData(res)
      })
    } else {
      setRoadRouteData(null)
    }
    return () => {
      isMounted = false
    }
  }, [routeFromPt, routeToPt])

  // Calculated route result between routeFromPt and routeToPt
  const activeCalculatedRoute = useMemo(() => {
    if (!routeFromPt || !routeToPt || !routeFromPt.lat || !routeToPt.lat) return null

    const fallbackDist = getDistanceInMeters(routeFromPt.lat, routeFromPt.lng, routeToPt.lat, routeToPt.lng)
    const distMeters = roadRouteData ? roadRouteData.distanceMeters : fallbackDist
    const walkMins = Math.max(1, Math.round(distMeters / 75)) // ~4.5 km/h
    const motorMins = roadRouteData ? roadRouteData.durationMins : Math.max(1, Math.round(distMeters / 350)) // ~21 km/h

    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${routeFromPt.lat},${routeFromPt.lng}&destination=${routeToPt.lat},${routeToPt.lng}&travelmode=driving`

    return {
      fromName: routeFromPt.name,
      toName: routeToPt.name,
      coords: roadRouteData ? roadRouteData.coords : [
        [routeFromPt.lat, routeFromPt.lng],
        [routeToPt.lat, routeToPt.lng],
      ],
      distanceMeters: distMeters,
      distanceKm: (distMeters / 1000).toFixed(2),
      walkMins,
      motorMins,
      gmapsUrl,
      isRealRoad: !!roadRouteData,
    }
  }, [routeFromPt, routeToPt, roadRouteData])

  const validEvacPolylineCoords = useMemo(() => {
    if (!activeEvacRoute || !Array.isArray(activeEvacRoute.coords)) return []
    return activeEvacRoute.coords
      .filter((c) => Array.isArray(c) && c.length === 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
      .map(([lat, lng]) => [Number(lat), Number(lng)])
  }, [activeEvacRoute])

  const validEvacFromMarker = useMemo(() => {
    if (!activeEvacRoute || !Array.isArray(activeEvacRoute.from) || activeEvacRoute.from.length < 2) return null
    const lat = Number(activeEvacRoute.from[0])
    const lng = Number(activeEvacRoute.from[1])
    if (isNaN(lat) || isNaN(lng)) return null
    return [lat, lng]
  }, [activeEvacRoute])

  const validEvacToMarker = useMemo(() => {
    if (!activeEvacRoute || !Array.isArray(activeEvacRoute.to) || activeEvacRoute.to.length < 2) return null
    const lat = Number(activeEvacRoute.to[0])
    const lng = Number(activeEvacRoute.to[1])
    if (isNaN(lat) || isNaN(lng)) return null
    return [lat, lng]
  }, [activeEvacRoute])

  const validCalculatedPolylineCoords = useMemo(() => {
    if (!activeCalculatedRoute || !Array.isArray(activeCalculatedRoute.coords)) return []
    return activeCalculatedRoute.coords
      .filter((c) => Array.isArray(c) && c.length === 2 && !isNaN(Number(c[0])) && !isNaN(Number(c[1])))
      .map(([lat, lng]) => [Number(lat), Number(lng)])
  }, [activeCalculatedRoute])

  const validCalculatedFromMarker = useMemo(() => {
    if (!activeCalculatedRoute || !Array.isArray(activeCalculatedRoute.coords) || activeCalculatedRoute.coords.length === 0) return null
    const first = activeCalculatedRoute.coords[0]
    if (!Array.isArray(first) || first.length < 2) return null
    const lat = Number(first[0])
    const lng = Number(first[1])
    if (isNaN(lat) || isNaN(lng)) return null
    return [lat, lng]
  }, [activeCalculatedRoute])

  const validCalculatedToMarker = useMemo(() => {
    if (!activeCalculatedRoute || !Array.isArray(activeCalculatedRoute.coords) || activeCalculatedRoute.coords.length < 2) return null
    const last = activeCalculatedRoute.coords[activeCalculatedRoute.coords.length - 1]
    if (!Array.isArray(last) || last.length < 2) return null
    const lat = Number(last[0])
    const lng = Number(last[1])
    if (isNaN(lat) || isNaN(lng)) return null
    return [lat, lng]
  }, [activeCalculatedRoute])

  useEffect(() => {
    let ignore = false

    fetchSpatialLayers()
      .then((items) => {
        if (ignore) return
        setLayers(items)
        setActiveLayers(items[0]?.table ? [items[0].table] : [])
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [])

  // Pre-load titik_kumpul, longsor, longsortpatah data automatically so evacuation and hazard analysis are always ready
  useEffect(() => {
    ;['titik_kumpul', 'longsor', 'longsortpatah'].forEach((layerKey) => {
      if (!layerData[layerKey] && !requestedLayersRef.current.has(layerKey)) {
        requestedLayersRef.current.add(layerKey)
        fetchSpatialLayer(layerKey)
          .then((payload) => {
            setLayerData((prev) => ({
              ...prev,
              [layerKey]: { data: payload.data, error: null },
            }))
          })
          .catch(() => {
            try {
              const staticRes = getStaticSpatialLayer(layerKey)
              setLayerData((prev) => ({
                ...prev,
                [layerKey]: { data: staticRes.data, error: null },
              }))
            } catch (errStatic) {
              setLayerData((prev) => ({
                ...prev,
                [layerKey]: { data: null, error: errStatic.message },
              }))
            }
          })
      }
    })
  }, [layerData])

  useEffect(() => {
    const missingLayers = activeLayers.filter((layerName) => {
      const current = layerData[layerName]
      return !current?.data && !current?.error && !requestedLayersRef.current.has(layerName)
    })

    if (!missingLayers.length) {
      return
    }

    let ignore = false
    missingLayers.forEach((layerName) => requestedLayersRef.current.add(layerName))

    Promise.all(
      missingLayers.map(async (layerName) => {
        try {
          const result = await fetchSpatialLayer(layerName)
          return { layerName, result, error: null }
        } catch (error) {
          return { layerName, result: null, error }
        }
      }),
    ).then((results) => {
      if (ignore) return

      setLayerData((currentData) => {
        const nextData = { ...currentData }

        results.forEach(({ layerName, result, error }) => {
          requestedLayersRef.current.delete(layerName)
          nextData[layerName] = error
            ? { error: error.message, data: null, layer: null }
            : { error: '', data: result.data, layer: result.layer }
        })

        return nextData
      })
    })

    return () => {
      ignore = true
    }
  }, [activeLayers, layerData])

  const visibleLayerEntries = useMemo(
    () =>
      activeLayers.map((layerName) => ({
        name: layerName,
        ...layerData[layerName],
      })),
    [activeLayers, layerData],
  )

  const loadedLayerEntries = visibleLayerEntries.filter((entry) => entry.data)
  const activeLayerCount = activeLayers.length
  const featureCount = loadedLayerEntries.reduce((total, entry) => total + (entry.data?.features?.length ?? 0), 0)
  const isLoadingLayer = activeLayers.some((layerName) => !layerData[layerName]?.data && !layerData[layerName]?.error)
  const status = buildStatus(activeLayerCount, loadedLayerEntries.length, featureCount, isLoadingLayer)

  const toggleLayer = (layerName) => {
    setActiveLayers((currentLayers) => {
      const willBeActive = !currentLayers.includes(layerName)
      if (layerName === 'titik_kumpul') {
        setEnableBuffer(willBeActive && bufferRadius > 0)
      }
      if (currentLayers.includes(layerName)) {
        return currentLayers.filter((item) => item !== layerName)
      }
      return [...currentLayers, layerName]
    })
  }

  const selectAllLayers = () => {
    setActiveLayers(layers.map((layer) => layer.table))
    setShowResidentPins(true)
    setEnableBuffer(bufferRadius > 0)
  }

  const clearAllLayers = () => {
    setActiveLayers([])
    setShowResidentPins(false)
    setEnableBuffer(false)
  }

  // Category-level & Global bulk toggle helpers
  const isGlobalAllActive = useMemo(() => {
    if (!showResidentPins) return false
    if (!layers || layers.length === 0) return showResidentPins
    return layers.every((l) => activeLayers.includes(l.table))
  }, [layers, activeLayers, showResidentPins])

  const isCategoryAllActive = (categoryLayers, includeResidentPins = false) => {
    if (includeResidentPins && !showResidentPins) return false
    if (!categoryLayers || categoryLayers.length === 0) return showResidentPins
    return categoryLayers.every((layer) => activeLayers.includes(layer.table))
  }

  const toggleCategoryLayers = (categoryLayers, includeResidentPins = false) => {
    const allActive = isCategoryAllActive(categoryLayers, includeResidentPins)
    const categoryTables = categoryLayers.map((l) => l.table)

    if (includeResidentPins) {
      setShowResidentPins(!allActive)
    }

    if (allActive) {
      // Turn OFF all layers in this category
      setActiveLayers((prev) => prev.filter((table) => !categoryTables.includes(table)))
    } else {
      // Turn ON all layers in this category
      setActiveLayers((prev) => Array.from(new Set([...prev, ...categoryTables])))
    }
  }

  const residentStats = useMemo(() => {
    const total = residentPoints.length
    const complete = residentPoints.filter(p => p.comp.isComplete).length
    const incomplete = total - complete
    const pct = total > 0 ? Math.round((complete / total) * 100) : 0
    return { total, complete, incomplete, pct }
  }, [residentPoints])

function getLayerMeta(layer = {}, featureCount = 0) {
  const tableStr = String(layer.table || '').toLowerCase()
  const nameStr = String(layer.name || '').toLowerCase()
  const combined = tableStr + ' ' + nameStr

  let cleanTitle = layer.name && layer.name !== layer.table
    ? layer.name
    : (layer.table || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  let description = 'Layer data spasial geografis nagari'

  // Specific custom title & description overrides requested by user:
  if (combined.includes('jalanpropinsitp') || combined.includes('jalanpropinsi') || combined.includes('jalan_provinsi')) {
    cleanTitle = 'Jalan Provinsi'
    description = 'Jalur jaringan jalan utama provinsi'
  } else if (combined.includes('prtabekpatah')) {
    cleanTitle = 'Pemukiman Warga'
    description = 'Kawasan pemukiman & perumahan penduduk'
  } else if (combined.includes('petatabekpatah5') || combined.includes('peta_tabek_patah_5') || combined.includes('peta tabek patah 5')) {
    cleanTitle = 'Peta Tabek Patah'
    description = 'Batas administratif Nagari Tabek Patah'
  } else if (tableStr === 'longsor' || nameStr === 'longsor' || combined.includes('area longsor') || combined.includes('longsor')) {
    cleanTitle = 'Area Longsor'
    description = 'Zona pemetaan rawan potensi bencana longsor'
  } else if (combined.includes('kesehatan') || combined.includes('puskesmas') || combined.includes('posyandu')) {
    cleanTitle = cleanTitle.toLowerCase().includes('posyandu') ? cleanTitle : 'Fasilitas Kesehatan'
    description = 'Lokasi puskesmas, posyandu & sarana kesehatan'
  } else if (combined.includes('ibadah') || combined.includes('masjid') || combined.includes('musholla') || combined.includes('surau')) {
    cleanTitle = 'Tempat Ibadah'
    description = 'Lokasi masjid, musholla & tempat ibadah'
  } else if (combined.includes('wisata') || combined.includes('pariwisata')) {
    cleanTitle = 'Pariwisata'
    description = 'Destinasi objek wisata & rekreasi nagari'
  } else if (combined.includes('pasar') || combined.includes('umkm') || combined.includes('toko')) {
    cleanTitle = 'Pasar & Perdagangan'
    description = 'Pusat pasar, toko & perniagaan UMKM'
  } else if (combined.includes('pendidikan') || combined.includes('sekolah') || combined.includes('sd') || combined.includes('smp')) {
    cleanTitle = 'Fasilitas Pendidikan'
    description = 'Lokasi sekolah SD, SMP, SMA & PAUD'
  } else if (combined.includes('kumpul') || combined.includes('evakuasi')) {
    cleanTitle = 'Titik Kumpul Evakuasi'
    description = 'Lokasi kumpul evakuasi darurat bencana'
  } else if (combined.includes('air') || combined.includes('sanitasi')) {
    cleanTitle = 'Sumber Air & Sanitasi'
    description = 'Fasilitas jaringan air bersih & sanitasi'
  } else if (combined.includes('jorong')) {
    cleanTitle = 'Batas Jorong'
    description = 'Batas wilayah administratif jorong'
  } else if (combined.includes('nagari')) {
    cleanTitle = 'Batas Nagari'
    description = 'Batas wilayah administratif Nagari Tabek Patah'
  }

  if (featureCount > 0) {
    description = `${description} • ${featureCount} data`
  }

  return { cleanTitle, description }
}

  // Partition spatial layers into Point (Titik) vs Road/Line (Jalan) vs Area (Polygon)
  const { pointLayers, roadLineLayers, polygonAreaLayers } = useMemo(() => {
    const points = []
    const lines = []
    const areas = []

    layers.forEach((layer) => {
      const tableLower = String(layer.table || '').toLowerCase()
      const nameLower = String(layer.name || '').toLowerCase()

      // Exclude Longsortpatah layer as requested by user ("hapus layer Longsortpatah")
      if (tableLower.includes('longsortpatah') || nameLower.includes('longsortpatah')) {
        return
      }

      const layerEntry = layerData[layer.table]
      const isPoint = isLayerPointType(layer, layerEntry)
      if (isPoint) {
        points.push(layer)
        return
      }

      const isLine = isLayerLineType(layer, layerEntry)
      if (isLine) {
        lines.push(layer)
      } else {
        areas.push(layer)
      }
    })

    return { pointLayers: points, roadLineLayers: lines, polygonAreaLayers: areas }
  }, [layers, layerData])

  // Default center for Nagari Tabek Patah, West Sumatra
  const defaultCenter = residentPoints.length > 0
    ? [residentPoints[0].lat, residentPoints[0].lng]
    : [-0.4605, 100.565]

  return (
    <div className={`app-shell ${!isSidebarOpen ? 'is-sidebar-collapsed' : ''}`}>
      <Sidebar
        activePage="map"
        onNavigate={onPageChange}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenSettings={onOpenSettings}
      />

      <main className="main-content" style={{ padding: 0, height: '125vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Map Container Area - Borderless Full Screen */}
        <section className="map-panel" style={{ padding: 0, margin: 0, border: 'none', borderRadius: 0, boxShadow: 'none', flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Map Toolbar Controls */}
          <div className="map-controls-bar" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--bg-card)', borderBottom: '1px solid var(--line)', flexWrap: 'wrap', zIndex: 100 }}>
            <button
              className="topbar-toggle-btn"
              type="button"
              onClick={onToggleSidebar}
              title={isSidebarOpen ? 'Sembunyikan Sidebar' : 'Tampilkan Sidebar'}
              style={{ width: '32px', height: '32px' }}
            >
              <Icon name="menu" size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '6px', borderRight: '1px solid var(--line)' }}>
              <img src="/sikato-logo.png" alt="SIKATO Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              <strong style={{ fontSize: '0.82rem', fontFamily: 'var(--font-heading)', color: 'var(--text-main)', letterSpacing: '0.03em' }}>SIKATO GIS</strong>
            </div>
            <button
              className={`primary-button btn-sm ${isLayerPanelOpen ? '' : 'secondary-button'}`}
              type="button"
              onClick={() => setIsLayerPanelOpen(!isLayerPanelOpen)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', height: '32px', fontSize: '0.78rem' }}
            >
              <Icon name="filter" size={14} />
              <span>{isLayerPanelOpen ? 'Sembunyikan Drawer Layer' : 'Buka Drawer Layer'}</span>
              <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                {activeLayers.length + (showResidentPins ? 1 : 0)}
              </span>
            </button>

            {/* Resident Search Input with magnifying glass and clear button */}
            <div className="map-search-wrap" style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <input
                type="search"
                className="map-search-input"
                placeholder="Cari Nama Kepala KK / No. KK / Alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '10px', height: '32px', borderRadius: '6px', border: '1.5px solid var(--line)', fontSize: '0.78rem', background: 'var(--bg-main)', color: 'var(--text-main)' }}
              />
              <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <Icon name="search" size={13} />
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold', fontSize: '0.9rem' }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Jorong Filter Dropdown */}
            <select
              className="filter-select map-filter-select"
              value={selectedJorong}
              onChange={(e) => setSelectedJorong(e.target.value)}
              style={{ height: '32px', borderRadius: '6px', border: '1.5px solid var(--line)', padding: '0 8px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <option value="all">Semua Jorong Nagari</option>
              <option value="koto">Jorong Koto</option>
              <option value="koto_alam">Jorong Koto Alam</option>
              <option value="data">Jorong Data</option>
              <option value="tabek_patah">Jorong Tabek Patah</option>
            </select>

            {/* Resident Status Filter Dropdown */}
            <select
              className="filter-select map-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: '32px', borderRadius: '6px', border: '1.5px solid var(--line)', padding: '0 8px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--bg-main)', color: 'var(--text-main)', cursor: 'pointer' }}
            >
              <option value="all">Semua Warga ({filteredResidentPoints.length} KK)</option>
              <option value="complete">Data Lengkap (100%)</option>
              <option value="incomplete">Data Belum Lengkap</option>
            </select>

            {/* Toggle Straight Line Distance Measurement Button */}
            <button
              type="button"
              className={`secondary-button btn-sm ${isMeasureMode ? 'primary-button' : ''}`}
              onClick={() => {
                if (isMeasureMode) {
                  setIsMeasureMode(false)
                  setMeasurePt1(null)
                  setMeasurePt2(null)
                } else {
                  setIsMeasureMode(true)
                  setMeasurePt1(null)
                  setMeasurePt2(null)
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                height: '32px',
                fontSize: '0.76rem',
                fontWeight: 800,
                borderRadius: '6px',
                cursor: 'pointer',
                background: isMeasureMode ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'var(--bg-main)',
                color: isMeasureMode ? '#ffffff' : 'var(--text-main)',
                border: isMeasureMode ? 'none' : '1.5px solid var(--line)',
                boxShadow: isMeasureMode ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon name="link" size={13} />
              <span>{isMeasureMode ? 'Mode Ukur Aktif' : 'Ukur Jarak Tempat'}</span>
            </button>

            {/* Toggle Invalid Coordinates Panel Button */}
            <button
              type="button"
              className={`secondary-button btn-sm ${isInvalidPanelOpen ? 'active-warning' : ''}`}
              onClick={() => setIsInvalidPanelOpen(!isInvalidPanelOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                height: '32px',
                fontSize: '0.76rem',
                fontWeight: 800,
                borderRadius: '6px',
                cursor: 'pointer',
                background: isInvalidPanelOpen
                  ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
                  : invalidResidentPoints.length > 0
                  ? 'rgba(225, 29, 72, 0.1)'
                  : 'var(--bg-main)',
                color: isInvalidPanelOpen ? '#ffffff' : invalidResidentPoints.length > 0 ? '#e11d48' : 'var(--text-main)',
                border: isInvalidPanelOpen ? 'none' : invalidResidentPoints.length > 0 ? '1.5px solid #fda4af' : '1.5px solid var(--line)',
                boxShadow: isInvalidPanelOpen ? '0 2px 8px rgba(225, 29, 72, 0.35)' : 'none',
                transition: 'all 0.18s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon name="alert-triangle" size={13} />
              <span>Titik Tidak Valid ({invalidResidentPoints.length})</span>
            </button>
          </div>

          <div className="map-layout-row" style={{ display: 'flex', flex: 1, width: '100%', minHeight: 0, overflow: 'hidden' }}>
            {/* Collapsible Layer Filter Sidebar Panel */}
            {isLayerPanelOpen && (
              <aside
                className="layer-filter-panel"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onScroll={(e) => e.stopPropagation()}
              >
                {/* Header Section */}
                <div className="layer-filter-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(13, 148, 136, 0.3)' }}>
                      <Icon name="layers" size={18} />
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>Layer Spasial</h3>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{activeLayers.length + (showResidentPins ? 1 : 0)} Layer Aktif</span>
                    </div>
                  </div>
                  <div
                    onClick={() => {
                      if (isGlobalAllActive) clearAllLayers()
                      else selectAllLayers()
                    }}
                    title={isGlobalAllActive ? 'Matikan Semua Layer Spasial' : 'Aktifkan Semua Layer Spasial'}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', background: 'var(--bg-main)', padding: '4px 9px', borderRadius: '16px', border: '1px solid var(--line)' }}
                  >
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isGlobalAllActive ? '#0d9488' : 'var(--text-muted)' }}>
                      {isGlobalAllActive ? 'Semua' : 'Matikan'}
                    </span>
                    <div className={`custom-switch ${isGlobalAllActive ? 'is-active' : ''}`} style={{ width: '30px', height: '16px', borderRadius: '10px', background: isGlobalAllActive ? '#0d9488' : '#cbd5e1', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: isGlobalAllActive ? '16px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                </div>

                <div
                  className="layer-filter-list"
                  onWheel={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                >
                  {/* Category 1: Point Layers (Layer Titik) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-main)',
                      borderLeft: '4px solid #0d9488',
                      border: '1px solid var(--line)',
                      borderLeftWidth: '4px',
                      marginTop: '6px',
                      marginBottom: '2px'
                    }}
                  >
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
                      LAYER TITIK / KOORDINAT ({pointLayers.length + 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleCategoryLayers(pointLayers, true)}
                      title={isCategoryAllActive(pointLayers, true) ? 'Matikan Seluruh Layer Titik' : 'Aktifkan Seluruh Layer Titik'}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        background: isCategoryAllActive(pointLayers, true) ? 'rgba(13, 148, 136, 0.14)' : 'rgba(148, 163, 184, 0.12)',
                        border: isCategoryAllActive(pointLayers, true) ? '1px solid rgba(13, 148, 136, 0.35)' : '1px solid var(--line)',
                        color: isCategoryAllActive(pointLayers, true) ? '#0d9488' : 'var(--text-muted)',
                        fontSize: '0.66rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{isCategoryAllActive(pointLayers, true) ? '● Semua' : '○ Nonaktif'}</span>
                    </button>
                  </div>

                  {/* Primary Resident Household Pins Layer Card */}
                  <div
                    onClick={() => setShowResidentPins(!showResidentPins)}
                    style={{
                      background: showResidentPins ? 'rgba(13, 148, 136, 0.06)' : 'var(--bg-main)',
                      border: showResidentPins ? '1.5px solid rgba(13, 148, 136, 0.35)' : '1px solid var(--line)',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: showResidentPins ? '0 3px 12px rgba(13, 148, 136, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#0d9488', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 5px rgba(13, 148, 136, 0.4)' }}>
                          <Icon name="home" size={13} />
                        </span>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.84rem', fontWeight: 700 }}>Titik Rumah Warga</strong>
                      </div>
                      <div className={`custom-switch ${showResidentPins ? 'is-active' : ''}`} style={{ width: '34px', height: '18px', borderRadius: '10px', background: showResidentPins ? '#0d9488' : '#cbd5e1', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                        <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: showResidentPins ? '18px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    {/* Progress Bar & Completeness Stats */}
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                        <span>Kelengkapan Sensus ({residentStats.total} KK)</span>
                        <strong style={{ color: '#0d9488' }}>{residentStats.pct}% Lengkap</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${residentStats.pct}%`, height: '100%', background: '#0d9488', transition: 'width 0.4s ease' }} />
                        <div style={{ flex: 1, height: '100%', background: '#f59e0b' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.71rem' }}>
                        <span style={{ color: '#0d9488', fontWeight: 700 }}>● {residentStats.complete} KK Lengkap</span>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>● {residentStats.incomplete} KK Belum</span>
                      </div>
                    </div>
                  </div>

                  {/* PostGIS Point Vector Layers */}
                  {pointLayers.map((layer, index) => {
                    const isChecked = activeLayers.includes(layer.table)
                    const layerEntry = layerData[layer.table]
                    const firstFeatureProps = layerEntry?.data?.features?.[0]?.properties || {}
                    const catStyle = getLayerCategoryStyle(layer.name || layer.table, firstFeatureProps)
                    const count = layerEntry?.data?.features?.length ?? 0
                    const meta = getLayerMeta(layer, count)

                    return (
                      <div
                        key={layer.table}
                        onClick={() => toggleLayer(layer.table)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          cursor: 'pointer',
                          border: isChecked ? `1.5px solid ${catStyle.color}` : '1px solid var(--line)',
                          background: isChecked ? 'var(--bg-main)' : 'transparent',
                          transition: 'all 0.18s ease',
                          boxShadow: isChecked ? `0 2px 8px ${catStyle.color}25` : 'none',
                        }}
                        className="layer-item-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                            <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: catStyle.color, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 2px 5px ${catStyle.color}40` }}>
                              <Icon name={catStyle.iconName || 'kawasan_nagari'} size={13} />
                            </span>
                            <div style={{ overflow: 'hidden' }}>
                              <strong style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {meta.cleanTitle}
                              </strong>
                              <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {meta.description}
                              </small>
                            </div>
                          </div>

                          <div className={`custom-switch ${isChecked ? 'is-active' : ''}`} style={{ width: '32px', height: '17px', borderRadius: '10px', background: isChecked ? catStyle.color : '#cbd5e1', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                            <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: isChecked ? '17px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>

                        {/* Radius Sub-Bar Control Specifically for Titik Kumpul Card */}
                        {layer.table === 'titik_kumpul' && isChecked && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              marginTop: '4px',
                              paddingTop: '8px',
                              borderTop: '1px dashed var(--line)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              width: '100%',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                              <span>Radius Evakuasi:</span>
                              <strong style={{ color: '#ea580c' }}>{bufferRadius === 0 ? 'Off (0m)' : `${bufferRadius}m`}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                              {[0, 300, 500, 1000].map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setBufferRadius(r)
                                    setEnableBuffer(r > 0)
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '4px 0',
                                    borderRadius: '6px',
                                    border: bufferRadius === r && enableBuffer ? '1px solid #ea580c' : '1px solid var(--line)',
                                    background: bufferRadius === r && enableBuffer ? '#ea580c' : 'var(--bg-card, #ffffff)',
                                    color: bufferRadius === r && enableBuffer ? '#ffffff' : 'var(--text-muted)',
                                    fontSize: '0.67rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {r === 0 ? 'Off' : r === 1000 ? '1km' : `${r}m`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Category 2: Jalan & Line Layers */}
                  {roadLineLayers.length > 0 && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'var(--bg-main)',
                          borderLeft: '4px solid #ea580c',
                          border: '1px solid var(--line)',
                          borderLeftWidth: '4px',
                          marginTop: '10px',
                          marginBottom: '2px'
                        }}
                      >
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
                          LAYER JALAN & RUTE ({roadLineLayers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCategoryLayers(roadLineLayers, false)}
                          title={isCategoryAllActive(roadLineLayers, false) ? 'Matikan Seluruh Layer Jalan' : 'Aktifkan Seluruh Layer Jalan'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: isCategoryAllActive(roadLineLayers, false) ? 'rgba(234, 88, 12, 0.14)' : 'rgba(148, 163, 184, 0.12)',
                            border: isCategoryAllActive(roadLineLayers, false) ? '1px solid rgba(234, 88, 12, 0.35)' : '1px solid var(--line)',
                            color: isCategoryAllActive(roadLineLayers, false) ? '#ea580c' : 'var(--text-muted)',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{isCategoryAllActive(roadLineLayers, false) ? '● Semua' : '○ Nonaktif'}</span>
                        </button>
                      </div>

                      {roadLineLayers.map((layer, index) => {
                        const isChecked = activeLayers.includes(layer.table)
                        const strokeColor = ['#ea580c', '#ec4899', '#2563eb', '#059669', '#7c3aed'][index % 5]
                        const layerEntry = layerData[layer.table]
                        const count = layerEntry?.data?.features?.length ?? 0
                        const meta = getLayerMeta(layer, count)

                        return (
                          <div
                            key={layer.table}
                            onClick={() => toggleLayer(layer.table)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              border: isChecked ? `1.5px solid ${strokeColor}` : '1px solid var(--line)',
                              background: isChecked ? 'var(--bg-main)' : 'transparent',
                              transition: 'all 0.18s ease',
                              boxShadow: isChecked ? `0 2px 8px ${strokeColor}25` : 'none',
                            }}
                            className="layer-item-card"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                              <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: strokeColor, flexShrink: 0, boxShadow: `0 2px 4px ${strokeColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <Icon name="map" size={13} />
                              </span>
                              <div style={{ overflow: 'hidden' }}>
                                <strong style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {meta.cleanTitle}
                                </strong>
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {meta.description}
                                </small>
                              </div>
                            </div>
                            <div className={`custom-switch ${isChecked ? 'is-active' : ''}`} style={{ width: '32px', height: '17px', borderRadius: '10px', background: isChecked ? strokeColor : '#cbd5e1', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                              <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: isChecked ? '17px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* Category 3: Area & Polygon Layers */}
                  {polygonAreaLayers.length > 0 && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'var(--bg-main)',
                          borderLeft: '4px solid #2563eb',
                          border: '1px solid var(--line)',
                          borderLeftWidth: '4px',
                          marginTop: '10px',
                          marginBottom: '2px'
                        }}
                      >
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-heading)' }}>
                          LAYER AREA & KAWASAN ({polygonAreaLayers.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleCategoryLayers(polygonAreaLayers, false)}
                          title={isCategoryAllActive(polygonAreaLayers, false) ? 'Matikan Seluruh Layer Area' : 'Aktifkan Seluruh Layer Area'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            background: isCategoryAllActive(polygonAreaLayers, false) ? 'rgba(37, 99, 235, 0.14)' : 'rgba(148, 163, 184, 0.12)',
                            border: isCategoryAllActive(polygonAreaLayers, false) ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid var(--line)',
                            color: isCategoryAllActive(polygonAreaLayers, false) ? '#2563eb' : 'var(--text-muted)',
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span>{isCategoryAllActive(polygonAreaLayers, false) ? '● Semua' : '○ Nonaktif'}</span>
                        </button>
                      </div>

                      {polygonAreaLayers.map((layer, index) => {
                        const isChecked = activeLayers.includes(layer.table)
                        const color = layerPalette[index % layerPalette.length].fill
                        const strokeColor = layerPalette[index % layerPalette.length].line
                        const layerEntry = layerData[layer.table]
                        const count = layerEntry?.data?.features?.length ?? 0
                        const meta = getLayerMeta(layer, count)

                        return (
                          <div
                            key={layer.table}
                            onClick={() => toggleLayer(layer.table)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              cursor: 'pointer',
                              border: isChecked ? `1.5px solid ${strokeColor}` : '1px solid var(--line)',
                              background: isChecked ? 'var(--bg-main)' : 'transparent',
                              transition: 'all 0.18s ease',
                              boxShadow: isChecked ? `0 2px 8px ${color}20` : 'none',
                            }}
                            className="layer-item-card"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: color, border: `1.5px solid ${strokeColor}`, flexShrink: 0, boxShadow: `0 2px 4px ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: strokeColor }}>
                                  <Icon name="map" size={12} />
                                </span>
                                <div style={{ overflow: 'hidden' }}>
                                  <strong style={{ color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {meta.cleanTitle}
                                  </strong>
                                  <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {meta.description}
                                  </small>
                                </div>
                              </div>
                              <div className={`custom-switch ${isChecked ? 'is-active' : ''}`} style={{ width: '32px', height: '17px', borderRadius: '10px', background: isChecked ? strokeColor : '#cbd5e1', position: 'relative', transition: 'background 0.2s ease', flexShrink: 0 }}>
                                <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: '#ffffff', position: 'absolute', top: '2px', left: isChecked ? '17px' : '2px', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                              </div>
                            </div>

                            {/* Sub-Control Buttons for Jorong Layer: Select All or Specific Jorong */}
                            {layer.table === 'jorong' && isChecked && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  marginTop: '4px',
                                  paddingTop: '8px',
                                  borderTop: '1px dashed var(--line)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  width: '100%',
                                }}
                              >
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                  <span>Tampilkan Wilayah Jorong:</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                                  {[
                                    { id: 'all', label: 'Semua Jorong' },
                                    { id: 'koto', label: 'Jor. Koto' },
                                    { id: 'koto_alam', label: 'Jor. Koto Alam' },
                                    { id: 'data', label: 'Jor. Data' },
                                    { id: 'tabek_patah', label: 'Jor. Tabek Patah' },
                                  ].map((j) => (
                                    <button
                                      key={j.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedJorong(j.id)
                                      }}
                                      style={{
                                        padding: '3px 7px',
                                        borderRadius: '6px',
                                        border: selectedJorong === j.id ? '1px solid #2563eb' : '1px solid var(--line)',
                                        background: selectedJorong === j.id ? '#2563eb' : 'var(--bg-card, #ffffff)',
                                        color: selectedJorong === j.id ? '#ffffff' : 'var(--text-muted)',
                                        fontSize: '0.66rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      {j.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              </aside>
            )}

            {/* Leaflet Map Viewer */}
            <div className="map-canvas-container" style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
              {/* Floating Basemap Switcher Control Overlay Widget */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  zIndex: 1000,
                  background: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(10px)',
                  padding: '4px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setBasemap('osm')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    background: basemap === 'osm' ? '#0d9488' : 'transparent',
                    color: basemap === 'osm' ? '#ffffff' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon name="map" size={13} />
                  <span>Jalan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBasemap('satellite')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    background: basemap === 'satellite' ? '#0d9488' : 'transparent',
                    color: basemap === 'satellite' ? '#ffffff' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon name="globe" size={13} />
                  <span>Satelit Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBasemap('esri')}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '7px',
                    border: 'none',
                    background: basemap === 'esri' ? '#0d9488' : 'transparent',
                    color: basemap === 'esri' ? '#ffffff' : '#475569',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon name="globe" size={13} />
                  <span>Satelit Esri</span>
                </button>
              </div>

              {/* Top-Center Instruction Banner for Straight Line Measurement */}
              {isMeasureMode && (!measurePt1 || !measurePt2) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(12px)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: '1px solid #38bdf8',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span>
                    {!measurePt1 && '📐 Klik lokasi Titik Pertama di peta'}
                    {measurePt1 && !measurePt2 && '🎯 Titik 1 Terpasang. Klik lokasi Titik Kedua di peta'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMeasureMode(false)
                      setMeasurePt1(null)
                      setMeasurePt2(null)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '5px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                    }}
                  >
                    Batal ✕
                  </button>
                </div>
              )}

              <MapContainer
                center={defaultCenter}
                zoom={14}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={true}
              >
                {/* Basemap 1: Road Map (Automatically adapts to Global Theme from Settings Modal) */}
                {basemap === 'osm' && (
                  theme === 'dark' ? (
                    <TileLayer
                      attribution='&copy; CARTO Dark Matter | GIS Sensus Nagari Tabek Patah'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      maxZoom={19}
                    />
                  ) : (
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | GIS Sensus Nagari Tabek Patah'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  )
                )}

                {/* Basemap 2: Pure Google Satellite (No Extra Google POI Dots / Clean Aerial Photo) */}
                {basemap === 'satellite' && (
                  <TileLayer
                    attribution='&copy; Google Maps Satellite | GIS Sensus Nagari Tabek Patah'
                    url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    maxZoom={20}
                    maxNativeZoom={20}
                  />
                )}

                {/* Basemap 3: Esri World Imagery (with maxNativeZoom=17 to prevent placeholder error) */}
                {basemap === 'esri' && (
                  <>
                    <TileLayer
                      attribution='&copy; Esri World Imagery | GIS Sensus Nagari Tabek Patah'
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                      maxNativeZoom={17}
                    />
                    <TileLayer
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                      maxZoom={19}
                      maxNativeZoom={17}
                    />
                  </>
                )}

                <MapBoundsFitter points={filteredResidentPoints} />
                <MapEvacuationFitter route={activeEvacRoute} />
                <MapPointRouteFitter route={activeCalculatedRoute || activeGpsCalculatedRoute} />
                <MapResizer isPanelOpen={isLayerPanelOpen} isSidebarOpen={isSidebarOpen} />
                <MapMeasureClickListener
                  isMeasureMode={isMeasureMode}
                  isGpsNavOpen={isGpsNavOpen}
                  onPickMeasurePoint={handlePickMeasurePoint}
                  onPickGpsPoint={handlePickGpsNavPoint}
                  residentPoints={filteredResidentPoints}
                  layerData={layerData}
                />

                {/* Render Evacuation Point Buffer Circles (300m / 500m / 1000m) */}
                {activeLayers.includes('titik_kumpul') &&
                  enableBuffer &&
                  bufferRadius > 0 &&
                  bufferCircles.map((circle) => (
                    <Circle
                      key={circle.key}
                      center={[circle.lat, circle.lng]}
                      radius={bufferRadius}
                      pathOptions={{
                        color: '#ea580c',
                        fillColor: '#ea580c',
                        fillOpacity: 0.16,
                        weight: 2,
                        dashArray: '6, 6',
                        interactive: false,
                      }}
                    >
                      <Tooltip direction="top" opacity={0.9}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                          <span>Radius {bufferRadius}m: </span>
                          <strong>{circle.name}</strong>
                        </div>
                      </Tooltip>
                    </Circle>
                  ))}

                {/* Render Resident Pins Layer (394 Household Pins - Hidden during active route or navigation for clean focus) */}
                {showResidentPins &&
                  !activeEvacRoute &&
                  !activeCalculatedRoute &&
                  !activeGpsCalculatedRoute &&
                  !gpsNavOrigin &&
                  !(measurePt1 && measurePt2) &&
                  filteredResidentPoints.map((pt, idx) => {
                    const icon = createHouseMarkerIcon(pt.comp.isComplete, statusFilter)
                    const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${pt.lat},${pt.lng}`
                    const personName = pt.nama_kepala_keluarga || pt.nama_responden || 'Responden'

                    return (
                      <Marker
                        key={pt.id || idx}
                        position={[pt.lat, pt.lng]}
                        icon={icon}
                        eventHandlers={{
                          click: (e) => {
                            if (isMeasureModeRef.current) {
                              if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                                e.originalEvent.stopPropagation()
                              }
                              handlePickMeasurePoint(pt.lat, pt.lng, `🏠 Rumah ${personName}`)
                            } else if (isGpsNavOpenRef.current) {
                              if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                                e.originalEvent.stopPropagation()
                              }
                              handlePickGpsNavPoint(pt.lat, pt.lng, `🏠 Rumah ${personName}`)
                            }
                          },
                        }}
                      >
                        <Tooltip className="custom-gis-tooltip" direction="top" offset={[0, -16]} opacity={1}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Icon name="home" size={13} />
                            <strong>{personName}</strong>
                          </div>
                        </Tooltip>
                        <Popup minWidth={340} maxWidth={350} className="custom-resident-leaflet-popup">
                          {(() => {
                            const rawPhotoUrl = pt.rumah_tampak_depan || pt.foto_rumah_tampak_depan || pt.foto_rumah || pt.foto_depan || pt.foto
                            const photoSrc = rawPhotoUrl ? getGoogleDriveThumbnailUrl(rawPhotoUrl) : null

                            return (
                              <div className="resident-map-popup-card" style={{ fontFamily: 'var(--font-body)', width: '100%', boxSizing: 'border-box', overflow: 'hidden', borderRadius: '16px', background: 'var(--bg-card, #ffffff)' }}>
                                {/* Header Bar */}
                                <div style={{
                                  background: pt.comp.isComplete ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                  color: '#ffffff',
                                  padding: '10px 12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  boxSizing: 'border-box'
                                }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: '#ffffff', flexShrink: 0 }}>
                                    <Icon name="home" size={16} />
                                  </span>
                                  <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {personName}
                                    </h3>
                                    <span style={{ fontSize: '0.72rem', opacity: 0.9, fontWeight: 600, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>No. KK: {pt.nomor_kk || '-'}</span>
                                  </div>
                                </div>

                                {/* Foto Tampak Depan Rumah */}
                                {photoSrc ? (
                                  <div style={{ width: '100%', height: '155px', overflow: 'hidden', position: 'relative', background: '#0f172a' }}>
                                    <img
                                      src={photoSrc}
                                      alt={`Foto Rumah ${personName}`}
                                      onError={(e) => {
                                        const fallback = getGoogleDriveFallbackUrl(rawPhotoUrl)
                                        if (fallback && e.target.src !== fallback) {
                                          e.target.src = fallback
                                        } else {
                                          e.target.style.display = 'none'
                                        }
                                      }}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                    <div style={{
                                      position: 'absolute',
                                      bottom: '6px',
                                      left: '8px',
                                      background: 'rgba(15, 23, 42, 0.8)',
                                      backdropFilter: 'blur(4px)',
                                      WebkitBackdropFilter: 'blur(4px)',
                                      color: '#ffffff',
                                      fontSize: '0.66rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                                    }}>
                                      <Icon name="camera" size={11} />
                                      <span>Foto Tampak Depan</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{
                                    width: '100%',
                                    height: '65px',
                                    background: 'var(--bg-main, #f8fafc)',
                                    borderBottom: '1px solid var(--line, #e2e8f0)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    color: 'var(--text-muted, #64748b)',
                                    fontSize: '0.72rem'
                                  }}>
                                    <Icon name="camera" size={14} />
                                    <span>Foto Rumah Belum Tersedia</span>
                                  </div>
                                )}

                                {/* Body Content */}
                                <div style={{ padding: '12px 14px', width: '100%', boxSizing: 'border-box' }}>
                                  <p style={{ margin: '0 0 8px 0', fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.35, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                    <span style={{ color: '#0d9488', display: 'inline-flex', alignItems: 'center', flexShrink: 0, marginTop: '2px' }}>
                                      <Icon name="kawasan_nagari" size={14} />
                                    </span>
                                    <span>{pt.alamat_lengkap || 'Nagari Tabek Patah'}</span>
                                  </p>

                                  <div style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 700, marginBottom: '4px', gap: '6px' }}>
                                      <span>Kelengkapan Sensus</span>
                                      <span style={{ color: pt.comp.isComplete ? '#059669' : '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                        <Icon name={pt.comp.isComplete ? 'check' : 'info'} size={12} />
                                        <span>{pt.comp.isComplete ? 'Lengkap' : `${pt.comp.percentage}%`}</span>
                                      </span>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                                      <div style={{ width: `${pt.comp.percentage}%`, height: '100%', background: pt.comp.isComplete ? '#10b981' : '#f59e0b', borderRadius: '3px' }} />
                                    </div>
                                  </div>

                                  <div style={{ background: 'var(--bg-main, #f8fafc)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line, #e2e8f0)', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <div><strong>Anggota KK:</strong> {pt.jumlah_anggota_dalam_keluarga || '-'} org</div>
                                    <div style={{ wordBreak: 'break-all' }}><strong>HP:</strong> {pt.nomor_hp || '-'}</div>
                                  </div>

                                  {/* 2x2 Compact Action Buttons Grid */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', width: '100%', boxSizing: 'border-box' }}>
                                    {onViewDetail && (
                                      <button
                                        type="button"
                                        onClick={() => onViewDetail(pt)}
                                        style={{
                                          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '8px 6px',
                                          borderRadius: '8px',
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          cursor: 'pointer',
                                          boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '4px',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        <Icon name="info" size={13} />
                                        <span>Detail</span>
                                      </button>
                                    )}
                                    <a
                                      href={gmapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                        color: '#ffffff',
                                        padding: '8px 6px',
                                        borderRadius: '8px',
                                        fontSize: '0.72rem',
                                        fontWeight: 800,
                                        textDecoration: 'none',
                                        boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <Icon name="link" size={13} />
                                      <span>Maps ↗</span>
                                    </a>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                                          e.nativeEvent.stopImmediatePropagation()
                                        }
                                        handleShowEvacuationRouteSafe(e, pt)
                                      }}
                                      style={{
                                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '8px 6px',
                                        borderRadius: '8px',
                                        fontSize: '0.71rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        userSelect: 'none',
                                        boxSizing: 'border-box',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <Icon name="bencana" size={13} />
                                      <span>Rute Evakuasi</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
                                          e.nativeEvent.stopImmediatePropagation()
                                        }
                                        const name = pt.nama_kepala_keluarga || pt.nama_responden || 'Rumah Warga'
                                        setRouteFromPt({
                                          id: `res-card-${pt.nomor_kk || Math.random()}`,
                                          name: `🏠 Rumah ${name}`,
                                          lat: pt.lat,
                                          lng: pt.lng,
                                          category: 'Rumah Warga',
                                        })
                                        setIsRouteToolOpen(true)
                                      }}
                                      style={{
                                        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '8px 6px',
                                        borderRadius: '8px',
                                        fontSize: '0.71rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        userSelect: 'none',
                                        boxSizing: 'border-box',
                                        whiteSpace: 'nowrap'
                                      }}
                                    >
                                      <Icon name="link" size={13} />
                                      <span>Ukur Rute</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </Popup>
                      </Marker>
                    )
                  })}

                {/* Render PostGIS Database Spatial Vector Layers */}
                {visibleLayerEntries.map((entry, index) => {
                  if (!entry.data) return null
                  const catStyle = getLayerCategoryStyle(entry.name, {})

                  let featureData = entry.data
                  if (entry.name === 'jorong' && selectedJorong !== 'all') {
                    const filteredFeatures = (entry.data.features || []).filter((feat) => {
                      const nameStr = (feat.properties?.name || feat.properties?.nama || '').toLowerCase()
                      if (selectedJorong === 'koto_alam') return nameStr.includes('koto alam') || nameStr.includes('alam')
                      if (selectedJorong === 'koto') return nameStr.includes('koto') && !nameStr.includes('alam')
                      if (selectedJorong === 'data') return nameStr.includes('data')
                      if (selectedJorong === 'tabek_patah') return nameStr.includes('tabek') || nameStr.includes('patah')
                      return true
                    })
                    featureData = { ...entry.data, features: filteredFeatures }
                  }

                  return (
                    <GeoJSON
                      key={`${entry.name}-${selectedJorong}-${isMeasureMode}-${isGpsNavOpen}`}
                      data={featureData}
                      style={(feature) => getGeoJsonFeatureStyle(feature, entry.name, index)}
                      pointToLayer={(feature, latlng) => {
                        const styleInfo = getLayerCategoryStyle(entry.name, feature.properties)
                        const icon = createCustomCategoryPin(styleInfo.categoryKey, styleInfo.color)
                        const marker = L.marker(latlng, { icon })
                        const fName = getFeatureDisplayName(feature.properties || {}, entry.name)

                        marker.on('click', (e) => {
                          if (isMeasureModeRef.current) {
                            if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                              e.originalEvent.stopPropagation()
                            }
                            handlePickMeasurePoint(latlng.lat, latlng.lng, `📍 ${fName}`)
                          } else if (isGpsNavOpenRef.current) {
                            if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                              e.originalEvent.stopPropagation()
                            }
                            handlePickGpsNavPoint(latlng.lat, latlng.lng, `📍 ${fName}`)
                          }
                        })
                        return marker
                      }}
                      onEachFeature={(feature, layer) => {
                        const props = feature.properties || {}
                        const nameProp = getFeatureDisplayName(props, entry.name)

                        layer.bindTooltip(`<div class="custom-gis-tooltip"><strong>${nameProp}</strong></div>`, {
                          direction: 'top',
                          offset: [0, -32],
                          opacity: 1,
                        })

                        layer.on('click', (e) => {
                          if (isMeasureModeRef.current) {
                            if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                              e.originalEvent.stopPropagation()
                            }
                            const center = getFeatureCentroid(feature)
                            const lat = e.latlng?.lat || center?.lat
                            const lng = e.latlng?.lng || center?.lng
                            if (!lat || !lng) return
                            handlePickMeasurePoint(lat, lng, `📍 ${nameProp}`)
                          } else if (isGpsNavOpenRef.current) {
                            if (e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
                              e.originalEvent.stopPropagation()
                            }
                            const center = getFeatureCentroid(feature)
                            const lat = e.latlng?.lat || center?.lat
                            const lng = e.latlng?.lng || center?.lng
                            if (!lat || !lng) return
                            handlePickGpsNavPoint(lat, lng, `📍 ${nameProp}`)
                          }
                        })

                        const content = Object.entries(props)
                          .map(([key, val]) => `<div style="display:flex; justify-space-between; padding:2px 0; border-bottom:1px solid #f1f5f9; font-size:0.78rem;">
                              <span style="color:#64748b; font-weight:600; text-transform:capitalize;">${key.replace(/_/g, ' ')}:</span>
                              <strong style="color:#0f172a; margin-left:8px;">${val}</strong>
                            </div>`)
                          .join('')

                        layer.bindPopup(`
                          <div style="font-family:var(--font-body); width:240px; overflow:hidden;">
                            <div style="background:linear-gradient(135deg, ${catStyle.color} 0%, ${catStyle.color}dd 100%); color:#ffffff; padding:10px 12px; font-weight:800; font-family:var(--font-heading); font-size:0.9rem;">
                              ${nameProp}
                            </div>
                            <div style="padding:10px 12px; max-height:180px; overflow-y:auto;">
                              ${content}
                            </div>
                          </div>
                        `)
                      }}
                    />
                  )
                })}

                {/* Render Evacuation Route Line & Hero Radar Marker if Active */}
                {activeEvacRoute && (
                  <>
                    {validEvacPolylineCoords.length >= 2 && (
                      <Polyline
                        positions={validEvacPolylineCoords}
                        pathOptions={{
                          color: '#ea580c',
                          weight: 7,
                          dashArray: activeEvacRoute.isRealRoad ? undefined : '10, 10',
                          opacity: 0.95,
                          className: 'animated-evac-polyline',
                        }}
                      />
                    )}
                    {validEvacFromMarker && (
                      <Marker position={validEvacFromMarker} icon={createResidentOriginPin()}>
                        <Tooltip permanent className="custom-gis-tooltip" direction="top" offset={[0, -20]} opacity={1}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                            <span>🏠 ASAL EVAKUASI:</span>
                            <strong style={{ color: '#34d399' }}>{activeEvacRoute.residentName}</strong>
                          </div>
                        </Tooltip>
                      </Marker>
                    )}
                    {validEvacToMarker && (
                      <Marker position={validEvacToMarker} icon={createHeroEvacuationPin()}>
                        <Tooltip permanent className="custom-gis-tooltip" direction="top" offset={[0, -32]} opacity={1}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                            <span>🚨 TUJUAN EVAKUASI:</span>
                            <strong style={{ color: '#fb923c' }}>{activeEvacRoute.evacName}</strong>
                          </div>
                        </Tooltip>
                        <Popup>
                          <div style={{ fontFamily: 'var(--font-body)', padding: '8px 10px', fontSize: '0.84rem' }}>
                            <strong style={{ color: '#ea580c', display: 'block', marginBottom: '4px', fontSize: '0.9rem' }}>🚨 Titik Kumpul Evakuasi Terdekat</strong>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{activeEvacRoute.evacName}</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                              Tujuan Evakuasi Warga: <strong>{activeEvacRoute.residentName}</strong><br />
                              Jarak Tempuh: <strong style={{ color: '#ea580c' }}>{activeEvacRoute.distance}m</strong> ({activeEvacRoute.distanceKm} km)<br />
                              🚶 Jalan kaki: <strong>~{activeEvacRoute.walkMins} mnt</strong> | 🏍️ Motor: <strong>~{activeEvacRoute.motorMins} mnt</strong>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </>
                )}

                {/* Render Interactive Route Measurement Polyline if Active */}
                {activeCalculatedRoute && (
                  <>
                    {validCalculatedPolylineCoords.length >= 2 && (
                      <Polyline
                        positions={validCalculatedPolylineCoords}
                        pathOptions={{
                          color: '#06b6d4',
                          weight: 6,
                          dashArray: '10, 10',
                          opacity: 0.95,
                        }}
                      />
                    )}
                    {validCalculatedFromMarker && (
                      <Marker position={validCalculatedFromMarker}>
                        <Popup>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669' }}>
                            🟢 Titik Asal (Dari):<br />
                            {activeCalculatedRoute.fromName}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                    {validCalculatedToMarker && (
                      <Marker position={validCalculatedToMarker}>
                        <Popup>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626' }}>
                            🔴 Titik Tujuan (Ke):<br />
                            {activeCalculatedRoute.toName}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </>
                )}

                {/* Render Interactive Straight Line Measurement Points & Line */}
                {measurePt1 && (
                  <Marker position={[measurePt1.lat, measurePt1.lng]} icon={createMeasureOriginPin()}>
                    <Tooltip permanent className="custom-gis-tooltip" direction="top" offset={[0, -20]} opacity={1}>
                      <div style={{ fontWeight: 800, color: '#34d399' }}>🟢 {measurePt1.name || 'TITIK 1'}</div>
                    </Tooltip>
                  </Marker>
                )}

                {measurePt1 && measurePt2 && (
                  <>
                    <Marker position={[measurePt2.lat, measurePt2.lng]} icon={createMeasureTargetPin()}>
                      <Tooltip permanent className="custom-gis-tooltip" direction="top" offset={[0, -22]} opacity={1}>
                        <div style={{ fontWeight: 800, color: '#38bdf8' }}>🔴 {measurePt2.name || 'TITIK 2'}</div>
                      </Tooltip>
                    </Marker>
                    <Polyline
                      positions={[
                        [measurePt1.lat, measurePt1.lng],
                        [measurePt2.lat, measurePt2.lng],
                      ]}
                      pathOptions={{
                        color: '#06b6d4',
                        weight: 7,
                        dashArray: '12, 12',
                        opacity: 0.95,
                        className: 'animated-evac-polyline',
                      }}
                    />
                  </>
                )}
                {/* Render GPS Live Navigation Route Markers & Real Road Network Polyline */}
                {gpsNavOrigin && (
                  <Marker position={[gpsNavOrigin.lat, gpsNavOrigin.lng]} icon={createGpsUserLocationPin()}>
                    <Tooltip permanent className="custom-gis-tooltip" direction="top" offset={[0, -20]} opacity={1}>
                      <div style={{ fontWeight: 800, color: '#38bdf8' }}>🔵 {gpsNavOrigin.name || 'LOKASI ASAL'}</div>
                    </Tooltip>
                  </Marker>
                )}

                {gpsNavOrigin && gpsNavTarget && (
                  <>
                    <Marker position={[gpsNavTarget.lat, gpsNavTarget.lng]} icon={createMeasureTargetPin()}>
                      <Tooltip permanent className="custom-gis-tooltip" direction="top" offset={[0, -22]} opacity={1}>
                        <div style={{ fontWeight: 800, color: '#34d399' }}>🔴 {gpsNavTarget.name || 'TITIK TUJUAN'}</div>
                      </Tooltip>
                    </Marker>
                    <Polyline
                      positions={activeGpsCalculatedRoute?.coords || [[gpsNavOrigin.lat, gpsNavOrigin.lng], [gpsNavTarget.lat, gpsNavTarget.lng]]}
                      pathOptions={{
                        color: '#0284c7',
                        weight: 6,
                        opacity: 0.95,
                        className: 'animated-evac-polyline',
                      }}
                    />
                  </>
                )}
              </MapContainer>

              {/* Floating Evacuation Route Summary Banner Widget */}
              {activeEvacRoute && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: '#ffffff',
                    padding: '14px 20px',
                    borderRadius: '18px',
                    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(249, 115, 22, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    fontSize: '0.82rem',
                    maxWidth: '92vw',
                    width: 'max-content',
                    boxSizing: 'border-box',
                    animation: 'popupGlassEntrance 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Animated Emergency Icon Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.5)',
                        border: '1.5px solid rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      <Icon name="bencana" size={22} />
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #0f172a',
                        boxShadow: '0 0 8px #22c55e',
                      }}
                    />
                  </div>

                  {/* Info Content Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {/* Title Header & Route Line */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(234, 88, 12, 0.22)', color: '#fb923c', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(251, 146, 60, 0.4)', letterSpacing: '0.4px', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="bencana" size={13} />
                        <span>Rute Evakuasi Terdekat</span>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                        {activeEvacRoute.residentName} <span style={{ color: '#ea580c', margin: '0 4px' }}>➔</span> {activeEvacRoute.evacName}
                      </span>
                    </div>

                    {/* Metrics Pills */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.73rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="globe" size={12} />
                        <span><strong>{activeEvacRoute.distance}m</strong> ({activeEvacRoute.distanceKm} km)</span>
                      </span>
                      <span style={{ background: 'rgba(234, 179, 8, 0.18)', color: '#fde047', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(253, 224, 71, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="user-walk" size={12} />
                        <span>Jalan Kaki: <strong>~{activeEvacRoute.walkMins} mnt</strong></span>
                      </span>
                      <span style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(110, 231, 183, 0.3)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="motorcycle" size={12} />
                        <span>Motor: <strong>~{activeEvacRoute.motorMins} mnt</strong></span>
                      </span>
                      <span style={{ background: 'rgba(225, 29, 72, 0.22)', color: '#fda4af', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.4)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="alert" size={12} /> Zona Longsor Aktif
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0, paddingLeft: '8px' }}>
                    <a
                      href={activeEvacRoute.gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                        transition: 'all 0.18s ease',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <Icon name="link" size={14} />
                      <span>Navigasi Maps ↗</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleCloseEvacRoute}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#cbd5e1',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        transition: 'all 0.18s ease',
                      }}
                    >
                      Tutup ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Result Banner for Straight Line Measurement */}
              {measurePt1 && measurePt2 && straightMeasureDistance && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    color: '#ffffff',
                    padding: '14px 20px',
                    borderRadius: '18px',
                    boxShadow: '0 20px 48px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(6, 182, 212, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '18px',
                    fontSize: '0.82rem',
                    maxWidth: '92vw',
                    width: 'max-content',
                    boxSizing: 'border-box',
                    animation: 'popupGlassEntrance 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
                      flexShrink: 0,
                    }}
                  >
                    📐
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(6, 182, 212, 0.22)', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.4)', textTransform: 'uppercase' }}>
                        Hasil Ukur Jarak Tempat
                      </span>
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                      Jarak Tempat: <strong style={{ color: '#38bdf8' }}>{straightMeasureDistance.meters}m</strong> ({straightMeasureDistance.km} km)
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto', flexShrink: 0, paddingLeft: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMeasurePt1(null)
                        setMeasurePt2(null)
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      Ulangi 🔄
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMeasureMode(false)
                        setMeasurePt1(null)
                        setMeasurePt2(null)
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        color: '#cbd5e1',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}
                    >
                      Selesai ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Top-Center Instruction Banner for GPS Map Clicking */}
              {isGpsNavOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.4), 0 0 0 1.5px rgba(13, 148, 136, 0.5)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'popupGlassEntrance 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'auto',
                  }}
                >
                  {!gpsNavOrigin ? (
                    <>
                      <Icon name="map-pin" size={15} style={{ color: '#38bdf8' }} />
                      <span>Silakan <strong>klik titik ke-1 pada peta</strong> untuk menentukan <strong>Titik Asal</strong></span>
                    </>
                  ) : !gpsNavTarget ? (
                    <>
                      <Icon name="map-pin" size={15} style={{ color: '#f43f5e' }} />
                      <span>Silakan <strong>klik titik ke-2 pada peta</strong> untuk menentukan <strong>Titik Tujuan</strong></span>
                    </>
                  ) : (
                    <>
                      <Icon name="compass" size={15} style={{ color: '#2dd4bf' }} />
                      <span>Rute Jalan Raya Terbentuk! Jarak: <strong style={{ color: '#2dd4bf' }}>{activeGpsCalculatedRoute?.distanceKm} km</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setGpsNavOrigin(null)
                          setGpsNavTarget(null)
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: '#ffffff',
                          borderRadius: '12px',
                          padding: '3px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          marginLeft: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Icon name="refresh" size={12} />
                        <span>Ulangi</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Top-Right Floating Invalid Points Panel */}
              {isInvalidPanelOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    right: '14px',
                    zIndex: 1000,
                    width: '380px',
                    maxHeight: 'calc(100vh - 120px)',
                    background: 'var(--bg-card, #ffffff)',
                    border: '1.5px solid rgba(225, 29, 72, 0.35)',
                    borderRadius: '16px',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'popupGlassEntrance 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                      color: '#ffffff',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="alert-triangle" size={16} />
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, lineHeight: '1.2' }}>Titik Koordinat Tidak Valid</h4>
                        <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{invalidResidentPoints.length} Data Berada Di Luar Area / Salah</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInvalidPanelOpen(false)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        cursor: 'pointer',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Filter tabs inside panel */}
                  <div style={{ display: 'flex', gap: '4px', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--bg-main)', flexWrap: 'wrap' }}>
                    {[
                      { key: 'all', label: `Semua (${invalidResidentPoints.length})` },
                      { key: 'out_bounds', label: `Di Luar Area (${invalidCounts.outBounds})` },
                      { key: 'format_error', label: `Format Salah (${invalidCounts.formatError})` },
                      { key: 'empty', label: `Kosong (${invalidCounts.empty})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setInvalidFilterTab(tab.key)}
                        style={{
                          flex: 1,
                          minWidth: '70px',
                          padding: '5px 4px',
                          borderRadius: '6px',
                          border: invalidFilterTab === tab.key ? '1px solid #e11d48' : '1px solid var(--line)',
                          background: invalidFilterTab === tab.key ? '#e11d48' : 'var(--bg-card, #ffffff)',
                          color: invalidFilterTab === tab.key ? '#ffffff' : 'var(--text-muted)',
                          fontSize: '0.67rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Scrollable List */}
                  <div style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {displayedInvalidPoints.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                        Tidak ada titik koordinat yang bermasalah pada kategori ini.
                      </div>
                    ) : (
                      displayedInvalidPoints.map((item, idx) => {
                        const status = item._invalidStatus || {}
                        const isOut = status.code === 'OUT_OF_BOUNDS'
                        const isFormat = status.code === 'FORMAT_ERROR'
                        const isEmpty = status.code === 'EMPTY'

                        // Dynamic SVG Badge Styles based on Exact Category
                        const badgeStyle = isOut
                          ? { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', label: '📍 Di Luar Area Nagari', icon: 'globe' }
                          : isFormat
                          ? { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: '⚠️ Format / Typo Salah', icon: 'alert-triangle' }
                          : { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', label: '⚪ Kosong / Belum Diisi', icon: 'layers' }

                        const reasonBoxStyle = isOut
                          ? { bg: 'rgba(225, 29, 72, 0.06)', border: '#e11d48', text: '#e11d48' }
                          : isFormat
                          ? { bg: 'rgba(217, 119, 6, 0.06)', border: '#d97706', text: '#b45309' }
                          : { bg: 'rgba(100, 116, 139, 0.08)', border: '#64748b', text: '#475569' }

                        return (
                          <div
                            key={item.id || idx}
                            style={{
                              background: 'var(--bg-main)',
                              border: '1px solid var(--line)',
                              borderRadius: '10px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Icon name="home" size={14} />
                                <strong style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontWeight: 800 }}>
                                  {item.nama_kepala_keluarga || item.nama_responden || 'Warga'}
                                </strong>
                              </div>
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  whiteSpace: 'nowrap',
                                  background: badgeStyle.bg,
                                  color: badgeStyle.text,
                                  border: `1px solid ${badgeStyle.border}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Icon name={badgeStyle.icon} size={11} />
                                <span>{badgeStyle.label}</span>
                              </span>
                            </div>

                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div>No. KK: <strong>{item.nomor_kk || '-'}</strong> • Jorong: <strong>{item.alamat_lengkap || '-'}</strong></div>
                              <div>Input Excel X: <code style={{ color: 'var(--text-main)' }}>{item.titik_koordinat_x || '-'}</code> | Y: <code style={{ color: 'var(--text-main)' }}>{item.titik_koordinat_y || '-'}</code></div>
                            </div>

                            <div style={{ fontSize: '0.72rem', color: reasonBoxStyle.text, fontWeight: 700, background: reasonBoxStyle.bg, padding: '6px 10px', borderRadius: '6px', borderLeft: `3px solid ${reasonBoxStyle.border}` }}>
                              {status.reason || 'Koordinat Perlu Diperbaiki'}
                            </div>

                            {/* Action Edit button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (typeof onStartEdit === 'function') {
                                  onStartEdit(item)
                                }
                              }}
                              style={{
                                alignSelf: 'flex-end',
                                marginTop: '4px',
                                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 12px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                              }}
                            >
                              <Icon name="edit" size={12} />
                              <span>Perbaiki Koordinat</span>
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Floating Interactive Route Measurement Widget Panel */}
              {isRouteToolOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '14px',
                    left: '14px',
                    zIndex: 1000,
                    width: '320px',
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(12px)',
                    color: '#ffffff',
                    padding: '16px',
                    borderRadius: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    border: '1.5px solid #0284c7',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.9rem', color: '#38bdf8' }}>
                      <Icon name="link" size={16} />
                      <span>Pengukur Rute & Jarak</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRouteToolOpen(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Dropdown Titik Awal */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 700 }}>
                      Titik Awal (Dari):
                    </label>
                    <select
                      value={routeFromPt ? routeFromPt.id : ''}
                      onChange={(e) => {
                        const pt = selectablePlaces.find((p) => p.id === e.target.value)
                        setRouteFromPt(pt || null)
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      <option value="">-- Pilih Lokasi Asal --</option>
                      {selectablePlaces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Swap Button */}
                  <div style={{ textAlign: 'center', margin: '-4px 0' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const temp = routeFromPt
                        setRouteFromPt(routeToPt)
                        setRouteToPt(temp)
                      }}
                      title="Tukar Titik Asal & Tujuan"
                      style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#38bdf8', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="refresh" size={14} />
                    </button>
                  </div>

                  {/* Dropdown Titik Tujuan */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 700 }}>
                      Titik Tujuan (Ke):
                    </label>
                    <select
                      value={routeToPt ? routeToPt.id : ''}
                      onChange={(e) => {
                        const pt = selectablePlaces.find((p) => p.id === e.target.value)
                        setRouteToPt(pt || null)
                      }}
                      style={{ width: '100%', padding: '6px 8px', borderRadius: '7px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      <option value="">-- Pilih Lokasi Tujuan --</option>
                      {selectablePlaces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Calculated Result Card */}
                  {activeCalculatedRoute ? (
                    <div style={{ marginTop: '6px', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>Jarak Garis Lurus:</span>
                        <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>
                          {activeCalculatedRoute.distanceMeters >= 1000 ? `${activeCalculatedRoute.distanceKm} km` : `${activeCalculatedRoute.distanceMeters} meter`}
                        </strong>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.73rem', marginBottom: '10px' }}>
                        <div style={{ background: '#1e293b', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ display: 'block', color: '#94a3b8' }}>🚶 Jalan Kaki</span>
                          <strong style={{ color: '#facc15' }}>~{activeCalculatedRoute.walkMins} mnt</strong>
                        </div>
                        <div style={{ background: '#1e293b', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ display: 'block', color: '#94a3b8' }}>🏍️ Sepeda Motor</span>
                          <strong style={{ color: '#4ade80' }}>~{activeCalculatedRoute.motorMins} mnt</strong>
                        </div>
                      </div>

                      <a
                        href={activeCalculatedRoute.gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          padding: '7px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          textDecoration: 'none',
                          boxShadow: '0 3px 8px rgba(2, 132, 199, 0.3)',
                        }}
                      >
                        <Icon name="link" size={13} />
                        <span>Buka Navigasi Google Maps ↗</span>
                      </a>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '4px' }}>
                      Pilih titik asal dan tujuan di atas untuk menghitung rute & jarak.
                    </div>
                  )}
                </div>
              )}
              {/* Floating Bottom-Right GPS Geolocation Navigation Widget */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  right: '14px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '10px',
                }}
              >
                {/* GPS Navigation Drawer Card */}
                {isGpsNavOpen && (
                  <div
                    style={{
                      width: '350px',
                      maxWidth: '92vw',
                      background: 'rgba(15, 23, 42, 0.94)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      color: '#ffffff',
                      padding: '16px',
                      borderRadius: '20px',
                      boxShadow: '0 20px 50px rgba(15, 23, 42, 0.6), 0 0 0 1.5px rgba(13, 148, 136, 0.5)',
                      border: '1px solid rgba(13, 148, 136, 0.3)',
                      animation: 'popupGlassEntrance 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 8px rgba(13, 148, 136, 0.4)' }}>
                          <Icon name="link" size={16} />
                        </span>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                            🧭 Navigasi & Rute GPS
                          </h4>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Kalkulasi Rute Lokasi Live / Titik</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGpsNavOpen(false)}
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Origin Type Switcher Pills */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 700 }}>
                        PILIH TITIK ASAL:
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setGpsOriginMode('gps')
                            handleRequestGpsLocation()
                          }}
                          style={{
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: gpsOriginMode === 'gps' ? '1.5px solid #0d9488' : '1px solid #334155',
                            background: gpsOriginMode === 'gps' ? 'rgba(13, 148, 136, 0.25)' : '#1e293b',
                            color: gpsOriginMode === 'gps' ? '#2dd4bf' : '#94a3b8',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>🔵 GPS Saya (Live)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setGpsOriginMode('point1')}
                          style={{
                            padding: '7px 8px',
                            borderRadius: '8px',
                            border: gpsOriginMode === 'point1' ? '1.5px solid #0284c7' : '1px solid #334155',
                            background: gpsOriginMode === 'point1' ? 'rgba(2, 132, 199, 0.25)' : '#1e293b',
                            color: gpsOriginMode === 'point1' ? '#38bdf8' : '#94a3b8',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>📍 Titik 1 (Manual)</span>
                        </button>
                      </div>
                    </div>

                    {/* Map Click Tip Info Banner */}
                    <div style={{ background: 'rgba(13, 148, 136, 0.12)', border: '1px solid rgba(45, 212, 191, 0.3)', borderRadius: '10px', padding: '8px 10px', fontSize: '0.73rem', color: '#2dd4bf', lineHeight: '1.4' }}>
                      💡 <strong>Tip Kemudahan:</strong> Anda bisa langsung <strong>menekan (klik) titik lokasi mana pun pada peta</strong> untuk menentukan Titik Asal &amp; Tujuan secara otomatis!
                    </div>

                    {/* Origin Selection */}
                    {gpsOriginMode === 'gps' ? (
                      <div style={{ background: '#1e293b', padding: '10px 12px', borderRadius: '10px', border: '1px solid #334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 700 }}>
                            {isFetchingGps ? '🔄 Meminta Lokasi GPS...' : (gpsUserPos ? gpsUserPos.name : 'Belum mengaktifkan GPS')}
                          </span>
                          <button
                            type="button"
                            onClick={handleRequestGpsLocation}
                            disabled={isFetchingGps}
                            style={{
                              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            {isFetchingGps ? 'Loading...' : 'Hidupkan GPS 📡'}
                          </button>
                        </div>
                        {gpsErrorMsg && (
                          <span style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '4px', display: 'block' }}>
                            {gpsErrorMsg}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, margin: 0 }}>
                            🟢 Titik Asal (Dari):
                          </label>
                          <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontStyle: 'italic' }}>atau klik titik di peta</span>
                        </div>
                        <select
                          value={gpsNavOrigin ? gpsNavOrigin.id : ''}
                          onChange={(e) => {
                            const pt = selectablePlaces.find((p) => p.id === e.target.value)
                            setGpsNavOrigin(pt || null)
                          }}
                          style={{ width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          <option value="">-- Pilih Lokasi Asal (Atau Klik Peta) --</option>
                          {selectablePlaces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Destination Selection */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 700 }}>
                        🔴 Titik Tujuan (Ke):
                      </label>
                      <select
                        value={gpsNavTarget ? gpsNavTarget.id : ''}
                        onChange={(e) => {
                          const pt = selectablePlaces.find((p) => p.id === e.target.value)
                          setGpsNavTarget(pt || null)
                        }}
                        style={{ width: '100%', padding: '7px 9px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        <option value="">-- Pilih Lokasi Tujuan --</option>
                        {selectablePlaces.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Calculation Results Card */}
                    {activeGpsCalculatedRoute ? (
                      <div style={{ background: 'rgba(13, 148, 136, 0.16)', border: '1px solid rgba(45, 212, 191, 0.4)', borderRadius: '12px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 700 }}>
                            {activeGpsCalculatedRoute.isRealRoad ? '🛣️ Jarak Jalan Raya:' : '📐 Jarak Spasial:'}
                          </span>
                          <strong style={{ fontSize: '1.05rem', color: '#2dd4bf' }}>
                            {activeGpsCalculatedRoute.distanceMeters >= 1000 ? `${activeGpsCalculatedRoute.distanceKm} km` : `${activeGpsCalculatedRoute.distanceMeters} meter`}
                          </strong>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.7rem', marginBottom: '12px' }}>
                          <div style={{ background: '#1e293b', padding: '6px 4px', borderRadius: '8px', textAlign: 'center' }}>
                            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem' }}>🚶 Kaki</span>
                            <strong style={{ color: '#facc15' }}>~{activeGpsCalculatedRoute.walkMins} mnt</strong>
                          </div>
                          <div style={{ background: '#1e293b', padding: '6px 4px', borderRadius: '8px', textAlign: 'center' }}>
                            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem' }}>🏍️ Motor</span>
                            <strong style={{ color: '#4ade80' }}>~{activeGpsCalculatedRoute.motorMins} mnt</strong>
                          </div>
                          <div style={{ background: '#1e293b', padding: '6px 4px', borderRadius: '8px', textAlign: 'center' }}>
                            <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem' }}>🚗 Mobil</span>
                            <strong style={{ color: '#38bdf8' }}>~{activeGpsCalculatedRoute.carMins} mnt</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                          <a
                            href={activeGpsCalculatedRoute.gmapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                              color: '#ffffff',
                              padding: '8px 12px',
                              borderRadius: '9px',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)',
                            }}
                          >
                            <Icon name="link" size={14} />
                            <span>Buka Navigasi Google Maps Live ↗</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              if (gpsOriginMode === 'point1') setGpsNavOrigin(null)
                              setGpsNavTarget(null)
                            }}
                            style={{
                              background: '#1e293b',
                              border: '1px solid #334155',
                              color: '#cbd5e1',
                              padding: '8px 12px',
                              borderRadius: '9px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Reset 🔄
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '6px 0' }}>
                        Pilih lokasi asal & tujuan untuk kalkulasi rute navigasi.
                      </div>
                    )}
                  </div>
                )}

                {/* Main Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !isGpsNavOpen
                    setIsGpsNavOpen(nextOpen)
                    if (nextOpen && gpsOriginMode === 'gps' && !gpsUserPos) {
                      handleRequestGpsLocation()
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isGpsNavOpen ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(13, 148, 136, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.2)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon name="link" size={16} />
                  <span>{isGpsNavOpen ? 'Tutup Navigasi ✕' : '🧭 Navigasi & Rute GPS'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function buildStatus(activeCount, loadedCount, featureCount, isLoading) {
  if (isLoading) return 'Memuat layer spasial...'
  if (!activeCount) return 'Pilih layer untuk ditampilkan'
  if (loadedCount < activeCount) return `Memuat ${loadedCount}/${activeCount} layer...`
  return `${featureCount.toLocaleString('id-ID')} Fitur Spasial Terfasilitasi`
}

export default SpatialMapPage
