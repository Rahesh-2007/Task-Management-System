const { getPool, logActivity } = require('../config/db');

// Helper to verify user is workspace member
async function verifyMember(wsId, userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
    [wsId, userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// -------------------------------------------------------------
// MEETINGS (Google Meet integration)
// -------------------------------------------------------------

exports.getMeetings = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied: Not a member.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT m.*, u.name as creator_name, u.email as creator_email, u.avatar as creator_avatar
       FROM meetings m
       JOIN users u ON m.creator_id = u.id
       WHERE m.workspace_id = ?
       ORDER BY m.scheduled_start ASC`,
      [wsId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getMeetings Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch meetings.' });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied: Not a member.' });
    }

    const { title, description = '', scheduled_start, duration_minutes = 30, meeting_link } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Meeting title is required.' });
    }
    if (!scheduled_start) {
      return res.status(400).json({ success: false, message: 'Scheduled start date/time is required.' });
    }

    // Default to Google Meet if no custom link provided
    let finalLink = (meeting_link || '').trim();
    if (!finalLink) {
      // Create a unique Google Meet formatted room code or standard Google Meet launcher
      const randomCode = Math.random().toString(36).substring(2, 5) + '-' +
                         Math.random().toString(36).substring(2, 6) + '-' +
                         Math.random().toString(36).substring(2, 5);
      finalLink = `https://meet.google.com/${randomCode}`;
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO meetings (workspace_id, creator_id, title, description, meeting_link, scheduled_start, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [wsId, req.user.id, title.trim(), description.trim(), finalLink, scheduled_start, parseInt(duration_minutes, 10) || 30]
    );

    const [creatorRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const creatorName = creatorRows[0]?.name || 'A team member';

    // 1. Log activity
    await logActivity({
      workspaceId: wsId,
      userId: req.user.id,
      action: 'meeting_scheduled',
      metadata: { meetingId: result.insertId, title: title.trim(), scheduled_start, meeting_link: finalLink },
    });

    // 2. Notify all workspace members via notifications table
    const [membersRows] = await pool.query(
      'SELECT user_id FROM workspace_members WHERE workspace_id = ?',
      [wsId]
    );

    for (const member of membersRows) {
      await pool.query(
        `INSERT INTO notifications (user_id, workspace_id, title, message, link, is_read)
         VALUES (?, ?, ?, ?, ?, FALSE)`,
        [
          member.user_id,
          wsId,
          `📅 New Meeting: ${title.trim()}`,
          `${creatorName} scheduled a Google Meet "${title.trim()}" for ${scheduled_start} (${parseInt(duration_minutes, 10) || 30} mins).`,
          '/app/meetings',
        ]
      ).catch(() => {});
    }

    // 3. Post notification in workspace team chat
    await pool.query(
      'INSERT INTO chat_messages (workspace_id, user_id, content) VALUES (?, ?, ?)',
      [
        wsId,
        req.user.id,
        `📅 **New Meeting Scheduled**: "${title.trim()}"\n🕒 **When**: ${scheduled_start} (${parseInt(duration_minutes, 10) || 30} mins)\n🔗 **Join Google Meet**: ${finalLink}`,
      ]
    ).catch(() => {});

    const [rows] = await pool.query(
      `SELECT m.*, u.name as creator_name, u.email as creator_email, u.avatar as creator_avatar
       FROM meetings m
       JOIN users u ON m.creator_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createMeeting Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create meeting.' });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const meetingId = parseInt(req.params.meetingId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pool = getPool();
    await pool.query('DELETE FROM meetings WHERE id = ? AND workspace_id = ?', [meetingId, wsId]);
    return res.json({ success: true, message: 'Meeting deleted successfully.' });
  } catch (error) {
    console.error('[deleteMeeting Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete meeting.' });
  }
};

// -------------------------------------------------------------
// TEAM CHAT (Real-Time workspace feed)
// -------------------------------------------------------------

exports.getChatMessages = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, wm.role as user_role
       FROM chat_messages c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN workspace_members wm ON (wm.workspace_id = c.workspace_id AND wm.user_id = c.user_id)
       WHERE c.workspace_id = ?
       ORDER BY c.created_at ASC
       LIMIT 200`,
      [wsId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getChatMessages Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chat messages.' });
  }
};

exports.sendChatMessage = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO chat_messages (workspace_id, user_id, content) VALUES (?, ?, ?)',
      [wsId, req.user.id, content.trim()]
    );

    const [rows] = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, wm.role as user_role
       FROM chat_messages c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN workspace_members wm ON (wm.workspace_id = c.workspace_id AND wm.user_id = c.user_id)
       WHERE c.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[sendChatMessage Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// -------------------------------------------------------------
// VACATIONS & TIME-OFF CALENDAR
// -------------------------------------------------------------

exports.getVacations = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT v.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM vacations v
       JOIN users u ON v.user_id = u.id
       WHERE v.workspace_id = ?
       ORDER BY v.start_date ASC`,
      [wsId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getVacations Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch vacations.' });
  }
};

exports.createVacation = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { type = 'vacation', start_date, end_date, reason = '' } = req.body;
    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
    }

    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';
    const initialStatus = isOwnerOrAdmin ? 'approved' : 'pending';

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO vacations (workspace_id, user_id, type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [wsId, req.user.id, type, start_date, end_date, reason.trim(), initialStatus]
    );

    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const userName = userRows[0]?.name || 'A team member';

    await logActivity({
      workspaceId: wsId,
      userId: req.user.id,
      action: 'vacation_requested',
      metadata: { vacationId: result.insertId, type, start_date, end_date, status: initialStatus },
    });

    // Notify all admins and owners if pending approval
    if (!isOwnerOrAdmin) {
      const [adminRows] = await pool.query(
        `SELECT user_id FROM workspace_members WHERE workspace_id = ? AND role IN ('admin', 'owner') AND user_id != ?`,
        [wsId, req.user.id]
      );

      for (const admin of adminRows) {
        await pool.query(
          `INSERT INTO notifications (user_id, workspace_id, title, message, link, is_read)
           VALUES (?, ?, ?, ?, ?, FALSE)`,
          [
            admin.user_id,
            wsId,
            `⏳ Time-off Approval Needed: ${userName}`,
            `${userName} requested ${type} leave from ${start_date} to ${end_date}. Reason: "${reason.trim() || 'No reason specified'}"`,
            '/app/notifications',
          ]
        ).catch(() => {});
      }
    }

    const [rows] = await pool.query(
      `SELECT v.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar
       FROM vacations v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[createVacation Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to create vacation entry.' });
  }
};

exports.updateVacationStatus = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const vacationId = parseInt(req.params.vacationId, 10);
    const { status } = req.body;

    const membership = await verifyMember(wsId, req.user.id);
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Admin or owner privileges required.' });
    }

    const pool = getPool();
    const [vacRows] = await pool.query(
      `SELECT v.*, u.name as user_name FROM vacations v JOIN users u ON v.user_id = u.id WHERE v.id = ? AND v.workspace_id = ?`,
      [vacationId, wsId]
    );
    if (vacRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vacation request not found.' });
    }
    const vac = vacRows[0];

    await pool.query(
      'UPDATE vacations SET status = ? WHERE id = ? AND workspace_id = ?',
      [status, vacationId, wsId]
    );

    const [adminRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const adminName = adminRows[0]?.name || 'Admin';

    // Send response notification back to the team member who requested it
    const isApproved = status === 'approved';
    await pool.query(
      `INSERT INTO notifications (user_id, workspace_id, title, message, link, is_read)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [
        vac.user_id,
        wsId,
        isApproved ? `✅ Time-off Request Approved!` : `❌ Time-off Request Rejected`,
        `Your ${vac.type} leave request (${vac.start_date} to ${vac.end_date}) was ${isApproved ? 'APPROVED' : 'REJECTED'} by ${adminName}.`,
        '/app/vacations',
      ]
    ).catch(() => {});

    return res.json({ success: true, message: `Vacation request ${status} successfully.` });
  } catch (error) {
    console.error('[updateVacationStatus Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update vacation status.' });
  }
};

exports.deleteVacation = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const vacationId = parseInt(req.params.vacationId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pool = getPool();
    await pool.query(
      'DELETE FROM vacations WHERE id = ? AND workspace_id = ? AND (user_id = ? OR ? IN ("owner", "admin"))',
      [vacationId, wsId, req.user.id, membership.role]
    );

    return res.json({ success: true, message: 'Vacation entry deleted.' });
  } catch (error) {
    console.error('[deleteVacation Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete vacation.' });
  }
};

// -------------------------------------------------------------
// ACTIVITY STREAM (Real-time workspace activity feed)
// -------------------------------------------------------------

exports.getActivityStream = async (req, res) => {
  try {
    const wsId = parseInt(req.params.workspaceId, 10);
    const membership = await verifyMember(wsId, req.user.id);
    if (!membership) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email, u.avatar as user_avatar, t.title as task_title
       FROM activity_logs a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN tasks t ON a.task_id = t.id
       WHERE a.workspace_id = ?
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [wsId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[getActivityStream Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activity stream.' });
  }
};
