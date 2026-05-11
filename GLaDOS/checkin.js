const axios = require('axios');
const { createNotifier } = require('../utils/notify');

// 从环境变量中读取配置
const GLA_COOKIE = process.env.GLA_COOKIE;
const NOTIFY_SUCCESS = process.env.GLA_NOTIFY_SUCCESS === 'true';
const NOTIFY_ERRORS = process.env.GLA_NOTIFY_ERRORS === 'true';

const BASE_URL = 'glados.rocks';
const CHECKIN_API = `https://${BASE_URL}/api/user/checkin`;
const STATUS_API = `https://${BASE_URL}/api/user/status`;
const POINTS_API = `https://${BASE_URL}/api/user/points`;

const notifier = createNotifier();

(async () => {
  try {
    if (!GLA_COOKIE) {
      throw new Error('缺少环境变量 GLA_COOKIE');
    }

    // 支持多 cookie（用换行符分隔）
    const cookies = GLA_COOKIE
      .split(/\n/)
      .map(line => line.trim())
      .filter(Boolean);

    if (cookies.length === 0) {
      throw new Error('GLA_COOKIE 中没有有效的 cookie，多个 cookie 请用换行符分隔');
    }

    console.log(`✅ 加载 cookie 数量：${cookies.length}`);

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
      };

      try {
        const commonHeaders = {
          'cookie': cookie,
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        };

        // ===== 签到 =====
        console.log(`🔐 正在签到 [${i + 1}/${cookies.length}]...`);
        const checkinRes = await axios.post(CHECKIN_API, `{"token":"${BASE_URL}"}`, {
          headers: { ...commonHeaders, 'referer': CHECKIN_API },
        });
        const checkinData = checkinRes.data;
        if (checkinData?.code) {
          throw new Error(checkinData?.message || '签到接口返回错误');
        }
        item.checkinMsg = checkinData?.message || '签到成功';

        // ===== 状态 =====
        const statusRes = await axios.get(STATUS_API, {
          headers: { ...commonHeaders, 'referer': STATUS_API },
        });
        const statusData = statusRes.data;
        if (statusData?.code) {
          throw new Error(statusData?.message || '状态接口返回错误');
        }

        const email = statusData.data?.email || 'N/A';
        // 邮箱脱敏
        item.email = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
        item.leftDays = `${Number(statusData.data?.leftDays || 0).toFixed(0)} 天`;

        // ===== 积分 =====
        const pointsRes = await axios.get(POINTS_API, {
          headers: { ...commonHeaders, 'referer': POINTS_API },
        });
        const pointsData = pointsRes.data;
        if (pointsData?.code) {
          throw new Error(pointsData?.message || '积分接口返回错误');
        }

        item.points = Number(pointsData.points || 0).toFixed(0);
        if (pointsData.plans) {
          item.plans = Object.entries(pointsData.plans).map(([key, val]) => ({
            planType: key,
            points: val.points,
            days: val.days,
          }));
        }

        console.log(`✅ [${i + 1}] ${item.email} | ${item.checkinMsg} | 剩余 ${item.leftDays} | 积分 ${item.points}`);

      } catch (err) {
        let msg = `签到错误：${err.message}`;
        if (err.message.includes("Today's observation logged.")) {
          msg = '今日已签到';
        }
        item.checkinMsg = msg;
        item.email = 'N/A';
        item.leftDays = 'N/A';
        item.points = 'N/A';
        item.plans = [];
        console.error(`❌ [${i + 1}] ${msg}`);
      }

      results.push(item);
    }

    // ===== 汇总 =====
    const summaryLines = results.map(r => {
      const plansStr = r.plans.length > 0
        ? r.plans.map(p => `${p.planType}(${p.days}天/${p.points}分)`).join(', ')
        : 'N/A';
      return [
        `📋 账号 ${r.index}:`,
        `   邮箱: ${r.email}`,
        `   签到: ${r.checkinMsg}`,
        `   剩余: ${r.leftDays}`,
        `   积分: ${r.points}`,
        `   套餐: ${plansStr}`,
      ].join('\n');
    });

    const summary = `🚀 GLaDOS 签到结果\n${'─'.repeat(40)}\n${summaryLines.join('\n')}`;
    console.log('\n' + summary);

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
