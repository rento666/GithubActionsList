<div align="center">
<h1>🔌 运行开关</h1>
</div>

---

## 概述

每个脚本都支持通过 **Repository Variables** 控制是否定时运行。开关仅影响 **定时触发 (schedule)**，手动触发 (workflow_dispatch) 和 push 触发不受限制。

## 开关列表

### 全局开关

| 变量名 | 类型 | 默认值 | 说明 |
|:-------|:-----|:-------|:-----|
| `ENABLE_ALL` | Variable | 未设置（启用） | 全局总开关，设为 `false` 时所有脚本停止定时运行 |

### 脚本独立开关

| 变量名 | 类型 | 默认值 | 控制脚本 |
|:-------|:-----|:-------|:---------|
| `ENABLE_GLADOS` | Variable | 未设置（启用） | GLaDOS 签到 |
| `ENABLE_XBGAME` | Variable | 未设置（启用） | 小白游戏网签到 |
| `ENABLE_WHOIS` | Variable | 未设置（启用） | 域名监控 |
| `ENABLE_KEEP_ALIVE` | Variable | 未设置（启用） | 仓库保活 |
| `ENABLE_WECOM` | Variable | 未设置（启用） | 企业微信推送 |

## 通知开关

通知开关控制脚本在特定场景下是否发送邮件：

| 变量名 | 控制脚本 | 默认值 | 说明 |
|:-------|:---------|:-------|:-----|
| `GLA_NOTIFY_SUCCESS` | GLaDOS 签到 | false | 签到成功时是否发送邮件 |
| `GLA_NOTIFY_ERRORS` | GLaDOS 签到 | false | 签到失败时是否发送邮件 |
| `XB_NOTIFY_SUCCESS` | XBGame 签到 | false | 签到成功时是否发送邮件 |
| `XB_NOTIFY_ERRORS` | XBGame 签到 | false | 签到失败时是否发送邮件 |
| `WHOIS_NOTIFY_WARNINGS` | 域名监控 | false | 域名即将到期时是否发送邮件（**必须开启才能收到到期提醒**） |
| `WHOIS_NOTIFY_SUCCESS` | 域名监控 | false | 域名正常时是否发送邮件 |
| `WHOIS_NOTIFY_ERRORS` | 域名监控 | false | 监控出错时是否发送邮件 |
| `WECOM_NOTIFY_ERRORS` | 企业微信推送 | false | 推送失败时是否通过企业微信发送错误通知 |

## 设置方式

1. 进入仓库 → `Settings` → `Secrets and variables` → `Actions`
2. 点击 **Variables** 标签页
3. 点击 `New repository variable`
4. 输入变量名和值（如 Name: `ENABLE_ALL`，Value: `false`）

## 优先级

```
ENABLE_ALL=false  →  所有脚本不运行（无论独立开关如何设置）
ENABLE_ALL=true/未设置  →  检查各脚本的独立开关
  ENABLE_XXX=false  →  该脚本不运行
  ENABLE_XXX=true/未设置  →  该脚本正常运行
```

## 典型配置场景

### 场景 1：只运行签到脚本

```
ENABLE_WHOIS = false
ENABLE_KEEP_ALIVE = false
ENABLE_WECOM = false
```

### 场景 2：暂停所有脚本（维护期间）

```
ENABLE_ALL = false
```

### 场景 3：开启所有邮件通知

```
GLA_NOTIFY_SUCCESS = true
GLA_NOTIFY_ERRORS = true
XB_NOTIFY_SUCCESS = true
XB_NOTIFY_ERRORS = true
WHOIS_NOTIFY_WARNINGS = true    # 重要！否则收不到域名到期提醒
WHOIS_NOTIFY_SUCCESS = true
WHOIS_NOTIFY_ERRORS = true
```

> ⚠️ 通知开关需配合 [共享邮件配置](Email-Notification) 使用，未配置 SMTP 时即使开启通知也不会发送。
