# OpenCode package install: `opencode/` is a real installable package

**Status:** ACTIVE since 2026-09-12
**Decision:** `opencode/` ships as a real package (`opencode/package.json`, local-path installable today,
npm-publishable later with no structural change) alongside the existing manual-symlink path — Option A and
Option B, the same split Claude Code already has. `opencode/plugins/server.js` is the package's server
export: on first load in a project **that already has a `knowledge/` directory**, it bootstraps
`AGENTS.md`, the five skills, the two secret-capture scripts, and the `knowledge/.local` scaffold onto disk
(skipping anything that already exists), then delegates to `status-budget.js`'s existing hook, imported not
duplicated. Without an existing `knowledge/` directory the plugin is completely inert — it touches nothing.
`opencode/plugins/statusline.tui.tsx` is the package's `./tui` export, reused as-is — no second copy of
either file exists for the package path.

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
- **Bootstrap logic is real and independently verified**, in isolation and then live: a plain `node`/`bun`
  script importing `bootstrap()` directly and running it against a scratch directory correctly created
  `AGENTS.md`, all five skill directories, both scripts, and the `knowledge/.local` scaffold — and, run a
  second time against a directory with a pre-existing `AGENTS.md`, left that file untouched. Then
  confirmed live end-to-end 2026-09-12: a real `opencode run` (headless, free model
  `opencode/nemotron-3.5-lightning-free`, no cost) against a clean scratch directory referencing the
  package via `opencode.json`'s `plugin` field produced the exact same file tree — the server export
  genuinely loads and its bootstrap genuinely runs through OpenCode's own loader, not just in isolation.
  **A real bug was caught doing this**, not just confirmed clean: the package's `package.json` originally
  declared only the modern conditional `exports` map (`{".": {"types":…, "import":…}}`) with no `main`
  field — OpenCode's local-path plugin loader does not resolve that for the root entry point and silently
  loaded nothing (no error anywhere, even at `--log-level DEBUG`; `opencode debug config` showed the
  plugin correctly recognized and resolved to a `file://` URL, but the module itself was never imported).
  Isolated with a minimal throwaway test plugin (loaded fine with a plain `main` + simple string
  `exports`), then fixed by adding `"main": "./plugins/server.js"` to the real package — confirmed working
  immediately after. **Still unverified**: the `./tui` export specifically. `opencode run` is headless and
  never touches `tui.json` or TUI-context plugin loading at all, so whether `oc-plugin` +
  `exports["./tui"]` still resolves correctly now that a `main` field exists (or whether `main` wrongly
  takes priority there too, given it silently won for the server case) is unconfirmed — needs a real
  interactive `opencode` launch.

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
- OpenCode's local-path plugin resolution for the **server** half is now live-confirmed twice
  (2026-09-12): once project-locally via `opencode.json`, once again purely from the **global**
  `~/.config/opencode/opencode.jsonc` + `~/.config/opencode/tui.json` (the owner's real machine, not a
  disposable test project) — with the caveat that it resolves via `package.json`'s `main` field, not
  `exports` alone, a real gotcha this file's earlier draft didn't anticipate. The **TUI** half (`tui.json`
  + `oc-plugin` routing to `./tui`) is still unverified — `opencode run` never exercises it. Revisit this
  file the moment that's tested — confirm outright if it works, correct in place if it doesn't (starting
  point: does `main` silently win there too, the same failure mode as the server case).
- **Correction, same day, caught by the owner testing the real global install**: the first shipped
  version of `bootstrap()` had no gate at all — it force-scaffolded `AGENTS.md`/skills/scripts into
  *every* directory `opencode` touched, global install or not. That's a real regression from Claude
  Code's own behavior: the Claude Code plugin is installable user-wide too, but only ever *acts* in a
  project that already has a `knowledge/` directory — the user's own deliberate per-project opt-in
  signal, not something the plugin creates on its own initiative. Fixed by gating the entire bootstrap
  on `existsSync(join(directory, "knowledge"))`; live-tested both branches (no `knowledge/` → completely
  inert, zero files touched; existing `knowledge/` → full scaffold fills in as before). Creating the
  *first* `knowledge/` folder in a brand-new project remains a deliberate manual step (`mkdir knowledge`)
  under both install options — this was never something either path automated, and still isn't.

## Deliberation

- Session 2026-09-12 (this repo) — same session that shipped Phase 4's `sidebar_footer` statusline and its
  drill-down dialogs; the publishing-method question was raised by the owner once the TUI plugin's install
  surface grew, researched against OpenCode's official docs plus real published community plugins, and
  decided the same session. `phases.md` Phase 4's closing notes link back here.
