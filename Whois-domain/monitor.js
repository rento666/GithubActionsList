const axios = require('axios');
const nodemailer = require('nodemailer');

// 从环境变量中读取配置
const API_URL = process.env.API_URL || 'https://uapis.cn/api/whois.php?domain=';
const DOMAIN = process.env.DOMAIN || 'example.com';   // 要监控的域名
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.example.com';   // SMTP 服务器地址
const SMTP_PORT = process.env.SMTP_PORT || 587;   // SMTP 服务器端口
const SMTP_USER = process.env.SMTP_USER || 'your-email@example.com';   // 发件人邮箱地址
const SMTP_PASS = process.env.SMTP_PASS || 'your-email-password';   // 发件人邮箱密码
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'recipient@example.com';   // 收件人邮箱地址
const NOTIFY_ON_START = process.env.NOTIFY_ON_START === 'true'; // 是否在启动时发送通知
const NOTIFY_WARNINGS = process.env.NOTIFY_WARNINGS === 'true'; // 是否发送警告邮件
const NOTIFY_SUCCESS = process.env.NOTIFY_SUCCESS === 'true'; // 是否发送成功邮件
const NOTIFY_ERRORS = process.env.NOTIFY_ERRORS === 'true'; // 是否发送错误邮件

(async () => {
  try {
    if (NOTIFY_ON_START) {
      console.log('📧 Sending start notification email...');
      await sendEmail('Script Started Successfully', `The monitoring script for domain "${DOMAIN}" has started successfully.`);
    }

    console.log(`Checking domain: ${DOMAIN}`);
    const response = await axios.get(API_URL + DOMAIN);
    const data = response.data;

    const expDate = new Date(data.exp_date);
    const now = new Date();
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 30) {
      const warningMessage = `⚠️ Warning: Domain ${DOMAIN} is expiring in ${daysLeft} days!`;
      console.log(warningMessage);
      if (NOTIFY_WARNINGS) {
        await sendEmail(`⚠️ Domain ${DOMAIN} Expiring Soon`, warningMessage);
      }
    } else {
      const successMessage = `✅ Domain ${DOMAIN} is valid for another ${daysLeft} days.`;
      console.log(successMessage);
      if (NOTIFY_SUCCESS) {
        await sendEmail(`✅ Domain ${DOMAIN} Status`, successMessage);
      }
    }
  } catch (error) {
    if (error.response) {
      const { code, msg } = error.response.data;
      const apiErrorMessage = `API Error: ${msg} (Code: ${code})`;
      console.error(apiErrorMessage);
      if (NOTIFY_ERRORS) {
        await sendEmail(`❌ API Error for ${DOMAIN}`, apiErrorMessage);
      }
    } else {
      const requestErrorMessage = `Request failed: ${error.message}`;
      console.error(requestErrorMessage);
      if (NOTIFY_ERRORS) {
        await sendEmail(`❌ Request Error for ${DOMAIN}`, requestErrorMessage);
      }
    }
  }
})();

// 邮件发送函数
async function sendEmail(subject, text) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const message = {
    from: `"Domain Monitor" <${SMTP_USER}>`,
    to: NOTIFY_EMAIL,
    subject,
    text,
  };

  try {
    await transporter.sendMail(message);
    console.log(`📧 Email sent: ${subject}`);
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}