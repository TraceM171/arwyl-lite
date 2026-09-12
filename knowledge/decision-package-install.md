# OpenCode package install: `opencode/` is a real installable package

**Status:** ACTIVE since 2026-09-12
**Decision:** `opencode/` ships as a real package (`opencode/package.json`, local-path installable today,
npm-publishable later with no structural change) alongside the existing manual-symlink path — Option A and
Option B, the same split Claude Code already has. `opencode/plugins/server.js` is the package's server
export: on first load in a project it bootstraps `AGENTS.md`, the five skills, the two secret-capture
scripts, and the `knowledge/.local` scaffold onto disk (skipping anything that already exists), then
delegates to `status-budget.js`'s existing hook, imported not duplicated. `opencode/plugins/
statusline.tui.tsx` is the package's `./tui` export, reused as-is — no second copy of either file exists
for the package path.

## Why (current reasoning)

- `phases.md`'s "Not planned" section already established the technical fact months before this file
  existed: `opencode.json`'s `plugin` field genuinely loads npm or local-path packages, and a plugin's
  init code runs once per project with full filesystem access — the same access `status-budget.js` already
  uses via its `tool.execute.after` hook. What changed is the *reason to spend the effort*: at the time of
  that finding, `opencode/` was a handful of skill files and one hook; after Phase 4, it's also a TUI
  plugin needing its own `tui.json` wiring merged into whatever a consumer's project already has. Manual
  install went from "symlink a few files" to "symlink files, hand-edit a second JSON config, know which of
  two loader conventions applies to which file type" — exactly the kind of growing friction that justifies
  reopening a deferred call rather than treating the original deferral as permanent.
- **A real, published precedent exists for exactly this pattern**, found live 2026-09-12:
  [`opencode-skills-collection`](https://github.com/FrancoStino/opencode-skills-collection) is a shipped
  community plugin whose init code copies skill files bundled inside its own npm package onto disk when
  OpenCode starts. This isn't a novel mechanism being invented here — it's a proven approach with a working
  example, which lowered the bar for "worth building" versus the earlier deferral, when it was still purely
  theoretical.
- **One package, two config-file references, no duplication.** `opencode.json`'s `plugin` array resolves
  the package's default (`.`) export; `tui.json`'s resolves `./tui` via the package's own `oc-plugin`
  field — a convention read directly from a real working example (`AI-setup/harness`'s own TUI plugin
  package), not guessed. Both config files point at the *same* package path/name, so a consumer only has
  one location to reference regardless of which plugin kind is being loaded.
- **Bootstrap logic is real and independently verified**, in isolation: a plain `node`/`bun` script
  importing `bootstrap()` directly and running it against a scratch directory correctly created
  `AGENTS.md`, all five skill directories, both scripts, and the `knowledge/.local` scaffold — and, run a
  second time against a directory with a pre-existing `AGENTS.md`, left that file untouched. What is *not*
  independently verified: whether OpenCode's own loader actually resolves a local-path `plugin` string to
  this package the way the reference material describes — that needs a real `opencode` launch, the same
  category of gap every other stage of this build has had until the owner tested it live.

## Rejected

- **A third-party meta-tool on top of OpenCode** (the `opencode-workspace` / `ocx` pattern found during
  the same research pass) — rejected: it requires installing and depending on an entirely separate CLI
  tool that isn't part of OpenCode itself, trading one dependency (manual symlinks) for a heavier one
  (a whole competing installer ecosystem) to solve a problem that OpenCode's own plugin-loading + a
  bootstrap-on-init pattern already solves without it.
- **Publishing to the real npm registry now** — not rejected outright, just not done yet: there's no
  npm account/scope set up for this project, and a local-path reference exercises the identical package
  shape (`exports`, `oc-plugin`, bootstrap-on-load) that an eventual `npm publish` would need anyway. The
  package is *structured* to be publishable later with no rework, per `stack.md`'s existing
  package-shaped-for-a-reason precedent in the sibling `AI-setup` project.
- **A single shared `bootstrap.js` imported by both a hypothetical Claude Code equivalent and this OpenCode
  package** — not considered a live option: `decision-multi-tool-integration.md`'s ground rule (real
  adapted copies per tool, not shared abstraction) already settled this; Claude Code has no equivalent
  bootstrap step to share in the first place, since its own `SessionStart` hook plus the plugin marketplace
  cover the same job differently.

## Consequences accepted

- Two documented install paths now exist for OpenCode (Option A/B), same maintenance shape Claude Code
  already carries for its own two paths — a cost this project already pays elsewhere, not a new kind of
  cost.
- `opencode/plugins/server.js` is a genuinely new file with no Claude Code counterpart to stay in sync
  with — it exists purely to bridge OpenCode's package-loading convention to files (`AGENTS.md`, skills,
  scripts) that already exist for Option B's sake. If Option B is ever dropped, `server.js`'s bootstrap
  paths still point at the same on-disk files, so nothing about it becomes stale by that change.
- OpenCode's local-path plugin resolution behavior (does `opencode.json`'s `plugin: ["/abs/path"]`
  actually load `package.json`'s `exports["."]`, does `tui.json` + `oc-plugin` really route to `./tui`)
  is asserted from a working example in a sibling project, not independently re-verified here yet. Revisit
  this file the moment it's tested live — confirm outright if it works as expected, correct in place if it
  doesn't.

## Deliberation

- Session 2026-09-12 (this repo) — same session that shipped Phase 4's `sidebar_footer` statusline and its
  drill-down dialogs; the publishing-method question was raised by the owner once the TUI plugin's install
  surface grew, researched against OpenCode's official docs plus real published community plugins, and
  decided the same session. `phases.md` Phase 4's closing notes link back here.
