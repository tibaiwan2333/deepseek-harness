# 从源码运行

目标：拿到代码 → 装好工具链 → 编译 → 在浏览器里使用。每一步都给出"成功的样子"，逐项核对再前进。

## 1. 准备工具链

检查三样工具的版本：

```sh
node -v    # 需要 v22.19+，推荐 v24 LTS
pnpm -v    # 需要 11+
git --version
```

缺什么装什么：

- **Node.js**：https://nodejs.org 下载 LTS 安装包（Windows 用 .msi，macOS 用 .pkg），装完重开终端。Node 20 及以下不满足要求，`pnpm install` 会直接失败
- **pnpm**：装好 Node 后执行 `npm install -g pnpm`（或 `corepack enable`，Node 自带 corepack 时推荐后者）
- **Git**：https://git-scm.com 下载；Windows 安装时保持默认选项即可（自带 Git Bash）

> 国内网络建议同时配置 npm 镜像加速依赖下载：`npm config set registry https://registry.npmmirror.com`。这是可选步骤，不影响功能。

## 2. 拉取代码

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
```

## 3. 安装依赖

```sh
pnpm install
```

- 耗时：几分钟到十几分钟（视网速，总量 1–2 GB）
- **成功的样子**：输出 `Done in XXXs`，无 `ERR_` 错误
- **可以忽略的警告**：`Unsupported platform: wanted {"os":["darwin"]...}` 等——这是其他操作系统的可选原生模块被跳过，属正常现象

## 4. 编译

```sh
pnpm run build
```

TypeScript 源码（`.ts`）不能被 Node 直接执行，build 将其编译为 JavaScript 并输出到各包的 `lib/` 目录，同时打包浏览器前端。**跳过此步，启动时会报"找不到模块"。**

- 耗时：约 5–15 分钟（视机器性能，两百多个包逐个编译）
- **成功的样子**：结尾输出 `build: recorded NNN client artifact(s)`（N 是包数量），无 error
- **可以忽略的警告**：`chunk larger than 500 kB` 之类体积提示

## 5. 配置模型访问

程序需要 API key 才能调用模型（界面、Agent 功能都依赖它）。**推荐直接用 DeepSeek 官方 API**：

在**仓库根目录**创建 `.env` 文件（该文件被 `.gitignore` 排除，不会被提交）：

```sh
DEEPSEEK_API_KEY=sk-你的key
```

- key 在 https://platform.deepseek.com 创建（这是官方唯一约定；key 属于敏感凭据，不要写进代码或提交到 git）
- 使用其他 OpenAI 兼容服务（中转站、私有部署网关）的，看 [02-model-config.md](02-model-config.md)

## 6. 启动

```sh
pnpm dsh web
```

- **成功的样子**：

  ```
  dsh web: http://127.0.0.1:3080/?token=一串随机字符
  dsh web: opening the default browser; pass --no-open to disable
  ```

- 浏览器自动打开聊天界面；没弹的话手动访问日志里那行完整地址。**`?token=` 参数必须保留**——它是本机访问令牌，防止同一网络里的其他设备访问你的界面
- 该命令是前台进程：`Ctrl+C` 或关终端即停止服务，配置不会丢失

## 7. 验证

在输入框发送一句"你好"，模型正常流式回复即完成。

首次使用在界面的 Settings → Models 里确认选中的模型（官方 API 默认 `deepseek-v4-pro`）。若报 `service ID does not exist` 之类的错误，说明当前选的模型名服务端不认识，见 [04-faq.md](04-faq.md)。

## 日常使用

之后每次使用只需两步：

```sh
cd deepseek-harness
pnpm dsh web
```

配置（key、模型选择等）持久化在用户主目录的 `.dsh/` 下，与代码目录无关，重新克隆代码也不需要重新配置。

## 使用注意

**同一时间只运行一个实例。** `pnpm dsh web` 与桌面版共用同一份会话存储，会话文件有写锁保护：两个实例同时运行时，后启动的一端会报 `SessionAlreadyOwnedError`。遇到该错误先关闭另一端程序（详见 FAQ）。

## 其他启动形态（可选）

仓库还提供几种无需浏览器的运行方式（都要求先 build、配 key）：

```sh
pnpm dsh --profile headless "任务描述"    # 一次性 Agent 任务，结果直接输出到终端
pnpm run demo:ptc -- "任务描述"           # PTC 模式演示
```
