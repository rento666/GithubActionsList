const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 从环境变量中读取配置
const WECOM_KEY = process.env.WECOM_KEY;
const NOTIFY_ERRORS = process.env.WECOM_NOTIFY_ERRORS === 'true';

const WEBHOOK_URL = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${WECOM_KEY}`;

(async () => {
  try {
    if (!WECOM_KEY) {
      throw new Error('缺少环境变量 WECOM_KEY');
    }

    // 使用北京时间 (UTC+8) 确定日期
    const now = new Date();
    const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
    const beijing = new Date(beijingMs);

    const year = beijing.getUTCFullYear();
    const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
    const day = String(beijing.getUTCDate()).padStart(2, '0');

    const dataDir = path.join(__dirname, '..', 'data', `${year}-${month}`);
    const filePath = path.join(dataDir, `data-${day}.txt`);

    // 读取当天数据文件
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 未找到当天数据文件: ${filePath}，跳过推送`);
      return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8').trim();
    if (!fileContent) {
      console.log('⚠️ 当天数据文件为空，跳过推送');
      return;
    }

    console.log(`📄 读取数据文件: ${filePath}`);
    console.log(`📊 数据长度: ${fileContent.length} 字符`);

    // 企业微信 markdown 格式有字数限制（约 4096 字节），超长则截断
    const MAX_LENGTH = 3800;
    let content = fileContent;
    if (content.length > MAX_LENGTH) {
      content = content.substring(0, MAX_LENGTH) + '\n\n... (内容过长已截断)';
    }

    // 构建 markdown 消息
    const dateStr = `${year}-${month}-${day}`;
    const notice = [
      `### 📋 GithubActionsList 日报 ${dateStr}`,
      '',
      content,
    ];

    console.log('📤 正在推送企业微信机器人...');
    const res = await axios.post(WEBHOOK_URL, {
      msgtype: 'markdown',
      markdown: { content: notice.join('\n') },
    }, {
      headers: { 'content-type': 'application/json' },
    });

    if (res.data?.errcode !== 0) {
      throw new Error(`企业微信返回错误: ${res.data?.errmsg || JSON.stringify(res.data)}`);
    }

    console.log(`✅ 推送成功！${dateStr} 日报已发送到企业微信群`);

  } catch (error) {
    let errorSummary = '';
    if (error.response) {
      errorSummary = `❌ 请求失败: HTTP ${error.response.status}\n响应内容: ${JSON.stringify(error.response.data)}`;
      console.error(errorSummary);
    } else {
      errorSummary = `❌ 错误: ${error.message}`;
      console.error(errorSummary);
    }

    if (NOTIFY_ERRORS) {
      // 尝试通过企业微信推送错误信息
      try {
        await axios.post(WEBHOOK_URL, {
          msgtype: 'markdown',
          markdown: { content: `### ❌ 日报推送失败\n${errorSummary}` },
        }, {
          headers: { 'content-type': 'application/json' },
        });
      } catch (_) {
        // 推送错误信息也失败，忽略
      }
    }
    process.exit(1);
  }
})();
