const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { getPool, ensureDefaultWorkspace } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
    }

    const { name, email, password } = parseResult.data;
    const pool = getPool();
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const initials = name
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const [userResult] = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [name.trim(), cleanEmail, hashedPassword, initials]
    );
    const userId = userResult.insertId;

    // Create personal default workspace
    const [wsResult] = await pool.query(
      'INSERT INTO workspaces (name, type, owner_id, is_default) VALUES (?, ?, ?, ?)',
      ['Personal', 'personal', userId, true]
    );
    const workspaceId = wsResult.insertId;

    // Add owner member to workspace
    await pool.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [workspaceId, userId, 'owner']
    );

    // Create default "Inbox" project with is_inbox=true
    await pool.query(
      'INSERT INTO projects (workspace_id, name, description, color, is_inbox) VALUES (?, ?, ?, ?, ?)',
      [workspaceId, 'Inbox', 'Default task destination', '#E11D48', true]
    );

    const userObj = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      avatar: initials,
    };

    const token = generateToken(userObj);

    const [workspaces] = await pool.query(
      `SELECT w.*, wm.role FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ?`,
      [userId]
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        token,
        user: userObj,
        workspaces,
        activeWorkspace: workspaces[0] || null,
      },
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    return res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
    }

    const { email, password } = parseResult.data;
    const cleanEmail = email.toLowerCase().trim();
    const pool = getPool();

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = rows[0];
    let isMatch = false;

    // Check bcrypt hash vs legacy plain-text password
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text check & auto-upgrade to bcrypt
      if (user.password === password) {
        isMatch = true;
        const newHashed = await bcrypt.hash(password, 12);
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHashed, user.id]);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Guarantee the user always has a default personal workspace
    await ensureDefaultWorkspace(user.id).catch(() => {});

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      created_at: user.created_at,
    };

    const token = generateToken(userObj);

    const [workspaces] = await pool.query(
      `SELECT w.*, wm.role FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ?
       ORDER BY w.type ASC, w.created_at ASC`,
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        token,
        user: userObj,
        workspaces,
        activeWorkspace: workspaces[0] || null,
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({ success: false, message: 'Login failed.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [workspaces] = await pool.query(
      `SELECT w.*, wm.role FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ?
       ORDER BY w.type ASC, w.created_at ASC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: {
        user: rows[0],
        workspaces,
        activeWorkspace: workspaces[0] || null,
      },
    });
  } catch (error) {
    console.error('[getMe Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve session.' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const pool = getPool();
    const cleanEmail = email ? email.toLowerCase().trim() : req.user.email;

    if (email && cleanEmail !== req.user.email) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [cleanEmail, req.user.id]);
      if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Email is already taken.' });
      }
    }

    const initials = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    const finalAvatar = avatar !== undefined && typeof avatar === 'string' && avatar.trim() ? avatar.trim() : initials;

    await pool.query('UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?', [
      name.trim(),
      cleanEmail,
      finalAvatar,
      req.user.id,
    ]);

    const [updated] = await pool.query('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated[0],
    });
  } catch (error) {
    console.error('[updateProfile Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newHashed, req.user.id]);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('[changePassword Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    // In dev, log password reset request
    console.log(`[Auth] Password reset requested for: ${email}`);
    return res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process request.' });
  }
};
