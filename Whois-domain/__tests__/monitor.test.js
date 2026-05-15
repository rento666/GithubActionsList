const { checkDomain } = require('../monitor');

describe('checkDomain', () => {
  const mockAxios = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 计算一个未来的日期（60 天后）
  const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  // 计算一个即将到期的日期（15 天后）
  const nearDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  test('域名正常（> 30 天）返回 ok', async () => {
    mockAxios.get.mockResolvedValue({
      data: { whois: { domain: { expiration_date: futureDate } } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'zh',
      axiosInstance: mockAxios,
    });

    expect(result.status).toBe('ok');
    expect(result.daysLeft).toBeGreaterThan(30);
    expect(result.message).toContain('状态正常');
  });

  test('域名即将到期（≤ 30 天）返回 warning', async () => {
    mockAxios.get.mockResolvedValue({
      data: { whois: { domain: { expiration_date: nearDate } } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'zh',
      axiosInstance: mockAxios,
    });

    expect(result.status).toBe('warning');
    expect(result.daysLeft).toBeLessThanOrEqual(30);
    expect(result.message).toContain('即将到期');
  });

  test('中文消息', async () => {
    mockAxios.get.mockResolvedValue({
      data: { whois: { domain: { expiration_date: futureDate } } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'zh',
      axiosInstance: mockAxios,
    });

    expect(result.message).toContain('域名');
    expect(result.message).toContain('状态正常');
  });

  test('英文消息', async () => {
    mockAxios.get.mockResolvedValue({
      data: { whois: { domain: { expiration_date: futureDate } } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'en',
      axiosInstance: mockAxios,
    });

    expect(result.message).toContain('Domain');
    expect(result.message).toContain('valid');
  });

  test('英文警告消息', async () => {
    mockAxios.get.mockResolvedValue({
      data: { whois: { domain: { expiration_date: nearDate } } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'en',
      axiosInstance: mockAxios,
    });

    expect(result.message).toContain('Warning');
    expect(result.message).toContain('expiring');
  });

  test('API 返回错误响应（error.response 存在）', async () => {
    mockAxios.get.mockRejectedValue({
      response: { data: { code: 404, message: 'Domain not found' } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'notfound.com',
      language: 'zh',
      axiosInstance: mockAxios,
    });

    expect(result.status).toBe('error');
    expect(result.message).toContain('API请求失败');
    expect(result.message).toContain('Domain not found');
  });

  test('网络错误（无 error.response）', async () => {
    mockAxios.get.mockRejectedValue(new Error('Network timeout'));

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'zh',
      axiosInstance: mockAxios,
    });

    expect(result.status).toBe('error');
    expect(result.message).toContain('网络请求失败');
    expect(result.message).toContain('Network timeout');
  });

  test('英文错误消息 - API 错误', async () => {
    mockAxios.get.mockRejectedValue({
      response: { data: { code: 500, message: 'Server error' } },
    });

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'en',
      axiosInstance: mockAxios,
    });

    expect(result.message).toContain('API Error');
  });

  test('英文错误消息 - 网络错误', async () => {
    mockAxios.get.mockRejectedValue(new Error('Timeout'));

    const result = await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'example.com',
      language: 'en',
      axiosInstance: mockAxios,
    });

    expect(result.message).toContain('Request failed');
  });

  test('调用 API 时传递正确的 URL', async () => {
    mockAxios.get.mockResolvedValue({
      data: { whois: { domain: { expiration_date: futureDate } } },
    });

    await checkDomain({
      apiUrl: 'https://api.example.com/whois',
      domain: 'test.com',
      language: 'zh',
      axiosInstance: mockAxios,
    });

    expect(mockAxios.get).toHaveBeenCalledWith(
      'https://api.example.com/whois?domain=test.com&format=json',
    );
  });
});
