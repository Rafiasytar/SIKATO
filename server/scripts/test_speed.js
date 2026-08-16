import { pool } from '../src/db.js'

async function run() {
  try {
    console.time('explain_keluarga')
    const expKeluarga = await pool.query(
      `EXPLAIN ANALYZE SELECT id, nomor_kk, nama_kepala_keluarga FROM sensus_keluarga ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    console.timeEnd('explain_keluarga')
    console.log('Keluarga Explain:', expKeluarga.rows.map((r) => r['QUERY PLAN']).join('\n'))

    console.time('explain_individu')
    const expIndividu = await pool.query(
      `EXPLAIN ANALYZE SELECT id, nomor_kk, nama FROM sensus_individu ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    console.timeEnd('explain_individu')
    console.log('Individu Explain:', expIndividu.rows.map((r) => r['QUERY PLAN']).join('\n'))
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

run()
