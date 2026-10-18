const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Creates and configures the nodemailer transporter.
 * Supports:
 * 1. Standard SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE)
 * 2. Service-based (EMAIL_SERVICE=gmail, EMAIL_USER, EMAIL_PASS)
 * 3. Fallback dev mode (logs emails to console and returns simulated success)
 */
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const service = process.env.EMAIL_SERVICE; // e.g. 'gmail'

  if (service && user && pass) {
    // Service-specific configuration (like Gmail with App Password)
    transporter = nodemailer.createTransport({
      service,
      auth: { user, pass },
    });
    console.log(`[EmailService] Transporter initialized using service: ${service} (${user})`);
  } else if (host && user && pass) {
    // Custom SMTP server configuration
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
    console.log(`[EmailService] Transporter initialized using SMTP: ${host}:${port} (${user})`);
  } else {
    // Development / fallback stream transport
    console.log('[EmailService] Notice: No real SMTP credentials detected in .env. Using simulated development email mode.');
    transporter = {
      isDevMock: true,
      sendMail: async (mailOptions) => {
        console.log('\n================== [EMAIL DISPATCHED (DEV MODE)] ==================');
        console.log(`✉️ To:      ${mailOptions.to}`);
        console.log(`✉️ From:    ${mailOptions.from || process.env.EMAIL_FROM || 'TaskFlow <no-reply@taskflow.local>'}`);
        console.log(`✉️ Subject: ${mailOptions.subject}`);
        console.log('✉️ Preview Text:\n', mailOptions.text || '(HTML only)');
        console.log('===================================================================\n');
        return {
          messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          response: '250 Mock Email Accepted',
        };
      },
    };
  }

  return transporter;
}

/**
 * Send an arbitrary email
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const mailer = getTransporter();
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'TaskFlow Notifications <no-reply@taskflow.app>';

    const info = await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || '',
      html,
    });

    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error(`[EmailService Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sends a task deadline reminder / overdue alert email to a user.
 */
async function sendTaskDeadlineEmail({
  toEmail,
  recipientName = 'TaskFlow User',
  taskTitle,
  taskDescription = '',
  dueDate = null,
  deadline = null,
  priority = 'p4',
  projectName = 'Inbox',
  workspaceName = 'Personal',
  isOverdue = true,
  appUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}) {
  const targetDate = deadline || dueDate || 'Today';
  const priorityLabels = {
    p1: { text: 'P1 - Urgent', color: '#DC2626', bg: '#FEE2E2' },
    p2: { text: 'P2 - High', color: '#D97706', bg: '#FEF3C7' },
    p3: { text: 'P3 - Medium', color: '#2563EB', bg: '#DBEAFE' },
    p4: { text: 'P4 - Low', color: '#4B5563', bg: '#F3F4F6' },
  };
  const prio = priorityLabels[priority] || priorityLabels.p4;

  const subject = isOverdue
    ? `⚠️ Task Deadline Alert: "${taskTitle}" is overdue in ${workspaceName}`
    : `⏰ Task Deadline Reminder: "${taskTitle}" is due today in ${workspaceName}`;

  const taskActionUrl = `${appUrl.replace(/\/$/, '')}/app/today`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%); padding: 24px 32px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      TaskFlow
                    </div>
                    <div style="font-size: 13px; color: #ffe4e6; margin-top: 4px; font-weight: 500;">
                      Automated Task Deadline Alert
                    </div>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(255,255,255,0.2); color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${isOverdue ? 'DEADLINE PASSED' : 'DEADLINE TODAY'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="font-size: 15px; line-height: 24px; color: #334155; margin: 0 0 16px 0;">
                Hello <strong>${recipientName}</strong>,
              </p>
              
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 24px 0;">
                This is an automated notification to alert you that the following task assigned to you in <strong>${workspaceName}</strong> has reached its allotted deadline and is not yet marked as completed:
              </p>

              <!-- Task Card Details -->
              <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom: 12px;">
                      <div style="font-size: 17px; font-weight: 700; color: #9f1239; margin-bottom: 4px;">
                        📌 ${taskTitle}
                      </div>
                      ${taskDescription ? `<div style="font-size: 13px; color: #475569; line-height: 18px; font-style: italic;">"${taskDescription}"</div>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top: 1px dashed #fda4af; padding-top: 12px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
                        <tr>
                          <td style="padding: 4px 0; color: #64748b; width: 120px;"><strong>Allotted Deadline:</strong></td>
                          <td style="padding: 4px 0; color: #e11d48; font-weight: 700;">📅 ${targetDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #64748b;"><strong>Priority:</strong></td>
                          <td style="padding: 4px 0;">
                            <span style="background-color: ${prio.bg}; color: ${prio.color}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">
                              ${prio.text}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #64748b;"><strong>Project:</strong></td>
                          <td style="padding: 4px 0; color: #1e293b; font-weight: 600;">📁 ${projectName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 4px 0; color: #64748b;"><strong>Workspace:</strong></td>
                          <td style="padding: 4px 0; color: #1e293b; font-weight: 600;">🏢 ${workspaceName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${taskActionUrl}" style="display: inline-block; background-color: #E11D48; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 2px 4px rgba(225, 29, 72, 0.25);">
                      Open Task & Mark as Completed →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; line-height: 18px; color: #94a3b8; margin: 0; text-align: center;">
                Need to reschedule? You can change the due date or update the task directly in TaskFlow.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              You received this automated notification because your email (<strong>${toEmail}</strong>) is registered on TaskFlow.<br>
              © ${new Date().getFullYear()} TaskFlow Management System. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `
TaskFlow Deadline Alert
--------------------------------------------------
Hello ${recipientName},

Your task "${taskTitle}" in workspace "${workspaceName}" (Project: ${projectName}) has reached its allotted deadline (${targetDate}) and is not completed yet.

Priority: ${prio.text}
${taskDescription ? `Description: "${taskDescription}"\n` : ''}
Open task in TaskFlow: ${taskActionUrl}

TaskFlow Automated Notification System
`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}

module.exports = {
  sendEmail,
  sendTaskDeadlineEmail,
  getTransporter,
};
