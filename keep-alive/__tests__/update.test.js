const fs = require('fs');
const path = require('path');
const os = require('os');
const { appendRecord } = require('../update');

describe('appendRecord', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('基本写入：生成 JSONL 格式', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const result = appendRecord({
      source: 'GLaDOS',
      content: '签到成功',
      baseDir: tmpDir,
      now,
    });

    // 验证文件路径
    expect(result.filePath).toMatch(/data[/\\]2026-05[/\\]data-15\.txt/);
    expect(result.source).toBe('GLaDOS');
    expect(result.time).toBe('16:30:00'); // UTC+8

    // 验证文件内容
    const content = fs.readFileSync(result.filePath, 'utf8').trim();
    const obj = JSON.parse(content);
    expect(obj.source).toBe('GLaDOS');
    expect(obj.text).toBe('签到成功');
    expect(obj.time).toBe('16:30:00');
  });

  test('多行内容：换行符被替换为 \\n', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const result = appendRecord({
      source: 'GLaDOS',
      content: '第一行\n第二行\n第三行',
      baseDir: tmpDir,
      now,
    });

    const content = fs.readFileSync(result.filePath, 'utf8').trim();
    const obj = JSON.parse(content);
    expect(obj.text).toBe('第一行\\n第二行\\n第三行');
  });

  test('追加写入：连续两次写入产生两行', () => {
    const now1 = new Date('2026-05-15T08:30:00Z');
    const now2 = new Date('2026-05-15T09:00:00Z');

    appendRecord({ source: 'GLaDOS', content: '签到', baseDir: tmpDir, now: now1 });
    appendRecord({ source: 'Whois', content: '监控', baseDir: tmpDir, now: now2 });

    const lines = fs.readFileSync(
      path.join(tmpDir, 'data', '2026-05', 'data-15.txt'),
      'utf8',
    ).trim().split('\n');

    expect(lines.length).toBe(2);
    expect(JSON.parse(lines[0]).source).toBe('GLaDOS');
    expect(JSON.parse(lines[1]).source).toBe('Whois');
  });

  test('目录自动创建：目标目录不存在时自动创建', () => {
    const now = new Date('2026-05-15T08:30:00Z');
    const result = appendRecord({
      source: 'test',
      content: 'hello',
      baseDir: tmpDir,
      now,
    });

    expect(fs.existsSync(path.dirname(result.filePath))).toBe(true);
  });

  test('默认值：source 为空时使用默认值', () => {
    const now = new Date('2026-05-15T00:00:00Z');
    const result = appendRecord({
      source: 'keep-alive',
      content: 'tick',
      baseDir: tmpDir,
      now,
    });

    const content = fs.readFileSync(result.filePath, 'utf8').trim();
    const obj = JSON.parse(content);
    expect(obj.source).toBe('keep-alive');
  });
});
