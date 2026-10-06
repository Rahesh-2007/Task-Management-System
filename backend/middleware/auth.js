const jwt = require('jsonwebtoken');
const { getPool } = require('../config/db');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] JWT_SECRET env variable is not set. Refusing to start in production.');
    process.exit(1);
  } else {
    console.warn('[Security Warning] JWT_SECRET is not set. Using an insecure dev default. Set JWT_SECRET in .env!');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_jwt_secret_dev_key_UNSAFE';

// Require valid JWT authentication token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, email, avatar FROM users WHERE id = ?', [decoded.id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token: User no longer exists.' });
    }
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
  }
}

// Check workspace membership and optional minimum role ('member' | 'admin' | 'owner')
function requireWorkspaceMember(minRole = 'member') {
  const roleHierarchy = { member: 1, admin: 2, owner: 3 };

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const workspaceId =
      req.params.workspaceId ||
      req.query.workspace_id ||
      req.query.workspaceId ||
      req.body.workspace_id ||
      req.body.workspaceId ||
      req.headers['x-workspace-id'];

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'Workspace ID is required for this operation.' });
    }

    try {
      const pool = getPool();
      const [members] = await pool.query(
        'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
        [workspaceId, req.user.id]
      );

      if (members.length === 0) {
        return res.status(403).json({ success: false, message: 'Forbidden: You are not a member of this workspace.' });
      }

      const userRole = members[0].role;
      if (roleHierarchy[userRole] < roleHierarchy[minRole]) {
        return res.status(403).json({ success: false, message: `Action requires ${minRole} privileges.` });
      }

      req.workspaceId = parseInt(workspaceId, 10);
      req.workspaceMember = { role: userRole, workspaceId: parseInt(workspaceId, 10) };
      next();
    } catch (err) {
      console.error('[Workspace Authorization Error]:', err.message);
      return res.status(500).json({ success: false, message: 'Failed to verify workspace permissions.' });
    }
  };
}

module.exports = { authMiddleware, requireWorkspaceMember, JWT_SECRET };
