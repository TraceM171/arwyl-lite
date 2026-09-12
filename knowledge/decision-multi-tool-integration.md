# Multi-tool integration: real adapted copies, not a shared abstraction

**Status:** ACTIVE since 2026-09-11
**Decision:** Each supported tool (`claude_code/` today, `opencode/` per `phases.md`) gets its own
top-level folder holding real, tool-specific copies of the knowledge-tree conventions — `AGENTS.md`
content, skill text, and enforcement mechanisms where the target tool actually has an equivalent. Nothing
is shared as a single templated source across tools; each folder is adapted to what its tool supports and
is free to diverge in content, not just in path.

## Why (current reasoning)

- The two tools' delivery mechanisms for "always-loaded instructions" are fundamentally different, not
  just differently named. Claude Code inlines `AGENTS.md` into session context via a `SessionStart` hook
  hard-capped at 10,000 characters (`stack.md`) — the entire reason the character-budget mechanism
  (`.githooks/pre-commit`, `AGENTS_MD_BUDGET`) exists. OpenCode loads `AGENTS.md` natively as a rules file
  with no documented hard cap (`opencode.ai/docs/rules/`). A shared source file would either carry Claude
  Code's budget constraint into a tool that doesn't need it, or drop the constraint and silently endanger
  Claude Code. One file cannot correctly serve both.
- Enforcement mechanisms don't have 1:1 equivalents. Claude Code's `status-budget` hook fires on
  `PostToolUse` for `Edit|Write|MultiEdit`; OpenCode's nearest hook is `tool.execute.after` — a different
  event/payload shape needing its own adapter, and it is not yet confirmed whether it can inject context
  back into the model the way Claude Code's hook does (`phases.md` phase 2). The `SessionStart` bootstrap
  hook has no OpenCode job left to do at all once native rules-loading replaces its main function; only
  the one-time scaffold step survives, and it becomes a README instruction, not a hook.
- Some components have no OpenCode equivalent today at any fidelity: the status line (no statusline/
  status-bar config field found in OpenCode's docs) and the `thorough` skill's `deep`/`max` levels (rest
  on Claude Code session-ID and subagent-transcript-path internals). Forcing these into a shared
  abstraction would mean designing to the lowest common denominator, degrading the Claude Code version to
  accommodate a tool that cannot run the mechanism at all.
- Precedent already exists in this repo for synced-but-separate copies over one shared file:
  `claude_code/reflect.md` / `curate.md` / `KNOWLEDGE_ORG.md` (the Option-B manual-install source) and
  `claude_code/skills/{reflect,curate,knowledge-org}/SKILL.md` (the plugin-packaged copy) are
  byte-identical today but live as two separate files on two separate inodes, not a hardlink — confirmed
  2026-09-11 (`ls -i`, `diff`, both clean). That precedent covers *identical* content across two install
  paths of the *same* tool; the OpenCode copies go further and are expected to actually diverge in
  content, not merely in location.

## Rejected

- **Single shared source + per-tool templating/build step** — rejected: the two tools' constraints
  (character budgets, hook contracts, available mechanisms) differ enough that the templating layer
  itself would become the thing needing the most maintenance, and it obscures which tool a given line of
  prose is actually written for.
- **Symlink/hardlink sharing between `claude_code/` and `opencode/`** (mirroring the existing
  Option-B/plugin hardlink-shaped pattern) — rejected: that pattern works because both sides are the
  *same* tool's two install paths reading identical content. `claude_code/` and `opencode/` are different
  tools with different delivery mechanisms, so identical content isn't even the goal here.
- **One `AGENTS.md` with tool-conditional sections** — rejected: makes the file larger for both tools,
  reintroduces the dynamic-content-in-a-static-load problem the character-budget mechanism exists to
  prevent for Claude Code, and buries which paragraph applies to which reader.

## Consequences accepted

- Two `AGENTS.md` bodies and two sets of `SKILL.md` files to keep in sync by hand when a shared rule
  changes — the same cost this repo already pays for the Option-A/Option-B duplication above, now paid a
  second time for any rule that applies to both tools. **Smaller than that precedent in practice**
  (confirmed shipping Phase 1, 2026-09-11): Claude Code needs both a top-level copy and a packaged
  `skills/*/SKILL.md` copy of `reflect`/`curate`/`knowledge-org` because it has two genuinely different
  install paths; OpenCode has only one install shape, so `opencode/skills/*/SKILL.md` is the only copy —
  no top-level `opencode/KNOWLEDGE_ORG.md`/`reflect.md`/`curate.md` duplicates exist or are needed.
- Distribution and versioning models diverge completely. Claude Code caches an installed plugin keyed by
  `plugin.json`'s `version` (`decision-versioning.md`) and needs a bump-and-reinstall cycle to reach an
  existing install. OpenCode reads `.opencode/`-shaped directories live from the project (or the global
  config dir), so an edit is live immediately — no cache-staleness class of bug to design around.
  `opencode/` therefore does not need `decision-versioning.md`'s bump-per-ship discipline, or adopts a
  version marker for a different reason (a human changelog, not cache invalidation) — settle which, if
  either, when Phase 1 actually ships rather than speculatively here. **Note this is about the ground
  rule (real adapted copies, not shared content) — it does not mean OpenCode lacks a real package-install
  mechanism.** `opencode/` is now itself a real package (`opencode/package.json`), installable by local
  path today and npm-publishable later with no structural change — why, and what it does on first load:
  `decision-package-install.md`. This exists alongside the manual-symlink path (Option A/B), not
  instead of it.
- OpenCode's status-line-equivalent enforcement surface is now close to parity with Claude Code, not
  smaller. The character-budget `PostToolUse` check ported first (`opencode/plugins/status-budget.js`,
  `phases.md` phase 2, shipped 2026-09-11) — a from-scratch JS reimplementation of the Python hook's
  algorithm, not a shell-out, since the plugin already runs in-process in JS/Bun and a subprocess per tool
  call is needless overhead. The `reflect?`/`curate?`/drift-since-last-`curate` nudge and the git/knowledge
  status display then shipped as a TUI plugin (`opencode/plugins/statusline.tui.tsx`, `phases.md` phase 4,
  shipped 2026-09-12) rendering into the `sidebar_footer` host slot, chosen by live comparison against
  `app_bottom`/`session_prompt_right`. Where Claude Code backs a rule with a mechanism
  (`decision-mechanism-over-prose.md`), OpenCode now carries an equivalent mechanism for both —
  `audit-2026-09-12-opencode-statusline-feasibility.md` has the full feature-by-feature breakdown of what
  ported, what needed a different delivery mechanism (drill-down detail via `ui.dialog`/`route.register`
  instead of OSC8 hyperlinks, not yet built), and what still has no OpenCode equivalent (rate-limit
  countdowns, effort-level display).

## Deliberation

- Session 2026-09-11 (this repo) — the user asked for a plan to add OpenCode support; a component-by-
  component review of `claude_code/` and `arwyl-extras/` against OpenCode's documented rules/commands/
  agents/config/plugins/skills systems (`opencode.ai/docs/`) produced this ground rule and `phases.md`.
