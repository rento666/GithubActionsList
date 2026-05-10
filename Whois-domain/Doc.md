<div align="center">
<h1 align="center">域名有效期监控+30天内邮件提醒(周期：每天) </h1>
</div>

## 环境变量列表

### 脚本专属变量

| 名称 | 必填 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `WHOIS_API_URL` | no | https://uapis.cn/api/whois.php?domain= | API 接口地址，目前仅支持 GET：`WHOIS_API_URL + WHOIS_DOMAIN` 查询 |
| `WHOIS_DOMAIN` | yes | example.com | 要监控的域名 |
| `WHOIS_LANGUAGE` | no | zh | 发送内容的语言，目前只有中文和 English，if need to set English, Please set this property to a value other than zh |
| `WHOIS_NOTIFY_WARNINGS` | yes | false | 是否发送警告邮件，`true` 表示发送，**如果设置了邮件，则需要开启这一项，否则无法在域名到期30天内发送邮件** |
| `WHOIS_NOTIFY_SUCCESS` | no | false | 是否发送成功邮件，`true` 表示发送 |
| `WHOIS_NOTIFY_ERRORS` | no | false | 是否发送错误邮件，`true` 表示发送 |

### 邮件通知

本脚本支持邮件通知，需配置 [共享邮件变量](../utils/Doc.md)，再通过上方开关控制发送时机。

## SMTP_HOST

![仓库环境变量](https://s2.loli.net/2024/11/16/FoDvKqjRwOBYgQd.png)
