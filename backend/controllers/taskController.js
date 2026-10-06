const { z } = require('zod');
const { getPool, logActivity } = require('../config/db');

// Zod validation schemas
const createTaskSchema = z.object({
  workspaceId: z.number().int().positive('Workspace ID is required'),
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  description: z.string().optional().nullable(),
  projectId: z.number().int().positive().optional().nullable(),
  sectionId: z.number().int().positive().optional().nullable(),
  assigneeId: z.number().int().positive().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['p1', 'p2', 'p3', 'p4']).default('p4'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  startTime: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  recurrenceRule: z.string().max(100).optional().nullable(),
  reminderAt: z.string().optional().nullable(),
  estimateMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  labelIds: z.array(z.number().int().positive()).optional().default([]),
  subtasks: z.array(z.any()).optional().default([]),
});

function formatTask(row, labels = [], subtasks = [], comments = []) {
  if (!row) return null;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    sectionId: row.section_id,
    createdBy: row.created_by,
    assigneeId: row.assignee_id,
    parentId: row.parent_id,
    title: row.title,
    description: row.description || '',
    status: row.status,
    completed: row.status === 'done',
    priority: row.priority || 'p4',
    dueDate: row.due_date ? String(row.due_date).split(' ')[0] : null,
    startTime: row.start_time ? String(row.start_time).slice(0, 5) : null,
    dueTime: row.due_time ? String(row.due_time).slice(0, 5) : null,
    deadline: row.deadline ? String(row.deadline).split(' ')[0] : null,
    recurrenceRule: row.recurrence_rule || null,
    reminderAt: row.reminder_at || null,
    estimateMinutes: row.estimate_minutes || null,
    position: row.position || 0,
    completedAt: row.completed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignee: row.assignee_name
      ? { id: row.assignee_id, name: row.assignee_name, avatar: row.assignee_avatar, email: row.assignee_email }
      : null,
    project: row.project_name
      ? { id: row.project_id, name: row.project_name, color: row.project_color }
      : null,
    section: row.section_name
      ? { id: row.section_id, name: row.section_name }
      : null,
    labels: Array.isArray(labels) ? labels : [],
    subtasks: Array.isArray(subtasks) ? subtasks : [],
    comments: Array.isArray(comments) ? comments : [],
  };
}

