const { getPool } = require('../config/db');

// GET /api/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT n.*, w.name AS workspace_name
       FROM notifications n
       LEFT JOIN workspaces w ON n.workspace_id = w.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMyNotifications Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [
      notifId,
      req.user.id,
    ]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};
