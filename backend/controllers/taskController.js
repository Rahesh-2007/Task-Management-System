const { getPool, logActivity } = require('../config/db');

function formatTaskRow(row) {
  if (!row) return null;
  let parsedSubtasks = [];
  if (row.subtasks) {
    if (typeof row.subtasks === 'string') {
      try { parsedSubtasks = JSON.parse(row.subtasks); } catch (e) { parsedSubtasks = []; }
    } else if (Array.isArray(row.subtasks)) {
      parsedSubtasks = row.subtasks;
    }
  }

  let parsedLabels = [];
  if (row.labels) {
    if (typeof row.labels === 'string') {
      try { parsedLabels = JSON.parse(row.labels); } catch (e) { parsedLabels = []; }
    } else if (Array.isArray(row.labels)) {
      parsedLabels = row.labels;
    }
  }

  let formattedDate = null;
  if (row.due_date) {
    try {
      const d = new Date(row.due_date);
      if (!isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
    } catch (e) { formattedDate = null; }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    completed: Boolean(row.completed),
    status: row.status || 'todo',
    priority: row.priority || 'medium',
    category: row.category || 'General',
    dueDate: formattedDate,
    subtasks: parsedSubtasks,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id || null,
    workspaceId: row.workspace_id || null,
    assigneeId: row.assignee_id || null,
    projectId: row.project_id || null,
    section: row.section || null,
    isInbox: Boolean(row.is_inbox),
    labels: parsedLabels,
    assignee: row.assignee_name ? { id: row.assignee_id, name: row.assignee_name, avatar: row.assignee_avatar } : null,
    project: row.project_name ? { id: row.project_id, name: row.project_name, color: row.project_color } : null,
  };
}

// Build base SELECT with LEFT JOINs for assignee and project
const BASE_SELECT = `
  SELECT t.*,
    u.name AS assignee_name, u.avatar AS assignee_avatar,
    p.name AS project_name, p.color AS project_color,
    (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', l.id, 'name', l.name, 'color', l.color))
     FROM task_labels tl JOIN labels l ON tl.label_id = l.id
     WHERE tl.task_id = t.id) AS labels
  FROM tasks t
  LEFT JOIN users u ON t.assignee_id = u.id
  LEFT JOIN projects p ON t.project_id = p.id
`;

// GET /api/tasks
exports.getAllTasks = async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.user?.id || null;
    const { workspace_id, project_id, is_inbox, label_id, search, due_filter } = req.query;

    let conditions = [];
    let params = [];

    if (userId) {
      // Scoped to user's tasks OR workspace tasks they belong to
      if (workspace_id) {
        conditions.push('t.workspace_id = ?');
        params.push(parseInt(workspace_id));
      } else {
        conditions.push('(t.user_id = ? OR t.user_id IS NULL)');
        params.push(userId);
      }
    }

    if (project_id) { conditions.push('t.project_id = ?'); params.push(parseInt(project_id)); }
    if (is_inbox === 'true') { conditions.push('t.is_inbox = TRUE'); }
    if (label_id) {
      conditions.push('t.id IN (SELECT task_id FROM task_labels WHERE label_id = ?)');
      params.push(parseInt(label_id));
    }
    if (search) {
      conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const today = new Date().toISOString().split('T')[0];
    if (due_filter === 'today') { conditions.push('t.due_date = ?'); params.push(today); }
    else if (due_filter === 'overdue') { conditions.push('t.due_date < ? AND t.completed = FALSE'); params.push(today); }
    else if (due_filter === 'upcoming') { conditions.push('t.due_date > ?'); params.push(today); }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(`${BASE_SELECT} ${whereClause} ORDER BY t.\`order\` ASC, t.created_at DESC`, params);
    const tasks = rows.map(formatTaskRow);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error('[getAllTasks Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve tasks', error: error.message });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, subtasks, status, projectId, workspaceId, isInbox, section, labelIds, assigneeId } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const pool = getPool();
    const userId = req.user?.id || null;

    const [orderResult] = await pool.query('SELECT COALESCE(MAX(`order`), -1) AS maxOrder FROM tasks');
    const newOrder = (orderResult[0]?.maxOrder ?? -1) + 1;

    const taskStatus = status && ['todo', 'in_progress', 'completed'].includes(status) ? status : 'todo';
    const isCompleted = taskStatus === 'completed';
    const taskPriority = priority && ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium';
    const taskCategory = category?.trim() || 'General';
    const jsonSubtasks = JSON.stringify(Array.isArray(subtasks) ? subtasks : []);
    const validDueDate = dueDate ? dueDate : null;

    const [result] = await pool.query(`
      INSERT INTO tasks (title, description, completed, status, priority, category, due_date, subtasks, \`order\`, user_id, workspace_id, project_id, is_inbox, section, assignee_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(), description?.trim() || '', isCompleted, taskStatus, taskPriority,
      taskCategory, validDueDate, jsonSubtasks, newOrder,
      userId, workspaceId || null, projectId || null,
      isInbox ? 1 : 0, section || null, assigneeId || null
    ]);

    const taskId = result.insertId;

    // Add labels if provided
    if (Array.isArray(labelIds) && labelIds.length > 0) {
      for (const lid of labelIds) {
        try { await pool.query('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)', [taskId, lid]); } catch (_) {}
      }
    }

    const [createdRows] = await pool.query(`${BASE_SELECT} WHERE t.id = ?`, [taskId]);
    const createdTask = formatTaskRow(createdRows[0]);

    // Log activity
    if (userId) {
      await logActivity({ workspaceId: workspaceId || null, taskId, userId, action: 'task_created', metadata: { title: title.trim() } });
    }

    res.status(201).json({ success: true, message: 'Task created successfully', data: createdTask });
  } catch (error) {
    console.error('[createTask Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    if (isNaN(taskId)) return res.status(400).json({ success: false, message: 'Invalid task ID.' });

    const pool = getPool();
    const [existingRows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (existingRows.length === 0) return res.status(404).json({ success: false, message: 'Task not found.' });

    const current = existingRows[0];
    const userId = req.user?.id || null;

    // Authorization check: user must own the task or task has no user
    if (userId && current.user_id && current.user_id !== userId) {
      // Check if user is a workspace member
      if (current.workspace_id) {
        const [memberCheck] = await pool.query(
          'SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
          [current.workspace_id, userId]
        );
        if (memberCheck.length === 0) {
          return res.status(403).json({ success: false, message: 'Access denied.' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const { title, description, priority, category, dueDate, subtasks, status, completed, projectId, isInbox, section, assigneeId, labelIds } = req.body;

    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ success: false, message: 'Task title cannot be empty.' });
    }

    const newTitle = title !== undefined ? title.trim() : current.title;
    const newDescription = description !== undefined ? description.trim() : current.description;
    const newPriority = priority !== undefined ? priority : current.priority;
    const newCategory = category !== undefined ? category.trim() : current.category;
    const newDueDate = dueDate !== undefined ? (dueDate || null) : current.due_date;
    const newSubtasks = subtasks !== undefined ? JSON.stringify(subtasks) : current.subtasks;
    const newProjectId = projectId !== undefined ? (projectId || null) : current.project_id;
    const newIsInbox = isInbox !== undefined ? (isInbox ? 1 : 0) : current.is_inbox;
    const newSection = section !== undefined ? (section || null) : current.section;
    const newAssigneeId = assigneeId !== undefined ? (assigneeId || null) : current.assignee_id;

    let newStatus = status !== undefined ? status : current.status;
    let newCompleted = completed !== undefined ? Boolean(completed) : Boolean(current.completed);

    if (completed !== undefined && status === undefined) {
      newStatus = newCompleted ? 'completed' : (current.status === 'completed' ? 'todo' : current.status);
    } else if (status !== undefined && completed === undefined) {
      newCompleted = newStatus === 'completed';
    }

    await pool.query(`
      UPDATE tasks
      SET title=?, description=?, priority=?, category=?, due_date=?, subtasks=?, status=?, completed=?,
          project_id=?, is_inbox=?, section=?, assignee_id=?
      WHERE id=?
    `, [newTitle, newDescription, newPriority, newCategory, newDueDate, newSubtasks, newStatus, newCompleted,
        newProjectId, newIsInbox, newSection, newAssigneeId, taskId]);

    // Update labels if provided
    if (Array.isArray(labelIds)) {
      await pool.query('DELETE FROM task_labels WHERE task_id = ?', [taskId]);
      for (const lid of labelIds) {
        try { await pool.query('INSERT INTO task_labels (task_id, label_id) VALUES (?, ?)', [taskId, lid]); } catch (_) {}
      }
    }

    const [updatedRows] = await pool.query(`${BASE_SELECT} WHERE t.id = ?`, [taskId]);

    // Log activity
    if (userId) {
      const changes = {};
      if (priority !== undefined && priority !== current.priority) changes.priority = { from: current.priority, to: priority };
      if (dueDate !== undefined && dueDate !== current.due_date) changes.dueDate = { from: current.due_date, to: dueDate };
      if (assigneeId !== undefined && assigneeId !== current.assignee_id) changes.assignee = { to: assigneeId };
      if (Object.keys(changes).length > 0) {
        await logActivity({ workspaceId: current.workspace_id, taskId, userId, action: 'task_updated', metadata: changes });
      }
    }

    res.json({ success: true, message: 'Task updated successfully', data: formatTaskRow(updatedRows[0]) });
  } catch (error) {
    console.error('[updateTask Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
};

// PATCH /api/tasks/:id/toggle
exports.toggleComplete = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const pool = getPool();
    const userId = req.user?.id || null;

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = rows[0];
    const isNowCompleted = !task.completed;
    const newStatus = isNowCompleted ? 'completed' : 'todo';

    await pool.query('UPDATE tasks SET completed = ?, status = ? WHERE id = ?', [isNowCompleted, newStatus, taskId]);

    if (userId) {
      await logActivity({ workspaceId: task.workspace_id, taskId, userId, action: isNowCompleted ? 'task_completed' : 'task_reopened', metadata: { title: task.title } });
    }

    const [updatedRows] = await pool.query(`${BASE_SELECT} WHERE t.id = ?`, [taskId]);
    res.json({ success: true, message: 'Task completion toggled', data: formatTaskRow(updatedRows[0]) });
  } catch (error) {
    console.error('[toggleComplete Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle task', error: error.message });
  }
};

// PATCH /api/tasks/reorder
exports.reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid reorder payload.' });
    }

    const pool = getPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const item of tasks) {
        if (item.id !== undefined && item.order !== undefined) {
          if (item.status) {
            const isCompleted = item.status === 'completed';
            await connection.query('UPDATE tasks SET `order` = ?, status = ?, completed = ? WHERE id = ?', [item.order, item.status, isCompleted, item.id]);
          } else {
            await connection.query('UPDATE tasks SET `order` = ? WHERE id = ?', [item.order, item.id]);
          }
        }
      }
      await connection.commit();
      connection.release();

      const [updatedRows] = await pool.query(`${BASE_SELECT} ORDER BY t.\`order\` ASC`);
      res.json({ success: true, message: 'Tasks reordered successfully', data: updatedRows.map(formatTaskRow) });
    } catch (txErr) {
      await connection.rollback();
      connection.release();
      throw txErr;
    }
  } catch (error) {
    console.error('[reorderTasks Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder tasks', error: error.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);
    const pool = getPool();
    const userId = req.user?.id || null;

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Task not found' });

    const task = rows[0];
    if (userId && task.user_id && task.user_id !== userId) {
      if (task.workspace_id) {
        const [memberCheck] = await pool.query(
          'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
          [task.workspace_id, userId]
        );
        if (memberCheck.length === 0) return res.status(403).json({ success: false, message: 'Access denied.' });
      } else {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);
    if (userId) {
      await logActivity({ workspaceId: task.workspace_id, taskId, userId, action: 'task_deleted', metadata: { title: task.title } });
    }

    res.json({ success: true, message: 'Task deleted successfully', data: formatTaskRow(task) });
  } catch (error) {
    console.error('[deleteTask Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
  }
};

// POST /api/tasks/reset
const { resetSampleTasks } = require('../config/db');
exports.resetTasks = async (req, res) => {
  try {
    await resetSampleTasks();
    const pool = getPool();
    const [rows] = await pool.query(`${BASE_SELECT} ORDER BY t.\`order\` ASC`);
    res.json({ success: true, message: 'Sample tasks reloaded successfully', data: rows.map(formatTaskRow) });
  } catch (error) {
    console.error('[resetTasks Error]:', error);
    res.status(500).json({ success: false, message: 'Failed to reset sample tasks', error: error.message });
  }
};
