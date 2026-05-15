const { parseExchangeConfig, maskEmail, formatResult, runCheckin } = require('../checkin');

// Mock axios
jest.mock('axios', () => {
  const mockAxios = {
    post: jest.fn(),
    get: jest.fn(),
  };
  return mockAxios;
});

const axios = require('axios');

describe('parseExchangeConfig', () => {
  test('空字符串返回 false', () => {
    expect(parseExchangeConfig('')).toBe(false);
  });

  test('undefined 返回 false', () => {
    expect(parseExchangeConfig(undefined)).toBe(false);
  });

  test("'true' 返回 true", () => {
    expect(parseExchangeConfig('true')).toBe(true);
  });

  test('正整数返回数字', () => {
    expect(parseExchangeConfig('500')).toBe(500);
  });

  test("'abc' 返回 false", () => {
    expect(parseExchangeConfig('abc')).toBe(false);
  });

  test("'0' 返回 false（不是正数）", () => {
    expect(parseExchangeConfig('0')).toBe(false);
  });

  test("'-1' 返回 false（不是正数）", () => {
    expect(parseExchangeConfig('-1')).toBe(false);
  });

  test("'3.14' 返回 3.14", () => {
    expect(parseExchangeConfig('3.14')).toBe(3.14);
  });
});

describe('maskEmail', () => {
  test('正常邮箱脱敏', () => {
    expect(maskEmail('username@gmail.com')).toBe('us******@gmail.com');
  });

  test('短邮箱', () => {
    expect(maskEmail('ab@c.d')).toBe('ab@c.d');
  });

  test("'N/A' 原样返回", () => {
    expect(maskEmail('N/A')).toBe('N/A');
  });

  test('null 返回 N/A', () => {
    expect(maskEmail(null)).toBe('N/A');
  });

  test('空字符串返回 N/A', () => {
    expect(maskEmail('')).toBe('N/A');
  });
});

describe('formatResult', () => {
  test('基本格式化', () => {
    const item = {
      index: 1,
      checkinMsg: 'Checkin! 获得10积分',
      email: 'us***@gmail.com',
      leftDays: '30 天',
      points: '520',
    };
    const result = formatResult(item);
    expect(result).toContain('📋账号 1:');
    expect(result).toContain('邮箱: us***@gmail.com');
    expect(result).toContain('签到: ✅ 成功');
    expect(result).toContain('天数: 30 天');
    expect(result).toContain('积分: 520');
  });

  test('含兑换信息时追加兑换行', () => {
    const item = {
      index: 1,
      checkinMsg: '签到成功',
      email: 'us***@gmail.com',
      leftDays: '30 天',
      points: '520',
      exchangeMsg: '兑换成功：500 积分 → 30 天',
    };
    const result = formatResult(item);
    expect(result).toContain('兑换: ✅ 兑换成功');
  });

  test('兑换失败时显示警告', () => {
    const item = {
      index: 1,
      checkinMsg: '签到成功',
      email: 'us***@gmail.com',
      leftDays: '30 天',
      points: '520',
      exchangeMsg: '兑换失败：积分不足',
    };
    const result = formatResult(item);
    expect(result).toContain('兑换: ⚠️ 兑换失败');
  });

  test('非 Checkin! 消息标记为警告', () => {
    const item = {
      index: 1,
      checkinMsg: '今日已签到',
      email: 'us***@gmail.com',
      leftDays: '30 天',
      points: '520',
    };
    const result = formatResult(item);
    expect(result).toContain('签到: ⚠️ 今日已签到');
  });
});

