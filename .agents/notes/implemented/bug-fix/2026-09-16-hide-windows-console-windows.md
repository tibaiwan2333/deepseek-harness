# Agent Note: Hide Windows console windows on command spawn

Status: implemented

English | [中文](2026-09-16-hide-windows-console-windows.zh.md)

## Problem

The packaged desktop is a GUI-subsystem Electron executable with no console, and it runs every command-line invocation through console-subsystem children (`powershell.exe`, `cmd.exe`, …). A console-subsystem child created from a console-less parent receives a brand-new visible console window unless the parent opts out, so every command invocation popped a PowerShell window in front of the user. Both command paths were affected: the ordinary Windows Job runner (current-token spawns) and the ACL restricted-token runner (workspace-write profile, the sandbox path the packaged desktop uses).

## Decision

The three spawn primitives in `@deepseek-ai/dsh-win32-process` now pass `CREATE_NO_WINDOW` (`0x08000000`, owned by `abi.ts`):

- `spawnPipedProcess` — restricted-token spawn with pipe stdio.
- `spawnInheritedJobProcess` — restricted-token spawn with inherited stdio (`CREATE_SUSPENDED | CREATE_NO_WINDOW`).
- `spawnCurrentTokenJobProcess` — current-token Job spawn (`CREATE_SUSPENDED | CREATE_UNICODE_ENVIRONMENT | CREATE_NO_WINDOW`).

The Windows Job runner (`subprocess-local` `launchWindowsJob`) also spawns its runner child with `windowsHide: true` so the runner itself stays console-less in every launch mode, and the desktop project manager spawns `node pnpm` with `windowsHide: true` for the same reason. `CREATE_NO_WINDOW` affects only console applications; GUI-subsystem targets are untouched.

The previously recorded limitation that `CREATE_NO_WINDOW` children die during DLL initialization with `STATUS_DLL_INIT_FAILED` (`0xC0000142`) does not reproduce with the current WRITE_RESTRICTED token: its restricting lists keep the logon-SID/Everyone keep-alive group that console initialization needs, so initialization succeeds with the window hidden. Real-runner runs of both ACL modes (read-only and workspace-write) and the Job path exit 0 with the hidden-window flags, matching their unpatched baselines. The package READMEs and the ACL sandbox module docs now record "console windows are suppressed" instead of "console isolation is unavailable"; the [ACL sandbox note](../feature/2026-08-08-windows-acl-restricted-token-sandbox.md) carries the corrected fact.

## Alternatives considered

**`STARTF_USESHOWWINDOW` with `SW_HIDE`.** Hides the allocated console window instead of suppressing its creation, requires new `ffi.ts` startup-info surface, and leaves a hidden conhost per command. Rejected because `CREATE_NO_WINDOW` suppresses allocation entirely with no ABI change beyond one flag.

**`DETACHED_PROCESS`.** Detaches the child from any console; the child then has no console at all, which changes console-API behavior for the wrapped command. Held as a fallback only if the restricted path had died with `0xC0000142`; it did not.

## Consequences

The visible PowerShell/console popups per command invocation are gone in the packaged desktop; console-API behavior of the wrapped commands is unchanged because the child still gets a console, just without a window. Verification is by construction flags (asserted in the win32-process unit tests), by exit codes — no `0xC0000142` in real-runner runs of both ACL modes and the Job path, pre- and post-patch — and by standard `CREATE_NO_WINDOW` semantics; window visibility itself is not measurable in this development environment (console windows are created hidden there), with the earlier packaged-chain repro of a visible target window (`MainWindowHandle` ≠ 0) as pre-fix evidence. Installed builds must be repackaged and reinstalled for the fix to reach users.
