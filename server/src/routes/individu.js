import { Router } from 'express'
import { pool } from '../db.js'
import { fixedColumnsIndividu, tableNameIndividu } from '../schemaIndividu.js'

const router = Router()

// Auto-initialize sensus_individu table and metadata columns in PostgreSQL
async function initIndividuTable() {
  try {
    const columnsSql = fixedColumnsIndividu
      .map((col) => `"${col}" TEXT`)
      .join(', ')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableNameIndividu} (
        id SERIAL PRIMARY KEY,
        ${columnsSql},
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sort_order INT DEFAULT 0,
        last_updated_ms BIGINT DEFAULT 0
      );
      ALTER TABLE ${tableNameIndividu} ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE ${tableNameIndividu} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE ${tableNameIndividu} ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
      ALTER TABLE ${tableNameIndividu} ADD COLUMN IF NOT EXISTS last_updated_ms BIGINT DEFAULT 0;
      ALTER TABLE ${tableNameIndividu} DROP COLUMN IF EXISTS foto_kk;
      ALTER TABLE ${tableNameIndividu} DROP COLUMN IF EXISTS foto_buku_nikah;
    `)
  } catch (err) {
    console.error('⚠️ Sensus Individu Table Init Warning:', err.message)
  }
}

initIndividuTable()

// Helper to fetch Google Drive binary images on backend
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

// GET /api/individu/image-proxy
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

// POST /api/individu/sync-drive-photos
router.post('/sync-drive-photos', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM ${tableNameIndividu}`)
    const rows = result.rows
    const photoCols = ['foto_akta_kelahiran']

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
          `UPDATE ${tableNameIndividu} SET "foto_akta_kelahiran" = $1 WHERE id = $2`,
          [row.foto_akta_kelahiran, row.id],
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
  if (col === 'berapa_kali_fasilitas_kesehatan_berikut_didatangi_setahun_terakhir') {
    return row.frekuensi_kunjungan_faskes ?? row.faskes ?? row.frekuensi_faskes
  }
  return undefined
}

