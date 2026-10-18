const { getPool } = require('../config/db');

// GET /api/notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT n.*, w.name AS workspace_name
       FROM notifications n
       LEFT JOIN workspaces w ON n.workspace_id = w.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMyNotifications Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notifId = parseInt(req.params.id, 10);
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [
      notifId,
      req.user.id,
    ]);
    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const pool = getPool();
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notifications.' });
  }
};

// POST /api/notifications/check-deadlines
// Manually triggers deadline check and email dispatch
exports.checkDeadlines = async (req, res) => {
  try {
    const { checkAndNotifyDeadlines } = require('../services/deadlineScheduler');
    const result = await checkAndNotifyDeadlines();
    return res.json({
      success: true,
      message: `Deadline scan complete. Processed ${result.processed || 0} tasks, dispatched ${result.notifiedCount || 0} emails.`,
      data: result,
    });
  } catch (error) {
    console.error('[checkDeadlines Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to process deadline notifications.' });
  }
};

// POST /api/notifications/test-email
// Sends a sample deadline reminder email to the authenticated user's email
exports.sendTestDeadlineEmail = async (req, res) => {
  try {
    const { sendTaskDeadlineEmail } = require('../services/emailService');
    const pool = getPool();

    // Fetch latest user details to get clean email and name
    const [userRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0] || req.user;

    const result = await sendTaskDeadlineEmail({
      toEmail: user.email,
      recipientName: user.name,
      taskTitle: 'Sample Task: Review Q4 Project Milestones',
      taskDescription: 'This is a test notification confirming that TaskFlow email alerts are delivered to your login address.',
      dueDate: new Date().toISOString().split('T')[0],
      deadline: new Date().toISOString().split('T')[0],
      priority: 'p1',
      projectName: 'Product Roadmap',
      workspaceName: 'Main Workspace',
      isOverdue: false,
    });

    return res.json({
      success: true,
      message: `Test email sent to ${user.email}`,
      data: result,
    });
  } catch (error) {
    console.error('[sendTestDeadlineEmail Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to send test email.' });
  }
};

