const { getPool } = require('../config/db');

// GET /api/labels?workspace_id=
exports.getLabels = async (req, res) => {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ success: false, message: 'workspace_id required.' });

    const pool = getPool();
    const wsId = parseInt(workspace_id);

    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [rows] = await pool.query(
      'SELECT l.*, COUNT(tl.task_id) AS task_count FROM labels l LEFT JOIN task_labels tl ON l.id = tl.label_id WHERE l.workspace_id = ? GROUP BY l.id ORDER BY l.name ASC',
      [wsId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getLabels Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/labels
exports.createLabel = async (req, res) => {
  try {
    const { workspace_id, name, color } = req.body;
    if (!workspace_id || !name?.trim()) return res.status(400).json({ success: false, message: 'workspace_id and name required.' });

    const pool = getPool();
    const wsId = parseInt(workspace_id);

    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [result] = await pool.query(
      'INSERT INTO labels (workspace_id, name, color) VALUES (?, ?, ?)',
      [wsId, name.trim(), color || '#6366f1']
    );
    const [rows] = await pool.query('SELECT * FROM labels WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createLabel Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/labels/:id
exports.updateLabel = async (req, res) => {
  try {
    const pool = getPool();
    const labelId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM labels WHERE id = ?', [labelId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Label not found.' });

    const label = rows[0];
    const [memberCheck] = await pool.query('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?', [label.workspace_id, req.user.id]);
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { name, color } = req.body;
    await pool.query('UPDATE labels SET name=?, color=? WHERE id=?', [name?.trim() || label.name, color || label.color, labelId]);
    const [updated] = await pool.query('SELECT * FROM labels WHERE id = ?', [labelId]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[updateLabel Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/labels/:id
exports.deleteLabel = async (req, res) => {
  try {
    const pool = getPool();
    const labelId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM labels WHERE id = ?', [labelId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Label not found.' });

    const label = rows[0];
    const [memberCheck] = await pool.query('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?', [label.workspace_id, req.user.id]);
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    await pool.query('DELETE FROM labels WHERE id = ?', [labelId]);
    res.json({ success: true, message: 'Label deleted.' });
  } catch (error) {
    console.error('[deleteLabel Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
