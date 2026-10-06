const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { initializeDatabase, getPool } = require('./config/db');

dotenv.config();

async function seed() {
  console.log('[Seed] Starting database seeding...');
  await initializeDatabase();
  const pool = getPool();

  // Create or retrieve Demo User
  const demoEmail = 'demo@taskflow.local';
  const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [demoEmail]);
  let userId;

  if (existingUser.length === 0) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const [userRes] = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      ['Demo User', demoEmail, hashedPassword, 'DU']
    );
    userId = userRes.insertId;
    console.log(`[Seed] Created Demo User: ${demoEmail} / password123 (id: ${userId})`);
  } else {
    userId = existingUser[0].id;
    console.log(`[Seed] Found existing Demo User (id: ${userId})`);
  }

  // Check/Create Default Workspace
  const [existingWs] = await pool.query('SELECT * FROM workspaces WHERE owner_id = ? LIMIT 1', [userId]);
  let workspaceId;

  if (existingWs.length === 0) {
    const [wsRes] = await pool.query(
      'INSERT INTO workspaces (name, type, owner_id) VALUES (?, ?, ?)',
      ['TaskFlow Core Workspace', 'company', userId]
    );
    workspaceId = wsRes.insertId;
    await pool.query('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)', [
      workspaceId,
      userId,
      'owner',
    ]);
    console.log(`[Seed] Created Workspace (id: ${workspaceId})`);
  } else {
    workspaceId = existingWs[0].id;
    console.log(`[Seed] Found existing Workspace (id: ${workspaceId})`);
  }

  // Create Projects
  const projects = [
    { name: 'Inbox', color: '#E11D48', desc: 'Default task stream' },
    { name: 'Product Launch', color: '#3B82F6', desc: 'Q4 Product release roadmap' },
    { name: 'Marketing Campaign', color: '#10B981', desc: 'Social media & outreach' },
  ];

  const projectMap = {};
  for (const p of projects) {
    const [pRows] = await pool.query(
      'SELECT id FROM projects WHERE workspace_id = ? AND name = ?',
      [workspaceId, p.name]
    );
    if (pRows.length === 0) {
      const [pRes] = await pool.query(
        'INSERT INTO projects (workspace_id, name, description, color) VALUES (?, ?, ?, ?)',
        [workspaceId, p.name, p.desc, p.color]
      );
      projectMap[p.name] = pRes.insertId;
    } else {
      projectMap[p.name] = pRows[0].id;
    }
  }

  // Create Sections in Product Launch
  const launchProjectId = projectMap['Product Launch'];
  const sections = ['Backlog', 'In Development', 'QA & Review', 'Done'];
  for (let i = 0; i < sections.length; i++) {
    const sName = sections[i];
    const [sRows] = await pool.query(
      'SELECT id FROM sections WHERE workspace_id = ? AND project_id = ? AND name = ?',
      [workspaceId, launchProjectId, sName]
    );
    if (sRows.length === 0) {
      await pool.query(
        'INSERT INTO sections (workspace_id, project_id, name, position) VALUES (?, ?, ?, ?)',
        [workspaceId, launchProjectId, sName, i]
      );
    }
  }

  // Create Labels
  const labels = [
    { name: 'Design', color: '#8B5CF6' },
    { name: 'Backend', color: '#10B981' },
    { name: 'Frontend', color: '#F59E0B' },
    { name: 'Urgent', color: '#EF4444' },
  ];
  for (const l of labels) {
    const [lRows] = await pool.query(
      'SELECT id FROM labels WHERE workspace_id = ? AND name = ?',
      [workspaceId, l.name]
    );
    if (lRows.length === 0) {
      await pool.query('INSERT INTO labels (workspace_id, name, color) VALUES (?, ?, ?)', [
        workspaceId,
        l.name,
        l.color,
      ]);
    }
  }

  // Seed sample tasks
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const tasksToSeed = [
    {
      title: 'Review System Architecture & Routing Refactoring',
      description: 'Ensure all pages have separate React Router routes and nested layouts.',
      status: 'in_progress',
      priority: 'p1',
      due_date: today,
      project_id: projectMap['Product Launch'],
    },
    {
      title: 'Setup Timezone-Safe MySQL DATE queries',
      description: 'Verify dateStrings: true and timezone query support.',
      status: 'done',
      priority: 'p2',
      due_date: today,
      project_id: projectMap['Product Launch'],
    },
    {
      title: 'Draft Q4 Product Marketing Launch Video',
      description: 'Prepare script and visuals for social media showcase.',
      status: 'todo',
      priority: 'p3',
      due_date: tomorrow,
      project_id: projectMap['Marketing Campaign'],
    },
  ];

  for (const t of tasksToSeed) {
    const [tRows] = await pool.query(
      'SELECT id FROM tasks WHERE workspace_id = ? AND title = ?',
      [workspaceId, t.title]
    );
    if (tRows.length === 0) {
      await pool.query(
        `INSERT INTO tasks (workspace_id, project_id, created_by, assignee_id, title, description, status, priority, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [workspaceId, t.project_id, userId, userId, t.title, t.description, t.status, t.priority, t.due_date]
      );
    }
  }

  console.log('✅ [Seed] Database seeding completed successfully.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ [Seed] Error during seeding:', err.message);
  process.exit(1);
});
