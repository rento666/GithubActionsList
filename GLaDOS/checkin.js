const axios = require('axios');
const { createNotifier } = require('../utils/notify');
const { buildStructuredOutput, kv } = require('../utils/structured-output');

const BASE_URL = 'glados.rocks';
const CHECKIN_API = `https://${BASE_URL}/api/user/checkin`;
const STATUS_API = `https://${BASE_URL}/api/user/status`;
const POINTS_API = `https://${BASE_URL}/api/user/points`;
const EXCHANGE_API = `https://${BASE_URL}/api/user/exchange`;

/**
 * 解析自动兑换配置
 * @param {string} raw - 环境变量原始值
 * @returns {boolean|number} false=不兑换, true=兑换最大方案, 数字=阈值
 */
function parseExchangeConfig(raw) {
  if (!raw || raw === '') return false;
  if (raw === 'true') return true;
  const num = Number(raw);
  if (!isNaN(num) && num > 0) return num;
  return false;
}

/**
 * 邮箱脱敏：us***@gmail.com
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
  if (!email || email === 'N/A') return 'N/A';
  return email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
}

/**
 * 格式化签到状态文本
 * @param {string} checkinMsg
 * @returns {string}
 */
function formatCheckinStatus(checkinMsg) {
  if (checkinMsg.includes("Checkin!")) {
    return `✅ 成功，获得${checkinMsg.match(/\d+/)?.[0] || 0}积分`;
  }
  return "⚠️ " + checkinMsg;
}

/**
 * 格式化兑换状态文本
 * @param {string} exchangeMsg
 * @returns {string}
 */
function formatExchangeStatus(exchangeMsg) {
  if (!exchangeMsg) return '';
  const icon = exchangeMsg.includes('成功') ? '✅' : '⚠️';
  return `${icon} ${exchangeMsg}`;
}

/**
 * 构建单条签到结果的 lists 数组
 * @param {object} item - { index, checkinMsg, email, leftDays, points, exchangeMsg }
 * @returns {Array<{key: string, value: string}>}
 */
function buildResultLists(item) {
  const lists = [
    kv('邮箱', item.email),
    kv('签到', formatCheckinStatus(item.checkinMsg)),
    kv('天数', item.leftDays),
    kv('积分', item.points),
  ];
  if (item.exchangeMsg) {
    lists.push(kv('兑换', formatExchangeStatus(item.exchangeMsg)));
  }
  return lists;
}

/**
 * 格式化单条签到结果为纯文本（用于邮件/控制台输出）
 * @param {object} item - { index, checkinMsg, email, leftDays, points, exchangeMsg }
 * @returns {string}
 */
function formatResult(item) {
  const lists = buildResultLists(item);
  const lines = [`📋账号 ${item.index}:`];
  for (const entry of lists) {
    lines.push(`${entry.key}: ${entry.value}`);
  }
  return lines.join('\n');
}

/**
 * 执行 GLaDOS 签到流程
 * @param {object} options
 * @param {string[]} options.cookies - cookie 列表
 * @param {boolean|number} options.exchangeConfig - 兑换配置
 * @param {object} [options.axiosInstance] - 可选的 axios 实例（便于测试注入）
 * @returns {Promise<object[]>} 签到结果数组
 */
