<div align="center">
<h1 align="center">GithubActionsList 💸</h1>

<p align="center">
  <a href="https://github.com/rento666/GithubActionsList/stargazers"><img src="https://img.shields.io/github/stars/rento666/GithubActionsList.svg?style=for-the-badge" alt="Stargazers"></a>
  <a href="https://github.com/rento666/GithubActionsList/issues"><img src="https://img.shields.io/github/issues/rento666/GithubActionsList.svg?style=for-the-badge" alt="Issues"></a>
  <a href="https://github.com/rento666/GithubActionsList/network/members"><img src="https://img.shields.io/github/forks/rento666/GithubActionsList.svg?style=for-the-badge" alt="Forks"></a>
  <a href="https://github.com/rento666/GithubActionsList/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rento666/GithubActionsList.svg?style=for-the-badge" alt="License"></a>
</p>

<br>
<h3>简体中文 | <a href="README-en.md">English</a></h3>

<br>
只需 <b>fork</b> 到自己的仓库，然后在 <b>Github Actions</b> 选择对应的 <b>workflow</b> 填写环境变量，就能运行自动化运行脚本了。
<br>

</div>

## 脚本列表 🎯

- [x] 利用免费、公益API执行WHOIS监控域名状态，可注册申请时发送邮件通知 [环境变量文档 | Doc](./Whois-domain/Doc.md)
- [x] 小白游戏网自动登录+签到 [环境变量文档 | Doc](./XBGame/Doc.md)
- [x] GLaDOS 自动签到 [环境变量文档 | Doc](./GLaDOS/Doc.md)
- [x] 仓库保活 - 定期向 keep-alive 分支推送数据，防止 GitHub 禁用定时 Workflow [环境变量文档 | Doc](./keep-alive/Doc.md)
- [x] 企业微信机器人日报推送 - 读取 keep-alive 分支当天数据推送到企业微信群 [环境变量文档 | Doc](./WeCom-notify/Doc.md)

### 后期计划 📅

- [ ] 暂时没有想到什么，如果您有想法，欢迎提交 [issue](https://github.com/rento666/GithubActionsList/issues)

## 运行开关 🔌

每个脚本都支持通过 **Repository Variables** 控制是否定时运行：

| 变量名 | 作用 | 默认 |
|:-------|:-----|:-----|
| `ENABLE_ALL` | 全局总开关，`false` 时所有脚本停止定时运行 | 未设置（启用） |
| `ENABLE_XBGAME` | XBGame 签到开关 | 未设置（启用） |
| `ENABLE_WHOIS` | 域名监控开关 | 未设置（启用） |
| `ENABLE_KEEP_ALIVE` | 仓库保活开关 | 未设置（启用） |
| `ENABLE_GLADOS` | GLaDOS 签到开关 | 未设置（启用） |
| `ENABLE_WECOM` | 企业微信推送开关 | 未设置（启用） |

设置方式：仓库 `Settings` → `Secrets and variables` → `Actions` → `Variables` 标签页 → `New repository variable`

> 💡 开关仅影响 **定时触发**，手动触发和 push 触发不受开关限制。

## 快速开始 🚀

1. **Fork** 到自己的仓库  

2. 进入到自己的仓库，点击 `Settings` → `Secrets and variables` → `Actions` → `New repository secret`，添加环境变量

3. **邮件通知（可选）**：如需邮件提醒，请先配置 [共享邮件变量](./utils/Doc.md)，再在各脚本中开启对应开关

4. **运行开关（可选）**：如需控制哪些脚本自动运行，在 Variables 标签页添加对应变量，值设为 `false` 即可关闭

5. 进入到自己的仓库，点击 `Actions` → 选择对应的 `workflow` → 点击 `Run workflow`，即可运行

## 反馈建议 📢

- 可以提交 [issue](https://github.com/rento666/GithubActionsList/issues)  
  或者 [pull request](https://github.com/rento666/GithubActionsList/pulls)。

## 许可证 📝

点击查看 [`LICENSE`](LICENSE) 文件

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=rento666%2FGithubActionsList&type=date&legend-top-left)](https://www.star-history.com/?repos=rento666%2FGithubActionsList&type=date&legend-top-left)
