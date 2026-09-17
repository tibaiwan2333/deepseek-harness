# 05 修复日志：命令行不再弹出 PowerShell 窗口

> 日期：2026-09-16 · 分支：`fix/hide-windows-console-windows`
> 已推送至 fork：https://github.com/tibaiwan2333/deepseek-harness （分支同名）
> 发起 PR：https://github.com/tibaiwan2333/deepseek-harness/pull/new/fix/hide-windows-console-windows

## 问题现象

打包安装的 DeepSeek Harness（GUI 程序）每次调用命令行（如 `pnpm run`、shell 工具执行命令）时，都会闪现一个 PowerShell/控制台窗口。

## 根本原因

Windows 的 `CreateProcess` 规则：**无控制台的进程（GUI 子系统）派生的控制台子系统子进程，会自动分配一个新的可见控制台窗口**，除非显式传入 `CREATE_NO_WINDOW`（0x08000000）标志。

桌面宿主是 GUI 子系统进程，自身没有控制台；它派生的 `node.exe` / `powershell.exe` 等控制台程序因此每次都"自带"一个可见窗口。子进程仍然正常执行——只是多了个窗口。

## 修复方案（源码 4 处）

| 位置 | 改动 |
|---|---|
| `packages/subprocess/win32-process/src/abi.ts` | 新增导出 `CREATE_NO_WINDOW = 0x08000000` |
| `packages/subprocess/win32-process/src/process.ts` | 三条 spawn 路径全部加上 `CREATE_NO_WINDOW`：管道模式、继承 Job 模式、当前令牌 Job 模式 |
| `packages/subprocess/subprocess-local/src/windows-job.ts` | Job runner 的 spawn 加 `windowsHide: true` |
| `apps/desktop/src/project-manager.ts` | pnpm 子进程的 spawn 加 `windowsHide: true`（原本弹窗的主要来源） |

配套：更新了三个包的 README（中英）、新增 Agent Note（`bug-fix/2026-09-16-hide-windows-console-windows`）、修正了旧的 windows-acl 功能说明中"控制台隔离不可用"的过时描述，并同步更新了相关测试断言。

## 验证

1. **单元断言**：三个 spawn 路径的 creationFlags 含 `CREATE_NO_WINDOW`（测试通过）。
2. **真实 runner 实测**：两种 ACL 模式（read-only / workspace-write）及 Job 路径下 spawn `cmd.exe`，退出码 0，无 `0xC0000142`（`STATUS_DLL_INIT_FAILED`）。
3. **打包产物验证**：解开安装包 `app.asar`，三处标志在位；用包内自带 node 运行时 + 包内 koffi + 包内 ACL runner 端到端跑通两种 ACL 模式。
4. **安装后验证**：已安装应用文件与打包产物 SHA256 一致；用已安装应用自身的运行时端到端实测通过。
5. **用户目视验收**：触发沙箱两种模式 + project-manager 同款 `node + pnpm` 调用，全程**无任何控制台弹窗** ✅

> 说明：`CREATE_NO_WINDOW` 只隐藏窗口，子进程仍持有控制台，控制台 API 行为不变；该标志对 GUI 子进程无效，不影响图形界面程序。

## 提交与推送

- 提交信息：`fix(subprocess): suppress Windows console windows on command spawn`
- 23 个文件，+127 / -32
- pre-commit（翻译配对 / lint / 空白 / vendor guard）与 pre-push（`pnpm run typecheck`）全部通过
- 已推送至 fork 分支 `fix/hide-windows-console-windows`

## 后续

如需合入上游，用上面的链接在 GitHub 上对 `deepseek-ai/deepseek-harness` 发起 PR 即可（本机未装 `gh`，未代创建）。
