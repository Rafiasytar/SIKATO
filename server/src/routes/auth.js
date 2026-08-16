import { Router } from 'express'
import { pool } from '../db.js'
import { insertLog } from './logs.js'

const router = Router()

// Auto-initialize admin_users table and default admin on startup
async function initAuthDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Check if default admin exists
    const checkRes = await pool.query('SELECT * FROM admin_users WHERE username = $1', ['admin'])
    if (checkRes.rows.length === 0) {
      await pool.query(
        'INSERT INTO admin_users (username, password, full_name, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin123', 'Administrator Nagari', 'Super Admin'],
      )
      console.log('✅ Default admin account created: admin / admin123')
    }

    // Auto-update legacy role strings in database to 'Admin'
    await pool.query(`
      UPDATE admin_users 
      SET role = 'Admin' 
      WHERE LOWER(username) != 'admin' AND (role IS NULL OR role NOT ILIKE '%super%');
    `)
  } catch (err) {
    console.error('⚠️ Auth DB Initialization Warning:', err.message)
  }
}

initAuthDb()

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' })
    }

    const result = await pool.query(
      'SELECT id, username, password, full_name, role FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [username.trim()],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Username tidak ditemukan.' })
    }

    const user = result.rows[0]

    // Check password (supports simple string comparison or hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Password salah. Silakan coba lagi.' })
    }

    // Auto-log login activity in database with client IP & user agent
    const clientIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1'
    const userAgent = req.headers['user-agent'] || ''
    await insertLog(user.full_name || user.username, 'LOGIN', `Pengguna ${user.username} (${user.role}) berhasil masuk ke sistem.`, String(clientIp), userAgent)

    res.json({
      success: true,
      message: 'Login berhasil!',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
      },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/register (Create new admin user)
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, full_name, role } = req.body || {}

    if (!username || !password || !full_name) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' })
    }

    const checkRes = await pool.query('SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1)', [username.trim()])
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ message: 'Username sudah digunakan.' })
    }

    const targetRole = String(role || '').toLowerCase().includes('super') ? 'Super Admin' : 'Admin'
    const insertRes = await pool.query(
      'INSERT INTO admin_users (username, password, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, username, full_name, role',
      [username.trim(), password, full_name.trim(), targetRole],
    )

    res.status(201).json({
      success: true,
      message: 'Akun admin berhasil dibuat!',
      user: insertRes.rows[0],
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/update-profile (Update admin username, password, full_name)
router.post('/update-profile', async (req, res, next) => {
  try {
    const { currentUsername, newUsername, oldPassword, newPassword, newFullName } = req.body || {}

    if (!currentUsername || !oldPassword) {
      return res.status(400).json({ message: 'Username saat ini dan Password lama wajib diisi.' })
    }

    const checkRes = await pool.query(
      'SELECT id, username, password, full_name, role FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [currentUsername.trim()],
    )

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Akun admin tidak ditemukan.' })
    }

    const user = checkRes.rows[0]

    if (user.password !== oldPassword) {
      return res.status(401).json({ message: 'Password lama salah.' })
    }

    const targetUsername = newUsername && newUsername.trim() ? newUsername.trim() : user.username
    const targetPassword = newPassword && newPassword.trim() ? newPassword.trim() : user.password
    const targetFullName = newFullName && newFullName.trim() ? newFullName.trim() : user.full_name

    // Check if new username collides with another user
    if (targetUsername.toLowerCase() !== user.username.toLowerCase()) {
      const dupCheck = await pool.query(
        'SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1) AND id != $2',
        [targetUsername, user.id],
      )
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username baru sudah digunakan oleh akun lain.' })
      }
    }

    const updateRes = await pool.query(
      'UPDATE admin_users SET username = $1, password = $2, full_name = $3 WHERE id = $4 RETURNING id, username, full_name, role',
      [targetUsername, targetPassword, targetFullName, user.id],
    )

    const clientIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1'
    const userAgent = req.headers['user-agent'] || ''
    await insertLog(targetFullName || targetUsername, 'UPDATE_PROFILE', `Memperbarui akun admin: username menjadi '${targetUsername}', nama '${targetFullName}'.`, String(clientIp), userAgent)

    res.json({
      success: true,
      message: 'Profil & akun admin berhasil diperbarui!',
      user: updateRes.rows[0],
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/users (List all admin users)
router.get('/users', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, role, created_at FROM admin_users ORDER BY id ASC',
    )
    res.json({ success: true, data: result.rows })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/auth/users/:id (Delete an admin account)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const checkRes = await pool.query('SELECT username FROM admin_users WHERE id = $1', [id])
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Akun admin tidak ditemukan.' })
    }

    if (checkRes.rows[0].username.toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'Akun Super Admin Utama (root) tidak dapat dihapus.' })
    }

    const deleteRes = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING username, full_name', [id])
    res.json({ success: true, message: `Akun '${deleteRes.rows[0].username}' berhasil dihapus.` })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/verify-password (Verify Super Admin password)
router.post('/verify-password', async (req, res, next) => {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' })
    }

    const result = await pool.query(
      'SELECT id, username, password, full_name, role FROM admin_users WHERE LOWER(username) = LOWER($1)',
      [username.trim()],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Akun Super Admin tidak ditemukan.' })
    }

    const user = result.rows[0]

    if (user.password !== password) {
      return res.status(401).json({ message: 'Password Super Admin salah. Akses ditolak.' })
    }

    res.json({ success: true, message: 'Password Super Admin terverifikasi.' })
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/users/:id (Update an existing admin user account)
router.put('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { username, password, full_name, role } = req.body || {}

    if (!username || !full_name) {
      return res.status(400).json({ message: 'Username dan Nama Lengkap wajib diisi.' })
    }

    const checkRes = await pool.query('SELECT * FROM admin_users WHERE id = $1', [id])
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Akun admin tidak ditemukan.' })
    }

    const existingUser = checkRes.rows[0]

    if (username.trim().toLowerCase() !== existingUser.username.toLowerCase()) {
      const dupCheck = await pool.query(
        'SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1) AND id != $2',
        [username.trim(), id],
      )
      if (dupCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Username sudah digunakan oleh akun lain.' })
      }
    }

    const targetPassword = password && password.trim() ? password.trim() : existingUser.password
    const targetRole = String(role || existingUser.role || '').toLowerCase().includes('super') ? 'Super Admin' : 'Admin'

    const updateRes = await pool.query(
      'UPDATE admin_users SET username = $1, password = $2, full_name = $3, role = $4 WHERE id = $5 RETURNING id, username, full_name, role',
      [username.trim(), targetPassword, full_name.trim(), targetRole, id],
    )

    const clientIp = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1'
    const userAgent = req.headers['user-agent'] || ''
    await insertLog('Super Admin', 'EDIT_USER', `Memperbarui akun admin ID ${id} (${username.trim()}).`, String(clientIp), userAgent)

    res.json({
      success: true,
      message: 'Akun admin berhasil diperbarui!',
      user: updateRes.rows[0],
    })
  } catch (err) {
    next(err)
  }
})

export default router
