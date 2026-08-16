import readXlsxFile, { readSheet } from 'read-excel-file/browser'
import { normalizeColumnName } from './formSchema'

// Field Alias / Keyword mapping for robust census header matching
const FIELD_ALIASES = {
  nomor_kk: ['nomor kk', 'no kk', 'kk', 'kartu keluarga'],
  nama_kepala_keluarga: ['nama kepala keluarga', 'kepala keluarga', 'nama kk'],
  nomor_hp: ['nomor hp', 'no hp', 'telepon', 'hp', 'wa', 'whatsapp'],
  titik_koordinat_x: ['titik koordinat x', 'koordinat x', 'longitude', 'long'],
  titik_koordinat_y: ['titik koordinat y', 'koordinat y', 'latitude', 'lat'],
  tempat_tinggal_yang_ditempati: ['tempat tinggal yang ditempati', 'tempat tinggal'],
  status_tanah_bangunan_tempat_tinggal_yang_ditempati: ['status tanah bangunan', 'status tanah'],
  apakah_kepemilikan_lahan_tempat_tinggal_memiliki_dokumen_yang_resmi: ['kepemilikan lahan', 'dokumen yang resmi'],
  luas_rumah: ['luas rumah'],
  jenis_lantai_tempat_tinggal_terluas: ['jenis lantai'],
  jenis_dinding_sebagian_besar_rumah: ['jenis dinding'],
  jenis_atap: ['jenis atap'],
  penerangan_rumah: ['penerangan rumah', 'penerangan'],
  besar_daya_listrik_pln: ['daya listrik', 'besar daya listrik'],
  energi_untuk_memasak: ['energi untuk memasak', 'memasak'],
  tempat_pembuangan_sampah: ['pembuangan sampah', 'sampah'],
  fasilitas_mck: ['fasilitas mck', 'mck'],
  sumber_air_mandi_terbanyak_dari: ['sumber air mandi', 'air mandi'],
  fasilitas_jamban: ['fasilitas jamban', 'jamban'],
  jenis_kloset: ['jenis kloset', 'kloset'],
  sumber_air_minum_terbanyak_dari: ['sumber air minum', 'air minum'],
  tempat_pembuangan_air_limbah_septic_tank: ['septic tank', 'limbah', 'pembuangan air limbah'],
  rumah_berada_di_bawah_sutet_sutt_suttas: ['sutet', 'suttas', 'sutt'],
  rumah_di_lereng_bukit_gunung: ['lereng bukit', 'lereng gunung'],
  secara_keseluruhan_kondisi_rumah: ['secara keseluruhan kondisi rumah', 'kondisi rumah'],
  blt_dana_desa: ['blt dana desa', 'blt'],
  program_keluarga_harapan_pkh: ['program keluarga harapan', 'pkh'],
  bantuan_sosial_tunai: ['bantuan sosial tunai', 'bst'],
  bantuan_umkm: ['bantuan umkm'],
  bantuan_pendidikan_anak: ['bantuan pendidikan anak', 'pendidikan anak'],
  bantuan_lainnya: ['bantuan lainnya'],
  berapa_rata_rata_pegeluaran_keluarga_dalam_sebulan_rupiah: ['pegeluaran keluarga', 'pengeluaran keluarga', 'rata-rata pengeluaran'],
  kepemilikin_aset: ['kepemilikin aset', 'kepemilikan aset', 'aset keluarga', 'aset'],
  apakah_memelihara_ternak: ['memelihara ternak', 'ternak'],
  jumlah_kepemilikan_bidang_tanah: ['bidang tanah', 'kepemilikan bidang tanah'],
  jumlah_lembar_pbb: ['lembar pbb', 'jumlah pbb'],
  nomor_nop_pbb: ['nop pbb', 'nomor nop'],
  apakah_mempunyai_umkm: ['mempunyai umkm', 'punya umkm'],
  jika_punya_apa_nama_usahanya_dan_dibidang_apa: ['nama usahanya', 'dibidang apa'],
  lokasi_usaha: ['lokasi usaha'],
  apakah_lokasi_usahanya_sudah_ada_di_google_maps: ['lokasi usahanya sudah ada di google maps', 'google maps'],
  apakah_sudah_mengetahui_metode_pembayaran_qris: ['metode pembayaran qris', 'mengetahui qris'],
  apakah_ingin_membuat_qris_di_usahanya: ['ingin membuat qris'],
  foto_kk: ['foto kk', 'lampiran foto kk'],
  rumah_tampak_depan: ['rumah tampak depan', 'tampak depan'],
  dalam_rumah_ruang_tamu: ['dalam rumah', 'ruang tamu'],
  bantuan_rehap_rumah_tidak_layak_huni: ['bantuan rehap', 'rumah tidak layak huni', 'rtlh'],
  alamat_lengkap: ['alamat lengkap', 'alamat', 'jorong'],
  apakah_ada_anak_yang_putus_sekolah_kalau_ada_berapa_dan_sebutkan_nama_nama_dan_kapan_berhenti_sekolah_nya_sd_smp_sma: ['putus sekolah'],
  foto_buku_nikah: ['foto buku nikah', 'buku nikah'],
  nama_enumerator_mahasiswa: ['nama enumerator', 'enumerator', 'mahasiswa'],
  periode_pendataan: ['periode pendataan', 'periode'],
  nama_responden: ['nama responden', 'responden'],
  jumlah_anggota_dalam_keluarga: ['jumlah anggota dalam keluarga', 'anggota dalam keluarga'],
  jumlah_anggota_yang_benar_benar_tinggal_dirumah_ini: ['benar-benar tinggal', 'tinggal dirumah ini'],
  kondisi_drainase_disekitar_rumah: ['kondisi drainase', 'drainase'],
  kendala_utama_usaha: ['kendala utama usaha', 'kendala usaha'],
  apakah_terdapat_retakan_pada_bangunan: ['retakan pada bangunan', 'retakan'],
  apakah_akses_jalan_rumah_pernah_terputus_akibat_bencana: ['akses jalan', 'terputus akibat bencana'],
  jumlah_balita_0_5_tahun: ['jumlah balita', 'balita'],
  jumlah_anak_anak_6_12_tahun: ['jumlah anak-anak', 'anak-anak'],
  jumlah_remaja_produktif_13_59_tahun: ['remaja/produktif', 'remaja produktif'],
  jumlah_lansia_60_tahun_ke_atas: ['jumlah lansia', 'lansia'],
  bpjs_kis: ['bpjs/kis', 'bpjs', 'kis'],
  luas_sawah: ['luas sawah'],
  luas_kebun_tanaman_muda: ['tanaman muda', 'kebun tanaman muda'],
  luas_kebun_tanaman_tua: ['tanaman tua', 'kebun tanaman tua'],
  luas_lahan_kosong: ['lahan kosong'],
  luas_kolam_ikan: ['kolam ikan'],
  intensitas_tanam_padi_dalam_setahun: ['intensitas tanam padi', 'tanam padi'],
  rata_rata_produksi_panen_padi_pangan_lainnya_per_musim_panen: ['produksi panen', 'panen padi'],
  permasalahan_nomor_induk_berusaha_nib_dan_sertifikat_halal_pada_umkm: ['nomor induk berusaha', 'sertifikat halal', 'nib'],
  perkiraan_pendapatan_bulanan_pelaku_umkm_per_bulan: ['perkiraan pendapatan bulanan', 'pendapatan bulanan pelaku umkm', 'pendapatan umkm'],
  kondisi_ventilasi_rumah: ['ventilasi'],
  data_kejadian_bencana: ['kejadian bencana', 'bencana'],
}

