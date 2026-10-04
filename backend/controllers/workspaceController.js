const { getPool, logActivity } = require('../config/db');

// GET /api/workspaces — user's workspaces
exports.getMyWorkspaces = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT w.*, wm.role
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ?
      ORDER BY w.type ASC, w.created_at ASC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMyWorkspaces Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/workspaces — create company workspace
exports.createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Workspace name is required.' });

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO workspaces (name, type, owner_id) VALUES (?, ?, ?)',
      [name.trim(), 'company', req.user.id]
    );
    const wsId = result.insertId;

    await pool.query('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)', [wsId, req.user.id, 'admin']);
    await logActivity({ workspaceId: wsId, userId: req.user.id, action: 'workspace_created', metadata: { name: name.trim() } });

    const [rows] = await pool.query('SELECT w.*, "admin" AS role FROM workspaces w WHERE w.id = ?', [wsId]);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createWorkspace Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/workspaces/:id — workspace details
exports.getWorkspace = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id);
    const pool = getPool();

    // Check membership
    const [memberCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [rows] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [wsId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Workspace not found.' });

    res.json({ success: true, data: { ...rows[0], role: memberCheck[0].role } });
  } catch (error) {
    console.error('[getWorkspace Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/workspaces/:id/members
exports.getMembers = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id);
    const pool = getPool();

    const [memberCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.avatar, wm.role, wm.joined_at
      FROM workspace_members wm
      JOIN users u ON wm.user_id = u.id
      WHERE wm.workspace_id = ?
      ORDER BY wm.role ASC, u.name ASC
    `, [wsId]);

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('[getMembers Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/workspaces/:id/members/:userId — remove member
exports.removeMember = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const pool = getPool();

    const [adminCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can remove members.' });
    }
    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself.' });
    }

    await pool.query('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?', [wsId, targetUserId]);
    res.json({ success: true, message: 'Member removed.' });
  } catch (error) {
    console.error('[removeMember Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/workspaces/:id/invite
exports.inviteMember = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id);
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Valid email required.' });

    const pool = getPool();

    const [adminCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can invite members.' });
    }

    // Check if already a member
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser.length > 0) {
      const [alreadyMember] = await pool.query(
        'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
        [wsId, existingUser[0].id]
      );
      if (alreadyMember.length > 0) {
        return res.status(409).json({ success: false, message: 'User is already a member.' });
      }
    }

    // Cancel any existing pending invite for this email
    await pool.query(
      'UPDATE invitations SET status = "cancelled" WHERE workspace_id = ? AND email = ? AND status = "pending"',
      [wsId, email.toLowerCase().trim()]
    );

    // Create invitation token (simple random string)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const [invResult] = await pool.query(
      'INSERT INTO invitations (workspace_id, inviter_id, email, token, status) VALUES (?, ?, ?, ?, ?)',
      [wsId, req.user.id, email.toLowerCase().trim(), token, 'pending']
    );

    const [inv] = await pool.query(`
      SELECT i.*, w.name AS workspace_name, u.name AS inviter_name
      FROM invitations i
      JOIN workspaces w ON i.workspace_id = w.id
      JOIN users u ON i.inviter_id = u.id
      WHERE i.id = ?
    `, [invResult.insertId]);

    res.status(201).json({ success: true, message: 'Invitation created.', data: inv[0] });
  } catch (error) {
    console.error('[inviteMember Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/workspaces/:id/invitations
exports.getInvitations = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id);
    const pool = getPool();

    const [adminCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (adminCheck.length === 0 || adminCheck[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can view invitations.' });
    }

    const [invitations] = await pool.query(
      'SELECT * FROM invitations WHERE workspace_id = ? ORDER BY created_at DESC',
      [wsId]
    );
    res.json({ success: true, data: invitations });
  } catch (error) {
    console.error('[getInvitations Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/workspaces/accept-invite — accept invitation by token
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required.' });

    const pool = getPool();
    const [invRows] = await pool.query('SELECT * FROM invitations WHERE token = ? AND status = "pending"', [token]);
    if (invRows.length === 0) return res.status(404).json({ success: false, message: 'Invalid or expired invitation.' });

    const inv = invRows[0];

    // Check user email matches
    if (req.user.email !== inv.email) {
      return res.status(403).json({ success: false, message: 'This invitation was sent to a different email address.' });
    }

    // Check not already a member
    const [alreadyMember] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [inv.workspace_id, req.user.id]
    );
    if (alreadyMember.length === 0) {
      await pool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
        [inv.workspace_id, req.user.id, 'member']
      );
    }

    await pool.query('UPDATE invitations SET status = "accepted" WHERE id = ?', [inv.id]);
    await logActivity({ workspaceId: inv.workspace_id, userId: req.user.id, action: 'member_joined', metadata: { email: req.user.email } });

    const [wsRows] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [inv.workspace_id]);
    res.json({ success: true, message: 'Invitation accepted.', data: wsRows[0] });
  } catch (error) {
    console.error('[acceptInvite Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/workspaces/:id/activity
exports.getActivity = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id);
    const pool = getPool();

    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });

    const [logs] = await pool.query(`
      SELECT al.*, u.name AS user_name, u.avatar AS user_avatar, t.title AS task_title
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN tasks t ON al.task_id = t.id
      WHERE al.workspace_id = ?
      ORDER BY al.created_at DESC
      LIMIT 50
    `, [wsId]);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('[getActivity Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/workspaces/:id/pending-invites — user's pending invites for a workspace
exports.getPendingInviteByToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, message: 'Token required.' });
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT i.*, w.name AS workspace_name, u.name AS inviter_name
      FROM invitations i
      JOIN workspaces w ON i.workspace_id = w.id
      JOIN users u ON i.inviter_id = u.id
      WHERE i.token = ? AND i.status = 'pending'
    `, [token]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Invitation not found or expired.' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
