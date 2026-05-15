const fs = require('fs');
const path = require('path');
const os = require('os');
const { appendRecord, readRecords, parseStructuredData, detectFormat } = require('../update');

describe('appendRecord', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('写入结构化 JSON：生成独立的 JSON 文件', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const result = appendRecord({
      source: 'GLaDOS',
      structured: {
        title: 'GLaDOS',
        content: '🚀 签到结果',
        items: [{
          header: '账号 1',
          texts: ['邮箱: xx@xx.com', '签到: 成功']
        }]
      },
      baseDir: tmpDir,
      now,
    });

    // 验证文件路径
    expect(result.filePath).toMatch(/data[/\\]GLaDOS[/\\]2026-05-15\.json/);
    expect(result.source).toBe('GLaDOS');
    expect(result.time).toBe('16:30:00'); // UTC+8

    // 验证文件内容
    const content = JSON.parse(fs.readFileSync(result.filePath, 'utf8'));
    expect(content.title).toBe('GLaDOS');
    expect(content.content).toBe('🚀 签到结果');
    expect(content.items).toHaveLength(1);
    expect(content.items[0].header).toBe('账号 1');
    expect(content.updatedAt).toBe('16:30:00');
  });

  test('写入纯文本：从文本中解析结构化数据', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const content = `🚀 GLaDOS 签到结果
📋账号 1:
邮箱: xx@xx.com
签到: 成功`;
    const result = appendRecord({
      source: 'GLaDOS',
      content,
      baseDir: tmpDir,
      now,
    });

    const saved = JSON.parse(fs.readFileSync(result.filePath, 'utf8'));
    expect(saved.title).toBe('GLaDOS');
    expect(saved.content).toBe('🚀 GLaDOS 签到结果');
    expect(saved.items).toBeDefined();
  });

  test('覆盖写入：同一天多次写入会覆盖', () => {
    const now1 = new Date('2026-05-15T08:30:00Z');
    const now2 = new Date('2026-05-15T09:00:00Z');

    appendRecord({
      source: 'GLaDOS',
      structured: { title: 'GLaDOS', content: '第一次', items: [] },
      baseDir: tmpDir,
      now: now1
    });
    appendRecord({
      source: 'GLaDOS',
      structured: { title: 'GLaDOS', content: '第二次', items: [] },
      baseDir: tmpDir,
      now: now2
    });

    const content = JSON.parse(fs.readFileSync(path.join(tmpDir, 'data', 'GLaDOS', '2026-05-15.json'), 'utf8'));
    expect(content.content).toBe('第二次');
  });

  test('不同 source 分别保存：每个 source 有独立文件', () => {
    const now = new Date('2026-05-15T08:30:00Z');

    appendRecord({
      source: 'GLaDOS',
      structured: { title: 'GLaDOS', content: '签到', items: [] },
      baseDir: tmpDir,
      now
    });
    appendRecord({
      source: 'Whois',
      structured: { title: 'Whois', content: '监控', items: [] },
      baseDir: tmpDir,
      now
    });

    expect(fs.existsSync(path.join(tmpDir, 'data', 'GLaDOS', '2026-05-15.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'data', 'Whois', '2026-05-15.json'))).toBe(true);
  });

  test('目录自动创建：目标目录不存在时自动创建', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const result = appendRecord({
      source: 'test',
      structured: { title: 'test', content: 'hello', items: [] },
      baseDir: tmpDir,
      now,
    });

    expect(fs.existsSync(path.dirname(result.filePath))).toBe(true);
  });

  test('无数据时创建空记录', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const result = appendRecord({
      source: 'empty',
      baseDir: tmpDir,
      now,
    });

    const content = JSON.parse(fs.readFileSync(result.filePath, 'utf8'));
    expect(content.title).toBe('empty');
    expect(content.content).toBe('');
    expect(content.items).toEqual([]);
  });
});

describe('readRecords', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('读取当天的所有数据', () => {
    const now = new Date('2026-05-15T08:30:00Z');

    appendRecord({
      source: 'GLaDOS',
      structured: { title: 'GLaDOS', content: '签到', items: [] },
      baseDir: tmpDir,
      now
    });
    appendRecord({
      source: 'Whois',
      structured: { title: 'Whois', content: '监控', items: [] },
      baseDir: tmpDir,
      now
    });

    const records = readRecords({ baseDir: tmpDir, date: '2026-05-15' });
    expect(records).toHaveLength(2);
    expect(records.map(r => r.source).sort()).toEqual(['GLaDOS', 'Whois']);
  });

  test('读取不存在日期返回空数组', () => {
    const records = readRecords({ baseDir: tmpDir, date: '2026-01-01' });
    expect(records).toEqual([]);
  });
});

describe('parseStructuredData', () => {
  test('从标记中提取 JSON', () => {
    const output = `🚀 GLaDOS 签到结果
__KEEP_ALIVE_JSON__
{"title":"GLaDOS","content":"签到","items":[]}
__KEEP_ALIVE_JSON_END__`;

    const result = parseStructuredData(output);
    expect(result).not.toBeNull();
    expect(result.title).toBe('GLaDOS');
    expect(result.content).toBe('签到');
  });

  test('无效 JSON 返回 null', () => {
    const output = `text
__KEEP_ALIVE_JSON__
invalid json
__KEEP_ALIVE_JSON_END__`;

    const result = parseStructuredData(output);
    expect(result).toBeNull();
  });

  test('空输入返回 null', () => {
    expect(parseStructuredData('')).toBeNull();
    expect(parseStructuredData(null)).toBeNull();
  });
});

describe('detectFormat', () => {
  test('识别结构化 JSON', () => {
    expect(detectFormat('__KEEP_ALIVE_JSON__\n{}')).toBe('structured');
  });

  test('识别 JSONL', () => {
    expect(detectFormat('{"source":"test","time":"12:00","text":"hello"}\n')).toBe('jsonl');
  });

  test('未知格式', () => {
    expect(detectFormat('plain text')).toBe('unknown');
    expect(detectFormat('')).toBe('unknown');
  });
});
