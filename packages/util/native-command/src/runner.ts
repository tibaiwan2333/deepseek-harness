/**
 * Shared no-shell `execFile` runner for host-native OS integrations.
 * @module @deepseek-ai/dsh-native-command/runner
 */

import { execFile } from 'node:child_process'

/**
 * Testable command boundary; native implementations never invoke a shell.
 * The optional options argument mirrors `execFile`'s `windowsHide` option:
 * desktop commands that must raise a visible window (Explorer reveal) pass
 * `{ windowsHide: false }`, everything else keeps the hiding default.
 */
export type NativeCommandRunner = (
  command: string,
  args: readonly string[],
  signal: AbortSignal,
  options?: { windowsHide?: boolean },
) => Promise<{ stdout: string; stderr: string }>

/**
 * Run a host command with utf8 stdio, abort propagation, and Windows hide.
 * @param command - executable path or PATH name.
 * @param args - argv (never a shell string).
 * @param signal - caller/connection lifetime; abort terminates the child.
 * @param options - `windowsHide` override, default true; pass
 * `{ windowsHide: false }` for a command whose desktop window must stay
 * visible (Node maps the flag to `STARTF_USESHOWWINDOW` with `SW_HIDE`, which
 * GUI applications honour by creating their window hidden).
 * @returns captured stdout/stderr on exit 0.
 */
export const runNativeCommand: NativeCommandRunner = (command, args, signal, options) =>
  new Promise((resolve, reject) => {
    execFile(
      command,
      [...args],
      { encoding: 'utf8', signal, windowsHide: options?.windowsHide ?? true },
      (error, stdout, stderr) => {
        if (error !== null) {
          const failure = Object.assign(new Error(error.message, { cause: error }), {
            code: error.code,
            stdout,
            stderr,
          })
          reject(failure)
          return
        }
        resolve({ stdout, stderr })
      },
    )
  })
