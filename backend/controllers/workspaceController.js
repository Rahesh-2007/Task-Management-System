const crypto = require('crypto');
const { getPool, logActivity, ensureDefaultWorkspace } = require('../config/db');

// GET /api/workspaces
exports.getMyWorkspaces = async (req, res) => {
  try {
    const pool = getPool();
    // Guarantee a default personal workspace exists for this user (idempotent)
    await ensureDefaultWorkspace(req.user.id);

    const [rows] = await pool.query(
      `SELECT w.*, wm.role, wm.joined_at
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ?
       ORDER BY (w.type = 'personal') DESC, w.is_default DESC, w.created_at ASC`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMyWorkspaces Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch workspaces.' });
  }
};

// POST /api/workspaces
exports.createWorkspace = async (req, res) => {
  try {
    const { name, type = 'personal' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Workspace name is required.' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO workspaces (name, type, owner_id) VALUES (?, ?, ?)',
      [name.trim(), type === 'company' ? 'company' : 'personal', req.user.id]
    );
    const wsId = result.insertId;

    // Add owner member
    await pool.query('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)', [
      wsId,
      req.user.id,
      'owner',
    ]);

    // Create default "Inbox" project for the new workspace
    await pool.query(
      'INSERT INTO projects (workspace_id, name, description, color) VALUES (?, ?, ?, ?)',
      [wsId, 'Inbox', 'Default task stream', '#E11D48']
    );

    await logActivity({
      workspaceId: wsId,
      userId: req.user.id,
      action: 'workspace_created',
      metadata: { name: name.trim() },
    });

    const [rows] = await pool.query('SELECT w.*, "owner" AS role FROM workspaces w WHERE w.id = ?', [wsId]);
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createWorkspace Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create workspace.' });
  }
};

// GET /api/workspaces/:id
exports.getWorkspace = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [memberCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied: Not a member.' });
    }

    const [rows] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [wsId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }

    return res.json({ success: true, data: { ...rows[0], role: memberCheck[0].role } });
  } catch (error) {
    console.error('[getWorkspace Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch workspace.' });
  }
};

// DELETE /api/workspaces/:id
exports.deleteWorkspace = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [wsRow] = await pool.query('SELECT type, is_default FROM workspaces WHERE id = ?', [wsId]);
    if (wsRow.length === 0) {
      return res.status(404).json({ success: false, message: 'Workspace not found.' });
    }
    if (wsRow[0].type === 'personal' || wsRow[0].is_default) {
      return res.status(400).json({ success: false, message: 'The default Personal workspace cannot be deleted.' });
    }

    const [memberCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0 || (memberCheck[0].role !== 'owner' && memberCheck[0].role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only workspace owners or admins can delete workspaces.' });
    }

    await pool.query('DELETE FROM workspaces WHERE id = ?', [wsId]);
    await ensureDefaultWorkspace(req.user.id).catch(() => {});

    return res.json({ success: true, message: 'Workspace deleted successfully.' });
  } catch (error) {
    console.error('[deleteWorkspace Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete workspace.' });
  }
};

// POST /api/workspaces/bulk-delete
exports.bulkDeleteWorkspaces = async (req, res) => {
  try {
    const { workspaceIds } = req.body;
    if (!Array.isArray(workspaceIds) || workspaceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'workspaceIds array is required.' });
    }

    const pool = getPool();
    const ids = workspaceIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid workspace IDs provided.' });
    }

    // Check permissions: only delete non-personal/non-default workspaces where the user is owner or admin
    const [allowedRows] = await pool.query(
      `SELECT wm.workspace_id FROM workspace_members wm
       JOIN workspaces w ON wm.workspace_id = w.id
       WHERE wm.user_id = ? AND wm.role IN ('owner', 'admin') 
         AND w.type != 'personal' AND w.is_default = FALSE
         AND wm.workspace_id IN (?)`,
      [req.user.id, ids]
    );

    const allowedIds = allowedRows.map((r) => r.workspace_id);

    if (allowedIds.length === 0) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete any of the selected workspaces.' });
    }

    await pool.query('DELETE FROM workspaces WHERE id IN (?)', [allowedIds]);
    await ensureDefaultWorkspace(req.user.id).catch(() => {});

    return res.json({
      success: true,
      message: `${allowedIds.length} workspace(s) deleted successfully.`,
      deletedIds: allowedIds,
    });
  } catch (error) {
    console.error('[bulkDeleteWorkspaces Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete workspaces.' });
  }
};

