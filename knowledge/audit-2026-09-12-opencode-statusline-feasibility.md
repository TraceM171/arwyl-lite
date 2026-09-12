# OpenCode statusline feasibility — feature-by-feature study

Picks up the handoff item `phases.md`'s "Not planned" flagged for revisit: `claude_code/statusline.py`
was excluded from the OpenCode port on a blanket "no statusline config field" finding
(`decision-multi-tool-integration.md`). This is a study, not a build — no code shipped. Read
`claude_code/statusline.py` in full and `../AI-setup/knowledge/plugin/opencode-plugin-api.md` in full
before trusting anything below; this file assumes both.

## What the blanket exclusion actually costs

`decision-multi-tool-integration.md`'s "Consequences accepted" names the real casualty precisely:
OpenCode gets the knowledge-tree conventions "with a smaller enforcement surface... no status line, so
no `reflect?`/`curate?`/drift-since-last-`curate` nudge delivery." Context %, model name, rate limits,
session cost are conveniences layered around that; the nudge is the thing with a job to do. Findings
below are ordered accordingly: nudge delivery first, then what rides along cheaply, then what has no
surface at all.

## Method

- Enumerated every rendered segment in `statusline.py` (17 distinct features/behaviors).
- Cross-referenced each against `opencode-plugin-api.md`'s documented hooks, `TuiPluginApi` members,
  data shapes, and known sharp edges.
- Ran a small set of **safe, non-interactive** local checks against the pinned `opencode` 1.17.8 binary
  (`/home/trace/.opencode/bin/opencode`, matches the version the reference doc describes) to settle two
  claims the doc doesn't cover: whether a rate-limit-window concept exists anywhere in OpenCode, and
  whether "reasoning effort" is a real concept.
- **Deliberately did not launch the interactive TUI.** Reading it live (to see native footer/chrome, or
  to test whether a TUI plugin module can shell out) needs a real pty, real provider auth, and a session
  bootstrap — none of which this sandboxed, non-interactive Bash tool can safely provide, and a hung TUI
  waiting on real input is exactly the kind of unexpected-complexity trap this project's tooling guidance
  says to stop and ask about rather than push through. Both are cheap for the owner to check by hand in
  a real terminal (a few seconds each) and are called out as such below.

## Nudge delivery — buildable now with a caveat, not a TUI project

**Mechanism: cheap.** `client.tui.showToast` is live-verified in the reference doc to work **from a
server plugin**. `opencode/plugins/status-budget.js` already is a server plugin with `tool.execute.after`
firing on every knowledge-file `write`/`edit`, plus `$` shell and filesystem access (Phase 2). Computing
the same drift/dup-risk signal there and calling `client.tui.showToast` on threshold needs no new module,
no host slot, no `TuiPlugin` entry point at all.

**Fidelity: a real, not cosmetic, downgrade.** A toast is one-shot and ephemeral (`{variant, title,
message, duration}`); Claude Code's nudge is a segment that stays on screen every render until the
underlying condition clears. A user who doesn't notice the toast gets no second chance until the signal
re-fires. `showToast`'s own return value doesn't even confirm a TUI was listening (`{data: true}`
regardless). This is an owner product call, not a technical blocker — flagging it rather than deciding it.

**Detection is not just presence-checking.** The handoff's lead — a `skill` tool part's `input.name` in
`session.messages()` — is plausible (OpenCode does have a native `skill` tool; Phase 3 already loaded
`handoff` through it) but **`opencode-plugin-api.md` does not actually contain this shape anywhere**
(checked by direct grep of the file — no match on "skill" at all), despite the handoff citing it as
"confirmed." Treat the field name as unverified until re-checked live, not as settled fact carried
forward from this file's own citation.

This checked only `opencode-plugin-api.md` itself — `AI-setup` is a separate repo with its own knowledge
tree, and other files there weren't searched, so "not found in the cited reference" is the accurate claim,
not "unconfirmed anywhere."

