export function parseCoords(xVal, yVal) {
  if (!xVal && !yVal) return null

  let x = parseFloat(String(xVal || '').replace(',', '.').trim())
  let y = parseFloat(String(yVal || '').replace(',', '.').trim())

  if (isNaN(x) || isNaN(y)) return null

  // 1. Swapped check: X is near 0/negative (-0.3) and Y is near 100
  if (Math.abs(x) < 20 && Math.abs(y) > 80) {
    const temp = x
    x = y
    y = temp
  }

  // 2. Large integer scale typo auto-fixes (e.g. 1005329574 -> 100.5329574)
  if (Math.abs(x) > 10000000.0) x = x / 10000000.0
  else if (Math.abs(x) > 100000.0) x = x / 100000.0
  else if (Math.abs(x) > 1000.0) x = x / 10.0

  if (Math.abs(y) > 1000000.0) y = y / 10000000.0
  else if (Math.abs(y) > 100.0) y = y / 1000.0
  else if (Math.abs(y) > 10.0) y = y / 100.0
  else if (Math.abs(y) > 1.0) y = y / 10.0

  if (Math.abs(x) < 1.0 && Math.abs(x) > 0.0) x = x * 1000.0
  else if (Math.abs(x) < 20.0 && Math.abs(x) >= 1.0) x = x * 10.0

  // 3. Ensure West Sumatra Latitude is negative (south of equator ~ -0.34)
  if (y > 0 && y < 5) y = -y

  // 4. Return formatted numbers
  if (x >= 98.0 && x <= 103.0 && y >= -3.0 && y <= 1.0) {
    return { lat: y, lng: x }
  }

  return null
}

// Precise Nagari Tabek Patah geographic bounding box (Kecamatan Salimpaung, Tanah Datar)
// Nagari Tabek Patah pins strictly fall within Lng 100.510 - 100.548 and Lat -0.355 - -0.310
export const TABEK_PATAH_BOUNDS = {
  minLng: 100.505,
  maxLng: 100.550,
  minLat: -0.355,
  maxLat: -0.310,
}

export function classifyCoordinateStatus(xVal, yVal) {
  const rawX = String(xVal || '').trim()
  const rawY = String(yVal || '').trim()

  const isEmptyVal = (v) => !v || v === '-' || v === '0' || v.toUpperCase() === 'NULL' || v === '0.0'

  if (isEmptyVal(rawX) || isEmptyVal(rawY)) {
    return { isValid: false, code: 'EMPTY', reason: 'Koordinat Kosong / Belum Diisi' }
  }

  const cleanX = rawX.replace(',', '.')
  const cleanY = rawY.replace(',', '.')
  const numX = parseFloat(cleanX)
  const numY = parseFloat(cleanY)

  if (isNaN(numX) || isNaN(numY)) {
    return { isValid: false, code: 'FORMAT_ERROR', reason: 'Format / Typo Koordinat Tidak Valid' }
  }

  const parsed = parseCoords(xVal, yVal)

  if (!parsed || isNaN(parsed.lat) || isNaN(parsed.lng)) {
    return { isValid: false, code: 'FORMAT_ERROR', reason: 'Format / Typo Koordinat Tidak Terbaca' }
  }

  // Check if coordinates fall strictly within Nagari Tabek Patah bounding area
  const inLng = parsed.lng >= TABEK_PATAH_BOUNDS.minLng && parsed.lng <= TABEK_PATAH_BOUNDS.maxLng
  const inLat = parsed.lat >= TABEK_PATAH_BOUNDS.minLat && parsed.lat <= TABEK_PATAH_BOUNDS.maxLat

  if (!inLng || !inLat) {
    return {
      isValid: false,
      code: 'OUT_OF_BOUNDS',
      reason: `Di Luar Area Nagari Tabek Patah (${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})`,
      parsedLat: parsed.lat,
      parsedLng: parsed.lng,
    }
  }

  return {
    isValid: true,
    code: 'VALID',
    reason: 'Koordinat Valid di Nagari Tabek Patah',
    parsedLat: parsed.lat,
    parsedLng: parsed.lng,
  }
}
