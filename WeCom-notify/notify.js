const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { textsToLists } = require('../utils/structured-output');

/**
 * 企业微信推送模块
 * 支持结构化 JSON 数据和旧 JSONL 格式
 */

// 从环境变量中读取配置
const WECOM_KEY = process.env.WECOM_KEY;
const NOTIFY_ERRORS = process.env.WECOM_NOTIFY_ERRORS === 'true';

const WEBHOOK_URL = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${WECOM_KEY}`;

/**
 * 读取当天所有数据文件
 * @param {string} dataDir - data 目录路径
 * @param {string} dateStr - 日期字符串，如 "2026-05-15"
 * @returns {Array} 数据记录数组
 */
function readDataFiles(dataDir, dateStr) {
  const records = [];

  if (!fs.existsSync(dataDir)) {
    return records;
  }

  // 遍历 data 目录下的所有 source 子目录
  const sources = fs.readdirSync(dataDir);
  for (const source of sources) {
    const sourceDir = path.join(dataDir, source);
    if (!fs.statSync(sourceDir).isDirectory()) continue;

    const jsonFile = path.join(sourceDir, `${dateStr}.json`);
    if (fs.existsSync(jsonFile)) {
      try {
        const content = fs.readFileSync(jsonFile, 'utf-8');
        const data = JSON.parse(content);
        records.push({
          source,
          data
        });
      } catch (e) {
        // JSON 解析失败，尝试读取旧 JSONL 格式
        const jsonlFile = path.join(sourceDir, `data-${dateStr.split('-')[2]}.txt`);
        if (fs.existsSync(jsonlFile)) {
          const jsonlRecords = parseJSONLFile(jsonlFile);
          for (const rec of jsonlRecords) {
            records.push({
              source: rec.source,
              data: {
                title: rec.source,
                description: rec.time,
                content: rec.text.split('\\n')[0] || rec.text,
                items: [{
                  header: rec.source,
                  texts: rec.text.split('\\n').slice(1)
                }]
              }
            });
          }
        }
      }
    }
  }

  return records;
}

/**
 * 解析 JSONL 文件（向后兼容旧格式）
 */
function parseJSONLFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  const records = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      records.push({
        source: obj.source || 'unknown',
        time: obj.time || '',
        text: (obj.text || '').replace(/\\n/g, '\n')
      });
    } catch (e) {
      // 忽略无效行
    }
  }

  return records;
}

/**
 * 截断文本，超长加省略号
 */
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
}

/**
 * 根据结构化数据构建 markdown_v2 内容
 * @param {Array} records - 数据记录数组 [{source, data}]
 * @param {string} dateStr - 日期字符串
 * @returns {string} markdown_v2 内容
 */
function buildMarkdownV2(records, dateStr) {
  if (records.length === 0) {
    return `# 📋 日报 ${dateStr}\n\n暂无数据`;
  }

  const lines = [`# 📋 日报 ${dateStr}`];

  for (const record of records) {
    const { data } = record;
    const title = data.title || record.source;
    const desc = data.description || '';

    lines.push('');
    lines.push(`## ${title}${desc ? ` \`${desc}\`` : ''}`);

    if (data.content) {
      lines.push(`> ${data.content}`);
    }

    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        lines.push('');
        if (item.header) {
          lines.push(`**${item.header}**`);
          lines.push('');
        }
        const entries = item.lists || (item.texts ? textsToLists(item.texts) : []);
        if (entries.length > 0) {
          lines.push('| 项目 | 状态 |');
          lines.push('');
          lines.push('| :--- | :--- |');
          lines.push('');
          for (const entry of entries) {
            lines.push(`| ${entry.key} | ${entry.value} |`);
            lines.push('');
          }
        }
      }
    }
  }

  lines.push('');
  lines.push('---');
  lines.push(`[查看项目 | GitHub](https://github.com/rento666/GithubActionsList)`);

  return lines.join('\n');
}

/**
 * 推送企业微信 markdown_v2 通知
 * @param {string} markdownContent - markdown_v2 内容
 */
async function sendWeComNotification(markdownContent) {
  const res = await axios.post(WEBHOOK_URL, {
    msgtype: 'markdown_v2',
    markdown_v2: {
      content: markdownContent,
    },
  }, {
    headers: { 'content-type': 'application/json' },
  });

  if (res.data?.errcode !== 0) {
    throw new Error(`企业微信返回错误: ${res.data?.errmsg || JSON.stringify(res.data)}`);
  }
}

/**
 * 推送错误通知
 * @param {string} errorSummary - 错误信息
 */
async function sendErrorNotification(errorSummary) {
  try {
    const markdownContent = `# ❌ 日报推送失败\n\n请检查日志排查原因\n\n## 错误信息\n\n\`\`\`\n${truncate(errorSummary, 500)}\n\`\`\`\n\n---\n\n[查看项目](https://github.com/rento666/GithubActionsList)`;
    await axios.post(WEBHOOK_URL, {
      msgtype: 'markdown_v2',
      markdown_v2: {
        content: markdownContent,
      },
    }, {
      headers: { 'content-type': 'application/json' },
    });
  } catch (_) {
    // 推送错误信息也失败，忽略
  }
}

module.exports = {
  readDataFiles,
  parseJSONLFile,
  truncate,
  buildMarkdownV2,
  sendWeComNotification,
  sendErrorNotification
};

// 直接运行时（非 require 引入），执行推送逻辑
if (require.main === module) {
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
      const dateStr = `${year}-${month}-${day}`;

      const dataDir = path.join(__dirname, '..', 'data');

      // 读取当天所有数据文件
      const records = readDataFiles(dataDir, dateStr);

      if (records.length === 0) {
        console.log('⚠️ 当天没有数据文件，跳过推送');
        return;
      }

      console.log(`📊 共 ${records.length} 条数据记录`);

      const markdownContent = buildMarkdownV2(records, dateStr);

      console.log('📤 正在推送企业微信机器人...');
      await sendWeComNotification(markdownContent);
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
        await sendErrorNotification(errorSummary);
      }
      process.exit(1);
    }
  })();
}