// Helper to safely extract primitive text from any cell
function extractCellText(cell) {
  if (cell === null || cell === undefined) return ''
  if (cell instanceof Date) {
    return cell.toISOString().split('T')[0]
  }
  if (typeof cell === 'object') {
    if (cell.value !== undefined && cell.value !== null) {
      return extractCellText(cell.value)
    }
    if (cell.text !== undefined && cell.text !== null) {
      return extractCellText(cell.text)
    }
    if (cell.result !== undefined && cell.result !== null) {
      return extractCellText(cell.result)
    }
  }
  return String(cell).trim()
}

export function sanitizeRowData(item) {
  if (!item || typeof item !== 'object') return item
  const cleaned = { ...item }

  const photoFields = ['foto_kk', 'rumah_tampak_depan', 'dalam_rumah_ruang_tamu', 'foto_buku_nikah']
  const misplacedDriveUrls = []

  // 1. Photo field guard: Non-photo fields MUST NOT contain Google Drive URLs
  Object.keys(cleaned).forEach((key) => {
    if (key === 'id') return
    const val = cleaned[key]
    if (val && typeof val === 'string' && val.includes('drive.google.com')) {
      if (!photoFields.includes(key)) {
        misplacedDriveUrls.push(val)
        cleaned[key] = '' // Clear Google Drive link from misplaced text/numeric field
      }
    }
  })

  // Re-assign misplaced photo links to empty photo fields
  if (misplacedDriveUrls.length > 0) {
    photoFields.forEach((photoKey) => {
      if ((!cleaned[photoKey] || cleaned[photoKey] === '-' || cleaned[photoKey] === '0') && misplacedDriveUrls.length > 0) {
        cleaned[photoKey] = misplacedDriveUrls.shift()
      }
    })
  }

  // 2. Air Bersih / Water Source Misplacement Guard:
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

  // 3. Asset / Kendala Utama Usaha Misplacement Guard:
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

export async function parseResponseFile(file, schema) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  let rawRows = []

  try {
    rawRows = extension === 'csv' ? await readCsv(file) : await readWorkbook(file)
  } catch (err) {
    console.error('File reading error:', err)
    throw new Error(`Gagal membaca file ${file.name}: ${err.message || 'Format file tidak dapat dibaca.'}`)
  }

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error('File Excel / CSV kosong atau tidak berisi data.')
  }

  rawRows = unwrapSheetRows(rawRows)

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error('File Excel / CSV kosong atau tidak berisi data.')
  }

  // 1. Scan for the Header Row
  let headerIndex = -1
  const schemaIdSet = new Set(schema.map((f) => f.id.toLowerCase()))
  const schemaLabelSet = new Set(schema.map((f) => (f.label || '').toLowerCase()))

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i]
    if (!row) continue
    const cells = Array.isArray(row) ? row : Object.values(row)
    const matchCount = cells.filter((c) => {
      const txt = extractCellText(c).toLowerCase()
      if (!txt) return false
      const norm = normalizeColumnName(txt, 0)
      return schemaIdSet.has(txt) || schemaIdSet.has(norm) || schemaLabelSet.has(txt) || schemaLabelSet.has(norm)
    }).length

    if (matchCount >= 2) {
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0
  }

  const rawHeaders = Array.isArray(rawRows[headerIndex]) ? rawRows[headerIndex] : Object.keys(rawRows[headerIndex])
  const headers = rawHeaders.map((h) => extractCellText(h))

  const unparsedDataRows = rawRows.slice(headerIndex + 1)

  const validDataRows = unparsedDataRows.filter((row) => {
    if (!row) return false
    const cells = Array.isArray(row) ? row : Object.values(row)
    return cells.some((cell) => extractCellText(cell) !== '')
  })

  if (validDataRows.length === 0) {
    throw new Error(`File '${file.name}' tidak berisi baris data warga di bawah header. Silakan isi data di bawah baris header.`)
  }

  const parsedObjects = rowsToFixedObjects(schema, headers, validDataRows).filter(isValidCensusRow)

  return {
    fileName: file.name,
    rows: parsedObjects,
  }
}

