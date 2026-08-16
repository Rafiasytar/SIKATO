/**
 * Utility to extract & normalize Jorong from address string in Nagari Tabek Patah
 * Nagari Tabek Patah has 4 main Jorong:
 * 1. Jorong Tabek Patah
 * 2. Jorong Data
 * 3. Jorong Koto
 * 4. Jorong Koto Alam
 */

export function parseJorongCategory(address) {
  if (!address) return 'unknown'

  const rawAddr = String(address).toLowerCase().trim()

  // Remove district/regency/province text "tanah datar", "salimpaung", etc.
  // to avoid false positive matching "data" inside "tanah datar"
  const cleanedAddr = rawAddr
    .replace(/tanah\s*datar/g, '')
    .replace(/kabupaten/g, '')
    .replace(/kab\./g, '')
    .replace(/kecamatan/g, '')
    .replace(/kec\./g, '')
    .replace(/nagari\s*tabek\s*patah/g, '')

  // 1. Jorong Koto Alam (Must be checked BEFORE Jorong Koto!)
  if (cleanedAddr.includes('koto alam') || cleanedAddr.includes('koto-alam') || cleanedAddr.includes('kotoalam')) {
    return 'koto_alam'
  }

  // 2. Jorong Koto (Contains 'koto' but NOT 'koto alam')
  if (cleanedAddr.includes('koto')) {
    return 'koto'
  }

  // 3. Jorong Tabek Patah
  if (cleanedAddr.includes('tabek patah') || cleanedAddr.includes('tabek-patah') || cleanedAddr.includes('tabekpatah')) {
    return 'tabek_patah'
  }

  // 4. Jorong Data (Contains 'data' or 'datar' or 'jorong data', AFTER 'tanah datar' has been cleaned out!)
  if (cleanedAddr.includes('jorong data') || cleanedAddr.includes('jrg data') || cleanedAddr.includes('data')) {
    return 'data'
  }

  // Fallback checks on original raw address if cleanedAddr didn't catch it
  if (rawAddr.includes('koto alam') || rawAddr.includes('koto-alam')) return 'koto_alam'
  if (rawAddr.includes('koto')) return 'koto'
  if (rawAddr.includes('tabek patah')) return 'tabek_patah'
  if (rawAddr.includes('jorong data') || rawAddr.includes('jrg. data')) return 'data'

  return 'other'
}

export function matchesJorongFilter(address, filterVal) {
  if (!filterVal || filterVal === 'all') return true
  const jorongCat = parseJorongCategory(address)
  return jorongCat === filterVal
}

export function getJorongLabel(address) {
  const cat = parseJorongCategory(address)
  switch (cat) {
    case 'koto_alam':
      return 'Jorong Koto Alam'
    case 'koto':
      return 'Jorong Koto'
    case 'data':
      return 'Jorong Data'
    case 'tabek_patah':
      return 'Jorong Tabek Patah'
    default:
      return String(address || 'Alamat Belum Terisi').trim()
  }
}
