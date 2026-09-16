# 打包桌面安装包

把 harness 打成各操作系统的桌面应用安装包（内含 Electron 与 Node.js 运行时，**安装机器无需预装 Node**）。本文只覆盖本地测试常用的未签名打包；签名发布、自动更新等完整流程见 `apps/desktop/README.md`（官方权威文档）。

## 前置条件

1. 已完成 [01-run-from-source.md](01-run-from-source.md) 的第 1–4 步（工具链 + 依赖 + build）
2. **原生模块编译工具**（打包过程要现场编译原生模块，缺了会失败）：
   - Windows：Visual Studio 2019+ 的 "使用 C++ 的桌面开发" 工作负载 + Python 3（在 PATH 里；不在则按官方 README 的说明用 `PYTHON` 环境变量指定）
   - macOS：Xcode Command Line Tools（`xcode-select --install`）
3. 磁盘空间：额外预留 3–5 GB（Electron、运行时、中间产物）

## Windows 安装包（.exe）

每个打包目标都要求一个反向域名格式的应用 ID（`DSH_DESKTOP_APP_ID`）。**POSIX shell**：

```sh
DSH_DESKTOP_APP_ID=com.example.dsh-desktop pnpm run package:desktop:win:x64:unsigned
```

**PowerShell**（注意 `$env:` 写法）：

```powershell
$env:DSH_DESKTOP_APP_ID = 'com.example.dsh-desktop'
pnpm run package:desktop:win:x64:unsigned
```

`com.example.dsh-desktop` 换成你自己的标识即可（格式：反向域名，字母数字点连字符）。

- 耗时：首次 15–30 分钟；各阶段有缓存，重跑明显加快
- **成功的样子**：产物出现在 `apps/desktop/.desktop-build/targets/win-x64/unsigned-artifacts/` 下，是一个 `deepseek-harness-<版本>-win-x64.exe`（NSIS 安装程序，约 150–200 MB）
- 双击安装（默认装到用户目录，无需管理员权限）；"unsigned" = 未签名，Windows 会弹"未知发布者"警告，属正常现象，点"仍要运行"即可（签名需要 EV 代码签名证书，本地测试不需要）

## macOS 安装包（.dmg / .zip）

```sh
DSH_DESKTOP_APP_ID=com.example.dsh-desktop pnpm run package:desktop:mac:arm64   # Apple Silicon
DSH_DESKTOP_APP_ID=com.example.dsh-desktop pnpm run package:desktop:mac:x64     # Intel
```

产物在 `apps/desktop/.desktop-build/targets/<target>/` 下。仅本地自用时，macOS 可能拦截"未公证"应用：系统设置 → 隐私与安全性 → 仍要打开。（官方 README 的完整 mac 打包还需要签名身份与公证凭据，那是发布流程的要求，本地测试打包不强制。）

## 其他变体

| 命令 | 说明 |
|---|---|
| `pnpm run package:desktop:win:x64:dir` | 只产出免安装目录（win-unpacked），速度最快，适合快速验证 |
| `pnpm run package:desktop:dir` | 当前平台免安装目录 |

## 打包流程在做什么

理解阶段划分有助于定位失败点：

1. 重编译全部包的生产版本（复用缓存）
2. 把每个包打成 npm tarball 并收集出运行时依赖树
3. **payload smoke**：用内置 Node 运行时加载全部原生模块做自检（koffi、sharp、node-pty 等）——这一步报错通常是原生模块没编译成功
4. 下载 Electron 与对应 Node.js 运行时——网络环境不佳时可能超时，重跑或配置 `ELECTRON_MIRROR` 镜像环境变量
5. electron-builder 组装应用目录并生成安装包——最后一步要下载 NSIS 等打包工具（Windows），同样可能遇到网络超时，可配置 `ELECTRON_BUILDER_BINARIES_MIRROR` 镜像变量

## 打包失败怎么办

- 记下**第一条** `Error:` 行（后面的都是连锁报错）
- 报 `Cannot find module '<某原生模块>'`（第 3 阶段）→ 原生模块问题，检查 C++ 构建工具；若该模块已被仓库移除但仍被自检脚本引用，说明是仓库自身问题，到上游提 issue
- 报 `Timeout awaiting 'request'` / `ECONNRESET`（第 4–5 阶段）→ 网络问题，用上面的镜像环境变量重跑
- 中断后直接原命令重跑即可，有缓存的阶段会自动跳过