async function runCheckin({ cookies, exchangeConfig, axiosInstance }) {
  const http = axiosInstance || axios;
  const results = [];

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const item = {
      index: i + 1,
      checkinMsg: '',
      email: '',
      leftDays: '',
      points: '',
      plans: [],
      exchangeMsg: '',
    };

    try {
      const commonHeaders = {
        'cookie': cookie,
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
      };

      // ===== 签到 =====
      try {
        const checkinRes = await http.post(CHECKIN_API, `{"token":"${BASE_URL}"}`, {
          headers: { ...commonHeaders, 'referer': CHECKIN_API },
        });
        const checkinData = checkinRes.data;
        if (checkinData?.code) {
          throw new Error(checkinData?.message || '签到接口返回错误');
        }
        item.checkinMsg = checkinData?.message || '签到成功';
      } catch (err) {
        if (err.message.includes("Today's observation logged.")) {
          item.checkinMsg = '今日已签到';
        } else {
          throw err;
        }
      }

      // ===== 查询状态与积分 =====
      const [statusRes, pointsRes] = await Promise.all([
        http.get(STATUS_API, { headers: { ...commonHeaders, 'referer': STATUS_API } }),
        http.get(POINTS_API, { headers: { ...commonHeaders, 'referer': POINTS_API } }),
      ]);

      const statusData = statusRes.data;
      if (statusData?.code) throw new Error(statusData?.message || '状态接口返回错误');
      const email = statusData.data?.email || 'N/A';
      item.email = maskEmail(email);
      item.leftDays = `${Number(statusData.data?.leftDays || 0).toFixed(0)} 天`;

      const pointsData = pointsRes.data;
      if (pointsData?.code) throw new Error(pointsData?.message || '积分接口返回错误');
      const currentPoints = Number(pointsData.points || 0);
      item.points = currentPoints.toFixed(0);
      if (pointsData.plans) {
        item.plans = Object.entries(pointsData.plans).map(([key, val]) => ({
          planType: key,
          points: val.points,
          days: val.days,
        }));
      }

      // ===== 自动兑换（可选） =====
      if (exchangeConfig && item.plans.length > 0) {
        const sorted = item.plans
          .filter(p => p.points)
          .sort((a, b) => b.points - a.points);

        let best = null;
        let skipReason = '';

        if (exchangeConfig === true) {
          const maxPlan = sorted[0];
          if (currentPoints >= maxPlan.points) {
            best = maxPlan;
          } else {
            skipReason = `积分不足（需要 ${maxPlan.points}，当前 ${currentPoints}）`;
          }
        } else {
          const threshold = exchangeConfig;
          if (currentPoints < threshold) {
            skipReason = `未达兑换阈值（当前 ${currentPoints} < ${threshold} 积分）`;
          } else {
            const affordable = sorted.filter(p => currentPoints >= p.points);
            if (affordable.length > 0) {
              best = affordable[0];
            } else {
              const minPoints = Math.min(...item.plans.map(p => p.points || Infinity));
              skipReason = `积分不足（最低需要 ${isFinite(minPoints) ? minPoints : '?'} 积分）`;
            }
          }
        }

        if (skipReason) {
          item.exchangeMsg = skipReason;
        } else {
          try {
            const exchangeRes = await http.post(EXCHANGE_API, JSON.stringify({ planType: best.planType }), {
              headers: { ...commonHeaders, 'referer': EXCHANGE_API },
            });
            const exchangeData = exchangeRes.data;
            if (exchangeData?.code) {
              throw new Error(exchangeData?.message || '兑换接口返回错误');
            }

            const daysAdded = exchangeData?.daysAdded || best.days || 0;
            const pointsUsed = exchangeData?.pointsUsed || best.points;

            const newStatusRes = await http.get(STATUS_API, { headers: { ...commonHeaders, 'referer': STATUS_API } });
            const newStatusData = newStatusRes.data;
            if (!newStatusData?.code) {
              item.leftDays = `${Number(newStatusData.data?.leftDays || 0).toFixed(0)} 天`;
              item.points = `${Number(newStatusData.points ?? currentPoints - pointsUsed).toFixed(0)}`;
            }

            item.exchangeMsg = `兑换成功：${best.points} 积分 → ${daysAdded} 天`;
          } catch (exErr) {
            item.exchangeMsg = `兑换失败：${exErr.message}`;
          }
        }
      }
    } catch (err) {
      item.checkinMsg = item.checkinMsg || `签到错误：${err.message}`;
      item.email = item.email || 'N/A';
      item.leftDays = item.leftDays || 'N/A';
      item.points = item.points || 'N/A';
    }

    results.push(item);
  }

  return results;
}

module.exports = { parseExchangeConfig, maskEmail, formatResult, runCheckin };

// 直接运行时（非 require 引入），从环境变量读取配置并执行
if (require.main === module) {
  const GLA_COOKIE = process.env.GLA_COOKIE;
  const GLA_AUTO_EXCHANGE = parseExchangeConfig(process.env.GLA_AUTO_EXCHANGE || '');
  const NOTIFY_SUCCESS = process.env.GLA_NOTIFY_SUCCESS === 'true';
  const NOTIFY_ERRORS = process.env.GLA_NOTIFY_ERRORS === 'true';
  const notifier = createNotifier();

  (async () => {
    try {
      if (!GLA_COOKIE) {
        throw new Error('缺少环境变量 GLA_COOKIE');
      }

      const cookies = GLA_COOKIE
        .split(/\n/)
        .map(line => line.trim())
        .filter(Boolean);

      if (cookies.length === 0) {
        throw new Error('GLA_COOKIE 中没有有效的 cookie，多个 cookie 请用换行符分隔');
      }

      console.log(`✅ 加载 cookie 数量：${cookies.length}`);
      if (GLA_AUTO_EXCHANGE === true) {
        console.log('🔄 自动兑换已启用（兑换最大方案）');
      } else if (GLA_AUTO_EXCHANGE) {
        console.log(`🔄 自动兑换已启用（阈值：${GLA_AUTO_EXCHANGE} 积分）`);
      }

      const results = await runCheckin({ cookies, exchangeConfig: GLA_AUTO_EXCHANGE });

      // ===== 汇总 =====
      const summaryLines = results.map(r => formatResult(r));
      const summary = `🚀 GLaDOS 签到结果\n${'─'.repeat(3)}\n${summaryLines.join('\n')}`;
      console.log('\n' + summary);

      // 输出结构化 JSON 供 keep-alive 使用
      const structuredData = buildStructuredOutput({
        title: 'GLaDOS',
        content: '🚀 签到结果',
        items: results.map(r => ({
          header: `账号 ${r.index}`,
          lists: buildResultLists(r)
        }))
      });
      console.log('__KEEP_ALIVE_JSON__');
      console.log(JSON.stringify(structuredData));
      console.log('__KEEP_ALIVE_JSON_END__');

      // 签到成功邮件通知
      if (NOTIFY_SUCCESS && notifier) {
        await notifier.send('✅ GLaDOS 签到结果', summary);
      }

    } catch (error) {
      let errorSummary = '';
      if (error.response) {
        errorSummary = `❌ 请求失败: HTTP ${error.response.status}\n响应内容: ${JSON.stringify(error.response.data)}`;
        console.error(errorSummary);
      } else {
        errorSummary = `❌ 错误: ${error.message}`;
        console.error(errorSummary);
      }

      if (NOTIFY_ERRORS && notifier) {
        await notifier.send('❌ GLaDOS 签到失败', errorSummary);
      }
      process.exit(1);
    }
  })();
}
