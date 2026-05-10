const nodemailer = require('nodemailer');

/**
 * 创建邮件通知器
 * 
 * 环境变量（共享）:
 *   SMTP_HOST  - SMTP 服务器地址
 *   SMTP_PORT  - SMTP 端口（默认 587）
 *   SMTP_USER  - 发件人邮箱
 *   SMTP_PASS  - 发件人邮箱密码/授权码
 *   NOTIFY_EMAIL      - 收件人邮箱
 * 
 * @param {object} [options] - 可选覆盖环境变量
 * @returns {{ send: (subject: string, text: string) => Promise<void> } | null}
 *          返回 notifier 对象，未配置邮件时返回 null
 */
function createNotifier(options = {}) {
  const smtpHost = options.smtpHost || process.env.SMTP_HOST;
  const smtpPort = options.smtpPort || parseInt(process.env.SMTP_PORT) || 587;
  const smtpUser = options.smtpUser || process.env.SMTP_USER;
  const smtpPass = options.smtpPass || process.env.SMTP_PASS;
  const notifyEmail = options.notifyEmail || process.env.NOTIFY_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPass || !notifyEmail) {
    return null;
  }

  async function send(subject, text) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Notify" <${smtpUser}>`,
      to: notifyEmail,
      subject,
      text,
    });
    console.log(`📧 Email sent: ${subject}`);
  }

  return { send };
}

module.exports = { createNotifier };
