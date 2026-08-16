import { pool } from './db.js'

async function fetchDriveImageBinary(driveUrl) {
  if (!driveUrl || typeof driveUrl !== 'string' || !driveUrl.includes('drive.google.com') || driveUrl.startsWith('data:image')) {
    return null
  }

  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || driveUrl.match(/id=([a-zA-Z0-9_-]+)/)
  if (!match || !match[1]) return null

  const fileId = match[1]
  const urlsToTry = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
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
        const contentType = res.headers.get('content-type') || ''
        if (contentType.includes('image')) {
          const buffer = await res.arrayBuffer()
          const base64 = Buffer.from(buffer).toString('base64')
          const mime = contentType.includes('png') ? 'image/png' : 'image/jpeg'
          return `data:${mime};base64,${base64}`
        }
      }
    } catch (err) {
      // try next
    }
  }

  return null
}

async function convertAllPhotos() {
  console.log('🚀 Starting Google Drive photo conversion to PostgreSQL Base64...')

  // 1. Process sensus_keluarga
  try {
    const sensusRes = await pool.query('SELECT * FROM sensus_keluarga')
    const rows = sensusRes.rows
    console.log(`Found ${rows.length} rows in sensus_keluarga. Scanning photo columns...`)

    const cols = ['foto_kk', 'rumah_tampak_depan', 'dalam_rumah_ruang_tamu', 'foto_buku_nikah']

    let totalConverted = 0

    for (const row of rows) {
      let updated = false
      for (const col of cols) {
        const val = row[col]
        if (val && typeof val === 'string' && val.includes('drive.google.com') && !val.startsWith('data:image')) {
          console.log(`Converting sensus_keluarga ID ${row.id} - ${col}...`)
          const b64 = await fetchDriveImageBinary(val)
          if (b64) {
            row[col] = b64
            updated = true
            totalConverted++
            console.log(`✅ Converted ${col} for ID ${row.id}`)
          }
        }
      }

      if (updated) {
        await pool.query(
          `UPDATE sensus_keluarga SET foto_kk = $1, rumah_tampak_depan = $2, dalam_rumah_ruang_tamu = $3, foto_buku_nikah = $4 WHERE id = $5`,
          [row.foto_kk, row.rumah_tampak_depan, row.dalam_rumah_ruang_tamu, row.foto_buku_nikah, row.id]
        )
      }
    }

    console.log(`🎉 Successfully converted ${totalConverted} Drive photos in sensus_keluarga!`)
  } catch (err) {
    console.error('Error processing sensus_keluarga:', err.message)
  }

  // 2. Process sensus_individu
  try {
    const indRes = await pool.query('SELECT * FROM sensus_individu')
    const rowsInd = indRes.rows
    console.log(`Found ${rowsInd.length} rows in sensus_individu. Scanning photo columns...`)

    const indCols = ['foto_kk', 'foto_akta_kelahiran', 'foto_buku_nikah']
    let indConverted = 0

    for (const row of rowsInd) {
      let updated = false
      for (const col of indCols) {
        const val = row[col]
        if (val && typeof val === 'string' && val.includes('drive.google.com') && !val.startsWith('data:image')) {
          console.log(`Converting sensus_individu ID ${row.id} - ${col}...`)
          const b64 = await fetchDriveImageBinary(val)
          if (b64) {
            row[col] = b64
            updated = true
            indConverted++
            console.log(`✅ Converted individu ${col} for ID ${row.id}`)
          }
        }
      }

      if (updated) {
        await pool.query(
          `UPDATE sensus_individu SET "foto_kk" = $1, "foto_akta_kelahiran" = $2, "foto_buku_nikah" = $3 WHERE id = $4`,
          [row.foto_kk, row.foto_akta_kelahiran, row.foto_buku_nikah, row.id]
        )
      }
    }

    console.log(`🎉 Successfully converted ${indConverted} Drive photos in sensus_individu!`)
  } catch (err) {
    console.error('Error processing sensus_individu:', err.message)
  }

  console.log('🎉 ALL GOOGLE DRIVE PHOTOS CONVERTED TO BASE64 IN POSTGRESQL!')
  process.exit(0)
}

convertAllPhotos()
