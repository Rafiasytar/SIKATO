import { getStaticSpatialLayer, getStaticSpatialLayers } from './staticLayers'

export async function fetchSensusRows() {
  const response = await fetch('/api/sensus')

  if (!response.ok) {
    throw new Error('Gagal mengambil data keluarga.')
  }

  const result = await response.json()
  return result.data || []
}

export async function importSensusRows(rows) {
  const response = await fetch('/api/sensus/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rows }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal menyimpan data ke backend.')
  }

  return response.json()
}

// Hapus satu data keluarga berdasarkan ID dari PostgreSQL
export async function deleteSensusRow(id) {
  const response = await fetch(`/api/sensus/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal menghapus data dari database.')
  }

  return response.json()
}

// Hapus banyak data keluarga sekaligus berdasarkan array of IDs dari PostgreSQL
export async function bulkDeleteSensusRows(ids) {
  const response = await fetch('/api/sensus/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal menghapus data secara massal dari database.')
  }

  return response.json()
}

export async function syncDrivePhotosBackend(isIndividu = false) {
  const endpoint = isIndividu ? '/api/individu/sync-drive-photos' : '/api/sensus/sync-drive-photos'
  const response = await fetch(endpoint, { method: 'POST' })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal mengompres foto Drive di backend.')
  }

  return response.json()
}

export async function fetchIndividuRows() {
  const response = await fetch('/api/individu')

  if (!response.ok) {
    throw new Error('Gagal mengambil data individu.')
  }

  const result = await response.json()
  return result.data || []
}

export async function importIndividuRows(rows) {
  const response = await fetch('/api/individu/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rows }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal menyimpan data individu ke backend.')
  }

  return response.json()
}

// Hapus satu data individu berdasarkan ID dari PostgreSQL
export async function deleteIndividuRow(id) {
  const response = await fetch(`/api/individu/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal menghapus data individu dari database.')
  }

  return response.json()
}

// Hapus banyak data individu sekaligus berdasarkan array of IDs dari PostgreSQL
export async function bulkDeleteIndividuRows(ids) {
  const response = await fetch('/api/individu/bulk', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal menghapus data individu secara massal dari database.')
  }

  return response.json()
}

export async function fetchSpatialLayers() {
  try {
    const staticLayers = getStaticSpatialLayers()
    if (staticLayers && staticLayers.length > 0) {
      return staticLayers
    }
  } catch (e) {
    // Fallback to API if static layers fail
  }

  const response = await fetch('/api/spatial/layers')

  if (!response.ok) {
    throw new Error('Gagal mengambil daftar layer spasial.')
  }

  const result = await response.json()
  return result.data
}

export async function fetchSpatialLayer(layerName) {
  try {
    const staticData = getStaticSpatialLayer(layerName)
    if (staticData && staticData.data) {
      return staticData
    }
  } catch (e) {
    // Fallback to API if static layer fails
  }

  const response = await fetch(`/api/spatial/${encodeURIComponent(layerName)}`)

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || 'Gagal mengambil data layer spasial.')
  }

  const result = await response.json()
  return result
}

export async function loginAdmin(username, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Login gagal. Silakan periksa kembali username dan password Anda.')
  }

  return data
}

export async function updateAdminProfile(payload) {
  const response = await fetch('/api/auth/update-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Gagal memperbarui profil.')
  }

  return data
}

export async function fetchActivityLogs() {
  const response = await fetch('/api/logs')

  if (!response.ok) {
    throw new Error('Gagal mengambil riwayat log aktivitas.')
  }

  const result = await response.json()
  return result.data || []
}

export async function logActivity(actionType, description, userName = 'Administrator') {
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName, actionType, description }),
    })
    return response.json()
  } catch (err) {
    console.warn('Failed to record activity log:', err.message)
  }
}

export async function clearActivityLogs() {
  const response = await fetch('/api/logs/clear', {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Gagal membersihkan log aktivitas.')
  }

  return response.json()
}

export async function fetchAdminUsers() {
  const response = await fetch('/api/auth/users')
  if (!response.ok) {
    throw new Error('Gagal mengambil daftar akun admin.')
  }
  const result = await response.json()
  return result.data || []
}

export async function registerAdminUser(payload) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Gagal mendaftarkan akun admin baru.')
  }
  return data
}

export async function deleteAdminUser(id) {
  const response = await fetch(`/api/auth/users/${id}`, {
    method: 'DELETE',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Gagal menghapus akun admin.')
  }
  return data
}

export async function updateAdminUser(id, payload) {
  const response = await fetch(`/api/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Gagal memperbarui akun admin.')
  }
  return data
}

export async function verifySuperAdminPassword(username, password) {
  const response = await fetch('/api/auth/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Password Super Admin salah.')
  }
  return data
}
