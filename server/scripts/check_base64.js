import { pool } from '../src/db.js'

async function checkBase64InDb() {
  try {
    const res1 = await pool.query(
      `SELECT count(*) FROM sensus_keluarga WHERE foto_kk LIKE 'data:image%' OR foto_buku_nikah LIKE 'data:image%' OR rumah_tampak_depan LIKE 'data:image%' OR dalam_rumah_ruang_tamu LIKE 'data:image%'`,
    )
    console.log('Keluarga with Base64 photos in DB:', res1.rows[0].count)

    const res2 = await pool.query(
      `SELECT count(*) FROM sensus_individu WHERE foto_akta_kelahiran LIKE 'data:image%' OR foto_kk LIKE 'data:image%' OR foto_buku_nikah LIKE 'data:image%'`,
    )
    console.log('Individu with Base64 photos in DB:', res2.rows[0].count)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await pool.end()
  }
}

checkBase64InDb()
