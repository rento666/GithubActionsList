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
const NOTIFY_WARNINGS = process.env.NOTIFY_WARNINGS === 'true'; // 是否发送警告邮件
const NOTIFY_SUCCESS = process.env.NOTIFY_SUCCESS === 'true'; // 是否发送成功邮件
const NOTIFY_ERRORS = process.env.NOTIFY_ERRORS === 'true'; // 是否发送错误邮件
const LANGUAGE = process.env.LANGUAGE || 'zh'; // 默认为中文

(async () => {
  try {
    console.log(`Checking domain: ${DOMAIN}`);
    const response = await axios.get(API_URL + DOMAIN);
    const data = response.data;

    const expDate = new Date(data.exp_date);
    const now = new Date();
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 30) {
      let warningMessage = '';
      if(LANGUAGE === 'zh'){
        warningMessage = `⚠️ 警告: 域名 ${DOMAIN} 即将在 ${daysLeft} 天后到期!`;
      }else {
        warningMessage = `⚠️ Warning: Domain ${DOMAIN} is expiring in ${daysLeft} days!`;
      }
      if (NOTIFY_WARNINGS) {
        if(LANGUAGE === 'zh'){
          await sendEmail(`⚠️ 域名 ${DOMAIN} 天到期`, warningMessage);
        }
        else {
          await sendEmail(`⚠️ Domain ${DOMAIN} Expiring Soon`, warningMessage);
        }
      }
    } else {
      let successMessage = '';
      if(LANGUAGE === 'zh'){
        successMessage = `✅ 域名 ${DOMAIN} 有效期剩余 ${daysLeft} 天。`;
      }else {
        successMessage = `✅ Domain ${DOMAIN} is valid for another ${daysLeft} days.`;
      }
      if (NOTIFY_SUCCESS) {
        if(LANGUAGE === 'zh'){
          await sendEmail(`✅ 域名 ${DOMAIN} 状态`, successMessage);
        }
        else {
          await sendEmail(`✅ Domain ${DOMAIN} Status`, successMessage);
        }
      }
    }
  } catch (error) {
    if (error.response) {
      const { code, msg } = error.response.data;
      let apiErrorMessage = '';
      if(LANGUAGE === 'zh'){
        apiErrorMessage = `API 错误: ${msg} (代码: ${code})`;
      }else {
        apiErrorMessage = `API Error: ${msg} (Code: ${code})`;
      }
      if (NOTIFY_ERRORS) {
        if(LANGUAGE === 'zh'){
          await sendEmail(`❌ API 错误：${DOMAIN}`, apiErrorMessage);
        }else {
          await sendEmail(`❌ API Error for ${DOMAIN}`, apiErrorMessage);
        }
      }
    } else {
      const requestErrorMessage = `Request failed: ${error.message}`;
      if (NOTIFY_ERRORS) {
        if(LANGUAGE === 'zh'){
          await sendEmail(`❌ 请求错误：${DOMAIN}`, requestErrorMessage);
        }else {
          await sendEmail(`❌ Request Error for ${DOMAIN}`, requestErrorMessage);
        }
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