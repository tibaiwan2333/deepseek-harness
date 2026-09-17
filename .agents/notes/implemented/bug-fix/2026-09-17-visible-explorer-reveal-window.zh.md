# Agent Note: Explorer reveal keeps its window visible

Status: implemented

[English](2026-09-17-visible-explorer-reveal-window.md) | 中文

## 问题

桌面 UI 对已交付文件的"在文件资源管理器中显示"操作在 Windows 上看起来毫无反应：卡片显示"已请求在文件管理器中显示"，但没有出现任何文件资源管理器窗口。每个处理失败路径都会改变卡片状态文本，因此"点了没用"指向原生 spawn 步骤，而非请求链路——链路可证已到达宿主并返回成功。

## 决策

`@deepseek-ai/dsh-native-command` 的 `runNativeCommand` 在 `NativeCommandRunner` 边界上新增可选按调用参数 `{ windowsHide?: boolean }`，默认 true。`revealNativePath` 对它的 Explorer 调用（win32 与 WSL）传入 `{ windowsHide: false }`，使选中窗口保持可见。

根本原因是 Node `execFile` 的 `windowsHide: true`——运行器此前的无条件默认。Node 将该标志映射为子进程启动信息中的 `STARTF_USESHOWWINDOW` 与 `SW_HIDE`，Explorer 会据此把窗口创建为隐藏。随后 `explorer.exe /select,<文件 URI>` 在委托给 shell 后以退出码 1 结束，reveal 把该退出码当作已转交处理——于是报告成功，实际什么都没显示。实测中，同样的 argv（分开的 `/select,` 与编码文件 URI 两个参数）在不带隐藏标志时能弹出文件资源管理器窗口，带上隐藏标志时从不弹出。

[控制台隐藏决策](2026-09-16-hide-windows-console-windows.zh.md)用 `CREATE_NO_WINDOW` 管理 `@deepseek-ai/dsh-win32-process` 中的控制台子系统 spawn；本变更是对 `dsh-native-command` 运行器的对应补充——GUI 桌面目标必须退出隐藏标志。[open-anywhere 目录](../feature/2026-08-25-promote-open-anywhere-plugin.zh.md) 已记录同样的不可靠性——直接 spawn `explorer.exe <dir>` 不能可靠地弹出窗口——并用 `shell-open` 绕过；交付物 reveal 路径没有这种变通。

单元测试固定按调用设置的标志：Explorer 调用携带 `{ windowsHide: false }`，PowerShell `Invoke-Item` 打开路径与 `wslpath` 保持隐藏默认，特殊字符与 WSL 转换用例与 argv 一起断言该标志。包 README 记录了这一覆盖项。

## 已考虑的替代方案

**仅对控制台子系统目标隐藏窗口。** 否决：检测子系统需要运行器本不需要的机制；按调用传入选项与 Node 自身 `execFile` 的用语一致，由每个调用方决定其命令必须显示什么。

**将运行器默认改为 `windowsHide: false`。** 否决：其他所有命令的瞬时控制台窗口会重新出现，回退控制台隐藏修复。

**在运行器 seam 之外（detached）spawn Explorer。** 否决：会失去中止传播、退出码 1 转交接受与注入运行器的测试 seam。

## 后果

Windows 与 WSL 上的文件资源管理器 reveal 会弹出可见的选中窗口。所有其他命令保持隐藏瞬时控制台。Explorer 退出码 1 仍按已转交请求处理，reveal 路径上不再存在"隐藏窗口伪装成成功"的失败模式。与控制台隐藏修复一样，已安装的构建必须重新打包并重装，修复才能到达用户。
