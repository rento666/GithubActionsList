<div align="center">
<h1 align="center">小白游戏网自动登录+签到(周期：每天) </h1>
</div>

## 环境变量列表

### 脚本专属变量

| 名称 | 必填 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `XB_USERNAME` | yes | | 小白游戏网用户名 |
| `XB_PASSWORD` | yes | | 小白游戏网密码 |
| `XB_NOTIFY_SUCCESS` | no | false | 签到成功时是否发送邮件，`true` 表示发送 |
| `XB_NOTIFY_ERRORS` | no | false | 签到失败时是否发送邮件，`true` 表示发送 |

### 邮件通知

本脚本支持邮件通知，需配置 [共享邮件变量](../utils/Doc.md)，再通过上方开关控制发送时机。
SMTP_HOST