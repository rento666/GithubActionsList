<div align="center">
<h1 align="center">GLaDOS 自动签到(周期：每天) </h1>
</div>

## 环境变量列表

### 脚本专属变量

| 名称 | 必填 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `GLA_COOKIE` | yes | | GLaDOS 账号的 cookie，多个 cookie 用换行符分隔 |
| `GLA_NOTIFY_SUCCESS` | no | false | 签到成功时是否发送邮件，`true` 表示发送 |
| `GLA_NOTIFY_ERRORS` | no | false | 签到失败时是否发送邮件，`true` 表示发送 |

### 获取 Cookie

1. 登录 [GLaDOS](https://glados.rocks)
2. 打开浏览器开发者工具（F12）→ Network 标签页
3. 刷新页面，找到任意请求，复制 `Cookie` 请求头的完整值

> 💡 支持多账号：将多个 cookie 用换行符分隔填入 `GLA_COOKIE` 即可

### 邮件通知

本脚本支持邮件通知，需配置 [共享邮件变量](../utils/Doc.md)，再通过上方开关控制发送时机。

## 运行开关

本脚本支持通过 Repository Variables 控制是否自动运行：

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `ENABLE_ALL` | Variable | 未设置（即启用） | 全局总开关，设为 `false` 时所有脚本停止定时运行 |
| `ENABLE_GLADOS` | Variable | 未设置（即启用） | 本脚本开关，设为 `false` 时仅本脚本停止定时运行 |

> 💡 开关仅影响 **定时触发**，手动触发和 push 触发不受开关限制。
