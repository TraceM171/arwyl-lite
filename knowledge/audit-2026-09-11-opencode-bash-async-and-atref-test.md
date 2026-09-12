# OpenCode bash-tool async behavior and `@`-pointer expansion — live tests

**Date:** 2026-09-11
**Questions, for `phases.md` Phase 3:** (1) does OpenCode's built-in `bash` tool support a
Claude-Code-style backgrounded call the model can check on later, needed if `secret-capture`'s dialog
wait has to be non-blocking; (2) does an `@file`-style pointer inside skill content get auto-expanded,
relevant to how `handoff` should phrase its pointers. Both tested live rather than assumed, on OpenCode
`1.17.8`, `opencode/big-pickle` and `deepseek/deepseek-flash` (switched models mid-session — see
"Process note" below).

## 1. Plain-Unix detachment works — no special flag needed

A `bash` tool call running `setsid sh -c '<cmd>' </dev/null >/dev/null 2>&1 &` (full session
detachment plus all three std streams redirected away from the tool's own captured pipe) returned in
**17–18ms**, regardless of how long `<cmd>` itself ran. Confirmed the child outlives the call: a 6-second
background job's marker file appeared ~6s later, and by then the entire `opencode run` process (and every
`opencode` process on the machine) had already exited — the detached child was not a child of `opencode`
by the time it finished, `pgrep -af opencode` found nothing.

**The trap the next person hits:** the *first* attempt used only `&` and `disown` (shell job-control
disowning) with no fd redirection. That call did **not** return quickly — the tool's own recorded
duration was the full ~6001ms. `disown` only stops the shell delivering `SIGHUP`; it does not detach file
descriptors. The backgrounded child inherited the tool's stdout pipe, and something in OpenCode's tool
execution waits for that pipe to reach EOF — which only happens once every process holding a copy of the
fd (including the un-redirected background child) has exited. **Redirecting all three streams away
(`</dev/null >/dev/null 2>&1`) is what actually decouples the tool call from the child's runtime**, not
`disown` alone.

## 2. No completion-push mechanism exists for a detached process

`tool.execute.after` fires when the *launching* call returns (i.e., near-instantly, per #1) — not when a
detached child later finishes. `session.idle` (confirmed to exist in the `Event` union via the installed
type definitions) is a session-level "the agent stopped responding" signal, not a per-process one. So
unlike Claude Code, there is no push notification a plugin or skill can wait on for "this specific
backgrounded thing just finished." A design that needed to detach would have had to poll (e.g., a result
file, checked with backoff).

## 3. Foreground tolerance test — the finding that changed the design

Before assuming detachment was necessary, tested whether it's needed at all: ran `sleep 90 &&
echo FOREGROUND_SURVIVED_90S` as an **ordinary, synchronous** bash call (no backgrounding), and asked the
model to wait for it and report the output.

**Result: completed cleanly.** Total wall-clock for the whole `opencode run` invocation: 102s (consistent
with ~90s sleep + ~12s of normal model/tool overhead). The model's final reply correctly returned
`FOREGROUND_SURVIVED_90S` — the command's real output, which could only exist after the full 90 seconds
actually elapsed. No error, no truncation, no forced backgrounding by the harness.

(Aside, not the point of the test but worth recording: the tool part's own `time.start`/`time.end` fields
reported a 17ms span for this call, sharply inconsistent with the true ~90s+ duration established by the
external wall-clock measurement and the correct output content. That field is not reliable for measuring
a long-running call's actual duration — a discrepancy noted here so a future reader doesn't trust it at
face value; not investigated further, out of scope for this question.)

**Only ~90s was actually verified** — `capture-secret.sh`'s own default timeout is 180s
(`ARWYL_SECRET_CAPTURE_TIMEOUT`), and the ceiling between 90s and 180s was not tested. Stated as what was
checked, not extrapolated.

**Consequence:** `secret-capture` does not need Claude Code's backgrounding/polling pattern on OpenCode at
all. A plain synchronous bash call to `capture-secret.sh`, reading its one-line stdout result directly, is
simpler and sufficient — the entire reason Claude Code backgrounds it (a shorter synchronous tool-call
window than a dialog needs) has no confirmed OpenCode counterpart, and this test is evidence against one
existing up to at least 90 seconds.

## 4. `@file` pointers do not auto-expand in skill-tool-loaded content

Built a scratch skill whose body contained a literal `@knowledge/target.md` line, invoked it via
OpenCode's `skill` tool, and inspected the raw tool result. The `<skill_content>` block returned the line
**verbatim** — `@knowledge/target.md`, unexpanded, no file content substituted.

The model (`deepseek/deepseek-flash`) still produced the right final answer, but only because it
independently decided to `find` the file and `read` it — model initiative, not a platform feature. A model
that didn't bother to resolve the reference would have reported the literal `@`-string and nothing more.

**Scope of this finding:** confirmed only for content returned by the `skill` tool. Not tested: whether a
human pasting `@knowledge/foo.md` as their own typed/pasted chat message triggers a different,
UI-level `@`-mention expansion (a materially different code path in most such tools — usually bound to an
interactive autocomplete keystroke, not literal-text parsing of a pasted block). `handoff`'s output is
pasted as a user message into a fresh session, not loaded via the `skill` tool, so this audit does not
settle that case either way — the design below simply doesn't depend on the answer.

**Consequence:** `handoff`'s OpenCode port must not rely on `@`-pointers auto-loading. Plain paths plus an
explicit "read these before resuming" instruction, not a bare `@`-prefixed list assumed to self-load.

## Process note (not a platform finding)

Three `opencode run` attempts using the free model `opencode/big-pickle` produced zero output and hung
past a 60–90s timeout with no error. Switching to `deepseek/deepseek-flash` (also free-tier-adjacent but a
different provider) resolved it immediately and every subsequent test succeeded on the first try. Treated
as transient flakiness in that specific model/provider slot, not a reproducible OpenCode behavior — not
asserted as a finding about the platform. Also: compound multi-command Bash-tool scripts (chained
`pkill`/variable-assignment/`cd` before the real command) produced misleading bare "Exit code 1"/
missing-output results in this environment more than once; isolating to one self-contained command with
absolute paths resolved it every time — a note for future live-testing sessions in this repo, not an
OpenCode finding.

## Links

- `phases.md` Phase 3 — the port decisions this evidence feeds into.
- `audit-2026-09-11-opencode-hook-injection-test.md` — the earlier, related live-test on `tool.execute.after`.