describe('runCheckin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const cookie = 'test_cookie_value';

  function mockCheckinSuccess(msg = 'Checkin! 获得10积分') {
    axios.post.mockImplementation((url) => {
      if (url.includes('checkin')) {
        return Promise.resolve({ data: { message: msg } });
      }
      if (url.includes('exchange')) {
        return Promise.resolve({ data: { daysAdded: 30, pointsUsed: 500 } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  }

  function mockStatusAndPoints(points = 520, leftDays = 30, plans = null) {
    axios.get.mockImplementation((url) => {
      if (url.includes('status')) {
        return Promise.resolve({
          data: { data: { email: 'username@gmail.com', leftDays }, points },
        });
      }
      if (url.includes('points')) {
        return Promise.resolve({
          data: { points, plans: plans || { plan_a: { points: 500, days: 30 } } },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  }

  test('签到成功', async () => {
    mockCheckinSuccess();
    mockStatusAndPoints();

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: false });
    expect(results).toHaveLength(1);
    expect(results[0].checkinMsg).toBe('Checkin! 获得10积分');
    expect(results[0].email).toContain('***');
    expect(results[0].leftDays).toBe('30 天');
    expect(results[0].points).toBe('520');
  });

  test('今日已签到', async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes('checkin')) {
        const err = new Error("Today's observation logged.");
        return Promise.reject(err);
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    mockStatusAndPoints();

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: false });
    expect(results[0].checkinMsg).toBe('今日已签到');
  });

  test('签到 API 返回错误 code', async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes('checkin')) {
        return Promise.resolve({ data: { code: -1, message: '无效cookie' } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    mockStatusAndPoints();

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: false });
    expect(results[0].checkinMsg).toContain('签到错误');
  });

  test('自动兑换 - true 模式，积分充足时兑换', async () => {
    mockCheckinSuccess();
    mockStatusAndPoints(1000, 30, { plan_a: { points: 500, days: 30 } });

    // 兑换后再次查 status
    axios.get.mockImplementation((url) => {
      if (url.includes('status')) {
        return Promise.resolve({
          data: { data: { email: 'username@gmail.com', leftDays: 60 }, points: 500 },
        });
      }
      if (url.includes('points')) {
        return Promise.resolve({
          data: { points: 1000, plans: { plan_a: { points: 500, days: 30 } } },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: true });
    expect(results[0].exchangeMsg).toContain('兑换成功');
  });

  test('自动兑换 - true 模式，积分不足时跳过', async () => {
    mockCheckinSuccess();
    mockStatusAndPoints(100, 30, { plan_a: { points: 500, days: 30 } });

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: true });
    expect(results[0].exchangeMsg).toContain('积分不足');
  });

  test('自动兑换 - 数字阈值模式，达到阈值兑换', async () => {
    mockCheckinSuccess();
    axios.get.mockImplementation((url) => {
      if (url.includes('status')) {
        return Promise.resolve({
          data: { data: { email: 'username@gmail.com', leftDays: 60 }, points: 500 },
        });
      }
      if (url.includes('points')) {
        return Promise.resolve({
          data: { points: 600, plans: { plan_a: { points: 500, days: 30 } } },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: 500 });
    expect(results[0].exchangeMsg).toContain('兑换成功');
  });

  test('自动兑换 - 数字阈值模式，未达阈值跳过', async () => {
    mockCheckinSuccess();
    mockStatusAndPoints(100, 30, { plan_a: { points: 500, days: 30 } });

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: 500 });
    expect(results[0].exchangeMsg).toContain('未达兑换阈值');
  });

  test('多 cookie 处理', async () => {
    mockCheckinSuccess();
    mockStatusAndPoints();

    const results = await runCheckin({
      cookies: [cookie, cookie],
      exchangeConfig: false,
    });
    expect(results).toHaveLength(2);
  });

  test('兑换 API 返回错误', async () => {
    mockCheckinSuccess();
    axios.get.mockImplementation((url) => {
      if (url.includes('status')) {
        return Promise.resolve({
          data: { data: { email: 'username@gmail.com', leftDays: 30 }, points: 500 },
        });
      }
      if (url.includes('points')) {
        return Promise.resolve({
          data: { points: 1000, plans: { plan_a: { points: 500, days: 30 } } },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    axios.post.mockImplementation((url) => {
      if (url.includes('checkin')) {
        return Promise.resolve({ data: { message: 'Checkin!' } });
      }
      if (url.includes('exchange')) {
        return Promise.resolve({ data: { code: -1, message: '兑换失败' } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const results = await runCheckin({ cookies: [cookie], exchangeConfig: true });
    expect(results[0].exchangeMsg).toContain('兑换失败');
  });
});
