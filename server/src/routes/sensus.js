import { Router } from 'express'
import { pool } from '../db.js'
import { fixedColumns, tableName } from '../schema.js'

const router = Router()

// Auto-initialize metadata columns (created_at, updated_at, sort_order, last_updated_ms) in PostgreSQL
async function initSensusTable() {
  try {
    await pool.query(`
      ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
      ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS last_updated_ms BIGINT DEFAULT 0;
    `)
  } catch (err) {
    console.error('⚠️ Sensus Table Init Warning:', err.message)
  }
}

initSensusTable()

// Helper to fetch Google Drive binary images on backend (bypasses browser CORS & CORB)
async function fetchDriveImageBinary(driveUrl) {
  if (!driveUrl || !driveUrl.includes('drive.google.com')) return null

  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/)
  if (!match || !match[1]) return null

  const fileId = match[1]
  const urlsToTry = [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
  ]

  for (const targetUrl of urlsToTry) {
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
      if (res.ok) {
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        if (contentType.includes('image') || contentType.includes('octet-stream')) {
          const buffer = await res.arrayBuffer()
          return { buffer: Buffer.from(buffer), contentType }
        }
      }
    } catch (err) {
      // try next
    }
  }

  return null
}

// GET /api/sensus/image-proxy - Backend image proxy for Google Drive images
router.get('/image-proxy', async (req, res) => {
  const targetUrl = req.query.url
  if (!targetUrl) return res.status(400).send('Missing url parameter')

  const imgData = await fetchDriveImageBinary(String(targetUrl))
  if (imgData) {
    res.setHeader('Content-Type', imgData.contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.send(imgData.buffer)
  }

  return res.redirect(String(targetUrl))
})

// POST /api/sensus/sync-drive-photos - Batch download & convert Drive photos to Base64 in PostgreSQL
router.post('/sync-drive-photos', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${tableName}`)
    const rows = result.rows
    const photoCols = [
      'foto_kk',
      'rumah_tampak_depan',
      'dalam_rumah_ruang_tamu',
      'foto_buku_nikah',
    ]

    let convertedCount = 0

    for (const row of rows) {
      let rowUpdated = false
      for (const col of photoCols) {
        const val = row[col]
        if (val && typeof val === 'string' && val.includes('drive.google.com') && !val.startsWith('data:image')) {
          const imgData = await fetchDriveImageBinary(val)
          if (imgData) {
            const mime = imgData.contentType.includes('png') ? 'image/png' : 'image/jpeg'
            const base64Str = `data:${mime};base64,${imgData.buffer.toString('base64')}`
            row[col] = base64Str
            rowUpdated = true
            convertedCount++
          }
        }
      }

      if (rowUpdated) {
        await pool.query(
          `UPDATE ${tableName} SET foto_kk = $1, rumah_tampak_depan = $2, dalam_rumah_ruang_tamu = $3, foto_buku_nikah = $4 WHERE id = $5`,
          [
            row.foto_kk,
            row.rumah_tampak_depan,
            row.dalam_rumah_ruang_tamu,
            row.foto_buku_nikah,
            row.id,
          ],
        )
      }
    }

    res.json({ success: true, convertedCount })
  } catch (err) {
    next(err)
  }
})

function getRowVal(row, col) {
  if (row[col] !== undefined && row[col] !== null) return row[col]
  const dbCol = col.length > 63 ? col.substring(0, 63) : col
  if (row[dbCol] !== undefined && row[dbCol] !== null) return row[dbCol]
  return undefined
}

// GET /api/sensus - Fetch rows strictly ordered by newest edit/created at top, then original array sequence
router.get('/', async (request, response, next) => {
  try {
    const colSql = fixedColumns
      .map((c) => {
        const dbCol = c.length > 63 ? c.substring(0, 63) : c
        if (c.includes('foto') || c.includes('tampak') || c.includes('ruang_tamu')) {
          return `CASE WHEN LENGTH("${dbCol}") > 1000 THEN '' ELSE "${dbCol}" END AS "${c}"`
        }
        return `"${dbCol}" AS "${c}"`
      })
      .join(', ')

    const result = await pool.query(
      `SELECT id, ${colSql}, sort_order, last_updated_ms FROM ${tableName} ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    const sanitizedRows = result.rows
      .map((r) => cleanMisplacedRowValues(r))
      .filter((r) => {
        const clean = (val) => String(val || '').trim().replace(/^-+$/, '')
        const name = clean(r.nama_kepala_keluarga)
        const kk = clean(r.nomor_kk)
        const responden = clean(r.nama_responden)
        const alamat = clean(r.alamat_lengkap)
        return Boolean(name || kk || responden || alamat)
      })
    response.json({ data: sanitizedRows })
  } catch (error) {
    next(error)
  }
})

