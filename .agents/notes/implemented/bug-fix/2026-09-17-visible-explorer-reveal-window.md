# Agent Note: Explorer reveal keeps its window visible

Status: implemented

English | [中文](2026-09-17-visible-explorer-reveal-window.zh.md)

## Problem

The desktop UI's reveal-in-Explorer action on a presented file appeared to do nothing on Windows: the card reported "已请求在文件管理器中显示" but no Explorer window ever appeared. Every handler failure path changes the card status text, so a silent no-op pointed at the native spawn step rather than at the request chain, which provably reached the host and returned success.

## Decision

`runNativeCommand` in `@deepseek-ai/dsh-native-command` gained an optional per-call `{ windowsHide?: boolean }` option on the `NativeCommandRunner` boundary, defaulting to true. `revealNativePath` passes `{ windowsHide: false }` for its Explorer invocations (win32 and WSL) so the selection window stays visible.

The root cause was Node's `execFile` `windowsHide: true` — the runner's previous unconditional default. Node maps the flag to `STARTF_USESHOWWINDOW` with `SW_HIDE` in the child's startup info, and Explorer honours it by creating its window hidden. The `explorer.exe /select,<file URI>` process then exits 1 after delegating to the shell, which the reveal accepts as a handoff — success was reported while nothing showed. Empirically, the identical argv (separate `/select,` and encoded file URI arguments) raises the Explorer window when spawned without the hide flag and never does with it.

The [console-hiding decision](2026-09-16-hide-windows-console-windows.md) governs console-subsystem spawns in `@deepseek-ai/dsh-win32-process` with `CREATE_NO_WINDOW`; this change is the counterpart in the `dsh-native-command` runner, where GUI desktop targets must opt out of the hide flag. The [open-anywhere catalog](../feature/2026-08-25-promote-open-anywhere-plugin.md) already documented the same unreliability — a direct `explorer.exe <dir>` spawn does not reliably raise a window — and worked around it with `shell-open`; the deliverable reveal path had no such workaround.

Unit tests pin the per-call flag: Explorer calls carry `{ windowsHide: false }`, the PowerShell `Invoke-Item` open path and `wslpath` keep the hiding default, and the special-character and WSL translation cases assert the flag alongside the argv. The package READMEs record the override.

## Alternatives considered

**Hide windows only for console-subsystem targets.** Rejected: detecting the subsystem adds machinery the runner does not need; the per-call option mirrors Node's own `execFile` vocabulary and lets each caller decide what its command must show.

**Default the runner to `windowsHide: false`.** Rejected: every other command's transient console window would reappear, regressing the console-hiding fix.

**Spawn Explorer outside the runner seam (detached).** Rejected: it would lose abort propagation, the exit-1 handoff acceptance, and the injected-runner test seam.

## Consequences

The Explorer reveal raises a visible selection window on Windows and WSL. All other commands keep hidden transient consoles. Explorer exit 1 remains accepted as a delegated handoff, and the hidden-window failure mode can no longer masquerade as success on the reveal path. Installed builds must be repackaged and reinstalled for the fix to reach users, as with the console-hiding fix.
