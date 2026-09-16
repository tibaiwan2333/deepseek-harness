# 疑难解答

按报错原文或现象索引。先讲通用排查思路，再列具体报错。

## 通用排查思路（三步法）

1. **找第一条 Error**。构建/启动的报错输出往往很长，只有第一条 `Error:` 是根因，后面全是连锁反应。往上翻，找到最早那行。
2. **给错误分类**：
   - `MODULE_NOT_FOUND` / `Cannot find module` → 没编译或文件缺失
   - `ECONNRESET` / `ETIMEDOUT` / `Timeout awaiting 'request'` → 网络问题（换镜像/代理）
   - `not in allowed list` / `service ID does not exist` / 401 → 模型名或凭据问题
   - `EADDRINUSE` / `already owned` → 端口/文件被占用
3. **确认改动已生效**：配置文件改完先刷新页面（前端有缓存），程序层面先重启再深查。

## 环境

### pnpm install 直接崩溃 / 语法错误

Node 版本太旧。本仓库要求 `^22.19 || >=24`（Node 20 及以下不行）。升级后**重开终端**再用 `node -v` 确认。

### pnpm install 网络错误 / 长时间卡住

配置 npm 镜像：`npm config set registry https://registry.npmmirror.com`（国内）或检查代理设置，然后重跑。

### `Unsupported platform: wanted {"os":["darwin"|"linux"]...}`

**不是错误。** 其他操作系统的可选原生模块被跳过的正常提示，继续即可。

## 启动 / 运行

### `ERR_MODULE_NOT_FOUND` / 找不到模块

没编译或编译未完成。运行 `pnpm run build`，看到 `build: recorded NNN client artifact(s)` 再启动。

### 浏览器空白 / 打不开页面

- `pnpm dsh web` 是前台服务，终端窗口关了服务就停了——确认它还在跑
- 访问地址必须带启动日志里的 `?token=...` 参数
- 端口 3080 被其他程序占用时（报 `EADDRINUSE`）：结束占用进程，或查仓库文档更换端口配置

### 发消息报 `The service ID does not exist...` 或 `model xxx not in allowed list`

模型名与凭据问题，两个报错的区别与处理见 [02-model-config.md](02-model-config.md) 的速查表。核心检查顺序：模型名是否与服务端白名单一字不差 → 默认模型配置是否漏配 → key 是否有该模型权限。

### `SessionAlreadyOwnedError: session ... is already owned by an active write handle`

**同一时间运行了两个 harness 实例**（例如网页版和桌面版同时开着，或开了两个网页版）。会话文件有写锁保护，先启动的实例持有锁。

处理：只保留一个实例——关闭不再使用的那个程序即可。找不到残留进程时（如网页版在后台过了夜）：查看 3080 端口的监听进程并结束它：

```powershell
Get-NetTCPConnection -LocalPort 3080 -State Listen   # 看 OwningProcess 列
Stop-Process -Id <上一步的PID>
```

```sh
lsof -ti :3080 | xargs kill    # macOS/Linux
```

锁随进程退出自动释放，另一端**不需要重启**。

## 打包

### payload smoke 报 `Cannot find module '<原生模块名>'`

第 3 阶段（原生模块自检）失败。两种可能：

1. C++ 构建工具缺失 → 该模块没编译出来，检查 Visual Studio / Xcode 工具
2. 该模块已被仓库代码移除、但自检脚本仍引用它 → 仓库自身 bug（多发于刚重构过的仓库），到上游提 issue，或本地临时把对应检查项从自检脚本中删掉

### `Timeout awaiting 'request' for 600000ms` / `ECONNRESET`（打包后段）

electron-builder 从 GitHub 下载 Electron / NSIS 等资源超时。配置镜像环境变量后重跑：

```sh
export ELECTRON_MIRROR='https://npmmirror.com/mirrors/electron/'
export ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
export NPM_CONFIG_ELECTRON_BUILDER_BINARIES_MIRROR=$ELECTRON_BUILDER_BINARIES_MIRROR
```

```powershell
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
$env:NPM_CONFIG_ELECTRON_BUILDER_BINARIES_MIRROR = $env:ELECTRON_BUILDER_BINARIES_MIRROR
```

三个变量都设；已下载的部分有缓存，重跑会从断点附近继续。

### 安装包双击弹"未知发布者"/ macOS 拦截

未签名安装包的正常现象。Windows 点"更多信息 → 仍要运行"；macOS 在"隐私与安全性"里放行。签名流程见官方 `apps/desktop/README.md`。

## Git / GitHub

### push 时弹登录窗口

Git Credential Manager 的首次授权流程：弹浏览器登录 GitHub 后令牌存入系统凭据库，以后不再弹。看到 "Authentication Succeeded" 就是成功。

> 提示：编辑器（如 VS Code 的 GitHub 扩展、设置同步）也会独立弹出 GitHub 认证窗口，与本仓库操作无关；反复弹窗时先检查编辑器里过期的账号。

### 把本地改动推到自己 fork

```sh
git remote add fork https://github.com/<你的用户名>/deepseek-harness.git   # 一次
git push fork master
```

官方仓库与 fork 分别对应 `origin` 与 `fork` 两个远程名，日常拉官方更新用 `git pull origin master`。
