import { pool } from '../src/db.js'
import { fixedColumns, tableName } from '../src/schema.js'

async function run() {
  try {
    // Test 1: Selecting all columns WITHOUT LENGTH() on photo columns
    const colsNormal = fixedColumns
      .map((c) => (c.includes('foto') || c.includes('tampak') || c.includes('ruang_tamu') ? `'' AS "${c}"` : `"${c}"`))
      .join(', ')

    console.time('no_toast')
    const resNoToast = await pool.query(
      `SELECT id, ${colsNormal}, sort_order, last_updated_ms FROM ${tableName} ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    console.timeEnd('no_toast')
    console.log('No TOAST time:', resNoToast.rows.length, 'rows')

    // Test 2: CASE WHEN LENGTH()
    const colsLength = fixedColumns
      .map((c) =>
        c.includes('foto') || c.includes('tampak') || c.includes('ruang_tamu')
          ? `CASE WHEN LENGTH("${c}") > 1000 THEN '' ELSE "${c}" END AS "${c}"`
          : `"${c}"`,
      )
      .join(', ')

    console.time('with_toast_length')
    const resToast = await pool.query(
      `SELECT id, ${colsLength}, sort_order, last_updated_ms FROM ${tableName} ORDER BY last_updated_ms DESC, sort_order ASC, id ASC`,
    )
    console.timeEnd('with_toast_length')
    console.log('With TOAST LENGTH time:', resToast.rows.length, 'rows')
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

run()
