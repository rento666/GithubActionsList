<div align="center">
<h1 align="center">GithubActionsList 💸</h1>

<p align="center">
  <a href="https://github.com/rento666/GithubActionsList/stargazers"><img src="https://img.shields.io/github/stars/rento666/GithubActionsList.svg?style=for-the-badge" alt="Stargazers"></a>
  <a href="https://github.com/rento666/GithubActionsList/issues"><img src="https://img.shields.io/github/issues/rento666/GithubActionsList.svg?style=for-the-badge" alt="Issues"></a>
  <a href="https://github.com/rento666/GithubActionsList/network/members"><img src="https://img.shields.io/github/forks/rento666/GithubActionsList.svg?style=for-the-badge" alt="Forks"></a>
  <a href="https://github.com/rento666/GithubActionsList/blob/main/LICENSE"><img src="https://img.shields.io/github/license/rento666/GithubActionsList.svg?style=for-the-badge" alt="License"></a>
</p>

<br>
<h3><a href="README.md">简体中文</a> | English</h3>

<br>
Just <b>fork</b> it to your repository, fill in the environment variables, and select the corresponding <b>workflow</b> in <b>Github Actions</b> to run the automation script.
<br>

</div>

## Features 🎯

- [x] Use free and public APIs to monitor domain status via WHOIS, with email notifications when domains become available [Doc](./Whois-domain/Doc.md)
- [x] XBGame auto login & check-in [Doc](./XBGame/Doc.md)
- [x] GLaDOS auto check-in [Doc](./GLaDOS/Doc.md)
- [x] Repository keep-alive - periodically push data to the keep-alive branch to prevent GitHub from disabling scheduled workflows [Doc](./keep-alive/Doc.md)
- [x] WeCom robot daily report - read the day's data from keep-alive branch and push to WeChat Work group [Doc](./WeCom-notify/Doc.md)

### Future Plans 📅

- [ ] If you have an idea, please feel free to submit an [issue](https://github.com/rento666/GithubActionsList/issues)

## Switches 🔌

Each script supports **Repository Variables** to control whether it runs on schedule:

| Variable | Purpose | Default |
|:---------|:--------|:--------|
| `ENABLE_ALL` | Global switch, set to `false` to stop all scheduled runs | Unset (enabled) |
| `ENABLE_XBGAME` | XBGame check-in switch | Unset (enabled) |
| `ENABLE_WHOIS` | Domain monitor switch | Unset (enabled) |
| `ENABLE_KEEP_ALIVE` | Keep-alive switch | Unset (enabled) |
| `ENABLE_GLADOS` | GLaDOS check-in switch | Unset (enabled) |
| `ENABLE_WECOM` | WeCom robot push switch | Unset (enabled) |

How to set: Repository `Settings` → `Secrets and variables` → `Actions` → `Variables` tab → `New repository variable`

> 💡 Switches only affect **scheduled triggers**. Manual and push triggers are not affected.

## Quick Start 🚀

1. **Fork** to your own repository

2. Go to your repository, click `Settings` → `Secrets and variables` → `Actions` → `New repository secret`, and add environment variables

3. **Email notifications (optional)**: To receive email alerts, first configure the [shared email variables](./utils/Doc.md), then enable the corresponding switches in each script

4. **Switches (optional)**: To control which scripts run automatically, add the corresponding variable in the Variables tab and set its value to `false`

5. Go to your repository, click `Actions` → select the corresponding `workflow` → click `Run workflow` to run it

## Feedback 📢

- You can submit an [issue](https://github.com/rento666/GithubActionsList/issues)
  or [pull request](https://github.com/rento666/GithubActionsList/pulls).

## License 📝

Click to view the [`LICENSE`](LICENSE) file

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=rento666%2FGithubActionsList&type=date&legend-top-left)](https://www.star-history.com/?repos=rento666%2FGithubActionsList&type=date&legend-top-left)
