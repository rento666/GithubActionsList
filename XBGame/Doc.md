<div align="center">
<h1 align="center">小白游戏网自动登录+签到(周期：每天) </h1>
</div>

## 环境变量列表

### 脚本专属变量

| 名称            | 必填  | 默认值  | 说明                               |
|:----------------|:-----:|:------:|:----------------------------------:|
| `XB_USERNAME`   | yes   |        | 小白游戏网用户名                     |
| `XB_PASSWORD`   | yes   |        | 小白游戏网密码                       |
| `XB_NOTIFY_SUCCESS` | no   | false  | 签到成功时是否发送邮件，`true` 表示发送 |
| `XB_NOTIFY_ERRORS`  | no   | false  | 签到失败时是否发送邮件，`true` 表示发送 |

### 共享邮件配置

| 名称            | 必填  | 默认值                             | 说明                               |
|:----------------|:-----:|:--------------------------------:|:----------------------------------:|
| `NOTIFY_SMTP_HOST`    | yes    |                               | SMTP 服务器地址  |
| `NOTIFY_SMTP_PORT`    | no    | 587                               | SMTP 服务器端口     |
| `NOTIFY_SMTP_USER`    | yes    |                               | 发件人邮箱地址  |
| `NOTIFY_SMTP_PASS`    | yes    |                               | 发件人邮箱密码  |
| `NOTIFY_EMAIL` | yes    |                               | 收件人邮箱地址  |

> 💡 共享邮件配置由 `utils/notify.js` 提供，所有脚本复用同一份 SMTP 配置，无需重复设置。
