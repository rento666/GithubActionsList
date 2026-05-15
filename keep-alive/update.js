const fs = require('fs');
const path = require('path');
const { parseStructuredData, parseTextAsStructured, formatAsJSON, formatAsJSONL, detectFormat, textsToLists } = require('./formatter');

/**
 * 保活脚本 - 将数据保存到 data/{source}/{YYYY-MM-DD}.json
 *
 * 环境变量:
 *   KEEP_ALIVE_SOURCE - 数据来源标识（可选，默认 keep-alive）
 *   KEEP_ALIVE_DATA   - 原始输出内容（可选）
 *   KEEP_ALIVE_JSON   - 结构化 JSON 数据（可选，优先使用）
 */

/**
 * 追加一条记录到数据文件
 * @param {object} options
 * @param {string} options.source - 数据来源标识
 * @param {string} [options.content] - 原始输出内容
 * @param {object} [options.structured] - 结构化数据
 * @param {string} options.baseDir - 项目根目录
 * @param {Date} [options.now] - 可选的时间戳（便于测试注入）
 */
function appendRecord({ source, content, structured, baseDir, now: customNow }) {
  const now = customNow || new Date();

  // 使用北京时间 (UTC+8) 确定日期
  const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
  const beijing = new Date(beijingMs);

  const year = beijing.getUTCFullYear();
  const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijing.getUTCDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const time = `${String(beijing.getUTCHours()).padStart(2, '0')}:${String(beijing.getUTCMinutes()).padStart(2, '0')}:${String(beijing.getUTCSeconds()).padStart(2, '0')}`;

  // 按 source 分类保存
  const dataDir = path.join(baseDir, 'data', source);
  const filePath = path.join(dataDir, `${dateStr}.json`);

  fs.mkdirSync(dataDir, { recursive: true });

  // 优先使用传入的结构化数据
  let record;
  if (structured && typeof structured === 'object') {
    // 转换 texts 为 lists（向后兼容）
    const items = (structured.items || []).map(item => {
      if (item.lists) {
        return item;
      }
      if (item.texts) {
        return {
          header: item.header,
          lists: textsToLists(item.texts)
        };
      }
      return item;
    });
    record = {
      ...structured,
      title: structured.title || source,
      description: structured.description || time,
      items,
      updatedAt: time
    };
  } else if (content) {
    // 尝试从 content 中解析结构化数据
    const parsed = parseStructuredData(content);
    if (parsed) {
      record = {
        ...parsed,
        updatedAt: time
      };
    } else {
      // 降级为纯文本解析
      record = parseTextAsStructured(content, source, time);
      record.updatedAt = time;
    }
  } else {
    // 无数据时创建空记录
    record = {
      title: source,
      description: time,
      content: '',
      items: [],
      updatedAt: time
    };
  }

  // 保存为 JSON 文件
  const jsonContent = formatAsJSON(record);
  fs.writeFileSync(filePath, jsonContent, 'utf-8');

  return { filePath, source, time };
}

/**
 * 读取当天的所有数据
 * @param {object} options
 * @param {string} options.baseDir - 项目根目录
 * @param {string} [options.date] - 日期字符串，格式 YYYY-MM-DD，默认为今天
 * @returns {object[]} 数据记录数组
 */
function readRecords({ baseDir, date: customDate }) {
  const now = customDate ? new Date(customDate) : new Date();
  const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
  const beijing = new Date(beijingMs);

  const year = beijing.getUTCFullYear();
  const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijing.getUTCDate()).padStart(2, '0');

  const dataDir = path.join(baseDir, 'data');
  const records = [];

  if (!fs.existsSync(dataDir)) {
    return records;
  }

  // 遍历 data 目录下的所有 source 子目录
  const sources = fs.readdirSync(dataDir);
  for (const source of sources) {
    const sourceDir = path.join(dataDir, source);
    if (!fs.statSync(sourceDir).isDirectory()) continue;

    const jsonFile = path.join(sourceDir, `${year}-${month}-${day}.json`);
    if (fs.existsSync(jsonFile)) {
      try {
        const content = fs.readFileSync(jsonFile, 'utf-8');
        const data = JSON.parse(content);
        records.push({
          source,
          data
        });
      } catch (e) {
        // 忽略解析错误
      }
    }
  }

  return records;
}

module.exports = { appendRecord, readRecords, parseStructuredData, detectFormat };

// 直接运行时（非 require 引入），从环境变量读取参数并执行
if (require.main === module) {
  const source = process.env.KEEP_ALIVE_SOURCE || 'keep-alive';
  const content = process.env.KEEP_ALIVE_DATA || null;
  const jsonData = process.env.KEEP_ALIVE_JSON || null;
  const baseDir = path.join(__dirname, '..');

  let structured = null;
  if (jsonData) {
    try {
      structured = JSON.parse(jsonData);
    } catch (e) {
      console.error('⚠️ KEEP_ALIVE_JSON 解析失败，将使用纯文本模式');
    }
  }

  const result = appendRecord({ source, content, structured, baseDir });
  console.log(`📝 [${result.source}] 数据已保存到 ${result.filePath}`);
}
