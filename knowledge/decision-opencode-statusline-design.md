# OpenCode statusline: sidebar_footer, git+knowledge+nudges only, dialogs not hyperlinks

**Status:** ACTIVE since 2026-09-12
**Decision:** The OpenCode port of Claude Code's status line renders as a `TuiPlugin` into the
`sidebar_footer` host slot (`opencode/plugins/statusline.tui.tsx`). Content is git repo status +
knowledge read/edit counts + `reflect?`/`curate?` nudges only — no model/context/cost, no rate-limit
countdown, no effort-level display. Drill-down detail (per-repo diffs, per-file read/edit lists) is
delivered via `api.ui.dialog`, not OSC8 terminal hyperlinks.

## Why (current reasoning)

- **Slot choice was settled by live comparison, not by reading the API docs.** Three real stubs were
  built with realistic fake data and tested live in the actual TUI before picking one:
  - `app_bottom` rendered fine but its slot props are `{}` — no `session_id` at all, confirmed against
    the pinned `.d.ts` — so it read as generic global chrome, not session state.
  - `session_prompt_right` is genuinely session-scoped (`{session_id}`) but visibly grew the prompt row
    height in practice, which the owner judged too intrusive for a persistent element.
  - `sidebar_footer` — chosen. Session-scoped (`{session_id}`), lives in the existing sidebar panel
    rather than competing for prompt-row space, contingent on the sidebar panel being open (not
    independently re-verified whether it's open by default — low-risk since the owner is actively
    looking at it during normal use).
- **Content is scoped down from the full Claude Code feature set on purpose, not by omission.** OpenCode's
  native sidebar already shows model, context tokens/percentage, and cost — confirmed via
  [opencode#6026](https://github.com/anomalyco/opencode/issues/6026) (a prior PR moved this from the
  header into the sidebar) — and **no config exists to hide or relocate it**, checked against the pinned
  config schema, the current docs, and [opencode#20145](https://github.com/anomalyco/opencode/issues/20145)
  (a community request to hide exactly this redundancy, closed "not planned"). Duplicating unhideable
  native chrome would be pure waste. Rate-limit countdowns have no OpenCode equivalent at all; effort-level
  display is a real concept with no confirmed session-readable surface. Full feature-by-feature breakdown:
  `audit-2026-09-12-opencode-statusline-feasibility.md`.
- **Dialogs replace OSC8 hyperlinks as the drill-down mechanism** because OpenCode's TUI has no terminal
  hyperlink equivalent to shell out to, but does have a real `ui.dialog.replace` API. Shipped same day as
  the base slot: clicking the knowledge read/edit count opens a dialog listing read/edited files (edited
  files carry the same `dirty`-since-last-reflect marker the original's detail page used); clicking any
  repo line opens a dialog with that repo's changed-file list, collapsed by default, each file expanding on
  click to its real diff body colored via the theme's own diff palette.

## Rejected

- **`app_bottom`** — not session-scoped (`{}` props), reads as generic chrome rather than per-session state.
- **`session_prompt_right`** — session-scoped but grows the prompt row height, judged too intrusive for a
  persistent element live in the actual TUI, not from reading the docs.
- **Showing model/context/cost/effort/rate-limits in the new element** — OpenCode already shows
  model/context/cost natively with no way to hide it (see above); rate-limit countdowns have no platform
  surface; effort-level has no confirmed session-readable surface. Building any of these would either
  duplicate unhideable chrome or ship speculative plumbing with nothing real to read from.
- **A session-scoped diff dialog** (mirroring the repo-diff dialogs) — `session.diff()` only returns
  counts, and there is no clean way to attribute "what the agent touched this session" as a real patch the
  way a repo's own `git diff` can. The session line stays plain text, non-interactive.

## Consequences accepted

- The element only appears while the sidebar panel is open — not independently verified against a
  from-scratch default, since the owner is always looking at the sidebar while testing/using it.
- Two platform-specific behaviors ported from `statusline.py` had to be re-derived for OpenCode's
  child-process/Node semantics rather than transliterated directly: Bun's `execFileSync` leaks a failed
  child's stderr to the real terminal unless `stdio: ["ignore","pipe","ignore"]` is passed explicitly, and
  `path.relative(x,x)` returns `""` (breaking `git log -- ""`) where Python's `os.path.relpath(x,x)`
  returns `"."` — both fixed in `statusline.tui.tsx`, full detail in the audit's "Live verification"
  sections.
- The git segment scans for all git repos under the root (ported from `find_git_repos`/`_is_repo_root`,
  BFS up to 3 levels, real skip-list) and renders one line per repo found — not a hardcoded project+
  knowledge pair, which was an earlier build's incorrect shortcut caught by the owner testing live.
- Whether the reflect/curate boundary-detection logic and the knowledge read/edit counts behave correctly
  against a *real* reflect/curate run or real nonzero session edits is unverified as of shipping — every
  test so far showed `0`/`+0-0` for those specific numbers. Deliberate owner call: verify through daily use
  rather than construct a synthetic test, same tolerance this project already applies elsewhere
  (`decision-thorough-skill.md`'s field-study-first approach).

## Deliberation

- Session 2026-09-12 (this repo) — `audit-2026-09-12-opencode-statusline-feasibility.md` (the original
  feature-by-feature study and the two "Live verification" logs), `phases.md`'s Phase 4 (the shipped
  narrative). Packaging/distribution of the resulting plugin is a separate decision:
  `decision-package-install.md`.
