<div align="center">
<h1>📧 邮件通知配置</h1>
</div>

---

## 概述

`utils/notify.js` 提供统一的 SMTP 邮件通知能力，所有脚本复用同一份配置，无需重复设置。

**未配置 SMTP 时脚本静默跳过邮件发送，不影响主流程。**

## 环境变量

### 必填（如需邮件通知）

| 名称 | 类型 | 说明 |
|:-----|:-----|:-----|
| `SMTP_HOST` | Secret | SMTP 服务器地址 |
| `SMTP_USER` | Secret | 发件人邮箱地址 |
| `SMTP_PASS` | Secret | 发件人邮箱密码/授权码 |
| `NOTIFY_EMAIL` | Secret | 收件人邮箱地址 |

### 可选

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `SMTP_PORT` | Secret | 587 | SMTP 服务器端口 |

## 配置方式

1. 进入仓库 → `Settings` → `Secrets and variables` → `Actions`
2. 点击 **Secrets** 标签页 → `New repository secret`
3. 逐个添加上述环境变量

## 常见邮箱 SMTP 配置

### QQ 邮箱

| 项目 | 值 |
|:-----|:---|
| SMTP_HOST | `smtp.qq.com` |
| SMTP_PORT | `587` |
| SMTP_PASS | QQ 邮箱授权码（非 QQ 密码） |

> 获取授权码：QQ 邮箱 → 设置 → 账户 → POP3/SMTP 服务 → 开启 → 生成授权码

### 163 邮箱

| 项目 | 值 |
|:-----|:---|
| SMTP_HOST | `smtp.163.com` |
| SMTP_PORT | `465` 或 `994` |
| SMTP_PASS | 163 邮箱授权码 |

### Gmail

| 项目 | 值 |
|:-----|:---|
| SMTP_HOST | `smtp.gmail.com` |
| SMTP_PORT | `587` |
| SMTP_PASS | 应用专用密码 |

> 需开启两步验证后生成应用专用密码

### Outlook / Hotmail

| 项目 | 值 |
|:-----|:---|
| SMTP_HOST | `smtp.office365.com` |
| SMTP_PORT | `587` |
| SMTP_PASS | 账号密码 |

## 使用方式

各脚本通过专属开关控制何时发送邮件：

| 脚本 | 开关变量 | 说明 |
|:-----|:---------|:-----|
| GLaDOS 签到 | `GLA_NOTIFY_SUCCESS` | 签到成功时发送 |
| GLaDOS 签到 | `GLA_NOTIFY_ERRORS` | 签到失败时发送 |
| XBGame 签到 | `XB_NOTIFY_SUCCESS` | 签到成功时发送 |
| XBGame 签到 | `XB_NOTIFY_ERRORS` | 签到失败时发送 |
| 域名监控 | `WHOIS_NOTIFY_WARNINGS` | 域名即将到期时发送 |
| 域名监控 | `WHOIS_NOTIFY_SUCCESS` | 域名正常时发送 |
| 域名监控 | `WHOIS_NOTIFY_ERRORS` | 监控出错时发送 |

开关设置方式：`Variables` 标签页 → `New repository variable` → 值设为 `true`

## 邮件发送逻辑

```javascript
const notifier = createNotifier();

if (notifier) {
  // SMTP 已配置，可以发送邮件
  await notifier.send('邮件主题', '邮件内容');
} else {
  // SMTP 未配置，静默跳过
}
```

- `createNotifier()` 在缺少任一必填 SMTP 变量时返回 `null`
- 返回 `null` 不会导致脚本报错

## 注意事项

- ⚠️ **SMTP_PASS 是授权码，不是登录密码**
- 🔒 所有 SMTP 变量必须设置为 **Secret**（不是 Variable），避免泄露
- 📮 发件人和收件人可以是同一个邮箱
- 💡 建议只在需要时开启通知，避免频繁收到邮件
- 🔑 域名到期提醒必须设置 `WHOIS_NOTIFY_WARNINGS=true`
