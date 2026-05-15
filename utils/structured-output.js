/**
 * 结构化输出工具模块
 * 提供统一的结构化数据构建方法，供各脚本复用
 */

/**
 * 构建单个键值对条目
 * @param {string} key - 键名
 * @param {string} value - 值
 * @returns {{key: string, value: string}}
 */
function kv(key, value) {
  return { key, value: String(value ?? '') };
}

/**
 * 构建 item 的 lists 数组
 * @param {Array<{key: string, value: string}>} entries - 键值对数组
 * @returns {Array<{key: string, value: string}>}
 */
function buildLists(entries) {
  return entries.map(e => kv(e.key, e.value));
}

/**
 * 构建完整的结构化输出对象
 * @param {object} options
 * @param {string} options.title - 标题
 * @param {string} options.content - 内容摘要
 * @param {Array<{header: string, lists: Array<{key: string, value: string}>}>} options.items - 条目数组
 * @param {string} [options.description] - 描述/时间戳
 * @returns {object} 结构化数据对象
 */
function buildStructuredOutput({ title, content, items, description }) {
  return {
    title,
    content,
    items: items.map(item => ({
      header: item.header,
      lists: buildLists(item.lists)
    })),
    description: description || ''
  };
}

/**
 * 将 "key: value" 格式的字符串解析为键值对
 * @param {string} line - 格式为 "key: value" 的字符串
 * @returns {{key: string, value: string}|null}
 */
function parseKeyValueLine(line) {
  if (!line || typeof line !== 'string') return null;
  const match = line.match(/^([^:]+)[:：]\s*(.*)$/);
  if (!match) return null;
  return { key: match[1].trim(), value: match[2].trim() };
}

/**
 * 将 texts 数组（字符串数组）转换为 lists 数组（键值对数组）
 * @param {string[]} texts - 字符串数组，每项格式为 "key: value"
 * @returns {Array<{key: string, value: string}>}
 */
function textsToLists(texts) {
  if (!Array.isArray(texts)) return [];
  return texts
    .map(line => parseKeyValueLine(line))
    .filter(Boolean);
}

/**
 * 将 lists 数组转换为 texts 数组（向后兼容）
 * @param {Array<{key: string, value: string}>} lists - 键值对数组
 * @returns {string[]}
 */
function listsToTexts(lists) {
  if (!Array.isArray(lists)) return [];
  return lists.map(item => `${item.key}: ${item.value}`);
}

module.exports = {
  kv,
  buildLists,
  buildStructuredOutput,
  parseKeyValueLine,
  textsToLists,
  listsToTexts
};
