const fs = require('fs');
const path = require('path');
const os = require('os');
const { readDataFiles, truncate, buildMarkdownV2 } = require('../notify');

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
      items: [{ header: '账号 1', lists: [{ key: '邮箱', value: 'xx@xx.com' }] }]
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

describe('buildMarkdownV2', () => {
  test('基本 markdown 结构正确', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: {
          title: 'GLaDOS',
          description: '16:30:00',
          content: '🚀 签到结果',
          items: [{ header: '账号 1', lists: [{ key: '邮箱', value: 'xx@xx.com' }, { key: '签到', value: '成功' }] }]
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('# 📋 日报 2026-05-15');
    expect(md).toContain('## GLaDOS `16:30:00`');
    expect(md).toContain('> 🚀 签到结果');
    expect(md).toContain('**账号 1**');
    expect(md).toContain('| 项目 | 状态 |');
    expect(md).toContain('| :--- | :--- |');
    expect(md).toContain('| 邮箱 | xx@xx.com |');
    expect(md).toContain('| 签到 | 成功 |');
    expect(md).toContain('[查看项目 | GitHub](https://github.com/rento666/GithubActionsList)');
  });

  test('从 lists 读取数据生成表格', () => {
    const records = [
      {
        source: 'Whois',
        data: {
          title: 'Whois',
          content: '域名监控结果',
          items: [
            {
              header: 'caihongtu.com',
              lists: [
                { key: '状态', value: '✅ 域名 caihongtu.com 状态正常' },
                { key: '剩余天数', value: '302 天' }
              ]
            }
          ]
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('## Whois');
    expect(md).toContain('> 域名监控结果');
    expect(md).toContain('**caihongtu.com**');
    expect(md).toContain('| 状态 | ✅ 域名 caihongtu.com 状态正常 |');
    expect(md).toContain('| 剩余天数 | 302 天 |');
  });

  test('兼容旧 texts 格式', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: {
          title: 'GLaDOS',
          items: [
            { header: '账号 1', texts: ['邮箱: a@b.com', '签到: 成功'] }
          ]
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('| 邮箱 | a@b.com |');
    expect(md).toContain('| 签到 | 成功 |');
  });

  test('多 source 数据', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: {
          title: 'GLaDOS',
          description: '16:30:00',
          content: '签到完成',
          items: [{ header: '账号 1', lists: [{ key: '签到', value: '成功' }] }]
        }
      },
      {
        source: 'Whois',
        data: {
          title: 'Whois',
          description: '16:31:00',
          content: '监控正常',
          items: [{ header: 'example.com', lists: [{ key: '状态', value: '正常' }] }]
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('## GLaDOS `16:30:00`');
    expect(md).toContain('## Whois `16:31:00`');
    expect(md).toContain('**账号 1**');
    expect(md).toContain('**example.com**');
    expect(md).toContain('| 签到 | 成功 |');
    expect(md).toContain('| 状态 | 正常 |');
  });

  test('空数据返回提示', () => {
    const md = buildMarkdownV2([], '2026-05-15');

    expect(md).toContain('# 📋 日报 2026-05-15');
    expect(md).toContain('暂无数据');
  });

  test('无 items 时只显示标题和内容', () => {
    const records = [
      {
        source: 'test',
        data: {
          title: 'Test',
          content: '测试内容',
          items: []
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('## Test');
    expect(md).toContain('> 测试内容');
    expect(md).not.toContain('| 项目 | 状态 |');
  });

  test('多 items 时每个 item 独立表格', () => {
    const records = [
      {
        source: 'GLaDOS',
        data: {
          title: 'GLaDOS',
          items: [
            { header: '账号 1', lists: [{ key: '邮箱', value: 'a@b.com' }] },
            { header: '账号 2', lists: [{ key: '邮箱', value: 'c@d.com' }] }
          ]
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('**账号 1**');
    expect(md).toContain('**账号 2**');
    expect(md).toContain('| 邮箱 | a@b.com |');
    expect(md).toContain('| 邮箱 | c@d.com |');
  });

  test('无 description 时不显示时间', () => {
    const records = [
      {
        source: 'test',
        data: {
          title: 'Test',
          content: '测试',
          items: [{ header: 'a', lists: [{ key: 'k', value: 'v' }] }]
        }
      }
    ];

    const md = buildMarkdownV2(records, '2026-05-15');

    expect(md).toContain('## Test');
    expect(md).not.toContain('## Test `');
  });
});