// GET /api/workspaces/:id/members
exports.getMembers = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [memberCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar, wm.role, wm.joined_at
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = ?
       ORDER BY 
         CASE wm.role 
           WHEN 'owner' THEN 1 
           WHEN 'admin' THEN 2 
           ELSE 3 
         END, 
         u.name ASC`,
      [wsId]
    );

    return res.json({ success: true, data: members });
  } catch (error) {
    console.error('[getMembers Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch members.' });
  }
};

// DELETE /api/workspaces/:id/members/:userId
exports.removeMember = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const pool = getPool();

    const [callerRoleRows] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (callerRoleRows.length === 0 || (callerRoleRows[0].role !== 'owner' && callerRoleRows[0].role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Admin or owner privileges required.' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot remove yourself from the workspace.' });
    }

    await pool.query('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?', [wsId, targetUserId]);
    return res.json({ success: true, message: 'Member removed from workspace.' });
  } catch (error) {
    console.error('[removeMember Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove member.' });
  }
};

// POST /api/workspaces/:id/invite
exports.inviteMember = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const { email, role = 'member' } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const pool = getPool();

    const [adminCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (adminCheck.length === 0 || (adminCheck[0].role !== 'owner' && adminCheck[0].role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only workspace admins or owners can invite members.' });
    }

    // Check if user is already a member
    const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser.length > 0) {
      const [alreadyMember] = await pool.query(
        'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
        [wsId, existingUser[0].id]
      );
      if (alreadyMember.length > 0) {
        return res.status(409).json({ success: false, message: 'This user is already a member of this workspace.' });
      }
    }

    // Cancel existing pending invites for this email
    await pool.query(
      'UPDATE invitations SET status = "cancelled" WHERE workspace_id = ? AND email = ? AND status = "pending"',
      [wsId, cleanEmail]
    );

    // Secure token with 7-day expiration
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invResult] = await pool.query(
      'INSERT INTO invitations (workspace_id, inviter_id, email, token, role, status, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [wsId, req.user.id, cleanEmail, token, role, 'pending', expiresAt]
    );

    // If recipient is an existing registered user, create an in-app notification
    if (existingUser.length > 0) {
      const [wsRows] = await pool.query('SELECT name FROM workspaces WHERE id = ?', [wsId]);
      await pool.query(
        'INSERT INTO notifications (user_id, workspace_id, title, message, link) VALUES (?, ?, ?, ?, ?)',
        [
          existingUser[0].id,
          wsId,
          'Workspace Invitation',
          `You have been invited to join "${wsRows[0]?.name || 'Workspace'}" by ${req.user.name}.`,
          `/invite/${token}`,
        ]
      );
    }

    const [inv] = await pool.query(
      `SELECT i.*, w.name AS workspace_name, u.name AS inviter_name
       FROM invitations i
       JOIN workspaces w ON i.workspace_id = w.id
       JOIN users u ON i.inviter_id = u.id
       WHERE i.id = ?`,
      [invResult.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Invitation created successfully.',
      data: inv[0],
    });
  } catch (error) {
    console.error('[inviteMember Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create invitation.' });
  }
};

// GET /api/workspaces/:id/invitations
exports.getInvitations = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [adminCheck] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (adminCheck.length === 0 || (adminCheck[0].role !== 'owner' && adminCheck[0].role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Admin privileges required to view invitations.' });
    }

    const [invitations] = await pool.query(
      'SELECT * FROM invitations WHERE workspace_id = ? AND status = "pending" ORDER BY created_at DESC',
      [wsId]
    );
    return res.json({ success: true, data: invitations });
  } catch (error) {
    console.error('[getInvitations Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invitations.' });
  }
};

// GET /api/workspaces/my-invitations — Direct pending invitations for the logged-in user
exports.getMyPendingInvitations = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT i.*, w.name AS workspace_name, w.type AS workspace_type, u.name AS inviter_name, u.avatar AS inviter_avatar
       FROM invitations i
       JOIN workspaces w ON i.workspace_id = w.id
       JOIN users u ON i.inviter_id = u.id
       WHERE i.email = ? AND i.status = 'pending' AND i.expires_at > NOW()
       ORDER BY i.created_at DESC`,
      [req.user.email]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMyPendingInvitations Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve invitations.' });
  }
};

