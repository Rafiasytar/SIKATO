import { pool } from '../src/db.js'

async function cleanToastData() {
  try {
    console.log('Cleaning Base64 photo blobs from PostgreSQL text columns...')

    const photoColsKeluarga = ['foto_kk', 'foto_buku_nikah', 'rumah_tampak_depan', 'dalam_rumah_ruang_tamu']
    for (const col of photoColsKeluarga) {
      const res = await pool.query(
        `UPDATE sensus_keluarga SET "${col}" = '' WHERE "${col}" LIKE 'data:image%' AND LENGTH("${col}") > 1000`,
      )
      console.log(`Cleared ${res.rowCount} Base64 entries from sensus_keluarga.${col}`)
    }

    const photoColsIndividu = ['foto_akta_kelahiran', 'foto_kk', 'foto_buku_nikah']
    for (const col of photoColsIndividu) {
      const res = await pool.query(
        `UPDATE sensus_individu SET "${col}" = '' WHERE "${col}" LIKE 'data:image%' AND LENGTH("${col}") > 1000`,
      )
      console.log(`Cleared ${res.rowCount} Base64 entries from sensus_individu.${col}`)
    }

    // Add PostgreSQL indexes for instant sorting
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sensus_keluarga_sort ON sensus_keluarga (last_updated_ms DESC, sort_order ASC, id ASC)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sensus_individu_sort ON sensus_individu (last_updated_ms DESC, sort_order ASC, id ASC)`)
    console.log('PostgreSQL sorting indexes created successfully!')

    // Run VACUUM ANALYZE to reclaim TOAST space and update statistics
    await pool.query(`VACUUM ANALYZE sensus_keluarga`)
    await pool.query(`VACUUM ANALYZE sensus_individu`)
    console.log('VACUUM ANALYZE completed!')
  } catch (err) {
    console.error('Error during cleanup:', err.message)
  } finally {
    await pool.end()
  }
}

cleanToastData()
