# DeepSeek Harness Quick-Start Guide

English | [中文](README.zh.md)

Practical Chinese-first walkthrough for developers new to this project: from cloning the repository to a running UI, plus optional desktop installers. Commands and error handling follow the repository's official documentation (`docs/`, `apps/desktop/README.md`) and are verified against a real environment; when the official documentation updates, the official documentation wins.

## Document index

| Document | Contents |
|---|---|
| [01-run-from-source.md](01-run-from-source.md) | **Must read**: environment → clone → install → build → launch → verify |
| [02-model-config.md](02-model-config.md) | Configure model access: official API (recommended) or any OpenAI-compatible endpoint |
| [03-desktop-package.md](03-desktop-package.md) | Optional: package Windows/macOS desktop installers |
| [04-faq.md](04-faq.md) | Common error causes and fixes, plus a general troubleshooting approach |
| [05-console-window-fix-log.md](05-console-window-fix-log.md) | Fix log: commands no longer pop up PowerShell windows (root cause and 4 changes) |
| [06-new-machine-setup.md](06-new-machine-setup.md) | **New machine**: complete steps from cloning your fork to using the AI, with detailed configuration |

## Fastest path

Once the environment requirements are met (Node.js `^22.19 || >=24`, pnpm ≥ 11), the whole flow is:

Configure your API key first (see [02-model-config.md](02-model-config.md)), then:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web        # opens http://127.0.0.1:3080 in the browser
```

What success looks like at each step, and how to handle failures, is in [01-run-from-source.md](01-run-from-source.md).

For a new machine, follow [06-new-machine-setup.md](06-new-machine-setup.md) directly: it starts from cloning your fork and includes the full model configuration and data migration checklist.

## Command notation

Commands in this guide use POSIX shell (macOS/Linux/Git Bash) by default; Windows PowerShell differences are noted per command:

| Scenario | POSIX | PowerShell |
|---|---|---|
| Set environment variable (once) | `VAR=value command` | `$env:VAR = 'value'; command` |
| Path separator | `/` | `\` (most tools accept both) |

## Supported environments

- Operating systems: Windows 10/11, macOS, Linux (CI covers Node 22.19 / 24 / 26)
- Node.js: `^22.19 || >=24` — **Node 20 and below do not work**
- Package manager: pnpm ≥ 11
- Disk space: the source tree is about 1 GB; allow 5 GB including dependencies and build output
