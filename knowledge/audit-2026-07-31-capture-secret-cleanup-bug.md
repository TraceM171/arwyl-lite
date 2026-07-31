# Incident — `capture-secret.sh`'s error paths silently skipped cleanup

**Date:** 2026-07-31. Closed same day, found during the script's own development testing.

## What happened

`capture-secret.sh`'s first version used `set -euo pipefail` and, at the platform dispatch point,
`capture_linux; rc=$?` — two separate simple commands joined by `;`, not `||`. Under `set -e`, a failing
simple command that isn't part of a tested construct (`if`, `while`, `&&`/`||`) aborts the script
immediately. `capture_linux` returning non-zero (the *expected*, common outcome for "no display,"
"cancelled," "timed out") triggered exactly that: the script exited before `rc=$?` ever ran, before the
`case "$rc" in ...)` block that was supposed to print a labelled error, and before `fail()`'s `rm -f
"$OUT_FILE"` ever fired. Every non-happy-path exit — the ones a secret-handling tool most needs to get
right — silently skipped its own cleanup.

## Why it mattered

The bug was invisible on the success path (the one tested first and most often) because `set -e` never
triggers when a command's exit status is 0. It surfaced only by deliberately testing the failure path: a
`NO_DISPLAY` run (no `DISPLAY`/`WAYLAND_DISPLAY` set) printed nothing and left a captured-looking file
behind in `/dev/shm/arwyl-secrets/` — the opposite of the tool's entire purpose. Confirmed by exit code
alone (`echo "exit=$?"` still showed 3, since `set -e`'s early exit propagates that same code) — the
absence of the expected message, plus `ls` on the scratch dir, is what showed the real problem, not the
exit code.

## Fix

- Dropped `-e` from `set -uo pipefail`; every point that can legitimately fail now does so through an
  explicit `|| rc=$?`, both at the platform-dispatch call site and inside each `capture_*` function around
  its own dialog-tool invocation — no code path depends on `set -e` semantics or the more subtle rule
  about whether a function called via `||` shields its own internal failures.
- Added a `trap 'rm -f "$OUT_FILE" "$OUT_FILE.tmp" 2>/dev/null' EXIT`, set right after the scratch file is
  created, explicitly disabled (`trap - EXIT`) only immediately before the success path's final `echo` — a
  backstop that cleans up on *any* exit, including ones this design didn't anticipate, rather than relying
  on every failure branch remembering to call `fail()`.
- Re-verified both the `NO_DISPLAY` path (message now prints, no file left behind) and the success path
  (still returns `CAPTURED path=... bytes=...`, trap correctly skipped) after the fix.

## Lesson

`set -e` plus `cmd; rc=$?` is not a safe way to capture an expected-to-sometimes-fail command's exit code
in bash — the failing command aborts the script before `rc=$?` runs. Use `cmd || rc=$?` (or `if cmd; then
... fi`) at every point where non-zero is a normal, anticipated outcome, not an error. For any script whose
job includes guaranteed cleanup, prefer an `EXIT` trap over cleanup calls scattered through each explicit
failure branch — a trap fires regardless of which path the script actually takes, including ones not
anticipated at write time.

## Deliberation

- Commit `3d2fab8` — the script's original version and the fix landed in the same commit (found and
  fixed before ever shipping the buggy version to a real install).
- `decision-secret-capture-scope.md` — the skill this bug was found inside.
