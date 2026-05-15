const { createNotifier } = require('../notify');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const nodemailer = require('nodemailer');

describe('createNotifier', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('缺少环境变量时返回 null', () => {
    // 清除所有 SMTP 相关环境变量
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.NOTIFY_EMAIL;

    expect(createNotifier()).toBeNull();
  });

  test('缺少 SMTP_HOST 时返回 null', () => {
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.NOTIFY_EMAIL = 'target@test.com';

    expect(createNotifier()).toBeNull();
  });

  test('配置完整时返回 { send } 对象', () => {
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.NOTIFY_EMAIL = 'target@test.com';

    const notifier = createNotifier();
    expect(notifier).not.toBeNull();
    expect(typeof notifier.send).toBe('function');
  });

  test('options 参数覆盖环境变量', () => {
    // 环境变量不完整
    delete process.env.SMTP_HOST;
    process.env.SMTP_USER = 'env_user';
    process.env.SMTP_PASS = 'env_pass';
    process.env.NOTIFY_EMAIL = 'env_target';

    const notifier = createNotifier({
      smtpHost: 'options-smtp.test.com',
    });

    expect(notifier).not.toBeNull();
  });

  test('send() 调用 nodemailer createTransport 和 sendMail', async () => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: '123' });
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.NOTIFY_EMAIL = 'target@test.com';

    const notifier = createNotifier();
    await notifier.send('测试主题', '测试内容');

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        auth: { user: 'user@test.com', pass: 'password' },
      }),
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('user@test.com'),
        to: 'target@test.com',
        subject: '测试主题',
        text: '测试内容',
      }),
    );
  });

  test('send() 发送成功后输出 console.log', async () => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: '123' });
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.NOTIFY_EMAIL = 'target@test.com';

    const spy = jest.spyOn(console, 'log').mockImplementation();
    const notifier = createNotifier();
    await notifier.send('主题', '内容');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('Email sent'));
    spy.mockRestore();
  });

  test('send() 在 sendMail 抛错时向上传播异常', async () => {
    const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP error'));
    nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_USER = 'user@test.com';
    process.env.SMTP_PASS = 'password';
    process.env.NOTIFY_EMAIL = 'target@test.com';

    const notifier = createNotifier();
    await expect(notifier.send('主题', '内容')).rejects.toThrow('SMTP error');
  });
});
