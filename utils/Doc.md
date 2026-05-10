<div align="center">
<h1 align="center">共享邮件通知配置</h1>
</div>

## 说明

由 `utils/notify.js` 提供，所有脚本复用同一份 SMTP 配置，无需重复设置。未配置时脚本静默跳过邮件发送，不影响主流程。

## 环境变量列表

| 名称 | 必填 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `SMTP_HOST` | yes | | SMTP 服务器地址 |
| `SMTP_PORT` | no | 587 | SMTP 服务器端口 |
| `SMTP_USER` | yes | | 发件人邮箱地址 |
| `SMTP_PASS` | yes | | 发件人邮箱密码/授权码 |
| `NOTIFY_EMAIL` | yes | | 收件人邮箱地址 |

## 使用方式

1. 在仓库 `Settings` → `Secrets and variables` → `Actions` 中添加以上变量
2. 各脚本通过专属开关控制何时发送邮件（如 `XB_NOTIFY_SUCCESS`、`WHOIS_NOTIFY_WARNINGS` 等），详见各脚本的 Doc.md