More importantly, presence-checking "did reflect/curate run" is the easy half. What made the Claude Code
nudge correct took two dedicated bugfixes on record (`status.md`: `0e783e3`, `e0219f6`) and a whole
boundary/window mechanism in `statusline.py` (`reflect_boundary`, `curate_windows` — lines 387–435): a
curate pass's own knowledge edits must not count as post-reflect drift, and a typed `/reflect` and a
skill-tool invocation are two different transcript shapes needing two different detectors. The OpenCode
analog — distinguishing a typed `/reflect` message from a `skill` tool-part call in `session.messages()`,
and excluding a curate pass's own edits from the drift count — is the part that needs live probing before
it's trusted, not the "can I detect a skill ran at all" part.

## What rides along cheaply, given the nudge is served by the existing server plugin

- **Session cost/tokens** — `Session.cost` / `Session.tokens` on `api.state.session.get(id)`, live-verified
  2026-09-05 in the reference doc as a real running total (not from the stale 1.15.7 types). Direct analog
  to statusline's `cost_str`. Confirmed as a first-class OpenCode concept independent of the plugin API too:
  `opencode stats` is a native CLI subcommand ("show token usage and cost statistics").
- **Git branch (single value)** — `api.state.vcs.branch`, reactively tracked, no shell-out needed. Direct
  analog to statusline's branch name only — not the rest of the git segment (see Tier B).
- **Knowledge read/edit-count tracking** — lower-risk than it first looks, because Phase 2 already
  confirmed the exact tool-arg shapes: `write`/`edit` calls carry an absolute `filePath` in `input.args`.
  A `tool.execute.after` handler in the same server plugin can tally reads/edits under `knowledge/` the
  same way `status-budget.js` already inspects `write`/`edit` calls — this reuses confirmed shapes, not
  new ones. What's unconfirmed is only the **display** surface (see Tier B: host slot choice), not the
  counting mechanism.

None of the above needs a `TuiPlugin` module. All three could ship as more `tool.execute.after`/`event`
logic in the *existing* server plugin, surfaced via `showToast` alongside the nudge, if a one-shot
notification is judged sufficient for a first cut.

## Tier B — a candidate surface exists, but shape or behavior is unconfirmed; verify before building

