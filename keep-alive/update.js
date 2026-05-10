const fs = require('fs');
const path = require('path');

/**
 * 保活脚本 - 将外部传入的数据保存到 data/yyyy-MM/data-dd.txt
 * 
 * 环境变量:
 *   KEEP_ALIVE_DATA   - 要保存的数据内容（可选，默认为时间戳）
 *   KEEP_ALIVE_SOURCE - 数据来源标识（可选，默认 keep-alive）
 */

// 从环境变量读取内容和来源
const content = process.env.KEEP_ALIVE_DATA || `🔄 Auto keep-alive tick at ${new Date().toISOString()}`;
const source = process.env.KEEP_ALIVE_SOURCE || 'keep-alive';

// 使用北京时间 (UTC+8) 确定日期
const now = new Date();
const beijingMs = now.getTime() + 8 * 60 * 60 * 1000;
const beijing = new Date(beijingMs);

const year = beijing.getUTCFullYear();
const month = String(beijing.getUTCMonth() + 1).padStart(2, '0');
const day = String(beijing.getUTCDate()).padStart(2, '0');

// 数据目录：项目根目录下的 data/
const dataDir = path.join(__dirname, '..', 'data', `${year}-${month}`);
const filePath = path.join(dataDir, `data-${day}.txt`);

fs.mkdirSync(dataDir, { recursive: true });

const timestamp = `${year}-${month}-${day} ${String(beijing.getUTCHours()).padStart(2, '0')}:${String(beijing.getUTCMinutes()).padStart(2, '0')}:${String(beijing.getUTCSeconds()).padStart(2, '0')}`;

const entry = `[${timestamp}] [${source}]\n${content}\n${'─'.repeat(50)}\n`;

fs.appendFileSync(filePath, entry, 'utf-8');
console.log(`📝 [${source}] 数据已保存到 ${filePath}`);
