import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon'
import { parseCoords } from '../utils/coordParser'

function HouseLocationMapModal({ personName, alamat, coordX, coordY, onClose }) {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)

  const parsed = parseCoords(coordX, coordY)
  const gmapsUrl = parsed
    ? `https://www.google.com/maps/search/?api=1&query=${parsed.lat},${parsed.lng}`
    : ''

  useEffect(() => {
    if (!parsed || !mapContainerRef.current) return

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current).setView([parsed.lat, parsed.lng], 17)
    mapInstanceRef.current = map

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | GIS Tabek Patah',
    }).addTo(map)

    // Custom Web GIS Modern Minimalist Micro-Dot Marker
    const customIcon = L.divIcon({
      className: 'modern-resident-dot-container',
      html: `
        <div class="modern-gis-dot-wrapper">
          <div class="modern-gis-dot-body" style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); --dot-rgb: 13, 148, 136;">
            <div class="modern-gis-dot-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
      tooltipAnchor: [0, -16],
    })

    const marker = L.marker([parsed.lat, parsed.lng], { icon: customIcon }).addTo(map)

    marker.bindTooltip(`
      <div class="custom-gis-tooltip">🏠 <strong>${personName}</strong></div>
    `, { direction: 'top', offset: [0, -16], opacity: 1 })

    const popupContent = `
      <div style="font-family: var(--font-body), sans-serif; width: 240px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: #ffffff; padding: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.2rem;">🏠</span>
          <div>
            <h3 style="margin: 0; font-size: 0.92rem; font-weight: 800; color: #ffffff; line-height: 1.2;">${personName}</h3>
            <span style="font-size: 0.72rem; opacity: 0.9; font-weight: 600;">Lokasi Rumah Warga</span>
          </div>
        </div>
        <div style="padding: 12px;">
          <p style="margin: 0 0 8px 0; font-size: 0.8rem; color: #334155; font-weight: 500; display: flex; align-items: flex-start; gap: 5px;">
            <span>📍</span> <span>${alamat || 'Nagari Tabek Patah'}</span>
          </p>
          <div style="font-size: 0.76rem; color: #64748b; margin-bottom: 12px; background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <strong>Koordinat Presisi:</strong><br/>
            Lat: ${parsed.lat.toFixed(6)} | Lng: ${parsed.lng.toFixed(6)}
          </div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 8px 12px;
            border-radius: 8px;
            text-decoration: none;
            box-shadow: 0 3px 8px rgba(2, 132, 199, 0.3);
          ">
            🚗 Buka di Google Maps ↗
          </a>
        </div>
      </div>
    `

    marker.bindPopup(popupContent).openPopup()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [parsed, personName, alamat, gmapsUrl])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="map-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with ONLY title */}
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--primary-teal)', display: 'inline-flex' }}>
              <Icon name="rumah" size={24} />
            </span>
            <div>
              <span className="eyebrow">Visualisasi Peta Spasial GIS</span>
              <h2 style={{ margin: 0 }}>Lokasi Rumah: {personName}</h2>
            </div>
          </div>
        </header>

        <div className="map-modal-body">
          {parsed ? (
            <div ref={mapContainerRef} className="map-embed-container" />
          ) : (
            <div className="map-error-state">
              <span style={{ color: '#0d9488', marginBottom: '8px', display: 'inline-flex' }}>
                <Icon name="kawasan_nagari" size={36} />
              </span>
              <h3>Koordinat Lokasi Belum Tersedia</h3>
              <p>Data Koordinat X ({coordX || 'Kosong'}) dan Y ({coordY || 'Kosong'}) tidak valid atau belum diisi.</p>
            </div>
          )}
        </div>

        {/* Footer with Unified SVG Icons */}
        <footer className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="coord-info-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="kawasan_nagari" size={15} />
            <span>
              <strong>Koordinat:</strong> {coordY || '-'} (Lat), {coordX || '-'} (Lng)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {parsed && (
              <a
                href={gmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="secondary-button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon name="link" size={15} />
                <span>Buka Google Maps</span>
              </a>
            )}
            <button className="primary-button" type="button" onClick={onClose}>
              Tutup Peta
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default HouseLocationMapModal
