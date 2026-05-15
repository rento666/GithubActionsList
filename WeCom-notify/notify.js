const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 从环境变量中读取配置
const WECOM_KEY = process.env.WECOM_KEY;
const NOTIFY_ERRORS = process.env.WECOM_NOTIFY_ERRORS === 'true';

const WEBHOOK_URL = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${WECOM_KEY}`;

/**
 * 解析 JSONL 数据文件，每行一条 JSON 记录
 * 兼容旧格式（多行文本块 + ── 分隔符）
 */
function parseDataFile(fileContent) {
  const lines = fileContent.split('\n').filter(l => l.trim());
  const records = [];

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      // JSONL 格式：{ source, time, text }
      records.push({
        source: obj.source || 'unknown',
        time: obj.time || '',
        text: (obj.text || '').replace(/\\n/g, '\n'),
      });
    } catch {
      // 兼容旧格式：[时间戳] [来源] 开头的行标记新记录
      // 暂不处理旧格式，跳过非 JSON 行
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
 * 根据解析出的记录构建文本通知模板卡片
 * @param {Array} records - parseDataFile 返回的记录数组
 * @param {string} dateStr - 日期字符串，如 "2026-05-15"
 * @returns {object} template_card 对象
 */
function buildTemplateCard(records, dateStr) {
  // 构建 horizontal_content_list（最多 6 项）
  const horizontalContentList = records.slice(0, 6).map(r => ({
    keyname: truncate(r.source, 5),
    value: truncate(r.text.replace(/\n/g, ' '), 26),
  }));

  // 构建引用文本（前 3 条记录的详细内容）
  const quoteLines = records.slice(0, 3).map(r => {
    const label = r.time ? `[${r.source} ${r.time}]` : `[${r.source}]`;
    return `${label} ${r.text.replace(/\n/g, ' ')}`;
  });
  const quoteText = truncate(quoteLines.join('\n'), 150);

  // 构建二级普通文本（汇总信息）
  const sources = [...new Set(records.map(r => r.source))];
  const subTitleText = `共 ${records.length} 条记录，来源：${sources.join('、')}`;

  // 构建模板卡片
  const templateCard = {
    card_type: 'text_notice',
    source: {
      desc: 'GithubActionsList',
      desc_color: 0,
    },
    main_title: {
      title: `📋 日报 ${dateStr}`,
      desc: 'GithubActionsList 每日数据汇总',
    },
    emphasis_content: {
      title: String(records.length),
      desc: '今日条目数',
    },
    sub_title_text: truncate(subTitleText, 112),
    horizontal_content_list: horizontalContentList,
  };

  // 引用文本区域（有内容才添加）
  if (quoteText) {
    templateCard.quote_area = {
      type: 0,
      title: '内容预览',
      quote_text: quoteText,
    };
  }

  return templateCard;
}

module.exports = { parseDataFile, truncate, buildTemplateCard };

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

      // 解析 JSONL 数据
      const records = parseDataFile(fileContent);
      if (records.length === 0) {
        console.log('⚠️ 未解析到有效记录，跳过推送');
        return;
      }

      console.log(`📊 共 ${records.length} 条记录`);

      const dateStr = `${year}-${month}-${day}`;
      const templateCard = buildTemplateCard(records, dateStr);

      console.log('📤 正在推送企业微信机器人...');
      const res = await axios.post(WEBHOOK_URL, {
        msgtype: 'template_card',
        template_card: templateCard,
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
        // 尝试通过企业微信推送错误信息（文本通知模板卡片）
        try {
          await axios.post(WEBHOOK_URL, {
            msgtype: 'template_card',
            template_card: {
              card_type: 'text_notice',
              source: {
                desc: 'GithubActionsList',
                desc_color: 2,
              },
              main_title: {
                title: '❌ 日报推送失败',
                desc: '请检查日志排查原因',
              },
              emphasis_content: {
                title: 'ERROR',
                desc: '推送异常',
              },
              quote_area: {
                type: 0,
                title: '错误信息',
                quote_text: truncate(errorSummary, 150),
              },
            },
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
}
