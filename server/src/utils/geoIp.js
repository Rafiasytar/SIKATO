export async function resolveIpLocation(ipAddress) {
  const ip = String(ipAddress || '').replace('::ffff:', '').replace('::1', '127.0.0.1').trim()

  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip === 'localhost' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.31.')
  ) {
    return 'Jaringan Lokal (LAN / Localhost)'
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      if (data && data.status === 'success') {
        const parts = [data.city, data.regionName, data.country || data.countryCode].filter(Boolean)
        return parts.length > 0 ? parts.join(', ') : 'Lokasi Internet'
      }
    }
  } catch {
    // Silent fallback if API timeout or offline
  }

  return 'Koneksi Internet Publik'
}
