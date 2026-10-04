const { getPool } = require('../config/db');

// Simple password check — plain text comparison (dev/local)
// For production: use bcryptjs. Kept simple per user requirement.

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, message: 'Valid email is required.' });
    if (!password || password.length < 4) return res.status(400).json({ success: false, message: 'Password must be at least 4 characters.' });

    const pool = getPool();

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate avatar initials
    const initials = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // Create user (plain password for local dev)
    const [userResult] = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), password, initials]
    );
    const userId = userResult.insertId;

    // Create personal workspace for the new user
    const [wsResult] = await pool.query(
      'INSERT INTO workspaces (name, type, owner_id) VALUES (?, ?, ?)',
      [`${name.trim()}'s Workspace`, 'personal', userId]
    );
    const workspaceId = wsResult.insertId;

    // Add user as admin of their personal workspace
    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [workspaceId, userId, 'admin']
    );

    // Fetch created user
    const [userRows] = await pool.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [userId]);
    const [wsRows] = await pool.query('SELECT * FROM workspaces WHERE id = ?', [workspaceId]);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: userRows[0],
        workspace: wsRows[0]
      }
    });
  } catch (error) {
    console.error('[register Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create account.', error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    // Simple plain-text comparison (local dev)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Get user's workspaces
    const [workspaces] = await pool.query(`
      SELECT w.*, wm.role
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ?
      ORDER BY w.type ASC, w.created_at ASC
    `, [user.id]);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          created_at: user.created_at
        },
        workspaces
      }
    });
  } catch (error) {
    console.error('[login Error]:', error);
    res.status(500).json({ success: false, message: 'Login failed.', error: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });

    const [workspaces] = await pool.query(`
      SELECT w.*, wm.role
      FROM workspaces w
      JOIN workspace_members wm ON w.id = wm.workspace_id
      WHERE wm.user_id = ?
      ORDER BY w.type ASC, w.created_at ASC
    `, [req.user.id]);

    res.json({ success: true, data: { user: rows[0], workspaces } });
  } catch (error) {
    console.error('[getMe Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to get user info.', error: error.message });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const pool = getPool();

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required.' });

    // Check email uniqueness if changing
    if (email && email.toLowerCase().trim() !== req.user.email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email.toLowerCase().trim(), req.user.id]);
      if (existing.length > 0) return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const newEmail = email ? email.toLowerCase().trim() : req.user.email;
    const newAvatar = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    await pool.query('UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?', [name.trim(), newEmail, newAvatar, req.user.id]);
    const [updated] = await pool.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [req.user.id]);

    res.json({ success: true, message: 'Profile updated.', data: updated[0] });
  } catch (error) {
    console.error('[updateProfile Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Both passwords are required.' });
    if (newPassword.length < 4) return res.status(400).json({ success: false, message: 'New password must be at least 4 characters.' });

    const pool = getPool();
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows[0].password !== currentPassword) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('[changePassword Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to change password.', error: error.message });
  }
};