// Compute next recurring date (Daily, Weekdays, Weekly, Monthly)
function computeNextDate(currentDateStr, recurrenceRule) {
  if (!currentDateStr || !recurrenceRule) return null;
  const base = new Date(currentDateStr);
  if (isNaN(base.getTime())) return null;

  const rule = recurrenceRule.toLowerCase();
  const next = new Date(base);

  if (rule.includes('daily') || rule === 'every day') {
    next.setDate(next.getDate() + 1);
  } else if (rule.includes('weekday') || rule === 'every weekday') {
    do {
      next.setDate(next.getDate() + 1);
    } while (next.getDay() === 0 || next.getDay() === 6);
  } else if (rule.includes('weekly') || rule === 'every week') {
    next.setDate(next.getDate() + 7);
  } else if (rule.includes('biweekly') || rule === 'every 2 weeks') {
    next.setDate(next.getDate() + 14);
  } else if (rule.includes('monthly') || rule === 'every month') {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }

  return next.toISOString().split('T')[0];
}

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const pool = getPool();
    const workspaceId = parseInt(req.query.workspace_id || req.query.workspaceId, 10);

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: 'workspace_id is required.' });
    }

    // Membership verify
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspaceId, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: You are not a member of this workspace.' });
    }

    const {
      project_id,
      section_id,
      assignee_id,
      status,
      priority,
      search,
      due,
      today_date,
      limit = 200,
      offset = 0,
    } = req.query;

    let conditions = ['t.workspace_id = ?', 't.parent_id IS NULL'];
    let params = [workspaceId];

    if (project_id) {
      conditions.push('t.project_id = ?');
      params.push(parseInt(project_id, 10));
    }
    if (section_id) {
      conditions.push('t.section_id = ?');
      params.push(parseInt(section_id, 10));
    }
    if (assignee_id) {
      if (assignee_id === 'me') {
        conditions.push('t.assignee_id = ?');
        params.push(req.user.id);
      } else {
        conditions.push('t.assignee_id = ?');
        params.push(parseInt(assignee_id, 10));
      }
    }
    if (status) {
      conditions.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      conditions.push('t.priority = ?');
      params.push(priority);
    }
    if (search && search.trim()) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Timezone safe due filters
    const refDate = today_date || new Date().toISOString().split('T')[0];
    if (due === 'today') {
      conditions.push('t.due_date = ?');
      params.push(refDate);
    } else if (due === 'upcoming') {
      conditions.push('t.due_date > ?');
      params.push(refDate);
    } else if (due === 'overdue') {
      conditions.push('t.due_date < ? AND t.status != "done"');
      params.push(refDate);
    } else if (due === 'nodate') {
      conditions.push('t.due_date IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT t.*,
        u.name AS assignee_name, u.avatar AS assignee_avatar, u.email AS assignee_email,
        p.name AS project_name, p.color AS project_color,
        s.name AS section_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN sections s ON t.section_id = s.id
      ${whereClause}
      ORDER BY 
        CASE WHEN t.status = 'done' THEN 1 ELSE 0 END,
        t.position ASC,
        t.due_date ASC,
        t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.query(query, params);

    // Fetch labels and subtasks for returned tasks
    if (rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const taskIds = rows.map((r) => r.id);
    const [labelRows] = await pool.query(
      `SELECT tl.task_id, l.id, l.name, l.color
       FROM task_labels tl
       JOIN labels l ON tl.label_id = l.id
       WHERE tl.task_id IN (?)`,
      [taskIds]
    );

    const [subtaskRows] = await pool.query(
      `SELECT st.* FROM tasks st WHERE st.parent_id IN (?) ORDER BY st.position ASC, st.id ASC`,
      [taskIds]
    );

    const labelsMap = {};
    for (const l of labelRows) {
      if (!labelsMap[l.task_id]) labelsMap[l.task_id] = [];
      labelsMap[l.task_id].push({ id: l.id, name: l.name, color: l.color });
    }

    const subtasksMap = {};
    for (const st of subtaskRows) {
      if (!subtasksMap[st.parent_id]) subtasksMap[st.parent_id] = [];
      subtasksMap[st.parent_id].push({
        id: st.id,
        title: st.title,
        status: st.status,
        completed: st.status === 'done',
        position: st.position,
      });
    }

    const tasks = rows.map((r) => formatTask(r, labelsMap[r.id] || [], subtasksMap[r.id] || []));
    return res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('[getTasks Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve tasks.' });
  }
};

