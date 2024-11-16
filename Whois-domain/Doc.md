<div align="center">
<h1 align="center">域名有效期监控+30天内邮件提醒(周期：每天) </h1>
</div>

## 环境变量列表

| 名称            | 必填  | 默认值                             | 说明                               |
|:----------------|:-----:|:--------------------------------:|:----------------------------------:|
| `API_URL`          | no    | https://uapis.cn/api/whois.php?domain=                               | API 接口地址，目前仅支持GET：`域名+DOMAIN`查询 |
| `DOMAIN`       | yes    | example.com                               | 要监控的域名  |
| `SMTP_HOST`    | yes    | smtp.example.com                               | SMTP 服务器地址  |
| `SMTP_PORT`    | no    | 587                               | SMTP 服务器端口     |
| `SMTP_USER`    | yes    | your-email@example.com                               | 发件人邮箱地址  |
| `SMTP_PASS`    | yes    | your-email-password                               | 发件人邮箱密码  |
| `NOTIFY_EMAIL` | yes    | recipient@example.com                               | 收件人邮箱地址  |
| `NOTIFY_ON_START` | no  | false                               | 是否在启动时发送通知，`true` 表示发送 |
| `NOTIFY_WARNINGS` | yes  | false                               | 是否发送警告邮件，`true` 表示发送，如果设置了邮件，则需要开启这一项，否则无法在域名到期30天内发送邮件 |
| `NOTIFY_SUCCESS` | no   | false                               | 是否发送成功邮件，`true` 表示发送 |
| `NOTIFY_ERRORS`  | no   | false                               | 是否发送错误邮件，`true` 表示发送 |


## 示例图

![仓库环境变量](https://s2.loli.net/2024/11/16/FoDvKqjRwOBYgQd.png)