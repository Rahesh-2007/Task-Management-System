// Simple auth middleware — reads x-user-id header, verifies user exists in DB
const { getPool } = require('../config/db');

async function authMiddleware(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId || isNaN(parseInt(userId))) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Please login first.' });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [parseInt(userId)]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found.' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]:', err.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
}

// Optional auth — attaches user if header present, does not block if absent
async function optionalAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId && !isNaN(parseInt(userId))) {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [parseInt(userId)]);
      if (rows.length > 0) req.user = rows[0];
    } catch (_) {}
  }
  next();
}

module.exports = { authMiddleware, optionalAuth };
