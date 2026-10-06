const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[FATAL] DB_HOST, DB_USER, and DB_PASSWORD must be set in production. Refusing to start.');
    process.exit(1);
  } else {
    console.warn('[Database] Warning: Missing DB credentials in environment. Using fallback dev credentials.');
  }
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'rootx',       // dev fallback only
  password: process.env.DB_PASSWORD || '1234', // dev fallback only — never in production
  port: parseInt(process.env.DB_PORT || '3306', 10),
  multipleStatements: true,
  dateStrings: true, // Prevents UTC day shifting for DATE/DATETIME columns
};

const DB_NAME = process.env.DB_NAME || 'taskflow_db';

let pool;

async function initializeDatabase() {
  try {
    const initialConnection = await mysql.createConnection(dbConfig);
    console.log(`[Database] Connected to MySQL server at ${dbConfig.host}:${dbConfig.port}`);

    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[Database] Database '${DB_NAME}' verified/created.`);
    await initialConnection.end();

    pool = mysql.createPool({
      ...dbConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
    });

    // 1. USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(191) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. WORKSPACES
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        type ENUM('personal','company') NOT NULL DEFAULT 'personal',
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_owner (owner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. WORKSPACE MEMBERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workspace_members (
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('owner','admin','member') NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (workspace_id, user_id),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. PROJECTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        color VARCHAR(20) DEFAULT '#E11D48',
        is_favorite BOOLEAN DEFAULT FALSE,
        is_archived BOOLEAN DEFAULT FALSE,
        default_view ENUM('list','board','calendar') DEFAULT 'list',
        lead_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (lead_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_workspace (workspace_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. SECTIONS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        project_id INT NULL,
        name VARCHAR(150) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        INDEX idx_sec_workspace (workspace_id),
        INDEX idx_sec_project (project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. TASKS (Must be created before task_labels & comments)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        project_id INT NULL,
        section_id INT NULL,
        created_by INT NULL,
        assignee_id INT NULL,
        parent_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('todo','in_progress','done') DEFAULT 'todo',
        priority ENUM('p1','p2','p3','p4') DEFAULT 'p4',
        due_date DATE NULL,
        due_time TIME NULL,
        deadline DATE NULL,
        recurrence_rule VARCHAR(100) NULL,
        reminder_at DATETIME NULL,
        estimate_minutes INT NULL,
        position INT NOT NULL DEFAULT 0,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
        INDEX idx_task_workspace_status (workspace_id, status),
        INDEX idx_task_assignee (assignee_id),
        INDEX idx_task_due (due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. LABELS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS labels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        name VARCHAR(80) NOT NULL,
        color VARCHAR(20) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        INDEX idx_workspace_label (workspace_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. TASK LABELS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS task_labels (
        task_id INT NOT NULL,
        label_id INT NOT NULL,
        PRIMARY KEY (task_id, label_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. COMMENTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_task_comments (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. INVITATIONS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        inviter_id INT NOT NULL,
        email VARCHAR(191) NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        role ENUM('admin','member') DEFAULT 'member',
        status ENUM('pending','accepted','cancelled','expired') DEFAULT 'pending',
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_invite_token (token)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. ACTIVITY LOGS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NULL,
        task_id INT NULL,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_workspace_activity (workspace_id),
        INDEX idx_task_activity (task_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. NOTIFICATIONS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        workspace_id INT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link VARCHAR(255) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        INDEX idx_user_notif (user_id, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. MEETINGS (Google Meet integration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        creator_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        meeting_link VARCHAR(500) NOT NULL DEFAULT 'https://meet.google.com/new',
        scheduled_start DATETIME NOT NULL,
        duration_minutes INT NOT NULL DEFAULT 30,
        status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_meet_ws (workspace_id, scheduled_start)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. CHAT MESSAGES (Team real-time chat)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_chat_ws (workspace_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 15. VACATIONS (Team vacations & time-off calendar)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vacations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workspace_id INT NOT NULL,
        user_id INT NOT NULL,
        type ENUM('vacation', 'sick', 'personal', 'remote') DEFAULT 'vacation',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_vac_ws (workspace_id, start_date, end_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[Database] All tables initialized and verified successfully in correct relational order.');

    // Phase 2: Idempotent column migrations (MySQL lacks ADD COLUMN IF NOT EXISTS)
    // Add workspaces.is_default if not present
    const [wsDefaultCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'workspaces' AND COLUMN_NAME = 'is_default'`,
      [DB_NAME]
    );
    if (wsDefaultCol.length === 0) {
      await pool.query(`ALTER TABLE workspaces ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE`);
      console.log('[Database] Migration: Added workspaces.is_default');
    }

    // Add projects.is_inbox if not present
    const [projInboxCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'is_inbox'`,
      [DB_NAME]
    );
    if (projInboxCol.length === 0) {
      await pool.query(`ALTER TABLE projects ADD COLUMN is_inbox BOOLEAN NOT NULL DEFAULT FALSE`);
      console.log('[Database] Migration: Added projects.is_inbox');
    }

    // Add tasks.reminder_sent_at if not present (Phase 6 scheduler needs this)
    const [reminderSentCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'reminder_sent_at'`,
      [DB_NAME]
    );
    if (reminderSentCol.length === 0) {
      await pool.query(`ALTER TABLE tasks ADD COLUMN reminder_sent_at DATETIME NULL`);
      console.log('[Database] Migration: Added tasks.reminder_sent_at');
    }

    // Ensure workspace_members.role ENUM includes 'owner'
    await pool.query(`ALTER TABLE workspace_members MODIFY COLUMN role ENUM('owner','admin','member') NOT NULL DEFAULT 'member'`).catch(() => {});

    // Ensure invitations has role, expires_at, and expanded status ENUM
    const [invRoleCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'invitations' AND COLUMN_NAME = 'role'`,
      [DB_NAME]
    );
    if (invRoleCol.length === 0) {
      await pool.query(`ALTER TABLE invitations ADD COLUMN role ENUM('admin','member') DEFAULT 'member'`);
      console.log('[Database] Migration: Added invitations.role');
    }

    const [invExpiresCol] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'invitations' AND COLUMN_NAME = 'expires_at'`,
      [DB_NAME]
    );
    if (invExpiresCol.length === 0) {
      await pool.query(`ALTER TABLE invitations ADD COLUMN expires_at DATETIME NULL`);
      console.log('[Database] Migration: Added invitations.expires_at');
    }

    await pool.query(`ALTER TABLE invitations MODIFY COLUMN status ENUM('pending','accepted','cancelled','expired') DEFAULT 'pending'`).catch(() => {});

    // Backfill: mark each user's oldest personal workspace as is_default if none set
    await pool.query(`
      UPDATE workspaces w
      INNER JOIN (
        SELECT MIN(id) AS min_id, owner_id
        FROM workspaces
        WHERE type = 'personal'
        GROUP BY owner_id
      ) oldest ON w.id = oldest.min_id
      SET w.is_default = TRUE
      WHERE w.is_default = FALSE
    `).catch(() => {});

    // Backfill: mark projects named 'Inbox' (case-insensitive) as is_inbox where not set
    await pool.query(`
      UPDATE projects SET is_inbox = TRUE
      WHERE LOWER(name) = 'inbox' AND is_inbox = FALSE
    `).catch(() => {});

    // Ensure tasks table has all required columns
    const taskColumnsToAdd = [
      { name: 'due_time', def: 'TIME NULL' },
      { name: 'start_time', def: 'TIME NULL' },
      { name: 'position', def: 'INT NOT NULL DEFAULT 0' },
      { name: 'section_id', def: 'INT NULL' },
      { name: 'created_by', def: 'INT NULL' },
      { name: 'parent_id', def: 'INT NULL' },
      { name: 'deadline', def: 'DATE NULL' },
      { name: 'recurrence_rule', def: 'VARCHAR(100) NULL' },
      { name: 'reminder_at', def: 'DATETIME NULL' },
      { name: 'estimate_minutes', def: 'INT NULL' },
      { name: 'completed_at', def: 'DATETIME NULL' },
    ];

    const [existingTaskCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tasks'`,
      [DB_NAME]
    );
    const existingColNames = new Set(existingTaskCols.map((c) => c.COLUMN_NAME.toLowerCase()));

    for (const col of taskColumnsToAdd) {
      if (!existingColNames.has(col.name.toLowerCase())) {
        await pool.query(`ALTER TABLE tasks ADD COLUMN \`${col.name}\` ${col.def}`);
        console.log(`[Database] Migration: Added tasks.${col.name}`);
      }
    }

    // Ensure tasks table priority and status ENUMs match modern standard
    try {
      await pool.query('ALTER TABLE tasks MODIFY COLUMN priority VARCHAR(50) DEFAULT "p4"');
      await pool.query("UPDATE tasks SET priority = 'p4' WHERE priority = 'low' OR priority IS NULL");
      await pool.query("UPDATE tasks SET priority = 'p3' WHERE priority = 'medium'");
      await pool.query("UPDATE tasks SET priority = 'p2' WHERE priority = 'high'");
      await pool.query("UPDATE tasks SET priority = 'p1' WHERE priority = 'urgent'");
      await pool.query("UPDATE tasks SET priority = 'p4' WHERE priority NOT IN ('p1','p2','p3','p4')");
      await pool.query("ALTER TABLE tasks MODIFY COLUMN priority ENUM('p1','p2','p3','p4') DEFAULT 'p4'");
    } catch (migErr) {
      console.error('[Migration tasks.priority warning]:', migErr.message);
    }

    try {
      await pool.query('ALTER TABLE tasks MODIFY COLUMN status VARCHAR(50) DEFAULT "todo"');
      await pool.query("UPDATE tasks SET status = 'done' WHERE status = 'completed'");
      await pool.query("UPDATE tasks SET status = 'todo' WHERE status NOT IN ('todo','in_progress','done')");
      await pool.query("ALTER TABLE tasks MODIFY COLUMN status ENUM('todo','in_progress','done') DEFAULT 'todo'");
    } catch (migErr) {
      console.error('[Migration tasks.status warning]:', migErr.message);
    }

    console.log('[Database] Phase 2 migrations complete.');
  } catch (error) {
    console.error('[Database Error] Initialization failed:', error.message);
    throw error;
  }
}

