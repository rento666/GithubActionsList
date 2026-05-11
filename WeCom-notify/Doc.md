<div align="center">
<h1 align="center">企业微信机器人日报推送(周期：每天) </h1>
</div>

## 说明

每天北京时间 12:00 自动读取 keep-alive 分支中当天的数据文件，推送到企业微信群机器人。

## 环境变量列表

### 脚本专属变量

| 名称 | 必填 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `WECOM_KEY` | yes | | 企业微信机器人 Webhook Key（URL 中 key 参数的值） |
| `WECOM_NOTIFY_ERRORS` | no | false | 推送失败时是否通过企业微信发送错误通知，`true` 表示发送 |

### 获取 Webhook Key

1. 在企业微信群中添加「机器人」
2. 创建完成后，复制 Webhook 地址中的 `key` 参数值
3. 例如 `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx`，只需填入 `xxx` 部分

## 运行开关

本脚本支持通过 Repository Variables 控制是否自动运行：

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `ENABLE_ALL` | Variable | 未设置（即启用） | 全局总开关，设为 `false` 时所有脚本停止定时运行 |
| `ENABLE_WECOM` | Variable | 未设置（即启用） | 本脚本开关，设为 `false` 时仅本脚本停止定时运行 |

> 💡 开关仅影响 **定时触发**，手动触发和 push 触发不受开关限制。