// GET /api/tasks/:id
exports.getTaskById = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT t.*,
        u.name AS assignee_name, u.avatar AS assignee_avatar, u.email AS assignee_email,
        p.name AS project_name, p.color AS project_color,
        s.name AS section_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN sections s ON t.section_id = s.id
       WHERE t.id = ?`,
      [taskId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const taskRow = rows[0];

    // Check workspace membership
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [taskRow.workspace_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    const [labelRows] = await pool.query(
      `SELECT l.id, l.name, l.color
       FROM task_labels tl
       JOIN labels l ON tl.label_id = l.id
       WHERE tl.task_id = ?`,
      [taskId]
    );

    const [subtaskRows] = await pool.query(
      `SELECT st.* FROM tasks st WHERE st.parent_id = ? ORDER BY st.position ASC, st.id ASC`,
      [taskId]
    );

    const [commentRows] = await pool.query(
      `SELECT c.*, u.name AS user_name, u.avatar AS user_avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    const task = formatTask(taskRow, labelRows, subtaskRows, commentRows);
    return res.json({ success: true, data: task });
  } catch (error) {
    console.error('[getTaskById Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve task.' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0].message,
      });
    }

    const data = parseResult.data;
    const pool = getPool();

    // Verify workspace membership
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [data.workspaceId, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Not a member of this workspace.' });
    }

    // If projectId is provided, verify it belongs to this workspace
    if (data.projectId) {
      const [projCheck] = await pool.query(
        'SELECT id FROM projects WHERE id = ? AND workspace_id = ?',
        [data.projectId, data.workspaceId]
      );
      if (projCheck.length === 0) {
        return res.status(400).json({ success: false, message: 'Project does not belong to this workspace.' });
      }
    }

    // Get max position
    const [posRows] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM tasks WHERE workspace_id = ?',
      [data.workspaceId]
    );
    const position = posRows[0].next_pos;

    const [result] = await pool.query(
      `INSERT INTO tasks (
        workspace_id, project_id, section_id, created_by, assignee_id, parent_id,
        title, description, status, priority, due_date, start_time, due_time, deadline,
        recurrence_rule, reminder_at, estimate_minutes, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.workspaceId,
        data.projectId || null,
        data.sectionId || null,
        req.user.id,
        data.assigneeId || null,
        data.parentId || null,
        data.title.trim(),
        data.description || '',
        data.status,
        data.priority,
        data.dueDate || null,
        data.startTime || null,
        data.dueTime || null,
        data.deadline || null,
        data.recurrenceRule || null,
        data.reminderAt || null,
        data.estimateMinutes || null,
        position,
      ]
    );

    const taskId = result.insertId;

    // Attach labels
    if (data.labelIds && data.labelIds.length > 0) {
      const labelValues = data.labelIds.map((lid) => [taskId, lid]);
      await pool.query('INSERT IGNORE INTO task_labels (task_id, label_id) VALUES ?', [labelValues]);
    }

    // Insert inline subtasks if provided as array
    if (data.subtasks && data.subtasks.length > 0) {
      for (let i = 0; i < data.subtasks.length; i++) {
        const item = data.subtasks[i];
        const subTitle = typeof item === 'string' ? item.trim() : item?.text || item?.title;
        const subCompleted = typeof item === 'object' && Boolean(item?.completed);
        if (subTitle) {
          await pool.query(
            `INSERT INTO tasks (workspace_id, parent_id, created_by, title, status, position)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [data.workspaceId, taskId, req.user.id, subTitle, subCompleted ? 'done' : 'todo', i]
          );
        }
      }
    }

    await logActivity({
      workspaceId: data.workspaceId,
      taskId,
      userId: req.user.id,
      action: 'task_created',
      metadata: { title: data.title },
    });

    // Return full newly created task
    const [createdRows] = await pool.query(
      `SELECT t.*,
        u.name AS assignee_name, u.avatar AS assignee_avatar,
        p.name AS project_name, p.color AS project_color,
        s.name AS section_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN sections s ON t.section_id = s.id
       WHERE t.id = ?`,
      [taskId]
    );

    const [createdLabels] = await pool.query(
      `SELECT l.id, l.name, l.color FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = ?`,
      [taskId]
    );

    const [createdSubtasks] = await pool.query(
      `SELECT * FROM tasks WHERE parent_id = ? ORDER BY position ASC`,
      [taskId]
    );

    const taskObj = formatTask(createdRows[0], createdLabels, createdSubtasks);
    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: taskObj,
    });
  } catch (error) {
    console.error('[createTask Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create task.' });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [existing] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    const current = existing[0];

    // Check workspace membership
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [current.workspace_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    const {
      title,
      description,
      status,
      completed,
      priority,
      dueDate,
      startTime,
      dueTime,
      deadline,
      projectId,
      sectionId,
      assigneeId,
      recurrenceRule,
      reminderAt,
      estimateMinutes,
      labelIds,
      position,
    } = req.body;

    let newStatus = status;
    if (completed !== undefined) {
      newStatus = completed ? 'done' : 'todo';
    }

    const completedAt =
      newStatus === 'done' && current.status !== 'done'
        ? new Date().toISOString().slice(0, 19).replace('T', ' ')
        : newStatus && newStatus !== 'done'
        ? null
        : current.completed_at;

    await pool.query(
      `UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = ?,
        start_time = ?,
        due_time = ?,
        deadline = ?,
        project_id = ?,
        section_id = ?,
        assignee_id = ?,
        recurrence_rule = COALESCE(?, recurrence_rule),
        reminder_at = ?,
        estimate_minutes = ?,
        position = COALESCE(?, position),
        completed_at = ?
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : null,
        description !== undefined ? description : null,
        newStatus || null,
        priority || null,
        dueDate !== undefined ? dueDate || null : current.due_date,
        startTime !== undefined ? startTime || null : current.start_time,
        dueTime !== undefined ? dueTime || null : current.due_time,
        deadline !== undefined ? deadline || null : current.deadline,
        projectId !== undefined ? projectId || null : current.project_id,
        sectionId !== undefined ? sectionId || null : current.section_id,
        assigneeId !== undefined ? assigneeId || null : current.assignee_id,
        recurrenceRule !== undefined ? recurrenceRule : null,
        reminderAt !== undefined ? reminderAt || null : current.reminder_at,
        estimateMinutes !== undefined ? estimateMinutes || null : current.estimate_minutes,
        position !== undefined ? position : null,
        completedAt,
        taskId,
      ]
    );

    // Update labels if provided
    if (Array.isArray(labelIds)) {
      await pool.query('DELETE FROM task_labels WHERE task_id = ?', [taskId]);
      if (labelIds.length > 0) {
        const values = labelIds.map((lid) => [taskId, lid]);
        await pool.query('INSERT IGNORE INTO task_labels (task_id, label_id) VALUES ?', [values]);
      }
    }

    // If marked done and has a recurrence rule, atomically create next recurring task
    let nextTask = null;
    if (newStatus === 'done' && current.status !== 'done' && current.recurrence_rule && current.due_date) {
      const nextDueDate = computeNextDate(current.due_date, current.recurrence_rule);
      if (nextDueDate) {
        const [nextResult] = await pool.query(
          `INSERT INTO tasks (
            workspace_id, project_id, section_id, created_by, assignee_id,
            title, description, status, priority, due_date, start_time, due_time,
            recurrence_rule, position
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?)`,
          [
            current.workspace_id,
            current.project_id,
            current.section_id,
            req.user.id,
            current.assignee_id,
            current.title,
            current.description,
            current.priority,
            nextDueDate,
            current.start_time,
            current.due_time,
            current.recurrence_rule,
            current.position,
          ]
        );
        nextTask = { id: nextResult.insertId, dueDate: nextDueDate };
      }
    }

    // Fetch updated task
    const [updatedRows] = await pool.query(
      `SELECT t.*,
        u.name AS assignee_name, u.avatar AS assignee_avatar,
        p.name AS project_name, p.color AS project_color,
        s.name AS section_name
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN sections s ON t.section_id = s.id
       WHERE t.id = ?`,
      [taskId]
    );

    const [updatedLabels] = await pool.query(
      `SELECT l.id, l.name, l.color FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = ?`,
      [taskId]
    );

    const [updatedSubtasks] = await pool.query(
      `SELECT * FROM tasks WHERE parent_id = ? ORDER BY position ASC`,
      [taskId]
    );

    const updatedTask = formatTask(updatedRows[0], updatedLabels, updatedSubtasks);

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      data: updatedTask,
      nextRecurringTask: nextTask,
    });
  } catch (error) {
    console.error('[updateTask Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update task.' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const pool = getPool();

    const [existing] = await pool.query('SELECT workspace_id, title FROM tasks WHERE id = ?', [taskId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const { workspace_id, title } = existing[0];

    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspace_id, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    await logActivity({
      workspaceId: workspace_id,
      taskId,
      userId: req.user.id,
      action: 'task_deleted',
      metadata: { title },
    });

    return res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('[deleteTask Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete task.' });
  }
};

// POST /api/tasks/reorder
exports.reorderTasks = async (req, res) => {
  try {
    const { workspaceId, taskOrders } = req.body;
    if (!workspaceId || !Array.isArray(taskOrders)) {
      return res.status(400).json({ success: false, message: 'workspaceId and taskOrders array are required.' });
    }

    const pool = getPool();
    const [membership] = await pool.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [workspaceId, req.user.id]
    );
    if (membership.length === 0) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access denied.' });
    }

    for (const item of taskOrders) {
      if (item.id && item.position !== undefined) {
        await pool.query(
          'UPDATE tasks SET position = ?, section_id = COALESCE(?, section_id), status = COALESCE(?, status) WHERE id = ? AND workspace_id = ?',
          [item.position, item.sectionId !== undefined ? item.sectionId : null, item.status || null, item.id, workspaceId]
        );
      }
    }

    return res.json({ success: true, message: 'Tasks reordered successfully.' });
  } catch (error) {
    console.error('[reorderTasks Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to reorder tasks.' });
  }
};