| Feature | Candidate surface | What's unconfirmed |
|---|---|---|
| Multi-repo ahead/behind + dirty diffstat | none in `api.state` — `vcs` is `{branch?: string}` only, nothing else | Needs a shell-out (`git rev-list --left-right`, `git diff --shortstat`) from wherever the check runs. **Whether a `TuiPlugin` module can shell out at all is unconfirmed** — `PluginInput.$: BunShell` is documented for server plugins only; the TUI plugin's API surface lists no shell handle. Strong circumstantial evidence it can anyway (the whole `opencode` binary is one Bun-compiled executable — `strings` on it shows `/$bunfs/root/chunk-*.js` — so a `TuiPlugin` module loads into the same Bun runtime as everything else, and `TuiPluginApi` reads as a convenience façade, not a sandbox), but this is inference, not a live test, and it only matters if a persistent slot (not the toast route above) is what gets built. |
| `session.diff(id)` as a `git diff --numstat` replacement | `api.state.session.diff(id)` → `{file, additions, deletions}[]` | Returns **counts only, no patch text**. Fine for a `+N -M` stat; gives nothing for the HTML pages' expandable per-file diff bodies. |
| Host slot choice for anything persistent | `sidebar_footer`, `home_footer`, `app_bottom`, `session_prompt_right` | Which of these is actually visible during ordinary chat use, always-on vs. conditional, is undocumented. Names suggest `sidebar_footer`/`sidebar_title` need the sidebar panel open and `home_footer` only shows on the home screen (wrong analog — Claude Code's line is visible throughout a session, not just at launch); `app_bottom`/`session_prompt_right` read as the plausible always-visible candidates, but this is a guess from naming, not a checked fact. The doc's own hydration warning applies to whichever is picked: `api.state.session.messages()` returned empty for ~2s after a session the TUI was already rendering — "empty means 'not yet,' never 'none.'" |
| Effort-level display | none confirmed | `reasoningEffort` is a **real** OpenCode/provider concept — confirmed by `strings`-searching the binary: `v.reasoningEffort(r)` maps to a request's `reasoning_effort` field for OpenAI-compatible providers. But nothing in the reference doc shows a *session-readable* surface for the currently-configured value (not on `Session`, not on `AssistantMessage`). This is "a real concept with no confirmed read surface," not "no analog" — different claim than Tier C below, don't conflate them. |

## Tier C — no plausible surface found; stays Not Planned

- **Rate-limit countdowns** (`five_hour`/`seven_day`-style windows). Confirmed absent, not just
  unconfirmed: `strings` on the pinned binary turns up ordinary HTTP `retry-after`/429-backoff handling
  for OTel export batching, and **nothing** resembling a usage-window concept. This tracks — Claude's
  5-hour/7-day windows are an Anthropic-account-specific concept; OpenCode is provider-agnostic and has
  no equivalent account model to hang the concept on.
- **OSC8 hyperlink detail pages, as literally implemented** — reframed, not simply killed. The capability
  (drill down from a summary count to file-level detail) has better native analogs: `ui.dialog` or
  `route.register` (a full-screen view), per the reference doc. Whether a slot's plain text can even carry
  a raw OSC8 escape sequence through opentui's cell renderer is untested — no basis in the reference doc
  either way, unlike the rate-limit and effort findings above which are `strings`-verified. Either way the
  honest framing is "different delivery mechanism, not zero capability" — and if a dialog is built, the
  reference doc's own "Dialog
  frame geometry" section exists because guessing those constants cost three failed passes elsewhere in
  this owner's other project; use the published constants rather than re-deriving them.
  Note also: since `session.diff()` gives counts only (Tier B above), a dialog/route replacement for the
  *diff-body* half of these pages has no data source today regardless of delivery mechanism — only the
  plain read/edited file-list half is actually buildable now.

## Open before anything gets built

1. **One quick native-chrome check the owner can do in seconds that this session couldn't do safely**:
   launch `opencode` for real and look at what it already shows (model, tokens/cost, branch) in its own
   chrome. Duplicating native display is pure waste. This session confirmed cost/token tracking is a
   first-class *concept* (`opencode stats` CLI) but could not safely confirm what, if anything, already
   renders continuously during a session — launching the interactive TUI needs a real pty and a live
   session and wasn't attempted here (see Method).
2. Toast-vs-persistent tradeoff for the nudge (above) — needs an owner call, not a technical answer.
3. Whether a `TuiPlugin` module can shell out — only matters if a persistent slot is pursued over the
   toast route; the toast route needs no answer to this at all.
4. Which host slot is actually always-visible during a session, if a persistent slot is pursued.
5. The reflect/curate boundary-and-window logic's exact `session.messages()` part shapes — the presence
   check is easy, the boundary correctness is the part with a track record of needing two bugfix rounds
   on the Claude Code side.

## Live verification, same day — `child_process` confirmed from a TUI plugin

Resolved the one open platform question that mattered most (Tier B, multi-repo ahead/behind/diffstat):
built a real `sidebar_footer` stub calling `node:child_process`'s `execFileSync("git", [...])` against
`api.state.path.directory`, tested live against opencode 1.17.8. Result on a non-repo directory: the
rendered error was `Command failed: git -C /tmp/oc-statusline-test rev-parse --abbrev-ref HEAD` — a
**git-level** error (git ran, and correctly complained there's no repo), not a spawn/permission failure.
Confirms a `TuiPlugin` module can shell out the same as a server plugin can via `$`; the earlier
uncertainty (`TuiPluginApi` documents no shell handle) was about the documented convenience surface, not
an actual restriction. This closes Tier B's multi-repo ahead/behind/diffstat gap and the corresponding
open item in `phases.md`'s Phase 4.

Also live-confirmed during the same session, by iterating the `sidebar_footer` stub with the owner: the
slot renders correctly with multi-line `<box flexDirection="column">`/`<text>`/`<span>` content, colors
correctly from `theme.*`, and — critically — feels session-scoped in practice only when built from
`sidebar_footer`/`session_prompt_right` (both receive a real `session_id` prop); `app_bottom` does not
(`{}` props, confirmed against the pinned `.d.ts`) and reads as generic global chrome once actually seen
rendered, matching the concern predicted from the type shape alone. `session_prompt_right` renders but
visibly grows the prompt row height, which the owner found intrusive in practice — `sidebar_footer` was
the one kept after comparing all three live.

One further design correction made from live use, not from the API docs: OpenCode's own native sidebar
already shows model, context percentage, and session cost (confirmed via `client.tui.showToast`-adjacent
research — GitHub issue #6026, "PR moved context usage (tokens, percentage, cost) from header to
sidebar") and **no config exists to disable or relocate that native display** (checked three ways: the
pinned `tui` config schema in `@opencode-ai/sdk` 1.17.8 has only `scroll_speed`/`scroll_acceleration`/
`diff_style`; current `opencode.ai/docs/config/` adds `cursor`/`mouse`/`attention`/`theme`/`keybinds` but
nothing for context/model visibility; and the community's own request for exactly this,
[opencode#20145](https://github.com/anomalyco/opencode/issues/20145), was closed "not planned"). So the
real build drops model/context/effort/cost entirely rather than duplicating unhideable native chrome —
narrower than this audit's original Tier A/B listing assumed, and correctly so.

## Live verification, continued — two build bugs caught by testing across repos

Caught while the owner tested the real `sidebar_footer` build (`opencode/plugins/statusline.tui.tsx`)
against multiple repos, not by re-reading the API docs:

- **Missed the actual git-discovery mechanism.** The initial build hardcoded a "project repo" +
  "knowledge repo" two-slot model — `directory` itself, plus `directory/knowledge` if it exists. The
  real `statusline.py` (`find_git_repos`, lines 217-240) does a genuine BFS scan up to 3 levels deep for
  *every* repo under the project directory when the root itself isn't one, showing one line per
  discovered repo — no "project repo" placeholder, no error indicator for a non-repo root. A test
  against a directory that wasn't itself a repo but contained one, showed a red `?` error line for the
  root instead of just omitting it — the two-slot model doesn't degrade the way the real scan does.
  Fixed by porting `find_git_repos`/`_is_repo_root` directly (`findGitRepos` in the plugin).
- **Bun's synchronous `execFileSync` doesn't suppress a failed child's stderr the way Node does.**
  Every *expected* git failure (no upstream, not a repo) — already caught and handled correctly in JS —
  was still writing raw stderr straight to the real terminal, visibly corrupting the TUI screen. Fixed
  by passing `stdio: ["ignore", "pipe", "ignore"]` explicitly on every git call rather than trusting a
  default. Worth carrying into any future OpenCode TUI plugin that shells out.
- **A genuine Python→Node semantics gap**: `os.path.relpath(x, x)` returns `"."`; `path.relative(x, x)`
  returns `""`. The curate-drift pathspec build (`curateDrift`) inherited the Python assumption
  uncritically, and `git log ... -- ""` is rejected outright ("empty string is not a valid pathspec")
  — surfaces specifically when `knowledge/` is its own repo (`repoRoot === knowledgeDir`). Fixed with
  `|| "."`.

None of these were caught by reading the API reference or by the earlier mockup-only testing — they only
surfaced once real data (a real non-repo directory, a real split-repo layout) exercised the code. That's
the expected shape of this kind of port, not a process failure: the mockup phase answered "does the slot
render, is it session-scoped, does OpenCode already show this" — questions the visual stub could answer.
Data-shape and cross-language correctness bugs need the real implementation running against real
repos to surface, which is exactly what happened here.

## Bottom line

The blanket "Not planned" was correct in spirit (no drop-in statusline field exists) but overstated in
scope: it is not one yes/no, it's roughly a dozen independent yeses/nos, and several of the "no"s already
have a working substitute path (server-plugin `tool.execute.after` + `showToast`, already-confirmed tool
arg shapes from Phase 2) that needs no new plugin module at all. See `phases.md`'s "Not planned" for the
revised, narrower scope statement and the proposed next phase pending owner sign-off.