// Activity logger helper
async function logActivity({ workspaceId, taskId, userId, action, metadata }) {
  try {
    if (!pool) return;
    await pool.query(
      'INSERT INTO activity_logs (workspace_id, task_id, user_id, action, metadata) VALUES (?, ?, ?, ?, ?)',
      [workspaceId || null, taskId || null, userId || null, action, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (e) {
    console.error('[Activity Log Error]:', e.message);
  }
}

/**
 * ensureDefaultWorkspace(userId) — idempotent.
 * Guarantees the user has a personal default workspace with an Inbox project.
 * Safe to call on register, login, and GET /api/workspaces.
 */
async function ensureDefaultWorkspace(userId) {
  try {
    const p = getPool();
    // Check if user already has a default workspace
    const [existing] = await p.query(
      `SELECT w.id FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ? AND w.type = 'personal' AND w.is_default = TRUE
       LIMIT 1`,
      [userId]
    );
    if (existing.length > 0) return existing[0].id;

    // Check for any personal workspace and promote it
    const [anyPersonal] = await p.query(
      `SELECT w.id FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = ? AND w.type = 'personal'
       ORDER BY w.created_at ASC LIMIT 1`,
      [userId]
    );
    if (anyPersonal.length > 0) {
      await p.query('UPDATE workspaces SET is_default = TRUE WHERE id = ?', [anyPersonal[0].id]);
      // Ensure it has an Inbox project
      const [inboxCheck] = await p.query(
        'SELECT id FROM projects WHERE workspace_id = ? AND is_inbox = TRUE LIMIT 1',
        [anyPersonal[0].id]
      );
      if (inboxCheck.length === 0) {
        await p.query(
          'INSERT INTO projects (workspace_id, name, description, color, is_inbox) VALUES (?, ?, ?, ?, ?)',
          [anyPersonal[0].id, 'Inbox', 'Default task destination', '#E11D48', true]
        );
      }
      return anyPersonal[0].id;
    }

    // No personal workspace at all — create one
    const [userRows] = await p.query('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = userRows[0]?.name || 'My';
    const [wsResult] = await p.query(
      'INSERT INTO workspaces (name, type, owner_id, is_default) VALUES (?, ?, ?, ?)',
      ['Personal', 'personal', userId, true]
    );
    const wsId = wsResult.insertId;
    await p.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [wsId, userId, 'owner']
    );
    await p.query(
      'INSERT INTO projects (workspace_id, name, description, color, is_inbox) VALUES (?, ?, ?, ?, ?)',
      [wsId, 'Inbox', 'Default task destination', '#E11D48', true]
    );
    console.log(`[ensureDefaultWorkspace] Created Personal workspace for user ${userId}`);
    return wsId;
  } catch (err) {
    console.error('[ensureDefaultWorkspace Error]:', err.message);
  }
}

module.exports = {
  initializeDatabase,
  ensureDefaultWorkspace,
  getPool: () => {
    if (!pool) throw new Error('Database pool has not been initialized. Call initializeDatabase first.');
    return pool;
  },
  logActivity,
};
