# DeepSeek Harness 上手指南

面向首次接触本项目的开发者的中文实操文档：从拉取代码到界面跑起来，以及可选的桌面安装包制作。命令与报错处理均以仓库官方文档（`docs/`、`apps/desktop/README.md`）为准并经真实环境验证；官方文档更新时以官方文档为准。

## 文档目录

| 文档 | 内容 |
|---|---|
| [01-run-from-source.md](01-run-from-source.md) | **必读**：环境要求 → 拉取 → 安装 → 编译 → 启动 → 验证 |
| [02-model-config.md](02-model-config.md) | 配置模型访问：官方 API（推荐）或任意 OpenAI 兼容接口 |
| [03-desktop-package.md](03-desktop-package.md) | 可选：打包 Windows/macOS 桌面安装包 |
| [04-faq.md](04-faq.md) | 常见报错的原因与处理，附通用排查思路 |
| [05-console-window-fix-log.md](05-console-window-fix-log.md) | 修复日志：命令行不再弹 PowerShell 窗口（根因与 4 处改动） |
| [06-new-machine-setup.md](06-new-machine-setup.md) | **换新电脑**：从拉取 fork 代码到用上 AI 的完整步骤与详细配置 |

## 最短路径

满足环境要求（Node.js `^22.19 || >=24`、pnpm ≥ 11）后，整个流程是：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
# 配置 API key 后（见 02-model-config.md）
pnpm dsh web        # 浏览器打开 http://127.0.0.1:3080
```

每一步"成功的样子"和失败处理见 [01-run-from-source.md](01-run-from-source.md)。

换新电脑时直接按 [06-new-machine-setup.md](06-new-machine-setup.md) 走：从拉取 fork 代码开始，含完整模型配置与数据迁移清单。

## 命令写法约定

本文档命令以 POSIX shell（macOS/Linux/Git Bash）为主，Windows PowerShell 差异在每处单独标注：

| 场景 | POSIX | PowerShell |
|---|---|---|
| 设环境变量（单次） | `VAR=value command` | `$env:VAR = 'value'; command` |
| 路径分隔符 | `/` | `\`（多数工具两者都接受） |

## 适用环境

- 操作系统：Windows 10/11、macOS、Linux（CI 覆盖 Node 22.19 / 24 / 26 三个版本）
- Node.js：`^22.19 || >=24`——**Node 20 及以下无法使用**
- 包管理器：pnpm ≥ 11
- 磁盘空间：源码约 1 GB，加上依赖与编译产物建议预留 5 GB
