# 06 换新电脑：从拉取代码到用上 AI 的完整步骤

> 适用：Windows 新电脑（macOS/Linux 差异在每处标注）。从**拉取代码**开始，一步步到界面跑起来、能对话。
> 本文档随仓库走：新电脑 clone 下来后，`guide/06-new-machine-setup.md` 就是它。所有命令都经真实环境验证。
> 我的 fork：`https://github.com/tibaiwan2333/deepseek-harness.git`（弹窗修复、本指南都在这里）。

---

## 0. 一次性准备（装三样东西）

| 软件 | 怎么装 | 验证 |
|---|---|---|
| Git | 装 Git for Windows（https://git-scm.com） | `git --version` |
| Node.js | 装 **Node 24 LTS**（https://nodejs.org） | `node -v` → v24.x（**Node 20 及以下跑不了**，要求 `^22.19 || >=24`） |
| pnpm | `npm install -g pnpm`（或 `corepack enable` 后用 corepack） | `pnpm -v` → ≥ 11 |

> 镜像加速（网络慢时可选）：`pnpm config set registry https://registry.npmmirror.com`

## 1. 拉取代码（从这里开始）

```sh
git clone https://github.com/tibaiwan2333/deepseek-harness.git
cd deepseek-harness
git checkout fix/hide-windows-console-windows
git branch --show-current    # 应显示 fix/hide-windows-console-windows
```

**为什么切分支**：命令行不再弹 PowerShell 窗口的修复只在这个分支上（`master` 没有）。日常开发/使用都用这个分支。

## 2. 安装依赖

```sh
pnpm install
```

- 首次较慢（几千个包）；会顺带装好 lefthook 钩子
- 源码 + 依赖 + 编译产物建议预留 5 GB 磁盘

## 3. 编译

```sh
pnpm run build
```

- 无报错结束即成功
- `chunk larger than 500 kB` 之类的体积提示可以忽略

## 4. 配置 key（三选一）

关键概念：**`$DSH_HOME` = `C:\Users\<你的用户名>\.dsh\`**，源码版和安装版共用这一份。key 的优先级：

```
启动环境变量（export 的） > C:\Users\<你>\.dsh\.credentials.yaml（界面存的）
> 仓库根 .env > C:\Users\<你>\.dsh\.env
```

- **方式 A（新电脑最常用）**：仓库根目录建 `.env`（已被 gitignore，不会提交）：

  ```sh
  DEEPSEEK_API_KEY=sk-你的key
  ```

  填好后源码运行自动读取。key 在 https://platform.deepseek.com 创建（官方 API）或向中转服务商索取。
- **方式 B（最省事，推荐有旧电脑时）**：把旧电脑 `C:\Users\<旧用户名>\.dsh\` **整个目录拷过来**到新电脑同位置——key、模型配置、历史会话全带走，第 5 步都不用做了。
- **方式 C**：启动后在界面 Settings → Models 里存（自动写入 `.credentials.yaml`）。

## 5. 模型配置（详细配置，直接抄）

### 5.1 用官方 API

内置默认模型 `deepseek-v4-pro`，**什么都不用配**。第 4 步配好 key 即可。

### 5.2 用第三方中转（我现在的配置）

把下面**整个内容**保存为 `C:\Users\<你的用户名>\.dsh\settings.yaml`（目录不存在就手动建；程序首次启动也会自动建）：

```yaml
llm-deepseek:
  protocol: chat-completions
  baseURL: https://tokenhub.tencentmaas.com/v1
  models:
    - id: deepseek-v4-pro-0813
      name: deepseek-v4-pro-0813
      description: Relay deepseek-v4-pro-0813, strong reasoning and coding
      contextWindow: 128000
      maxTokens: 65536
    - id: glm-5.3-flash
      name: glm-5.3-flash
      description: Relay glm-5.3-flash, fast and economical
      contextWindow: 128000
      maxTokens: 16384
    - id: deepseek-v4-flash-0731
      name: deepseek-v4-flash-0731
      description: Relay deepseek-v4-flash-0731, fast and economical
      contextWindow: 128000
      maxTokens: 65536
ui-onboarding:
  welcomeNoticeVersion: 2026-08-13.1

agent-default-model:
  provider: deepseek-official
  model: deepseek-v4-flash-0731
  reasoningEffort: high
```

要点（两个配置是独立的，最容易搞混）：

- `llm-deepseek.models` = **目录**：界面下拉"能选哪些"；`id` 必须与中转白名单**一字不差**
- `agent-default-model` = **默认值**：新会话"实际用哪个"；不配时用内置默认名，中转上通常不存在 → 报 `service ID does not exist`
- `baseURL` 写到 `/v1` 为止，harness 自动补全路径
- 保存即**热重载**，改完**刷新页面**即可，不用重启

改模型最省事的方式：界面模型选择器手动选一次，会自动写回 `agent-default-model`。

## 6. 启动

```sh
pnpm dsh web
```

成功的样子：

```
dsh web: http://127.0.0.1:3080/?token=一串随机字符
dsh web: opening the default browser; pass --no-open to disable
```

- 浏览器自动打开聊天界面；没弹就手动访问日志里那行完整地址
- **`?token=` 参数必须保留**——本机访问令牌，防止同一网络其他设备访问你的界面
- 前台进程：`Ctrl+C` 停止，配置不丢失

## 7. 验证

输入框发一句"你好"，模型正常流式回复即完成。

报错处理：先看 [04-faq.md](04-faq.md) 速查表（`service ID does not exist` / `not in allowed list` / 401 / 改了没生效）。

## 日常使用

```sh
cd deepseek-harness
pnpm dsh web            # 界面（每次只需这两步）
```

命令行跑一次性任务：

```sh
pnpm dsh --profile headless "任务描述"
```

## 数据迁移清单（换机必看）

| 东西 | 位置 | 怎么带 |
|---|---|---|
| key + 模型 + 历史会话 | `C:\Users\<旧用户名>\.dsh\`（`.credentials.yaml`、`settings.yaml`、`.env`、`sessions\`、`storages\`、`profiles\`） | **整个目录拷到新电脑同位置**，一次全带走 |
| 仓库根 `.env` | 仓库根目录（gitignore，不在 git 里） | 手动重建或直接拷文件 |
| 源码 | 我的 fork | `git clone` 即可（本指南也在里面） |
| 界面缓存 | `%APPDATA%\@deepseek-ai\dsh-desktop\` | 不用带（纯缓存） |

> 安装版桌面应用（可选）：需要时看 [03-desktop-package.md](03-desktop-package.md) 打包；安装版与源码版共用 `~/.dsh\` 配置，但**不读仓库根 `.env`**（它读 `<安装目录>/.env` 和 `$DSH_HOME\.env`）。

## 常见坑速查

| 坑 | 处理 |
|---|---|
| Node 20 及以下 | 升级到 Node 24 LTS（引擎要求 `^22.19 || >=24`） |
| 命令行弹 PowerShell 窗口 | 说明在 `master` 分支；切到 `fix/hide-windows-console-windows` |
| key 报 401 / invalid | 检查 `.env` 别混入空格；确认用的是真实 key |
| `service ID does not exist` | 模型名与中转白名单不一致；检查 `agent-default-model` |
| 改了 settings.yaml 没生效 | 刷新页面（前端有缓存）；仍不行重启 |
| 中转模型名记不准 | 先用 curl 验证（见 [02-model-config.md](02-model-config.md) 第 64 行起） |
