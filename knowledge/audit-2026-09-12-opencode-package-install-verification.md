# Audit — OpenCode package install, live verification (2026-09-12)

Frozen record of the live verification behind `decision-package-install.md`, and the two loader bugs it
caught. Moved verbatim from that decision file during the 2026-09-12 curate pass — the decision keeps the
current why; this keeps the sequence. Order follows git history: `e4d2756` (the `main`-field fix),
`23a4bc1` (global install verified), `deaac00` (the bootstrap gate), `78bf73b` (`./tui` confirmed).

## 1. Bootstrap in isolation, then the server export live — the `main`-field bug

**Bootstrap logic is real and independently verified**, in isolation and then live: a plain `node`/`bun`
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
immediately after.

At this point the `./tui` export was still unverified: `opencode run` is headless and never touches
`tui.json` or TUI-context plugin loading at all, so whether `oc-plugin` + `exports["./tui"]` still
resolves correctly now that a `main` field exists (or whether `main` wrongly takes priority there too,
given it silently won for the server case) was unconfirmed — it needed a real interactive `opencode`
launch (section 3).

## 2. Global install — the server again, and a missing-gate regression

The server export was confirmed a second time, purely from the **global**
`~/.config/opencode/opencode.jsonc` + `~/.config/opencode/tui.json` (the owner's real machine, not a
disposable test project) — again resolving via `package.json`'s `main` field, not `exports` alone.

**Caught by the owner testing that real global install**: the first shipped version of `bootstrap()` had no
gate at all — it force-scaffolded `AGENTS.md`/skills/scripts into *every* directory `opencode` touched,
global install or not. That's a real regression from Claude Code's own behavior: the Claude Code plugin is
installable user-wide too, but only ever *acts* in a project that already has a `knowledge/` directory — the
user's own deliberate per-project opt-in signal, not something the plugin creates on its own initiative.
Fixed by gating the entire bootstrap on `existsSync(join(directory, "knowledge"))`; live-tested both
branches (no `knowledge/` → completely inert, zero files touched; existing `knowledge/` → full scaffold
fills in as before). Creating the *first* `knowledge/` folder in a brand-new project remains a deliberate
manual step (`mkdir knowledge`) under both install options — this was never something either path
automated, and still isn't.

## 3. `./tui` confirmed

Confirmed live 2026-09-12 in an ordinary interactive session opened in arwyl-lite itself — `main` pointing
at `server.js` does **not** interfere with `tui.json` + `oc-plugin` routing to `./tui`, unlike the feared
failure mode; the `sidebar_footer` rendered correctly (real git status, real knowledge read/edit counts, a
live `curate?` nudge) with no local config anywhere in the project — global install alone, package route,
both entry points. Nothing left unverified in the loader mechanism itself.