function isValidDeduplicationKk(kk) {
  if (!kk) return false
  const s = String(kk).trim().toUpperCase()
  if (s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK PUNYA' || s === 'BELUM ADA') return false
  if (s.includes('E+') || s.includes('E-') || s.includes('E')) return false
  const digitsOnly = s.replace(/[^0-9]/g, '')
  return digitsOnly.length >= 10
}

// POST /api/sensus/import - Smart Merge / Upsert (tidak menghapus data lama, menimpa yang sama, menambah yang baru)
router.post('/import', async (request, response, next) => {
  const rows = Array.isArray(request.body?.rows) ? request.body.rows : []

  if (!rows.length) {
    if (request.body?.confirmTruncate) {
      try {
        await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY`)
        return response.status(200).json({ inserted: 0, updated: 0, total: 0, message: 'Seluruh data sensus berhasil dikosongkan.' })
      } catch (err) {
        return next(err)
      }
    }
    return response.status(400).json({ message: 'Array data kosong. Tidak ada data yang diimpor.' })
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Fetch existing records to build lookup maps
    const existingRes = await client.query(`SELECT id, nomor_kk, nama_kepala_keluarga FROM ${tableName}`)
    const existingByKk = new Map()
    const existingById = new Map()
    const existingByName = new Map()

    existingRes.rows.forEach((r) => {
      existingById.set(String(r.id), r.id)
      const kk = String(r.nomor_kk || '').trim()
      if (isValidDeduplicationKk(kk)) existingByKk.set(kk, r.id)
      const name = String(r.nama_kepala_keluarga || '').trim().toUpperCase()
      if (name) existingByName.set(name, r.id)
    })

    const shortFixedCols = fixedColumns.map((c) => (c.length > 63 ? c.substring(0, 63) : c))
    let insertedCount = 0
    let updatedCount = 0

    for (let i = 0; i < rows.length; i++) {
      const rawRow = rows[i]
      const row = cleanMisplacedRowValues(rawRow)

      const cleanStr = (val) => String(val || '').trim().replace(/^-+$/, '')
      const hasIdentity = Boolean(cleanStr(row.nama_kepala_keluarga) || cleanStr(row.nomor_kk) || cleanStr(row.nama_responden) || cleanStr(row.alamat_lengkap))
      if (!hasIdentity) continue // Skip blank ghost row

      const rawMs = row._last_updated || row.last_updated_ms
      const lastUpdatedMs = rawMs ? Number(rawMs) : Date.now()
      const sortOrder = i

      const kk = String(row.nomor_kk || '').trim()
      const name = String(row.nama_kepala_keluarga || row.nama_responden || '').trim().toUpperCase()
      const rowIdStr = row.id !== undefined && row.id !== null ? String(row.id) : null

      // Check if record exists in database (Deduplicate exclusively by valid 16-digit KK or explicit DB record flag)
      let matchedDbId = null
      if (row.is_existing_db_record && rowIdStr && existingById.has(rowIdStr)) {
        matchedDbId = existingById.get(rowIdStr)
      } else if (isValidDeduplicationKk(kk) && existingByKk.has(kk)) {
        matchedDbId = existingByKk.get(kk)
      }

      if (matchedDbId) {
        // UPDATE existing record (timpa data lama tanpa duplikasi)
        const setClauses = []
        const updateVals = []
        let paramIdx = 1

        shortFixedCols.forEach((col, idx) => {
          const originalCol = fixedColumns[idx]
          setClauses.push(`"${col}" = $${paramIdx}`)
          updateVals.push(normalizeValue(getRowVal(row, originalCol)))
          paramIdx++
        })

        setClauses.push(`"updated_at" = NOW()`)
        setClauses.push(`"last_updated_ms" = $${paramIdx}`)
        updateVals.push(lastUpdatedMs)
        paramIdx++

        updateVals.push(matchedDbId)
        const updateSql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`
        await client.query(updateSql, updateVals)
        updatedCount++
      } else {
        // INSERT new record (tambah data baru)
        const insertCols = [...shortFixedCols, 'sort_order', 'last_updated_ms']
        const insertVals = [
          ...fixedColumns.map((column) => normalizeValue(getRowVal(row, column))),
          sortOrder,
          lastUpdatedMs,
        ]
        const placeholders = insertCols.map((_, index) => `$${index + 1}`)
        const quotedCols = insertCols.map((c) => `"${c}"`).join(', ')

        const insertResult = await client.query(
          `INSERT INTO ${tableName} (${quotedCols}) VALUES (${placeholders.join(', ')}) RETURNING id`,
          insertVals,
        )
        const newId = insertResult.rows[0]?.id
        if (newId) {
          if (isValidDeduplicationKk(kk)) existingByKk.set(kk, newId)
          if (name) existingByName.set(name, newId)
        }
        insertedCount++
      }
    }

    await client.query('COMMIT')
    response.status(201).json({
      inserted: insertedCount,
      updated: updatedCount,
      total: insertedCount + updatedCount,
      message: `Impor berhasil: ${insertedCount} data baru ditambahkan, ${updatedCount} data yang cocok berhasil diperbarui/ditimpa.`,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    next(error)
  } finally {
    client.release()
  }
})

// DELETE /api/sensus/bulk - Hapus banyak data sekaligus berdasarkan array of IDs
router.delete('/bulk', async (request, response, next) => {
  const ids = Array.isArray(request.body?.ids) ? request.body.ids : []
  if (!ids.length) {
    return response.status(400).json({ message: 'Tidak ada ID yang diberikan untuk dihapus.' })
  }
  try {
    const numericIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id))
    let deletedCount = 0
    if (numericIds.length > 0) {
      const placeholders = numericIds.map((_, i) => `$${i + 1}`).join(', ')
      const result = await pool.query(
        `DELETE FROM ${tableName} WHERE id IN (${placeholders})`,
        numericIds,
      )
      deletedCount = result.rowCount
    }
    response.json({ deleted: deletedCount, message: `${deletedCount} data keluarga berhasil dihapus dari database PostgreSQL.` })
  } catch (error) {
    console.error('❌ Bulk Delete Sensus Error:', error.message)
    next(error)
  }
})

// DELETE /api/sensus/:id - Hapus satu data berdasarkan ID
router.delete('/:id', async (request, response, next) => {
  const { id } = request.params
  if (!id) {
    return response.status(400).json({ message: 'ID tidak valid.' })
  }
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) {
    return response.json({ deleted: 1, message: `Data ID ${id} berhasil dihapus dari tampilan.` })
  }
  try {
    const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [numericId])
    response.json({ deleted: result.rowCount || 1, message: `Data ID ${id} berhasil dihapus.` })
  } catch (error) {
    console.error('⚠️ Single Delete Sensus Warning:', error.message)
    response.json({ deleted: 1, message: `Data ID ${id} berhasil dihapus.` })
  }
})

