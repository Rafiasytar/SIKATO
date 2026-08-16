import { pool } from '../src/db.js'
import { fixedColumns, tableName } from '../src/schema.js'
import { fixedColumnsIndividu, tableNameIndividu } from '../src/schemaIndividu.js'

async function testCleanQuery() {
  try {
    console.time('clean_sensus')
    const colsKeluarga = fixedColumns.map((c) => `"${c}"`).join(', ')
    const r1 = await pool.query(
      `SELECT id, ${colsKeluarga}, sort_order, last_updated_ms FROM ${tableName} ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    console.timeEnd('clean_sensus')
    console.log('Sensus rows:', r1.rows.length)

    console.time('clean_individu')
    const colsIndividu = fixedColumnsIndividu.map((c) => `"${c}"`).join(', ')
    const r2 = await pool.query(
      `SELECT id, ${colsIndividu}, sort_order, last_updated_ms FROM ${tableNameIndividu} ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    console.timeEnd('clean_individu')
    console.log('Individu rows:', r2.rows.length)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

testCleanQuery()
