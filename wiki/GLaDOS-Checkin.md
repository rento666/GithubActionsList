<div align="center">
<h1>🔬 GLaDOS 自动签到</h1>
</div>

---

## 功能说明

- 自动完成 GLaDOS 每日签到续期
- 支持多账号签到（Cookie 用换行符分隔）
- 签到后查询账号状态：邮箱、剩余天数、积分、套餐信息
- 邮箱自动脱敏显示
- 运行结果自动归档到 keep-alive 分支

## 运行周期

| 触发方式 | 时间 | 说明 |
|:---------|:-----|:-----|
| 定时触发 | 每天北京时间 08:30 | `cron: '30 0 * * *'` |
| 手动触发 | 随时 | Actions → Run workflow |
| Push 触发 | 推送时 | 修改 `GLaDOS/**` 或 `utils/**` 路径 |

## 环境变量

### 必填

| 名称 | 类型 | 说明 |
|:-----|:-----|:-----|
| `GLA_COOKIE` | Secret | GLaDOS 账号 Cookie，多账号用换行符分隔 |

### 可选

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:-----|:-------|:-----|
| `GLA_NOTIFY_SUCCESS` | Variable | false | 签到成功时发送邮件 |
| `GLA_NOTIFY_ERRORS` | Variable | false | 签到失败时发送邮件 |

## 获取 Cookie

1. 登录 [GLaDOS](https://glados.rocks)
2. 打开浏览器开发者工具（F12）→ **Network** 标签页
3. 刷新页面，找到任意请求
4. 复制请求头中 `Cookie` 的完整值

### 多账号配置

将多个 Cookie 用换行符分隔填入 `GLA_COOKIE`：

```
cookie1_value_here
cookie2_value_here
cookie3_value_here
```

## 运行开关

| 变量名 | 默认值 | 说明 |
|:-------|:-------|:-----|
| `ENABLE_ALL` | 启用 | 全局总开关 |
| `ENABLE_GLADOS` | 启用 | 本脚本开关 |

## Workflow 执行流程

```
1. 检查运行开关 → 是否跳过
2. Checkout 仓库
3. 设置 Node.js 22
4. 安装依赖 (axios, nodemailer)
5. 执行签到脚本 → 输出到 /tmp/script-output.txt
   ├── 逐个 Cookie 签到
   ├── 查询账号状态（邮箱、剩余天数）
   ├── 查询积分和套餐
   └── 汇总结果
6. 保存结果到 keep-alive 分支
7. 检查脚本执行结果 → 标记成功/失败
```

## 输出示例

```
🚀 GLaDOS 签到结果
────────────────────────────────────────
📋 账号 1:
   邮箱: te*****@gmail.com
   签到: 签到成功
   剩余: 365 天
   积分: 1500
   套餐: Plan_A(365天/500分), Plan_B(180天/300分)
```

## API 接口

脚本调用以下 GLaDOS 接口：

| 接口 | 方法 | 说明 |
|:-----|:-----|:-----|
| `/api/user/checkin` | POST | 执行签到 |
| `/api/user/status` | GET | 获取账号状态 |
| `/api/user/points` | GET | 获取积分信息 |
