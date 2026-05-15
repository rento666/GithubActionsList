const { parseDataFile, truncate, buildTemplateCard } = require('../notify');

describe('parseDataFile', () => {
  test('正常 JSONL 解析', () => {
    const content = [
      '{"source":"GLaDOS","time":"08:30:00","text":"签到成功"}',
      '{"source":"Whois","time":"09:00:00","text":"域名正常"}',
    ].join('\n');

    const records = parseDataFile(content);
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({ source: 'GLaDOS', time: '08:30:00', text: '签到成功' });
    expect(records[1]).toEqual({ source: 'Whois', time: '09:00:00', text: '域名正常' });
  });

  test('含 \\n 的 text 被还原为换行', () => {
    const content = '{"source":"GLaDOS","time":"08:30:00","text":"第一行\\n第二行"}';
    const records = parseDataFile(content);
    expect(records[0].text).toBe('第一行\n第二行');
  });

  test('空文件返回空数组', () => {
    expect(parseDataFile('')).toEqual([]);
    expect(parseDataFile('  \n  ')).toEqual([]);
  });

  test('非法行被跳过', () => {
    const content = [
      '{"source":"GLaDOS","time":"08:30:00","text":"ok"}',
      'this is not json',
      '{"source":"Whois","time":"09:00:00","text":"fine"}',
    ].join('\n');

    const records = parseDataFile(content);
    expect(records).toHaveLength(2);
    expect(records[0].source).toBe('GLaDOS');
    expect(records[1].source).toBe('Whois');
  });

  test('缺少 source 字段时默认 unknown', () => {
    const content = '{"time":"08:30:00","text":"ok"}';
    const records = parseDataFile(content);
    expect(records[0].source).toBe('unknown');
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
  const makeRecords = (n) => {
    const records = [];
    for (let i = 0; i < n; i++) {
      records.push({
        source: i < 3 ? 'GLaDOS' : 'Whois',
        time: `08:${String(i).padStart(2, '0')}:00`,
        text: `第${i + 1}条数据内容`,
      });
    }
    return records;
  };

  test('基本卡片结构正确', () => {
    const records = makeRecords(2);
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.card_type).toBe('text_notice');
    expect(card.source.desc).toBe('GithubActionsList');
    expect(card.source.desc_color).toBe(0);
    expect(card.main_title.title).toBe('📋 日报 2026-05-15');
    expect(card.main_title.desc).toBe('GithubActionsList 每日数据汇总');
    expect(card.emphasis_content.title).toBe('2');
    expect(card.emphasis_content.desc).toBe('今日条目数');
  });

  test('不含 jump_list 和 card_action', () => {
    const records = makeRecords(2);
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card).not.toHaveProperty('jump_list');
    expect(card).not.toHaveProperty('card_action');
  });

  test('horizontal_content_list 最多 6 项', () => {
    const records = makeRecords(10);
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.horizontal_content_list).toHaveLength(6);
  });

  test('horizontal_content_list 的 keyname 截断（≤5字）', () => {
    const records = [{ source: 'VeryLongSource', time: '08:30:00', text: 'ok' }];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.horizontal_content_list[0].keyname.length).toBeLessThanOrEqual(6); // 5字 + 可能的…
  });

  test('horizontal_content_list 的 value 截断（≤26字+…）', () => {
    const records = [{ source: 'test', time: '08:30:00', text: 'a'.repeat(50) }];
    const card = buildTemplateCard(records, '2026-05-15');

    const value = card.horizontal_content_list[0].value;
    expect(value.length).toBeLessThanOrEqual(27); // 26 + …
  });

  test('quote_area 包含前 3 条记录预览', () => {
    const records = makeRecords(5);
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.quote_area).toBeDefined();
    expect(card.quote_area.type).toBe(0);
    expect(card.quote_area.title).toBe('内容预览');
    expect(card.quote_area.quote_text).toContain('GLaDOS');
  });

  test('sub_title_text 包含来源汇总', () => {
    const records = makeRecords(5);
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.sub_title_text).toContain('共 5 条记录');
    expect(card.sub_title_text).toContain('GLaDOS');
    expect(card.sub_title_text).toContain('Whois');
  });

  test('单条记录也能正常构建', () => {
    const records = [{ source: 'test', time: '', text: 'hello' }];
    const card = buildTemplateCard(records, '2026-05-15');

    expect(card.horizontal_content_list).toHaveLength(1);
    expect(card.horizontal_content_list[0].keyname).toBe('test');
    expect(card.horizontal_content_list[0].value).toBe('hello');
  });
});
