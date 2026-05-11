<div align="center">
<h1>🌐 域名有效期监控</h1>
</div>

---

## 功能说明

- 利用免费 WHOIS API 监控域名有效期
- 域名到期 **30 天内**自动发送警告邮件
- 支持中英文通知内容
- 运行结果自动归档到 keep-alive 分支

## 运行周期

| 触发方式 | 时间 | 说明 |
|:---------|:-----|:-----|
| 定时触发 | 每天北京时间 09:00 | `cron: '0 1 * * *'` |
| 手动触发 | 随时 | Actions → Run workflow |
| Push 触发 | 推送时 | 修改 `Whois-domain/**` 或 `utils/**` 路径 |

## 环境变量

### 必填

| 名称 | 类型 | 说明 |
|:-----|:-----|:-----|
| `WHOIS_DOMAIN` | Secret | 要监控的域名（如 `example.com`） |

### 可选

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `WHOIS_API_URL` | Secret | `https://uapis.cn/api/v1/network/whois` | WHOIS API 接口地址 |
| `WHOIS_LANGUAGE` | Secret | `zh` | 通知语言，`zh` 为中文，其他值为英文 |
| `WHOIS_NOTIFY_WARNINGS` | Variable | false | **到期 30 天内发送警告邮件（需开启才能收到提醒！）** |
| `WHOIS_NOTIFY_SUCCESS` | Variable | false | 域名正常时发送邮件 |
| `WHOIS_NOTIFY_ERRORS` | Variable | false | 监控出错时发送邮件 |

## 运行开关

| 变量名 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `ENABLE_ALL` | 启用 | 全局总开关 |
| `ENABLE_WHOIS` | 启用 | 本脚本开关 |

## ⚠️ 重要提示

**如果需要域名到期提醒，必须同时满足：**

1. ✅ 配置 [共享邮件变量](Email-Notification)（SMTP_HOST、SMTP_USER、SMTP_PASS、NOTIFY_EMAIL）
2. ✅ 设置 `WHOIS_NOTIFY_WARNINGS=true`

缺少任一项都无法收到到期提醒！

## Workflow 执行流程

```
1. 检查运行开关 → 是否跳过
2. Checkout 仓库
3. 设置 Node.js 22
4. 安装依赖 (axios, nodemailer)
5. 执行监控脚本 → 输出到 /tmp/script-output.txt
   ├── 调用 WHOIS API 查询域名信息
   ├── 计算到期剩余天数
   ├── ≤ 30 天 → 发送警告邮件（如已开启）
   └── > 30 天 → 发送正常邮件（如已开启）
6. 保存结果到 keep-alive 分支
7. 检查脚本执行结果 → 标记成功/失败
```

## 输出示例

### 域名正常

```
Checking domain: example.com
✅ 域名 example.com 有效期剩余 365 天。
```

### 域名即将到期

```
Checking domain: example.com
⚠️ 警告: 域名 example.com 即将在 15 天后到期!
```

### 查询失败

```
❌ API 错误: Domain not found (代码: 404)
```

## API 说明

脚本使用 WHOIS API 查询域名注册信息：

- 默认 API：`https://uapis.cn/api/v1/network/whois`
- 请求方式：`GET ?domain=xxx&format=json`
- 返回字段：`whois.domain.expiration_date`（到期日期）

如需自定义 API，设置 `WHOIS_API_URL` 为完整的 API 基础地址。
