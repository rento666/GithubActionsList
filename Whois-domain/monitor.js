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
  // 日志头部（固定格式，和其他任务统一）
  console.log(`Checking domain: ${DOMAIN}`);
  
  try {
    const response = await axios.get(`${API_URL}?domain=${DOMAIN}&format=json`);
    const data = response.data.whois.domain;

    // 解析域名到期时间
    const expDate = new Date(data.expiration_date);
    const now = new Date();
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    // 域名即将到期（警告）
    if (daysLeft <= 30) {
      if (LANGUAGE === 'zh') {
        console.log(`⚠️ 警告: 域名 ${DOMAIN} 即将到期，剩余 ${daysLeft} 天！`);
      } else {
        console.log(`⚠️ Warning: Domain ${DOMAIN} expiring in ${daysLeft} days!`);
      }
      
      if (NOTIFY_WARNINGS && notifier) {
        const title = LANGUAGE === 'zh' ? `⚠️ 域名 ${DOMAIN} 即将到期` : `⚠️ Domain ${DOMAIN} Expiring Soon`;
        const content = LANGUAGE === 'zh' ? `域名 ${DOMAIN} 即将在 ${daysLeft} 天后到期!` : `Domain ${DOMAIN} is expiring in ${daysLeft} days!`;
        await notifier.send(title, content);
      }
    } 
    // 域名状态正常（成功）
    else {
      if (LANGUAGE === 'zh') {
        console.log(`✅ 域名 ${DOMAIN} 状态正常，剩余 ${daysLeft} 天有效期`);
      } else {
        console.log(`✅ Domain ${DOMAIN} is valid, ${daysLeft} days remaining`);
      }
      
      if (NOTIFY_SUCCESS && notifier) {
        const title = LANGUAGE === 'zh' ? `✅ 域名 ${DOMAIN} 状态正常` : `✅ Domain ${DOMAIN} Status`;
        const content = LANGUAGE === 'zh' ? `域名 ${DOMAIN} 有效期剩余 ${daysLeft} 天。` : `Domain ${DOMAIN} is valid for another ${daysLeft} days.`;
        await notifier.send(title, content);
      }
    }
  } catch (error) {
    // API 接口错误
    if (error.response) {
      const { code, message } = error.response.data;
      const errMsg = LANGUAGE === 'zh' 
        ? `❌ API请求失败: ${message} (错误码: ${code})` 
        : `❌ API Error: ${message} (Code: ${code})`;
      
      console.log(errMsg);
      
      if (NOTIFY_ERRORS && notifier) {
        await notifier.send(`❌ API错误：${DOMAIN}`, errMsg);
      }
    } 
    // 网络/请求错误
    else {
      const errMsg = LANGUAGE === 'zh'
        ? `❌ 网络请求失败: ${error.message}`
        : `❌ Request failed: ${error.message}`;
      
      console.log(errMsg);
      
      if (NOTIFY_ERRORS && notifier) {
        await notifier.send(`❌ 请求错误：${DOMAIN}`, errMsg);
      }
    }
  }
})();