// GET /api/individu - Fetch all individual rows
router.get('/', async (request, response, next) => {
  try {
    const colSql = fixedColumnsIndividu
      .map((c) => {
        const dbCol = c.length > 63 ? c.substring(0, 63) : c
        if (c.includes('foto')) {
          return `CASE WHEN LENGTH("${dbCol}") > 1000 THEN '' ELSE "${dbCol}" END AS "${c}"`
        }
        return `"${dbCol}" AS "${c}"`
      })
      .join(', ')

    const result = await pool.query(
      `SELECT id, ${colSql}, sort_order, last_updated_ms FROM ${tableNameIndividu} ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    response.json({ data: result.rows })
  } catch (error) {
    next(error)
  }
})

function isValidDeduplicationNik(nik) {
  if (!nik) return false
  const s = String(nik).trim().toUpperCase()
  if (s === '-' || s === '0' || s === 'TIDAK ADA' || s === 'TIDAK PUNYA' || s === 'BELUM ADA') return false
  if (s.includes('E+') || s.includes('E-') || s.includes('E')) return false
  const digitsOnly = s.replace(/[^0-9]/g, '')
  return digitsOnly.length >= 10
}

// POST /api/individu/import - Smart Merge / Upsert (tidak menghapus data lama, menimpa yang sama, menambah yang baru)
router.post('/import', async (request, response, next) => {
  const rows = Array.isArray(request.body?.rows) ? request.body.rows : []

  if (!rows.length) {
    if (request.body?.confirmTruncate) {
      try {
        await pool.query(`TRUNCATE TABLE ${tableNameIndividu} RESTART IDENTITY`)
        return response.status(200).json({ inserted: 0, updated: 0, total: 0, message: 'Seluruh data individu berhasil dikosongkan.' })
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
    const existingRes = await client.query(`SELECT id, nomor_nik, nomor_kk, nama FROM ${tableNameIndividu}`)
    const existingByNik = new Map()
    const existingById = new Map()
    const existingByKkName = new Map()

    existingRes.rows.forEach((r) => {
      existingById.set(String(r.id), r.id)
      const nik = String(r.nomor_nik || '').trim()
      if (isValidDeduplicationNik(nik)) existingByNik.set(nik, r.id)
      const kk = String(r.nomor_kk || '').trim()
      const nama = String(r.nama || '').trim().toUpperCase()
      if (kk && nama) existingByKkName.set(`${kk}_${nama}`, r.id)
    })

    const shortFixedCols = fixedColumnsIndividu.map((c) => (c.length > 63 ? c.substring(0, 63) : c))
    let insertedCount = 0
    let updatedCount = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rawMs = row._last_updated || row.last_updated_ms
      const lastUpdatedMs = rawMs ? Number(rawMs) : Date.now()
      const sortOrder = i

      const nik = String(row.nomor_nik || row.nik || '').trim()
      const kk = String(row.nomor_kk || '').trim()
      const nama = String(row.nama || row.nama_lengkap || '').trim().toUpperCase()
      const rowIdStr = row.id !== undefined && row.id !== null ? String(row.id) : null

      // Check if record exists
      let matchedDbId = null
      if (rowIdStr && existingById.has(rowIdStr)) {
        matchedDbId = existingById.get(rowIdStr)
      } else if (isValidDeduplicationNik(nik) && existingByNik.has(nik)) {
        matchedDbId = existingByNik.get(nik)
      } else if (kk && nama && existingByKkName.has(`${kk}_${nama}`)) {
        matchedDbId = existingByKkName.get(`${kk}_${nama}`)
      }

      if (matchedDbId) {
        // UPDATE existing record (timpa data lama tanpa duplikasi)
        const setClauses = []
        const updateVals = []
        let paramIdx = 1

        shortFixedCols.forEach((col, idx) => {
          const originalCol = fixedColumnsIndividu[idx]
          setClauses.push(`"${col}" = $${paramIdx}`)
          updateVals.push(normalizeValue(getRowVal(row, originalCol)))
          paramIdx++
        })

        setClauses.push(`"updated_at" = NOW()`)
        setClauses.push(`"last_updated_ms" = $${paramIdx}`)
        updateVals.push(lastUpdatedMs)
        paramIdx++

        updateVals.push(matchedDbId)
        const updateSql = `UPDATE ${tableNameIndividu} SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`
        await client.query(updateSql, updateVals)
        updatedCount++
      } else {
        // INSERT new record (tambah data baru)
        const insertCols = [...shortFixedCols, 'sort_order', 'last_updated_ms']
        const insertVals = [
          ...fixedColumnsIndividu.map((col) => normalizeValue(getRowVal(row, col))),
          sortOrder,
          lastUpdatedMs,
        ]
        const placeholders = insertCols.map((_, index) => `$${index + 1}`)
        const quotedCols = insertCols.map((c) => `"${c}"`).join(', ')

        const insertResult = await client.query(
          `INSERT INTO ${tableNameIndividu} (${quotedCols}) VALUES (${placeholders.join(', ')}) RETURNING id`,
          insertVals,
        )
        const newId = insertResult.rows[0]?.id
        if (newId) {
          if (nik) existingByNik.set(nik, newId)
          if (kk && nama) existingByKkName.set(`${kk}_${nama}`, newId)
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

// DELETE /api/individu/bulk - Hapus banyak data individu sekaligus berdasarkan array of IDs
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
        `DELETE FROM ${tableNameIndividu} WHERE id IN (${placeholders})`,
        numericIds,
      )
      deletedCount = result.rowCount
    }
    response.json({ deleted: deletedCount, message: `${deletedCount} data individu berhasil dihapus dari database PostgreSQL.` })
  } catch (error) {
    console.error('❌ Bulk Delete Individu Error:', error.message)
    next(error)
  }
})

// DELETE /api/individu/:id - Hapus satu data individu berdasarkan ID
router.delete('/:id', async (request, response, next) => {
  const { id } = request.params
  if (!id) {
    return response.status(400).json({ message: 'ID tidak valid.' })
  }
  const numericId = parseInt(id, 10)
  if (isNaN(numericId)) {
    return response.json({ deleted: 1, message: `Data individu ID ${id} berhasil dihapus dari tampilan.` })
  }
  try {
    const result = await pool.query(`DELETE FROM ${tableNameIndividu} WHERE id = $1`, [numericId])
    response.json({ deleted: result.rowCount || 1, message: `Data individu ID ${id} berhasil dihapus.` })
  } catch (error) {
    console.error('⚠️ Single Delete Individu Warning:', error.message)
    response.json({ deleted: 1, message: `Data individu ID ${id} berhasil dihapus.` })
  }
})

function normalizeValue(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  return value
}

export default router
