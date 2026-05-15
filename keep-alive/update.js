const fs = require('fs');
const path = require('path');

/**
 * 保活脚本 - 将外部传入的数据保存到 data/yyyy-MM/data-dd.txt
 * 
 * 环境变量:
 *   KEEP_ALIVE_DATA   - 要保存的数据内容（可选，默认为时间戳）
 *   KEEP_ALIVE_SOURCE - 数据来源标识（可选，默认 keep-alive）
 */

/**
 * 追加一条 JSONL 记录到数据文件
 * @param {object} options
 * @param {string} options.source - 数据来源标识
 * @param {string} options.content - 数据内容
 * @param {string} options.baseDir - 项目根目录（用于定位 data/ 目录）
 * @param {Date} [options.now] - 可选的时间戳（便于测试注入）
 */
function appendRecord({ source, content, baseDir, now: customNow }) {
  const now = customNow || new Date();

  // 使用北京时间 (UTC+8) 确定日期
  const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
  const beijing = new Date(beijingMs);

  const year = beijing.getUTCFullYear();
  const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
  const day = String(beijing.getUTCDate()).padStart(2, '0');

  const dataDir = path.join(baseDir, 'data', `${year}-${month}`);
  const filePath = path.join(dataDir, `data-${day}.txt`);

  fs.mkdirSync(dataDir, { recursive: true });

  const time = `${String(beijing.getUTCHours()).padStart(2, '0')}:${String(beijing.getUTCMinutes()).padStart(2, '0')}:${String(beijing.getUTCSeconds()).padStart(2, '0')}`;

  // 将多行内容压缩为单行（换行符替换为 \\n）
  const text = content.replace(/\n/g, '\\n');

  // JSONL 格式：每条记录一行 JSON
  const entry = JSON.stringify({ source, time, text }) + '\n';

  fs.appendFileSync(filePath, entry, 'utf-8');

  return { filePath, source, time };
}

module.exports = { appendRecord };

// 直接运行时（非 require 引入），从环境变量读取参数并执行
if (require.main === module) {
  const source = process.env.KEEP_ALIVE_SOURCE || 'keep-alive';
  const content = process.env.KEEP_ALIVE_DATA || `🔄 Auto keep-alive tick at ${new Date().toISOString()}`;
  const baseDir = path.join(__dirname, '..');

  const result = appendRecord({ source, content, baseDir });
  console.log(`📝 [${result.source}] 数据已保存到 ${result.filePath}`);
}
