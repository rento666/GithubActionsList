const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
 * 根据结构化数据构建企业微信文本通知模板卡片
 * @param {Array} records - 数据记录数组 [{source, data}]
 * @param {string} dateStr - 日期字符串
 * @returns {object} template_card 对象
 */
function buildTemplateCard(records, dateStr) {
  if (records.length === 0) {
    return {
      card_type: 'text_notice',
      source: {
        desc: 'GithubActionsList',
        desc_color: 0,
      },
      main_title: {
        title: `📋 日报 ${dateStr}`,
        desc: '暂无数据',
      },
      card_action: {
        type: 1,
        url: 'https://github.com',
      }
    };
  }

  // 构建二级标题+文本列表
  const horizontalContentList = [];

  for (const record of records.slice(0, 6)) {
    const { source, data } = record;

    // 添加主标题行
    if (data.content) {
      horizontalContentList.push({
        keyname: truncate(data.title || source, 5),
        value: truncate(data.content, 26)
      });
    }

    // 添加各条目的简要信息
    if (data.items && data.items.length > 0) {
      for (const item of data.items.slice(0, 2)) {
        const firstText = item.texts && item.texts[0] ? item.texts[0] : item.header;
        horizontalContentList.push({
          keyname: truncate(item.header || source, 5),
          value: truncate(firstText, 26)
        });
      }
    }
  }

  // 构建引用文本区域（详细预览）
  const quoteLines = [];
  for (const record of records.slice(0, 3)) {
    const { data } = record;
    const title = data.title || record.source;
    const time = data.description || '';
    const content = data.content || '';

    let line = `[${title}]`;
    if (time) line += ` ${time}`;
    if (content) line += ` ${content}`;

    quoteLines.push(line);
  }
  const quoteText = truncate(quoteLines.join('\n'), 150);

  // 构建二级普通文本
  const sourceCount = records.length;
  const totalItems = records.reduce((sum, r) => sum + (r.data.items?.length || 0), 0);
  const subTitleText = `共 ${sourceCount} 个数据源，${totalItems} 条记录`;

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
      title: String(sourceCount),
      desc: '数据源数',
    },
    sub_title_text: truncate(subTitleText, 112),
    horizontal_content_list: horizontalContentList.slice(0, 6),
    card_action: {
      type: 1,
      url: 'https://github.com',
    }
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

/**
 * 推送企业微信通知
 * @param {object} templateCard - 模板卡片对象
 */
async function sendWeComNotification(templateCard) {
  const res = await axios.post(WEBHOOK_URL, {
    msgtype: 'template_card',
    template_card: templateCard,
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
        card_action: {
          type: 1,
          url: 'https://github.com',
        }
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
  buildTemplateCard,
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

      const templateCard = buildTemplateCard(records, dateStr);

      console.log('📤 正在推送企业微信机器人...');
      await sendWeComNotification(templateCard);
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
