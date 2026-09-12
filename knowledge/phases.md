# Phases — OpenCode support

**Goal:** Ship `opencode/` as a second top-level tool-integration folder (alongside `claude_code/`),
carrying real, adapted copies of arwyl-lite's knowledge-tree conventions and, later, arwyl-extras'
portable capabilities — governed by `decision-multi-tool-integration.md`.

**Current phase:** Phase 1 and Phase 2 done. Phase 3 done except its `sweep-secrets` backstop, deliberately
deferred (see Phase 3 below). Phase 4 (statusline-port nudge/status delivery) is **done and shipped** —
`opencode/plugins/statusline.tui.tsx`, `sidebar_footer` chosen by live comparison against
`app_bottom`/`session_prompt_right`. Remaining unknowns (reflect/curate detection shape, `read` tool arg
shape, real nonzero session-diff/knowledge-count data) are being verified through daily use rather than a
further synthetic test pass — owner call, see Phase 4's closing note.

**On completion:** free this reserved name — do not leave a finished plan squatting it
(`KNOWLEDGE_ORG.md`'s "Open entries are pointers, not plans", plan-completion rule). Default: delete this
file, leave one final pointer line in `status.md`, git history keeps the record. Only `git mv` this to a
dated `deploy-`/`audit-` file instead if it accretes a real build narrative (deviations, a compatibility
matrix, mid-flight calls) worth preserving as a record in its own right.

## Phase 1 — arwyl-lite core (done, 2026-09-11)

Files only — no plugin/hook code, as planned. Confirmed live: OpenCode loads `AGENTS.md` natively as a
rules file (no `SessionStart`-hook-style injection, no documented size cap), so the `SessionStart` hook's
three jobs mostly evaporated rather than needing a port: inlining `AGENTS.md` is native; the "only act if
`knowledge/` exists" gate is moot (adopting means placing files deliberately); the dynamic "read these
files" line became static prose. Only the one-time `mkdir -p knowledge/.local` + `touch` scaffold
survived, and it moved to a README step, not a hook.

Shipped:

- `opencode/AGENTS.md` — adapted from `claude_code/AGENTS.md`. Rewrote the "How this reaches you depends
  on setup" delivery paragraph; dropped the character-budget mechanism entirely (no cap to protect
  against); adapted the "Memory discipline" and "Editing knowledge" sections' Claude-Code-specific
  wording (plugin cache, `CLAUDE.md`) to generic/OpenCode terms.
- `opencode/skills/{reflect,curate,knowledge-org}/SKILL.md` — ported. `knowledge-org`'s `SKILL.md` is
  byte-identical to Claude Code's (already tool-agnostic prose, confirmed by diff). `reflect.md` needed
  one wording tweak (soften the "plugin's status-budget hook" reference, since that's Phase 2, not yet
  shipped for OpenCode). `curate.md` needed three: the fresh-eyes subagent-delegation paragraph now names
  OpenCode's `task` tool instead of Claude Code's `Agent` tool; the "don't hunt for a bare
  `KNOWLEDGE_ORG.md` file" paragraph rewritten for OpenCode's single-tier (no plugin-cache-vs-manual-
  install split); "injected at session start when running via the plugin" → "OpenCode loads it natively."