export function isValidCensusRow(row) {
  if (!row || typeof row !== 'object') return false
  const clean = (val) => String(val || '').trim().replace(/^-+$/, '')
  const name = clean(row.nama_kepala_keluarga)
  const kk = clean(row.nomor_kk)
  const responden = clean(row.nama_responden)
  const alamat = clean(row.alamat_lengkap)
  return Boolean(name || kk || responden || alamat)
}

function rowsToFixedObjects(schema, headers, rows) {
  // Pre-build precise header mapping dictionary for every field in schema
  const fieldToHeaderIndexMap = new Map()
  const usedHeaderIndices = new Set()

  if (Array.isArray(headers)) {
    schema.forEach((field) => {
      let matchedIndex = undefined

      const fieldIdNorm = field.id.toLowerCase()
      const fieldLabelNorm = (field.label || '').toLowerCase().trim()
      const fieldQuestionNorm = (field.question || '').toLowerCase().trim()
      const aliases = FIELD_ALIASES[field.id] || []

      // 1. Exact match on raw header text or normalized name
      for (let i = 0; i < headers.length; i++) {
        if (usedHeaderIndices.has(i)) continue
        const raw = extractCellText(headers[i]).toLowerCase().trim()
        const norm = normalizeColumnName(raw, i)
        if (!raw) continue

        if (raw === fieldIdNorm || norm === fieldIdNorm) {
          matchedIndex = i
          break
        }
        if (fieldLabelNorm && (raw === fieldLabelNorm || norm === normalizeColumnName(fieldLabelNorm, 0))) {
          matchedIndex = i
          break
        }
        if (fieldQuestionNorm && (raw === fieldQuestionNorm || norm === normalizeColumnName(fieldQuestionNorm, 0))) {
          matchedIndex = i
          break
        }
      }

      // 2. Keyword Substring / Alias Match
      if (matchedIndex === undefined) {
        for (let i = 0; i < headers.length; i++) {
          if (usedHeaderIndices.has(i)) continue
          const raw = extractCellText(headers[i]).toLowerCase().trim()
          if (!raw) continue

          for (const alias of aliases) {
            if (raw.includes(alias.toLowerCase())) {
              matchedIndex = i
              break
            }
          }
          if (matchedIndex !== undefined) break
        }
      }

      if (matchedIndex !== undefined) {
        fieldToHeaderIndexMap.set(field.id, matchedIndex)
        usedHeaderIndices.add(matchedIndex)
      }
    })
  }

  return rows.map((row, rowIndex) => {
    const rawItem = { id: rowIndex + 1 }

    schema.forEach((field) => {
      const sourceIndex = fieldToHeaderIndexMap.get(field.id)
      let val = ''

      if (sourceIndex !== undefined && Array.isArray(row)) {
        val = row[sourceIndex] ?? ''
      } else if (row && typeof row === 'object' && !Array.isArray(row)) {
        val = row[field.id] ?? row[field.label] ?? ''
      }

      const strVal = extractCellText(val)
      rawItem[field.id] = strVal

      // Populate alias keys so UI rendering components never miss fields
      if (field.id === 'nama') rawItem['nama_lengkap'] = strVal
      if (field.id === 'nama_lengkap') rawItem['nama'] = strVal
      if (field.id === 'nomor_nik') rawItem['nik'] = strVal
      if (field.id === 'nik') rawItem['nomor_nik'] = strVal
      if (field.id === 'nomor_kk') rawItem['kk'] = strVal
      if (field.id === 'kk') rawItem['nomor_kk'] = strVal
    })

    // Apply smart row sanitizer to fix misplaced Drive URLs, water source strings, and asset strings
    return sanitizeRowData(rawItem)
  })
}

function unwrapSheetRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return rawRows
  }

  const looksLikeSheetWrapper = rawRows.every(
    (entry) => entry && typeof entry === 'object' && !Array.isArray(entry) && Array.isArray(entry.data),
  )

  if (!looksLikeSheetWrapper) {
    return rawRows
  }

  for (const sheetEntry of rawRows) {
    if (Array.isArray(sheetEntry.data) && sheetEntry.data.length > 0) {
      return sheetEntry.data
    }
  }

  return rawRows[0]?.data || rawRows
}

async function readWorkbook(file) {
  try {
    const sheetData = await readSheet(file)
    if (Array.isArray(sheetData) && sheetData.length > 0) {
      return sheetData
    }
  } catch (sheetErr) {
    console.warn('readWorkbook readSheet fallback:', sheetErr)
  }

  const sheets = await readXlsxFile(file)
  const unwrapped = unwrapSheetRows(sheets)
  if (Array.isArray(unwrapped) && unwrapped.length > 0) {
    return unwrapped
  }

  throw new Error('Sheet Excel tidak ditemukan atau kosong.')
}

async function readCsv(file) {
  const text = await file.text()
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => parseCsvLine(line))
}

function parseCsvLine(line) {
  const values = []
  let currentValue = ''
  let insideQuote = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && nextCharacter === '"') {
      currentValue += '"'
      index += 1
    } else if (character === '"') {
      insideQuote = !insideQuote
    } else if (character === ',' && !insideQuote) {
      values.push(currentValue)
      currentValue = ''
    } else {
      currentValue += character
    }
  }

  values.push(currentValue)
  return values
}
