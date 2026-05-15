const axios = require('axios');
const { createNotifier } = require('../utils/notify');
const { buildStructuredOutput, kv } = require('../utils/structured-output');

/**
 * 检查域名到期状态
 * @param {object} options
 * @param {string} options.apiUrl - Whois API URL
 * @param {string} options.domain - 要监控的域名
 * @param {string} [options.language='zh'] - 输出语言
 * @param {object} [options.axiosInstance] - 可选的 axios 实例（便于测试注入）
 * @returns {Promise<{status: 'ok'|'warning'|'error', daysLeft: number, message: string}>}
 */
async function checkDomain({ apiUrl, domain, language = 'zh', axiosInstance }) {
  const http = axiosInstance || axios;
  const isZh = language === 'zh';

  try {
    const response = await http.get(`${apiUrl}?domain=${domain}&format=json`);
    const data = response.data.whois.domain;

    // 解析域名到期时间
    const expDate = new Date(data.expiration_date);
    const now = new Date();
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    // 域名即将到期（警告）
    if (daysLeft <= 30) {
      const message = isZh
        ? `⚠️ 警告: 域名 ${domain} 即将到期，剩余 ${daysLeft} 天！`
        : `⚠️ Warning: Domain ${domain} expiring in ${daysLeft} days!`;
      return { status: 'warning', daysLeft, message };
    }

    // 域名状态正常
    const message = isZh
      ? `✅ 域名 ${domain} 状态正常，剩余 ${daysLeft} 天有效期`
      : `✅ Domain ${domain} is valid, ${daysLeft} days remaining`;
    return { status: 'ok', daysLeft, message };

  } catch (error) {
    // API 接口错误
    if (error.response) {
      const { code, message } = error.response.data;
      const errMsg = isZh
        ? `❌ API请求失败: ${message} (错误码: ${code})`
        : `❌ API Error: ${message} (Code: ${code})`;
      return { status: 'error', daysLeft: -1, message: errMsg };
    }

    // 网络/请求错误
    const errMsg = isZh
      ? `❌ 网络请求失败: ${error.message}`
      : `❌ Request failed: ${error.message}`;
    return { status: 'error', daysLeft: -1, message: errMsg };
  }
}

module.exports = { checkDomain };

// 直接运行时（非 require 引入），从环境变量读取配置并执行
if (require.main === module) {
  const API_URL = process.env.WHOIS_API_URL || 'https://uapis.cn/api/v1/network/whois';
  const DOMAIN = process.env.WHOIS_DOMAIN || 'example.com';
  const NOTIFY_WARNINGS = process.env.WHOIS_NOTIFY_WARNINGS === 'true';
  const NOTIFY_SUCCESS = process.env.WHOIS_NOTIFY_SUCCESS === 'true';
  const NOTIFY_ERRORS = process.env.WHOIS_NOTIFY_ERRORS === 'true';
  const LANGUAGE = process.env.WHOIS_LANGUAGE || 'zh';
  const notifier = createNotifier();
  const isZh = LANGUAGE === 'zh';

  (async () => {
    console.log(`Checking domain: ${DOMAIN}`);

    const result = await checkDomain({ apiUrl: API_URL, domain: DOMAIN, language: LANGUAGE });
    console.log(result.message);

    // 输出结构化 JSON 供 keep-alive 使用
    const statusText = result.message.split('，')[0] || result.message;
    const structuredData = buildStructuredOutput({
      title: 'Whois',
      content: '域名监控结果',
      items: [{
        header: DOMAIN,
        lists: [
          kv('状态', statusText),
          kv('剩余天数', `${result.daysLeft} 天`)
        ]
      }]
    });
    console.log('__KEEP_ALIVE_JSON__');
    console.log(JSON.stringify(structuredData));
    console.log('__KEEP_ALIVE_JSON_END__');

    if (result.status === 'warning' && NOTIFY_WARNINGS && notifier) {
      const title = isZh ? `⚠️ 域名 ${DOMAIN} 即将到期` : `⚠️ Domain ${DOMAIN} Expiring Soon`;
      const content = isZh ? `域名 ${DOMAIN} 即将在 ${result.daysLeft} 天后到期!` : `Domain ${DOMAIN} is expiring in ${result.daysLeft} days!`;
      await notifier.send(title, content);
    } else if (result.status === 'ok' && NOTIFY_SUCCESS && notifier) {
      const title = isZh ? `✅ 域名 ${DOMAIN} 状态正常` : `✅ Domain ${DOMAIN} Status`;
      const content = isZh ? `域名 ${DOMAIN} 有效期剩余 ${result.daysLeft} 天。` : `Domain ${DOMAIN} is valid for another ${result.daysLeft} days.`;
      await notifier.send(title, content);
    } else if (result.status === 'error' && NOTIFY_ERRORS && notifier) {
      await notifier.send(`❌ ${isZh ? '域名检查错误' : 'Domain Check Error'}：${DOMAIN}`, result.message);
    }
  })();
}
