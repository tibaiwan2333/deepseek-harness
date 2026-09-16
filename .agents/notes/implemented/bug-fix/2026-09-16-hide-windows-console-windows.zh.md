# Agent Note: 在命令生成时隐藏 Windows 控制台窗口

Status: implemented

[English](2026-09-16-hide-windows-console-windows.md) | 中文

## 问题

打包版桌面是无控制台的 GUI-subsystem Electron 可执行文件，它通过 console-subsystem 子进程（`powershell.exe`、`cmd.exe` 等）执行每条命令行调用。无控制台的父进程创建的 console-subsystem 子进程会获得一个全新的可见控制台窗口，除非父进程明确要求不创建，因此每次命令调用都会在用户面前弹出 PowerShell 窗口。两条命令路径都受影响：普通 Windows Job runner（current-token 生成）与 ACL 受限 token runner（workspace-write profile，即打包版桌面使用的沙箱路径）。

## 决策

`@deepseek-ai/dsh-win32-process` 的三个生成原语现在都传递 `CREATE_NO_WINDOW`（`0x08000000`，由 `abi.ts` 持有）：

- `spawnPipedProcess` — 管道 stdio 的 restricted-token 生成。
- `spawnInheritedJobProcess` — 继承 stdio 的 restricted-token 生成（`CREATE_SUSPENDED | CREATE_NO_WINDOW`）。
- `spawnCurrentTokenJobProcess` — current-token Job 生成（`CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW`）。

Windows Job runner（`subprocess-local` 的 `launchWindowsJob`）还以 `windowsHide: true` 生成其 runner 子进程，使 runner 自身在任何启动模式下都保持无控制台；桌面 project manager 也以 `windowsHide: true` 生成 `node pnpm`，原因相同。`CREATE_NO_WINDOW` 只影响控制台应用程序；GUI-subsystem 目标不受影响。

先前记录的“`CREATE_NO_WINDOW` 子进程在 DLL 初始化期间以 `STATUS_DLL_INIT_FAILED`（`0xC0000142`）死亡”的限制，在当前 WRITE_RESTRICTED token 下不再复现：其 restricting 列表保留了控制台初始化所需的登录 SID/Everyone 保活组，因此初始化在窗口隐藏的情况下成功。ACL 两种模式（read-only 与 workspace-write）与 Job 路径的真实 runner 运行都带着隐藏窗口标志正常退出（exit 0），与未打补丁的基线一致。包 README 与 ACL 沙箱模块文档现在记录“控制台窗口被抑制”，而非“控制台隔离不可用”；[ACL 沙箱记录](../feature/2026-08-08-windows-acl-restricted-token-sandbox.zh.md) 携带更正后的事实。

## 已考虑的替代方案

**`STARTF_USESHOWWINDOW` 加 `SW_HIDE`。** 隐藏已分配的控制台窗口，而不是抑制其创建；需要新增 `ffi.ts` startup-info 表面，且每条命令都会留下一个隐藏的 conhost。拒绝，因为 `CREATE_NO_WINDOW` 只需一个标志、零 ABI 改动即可完全抑制分配。

**`DETACHED_PROCESS`。** 让子进程脱离任何控制台；子进程将完全没有控制台，这会改变被包裹命令的控制台 API 行为。仅当受限路径以 `0xC0000142` 死亡时才作为回退方案；实际并未发生。

## 后果

打包版桌面每次命令调用弹出的可见 PowerShell/控制台窗口消失了；被包裹命令的控制台 API 行为不变，因为子进程仍然获得控制台，只是没有窗口。验证依据：构造标志（在 win32-process 单元测试中断言）、退出码——ACL 两种模式与 Job 路径的真实 runner 运行在补丁前后均无 `0xC0000142`——以及标准的 `CREATE_NO_WINDOW` 语义；窗口可见性本身在本开发环境中无法测量（控制台窗口在那里以隐藏方式创建），以先前打包链路复现的可见目标窗口（`MainWindowHandle` ≠ 0）作为补丁前证据。已安装的构建必须重新打包并重新安装，修复才能到达用户。
