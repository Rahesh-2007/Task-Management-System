const { getPool } = require('../config/db');

// GET /api/comments?task_id=
exports.getComments = async (req, res) => {
  try {
    const { task_id } = req.query;
    if (!task_id) return res.status(400).json({ success: false, message: 'task_id required.' });

    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `, [parseInt(task_id)]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getComments Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/comments
exports.createComment = async (req, res) => {
  try {
    const { task_id, content } = req.body;
    if (!task_id || !content?.trim()) return res.status(400).json({ success: false, message: 'task_id and content required.' });

    const pool = getPool();

    // Verify task exists
    const [taskRows] = await pool.query('SELECT id FROM tasks WHERE id = ?', [parseInt(task_id)]);
    if (taskRows.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    const [result] = await pool.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [parseInt(task_id), req.user.id, content.trim()]
    );

    const [rows] = await pool.query(`
      SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createComment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/comments/:id
exports.updateComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required.' });

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Comment not found.' });

    if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Can only edit your own comments.' });

    await pool.query('UPDATE comments SET content = ? WHERE id = ?', [content.trim(), commentId]);
    const [updated] = await pool.query(`
      SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [commentId]);

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[updateComment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Comment not found.' });
    if (rows[0].user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Can only delete your own comments.' });

    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    console.error('[deleteComment Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
