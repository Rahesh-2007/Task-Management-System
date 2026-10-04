const { getPool, logActivity } = require('../config/db');

// GET /api/projects?workspace_id=
exports.getProjects = async (req, res) => {
  try {
    const { workspace_id } = req.query;
    if (!workspace_id) return res.status(400).json({ success: false, message: 'workspace_id required.' });

    const pool = getPool();
    const wsId = parseInt(workspace_id);

    // Verify membership
    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE workspace_id = ? AND is_archived = FALSE ORDER BY is_favorite DESC, name ASC',
      [wsId]
    );

    // Add task count to each project
    for (const proj of rows) {
      const [countResult] = await pool.query('SELECT COUNT(*) AS count FROM tasks WHERE project_id = ? AND completed = FALSE', [proj.id]);
      proj.taskCount = countResult[0].count;
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getProjects Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { workspace_id, name, description, color } = req.body;
    if (!workspace_id) return res.status(400).json({ success: false, message: 'workspace_id required.' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Project name required.' });

    const pool = getPool();
    const wsId = parseInt(workspace_id);

    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [result] = await pool.query(
      'INSERT INTO projects (workspace_id, name, description, color) VALUES (?, ?, ?, ?)',
      [wsId, name.trim(), description?.trim() || '', color || '#3b82f6']
    );

    await logActivity({ workspaceId: wsId, userId: req.user.id, action: 'project_created', metadata: { name: name.trim() } });

    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createProject Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/projects/:id
exports.getProject = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [parseInt(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });

    const proj = rows[0];
    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [proj.workspace_id, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    res.json({ success: true, data: proj });
  } catch (error) {
    console.error('[getProject Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const pool = getPool();
    const projId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });

    const proj = rows[0];
    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [proj.workspace_id, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { name, description, color, is_favorite, is_archived } = req.body;
    const newName = name !== undefined ? name.trim() : proj.name;
    const newDesc = description !== undefined ? description.trim() : proj.description;
    const newColor = color !== undefined ? color : proj.color;
    const newFav = is_favorite !== undefined ? Boolean(is_favorite) : proj.is_favorite;
    const newArch = is_archived !== undefined ? Boolean(is_archived) : proj.is_archived;

    await pool.query(
      'UPDATE projects SET name=?, description=?, color=?, is_favorite=?, is_archived=? WHERE id=?',
      [newName, newDesc, newColor, newFav, newArch, projId]
    );

    const [updated] = await pool.query('SELECT * FROM projects WHERE id = ?', [projId]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[updateProject Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const pool = getPool();
    const projId = parseInt(req.params.id);
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found.' });

    const proj = rows[0];
    const [memberCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [proj.workspace_id, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    await pool.query('DELETE FROM projects WHERE id = ?', [projId]);
    res.json({ success: true, message: 'Project deleted.' });
  } catch (error) {
    console.error('[deleteProject Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
