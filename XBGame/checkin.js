const axios = require('axios');
const { createNotifier } = require('../utils/notify');

// 从环境变量中读取配置
const XB_USERNAME = process.env.XB_USERNAME;
const XB_PASSWORD = process.env.XB_PASSWORD;
const NOTIFY_SUCCESS = process.env.XB_NOTIFY_SUCCESS === 'true';
const NOTIFY_ERRORS = process.env.XB_NOTIFY_ERRORS === 'true';

const LOGIN_URL = 'https://xbgame.net/wp-json/jwt-auth/v1/token';
const MISSION_URL = 'https://xbgame.net/wp-json/b2/v1/userMission';

const notifier = createNotifier();

(async () => {
  try {
    // ===== 第一步：登录获取 Token =====
    if (!XB_USERNAME || !XB_PASSWORD) {
      throw new Error('缺少环境变量 XB_USERNAME 或 XB_PASSWORD');
    }

    console.log('🔐 正在登录小白游戏网...');
    const loginRes = await axios.post(LOGIN_URL, {
      username: XB_USERNAME,
      password: XB_PASSWORD,
    });

    const loginData = loginRes.data;
    const token = loginData?.token;
    if (!token) {
      throw new Error(`登录失败，未获取到 token，响应: ${JSON.stringify(loginData)}`);
    }

    const userName = loginData.name || '未知用户';
    const credit = loginData.credit || '0';
    const lvName = loginData?.lv?.lv?.name || '未知等级';
    const money = loginData.money || '0.00';
    const task = loginData?.task_?.finish || 0;
    const taskTotal = loginData?.task_?.total || 0;

    console.log('✅ 登录成功');
    console.log(`👤 用户: ${userName} | 🏅 等级: ${lvName} | 💰 积分: ${credit} | 💵 余额: ${money} | 📋 任务: ${task}/${taskTotal}`);

    // ===== 第二步：签到 =====
    console.log('🎯 正在签到...');
    const missionRes = await axios.post(MISSION_URL, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const missionData = missionRes.data;
    let checkinSummary = '';

    // 返回纯数字/字符串(如 "77") → 今日已签到
    if (typeof missionData === 'number' || typeof missionData === 'string') {
      checkinSummary = `⚠️ 今日已签到过，签到积分: ${missionData}`;
      console.log(checkinSummary);
    } else if (missionData?.mission) {
      // 返回含 mission 对象 → 签到成功
      const m = missionData.mission;
      const days = m?.tk?.days || 0;
      const tkCredit = m?.tk?.credit || 0;
      const earnedCredit = m?.credit || missionData.credit || 0;
      const myCredit = m?.my_credit || '0';
      checkinSummary = [
        '🎉 签到成功！',
        `📅 签到时间: ${missionData.date}`,
        `➕ 获得积分: ${earnedCredit}`,
        `📅 连续签到: ${days} 天 | 累计签到积分: ${tkCredit}`,
        `💰 当前总积分: ${myCredit}`,
      ].join('\n');
      console.log(checkinSummary);
    } else {
      checkinSummary = `📝 签到结果: ${JSON.stringify(missionData)}`;
      console.log(checkinSummary);
    }

    // 签到成功邮件通知
    if (NOTIFY_SUCCESS && notifier) {
      await notifier.send(`✅ 小白游戏网签到 - ${userName}`, checkinSummary);
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
      await notifier.send('❌ 小白游戏网签到失败', errorSummary);
    }
    process.exit(1);
  }
})();
