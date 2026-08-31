# Status — Current State

**As of 2026-08-31.**

## Current version

`arwyl-lite` `0.1.25` (`claude_code/.claude-plugin/plugin.json`); `arwyl-extras` `0.3.1`
(`arwyl-extras/.claude-plugin/plugin.json`). Both from marketplace `arwyl-lite-marketplace` → GitHub
`TraceM171/arwyl-lite`, two `source` entries in one `.claude-plugin/marketplace.json`.

This machine's plugin cache is confirmed on `arwyl-lite` `0.1.17`. `arwyl-extras`' cache is still `0.2.0`
— `0.2.1` through `0.3.1` are pushed but not yet reinstalled here; changes through `0.2.2` were verified
by running the working-copy scripts directly (real dialogs, real captures), not through the plugin cache
path. `0.3.0` failed to install outright (invalid `agents` manifest key,
`incident-2026-08-31-arwyl-extras-invalid-agents-key.md`); `0.3.1` fixes it but is not yet installed or
verified through the cache path. `installed_plugins.json`-style metadata is not reliable evidence of a
consumer's actual version, see `stack.md` — trust the cache path or behavioural evidence.

## Recent changes

- **2026-08-31** — `arwyl-extras` `0.3.0` failed to install entirely: invalid `agents` manifest key
  (no real plugin uses one). Fixed, `0.3.1`.
  `incident-2026-08-31-arwyl-extras-invalid-agents-key.md`.
- **2026-08-31** — new `thorough` skill + `investigator` agent in `arwyl-extras`: leveled
  (standard/deep/max), any domain (research/planning/review) — enumerate-first default,
  fan-out/verify opt-in. `0.3.0`. `decision-thorough-skill.md`.
- **2026-08-29** — field study of a second consumer (mobile app): 1 confirmed gap — a completed plan
  squatting the `phases.md` slot forces the next one to misfile. `KNOWLEDGE_ORG.md` / `curate.md` /
  `reflect.md` fixes, `0.1.25`. `audit-2026-08-29-field-study-thescriv.md`.
- **2026-08-29** — statusline: `curate?` fired the instant a curate finished and never cleared —
  `curate_signal` counted drift since the marker *timestamp*, and `git log --since` re-counts
  curate's own tail commits at the same-second boundary. Now counts `<marker commit>..HEAD`.
  `0.1.24`. `1805468`.
- **2026-08-28** — statusline: the `curate?` check ran `git log` in `project_dir`, not a repo in a
  split knowledge/code layout — so it silently gave no signal and never fired. Now runs in the repo
  that tracks `knowledge/`. Bumped to `0.1.23`. `74862f1`.
- **2026-08-28** — AGENTS.md: new rule requiring `Read`/`Edit`/`Write` for knowledge files, not
  `cat`/`sed` — shell reads are invisible to the statusline tracker and the reflect/curate nudges,
  so bash-first sessions showed `0 read`. Budget 8800 → 9000. Bumped to `0.1.22`. `33e6d46`.
- **2026-08-25** — statusline: knowledge line silently fell back to the general repo list at
  launch (a not-yet-created transcript was treated as an error, not zero activity). Bumped to
  `0.1.21`. `17eeaf3`.
- **2026-08-25** — statusline: added a `CLAUDE_ACTIVE_PROFILE` indicator to the last line;
  trimmed several inline comments. `22684c3`.
- **2026-08-04** — statusline: `knowledge/`'s own repo (when separate from project_dir) now
  reports on the `knowledge:` line, not the general repo list; plus git-segment style tightening.
  Bumped to `0.1.20`. `2926b28`, `d0f69f7`, `f879f5f`, `edb678f`.
- **2026-08-04** — statusline: multi-repo support — `knowledge/` and code can be separate repos
  (up to 3 levels deep), each listed with `↑ahead↓behind`. Bumped to `0.1.19`. `f8d6b6e`.
- **2026-08-04** — statusline: git segment vanished when session `cwd` drifted outside the repo;
  re-anchored to stable `workspace.project_dir`. Bumped to `0.1.18`. `f9ed8e7`.
- **2026-07-31** — `secret-capture` dialog now takes separate what/why arguments; fixed
  `zenity --password` silently ignoring custom `--text` (switched to `--entry --hide-text`, the
  dialog type that actually renders it). `0.2.1` → `0.2.2`. `ed6916e`.
- **2026-07-31** — first real-consumer use hit a categorical auto-mode classifier deny on
  `secret-capture`'s invocation; confirmed working under manual mode. `0.2.0` → `0.2.1`.
  `incident-2026-07-31-secret-capture-auto-mode-block.md`.
- **2026-07-31** — shipped `secret-capture` in `arwyl-extras` (`0.1.1` → `0.2.0`): OS-dialog capture
  script + cleanup script + `Stop`-hook sweep backstop. `SKILL.md`, `decision-secret-capture-scope.md`,
  `incident-2026-07-31-capture-secret-cleanup-bug.md`.
- **2026-07-31** — `arwyl-extras`' `handoff` shipped empty (dangling symlink from the split); fixed,
  bumped to `0.1.1`. `incident-2026-07-31-arwyl-extras-symlink.md`.
