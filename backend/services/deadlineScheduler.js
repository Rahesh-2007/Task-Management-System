const { getPool, logActivity } = require('../config/db');
const { sendTaskDeadlineEmail } = require('./emailService');

let schedulerInterval = null;
let isRunningCheck = false;

/**
 * Checks incomplete tasks whose deadline or due date has arrived/passed,
 * and sends an email notification directly to the user's logged-in email.
 * @param {number|null} targetUserId - Optional user ID to immediately check for a specific user
 */
async function checkAndNotifyDeadlines(targetUserId = null) {
  if (isRunningCheck) {
    return { success: false, message: 'Check already in progress.' };
  }

  isRunningCheck = true;
  const pool = getPool();
  const notifiedTasks = [];

  try {
    let userFilterSql = '';
    const queryParams = [];

    if (targetUserId) {
      userFilterSql = ' AND (t.assignee_id = ? OR (t.assignee_id IS NULL AND t.created_by = ?))';
      queryParams.push(targetUserId, targetUserId);
    }

    // Query tasks that:
    // 1. Are NOT done
    // 2. Have deadline or due_date <= CURRENT_DATE
    // 3. Haven't had a deadline notification email sent today
    const [tasks] = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date,
        t.due_time,
        t.deadline,
        t.workspace_id,
        t.project_id,
        t.assignee_id,
        t.created_by,
        t.deadline_email_sent_at,
        u_assignee.name AS assignee_name,
        u_assignee.email AS assignee_email,
        u_creator.name AS creator_name,
        u_creator.email AS creator_email,
        w.name AS workspace_name,
        p.name AS project_name
      FROM tasks t
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status != 'done'
        AND (
          (t.deadline IS NOT NULL AND t.deadline <= CURDATE())
          OR
          (t.due_date IS NOT NULL AND t.due_date <= CURDATE())
        )
        AND (
          t.deadline_email_sent_at IS NULL
          OR DATE(t.deadline_email_sent_at) < CURDATE()
        )
        ${userFilterSql}
      LIMIT 100
    `, queryParams);

    for (const task of tasks) {
      const recipientEmail = task.assignee_email || task.creator_email;
      const recipientName = task.assignee_name || task.creator_name || 'TaskFlow User';
      const recipientUserId = task.assignee_id || task.created_by;

      if (!recipientEmail) {
        continue;
      }

      const rawDeadline = task.deadline || task.due_date;
      const deadlineStr = rawDeadline ? String(rawDeadline).split(' ')[0] : 'Today';
      const todayStr = new Date().toISOString().split('T')[0];
      const isOverdue = deadlineStr < todayStr;

      // 1. Send the email notification
      const emailResult = await sendTaskDeadlineEmail({
        toEmail: recipientEmail,
        recipientName,
        taskTitle: task.title,
        taskDescription: task.description || '',
        dueDate: task.due_date ? String(task.due_date).split(' ')[0] : null,
        deadline: task.deadline ? String(task.deadline).split(' ')[0] : null,
        priority: task.priority || 'p4',
        projectName: task.project_name || 'Inbox',
        workspaceName: task.workspace_name || 'Personal',
        isOverdue,
      });

      // 2. Mark task deadline email as sent
      await pool.query(
        'UPDATE tasks SET deadline_email_sent_at = NOW() WHERE id = ?',
        [task.id]
      );

      // 3. Create an in-app notification if recipient has user ID
      if (recipientUserId) {
        const notifTitle = isOverdue
          ? `⚠️ Overdue Task Alert: "${task.title}"`
          : `⏰ Deadline Today: "${task.title}"`;
        const notifMessage = `Task "${task.title}" reached its deadline (${deadlineStr}) and is still pending. An alert was sent to ${recipientEmail}.`;

        await pool.query(
          `INSERT INTO notifications (user_id, workspace_id, title, message, link, is_read)
           VALUES (?, ?, ?, ?, ?, FALSE)`,
          [recipientUserId, task.workspace_id, notifTitle, notifMessage, '/app/today']
        );
      }

      // 4. Log activity
      await logActivity({
        workspaceId: task.workspace_id,
        taskId: task.id,
        userId: recipientUserId,
        action: 'task.deadline_email_alert_sent',
        metadata: {
          recipientEmail,
          deadline: deadlineStr,
          isOverdue,
          emailSuccess: emailResult.success,
        },
      });

      notifiedTasks.push({
        taskId: task.id,
        title: task.title,
        recipientEmail,
        recipientName,
        deadline: deadlineStr,
        isOverdue,
        emailSuccess: emailResult.success,
      });
    }

    if (notifiedTasks.length > 0) {
      console.log(`[DeadlineScheduler] Sent ${notifiedTasks.length} deadline email notification(s).`);
    }

    return {
      success: true,
      processed: tasks.length,
      notifiedCount: notifiedTasks.length,
      tasks: notifiedTasks,
    };
  } catch (error) {
    console.error('[DeadlineScheduler Error]:', error.message);
    return { success: false, error: error.message };
  } finally {
    isRunningCheck = false;
  }
}

/**
 * Starts the automated recurring deadline check.
 * Default interval is 60 seconds (1 minute).
 */
function startDeadlineScheduler(intervalMs = 60000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log(`[DeadlineScheduler] Started background deadline checker (interval: ${intervalMs / 1000}s)`);

  // Run initial check after 5 seconds
  setTimeout(() => {
    checkAndNotifyDeadlines().catch((err) =>
      console.error('[DeadlineScheduler Initial Check Error]:', err.message)
    );
  }, 5000);

  // Set recurring interval
  schedulerInterval = setInterval(() => {
    checkAndNotifyDeadlines().catch((err) =>
      console.error('[DeadlineScheduler Interval Error]:', err.message)
    );
  }, intervalMs);

  return schedulerInterval;
}

function stopDeadlineScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[DeadlineScheduler] Stopped background deadline checker.');
  }
}

module.exports = {
  checkAndNotifyDeadlines,
  startDeadlineScheduler,
  stopDeadlineScheduler,
};
