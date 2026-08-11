# Stack & Design Mechanics

Chosen approach for distributing and versioning Arwyl Lite, and how the moving parts work. This is design as it stands — current dynamic state (which version is live, who's on what) lives in `status.md`; the reasoning behind a settled choice, and the alternatives rejected, live in the `decision-*.md` files, not here.

## Taxonomy

- **Six kinds of knowledge**: index / status / model / decision / audit / pattern (`claude_code/KNOWLEDGE_ORG.md`) — the core taxonomy the whole system is built around. Why six, and what was rejected: `decision-taxonomy-kinds.md`.
- **Per-X convention**: one file per instance (service, integration, consumer, etc.) for any collection that would otherwise become a mega-file.
- **`phases.md` / `<domain>/plan.md`**: reserved Status-kind files for a multi-step, multi-session plan that has outgrown `status.md`'s Open section — see `KNOWLEDGE_ORG.md`'s "Open entries are pointers, not plans".

## Distribution

- **Channel**: GitHub marketplace `TraceM171/arwyl-lite`, plugin name `arwyl-lite`, marketplace name `arwyl-lite-marketplace`. Previously named `agents-knowledge` (renamed `cda2226`).
- **Multi-tool intent, not multi-tool sharing**: `claude_code/` today; other tools (e.g. OpenCode) get their own top-level folder with real, adapted copies — not one abstraction shared across tools.

## This repo runs its own plugin

Arwyl Lite is installed in its own repo at project scope (`.claude/settings.json`) and dogfoods its own conventions — this `knowledge/` tree is the result, not the product (`_basic.md`).

The parts that can be wired to the **working copy** rather than the plugin cache are: the status line points at this checkout's `claude_code/statusline.py`, and `.claude/settings.json` points the status-budget hook at `claude_code/hooks/status-budget.sh` (see "Enforcement mechanisms"). Both exist so edits are visible immediately, without a version bump or reinstall cycle, while actively developing. Everything loaded *as a plugin* — the skills, the `SessionStart` hook — still comes from the version-pinned cache, so skill-text changes need the normal bump-and-reinstall round trip to be exercised here (`decision-versioning.md`).

## Version-bump-for-cache

Claude Code caches an installed plugin keyed by `plugin.json`'s `version` string, not by commit SHA. Pushing new commits alone does not reach existing installs — `version` must bump too, or the cached copy stays stale even after `/plugin marketplace update` refreshes the marketplace's own git checkout. Why explicit semver rather than the commit-SHA fallback: `decision-versioning.md`.

**`installed_plugins.json` is not a reliable record of what a project runs.** `~/.claude/plugins/installed_plugins.json` pins a per-project `installPath`/`version`, but it goes stale: during the 2026-07-16 field review it listed `0.1.11` for the field-test consumer while it was demonstrably running `0.1.13`. It is a red herring — do not use it to determine a consumer's version. Trust, in order: the `/plugin` UI, or **behavioural evidence** in the consumer's own output (the `_curated.md` marker format proved `0.1.13` outright: bare date = ≤`0.1.11`, ISO timestamp + separate trailing commit = `0.1.13`). Version-discriminating behaviour beats metadata.

**Skills load from the cache at session start.** A push (even after `/plugin marketplace update`) does not affect the session that made it — it keeps running the previously-cached skill text. Expect to write a rule and then have the *old* rule govern the same session's `reflect`/`curate`.

## AGENTS.md is inlined; knowledge files are not

`claude_code/AGENTS.md` is pasted verbatim into the `SessionStart` hook's context (Claude Code hard-caps hook `additionalContext` at 10,000 characters — silent truncation past that, no error). A pre-commit hook (`.githooks`, opt in via `git config core.hooksPath .githooks`) blocks any commit that pushes it over an **8,800-character** budget. The constant lives in two places that must stay in sync: `.githooks/pre-commit` and `hooks/session-start.py`.

Raised 8,000 → 8,500 in `0.1.14` (the sixth kind's reminder line had to fit), then 8,500 → 8,800 in `0.1.15` (the "Place for retrieval" read/write pointers had to fit — see `decision-retrievability.md`). The payload's only other content is the ~150-char read-instruction line, so the worst case is ~8,950 against the 10,000 cap. Measured live after the `0.1.15` raise: 8,567 payload, ~1,433 margin. Each raise is deliberate: keep new inlined content to minimal pointers, full text in `KNOWLEDGE_ORG.md`, so the budget rises rarely.

`_basic.md` / `status.md` files are deliberately *not* inlined the same way — a growing `status.md` would blow the cap unnoticed — so the hook points the agent at them and lets it `Read` them instead (`09556ec`).

## Rules reach the agent via the skill, not a file

On a **plugin install** there is no `KNOWLEDGE_ORG.md` anywhere in the consuming project — it exists only inside the version-pinned plugin cache. So the rule docs must tell agents to **invoke the `knowledge-org` skill**, never to "read the file".

Wording matters more than it looks: until `0.1.14` both `AGENTS.md` and `curate.md` said *"invoke the skill if available, otherwise read the file directly."* The field-test consumer's transcripts show **16 direct-read attempts, none of which could have succeeded** — 10 at the project root, 5 under `knowledge/`, 1 at a guessed cache path missing the `claude_code/` segment. Agents burned failed tool calls before falling back to the skill. The sanctioned-sounding fallback caused it.

Reading the cache path directly is also wrong even when it resolves: it is version-pinned, so it silently serves a stale copy after an upgrade. The direct-read fallback now applies only to manual installs, where the repo has its own symlinked copy at a known path.

## Skills are written for the model that runs them

`reflect` and `curate` are pitched at different runtimes. `reflect` runs often and on a Sonnet-class model (currently Sonnet 5, the common day-to-day model) — confirmed across many field runs — so its steps are concrete and checklist-shaped, safe to follow literally.

**`curate`'s runtime was an assumption, and the only field observation contradicts it.** The design intent was an Opus-class model, so its guidance leans on judgment for the ambiguous classification calls. The one curate pass ever observed in the field-test consumer (2026-07-29, its first) ran on **Sonnet 5**, and no curate or reflect commit in that consumer's history is Opus-authored. N=1, so this is not settled — but "curate runs on Opus" must not be stated as fact until a second run is seen. Treat judgment-heavy prose in `curate.md` as a bet, not a guarantee, and prefer guidance that also survives a Sonnet runtime.

The skill can no longer be *told* to pick a better model — it cannot; the model is fixed before the skill text loads. `curate.md`'s step-0 self-check instead has it name its model and offer the user a deferral, which is an instruction the reader can actually act on. See `audit-2026-07-29-field-study-curate.md`.

When editing a skill, match the guidance to its runtime: rote checklists for `reflect`, judgment-based prose for `curate` — not the reverse.

## Enforcement mechanisms

Some rules are enforced by machinery rather than prose — the choice, and when it applies, is
`decision-mechanism-over-prose.md`. What ships:

- **`hooks/status-budget.py`** — `PostToolUse` on `Edit`/`Write`/`MultiEdit`; measures `status.md`
  recent-changes entries at the moment of the write, reports any over **300 characters**. Advisory
  (never blocks, never edits), silent on non-`status.md` writes and in projects with no `knowledge/`
  tree, budget overridable via `ARWYL_STATUS_ENTRY_BUDGET`. Registered in `hooks/hooks.json`
  alongside `SessionStart`. Verified end-to-end on 2026-07-29 (Claude Code 2.1.220): the hook fires
  on the `Edit|Write|MultiEdit` matcher and its `hookSpecificOutput.additionalContext` does reach the
  model — piping JSON at the script only proves the parser, not the harness contract, so prove the
  fire before trusting any future hook.

  **This repo wires it from `.claude/settings.json` pointing at the working copy**
  (`$CLAUDE_PROJECT_DIR/claude_code/hooks/status-budget.sh`), not the plugin cache — same dogfooding
  reason as the status line, so edits are testable without a version bump. `status-budget.sh` resolves
  its python script relative to `$0` rather than `$CLAUDE_PLUGIN_ROOT` precisely so both invocation
  paths work; consumers get it via the plugin with no settings change.
- **`.githooks/pre-commit`** — the `AGENTS.md` character budget (dev-side, this repo only; not
  shipped payload — a plugin cannot install a git hook).
- **`arwyl-extras/hooks/sweep-secrets.sh`** — `Stop` hook, shipped in `arwyl-extras` not `arwyl-lite`
  (out of scope for this plugin's own conventions, in scope for that one's). Deletes anything left in the
  `secret-capture` skill's scratch dirs after 10 minutes — a backstop for the skill's own instructed
  cleanup step, same "a step that depends on being remembered is not a control" reasoning as the
  status-budget hook above. Silent: no `hookSpecificOutput`, it only ever deletes stale local files.

Budgets are stated in **characters, not lines** — a line count is not checkable under hard wrapping.

## Memory discipline

Never use Claude Code's own memory tool for project knowledge — the `knowledge/` tree is the single source of truth (`AGENTS.md` "Memory discipline"). Applies to every project that installs this plugin, including this one.

## Commit style

Conventional Commits prefix (`feat` / `fix` / `docs` / `chore` / `refine` / `rename`), short subject, body explaining why when it's non-obvious. No feature branches so far — history is linear on `main`.
