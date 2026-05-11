<div align="center">
<h1>🔄 仓库保活 + 数据归档</h1>
</div>

---

## 功能说明

### 1. 仓库保活

GitHub 会在仓库 **60 天无活动**后自动禁用定时 Workflow。本脚本通过定期向 `keep-alive` 分支推送数据，保持仓库活跃，防止定时任务被禁用。

### 2. 数据归档

接收其他脚本（XBGame 签到、域名监控、GLaDOS 签到等）传来的运行结果，统一保存到 `keep-alive` 分支。

## 运行周期

| 触发方式 | 时间 | 说明 |
|:---------|:-----|:-----|
| 定时触发 | 每 3 天北京时间 08:30 | `cron: '30 0 */3 * *'` |
| 手动触发 | 随时 | Actions → Run workflow（可输入自定义数据） |
| 其他脚本调用 | 自动 | 其他 Workflow 运行后自动归档 |

## 环境变量

### 定时保活（使用默认值）

无需配置，脚本自动生成时间戳数据。

### 手动触发自定义数据

在 Actions 页面点击 `Run workflow` 时可输入：

| 参数 | 说明 |
|:-----|:-----|
| `data` | 要保存的数据内容 |
| `source` | 数据来源标识 |

### 其他脚本传入

通过环境变量传入：

| 名称 | 说明 |
|:-----|:-----|
| `KEEP_ALIVE_DATA` | 要保存的数据内容 |
| `KEEP_ALIVE_SOURCE` | 数据来源标识 |

## 数据文件结构

脚本运行后会在 `keep-alive` 分支下生成：

```
data/
  2026-05/
    data-10.txt
    data-13.txt
    ...
  2026-06/
    data-01.txt
    ...
```

### 数据格式

每次运行追加一条记录：

```
[2026-05-11 08:30:01] [XBGame]
👤 用户: testuser | 🏅 等级: LV5
🎉 签到成功！
──────────────────────────────────────────────────
[2026-05-11 09:00:01] [Whois-domain]
✅ 域名 example.com 有效期剩余 365 天。
──────────────────────────────────────────────────
[2026-05-11 10:00:01] [GLaDOS]
📋 账号 1: te*****@gmail.com | 签到成功 | 剩余 365 天
──────────────────────────────────────────────────
```

## 运行开关

| 变量名 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `ENABLE_ALL` | 启用 | 全局总开关 |
| `ENABLE_KEEP_ALIVE` | 启用 | 本脚本开关 |

## Workflow 执行流程

```
1. 检查运行开关 → 是否跳过
2. Checkout 仓库
3. 切换到 keep-alive 分支（不存在则创建）
4. 设置 Node.js 22
5. 执行更新脚本
   ├── 读取环境变量 KEEP_ALIVE_DATA / KEEP_ALIVE_SOURCE
   ├── 使用北京时间确定日期
   ├── 创建 data/YYYY-MM/ 目录
   └── 追加写入 data-DD.txt
6. Commit 并推送到 keep-alive 分支
```

## 数据来源标识

| 来源 | 触发方式 | 说明 |
|:-----|:---------|:-----|
| `keep-alive` | 定时 / 手动 | 每 3 天自动保活，或手动触发 |
| `XBGame` | XBGame workflow 自动推送 | 每日签到结果 |
| `Whois-domain` | Whois-domain workflow 自动推送 | 每日域名监控结果 |
| `GLaDOS` | GLaDOS workflow 自动推送 | 每日签到结果 |

## 接入其他脚本

如需将其他脚本的运行结果归档，在对应 workflow 中添加：

```yaml
- name: Save result to keep-alive branch
  if: always()
  run: |
    git fetch origin keep-alive 2>/dev/null || true
    if git show-ref --verify --quiet refs/remotes/origin/keep-alive; then
      git checkout -B keep-alive origin/keep-alive
    else
      git checkout -B keep-alive
    fi
    export KEEP_ALIVE_DATA="$(cat /tmp/script-output.txt)"
    export KEEP_ALIVE_SOURCE="YourScript"
    node keep-alive/update.js
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add "data/"
    git diff --staged --quiet || git commit -m "📝 数据归档 $(date +'%Y-%m-%d')"
    git push origin keep-alive
```
