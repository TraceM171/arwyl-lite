# Arwyl Lite

Structured knowledge for agent-assisted development. Agents read this to understand your project, preferences, and conventions.

Per-tool integrations live in their own top-level folder (`claude_code/`, `opencode/`). Each folder holds real, tool-specific copies of the conventions — not shared across tools — so each integration can be adapted to what that tool actually supports.

## Setup — Claude Code

### Option A: Plugin (recommended)

```bash
claude
/plugin marketplace add TraceM171/arwyl-lite
/plugin install arwyl-lite@arwyl-lite-marketplace
```

(Testing a local clone before pushing? Use the local path instead: `/plugin marketplace add ~/agents-template`.)

Installs the `reflect`, `curate`, and `knowledge-org` skills, plus a `SessionStart` hook. The install prompt asks for a scope — pick **project** (writes to that repo's `.claude/settings.json`, committed, shared with collaborators) if you only want this active in specific repos; **user** installs it globally across every project you open.

Either way, the hook only acts in projects that already have a `knowledge/` directory — it's a complete no-op everywhere else, so a global install won't inject anything or create files in unrelated repos. To adopt the template in a project:

```bash
mkdir knowledge
```

Next session, the hook bootstraps `knowledge/.local/_basic.md` etc. automatically, inlines `AGENTS.md`'s rules into context directly, and tells the agent to read `knowledge/_basic.md`, `knowledge/.local/_basic.md`, and `knowledge/status.md` (whichever exist) itself before doing anything else. (The knowledge files are read rather than inlined — a large `status.md` stuffed directly into hook context gets silently truncated by Claude Code past a certain size, with no error; a `Read` call isn't.) The status line still needs manual setup below — plugins can't configure `statusLine`.

### Option B: Manual

```bash
# 1. Clone this template
git clone <repo-url> ~/agents-template

# 2. In each project, create links and directories
cd your-project
ln ~/agents-template/claude_code/AGENTS.md .
ln ~/agents-template/claude_code/KNOWLEDGE_ORG.md .
mkdir -p knowledge/.local
touch knowledge/_basic.md knowledge/.local/_basic.md

# 3. Point Claude Code at AGENTS.md
ln -s AGENTS.md CLAUDE.md
```

That's it. The agent will read the knowledge files on first start and follow the organization rules.

### Arwyl Extras (independent of the above)

A sibling plugin, `arwyl-extras`, ships capabilities with no dependency on the knowledge-tree system or on `arwyl-lite` being installed — see `knowledge/decision-plugin-split.md` for why they're separate. Install it on its own:

```bash
claude
/plugin marketplace add TraceM171/arwyl-lite
/plugin install arwyl-extras@arwyl-lite-marketplace
```

Currently ships the `handoff`, `secret-capture`, and `thorough` skills (below), plus the `investigator` subagent `thorough` dispatches. No manual/symlink install path — plugin only.

## Setup — OpenCode

OpenCode has no plugin marketplace like Claude Code's, but `opencode/` is itself a real installable
package (npm-publishable or referenced by local path) as well as a set of plain files — two install
options, same as Claude Code's Option A/B split.

### Option A: package install (recommended)

Point both of OpenCode's plugin config files at the `opencode/` directory (as a local path, or the
published package name once this is on npm):

```json
// opencode.json (project root)
{ "plugin": ["/path/to/agents-template/opencode"] }
```

```json
// tui.json (project root)
{ "$schema": "https://opencode.ai/tui.json", "plugin": ["/path/to/agents-template/opencode"] }
```

One package, referenced from both files — `opencode.json` resolves its default export (the server
plugin), `tui.json` resolves `./tui` via the package's own `oc-plugin` field. On the next `opencode`
launch in that project, the plugin bootstraps `AGENTS.md`, the five skills, the two secret-capture
scripts, and the `knowledge/.local` scaffold onto disk automatically — never overwriting anything
that already exists — then runs the exact same `status-budget` check and `statusline` sidebar Option
B installs by hand, with no per-file symlinking needed. The server half is live-confirmed (a real
`opencode run` against a clean directory produced the full bootstrapped tree); the `./tui` half still
needs an interactive test. See `knowledge/decision-package-install.md` for the full verification log,
including a real gotcha it caught (the package needs a plain `main` field — `exports` alone silently
did not resolve for a local-path plugin).

### Option B: manual

```bash
# 1. Clone this template
git clone <repo-url> ~/agents-template

# 2. In each project
cd your-project
ln ~/agents-template/opencode/AGENTS.md .

mkdir -p .opencode/skills/reflect .opencode/skills/curate .opencode/skills/knowledge-org .opencode/plugins
ln ~/agents-template/opencode/skills/reflect/SKILL.md .opencode/skills/reflect/SKILL.md
ln ~/agents-template/opencode/skills/curate/SKILL.md .opencode/skills/curate/SKILL.md
ln ~/agents-template/opencode/skills/knowledge-org/SKILL.md .opencode/skills/knowledge-org/SKILL.md
ln ~/agents-template/opencode/plugins/status-budget.js .opencode/plugins/status-budget.js
ln ~/agents-template/opencode/plugins/statusline.tui.tsx .opencode/plugins/statusline.tui.tsx

mkdir -p knowledge/.local
touch knowledge/_basic.md knowledge/.local/_basic.md
```

