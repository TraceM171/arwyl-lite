# Incident — `arwyl-extras`' `handoff` skill shipped empty

**Date:** 2026-07-31. Closed same day.

## What happened

The `arwyl-extras` plugin split (`decision-plugin-split.md`) moved `claude_code/skills/handoff/SKILL.md`
to `arwyl-extras/skills/handoff/SKILL.md` via `git mv`, then deleted `claude_code/handoff.md`. Both steps
looked correct in isolation, but `claude_code/skills/handoff/SKILL.md` had never been a regular file — it
was a symlink to `../../handoff.md`, the same DRY pattern all four original skills use (one source `.md`
at the top of `claude_code/`, symlinked into `skills/<name>/` so the plugin path and the manual-install
`ln` source never drift apart). `git mv` moved the symlink itself, not its content. Its relative target
(`../../handoff.md`) now resolved from the new location to a nonexistent `arwyl-extras/handoff.md`, and
the file it used to point at was gone. Every subsequent `/plugin install arwyl-extras` produced a payload
containing only `.claude-plugin/plugin.json` — the `skills/` directory was silently absent, and the
`handoff` skill never registered.

## Why it took a while to find

The symptom (skill not showing up) was consistent with several other live hypotheses that got checked
first, all reasonable, all wrong:
- `/reload-plugins` doesn't reload skills (true, and confirmed a real, separate, pre-existing limitation
  — `stack.md`'s "Skills load from the cache at session start" — but not the cause here).
- Uncommitted local state not being picked up by a local-path marketplace add (plausible, tested by
  committing and pushing — cache stayed empty even from a real GitHub commit, ruling this out).
- A stale/duplicate marketplace registration (real, separate bug found along the way: adding a
  local-path marketplace under the same name silently replaced the GitHub-sourced one instead of
  coexisting — `~/.claude/plugins/marketplaces/arwyl-lite-marketplace` pointed at neither afterward,
  requiring a fresh `/plugin marketplace add TraceM171/arwyl-lite` to recover).

Only reading `git show <commit>:arwyl-extras/skills/handoff/SKILL.md` and getting back the literal text
`../../handoff.md` (a symlink blob's target string, not file content) made the actual cause visible.

## Fix

`arwyl-extras/skills/handoff/SKILL.md` is now a real, standalone file — no symlink indirection.
`arwyl-extras` has no manual-install path (`decision-plugin-split.md`'s rejected "nest under
`claude_code/`" alternative), so the reason the symlink pattern exists for the original four skills
(serving both a plugin path and a manual-`ln` path from one source) doesn't apply here. Version bumped
`0.1.0` → `0.1.1` so the plugin cache actually refetches the corrected payload
(`stack.md`'s "Version-bump-for-cache").

## Lesson

Before moving any `skills/<name>/SKILL.md` in this repo with `git mv`, check `ls -la` first — the
original four are all symlinks to a top-level source file, and a plain move relocates the link, not the
content, silently.

## Deliberation

- Commits `df5f8a6` (the split that introduced the break), `c7a2fa0` (the fix).
- `decision-plugin-split.md` — the split this incident happened inside of.
