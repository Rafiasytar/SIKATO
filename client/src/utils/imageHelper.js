/**
 * Helper to parse Google Drive URLs and compress images into sharp, HD WebP data URLs.
 */

// Extract raw Google Drive File ID
export function getGoogleDriveFileId(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// 1. Google Drive Thumbnail API format (Best CORS & embedding compatibility)
export function getGoogleDriveThumbnailUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()

  if (trimmed.startsWith('data:image')) {
    return trimmed
  }

  if (trimmed.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
    return trimmed
  }

  const fileId = getGoogleDriveFileId(trimmed)
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
  }

  return trimmed
}

// 2. Google lh3 CDN format (Fallback)
export function getGoogleDriveFallbackUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('data:image')) {
    return trimmed
  }
  const fileId = getGoogleDriveFileId(trimmed)
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`
  }
  return trimmed
}

/**
 * Compresses an image (File, Blob, Data URL, or Image URL) into a high-definition,
 * lightweight WebP / JPEG data URL (~80KB - 150KB) so it saves cleanly to the database
 * without taking up huge storage space, while remaining HD sharp.
 */
export async function compressImage(source, maxWidth = 1200, maxHeight = 1200, quality = 0.82) {
  if (!source) return ''
  const sourceStr = typeof source === 'string' ? source.trim() : ''

  // If already lightweight base64 (<250KB), return as is
  if (sourceStr.startsWith('data:image') && sourceStr.length < 350000) {
    return sourceStr
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to WebP format if supported, else JPEG
      try {
        const webpData = canvas.toDataURL('image/webp', quality)
        if (webpData.startsWith('data:image/webp')) {
          resolve(webpData)
          return
        }
      } catch (e) {
        // Fallback to JPEG
      }
      resolve(canvas.toDataURL('image/jpeg', quality))
    }

    img.onerror = () => {
      // If CORS or image loading fails, return source as is
      resolve(sourceStr)
    }

    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.onerror = () => resolve('')
      reader.readAsDataURL(source)
    } else if (sourceStr) {
      // Convert Drive URL to Thumbnail URL for Canvas drawing
      const thumbUrl = getGoogleDriveThumbnailUrl(sourceStr)
      img.src = thumbUrl
    } else {
      resolve('')
    }
  })
}

/**
 * Automatically iterates over dataset rows, finds Google Drive links in photo fields,
 * downloads & compresses them into sharp HD WebP Base64 images (~80KB-150KB),
 * and replaces the Google Drive links with the WebP image data!
 */
export async function syncAndCompressDrivePhotos(rows, isIndividu = false, onProgress = null) {
  let convertedCount = 0
  let errorCount = 0
  const updatedRows = JSON.parse(JSON.stringify(rows))
  const photoFields = isIndividu
    ? ['foto_akta_kelahiran']
    : [
        'foto_kk',
        'foto_rumah_tampak_depan',
        'foto_dalam_rumah_ruang_tamu',
        'foto_lampiran_pendukung_lainnya_jika_ada',
      ]

  const driveItems = []
  updatedRows.forEach((row, rIdx) => {
    photoFields.forEach((fieldId) => {
      const val = row[fieldId]
      if (val && typeof val === 'string' && val.includes('drive.google.com') && !val.startsWith('data:image')) {
        driveItems.push({ rIdx, fieldId, url: val })
      }
    })
  })

  if (!driveItems.length) {
    return { updatedRows, convertedCount: 0, totalTarget: 0 }
  }

  for (let i = 0; i < driveItems.length; i++) {
    const item = driveItems[i]
    if (onProgress) {
      onProgress({ current: i + 1, total: driveItems.length, field: item.fieldId })
    }

    try {
      const compressedWebP = await compressImage(item.url, 1200, 1200, 0.82)
      if (compressedWebP && compressedWebP.startsWith('data:image')) {
        updatedRows[item.rIdx][item.fieldId] = compressedWebP
        convertedCount++
      } else {
        errorCount++
      }
    } catch (err) {
      errorCount++
    }
  }

  return { updatedRows, convertedCount, totalTarget: driveItems.length }
}

export function fileToDataURL(file) {
  return compressImage(file, 1200, 1200, 0.82)
}

export function isPhotoField(fieldId) {
  if (!fieldId) return false
  const fid = fieldId.toLowerCase()
  return (
    fid.includes('foto') ||
    fid.includes('rumah_tampak_depan') ||
    fid.includes('dalam_rumah') ||
    fid.includes('lampiran')
  )
}
