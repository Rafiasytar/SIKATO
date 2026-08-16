const ROW_CACHE_KEYS = ['bi_tabek_patah_rows', 'bi_tabek_patah_rows_individu']
const MAX_CACHED_ROWS = 10000
const MAX_CACHE_BYTES = 5 * 1024 * 1024

export function cleanupOversizedDataCache() {
  ROW_CACHE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return
      if (raw.length > MAX_CACHE_BYTES) {
        localStorage.removeItem(key)
      }
    } catch (err) {
      console.warn('Gagal membersihkan cache data:', err.message)
    }
  })
}

export function readCachedRows(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw.length > MAX_CACHE_BYTES) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCachedRows(key, rowsData) {
  if (!Array.isArray(rowsData) || rowsData.length === 0) {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.warn('Gagal menghapus cache data:', err.message)
    }
    return
  }

  // Dataset besar selalu diambil dari PostgreSQL, jangan disimpan di localStorage.
  if (rowsData.length > MAX_CACHED_ROWS) {
    try {
      localStorage.removeItem(key)
    } catch (err) {
      console.warn('Gagal menghapus cache data besar:', err.message)
    }
    return
  }

  try {
    const sanitizedRows = rowsData.map((row) => {
      const cleaned = { ...row }
      Object.keys(cleaned).forEach((fieldKey) => {
        if (typeof cleaned[fieldKey] === 'string' && (cleaned[fieldKey].startsWith('data:image') || cleaned[fieldKey].length > 500)) {
          delete cleaned[fieldKey]
        }
      })
      return cleaned
    })
    const payload = JSON.stringify(sanitizedRows)
    if (payload.length > MAX_CACHE_BYTES) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, payload)
  } catch (err) {
    console.warn(`LocalStorage tidak dapat menyimpan cache ${key}:`, err.message)
    try {
      localStorage.removeItem(key)
    } catch (removeErr) {
      console.warn('Gagal membersihkan cache setelah quota error:', removeErr.message)
    }
  }
}
