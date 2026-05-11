<div align="center">
<h1>📘 GithubActionsList Wiki</h1>

<p><b>一站式 GitHub Actions 自动化脚本集合</b></p>

[快速开始](Quick-Start) · [架构说明](Architecture) · [运行开关](Switches)

</div>

---

## 📖 项目简介

**GithubActionsList** 是一个基于 GitHub Actions 的自动化脚本合集，只需 **Fork** 到自己的仓库，配置环境变量即可运行。所有脚本开箱即用，支持邮件通知和企业微信推送。

## 🎯 脚本列表

| 脚本 | 周期 | 功能说明 | 详细文档 |
|:-----|:-----|:---------|:---------|
| 🌐 域名监控 (Whois-domain) | 每天 | WHOIS 监控域名状态，到期 30 天内邮件提醒 | [Whois-Domain](Whois-Domain) |
| 🎮 小白游戏网签到 (XBGame) | 每天 | 自动登录 + 签到，支持积分/等级查询 | [XBGame-Checkin](XBGame-Checkin) |
| 🔬 GLaDOS 签到 | 每天 | 自动签到续期，支持多账号 | [GLaDOS-Checkin](GLaDOS-Checkin) |
| 🔄 仓库保活 (Keep-Alive) | 每 3 天 | 定期推送数据防止 Workflow 被禁用 + 数据归档 | [Keep-Alive](Keep-Alive) |
| 📢 企业微信推送 (WeCom-notify) | 每天 | 读取归档数据推送到企业微信群 | [WeCom-Notify](WeCom-Notify) |

## ⏰ 执行时间表

| 脚本 | UTC 时间 | 北京时间 | Cron 表达式 |
|:-----|:---------|:---------|:------------|
| GLaDOS 签到 | 00:30 | 08:30 | `30 0 * * *` |
| XBGame 签到 | 00:40 | 08:40 | `40 0 * * *` |
| 域名监控 | 01:00 | 09:00 | `0 1 * * *` |
| 仓库保活 | 00:30 (每3天) | 08:30 (每3天) | `30 0 */3 * *` |
| 企业微信推送 | 04:00 | 12:00 | `0 4 * * *` |

## 📦 项目结构

```
GithubActionsList/
├── .github/workflows/       # GitHub Actions 工作流
│   ├── GLaDOS-checkin.yml
│   ├── keep-alive.yml
│   ├── WeCom-notify.yml
│   ├── Whois-domain.yml
│   └── XBGame-checkin.yml
├── GLaDOS/                  # GLaDOS 签到脚本
│   ├── checkin.js
│   └── Doc.md
├── keep-alive/              # 仓库保活 + 数据归档
│   ├── update.js
│   └── Doc.md
├── utils/                   # 共享工具（邮件通知）
│   ├── notify.js
│   └── Doc.md
├── WeCom-notify/            # 企业微信机器人推送
│   ├── notify.js
│   └── Doc.md
├── Whois-domain/            # 域名有效期监控
│   ├── monitor.js
│   └── Doc.md
├── XBGame/                  # 小白游戏网签到
│   ├── checkin.js
│   └── Doc.md
├── README.md
├── README-en.md
└── LICENSE                  # GPL-3.0
```

## 🔧 技术栈

- **运行时**: Node.js 22
- **HTTP 客户端**: axios
- **邮件发送**: nodemailer
- **CI/CD**: GitHub Actions
- **语言**: JavaScript (CommonJS)

## 🔗 相关链接

- 📂 仓库地址: [rento666/GithubActionsList](https://github.com/rento666/GithubActionsList)
- 🐛 问题反馈: [Issues](https://github.com/rento666/GithubActionsList/issues)
- 🤝 贡献代码: [Pull Requests](https://github.com/rento666/GithubActionsList/pulls)