`statusline.tui.tsx` is a **TUI** plugin, not a server plugin — OpenCode discovers it differently, via a
project-root `tui.json` rather than auto-loading from `.opencode/plugins/`. Create one (or add to an
existing one's `plugin` array if the project already has other TUI plugins):

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [".opencode/plugins/statusline.tui.tsx"]
}
```

OpenCode finds `AGENTS.md` by walking up from the project root — no `CLAUDE.md`-style rename needed. For a global install across every project instead of just this one, symlink into `~/.config/opencode/...` instead of `.opencode/...`; same pattern otherwise.

Unlike Claude Code's Option A, there's no hook to bootstrap `knowledge/.local` and the two `_basic.md` files for you — the `mkdir`/`touch` above is a one-time step you run yourself per project.

`status-budget.js` watches `knowledge/status.md` edits and warns in-context when a "recent changes" entry runs over budget — the OpenCode equivalent of Claude Code's `status-budget` hook, confirmed working end-to-end (`knowledge/audit-2026-09-11-opencode-hook-injection-test.md`, `knowledge/phases.md`). Override the 300-character default with `ARWYL_STATUS_ENTRY_BUDGET`.

`statusline.tui.tsx` renders into the sidebar (`sidebar_footer`): session line-diff, git status per repo
(project + a separately-git-tracked `knowledge/`, if any), knowledge read/edit activity, and
`reflect?`/`curate?` nudges. It deliberately does not duplicate model/context/cost — OpenCode's own
sidebar already shows those natively and there's no config to hide or relocate them. **Freshly built,
not yet field-verified**: the git and session-diff data are confirmed live; the `reflect?`/`curate?`
nudge detection is a direct logic port that hasn't yet been exercised against a real reflect/curate run.
See `knowledge/phases.md` Phase 4 and `knowledge/audit-2026-09-12-opencode-statusline-feasibility.md`.

## Knowledge Structure

```
knowledge/           # Shared project knowledge (git-tracked)
  _basic.md          # Always read at start
  .local/             # Personal preferences (typically gitignored)
    _basic.md        # Always read at start
  auth/              # Authentication
  infra/             # Infrastructure
  ...
