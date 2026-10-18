const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { initializeDatabase, getPool } = require('./config/db');

dotenv.config();

async function seedDemoData() {
  console.log('🚀 [Demo Seeder] Starting complete presentation demo setup with extensive tasks...');
  await initializeDatabase();
  const pool = getPool();

  const demoEmail = '24104115@nec.edu.in';
  const demoPass = '123456';
  const demoName = 'NEC Staff Coordinator';
  const hashedDemoPass = await bcrypt.hash(demoPass, 12);

  // 1. Create or update primary demo user
  const [existingDemoUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [demoEmail]);
  let demoUserId;
  if (existingDemoUsers.length === 0) {
    const [res] = await pool.query(
      'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
      [demoName, demoEmail, hashedDemoPass, 'SC']
    );
    demoUserId = res.insertId;
    console.log(`✅ Created Primary Demo User: ${demoEmail} (id: ${demoUserId})`);
  } else {
    demoUserId = existingDemoUsers[0].id;
    await pool.query('UPDATE users SET password = ?, name = ?, avatar = ? WHERE id = ?', [
      hashedDemoPass,
      demoName,
      'SC',
      demoUserId,
    ]);
    console.log(`✅ Updated existing Demo User: ${demoEmail} with password "${demoPass}" (id: ${demoUserId})`);
  }

  // 2. Create Team Colleague Users
  const teamStaff = [
    { name: 'Dr. Ramesh Kumar (HOD)', email: 'ramesh.hod@nec.edu.in', avatar: 'RK' },
    { name: 'Prof. Priya Sharma', email: 'priya.cse@nec.edu.in', avatar: 'PS' },
    { name: 'Dr. Ananya Verma', email: 'ananya.research@nec.edu.in', avatar: 'AV' },
    { name: 'Er. Vikram Patel', email: 'vikram.cloud@nec.edu.in', avatar: 'VP' },
  ];

  const staffUserIds = {};
  for (const staff of teamStaff) {
    const [exists] = await pool.query('SELECT * FROM users WHERE email = ?', [staff.email]);
    if (exists.length === 0) {
      const staffPass = await bcrypt.hash('123456', 12);
      const [res] = await pool.query(
        'INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)',
        [staff.name, staff.email, staffPass, staff.avatar]
      );
      staffUserIds[staff.email] = res.insertId;
    } else {
      staffUserIds[staff.email] = exists[0].id;
    }
  }

  // 3. Workspaces
  // A. Personal Workspace
  const [existingPersonal] = await pool.query(
    "SELECT id FROM workspaces WHERE owner_id = ? AND type = 'personal' LIMIT 1",
    [demoUserId]
  );
  let personalWsId;
  if (existingPersonal.length === 0) {
    const [res] = await pool.query(
      "INSERT INTO workspaces (name, type, owner_id, is_default) VALUES (?, 'personal', ?, TRUE)",
      ['Personal Tasks', demoUserId]
    );
    personalWsId = res.insertId;
    await pool.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')",
      [personalWsId, demoUserId]
    );
  } else {
    personalWsId = existingPersonal[0].id;
  }

  // Ensure Personal has an Inbox project
  const [personalInbox] = await pool.query(
    'SELECT id FROM projects WHERE workspace_id = ? AND is_inbox = TRUE LIMIT 1',
    [personalWsId]
  );
  if (personalInbox.length === 0) {
    await pool.query(
      'INSERT INTO projects (workspace_id, name, description, color, is_inbox) VALUES (?, ?, ?, ?, TRUE)',
      [personalWsId, 'Inbox', 'Personal task stream', '#E11D48']
    );
  }

  // B. Main Department Company Workspace
  const companyWsName = 'NEC Engineering & Academic Operations';
  const [existingCompany] = await pool.query(
    'SELECT id FROM workspaces WHERE name = ? AND owner_id = ? LIMIT 1',
    [companyWsName, demoUserId]
  );
  let companyWsId;
  if (existingCompany.length === 0) {
    const [res] = await pool.query(
      "INSERT INTO workspaces (name, type, owner_id, is_default) VALUES (?, 'company', ?, FALSE)",
      [companyWsName, demoUserId]
    );
    companyWsId = res.insertId;
    console.log(`✅ Created Department Workspace: "${companyWsName}" (id: ${companyWsId})`);
  } else {
    companyWsId = existingCompany[0].id;
  }

  // Add Demo User and all team staff as members of the company workspace
  await pool.query(
    "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner') ON DUPLICATE KEY UPDATE role = 'owner'",
    [companyWsId, demoUserId]
  );

  for (const staff of teamStaff) {
    const sId = staffUserIds[staff.email];
    await pool.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'member') ON DUPLICATE KEY UPDATE role = 'member'",
      [companyWsId, sId]
    );
  }

  // 4. Create Projects in Department Workspace
  const projectDefs = [
    { name: 'Inbox', desc: 'Department general inbox', color: '#E11D48', is_inbox: true },
    { name: 'NAAC & NBA Accreditation 2026', desc: 'Criteria documentation, audits, and faculty files', color: '#8B5CF6', is_inbox: false },
    { name: 'Curriculum & Exam Management', desc: 'Syllabus revision, question bank, and grading rubrics', color: '#3B82F6', is_inbox: false },
    { name: 'Smart Campus Cloud Infrastructure', desc: 'Server virtualization, lab machines, and student LMS', color: '#10B981', is_inbox: false },
    { name: 'Faculty Research & Publications', desc: 'Scopus indexed journals, patents, and grant proposals', color: '#F59E0B', is_inbox: false },
  ];

  const projectMap = {};
  for (const p of projectDefs) {
    const [pRows] = await pool.query(
      'SELECT id FROM projects WHERE workspace_id = ? AND name = ?',
      [companyWsId, p.name]
    );
    if (pRows.length === 0) {
      const [res] = await pool.query(
        'INSERT INTO projects (workspace_id, name, description, color, is_inbox) VALUES (?, ?, ?, ?, ?)',
        [companyWsId, p.name, p.desc, p.color, p.is_inbox]
      );
      projectMap[p.name] = res.insertId;
    } else {
      projectMap[p.name] = pRows[0].id;
    }
  }

  // 5. Create Sections for Projects
  const naacProjId = projectMap['NAAC & NBA Accreditation 2026'];
  const naacSections = [
    'Criterion 1: Curricular Aspects',
    'Criterion 2: Teaching-Learning & Evaluation',
    'Criterion 3: Research & Innovations',
    'Criterion 4: Infrastructure & Learning Resources',
    'Verified & Ready for Submission',
  ];

  const sectionMap = {};
  for (let i = 0; i < naacSections.length; i++) {
    const sName = naacSections[i];
    const [sRows] = await pool.query(
      'SELECT id FROM sections WHERE workspace_id = ? AND project_id = ? AND name = ?',
      [companyWsId, naacProjId, sName]
    );
    if (sRows.length === 0) {
      const [res] = await pool.query(
        'INSERT INTO sections (workspace_id, project_id, name, position) VALUES (?, ?, ?, ?)',
        [companyWsId, naacProjId, sName, i]
      );
      sectionMap[sName] = res.insertId;
    } else {
      sectionMap[sName] = sRows[0].id;
    }
  }

  // Sections for Curriculum project
  const currProjId = projectMap['Curriculum & Exam Management'];
  const currSections = ['Drafting & Proposals', 'BOS Review', 'Academic Council Approval', 'Published'];
  for (let i = 0; i < currSections.length; i++) {
    const sName = currSections[i];
    const [sRows] = await pool.query(
      'SELECT id FROM sections WHERE workspace_id = ? AND project_id = ? AND name = ?',
      [companyWsId, currProjId, sName]
    );
    if (sRows.length === 0) {
      const [res] = await pool.query(
        'INSERT INTO sections (workspace_id, project_id, name, position) VALUES (?, ?, ?, ?)',
        [companyWsId, currProjId, sName, i]
      );
      sectionMap[`curr_${sName}`] = res.insertId;
    } else {
      sectionMap[`curr_${sName}`] = sRows[0].id;
    }
  }

  // 6. Labels
  const labels = [
    { name: 'Urgent Audit', color: '#EF4444' },
    { name: 'Academics', color: '#3B82F6' },
    { name: 'Faculty Notice', color: '#F59E0B' },
    { name: 'Infrastructure', color: '#10B981' },
    { name: 'Research & NAAC', color: '#8B5CF6' },
    { name: 'Lab Practical', color: '#EC4899' },
    { name: 'Examination', color: '#6366F1' },
  ];

  const labelMap = {};
  for (const l of labels) {
    const [lRows] = await pool.query(
      'SELECT id FROM labels WHERE workspace_id = ? AND name = ?',
      [companyWsId, l.name]
    );
    if (lRows.length === 0) {
      const [res] = await pool.query(
        'INSERT INTO labels (workspace_id, name, color) VALUES (?, ?, ?)',
        [companyWsId, l.name, l.color]
      );
      labelMap[l.name] = res.insertId;
    } else {
      labelMap[l.name] = lRows[0].id;
    }
  }

  // 7. Generate Rich Multi-Day Tasks
  const fmt = (d) => d.toISOString().split('T')[0];
  const now = new Date();
  const dMinus4 = fmt(new Date(now.getTime() - 4 * 86400000));
  const dMinus2 = fmt(new Date(now.getTime() - 2 * 86400000));
  const dMinus1 = fmt(new Date(now.getTime() - 1 * 86400000));
  const dToday = fmt(now);
  const dPlus1 = fmt(new Date(now.getTime() + 1 * 86400000));
  const dPlus2 = fmt(new Date(now.getTime() + 2 * 86400000));
  const dPlus3 = fmt(new Date(now.getTime() + 3 * 86400000));
  const dPlus4 = fmt(new Date(now.getTime() + 4 * 86400000));
  const dPlus5 = fmt(new Date(now.getTime() + 5 * 86400000));
  const dPlus6 = fmt(new Date(now.getTime() + 6 * 86400000));
  const dPlus7 = fmt(new Date(now.getTime() + 7 * 86400000));
  const dPlus14 = fmt(new Date(now.getTime() + 14 * 86400000));

  const allTasks = [
    // --- OVERDUE TASKS (Triggering Deadline Alert Notifications) ---
    {
      title: '⚠️ Submit Final NAAC Criterion 3 Research Grant Reports',
      description: 'Deadline passed! Compile external funding grant records and faculty journal metrics for inspection.',
      status: 'todo',
      priority: 'p1',
      due_date: dMinus4,
      deadline: dMinus4,
      project_id: naacProjId,
      section_id: sectionMap['Criterion 3: Research & Innovations'],
      assignee_id: demoUserId,
      created_by: staffUserIds['ramesh.hod@nec.edu.in'],
      labels: ['Urgent Audit', 'Research & NAAC'],
      subtasks: [
        { title: 'Collect AICTE & DST grant sanction letters', completed: true },
        { title: 'Verify IEEE and Scopus publication list with authors', completed: false },
        { title: 'Get signed approval from Research Dean', completed: false },
      ],
      comments: [
        { user: staffUserIds['ramesh.hod@nec.edu.in'], text: 'Please expedite this as the NAAC peer team visit schedule is confirmed.' },
        { user: demoUserId, text: 'Working on consolidating the last 3 grant utilization certificates now.' },
      ],
    },
    {
      title: 'Audit Student Feedback Analysis for Even Semester',
      description: 'Faculty course outcome attainment feedback reports must be archived.',
      status: 'todo',
      priority: 'p2',
      due_date: dMinus2,
      deadline: dMinus2,
      project_id: naacProjId,
      section_id: sectionMap['Criterion 2: Teaching-Learning & Evaluation'],
      assignee_id: staffUserIds['priya.cse@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Academics'],
    },
    {
      title: 'Laboratory Power Backup UPS Load Testing Report',
      description: 'Diesel generator and online UPS switchover diagnostics for Computing Block.',
      status: 'todo',
      priority: 'p2',
      due_date: dMinus1,
      deadline: dMinus1,
      project_id: projectMap['Smart Campus Cloud Infrastructure'],
      assignee_id: staffUserIds['vikram.cloud@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Infrastructure'],
    },

    // --- DUE TODAY TASKS ---
    {
      title: '⏰ Finalize Mid-Term Exam Question Papers & Rubrics',
      description: 'Allotted deadline is TODAY. Submit bloom taxonomy verified question papers to exam cell.',
      status: 'in_progress',
      priority: 'p1',
      due_date: dToday,
      deadline: dToday,
      project_id: currProjId,
      section_id: sectionMap['curr_Drafting & Proposals'],
      assignee_id: demoUserId,
      created_by: demoUserId,
      labels: ['Academics', 'Examination'],
      subtasks: [
        { title: 'Draft Section A (20 Marks)', completed: true },
        { title: 'Draft Section B & C (80 Marks)', completed: true },
        { title: 'Verify answer key and evaluation scheme', completed: false },
      ],
    },
    {
      title: 'Review R22 Autonomous Curriculum Revision Electives',
      description: 'Include Cloud Computing, GenAI, and Cyber Security advanced electives in 6th semester.',
      status: 'in_progress',
      priority: 'p1',
      due_date: dToday,
      deadline: dToday,
      project_id: currProjId,
      section_id: sectionMap['curr_BOS Review'],
      assignee_id: staffUserIds['ramesh.hod@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Academics'],
    },
    {
      title: 'Verify Student Attendance Shortage List (< 75%)',
      description: 'Generate list from ERP portal and inform student faculty mentors.',
      status: 'todo',
      priority: 'p2',
      due_date: dToday,
      deadline: dToday,
      project_id: projectMap['Inbox'],
      assignee_id: demoUserId,
      created_by: demoUserId,
      labels: ['Faculty Notice'],
    },
    {
      title: 'Weekly Academic Coordination Committee Standup',
      description: 'Recurring weekly sync on student attendance and laboratory schedule.',
      status: 'todo',
      priority: 'p3',
      due_date: dToday,
      recurrence_rule: 'every week',
      project_id: projectMap['Inbox'],
      assignee_id: demoUserId,
      created_by: demoUserId,
      labels: ['Faculty Notice'],
    },

    // --- UPCOMING DAY +1 (TOMORROW) ---
    {
      title: 'Campus Cloud Server Migration & High Availability Sync',
      description: 'Migrate student portal VM instances to OpenStack private cloud cluster.',
      status: 'todo',
      priority: 'p1',
      due_date: dPlus1,
      deadline: dPlus1,
      project_id: projectMap['Smart Campus Cloud Infrastructure'],
      assignee_id: staffUserIds['vikram.cloud@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Infrastructure'],
      subtasks: [
        { title: 'Take full database snapshot of MariaDB', completed: false },
        { title: 'Switch DNS records with zero downtime', completed: false },
      ],
    },
    {
      title: 'Consolidate Faculty Scopus Journal Impact Metrics',
      description: 'Compile Q1/Q2 journal publication records with h-index counts.',
      status: 'in_progress',
      priority: 'p2',
      due_date: dPlus1,
      deadline: dPlus1,
      project_id: projectMap['Faculty Research & Publications'],
      assignee_id: staffUserIds['ananya.research@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Research & NAAC'],
    },
    {
      title: 'Prepare AI & Data Science Lab Experiment Manuals',
      description: 'Update Python PyTorch and Scikit-Learn code notebooks for 4th sem lab.',
      status: 'todo',
      priority: 'p3',
      due_date: dPlus1,
      deadline: dPlus1,
      project_id: currProjId,
      assignee_id: staffUserIds['priya.cse@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Lab Practical'],
    },

    // --- UPCOMING DAY +2 ---
    {
      title: 'Conduct Internal Mock NAAC Audit for Criterion 1',
      description: 'External auditor Dr. Swaminathan will inspect BOS meeting minutes and curriculum feedback.',
      status: 'todo',
      priority: 'p1',
      due_date: dPlus2,
      deadline: dPlus2,
      project_id: naacProjId,
      section_id: sectionMap['Criterion 1: Curricular Aspects'],
      assignee_id: demoUserId,
      created_by: staffUserIds['ramesh.hod@nec.edu.in'],
      labels: ['Urgent Audit', 'Research & NAAC'],
    },
    {
      title: 'Deploy Automated Student Assignment Submission Portal',
      description: 'Connect GitHub classroom webhooks with student grading dashboard.',
      status: 'in_progress',
      priority: 'p2',
      due_date: dPlus2,
      deadline: dPlus2,
      project_id: projectMap['Smart Campus Cloud Infrastructure'],
      assignee_id: staffUserIds['priya.cse@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Infrastructure', 'Academics'],
    },

    // --- UPCOMING DAY +3 ---
    {
      title: 'DST-SERB Core Research Grant Proposal Submission',
      description: 'Final submission on e-PMS portal for IoT-Edge smart agriculture project funding.',
      status: 'todo',
      priority: 'p1',
      due_date: dPlus3,
      deadline: dPlus3,
      project_id: projectMap['Faculty Research & Publications'],
      assignee_id: staffUserIds['ananya.research@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Research & NAAC'],
    },
    {
      title: 'Network Switch Firmware Patching across CSE Block',
      description: 'Upgrade Cisco Layer 3 switches to latest secure release.',
      status: 'todo',
      priority: 'p3',
      due_date: dPlus3,
      deadline: dPlus3,
      project_id: projectMap['Smart Campus Cloud Infrastructure'],
      assignee_id: staffUserIds['vikram.cloud@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Infrastructure'],
    },

    // --- UPCOMING DAY +4 ---
    {
      title: 'Board of Studies (BOS) Agenda Distribution to Industry Experts',
      description: 'Dispatch curriculum draft copies to TCS, Infosys, and Cognizant advisory board members.',
      status: 'todo',
      priority: 'p2',
      due_date: dPlus4,
      deadline: dPlus4,
      project_id: currProjId,
      section_id: sectionMap['curr_BOS Review'],
      assignee_id: demoUserId,
      created_by: staffUserIds['ramesh.hod@nec.edu.in'],
      labels: ['Academics'],
    },
    {
      title: 'Smart Classroom Audio-Visual Projector Maintenance',
      description: 'Clean optical filters and replace lamps in Seminar Hall 1 & 2.',
      status: 'todo',
      priority: 'p4',
      due_date: dPlus4,
      deadline: dPlus4,
      project_id: projectMap['Smart Campus Cloud Infrastructure'],
      assignee_id: staffUserIds['vikram.cloud@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Infrastructure'],
    },

    // --- UPCOMING DAY +5 ---
    {
      title: 'Student Mini-Project Phase 1 Evaluation Review',
      description: 'Assess 45 3rd-year team presentations and GitHub repositories.',
      status: 'todo',
      priority: 'p2',
      due_date: dPlus5,
      deadline: dPlus5,
      project_id: currProjId,
      assignee_id: staffUserIds['priya.cse@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Academics', 'Lab Practical'],
    },
    {
      title: 'Patent Filing Document Verification with Legal Cell',
      description: 'Prior art search and provisional patent drafting for AI healthcare diagnostic device.',
      status: 'in_progress',
      priority: 'p2',
      due_date: dPlus5,
      deadline: dPlus5,
      project_id: projectMap['Faculty Research & Publications'],
      assignee_id: staffUserIds['ananya.research@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Research & NAAC'],
    },

    // --- UPCOMING DAY +6 & NEXT WEEK ---
    {
      title: 'Department Annual Budget Estimation for 2026-27',
      description: 'Estimate lab equipment purchase, cloud licenses, conference travel support, and consumables.',
      status: 'todo',
      priority: 'p1',
      due_date: dPlus6,
      deadline: dPlus6,
      project_id: projectMap['Inbox'],
      assignee_id: demoUserId,
      created_by: staffUserIds['ramesh.hod@nec.edu.in'],
      labels: ['Faculty Notice'],
    },
    {
      title: 'Organize National Level AI Hackathon & Workshop',
      description: 'Sponsorship coordination, problem statement curation, and cloud credits setup.',
      status: 'in_progress',
      priority: 'p2',
      due_date: dPlus7,
      deadline: dPlus7,
      project_id: projectMap['Inbox'],
      assignee_id: staffUserIds['priya.cse@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Faculty Notice'],
    },
    {
      title: 'Final Academic Council Approval Presentation',
      description: 'Submit all 4 criteria files to the Principal and Academic Dean for final sign-off.',
      status: 'todo',
      priority: 'p1',
      due_date: dPlus14,
      deadline: dPlus14,
      project_id: naacProjId,
      section_id: sectionMap['Verified & Ready for Submission'],
      assignee_id: demoUserId,
      created_by: staffUserIds['ramesh.hod@nec.edu.in'],
      labels: ['Urgent Audit', 'Research & NAAC'],
    },

    // --- COMPLETED TASKS (For Historical View & Charts) ---
    {
      title: 'Publish Department Annual Research Newsletter 2026',
      description: 'Designed and published 24-page full-color research achievements brochure.',
      status: 'done',
      priority: 'p2',
      due_date: dMinus2,
      completed_at: new Date(now.getTime() - 2 * 86400000),
      project_id: projectMap['Faculty Research & Publications'],
      assignee_id: staffUserIds['ananya.research@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Research & NAAC'],
    },
    {
      title: 'Laboratory Hardware Calibration & Micro-controller Verification',
      description: 'Completed testing of all 60 microprocessor and IoT test kits in Lab 3.',
      status: 'done',
      priority: 'p3',
      due_date: dMinus4,
      completed_at: new Date(now.getTime() - 4 * 86400000),
      project_id: projectMap['Smart Campus Cloud Infrastructure'],
      assignee_id: staffUserIds['priya.cse@nec.edu.in'],
      created_by: demoUserId,
      labels: ['Infrastructure', 'Lab Practical'],
    },
    {
      title: 'Renew Annual IEEE Xplore Digital Library Subscription',
      description: 'Processed college institutional IP-based authentication license.',
      status: 'done',
      priority: 'p2',
      due_date: dMinus4,
      completed_at: new Date(now.getTime() - 3 * 86400000),
      project_id: naacProjId,
      section_id: sectionMap['Criterion 4: Infrastructure & Learning Resources'],
      assignee_id: demoUserId,
      created_by: demoUserId,
      labels: ['Infrastructure'],
    },
  ];

  let taskCount = 0;
  for (const t of allTasks) {
    const [existing] = await pool.query(
      'SELECT id FROM tasks WHERE workspace_id = ? AND title = ?',
      [companyWsId, t.title]
    );
    let taskId;
    if (existing.length === 0) {
      const [res] = await pool.query(
        `INSERT INTO tasks (
          workspace_id, project_id, section_id, created_by, assignee_id,
          title, description, status, priority, due_date, deadline,
          recurrence_rule, completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyWsId,
          t.project_id || null,
          t.section_id || null,
          t.created_by || demoUserId,
          t.assignee_id || null,
          t.title,
          t.description || '',
          t.status || 'todo',
          t.priority || 'p4',
          t.due_date || null,
          t.deadline || null,
          t.recurrence_rule || null,
          t.completed_at || null,
        ]
      );
      taskId = res.insertId;
      taskCount++;
    } else {
      taskId = existing[0].id;
      await pool.query(
        `UPDATE tasks SET
          project_id = ?, section_id = ?, assignee_id = ?, description = ?,
          status = ?, priority = ?, due_date = ?, deadline = ?, recurrence_rule = ?, completed_at = ?
         WHERE id = ?`,
        [
          t.project_id || null,
          t.section_id || null,
          t.assignee_id || null,
          t.description || '',
          t.status || 'todo',
          t.priority || 'p4',
          t.due_date || null,
          t.deadline || null,
          t.recurrence_rule || null,
          t.completed_at || null,
          taskId,
        ]
      );
      taskCount++;
    }

    // Attach Labels
    if (t.labels && t.labels.length > 0) {
      for (const lName of t.labels) {
        const lblId = labelMap[lName];
        if (lblId) {
          await pool.query(
            'INSERT IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)',
            [taskId, lblId]
          );
        }
      }
    }

    // Attach Comments if any
    if (t.comments && t.comments.length > 0) {
      for (const c of t.comments) {
        const [cExists] = await pool.query(
          'SELECT id FROM comments WHERE task_id = ? AND content = ?',
          [taskId, c.text]
        );
        if (cExists.length === 0) {
          await pool.query(
            'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
            [taskId, c.user, c.text]
          );
        }
      }
    }
  }

  // 8. Add Meetings (Google Meet integration demo)
  const meetingTime1 = new Date(now.getTime() + 2 * 3600000); // 2 hours from now
  const meetingTime2 = new Date(now.getTime() + 24 * 3600000); // tomorrow
  const meetingTime3 = new Date(now.getTime() + 48 * 3600000); // day after

  const meetings = [
    {
      title: 'NEC Academic Council & NAAC Readiness Review',
      description: 'Discussion on criteria submissions, department audit deadlines, and email alert integration.',
      meeting_link: 'https://meet.google.com/nec-acad-demo',
      scheduled_start: meetingTime1,
      duration_minutes: 45,
    },
    {
      title: 'Curriculum Revision Committee Sync (BOS R22)',
      description: 'Final sign-off on 2026 autonomous regulation syllabus with external subject experts.',
      meeting_link: 'https://meet.google.com/nec-curr-rev',
      scheduled_start: meetingTime2,
      duration_minutes: 30,
    },
    {
      title: 'Faculty Research Grant & Scopus Publications Standup',
      description: 'Monthly department research committee evaluation.',
      meeting_link: 'https://meet.google.com/nec-research-sync',
      scheduled_start: meetingTime3,
      duration_minutes: 40,
    },
  ];

  for (const m of meetings) {
    const [mExists] = await pool.query(
      'SELECT id FROM meetings WHERE workspace_id = ? AND title = ?',
      [companyWsId, m.title]
    );
    if (mExists.length === 0) {
      await pool.query(
        `INSERT INTO meetings (workspace_id, creator_id, title, description, meeting_link, scheduled_start, duration_minutes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
        [companyWsId, demoUserId, m.title, m.description, m.meeting_link, m.scheduled_start, m.duration_minutes]
      );
    }
  }

  // 9. Add Vacations & Time-off Requests (Admin approval demo)
  const vacs = [
    {
      user_id: staffUserIds['priya.cse@nec.edu.in'],
      type: 'vacation',
      start_date: dToday,
      end_date: dPlus1,
      reason: 'Attending International Conference on AI & Education as session chair.',
      status: 'pending', // Demo user can approve/reject this!
    },
    {
      user_id: staffUserIds['ananya.research@nec.edu.in'],
      type: 'sick',
      start_date: dPlus3,
      end_date: dPlus4,
      reason: 'Medical consultation and recovery.',
      status: 'pending',
    },
    {
      user_id: staffUserIds['vikram.cloud@nec.edu.in'],
      type: 'personal',
      start_date: dPlus7,
      end_date: dPlus7,
      reason: 'Family event and personal work.',
      status: 'approved',
    },
  ];

  for (const v of vacs) {
    const [vExists] = await pool.query(
      'SELECT id FROM vacations WHERE workspace_id = ? AND user_id = ? AND start_date = ?',
      [companyWsId, v.user_id, v.start_date]
    );
    if (vExists.length === 0) {
      await pool.query(
        `INSERT INTO vacations (workspace_id, user_id, type, start_date, end_date, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [companyWsId, v.user_id, v.type, v.start_date, v.end_date, v.reason, v.status]
      );
    }
  }

  // 10. Add Workspace Chat Messages
  const chatMessages = [
    {
      user_id: staffUserIds['ramesh.hod@nec.edu.in'],
      content: 'Welcome everyone to the NEC Academic Operations dashboard! Please verify all criteria deadlines before the peer audit.',
    },
    {
      user_id: demoUserId,
      content: 'Understood Dr. Ramesh. Automated deadline email alerts are actively monitoring all pending tasks.',
    },
    {
      user_id: staffUserIds['priya.cse@nec.edu.in'],
      content: 'I have uploaded the micro-lab safety verification reports. Submitting the time-off request for the AI conference.',
    },
    {
      user_id: staffUserIds['vikram.cloud@nec.edu.in'],
      content: 'Cloud server migration scheduled for tomorrow 3 PM. High availability is configured.',
    },
    {
      user_id: staffUserIds['ananya.research@nec.edu.in'],
      content: 'The Scopus Q1 publication metrics have been compiled and attached to the task.',
    },
  ];

  for (const c of chatMessages) {
    const [cExists] = await pool.query(
      'SELECT id FROM chat_messages WHERE workspace_id = ? AND user_id = ? AND content = ?',
      [companyWsId, c.user_id, c.content]
    );
    if (cExists.length === 0) {
      await pool.query(
        'INSERT INTO chat_messages (workspace_id, user_id, content) VALUES (?, ?, ?)',
        [companyWsId, c.user_id, c.content]
      );
    }
  }

  // 11. Add In-App Notifications for Demo User
  const notifs = [
    {
      title: '⏰ Deadline Alert: "Submit Final NAAC Criterion 3 Research Grant Reports"',
      message: `The allotted deadline (${dMinus4}) has passed. An email reminder was automatically dispatched to ${demoEmail}.`,
      link: '/app/today',
    },
    {
      title: '🏖️ New Time-off Request Awaiting Approval',
      message: 'Prof. Priya Sharma has requested 2 days Vacation leave. Click to review and approve.',
      link: '/app/notifications',
    },
    {
      title: '🏖️ Medical Leave Request Awaiting Approval',
      message: 'Dr. Ananya Verma has submitted a 2-day sick leave request.',
      link: '/app/notifications',
    },
    {
      title: '📅 Google Meet Scheduled: "NEC Academic Council"',
      message: 'Meeting starts today with Dr. Ramesh Kumar and department staff.',
      link: '/app/team',
    },
  ];

  for (const n of notifs) {
    const [nExists] = await pool.query(
      'SELECT id FROM notifications WHERE user_id = ? AND title = ?',
      [demoUserId, n.title]
    );
    if (nExists.length === 0) {
      await pool.query(
        `INSERT INTO notifications (user_id, workspace_id, title, message, link, is_read)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [demoUserId, companyWsId, n.title, n.message, n.link]
      );
    }
  }

  console.log('\n========================================================================');
  console.log('🎉 [DEMO PRESENTATION SETUP COMPLETE]');
  console.log(`📧 Login Email:    ${demoEmail}`);
  console.log(`🔑 Login Password: ${demoPass}`);
  console.log(`🏢 Workspace:      ${companyWsName}`);
  console.log(`📝 Total Tasks:    ${taskCount} tasks seeded across all dates and projects`);
  console.log(`👥 Staff Members:  ${teamStaff.map((s) => s.name).join(', ')}`);
  console.log('========================================================================\n');
}

seedDemoData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ [Demo Seeder Error]:', err);
    process.exit(1);
  });