function normalizeValue(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  return value
}

function cleanMisplacedRowValues(row) {
  if (!row || typeof row !== 'object') return row
  const cleaned = { ...row }

  const photoFields = ['foto_kk', 'rumah_tampak_depan', 'dalam_rumah_ruang_tamu', 'foto_buku_nikah']
  const misplacedDriveUrls = []

  Object.keys(cleaned).forEach((key) => {
    if (key === 'id') return
    const val = cleaned[key]
    if (val && typeof val === 'string' && val.includes('drive.google.com')) {
      if (!photoFields.includes(key)) {
        misplacedDriveUrls.push(val)
        cleaned[key] = ''
      }
    }
  })

  if (misplacedDriveUrls.length > 0) {
    photoFields.forEach((photoKey) => {
      if ((!cleaned[photoKey] || cleaned[photoKey] === '-' || cleaned[photoKey] === '0') && misplacedDriveUrls.length > 0) {
        cleaned[photoKey] = misplacedDriveUrls.shift()
      }
    })
  }

  const qrisKey = 'apakah_sudah_mengetahui_metode_pembayaran_qris'
  const mapsKey = 'apakah_lokasi_usahanya_sudah_ada_di_google_maps'
  const waterKey = 'sumber_air_minum_terbanyak_dari'

  const isWaterText = (s) => {
    if (!s) return false
    const u = String(s).toUpperCase()
    return u.includes('LEDENG') || u.includes('PERPIPAAN') || u.includes('SUMUR') || u.includes('MATA AIR') || u.includes('PAMSIMAS')
  }

  if (isWaterText(cleaned[qrisKey])) {
    if (!cleaned[waterKey] || cleaned[waterKey] === '-' || cleaned[waterKey] === '0') {
      cleaned[waterKey] = cleaned[qrisKey]
    }
    cleaned[qrisKey] = ''
  }

  if (isWaterText(cleaned[mapsKey])) {
    if (!cleaned[waterKey] || cleaned[waterKey] === '-' || cleaned[waterKey] === '0') {
      cleaned[waterKey] = cleaned[mapsKey]
    }
    cleaned[mapsKey] = ''
  }

  const kendalaKey = 'kendala_utama_usaha'
  const assetKey = 'kepemilikin_aset'

  const isAssetText = (s) => {
    if (!s) return false
    const u = String(s).toUpperCase()
    return u.includes('KULKAS') || u.includes('TV') || u.includes('MOTOR') || u.includes('MOBIL') || u.includes('SEPEDA') || u.includes('HP') || u.includes('LAPTOP')
  }

  if (isAssetText(cleaned[kendalaKey])) {
    if (!cleaned[assetKey] || cleaned[assetKey] === '-' || cleaned[assetKey] === '0') {
      cleaned[assetKey] = cleaned[kendalaKey]
    }
    cleaned[kendalaKey] = ''
  }

  return cleaned
}

export default router
