const { getPool } = require('../config/db');

// GET /api/sections?workspace_id=&project_id=
exports.getSections = async (req, res) => {
  try {
    const workspaceId = parseInt(req.query.workspace_id || req.query.workspaceId, 10);
    const projectId = req.query.project_id || req.query.projectId ? parseInt(req.query.project_id || req.query.projectId, 10) : null;

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspace_id is required.' });
    }

    const pool = getPool();
    const [membership] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspaceId, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    let query = 'SELECT * FROM sections WHERE workspace_id = ?';
    let params = [workspaceId];

    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    query += ' ORDER BY position ASC, id ASC';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getSections Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve sections.' });
  }
};

// POST /api/sections
exports.createSection = async (req, res) => {
  try {
    const { workspaceId, projectId, name } = req.body;
    if (!workspaceId || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'workspaceId and section name are required.' });
    }

    const pool = getPool();
    const wsId = parseInt(workspaceId, 10);
    const projId = projectId ? parseInt(projectId, 10) : null;

    const [membership] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    const [posRows] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM sections WHERE workspace_id = ?',
      [wsId]
    );
    const position = posRows[0].next_pos;

    const [result] = await pool.query(
      'INSERT INTO sections (workspace_id, project_id, name, position) VALUES (?, ?, ?, ?)',
      [wsId, projId, name.trim(), position]
    );

    const [created] = await pool.query('SELECT * FROM sections WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, data: created[0] });
  } catch (error) {
    console.error('[createSection Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create section.' });
  }
};

// PUT /api/sections/:id
exports.updateSection = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    const { name, position } = req.body;
    const pool = getPool();

    const [existing] = await pool.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const section = existing[0];
    const [membership] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [section.workspace_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    await pool.query(
      'UPDATE sections SET name = COALESCE(?, name), position = COALESCE(?, position) WHERE id = ?',
      [name !== undefined ? name.trim() : null, position !== undefined ? position : null, sectionId]
    );

    const [updated] = await pool.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
    return res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('[updateSection Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update section.' });
  }
};

// DELETE /api/sections/:id
exports.deleteSection = async (req, res) => {
  try {
    const sectionId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [existing] = await pool.query('SELECT * FROM sections WHERE id = ?', [sectionId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Section not found.' });
    }

    const section = existing[0];
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [section.workspace_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    await pool.query('DELETE FROM sections WHERE id = ?', [sectionId]);
    return res.json({ success: true, message: 'Section deleted.' });
  } catch (error) {
    console.error('[deleteSection Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete section.' });
  }
};
