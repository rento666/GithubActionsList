const axios = require('axios');
const { createNotifier } = require('../utils/notify');

// 从环境变量中读取配置
const API_URL = process.env.WHOIS_API_URL || 'https://uapis.cn/api/v1/network/whois';
const DOMAIN = process.env.WHOIS_DOMAIN || 'example.com';   // 要监控的域名
const NOTIFY_WARNINGS = process.env.WHOIS_NOTIFY_WARNINGS === 'true';
const NOTIFY_SUCCESS = process.env.WHOIS_NOTIFY_SUCCESS === 'true';
const NOTIFY_ERRORS = process.env.WHOIS_NOTIFY_ERRORS === 'true';
const LANGUAGE = process.env.WHOIS_LANGUAGE || 'zh';

const notifier = createNotifier();

(async () => {
  try {
    console.log(`Checking domain: ${DOMAIN}`);
    const response = await axios.get(`${API_URL}?domain=${DOMAIN}&format=json`);
    const data = response.data.whois.domain;

    const expDate = new Date(data.expiration_date);
    const now = new Date();
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft <= 30) {
      let warningMessage = '';
      if (LANGUAGE === 'zh') {
        warningMessage = `⚠️ 警告: 域名 ${DOMAIN} 即将在 ${daysLeft} 天后到期!`;
      } else {
        warningMessage = `⚠️ Warning: Domain ${DOMAIN} is expiring in ${daysLeft} days!`;
      }
      if (NOTIFY_WARNINGS && notifier) {
        if (LANGUAGE === 'zh') {
          await notifier.send(`⚠️ 域名 ${DOMAIN} 天到期`, warningMessage);
        } else {
          await notifier.send(`⚠️ Domain ${DOMAIN} Expiring Soon`, warningMessage);
        }
      }
    } else {
      let successMessage = '';
      if (LANGUAGE === 'zh') {
        successMessage = `✅ 域名 ${DOMAIN} 有效期剩余 ${daysLeft} 天。`;
      } else {
        successMessage = `✅ Domain ${DOMAIN} is valid for another ${daysLeft} days.`;
      }
      if (NOTIFY_SUCCESS && notifier) {
        if (LANGUAGE === 'zh') {
          await notifier.send(`✅ 域名 ${DOMAIN} 状态`, successMessage);
        } else {
          await notifier.send(`✅ Domain ${DOMAIN} Status`, successMessage);
        }
      }
    }
  } catch (error) {
    if (error.response) {
      const { code, message } = error.response.data;
      let apiErrorMessage = '';
      if (LANGUAGE === 'zh') {
        apiErrorMessage = `API 错误: ${message} (代码: ${code})`;
      } else {
        apiErrorMessage = `API Error: ${message} (Code: ${code})`;
      }
      if (NOTIFY_ERRORS && notifier) {
        if (LANGUAGE === 'zh') {
          await notifier.send(`❌ API 错误：${DOMAIN}`, apiErrorMessage);
        } else {
          await notifier.send(`❌ API Error for ${DOMAIN}`, apiErrorMessage);
        }
      }
    } else {
      const requestErrorMessage = `Request failed: ${error.message}`;
      if (NOTIFY_ERRORS && notifier) {
        if (LANGUAGE === 'zh') {
          await notifier.send(`❌ 请求错误：${DOMAIN}`, requestErrorMessage);
        } else {
          await notifier.send(`❌ Request Error for ${DOMAIN}`, requestErrorMessage);
        }
      }
    }
  }
})();