// GET /api/workspaces/invitations/:token — Public or user invite inspect
exports.getInviteByToken = async (req, res) => {
  try {
    const token = req.params.token || req.query.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT i.*, w.name AS workspace_name, w.type AS workspace_type, u.name AS inviter_name
       FROM invitations i
       JOIN workspaces w ON i.workspace_id = w.id
       JOIN users u ON i.inviter_id = u.id
       WHERE i.token = ? AND i.status = 'pending'`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invitation not found or has expired.' });
    }

    const invite = rows[0];
    if (new Date(invite.expires_at) < new Date()) {
      await pool.query('UPDATE invitations SET status = "expired" WHERE id = ?', [invite.id]);
      return res.status(410).json({ success: false, message: 'This invitation link has expired.' });
    }

    return res.json({ success: true, data: invite });
  } catch (error) {
    console.error('[getInviteByToken Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to load invitation.' });
  }
};

// POST /api/workspaces/invitations/:token/accept
exports.acceptInvite = async (req, res) => {
  try {
    const token = req.params.token || req.body.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required.' });
    }

    const pool = getPool();
    const [invRows] = await pool.query(
      'SELECT * FROM invitations WHERE token = ? AND status = "pending"',
      [token]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired invitation.' });
    }

    const inv = invRows[0];
    if (new Date(inv.expires_at) < new Date()) {
      await pool.query('UPDATE invitations SET status = "expired" WHERE id = ?', [inv.id]);
      return res.status(410).json({ success: false, message: 'This invitation has expired.' });
    }

    // Check not already member
    const [alreadyMember] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [inv.workspace_id, req.user.id]
    );

    if (alreadyMember.length === 0) {
      await pool.query(
        'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
        [inv.workspace_id, req.user.id, inv.role || 'member']
      );
    }

    await pool.query('UPDATE invitations SET status = "accepted" WHERE id = ?', [inv.id]);
    await logActivity({
      workspaceId: inv.workspace_id,
      userId: req.user.id,
      action: 'member_joined',
      metadata: { email: req.user.email, role: inv.role },
    });

    const [wsRows] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [inv.workspace_id]);
    return res.json({
      success: true,
      message: 'Workspace invitation accepted successfully.',
      data: wsRows[0],
    });
  } catch (error) {
    console.error('[acceptInvite Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept invitation.' });
  }
};

// POST /api/workspaces/invitations/:token/decline
exports.declineInvite = async (req, res) => {
  try {
    const token = req.params.token || req.body.token;
    if (!token) return res.status(400).json({ success: false, message: 'Token required.' });

    const pool = getPool();
    await pool.query('UPDATE invitations SET status = "cancelled" WHERE token = ?', [token]);
    return res.json({ success: true, message: 'Invitation declined.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to decline invitation.' });
  }
};

// GET /api/workspaces/:id/activity
exports.getActivity = async (req, res) => {
  try {
    const wsId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [memberCheck] = await pool.query(
      'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [wsId, req.user.id]
    );
    if (memberCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const [logs] = await pool.query(
      `SELECT al.*, u.name AS user_name, u.avatar AS user_avatar, t.title AS task_title
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN tasks t ON al.task_id = t.id
       WHERE al.workspace_id = ?
       ORDER BY al.created_at DESC
       LIMIT 50`,
      [wsId]
    );

    return res.json({ success: true, data: logs });
  } catch (error) {
    console.error('[getActivity Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity.' });
  }
};