```

## Key Files

| File | Purpose |
|------|---------|
| `claude_code/AGENTS.md` | Tells the agent where to find knowledge and rules (Claude Code) |
| `claude_code/KNOWLEDGE_ORG.md` | How to organize new knowledge (Claude Code) |
| `opencode/AGENTS.md` | Same, for OpenCode |
| `opencode/skills/knowledge-org/SKILL.md` | Same, for OpenCode (no separate top-level file) |

## Rules

1. Never edit `AGENTS.md` directly
2. Read `KNOWLEDGE_ORG.md` before adding knowledge
3. Don't use agent memories — use these folders
4. Keep knowledge current — remove obsolete info

## Reflect Skill

Capture session learnings into the knowledge base. Included in the Claude Code plugin (Option A above).

**Manual setup (Claude Code):**
```bash
mkdir -p .claude/skills/reflect
ln ~/agents-template/claude_code/reflect.md .claude/skills/reflect/SKILL.md
```

**OpenCode:** included in "Setup — OpenCode" above.

**Use:** Say "reflect" or use the skill tool to invoke it.

## Curate Skill

Reflect's big brother. Thorough, whole-tree audit and cleanup of the knowledge base — run it much less often than reflect, once knowledge has degraded across many reflect runs (duplication, mega-files, misplaced content). Has authority to fully restructure the tree to conform to `KNOWLEDGE_ORG.md`. Included in the Claude Code plugin (Option A above).

**Manual setup (Claude Code):**
```bash
mkdir -p .claude/skills/curate
ln ~/agents-template/claude_code/curate.md .claude/skills/curate/SKILL.md
```

**OpenCode:** included in "Setup — OpenCode" above.

**Use:** Say "curate" or use the skill tool to invoke it. Prefer your strongest available model — this is a careful, thorough pass, not a fast one.

## Knowledge-Org Skill

`KNOWLEDGE_ORG.md` packaged as an on-demand skill, so it can be pulled into context whenever the agent is creating, moving, or restructuring knowledge files — not just during reflect/curate. Included in the Claude Code plugin (Option A above).

**Manual setup (Claude Code):**
```bash
mkdir -p .claude/skills/knowledge-org
ln ~/agents-template/claude_code/KNOWLEDGE_ORG.md .claude/skills/knowledge-org/SKILL.md
```

**OpenCode:** included in "Setup — OpenCode" above. OpenCode ships this only as the skill — there's no separate top-level `KNOWLEDGE_ORG.md` file to symlink, unlike Claude Code's Option B.

**Use:** Say "curate" or use the skill tool, or let `reflect`/`curate` invoke it automatically when creating, moving, or restructuring knowledge files.

## Status Line

`claude_code/statusline.py` — Claude Code status line script (knowledge-tree activity with reflect/curate nudges, git branch/session diffs, context %, model, rate-limit countdowns). Not installable via the plugin — `statusLine` is a user-level setting only, so it needs a manual symlink either way.

**If you have a manual clone** (Option B, or developing/testing this repo):
```bash
ln -s ~/agents-template/claude_code/statusline.py ~/.claude/statusline.py
```

**If you installed via the plugin marketplace** (Option A) and don't want a separate clone just for this: Claude Code keeps a live git checkout of the marketplace at `~/.claude/plugins/marketplaces/<marketplace-name>/` (`arwyl-lite-marketplace` if you used the default name from Option A), refreshed whenever you run `/plugin marketplace update`:
```bash
ln -s ~/.claude/plugins/marketplaces/arwyl-lite-marketplace/claude_code/statusline.py ~/.claude/statusline.py
```
That path is the marketplace's internal working copy, not a documented/guaranteed Claude Code location — it works today but could move in a future release. Fall back to a manual clone if it ever breaks.

Then in `~/.claude/settings.json` (either way):
```json
"statusLine": {
  "type": "command",
  "command": "python3 /home/trace/.claude/statusline.py",
  "refreshInterval": 10
}
```

## Handoff Skill

Generate a copy-pasteable handoff prompt summarizing the current session for the next one. Ships in the `arwyl-extras` plugin for Claude Code (see "Arwyl Extras" above) — it reads knowledge-tree pointers when a tree exists but doesn't require one. Claude Code: plugin only, no manual/symlink install path.

**OpenCode:**
```bash
mkdir -p .opencode/skills/handoff
ln ~/agents-template/opencode/skills/handoff/SKILL.md .opencode/skills/handoff/SKILL.md
```
Ported without relying on `@`-pointer auto-expansion — confirmed on OpenCode that a `@file` reference
inside skill content isn't expanded, so this version tells the next agent explicitly to read each listed
file (`knowledge/audit-2026-09-11-opencode-bash-async-and-atref-test.md`).

**Use:** Say "handoff" or "wrap up" or use the skill tool to invoke it.

## Secret Capture Skill

Ships in `arwyl-extras` for Claude Code. Captures a brand-new secret (a freshly rotated/generated
credential — not one that already exists in a file you can decrypt) directly from you via a native OS
password dialog, so the value never enters the conversation transcript: the agent only ever sees a
scratch-file path and a byte count, references it by path in downstream commands, and cleans it up
afterward (plus a background sweep as a backstop on Claude Code). Proven end-to-end only on Linux with a
live X11/Wayland session (`zenity`); the macOS/Windows dialog paths exist but are unverified. With no
display server or no supported dialog tool, it refuses cleanly rather than hanging or falling back to
asking you to paste the value into chat.

**OpenCode:**
```bash
mkdir -p .opencode/skills/secret-capture .opencode/scripts
ln ~/agents-template/opencode/skills/secret-capture/SKILL.md .opencode/skills/secret-capture/SKILL.md
ln ~/agents-template/opencode/scripts/capture-secret.sh .opencode/scripts/capture-secret.sh
ln ~/agents-template/opencode/scripts/cleanup-secret.sh .opencode/scripts/cleanup-secret.sh
```
Simpler than the Claude Code version: confirmed live that OpenCode's bash tool tolerates a long
synchronous call (90s+, no timeout hit) so the capture script just runs as an ordinary foreground call —
no backgrounding, no polling. There is **no background-sweep backstop yet** on OpenCode (deferred, see
`knowledge/phases.md`) — the skill's own explicit cleanup step is the only cleanup that happens.

**Use:** The agent invokes this itself when a task needs a secret it has no other way to obtain — you
shouldn't need to ask for it by name.

## Thorough Skill

Ships in `arwyl-extras`, alongside a dispatched `investigator` subagent. Does a big task — research, an
implementation plan that must strictly follow existing patterns/architecture, a non-technical review
(diet, finances, a document), any domain — without missing anything, evidence-cited throughout. Not for
a code diff/PR (use `/code-review` for that). Three levels trade cost for breadth and depth: `standard`
(default) writes the task's surface to a checklist before doing anything else, then works it
single-handed; `deep` fans the checklist out to parallel `investigator` subagents; `max` decomposes
finer and adds an adversarial verification pass grading each finding CONFIRMED/UNCONFIRMED. The
deliverable follows the task — a findings report, a plan, or an analysis with recommendations, not
always a report. Only `standard`'s enumerate-first step is backed by an observed failure — `deep`/`max`
are a reasoned bet, not yet evidence-confirmed (`knowledge/decision-thorough-skill.md`).

**Use:** Ask for something thoroughly/exhaustively, without missing detail, in any domain, or name a
level explicitly ("thorough at max").

## Development

`claude_code/AGENTS.md` is inlined verbatim into the `SessionStart` hook's `additionalContext`, which Claude Code hard-caps at 10,000 characters (silent truncation past that, no error). A pre-commit hook blocks commits that push it over an 8,800-character budget. Enable it once per clone:

```bash
git config core.hooksPath .githooks
```
