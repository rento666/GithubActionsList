<div align="center">
<h1 align="center">仓库保活+数据归档(周期：每3天) </h1>
</div>

## 功能说明

1. **保活**：GitHub 会在仓库 60 天无活动后自动禁用定时 Workflow，本脚本通过定期向 `keep-alive` 分支推送数据保持仓库活跃
2. **数据归档**：接收其他脚本（XBGame 签到、域名监控等）传来的运行结果，统一保存到 `keep-alive` 分支

## 环境变量列表

| 名称              | 必填  | 默认值                              | 说明                                     |
|:------------------|:-----:|:-----------------------------------:|:----------------------------------------:|
| `KEEP_ALIVE_DATA` | no    | 🔄 Auto keep-alive tick at \<ISO\>  | 要保存的数据内容，支持外部传入任意文本      |
| `KEEP_ALIVE_SOURCE` | no  | keep-alive                          | 数据来源标识，用于区分不同脚本              |

## 数据文件

脚本运行后会在 `keep-alive` 分支下生成：

```
data/
  2026-05/
    data-10.txt
    data-13.txt
    ...
```

每次运行追加一条记录，格式：

```
[2026-05-10 08:00:01] [XBGame]
👤 用户: xxx | 🏅 等级: xxx
🎉 签到成功！
──────────────────────────────────────────────────
[2026-05-10 09:00:01] [Whois-domain]
✅ 域名 example.com 有效期剩余 365 天。
──────────────────────────────────────────────────
```

## 数据来源

| 来源标识 | 触发方式 | 说明 |
|:---------|:---------|:-----|
| `keep-alive` | 定时 / 手动 | 每3天自动保活，或手动触发 |
| `XBGame` | XBGame workflow 自动推送 | 每日签到结果 |
| `Whois-domain` | Whois-domain workflow 自动推送 | 每日域名监控结果 |

> 💡 其他脚本如需接入，在对应 workflow 中添加 "Save result to keep-alive branch" 步骤，设置 `KEEP_ALIVE_DATA` 和 `KEEP_ALIVE_SOURCE` 环境变量即可。

## 运行开关

本脚本支持通过 Repository Variables 控制是否自动运行：

| 名称 | 类型 | 默认值 | 说明 |
|:-----|:----:|:------:|:-----|
| `ENABLE_ALL` | Variable | 未设置（即启用） | 全局总开关，设为 `false` 时所有脚本停止定时运行 |
| `ENABLE_KEEP_ALIVE` | Variable | 未设置（即启用） | 本脚本开关，设为 `false` 时仅本脚本停止定时运行 |

> 💡 开关仅影响 **定时触发**，手动触发不受开关限制。

## 手动触发

在 Actions 页面选择 `Keep Alive` workflow，点击 `Run workflow` 可输入自定义数据和来源标识。
