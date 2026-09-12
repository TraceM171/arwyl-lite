# Multi-tool integration: real adapted copies, not a shared abstraction

**Status:** ACTIVE since 2026-09-11
**Decision:** Each supported tool (`claude_code/` and `opencode/`) gets its own top-level folder holding
real, tool-specific copies of the knowledge-tree conventions — `AGENTS.md` content, skill text, and
enforcement mechanisms where the target tool actually has an equivalent. Nothing is shared as a single
templated source across tools; each folder is adapted to what its tool supports and is free to diverge in
content, not just in path.

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
  event/payload shape needing its own adapter, which does inject context back into the model, by mutating
  `output.output` (`audit-2026-09-11-opencode-hook-injection-test.md`). The `SessionStart` bootstrap hook
  has no OpenCode job left to do once native rules-loading replaces its main function; only the one-time
  scaffold step survives — a README step under manual install, the package's bootstrap-on-load under
  package install (`decision-package-install.md`).
- Some components have no OpenCode equivalent at any fidelity: the `thorough` skill's `deep`/`max` levels
  (rest on Claude Code session-ID and subagent-transcript-path internals) and the status line's rate-limit
  countdowns. Others port only through a different mechanism — the status line itself became a
  `sidebar_footer` TUI plugin with dialogs in place of OSC8 hyperlinks
  (`decision-opencode-statusline-design.md`). Forcing these into a shared abstraction would mean designing
  to the lowest common denominator, degrading the Claude Code version to accommodate a tool that cannot run
  the mechanism at all.
- The one place this repo *does* share a single source shows where sharing fits: `claude_code/reflect.md` /
  `curate.md` / `KNOWLEDGE_ORG.md` (the Option-B manual-install source) are served to the plugin path
  through symlinks — `claude_code/skills/{reflect,curate,knowledge-org}/SKILL.md` are git mode `120000`
  links, not copies (`incident-2026-07-31-arwyl-extras-symlink.md`). That works because both sides are the
  *same* tool's two install paths reading identical content. The OpenCode copies are a different tool and
  are expected to actually diverge in content, not merely in location.

## Rejected

- **Single shared source + per-tool templating/build step** — rejected: the two tools' constraints
  (character budgets, hook contracts, available mechanisms) differ enough that the templating layer
  itself would become the thing needing the most maintenance, and it obscures which tool a given line of
  prose is actually written for.
- **Symlink/hardlink sharing between `claude_code/` and `opencode/`** (mirroring the existing
  Option-B/plugin symlink pattern) — rejected: that pattern works because both sides are the
  *same* tool's two install paths reading identical content. `claude_code/` and `opencode/` are different
  tools with different delivery mechanisms, so identical content isn't even the goal here.
- **One `AGENTS.md` with tool-conditional sections** — rejected: makes the file larger for both tools,
  reintroduces the dynamic-content-in-a-static-load problem the character-budget mechanism exists to
  prevent for Claude Code, and buries which paragraph applies to which reader.

## Consequences accepted

- Two `AGENTS.md` bodies and two sets of `SKILL.md` files to keep in sync by hand when a shared rule
  changes — a cost Claude Code's own two install paths do not pay, since they share one file (above).
  OpenCode keeps it to one source copy: `opencode/skills/*/SKILL.md` is the only copy in this repo,
  whichever install option delivers it — no top-level `opencode/KNOWLEDGE_ORG.md`/`reflect.md`/`curate.md`
  duplicates exist or are needed (`deploy-2026-09-12-opencode-support.md`, Phase 1;
  `decision-package-install.md`).
- Distribution models diverge. Claude Code caches an installed plugin keyed by `plugin.json`'s `version`
  (`decision-versioning.md`) and needs a bump-and-reinstall cycle to reach an existing install. OpenCode
  reads `.opencode/`-shaped directories live from the project (or the global config dir), so an edit is
  live immediately — no cache-staleness class of bug to design around. `opencode/package.json`'s `version`
  is bumped per ship all the same (owner call, 2026-09-12 — `decision-versioning.md`). **This is about the
  ground rule (real adapted copies, not shared content) — it does not mean OpenCode lacks a real
  package-install mechanism.** `opencode/` is itself a real package (`opencode/package.json`), installable
  by local path today and npm-publishable later with no structural change — why, and what it does on first
  load: `decision-package-install.md`. This exists alongside the manual-symlink path (Option A/B), not
  instead of it.
- OpenCode's enforcement surface is close to parity with Claude Code, not smaller. The character-budget
  check is `opencode/plugins/status-budget.js` — a from-scratch JS reimplementation of the Python hook's
  algorithm, not a shell-out, since the plugin already runs in-process in JS/Bun and a subprocess per tool
  call is needless overhead. The `reflect?`/`curate?`/drift-since-last-`curate` nudge and the git/knowledge
  status display are a TUI plugin (`opencode/plugins/statusline.tui.tsx`) rendering into the
  `sidebar_footer` host slot. Where Claude Code backs a rule with a mechanism
  (`decision-mechanism-over-prose.md`), OpenCode carries an equivalent mechanism for both —
  `audit-2026-09-12-opencode-statusline-feasibility.md` has the full feature-by-feature breakdown of what
  ported, what needed a different delivery mechanism, and what still has no OpenCode equivalent (rate-limit
  countdowns, effort-level display). One `arwyl-extras` mechanism has no OpenCode counterpart yet: the
  `sweep-secrets` `Stop`-hook backstop — deferred, `decision-secret-capture-scope.md`.
- **`thorough`, all levels, is excluded from the OpenCode port entirely, for now** (narrowed 2026-09-12 on
  owner call — an earlier draft excluded only `deep`/`max`). `deep`/`max` and the `investigator` subagent's
  fan-out/checkpoint/resume machinery are built on Claude Code session IDs and
  `~/.claude/projects/.../subagents/agent-*.jsonl` transcript paths, with no researched OpenCode
  equivalent — porting on a guess contradicts this project's own evidence-first bar
  (`decision-thorough-skill.md`). `standard` has no such dependency and could technically port on its own,
  but is not being split out and shipped separately; revisit as its own decision if wanted later rather
  than assumed back in.

## Deliberation

- Session 2026-09-11 (this repo) — the user asked for a plan to add OpenCode support; a component-by-
  component review of `claude_code/` and `arwyl-extras/` against OpenCode's documented rules/commands/
  agents/config/plugins/skills systems (`opencode.ai/docs/`) produced this ground rule and the phased plan,
  closed as `deploy-2026-09-12-opencode-support.md`.
