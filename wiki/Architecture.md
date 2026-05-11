<div align="center">
<h1>🏗️ 架构说明</h1>
</div>

---

## 整体架构

GithubActionsList 采用**模块化脚本 + 共享工具 + 集中式数据归档**的架构设计：

```
┌─────────────────────────────────────────────────┐
│              GitHub Actions Workflows            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐     │
│  │ GLaDOS   │ │ XBGame   │ │ Whois-domain │     │
│  │ checkin  │ │ checkin  │ │ monitor      │     │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘     │
│       │             │              │              │
│       ▼             ▼              ▼              │
│  ┌─────────────────────────────────────────┐     │
│  │           utils/notify.js               │     │
│  │        (共享邮件通知模块)                │     │
│  └─────────────────────────────────────────┘     │
│       │             │              │              │
│       ▼             ▼              ▼              │
│  ┌─────────────────────────────────────────┐     │
│  │       keep-alive 分支 (数据归档)         │     │
│  │    data/2026-05/data-10.txt              │     │
│  └──────────────────┬──────────────────────┘     │
│                     │                             │
│                     ▼                             │
│              ┌────────────┐                       │
│              │ WeCom-notify│                      │
│              │ (日报推送)  │                       │
│              └────────────┘                       │
└─────────────────────────────────────────────────┘
```

## 核心设计模式

### 1. 共享通知模块

`utils/notify.js` 提供统一的邮件通知能力：

```javascript
const { createNotifier } = require('../utils/notify');
const notifier = createNotifier();  // 未配置 SMTP 时返回 null

if (notifier) {
  await notifier.send('主题', '内容');
}
```

- 未配置 SMTP 时不影响主流程，静默跳过
- 各脚本通过专属开关控制发送时机

### 2. 数据归档

多个脚本的运行结果会统一归档到 `keep-alive` 分支：

- 文件路径：`data/YYYY-MM/data-DD.txt`
- 格式：`[时间戳] [来源] + 内容 + 分隔线`
- 来源标识：`keep-alive` / `XBGame` / `Whois-domain` / `GLaDOS`

### 3. 运行开关

每个 Workflow 都内置开关检查逻辑：

```bash
if [ "${{ github.event_name }}" = "schedule" ]; then
  # 仅定时触发时检查开关
  if [ "${{ vars.ENABLE_ALL }}" = "false" ] || [ "${{ vars.ENABLE_XXX }}" = "false" ]; then
    echo "skip=true" >> $GITHUB_OUTPUT
  fi
fi
```

- 手动触发和 push 触发不受开关限制
- 支持全局开关 `ENABLE_ALL` 和脚本独立开关

### 4. 错误处理

- 脚本使用 `continue-on-error: true` 允许归档步骤继续执行
- 归档步骤使用 `if: always()` 确保无论成功失败都保存数据
- 最后通过 `Check script result` 步骤决定 Workflow 最终状态

## 数据流

```
签到/监控脚本 ──运行结果──→ keep-alive 分支 ──日报──→ 企业微信群
                              │
                              └──→ 防止仓库被禁用
```

## 依赖关系

| 模块 | 依赖 |
|:-----|:-----|
| GLaDOS checkin.js | axios, utils/notify.js |
| XBGame checkin.js | axios, utils/notify.js |
| Whois-domain monitor.js | axios, utils/notify.js |
| keep-alive update.js | fs (内置) |
| WeCom-notify notify.js | axios, fs (内置) |
| utils/notify.js | nodemailer |

## 分支策略

| 分支 | 用途 |
|:-----|:-----|
| `main` | 源代码，触发 Workflow 运行 |
| `keep-alive` | 数据归档，保存运行结果 + 保活 |

> `keep-alive` 分支由脚本自动创建和维护，无需手动操作。
