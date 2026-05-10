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

## 运行开关

本脚本支持通过 Repository Variables 控制是否自动运行：

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `ENABLE_ALL` | Variable | 未设置（即启用） | 全局总开关，设为 `false` 时所有脚本停止定时运行 |
| `ENABLE_XBGAME` | Variable | 未设置（即启用） | 本脚本开关，设为 `false` 时仅本脚本停止定时运行 |

> 💡 开关仅影响 **定时触发**，手动触发和 push 触发不受开关限制。