- **2026-07-31** — split `handoff` out of `arwyl-lite` into a new sibling plugin `arwyl-extras`
  (`arwyl-extras/`, marketplace entry added), version `0.1.0`; `arwyl-lite` bumped to `0.1.17` for the
  removal. `decision-plugin-split.md`.
- **2026-07-29** — bumped to `0.1.16` to ship the field-study rule fixes + status-budget hook (previously landed at `0.1.15` but not version-bumped, so no install picked them up). `f18e998`, `decision-versioning.md`.
- **2026-07-29** — field study of a consumer's first curate pass: 6 findings, 7 rule fixes, and a new `PostToolUse` status-budget hook. `audit-2026-07-29-field-study-curate.md`, `decision-mechanism-over-prose.md`.
- **`f4d5fcc`** — internal `field-study` skill (`.claude/skills/`, not shipped): study a consumer to find arwyl system gaps. `.claude/skills/field-study/SKILL.md`.
- **`9541468`** — added the "Place for retrieval" rule (retrievability as a second placement axis, wired through AGENTS/reflect/curate). Preventive — `decision-retrievability.md`.
- **`5b28d68`** — **Decision** added as a sixth kind, plus five rule fixes, all traced to one root cause in a field review. Bumped to 0.1.14. Why + rejected alternatives: `decision-taxonomy-kinds.md`.
- **`6aca49d`** — curate: `_curated.md` marker became a full UTC timestamp, stamped after the pass's own commit — both bare dates and same-commit stamping made a pass recount its own work as drift. Bumped to 0.1.13. `stack.md`.
- **`3df49f2`** — statusline: curate's own knowledge edits no longer count toward the dirtiness/dup-risk trigger (mirrors the existing reflect-boundary exclusion). Bumped to 0.1.12.
- **`b0471bd`** — statusline: dropped always-on dirty/changed baseline stats (nudge-only now), fixed read/edit % exceeding 100% after mid-session file renames/deletes. Bumped to 0.1.11.
- **`efd5ed9`** — added "Open entries are pointers, not plans" (status/plan split, `phases.md`/`plan.md`) and de-biased infra-only examples across the rule docs. Bumped to 0.1.10.
- **`85fe55a`** — merged statusline's dirtiness stat into the reflect segment (`reflect: N dirty (Y%)`), made the count clickable. Bumped to 0.1.9.
- **`0e783e3`** — fixed the reflect-boundary detector: tool-result and `isMeta` transcript entries were closing the boundary before reflect's own edits ran, so its own writes always counted as dirty. Bumped to 0.1.8.
- **`e0219f6`** — fixed reflect-boundary detection missing user-typed `/reflect` invocations (no assistant `tool_use` emitted for those) — partial fix, see `0e783e3` for the rest. Bumped to 0.1.7.
- **`2146543`** — fixed reflect-boundary detection not matching marketplace-namespaced skill names (`arwyl-lite:reflect`), so the nudge never cleared for the field-test consumer. Bumped to 0.1.6.
- **`d089882`** — made statusline's read/edited/branch/session counts clickable (OSC8 hyperlink) — each opens a generated local HTML page with details/diffs.
- **`655e47f`** — statusline's `reflect?` nudge gained a second trigger: fires again after >2 knowledge files edited since the last reflect pass, not just once per session. Bumped to 0.1.5.
- **`59a6207`** — closed the live-capture duplication gap: status.md recent-changes entries must be pointers not records (this rule), append-to-existing-file added as a mandatory `KNOWLEDGE_ORG.md` reread trigger, reflect gained a session-scoped dedup-audit step.
- **`09556ec`** — `SessionStart` hook stopped inlining large knowledge files (`_basic.md`/`status.md`) — see `stack.md`'s "AGENTS.md is inlined; knowledge files are not".
- **`cda2226`** — renamed from `agents-knowledge` to `arwyl-lite` (plugin + marketplace name).

## Open

- Reinstall `arwyl-extras` to `0.3.1` on this machine and on the field-test consumer, then
  re-verify `secret-capture` from the actual cache path (the `0.2.1`–`0.3.1` changes were only verified
  against the working copy directly).
- The `thorough` skill's `investigator` agent (`effort: xhigh` frontmatter, auto-discovered `agents/`
  directory) has never been dispatched through a real plugin cache path — the manifest itself now
  installs cleanly (`0.3.1` fixed the invalid `agents` key that blocked `0.3.0`,
  `incident-2026-08-31-arwyl-extras-invalid-agents-key.md`), but no level has actually run yet. Run all
  three levels end-to-end after the next reinstall before calling it field-ready.
- `secret-capture`'s macOS (`osascript`) and Windows dialog paths are unverified — only the Linux
  X11/Wayland `zenity` path has a real end-to-end test. Confirm or fix when either platform is next used.
- `secret-capture` deliberately ships without a guard hook or an MCP-tool interface — both are scope
  choices with stated revisit triggers, not unfinished work. `decision-secret-capture-scope.md`.
- `secret-capture` is categorically blocked by Claude Code's auto-mode classifier; confirmed working
  under manual mode. Auto-mode-with-allowlist specifically is untested, not known to fail.
  `incident-2026-07-31-secret-capture-auto-mode-block.md`.
