<div align="center">
<h1>🚀 快速开始</h1>
</div>

---

## 前置条件

- 一个 GitHub 账号
- 需要自动化运行的服务对应的账号信息（Cookie、用户名密码等）

## 第一步：Fork 仓库

1. 访问 [GithubActionsList](https://github.com/rento666/GithubActionsList)
2. 点击右上角 **Fork** 按钮
3. 将仓库 Fork 到自己的账号下

## 第二步：配置 Secrets（必填）

进入你 Fork 的仓库 → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

根据你要使用的脚本，添加对应的环境变量：

### 各脚本所需 Secrets 速查

| 脚本 | 必填 Secret | 说明 |
|:-----|:------------|:-----|
| GLaDOS 签到 | `GLA_COOKIE` | GLaDOS 账号 Cookie |
| XBGame 签到 | `XB_USERNAME` | 小白游戏网用户名 |
| XBGame 签到 | `XB_PASSWORD` | 小白游戏网密码 |
| 域名监控 | `WHOIS_DOMAIN` | 要监控的域名 |

### 邮件通知 Secrets（可选）

如需邮件通知，配置以下共享变量：

| Secret | 说明 |
|:-------|:-----|
| `SMTP_HOST` | SMTP 服务器地址 |
| `SMTP_USER` | 发件人邮箱 |
| `SMTP_PASS` | 邮箱授权码 |
| `NOTIFY_EMAIL` | 收件人邮箱 |

> 详见 [Email-Notification](Email-Notification)

## 第三步：配置 Variables（可选）

在 `Variables` 标签页添加：

- **运行开关**：如 `ENABLE_XBGAME=false` 可关闭某脚本的定时运行
- **通知开关**：如 `GLA_NOTIFY_SUCCESS=true` 开启签到成功邮件通知

> 详见 [Switches](Switches)

## 第四步：运行脚本

进入仓库 → `Actions` → 选择对应的 Workflow → 点击 `Run workflow`

## 验证运行结果

1. 在 `Actions` 页面查看 Workflow 运行日志
2. 查看 `keep-alive` 分支下 `data/` 目录的归档数据
3. 如配置了邮件/企业微信，检查是否收到通知

## 常见问题

### Q: Workflow 没有自动运行？

- 检查是否设置了 `ENABLE_ALL=false` 或对应脚本的 `ENABLE_XXX=false`
- GitHub 可能会禁用 60 天无活动的仓库定时任务，确认仓库保活脚本是否正常运行

### Q: 签到失败？

- 检查 Cookie/密码是否过期，重新获取后更新 Secret
- 查看 Actions 日志中的具体错误信息

### Q: 收不到邮件通知？

- 确认 SMTP 配置正确（邮箱授权码 ≠ 登录密码）
- 确认已开启对应的通知开关（如 `GLA_NOTIFY_SUCCESS=true`）
