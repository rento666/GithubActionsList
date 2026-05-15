const axios = require('axios');
const { createNotifier } = require('../utils/notify');

// 从环境变量中读取配置
const GLA_COOKIE = process.env.GLA_COOKIE;
// 解析 GLA_AUTO_EXCHANGE：false/空 → 不兑换；true → 兑换最大方案；数字 → 积分达到阈值才兑换
const _rawExchange = process.env.GLA_AUTO_EXCHANGE || '';
let GLA_AUTO_EXCHANGE = false; // false | true | 数字
if (_rawExchange === 'true') {
  GLA_AUTO_EXCHANGE = true;
} else {
  const num = Number(_rawExchange);
  if (_rawExchange !== '' && !isNaN(num) && num > 0) {
    GLA_AUTO_EXCHANGE = num;
  }
}
const NOTIFY_SUCCESS = process.env.GLA_NOTIFY_SUCCESS === 'true';
const NOTIFY_ERRORS = process.env.GLA_NOTIFY_ERRORS === 'true';

const BASE_URL = 'glados.rocks';
const CHECKIN_API = `https://${BASE_URL}/api/user/checkin`;
const STATUS_API = `https://${BASE_URL}/api/user/status`;
const POINTS_API = `https://${BASE_URL}/api/user/points`;
const EXCHANGE_API = `https://${BASE_URL}/api/user/exchange`;

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
    if (GLA_AUTO_EXCHANGE === true) {
      console.log('🔄 自动兑换已启用（兑换最大方案）');
    } else if (GLA_AUTO_EXCHANGE) {
      console.log(`🔄 自动兑换已启用（阈值：${GLA_AUTO_EXCHANGE} 积分）`);
    }

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
        console.log(`🔐 正在签到 [${i + 1}/${cookies.length}]...`);
        try {
          const checkinRes = await axios.post(CHECKIN_API, `{"token":"${BASE_URL}"}`, {
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

        // ===== 查询状态与积分（签到成功或已签到都需要） =====
        const [statusRes, pointsRes] = await Promise.all([
          axios.get(STATUS_API, { headers: { ...commonHeaders, 'referer': STATUS_API } }),
          axios.get(POINTS_API, { headers: { ...commonHeaders, 'referer': POINTS_API } }),
        ]);

        const statusData = statusRes.data;
        if (statusData?.code) throw new Error(statusData?.message || '状态接口返回错误');
        const email = statusData.data?.email || 'N/A';
        item.email = email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c);
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

        console.log(`✅ [${i + 1}] ${item.email}`);
        console.log(`${item.checkinMsg}`);
        console.log(`当前积分 ${item.points}`);
        console.log(`剩余天数 ${item.leftDays}`);

        // ===== 自动兑换（可选） =====
        if (GLA_AUTO_EXCHANGE && item.plans.length > 0) {
          console.log(`🔄 正在自动兑换 [${i + 1}/${cookies.length}]...`);

          // 按 points 降序排列
          const sorted = item.plans
            .filter(p => p.points)
            .sort((a, b) => b.points - a.points);

          // true 模式：只兑换最大方案，不够则不换
          // 数字模式：积分 >= 阈值时，兑换最大可负担方案
          let best = null;
          let skipReason = '';

          if (GLA_AUTO_EXCHANGE === true) {
            const maxPlan = sorted[0]; // 积分要求最高的方案
            if (currentPoints >= maxPlan.points) {
              best = maxPlan;
            } else {
              skipReason = `积分不足以兑换最大方案（需要 ${maxPlan.points}，当前 ${currentPoints}）`;
            }
          } else {
            // 数字阈值模式
            const threshold = GLA_AUTO_EXCHANGE;
            if (currentPoints < threshold) {
              skipReason = `未达兑换阈值（当前 ${currentPoints} < ${threshold} 积分）`;
            } else {
              const affordable = sorted.filter(p => currentPoints >= p.points);
              if (affordable.length > 0) {
                best = affordable[0]; // 最大可负担方案
              } else {
                const minPoints = Math.min(...item.plans.map(p => p.points || Infinity));
                skipReason = `积分不足，无法兑换（最低需要 ${isFinite(minPoints) ? minPoints : '?'} 积分）`;
              }
            }
          }

          if (skipReason) {
            item.exchangeMsg = skipReason;
            console.log(`⏸️ [${i + 1}] ${skipReason}`);
          } else {
            try {
              const exchangeRes = await axios.post(EXCHANGE_API, JSON.stringify({ planType: best.planType }), {
                headers: { ...commonHeaders, 'referer': EXCHANGE_API },
              });
              const exchangeData = exchangeRes.data;
              if (exchangeData?.code) {
                throw new Error(exchangeData?.message || '兑换接口返回错误');
              }

              const daysAdded = exchangeData?.daysAdded || best.days || 0;
              const pointsUsed = exchangeData?.pointsUsed || best.points;

              // 兑换成功后再查 STATUS_API 获取最新状态
              const newStatusRes = await axios.get(STATUS_API, { headers: { ...commonHeaders, 'referer': STATUS_API } });
              const newStatusData = newStatusRes.data;
              if (!newStatusData?.code) {
                item.leftDays = `${Number(newStatusData.data?.leftDays || 0).toFixed(0)} 天`;
                item.points = `${Number(newStatusData.points ?? currentPoints - pointsUsed).toFixed(0)}`;
              }

              item.exchangeMsg = `兑换成功：${best.points} 积分 → ${daysAdded} 天`;
              console.log(`✅ [${i + 1}] ${item.exchangeMsg}`);
            } catch (exErr) {
              item.exchangeMsg = `兑换失败：${exErr.message}`;
              console.error(`❌ [${i + 1}] ${item.exchangeMsg}`);
            }
          }
        }
      } catch (err) {
        item.checkinMsg = item.checkinMsg || `签到错误：${err.message}`;
        item.email = item.email || 'N/A';
        item.leftDays = item.leftDays || 'N/A';
        item.points = item.points || 'N/A';
        console.error(`❌ [${i + 1}] ${err.message}`);
      }

      results.push(item);
    }

    // ===== 汇总 =====
    const summaryLines = results.map(r => {
      const ciRes = r.checkinMsg.includes("Checkin!") 
        ? `✅ 成功，获得${r.checkinMsg.match(/\d+/)?.[0] || 0}积分` : "⚠️ " + r.checkinMsg;
      const lines = [
        `📋账号 ${r.index}:`,
        `邮箱: ${r.email}`,
        `签到: ${ciRes}`,
        `剩余天数: ${r.leftDays}`,
        `当前积分: ${r.points}`,
      ];
      if (r.exchangeMsg) {
        lines.push(`兑换: ${r.exchangeMsg.includes('成功') ? '✅' : '⚠️'} ${r.exchangeMsg}`);
      }
      return lines.join('\n');
    });

    const summary = `🚀 GLaDOS 签到结果\n${'─'.repeat(3)}\n${summaryLines.join('\n')}`;
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
