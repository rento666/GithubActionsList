/**
 * 数据格式化模块
 * 提供结构化 JSON 和 JSONL 格式的转换函数
 */

/**
 * 将脚本输出解析为结构化数据
 * 支持从 __KEEP_ALIVE_JSON__ 标记中提取 JSON
 * @param {string} output - 脚本的完整输出
 * @returns {object|null} 解析后的结构化数据，失败返回 null
 */
function parseStructuredData(output) {
  if (!output || typeof output !== 'string') {
    return null;
  }

  // 尝试从标记中提取 JSON
  const jsonMatch = output.match(/__KEEP_ALIVE_JSON__\s*([\s\S]*?)\s*__KEEP_ALIVE_JSON_END__/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const data = JSON.parse(jsonMatch[1].trim());
      if (data && typeof data === 'object') {
        return data;
      }
    } catch (e) {
      // JSON 解析失败，尝试其他方式
    }
  }

  return null;
}

/**
 * 解析纯文本为简单的结构化数据
 * @param {string} text - 纯文本内容
 * @param {string} source - 来源标识
 * @param {string} time - 时间戳
 * @returns {object} 结构化数据
 */
function parseTextAsStructured(text, source, time) {
  if (!text || typeof text !== 'string') {
    return {
      title: source,
      description: time,
      content: '',
      items: []
    };
  }

  // 按换行符分割内容
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length === 0) {
    return {
      title: source,
      description: time,
      content: '',
      items: []
    };
  }

  // 第一行作为 content
  const content = lines[0];

  // 尝试解析后续行作为 items
  // 常见的账号/条目模式检测
  const items = [];
  let currentItem = null;
  let currentTexts = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // 检测新的条目开始（如 "📋账号 1:"、"域名: example.com"）
    const headerMatch = line.match(/^([^\n:：]+)[:：]\s*(.*)$/);
    const isNewItem = /^[📋🔍🌐✅⚠️❌]/.test(line) || /^[一二三四五六七八九十]+[.、]/.test(line);

    if (isNewItem && headerMatch) {
      // 保存之前的条目
      if (currentTexts.length > 0) {
        if (currentItem) {
          items.push({
            header: currentItem,
            texts: currentTexts
          });
        }
        currentTexts = [];
      }
      // 开始新条目
      currentItem = headerMatch[1].trim();
      const value = headerMatch[2].trim();
      if (value) {
        currentTexts.push(value);
      }
    } else if (line.trim()) {
      currentTexts.push(line.trim());
    }
  }

  // 保存最后一个条目
  if (currentTexts.length > 0) {
    items.push({
      header: currentItem || source,
      texts: currentTexts
    });
  }

  return {
    title: source,
    description: time,
    content: content,
    items: items
  };
}

/**
 * 格式化数据为结构化 JSON 字符串
 * @param {object} data - 结构化数据
 * @returns {string} JSON 字符串
 */
function formatAsJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * 格式化数据为 JSONL 行
 * @param {string} source - 来源标识
 * @param {string} time - 时间戳
 * @param {string} text - 原始文本内容
 * @returns {string} JSONL 行
 */
function formatAsJSONL(source, time, text) {
  // 将多行内容压缩为单行（换行符替换为 \\n）
  const compressed = text.replace(/\n/g, '\\n');
  return JSON.stringify({ source, time, text: compressed }) + '\n';
}

/**
 * 从 JSONL 行解析出原始文本
 * @param {string} jsonlLine - JSONL 行
 * @returns {object|null} 解析后的对象，失败返回 null
 */
function parseJSONLLine(jsonlLine) {
  try {
    const obj = JSON.parse(jsonlLine);
    return {
      source: obj.source || 'unknown',
      time: obj.time || '',
      text: (obj.text || '').replace(/\\n/g, '\n')
    };
  } catch (e) {
    return null;
  }
}

/**
 * 识别数据格式类型
 * @param {string} content - 文件内容或输出内容
 * @returns {'structured'|'jsonl'|'unknown'} 格式类型
 */
function detectFormat(content) {
  if (!content || typeof content !== 'string') {
    return 'unknown';
  }

  // 检查是否包含结构化 JSON 标记
  if (content.includes('__KEEP_ALIVE_JSON__')) {
    return 'structured';
  }

  // 检查是否为 JSONL 格式（每行是独立的 JSON 对象）
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    try {
      JSON.parse(lines[0]);
      return 'jsonl';
    } catch (e) {
      // 不是 JSON 格式
    }
  }

  return 'unknown';
}

module.exports = {
  parseStructuredData,
  parseTextAsStructured,
  formatAsJSON,
  formatAsJSONL,
  parseJSONLLine,
  detectFormat
};
