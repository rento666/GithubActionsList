<div align="center">
<h1>📢 企业微信机器人日报推送</h1>
</div>

---

## 功能说明

- 每天北京时间 12:00 自动读取 `keep-alive` 分支中当天的数据文件
- 将数据以 Markdown 格式推送到企业微信群机器人
- 内容过长时自动截断（约 3800 字符上限）
- 推送失败时可自动发送错误通知

## 运行周期

| 触发方式 | 时间 | 说明 |
|:---------|:-----|:-----|
| 定时触发 | 每天北京时间 12:00 | `cron: '0 4 * * *'` |
| 手动触发 | 随时 | Actions → Run workflow |
| Push 触发 | 推送时 | 修改 `WeCom-notify/**` 路径 |

## 环境变量

### 必填

| 名称 | 类型 | 说明 |
|:-----|:-----|:-----|
| `WECOM_KEY` | Secret | 企业微信机器人 Webhook Key |

### 可选

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `WECOM_NOTIFY_ERRORS` | Variable | false | 推送失败时是否发送错误通知 |

## 获取 Webhook Key

1. 在企业微信群中点击右上角 `…` → **添加群机器人**
2. 点击 **新建机器人**，输入名称
3. 创建完成后，复制 Webhook 地址中的 `key` 参数值

**示例：**

```
Webhook 地址: https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
只需填入: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 运行开关

| 变量名 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `ENABLE_ALL` | 启用 | 全局总开关 |
| `ENABLE_WECOM` | 启用 | 本脚本开关 |

## Workflow 执行流程

```
1. 检查运行开关 → 是否跳过
2. Checkout main 分支
3. 设置 Node.js 22
4. 安装依赖 (axios)
5. 拉取 keep-alive 分支的 data 目录
6. 执行推送脚本
   ├── 使用北京时间确定日期
   ├── 读取 data/YYYY-MM/data-DD.txt
   ├── 文件为空 → 跳过推送
   ├── 内容超长 → 截断到 3800 字符
   └── 构建并发送 Markdown 消息
7. 检查脚本执行结果 → 标记成功/失败
```

## 推送消息格式

```markdown
### 📋 GithubActionsList 日报 2026-05-11

[2026-05-11 08:40:01] [XBGame]
👤 用户: testuser | 🏅 等级: LV5
🎉 签到成功！
──────────────────────────────────────────────────
[2026-05-11 09:00:01] [Whois-domain]
✅ 域名 example.com 有效期剩余 365 天。
──────────────────────────────────────────────────
```

## 时序说明

为什么企业微信推送定在 12:00？

```
08:30  GLaDOS 签到     → 结果归档到 keep-alive
08:40  XBGame 签到     → 结果归档到 keep-alive
09:00  域名监控        → 结果归档到 keep-alive
  ...
12:00  企业微信推送    ← 读取当天所有归档数据，汇总推送
```

确保所有脚本的运行结果都已归档后再推送。

## 错误处理

| 场景 | 处理方式 |
|:-----|:---------|
| keep-alive 分支不存在 | 跳过推送，不报错 |
| 当天数据文件不存在 | 跳过推送，输出警告 |
| 数据文件为空 | 跳过推送，输出警告 |
| 推送 API 返回错误 | 标记 Workflow 失败 |
| 推送失败 + WECOM_NOTIFY_ERRORS=true | 尝试通过企业微信发送错误通知 |
