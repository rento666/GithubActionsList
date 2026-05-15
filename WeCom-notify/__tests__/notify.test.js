const fs = require('fs');
const path = require('path');
const os = require('os');
const { readDataFiles, truncate, buildTemplateCard } = require('../notify');

describe('readDataFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notify-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('读取结构化 JSON 文件', () => {
    // 创建测试数据（readDataFiles 期望传入 data 目录）
    const dataDir = path.join(tmpDir, 'GLaDOS');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, '2026-05-15.json'), JSON.stringify({
      title: 'GLaDOS',
      description: '16:30:00',
      content: '🚀 签到结果',
      items: [{ header: '账号 1', texts: ['邮箱: xx@xx.com'] }]
    }));

    const records = readDataFiles(tmpDir, '2026-05-15');
    expect(records).toHaveLength(1);
    expect(records[0].source).toBe('GLaDOS');
    expect(records[0].data.title).toBe('GLaDOS');
    expect(records[0].data.content).toBe('🚀 签到结果');
  });

  test('读取多个 source 的数据', () => {
    // GLaDOS 数据
    const gladosDir = path.join(tmpDir, 'GLaDOS');
    fs.mkdirSync(gladosDir, { recursive: true });
    fs.writeFileSync(path.join(gladosDir, '2026-05-15.json'), JSON.stringify({
      title: 'GLaDOS',
      content: '签到',
      items: []
    }));

    // Whois 数据
    const whoisDir = path.join(tmpDir, 'Whois');
    fs.mkdirSync(whoisDir, { recursive: true });
    fs.writeFileSync(path.join(whoisDir, '2026-05-15.json'), JSON.stringify({
      title: 'Whois',
      content: '监控',
      items: []
    }));

    const records = readDataFiles(tmpDir, '2026-05-15');
    expect(records).toHaveLength(2);
  });

  test('目录不存在返回空数组', () => {
    const records = readDataFiles(tmpDir, '2026-05-15');
    expect(records).toEqual([]);
  });

  test('无效 JSON 尝试读取旧 JSONL 格式', () => {
    const dataDir = path.join(tmpDir, 'GLaDOS');
    fs.mkdirSync(dataDir, { recursive: true });

    // 创建无效的 JSON 文件
    fs.writeFileSync(path.join(dataDir, '2026-05-15.json'), 'invalid json');

    // 创建旧 JSONL 文件
    fs.writeFileSync(path.join(dataDir, 'data-15.txt'), JSON.stringify({
      source: 'GLaDOS',
      time: '16:30:00',
      text: '签到成功'
    }) + '\n');

    const records = readDataFiles(tmpDir, '2026-05-15');
    expect(records.length).toBeGreaterThan(0);
    expect(records[0].source).toBe('GLaDOS');
    expect(records[0].data.content).toBe('签到成功');
  });
});

describe('truncate', () => {
  test('短文本不变', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  test('超长截断加省略号', () => {
    const long = 'a'.repeat(30);
    expect(truncate(long, 26)).toBe('a'.repeat(26) + '…');
  });

  test('刚好不截断', () => {
    expect(truncate('a'.repeat(26), 26)).toBe('a'.repeat(26));
  });

  test('空字符串', () => {
    expect(truncate('', 10)).toBe('');
  });

  test('null/undefined', () => {
    expect(truncate(null, 10)).toBe('');
    expect(truncate(undefined, 10)).toBe('');
  });
});

describe('buildTemplateCard', () => {
  test('基本卡片结构正确', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: {
          title: 'GLaDOS',
          description: '16:30:00',
          content: '🚀 签到结果',
          items: [{ header: '账号 1', texts: ['邮箱: xx@xx.com', '签到: 成功'] }]
        }
      }
    ];

    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.card_type).toBe('text_notice');
    expect(card.source.desc).toBe('GithubActionsList');
    expect(card.source.desc_color).toBe(0);
    expect(card.main_title.title).toBe('📋 日报 2026-05-15');
    expect(card.main_title.desc).toBe('GithubActionsList 每日数据汇总');
    expect(card.emphasis_content.title).toBe('1');
    expect(card.emphasis_content.desc).toBe('数据源数');
    expect(card.card_action).toBeDefined();
  });

  test('不含 jump_list', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: { title: 'GLaDOS', content: '签到', items: [] }
      }
    ];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card).not.toHaveProperty('jump_list');
  });

  test('horizontal_content_list 最多 6 项', () => {
    const records = [
      { source: 'test1', data: { title: 'test1', content: '内容1', items: [] } },
      { source: 'test2', data: { title: 'test2', content: '内容2', items: [] } },
      { source: 'test3', data: { title: 'test3', content: '内容3', items: [] } },
      { source: 'test4', data: { title: 'test4', content: '内容4', items: [] } },
      { source: 'test5', data: { title: 'test5', content: '内容5', items: [] } },
      { source: 'test6', data: { title: 'test6', content: '内容6', items: [] } },
      { source: 'test7', data: { title: 'test7', content: '内容7', items: [] } },
    ];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.horizontal_content_list).toHaveLength(6);
  });

  test('horizontal_content_list 的 keyname 截断', () => {
    const records = [
      {
        source: 'VeryLongSource',
        data: { title: 'VeryLongSource', content: 'ok', items: [] }
      }
    ];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.horizontal_content_list[0].keyname.length).toBeLessThanOrEqual(6); // 5字 + 可能的…
  });

  test('horizontal_content_list 的 value 截断', () => {
    const records = [
      {
        source: 'test',
        data: { title: 'test', content: 'a'.repeat(50), items: [] }
      }
    ];
    const card = buildTemplateCard(records, '2026-05-15');

    const value = card.horizontal_content_list[0].value;
    expect(value.length).toBeLessThanOrEqual(27); // 26 + …
  });

  test('quote_area 包含内容预览', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: { title: 'GLaDOS', description: '16:30:00', content: '签到结果', items: [] }
      }
    ];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.quote_area).toBeDefined();
    expect(card.quote_area.type).toBe(0);
    expect(card.quote_area.title).toBe('内容预览');
    expect(card.quote_area.quote_text).toContain('GLaDOS');
  });

  test('sub_title_text 包含来源汇总', () => {
    const records = [
      { source: 'GLaDOS', data: { title: 'GLaDOS', content: '签到', items: [{ header: 'a', texts: ['x', 'y'] }] } },
      { source: 'Whois', data: { title: 'Whois', content: '监控', items: [{ header: 'b', texts: ['z'] }] } },
    ];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.sub_title_text).toContain('2 个数据源');
    expect(card.sub_title_text).toContain('2 条记录');
  });

  test('空数据也能正常构建', () => {
    const card = buildTemplateCard([], '2026-05-15');

    expect(card.main_title.title).toContain('日报');
    expect(card.main_title.desc).toBe('暂无数据');
  });
});