- **Design simplification made while shipping, not pre-planned:** no top-level `opencode/KNOWLEDGE_ORG.md`
  / `opencode/reflect.md` / `opencode/curate.md` duplicates. Claude Code needs both a top-level copy
  (Option B's manual-symlink source) and a packaged `skills/*/SKILL.md` copy because it has two
  genuinely different install paths (plugin cache vs. manual). OpenCode has only one install shape — files
  placed under `.opencode/` or the global config dir, always discovered the same way — so the duplication
  Claude Code carries for a reason it doesn't share has no reason to exist here. `opencode/skills/*/
  SKILL.md` is the only copy.
- README: added a "Setup — OpenCode" section parallel to "Setup — Claude Code"; replaced the premature
  `.opencode/skills/...` snippets that were already sitting in the Reflect/Curate/Knowledge-Org sections
  with pointers to it; updated the "Key Files" table and the top-of-file per-tool-folder line.
- **Still unverified — do not assert either way until checked live:** whether `@knowledge/...`-style
  pointers expand inside a `SKILL.md` body served through OpenCode's `skill` tool result (confirmed for a
  typed prompt per OpenCode's commands docs; unconfirmed for skill-body text — relevant to Phase 3's
  `handoff` port); whether OpenCode's `instructions` config field can safely pull in a large, growing
  `status.md` without a Claude-Code-style silent-truncation risk (not used by this phase, but worth
  knowing before recommending it in the README).

## Phase 2 — status-budget enforcement port (done, 2026-09-11)

**Gate check done first, confirmed live:** `tool.execute.after` can inject text into the model's context
by mutating `output.output` — verified on OpenCode `1.17.8` against both `bash` and `write` tool calls,
ground-truthed at the raw API event level, not just the model's say-so.
`audit-2026-09-11-opencode-hook-injection-test.md`.

Shipped: `opencode/plugins/status-budget.js` — a from-scratch JS port of `claude_code/hooks/
status-budget.py`'s algorithm (own copy, not a shared file, per `decision-multi-tool-integration.md`),
not a shell-out to the Python script. Reimplementing in JS was a deliberate call, not the originally
planned "shell out via Bun's `$`" approach: the plugin already runs in-process in the JS/Bun runtime, a
subprocess per tool call is wasted overhead for a check that fires on every `write`/`edit`, and it avoids
requiring `python3` in an environment that doesn't guarantee it the way Claude Code's does.

- Confirmed exact tool-arg shape empirically (not assumed): both `write` and `edit` calls pass an
  **absolute** `filePath` in `input.args` — no path-joining against `directory` needed.
- Fires on `write`/`edit` only, checks `filePath` ends with `knowledge/status.md`, re-reads the file from
  disk (mirrors the Python hook's own approach — simpler and more correct than reconstructing content
  from `write`'s `content` arg or `edit`'s `oldString`/`newString` diff), parses the "Recent changes"
  block the same way (heading-level-bounded, bullet-marker-delimited entries, whitespace-collapsed length
  check), and appends a warning to `output.output` when any entry exceeds the 300-char budget
  (`ARWYL_STATUS_ENTRY_BUDGET` overridable, matching the Python hook).
- **Verified in three layers, not just written and trusted:** (1) a standalone `node` unit test calling
  the exported hook directly against a scratch `status.md` with one deliberately 544-char entry — correctly
  flagged, correctly silent on the compliant entry, on an unrelated filename, and on a non-file tool
  (`bash`); the budget-override env var correctly changed the outcome. (2) confirmed `metadata` stays
  unmutated — only `output.output` is what the model reads, matching the injection-test audit's finding.
  (3) a full round-trip through the real `opencode run` CLI (not just `node import`) with the plugin
  installed in `.opencode/plugins/`: asked the model to edit a scratch `knowledge/status.md`, and both the
  raw tool-result event and the model's own reply carried the injected warning verbatim.
- `.githooks/pre-commit`'s `AGENTS_MD_BUDGET` check needs no OpenCode counterpart (Phase 1: no hard cap
  applies to native `AGENTS.md` loading).
- README's "Setup — OpenCode" section now installs the plugin alongside the three skills.

## Phase 3 — arwyl-extras portable capabilities (done except the sweep backstop, 2026-09-11)

**Two research questions resolved first, live, before writing either skill** — both change the design
from what was originally planned; see `audit-2026-09-11-opencode-bash-async-and-atref-test.md` for full
methodology:

- **Backgrounding turned out to be unnecessary.** Confirmed `setsid ... </dev/null >/dev/null 2>&1 &`
  detaches cleanly (a launching call returns in ~18ms regardless of the child's runtime, and the child
  outlives the whole `opencode` process) — but then confirmed a plain **synchronous** foreground bash call
  survives at least ~90 seconds with no timeout, truncation, or forced backgrounding. Since
  `capture-secret.sh` already bounds itself (`ARWYL_SECRET_CAPTURE_TIMEOUT`, default 180s), the OpenCode
  port doesn't need Claude Code's background-and-wait-for-notification pattern at all — a plain
  synchronous call, reading the script's one-line stdout directly, is simpler and sufficient. (The
  detachment mechanism itself is still true and documented, in case a future skill genuinely needs it —
  it just isn't needed here.)
- **`@file` pointers do not auto-expand inside `skill`-tool-loaded content** — confirmed via a raw
  `<skill_content>` inspection; a model can still resolve one through its own initiative (`find`+`read`),
  but nothing platform-level does it for you. `handoff`'s port drops the "quote as `@`-pointers, they'll
  load on demand" framing in favor of an explicit "read each listed file" instruction in its `## Start`
  section.

Shipped:

- `opencode/skills/handoff/SKILL.md` — ported with the `@`-pointer fix above; otherwise the same shape as
  the Claude Code version.
- `opencode/scripts/{capture-secret.sh,cleanup-secret.sh}` — byte-identical copies (diff-verified), no
  changes needed; both were already tool-agnostic bash.
- `opencode/skills/secret-capture/SKILL.md` — ported with the synchronous-call redesign above; also
  dropped the Claude-Code-auto-mode-classifier-specific failure mode (no OpenCode equivalent confirmed
  either way) and added an explicit note that cleanup is *more* load-bearing here since the backstop below
  doesn't exist yet.
- **Verified live** (not just written and trusted): a scratch project with the real skill + scripts
  installed, asked the model to load `secret-capture` and resolve the script's absolute path from the
  skill's own base directory *without running anything* — resolved correctly to `.opencode/scripts/
  capture-secret.sh`. Separately ran the copied `capture-secret.sh` directly against this machine's real
  display session (not a disposable sandbox — flagged to the user mid-session when the result was
  initially unexplained; resolved as the user answering the dialog themselves, not a bug) and confirmed
  the success path (`CAPTURED path=... bytes=...`) and `cleanup-secret.sh` both work as shipped. `handoff`
  verified to load cleanly via the real `skill` tool.

**Deferred, not shipped:** the `sweep-secrets.sh` `Stop`-hook backstop. `session.idle` exists in the
`Event` union and a generic `event` hook exists to observe it, but whether a server plugin's `event` hook
reliably fires on `session.idle` in practice is unconfirmed — and project-local plugins load lazily (only
after the first directory-scoped request), an added wrinkle for a backstop meant to catch cleanup
regardless of when it's needed. `cleanup-secret.sh`'s explicit step in the skill is unchanged and already
required, not weakened by this deferral — it just has no independent backstop yet, unlike the Claude Code
version. Revisit if `session.idle`'s firing behavior gets confirmed for another reason.

## Phase 4 (approved, IN PROGRESS) — sidebar_footer status display

Full feature-by-feature study and live-verification log:
`audit-2026-09-12-opencode-statusline-feasibility.md`. The original blanket "Not planned" call below was
too coarse — most segments have a real path; the design was then iterated live with the owner across
three host-slot mockups before landing on the one being built.

**Design decided by live comparison, not by reading the API docs:**

- `app_bottom` (always-on, global) — rendered fine, but its slot props are `{}` (no `session_id` at
  all, confirmed against the pinned `.d.ts`), so it read as generic chrome, not session state. Rejected.
- `session_prompt_right` (session-scoped, inline beside the prompt) — genuinely session-scoped, but
  visibly grew the prompt row height in practice. Rejected as too intrusive.
- **`sidebar_footer` — chosen.** Session-scoped (receives `{session_id}`), lives in the existing sidebar
  panel rather than competing for prompt-row space.
- **Content is git + knowledge + nudges only** — no context%/model/effort/cost. OpenCode's native
  sidebar already shows model/context/cost (confirmed via
  [opencode#6026](https://github.com/anomalyco/opencode/issues/6026): a prior PR moved context
  tokens/percentage/cost from the header into the sidebar) and **no config exists to hide or relocate
  it** — checked against the pinned config schema, the current docs, and
  [opencode#20145](https://github.com/anomalyco/opencode/issues/20145) (a community request to hide
  exactly this redundancy, closed "not planned"). Duplicating unhideable native chrome would be pure
  waste, so the build only adds what OpenCode doesn't already show.

**Platform questions from the original study, resolved:**

- Whether a `TuiPlugin` module can shell out: **yes, confirmed live** — `node:child_process`'s
  `execFileSync` ran real `git` commands from inside a `sidebar_footer` renderer; a non-repo test
  directory produced git's own error (`fatal: not a git repository`-class), not a spawn/permission
  failure. Unblocks multi-repo ahead/behind/dirty-diffstat.
- Which host slot is always-visible during a session: **resolved by the comparison above** —
  `sidebar_footer`, contingent on the sidebar panel being open (not independently re-verified whether
  it's open by default; low-risk since the owner is actively looking at it during this build).

**Shipped**, `opencode/plugins/statusline.tui.tsx` — git segment (real multi-repo scan, ported from
`find_git_repos`, not a hardcoded project+knowledge pair; unborn-branch fallback), knowledge
read/edit-count tracking, and `reflect?`/`curate?` nudge detection, all live-tested and bug-fixed across
several repos and layouts (background/color/spacing polish, a stderr-leak fix, a Python→Node
`path.relative` semantics bug in the curate-drift pathspec) — see the audit's "Live verification"
sections for the full list.

**Also shipped, same day:** drill-down dialogs closing the one real parity gap left after the initial
ship — clicking the knowledge read/edit count opens a dialog listing read/edited files (edited files
carry the same `dirty`-since-last-reflect marker the original's detail page used, confirmed present at
`claude_code/statusline.py:172-176/622-625`); clicking any repo line opens a dialog with that repo's
changed-file list, collapsed by default, each file expanding on click to show its real diff body (colored
via the theme's own diff palette). Deliberately **not** built for the session-scoped diff — `session_diff()`
only returns counts, and there's no clean way to attribute "what the agent touched this session" as a
real patch the way a repo's own `git diff` can; the session line stays plain text, non-interactive.
Remaining known gap, not pursued: rate-limit countdowns and effort-level display (Not Planned, unchanged).

**Deliberate owner call: no further live-probe verification before shipping.** The reflect/curate
detection's exact `session.messages()`/`part()` shape, the `read` tool's exact arg field name (Phase 2
only confirmed `write`/`edit`'s), and the session-diff/knowledge-count segments with real nonzero data
were never exercised against a real reflect/curate run or real in-session file edits — every test so far
showed `0`/`+0-0` for those specific numbers. Rather than construct a synthetic test, the owner chose to
verify these through **daily use** and revise if something looks wrong, same tolerance this project
already applies elsewhere (`decision-thorough-skill.md`'s field-study-first approach). Not a gap to close
before shipping — a deliberate choice of verification method.

**Still not planned, unchanged:** rate-limit countdowns (confirmed absent from OpenCode entirely) and
effort-level display (real concept, no confirmed session-readable surface).

## Not planned (explicit scope choices, not unfinished work)

- **`statusline.py`, in full** — no longer the framing; see Phase 4 above and its audit for the
  feature-by-feature breakdown. What stays genuinely not-planned, confirmed by that study: **rate-limit
  countdowns** (no provider-agnostic concept exists in OpenCode at all — confirmed absent from the
  binary, not just undocumented) and, for now, **effort-level display** (`reasoningEffort` is real but
  has no confirmed session-readable surface). Everything else the original blanket exclusion covered —
  nudge delivery, session cost/tokens, git branch, knowledge activity counts, drill-down detail — has at
  least a candidate path and is scoped as Phase 4, not ruled out. Revisit the two still-excluded items if
  OpenCode ever exposes a rate-limit API or a session-readable effort field.
- **The `thorough` skill, all levels — excluded from the OpenCode port entirely, for now** (tightened
  2026-09-12; the earlier draft of this entry only excluded `deep`/`max` and left `standard` open as a
  possible future phase — narrowed on owner call to keep it out completely rather than half-port it).
  `deep`/`max` + the `investigator` subagent's fan-out/checkpoint/resume machinery are built on Claude
  Code session IDs and `~/.claude/projects/.../subagents/agent-*.jsonl` transcript paths, with no
  researched OpenCode equivalent — porting on a guess contradicts this project's own evidence-first bar
  (`decision-thorough-skill.md`). `standard` has no such dependency and could technically port on its own,
  but is not being split out and shipped separately right now — the whole skill is off the table for this
  port, not scheduled, revisit as its own decision if wanted later rather than assumed back in.
- ~~A real package-manager install, deferred by owner call~~ — **superseded 2026-09-12, now built**:
  `opencode/` ships as a real package (local-path installable today, npm-publishable later), skills
  included via a bootstrap-on-load pattern with a real published precedent. Full reasoning, what's
  verified vs. not, and rejected alternatives: `decision-package-install.md`. README's "Setup — OpenCode"
  now documents it as Option A, manual symlinking kept as Option B.
  Regardless of which install story `opencode/` uses: do **not** add an `opencode` entry to the existing
  `.claude-plugin/marketplace.json` — it isn't a Claude Code plugin
  (`incident-2026-08-31-arwyl-extras-invalid-agents-key.md` is what manifest-guessing costs).
