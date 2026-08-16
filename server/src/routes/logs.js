import { Router } from 'express'
import { pool } from '../db.js'
import { resolveIpLocation } from '../utils/geoIp.js'

const router = Router()

function parseUserAgent(uaString = '') {
  if (!uaString) return 'Browser Desktop'
  const ua = String(uaString)
  let browser = 'Browser Web'
  let os = 'Desktop'

  if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/')) browser = 'Chrome'
  else if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Safari/')) browser = 'Safari'

  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  else if (ua.includes('Linux')) os = 'Linux'

  return `${browser} (${os})`
}

// 6-Month Automatic Log Retention Cleanup Routine
async function cleanupOldLogs() {
  try {
    const res = await pool.query(
      "DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '6 months' RETURNING id",
    )
    if (res.rowCount > 0) {
      console.log(`🧹 [Retention Policy] Otomatis membersihkan ${res.rowCount} log yang berusia lebih dari 6 bulan.`)
    }
  } catch (err) {
    console.error('⚠️ Log Retention Cleanup Error:', err.message)
  }
}

// Auto-initialize activity_logs table with user_agent & location_info columns
async function initLogsDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(150) NOT NULL DEFAULT 'System Admin',
        action_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        ip_address VARCHAR(50) DEFAULT '127.0.0.1',
        user_agent VARCHAR(255) DEFAULT 'Chrome (Windows)',
        location_info VARCHAR(255) DEFAULT 'Jaringan Lokal (LAN / Localhost)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Ensure columns exist for existing tables
    await pool.query(`
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255) DEFAULT 'Chrome (Windows)';
      ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS location_info VARCHAR(255) DEFAULT 'Jaringan Lokal (LAN / Localhost)';
    `)

    // Run 6-month retention cleanup on startup
    await cleanupOldLogs()
  } catch (err) {
    console.error('⚠️ Activity Logs DB Initialization Warning:', err.message)
  }
}

initLogsDb()

// Schedule automatic cleanup every 12 hours
setInterval(cleanupOldLogs, 12 * 60 * 60 * 1000)

// Helper function to insert log internally with Geolocation
export async function insertLog(userName, actionType, description, ipAddress = '127.0.0.1', rawUserAgent = '') {
  try {
    const cleanIp = String(ipAddress).replace('::ffff:', '').replace('::1', '127.0.0.1 (Localhost)')
    const deviceName = parseUserAgent(rawUserAgent)
    const locationInfo = await resolveIpLocation(ipAddress)

    await pool.query(
      'INSERT INTO activity_logs (user_name, action_type, description, ip_address, user_agent, location_info) VALUES ($1, $2, $3, $4, $5, $6)',
      [userName || 'Administrator', actionType || 'GENERAL', description, cleanIp || '127.0.0.1', deviceName, locationInfo],
    )
  } catch (err) {
    console.error('⚠️ Error inserting activity log:', err.message)
  }
}

// GET /api/logs - Fetch all activity logs (ordered by created_at DESC)
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 300')
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

// POST /api/logs - Insert new activity log entry
router.post('/', async (req, res, next) => {
  try {
    const { userName, actionType, description } = req.body || {}
    const clientIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1'
    const userAgent = req.headers['user-agent'] || ''

    if (!actionType || !description) {
      return res.status(400).json({ message: 'Tipe aksi dan deskripsi wajib diisi.' })
    }

    await insertLog(userName || 'Administrator', actionType, description, String(clientIp), userAgent)
    res.status(201).json({ success: true, message: 'Log aktivitas berhasil dicatat.' })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/logs/clear - Disabled for Security (Manual clear prohibited, automated 6-month retention enforced)
router.delete('/clear', async (req, res) => {
  res.status(403).json({
    message: 'Pembersihan manual dinonaktifkan demi integritas audit trail keamanan. Sistem melakukan pembersihan otomatis setiap 6 bulan.',
  })
})

export default router
