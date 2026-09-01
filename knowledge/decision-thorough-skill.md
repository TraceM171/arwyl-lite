# Leveled `thorough` skill for `arwyl-extras`

**Status:** ACTIVE since 2026-08-31 (reaffirmed 2026-09-01, twice — first the dispatch redesign below, then
again same day after a second real `deep` run measured write-token duplication and a cross-account resume
gap; see "Why", `incident-2026-09-01-thorough-deep-session-limit.md`,
`audit-2026-09-01-thorough-resume-design.md`, `audit-2026-09-01-thorough-gym-live-run.md`)
**Decision:** Ship a new `thorough` skill plus a dispatched `investigator` subagent in `arwyl-extras`
(`arwyl-extras/skills/thorough/`, `arwyl-extras/agents/investigator.md`) — not `arwyl-lite`, per the
same no-knowledge-tree-dependency split test as `decision-plugin-split.md`. Domain-agnostic: research,
an implementation plan that must strictly follow existing patterns, a non-technical review (diet,
finances, a document), anything big enough that missing something is costly — not scoped to
"investigation" as a task type, and not scoped to code. Three levels, trading cost for breadth and
depth:

- **`standard`** (default) — write the task's surface to a checklist file before doing anything else,
  then work it single-handed, citing evidence and chasing each item past its first plausible finding.
- **`deep`** — the same enumeration, then works the checklist through `investigator` dispatches (cap ~6
  branches), each writing its own findings straight to a per-branch results file (linked from the durable
  manifest file, not inlined into it) the moment its completion notification is verified, at every speed —
  narrow scope buying real depth per branch, checkpoint-on-notification buying real survivability of a
  mid-run interruption, and the direct-write buying back the token cost of the orchestrator re-emitting
  what the subagent already generated. A `speed` lever (`fast`/`regular`/`slow`, default `regular`)
  controls how many branches may be simultaneously outstanding, trading wall-clock speed against how much
  an interruption can lose. An interrupted run can be resumed, same session, a different session, or a
  different account, by reading a branch's own transcript file directly, with `SendMessage`-by-agent-ID
  and a fresh dispatch as successive fallbacks.
- **`max`** — finer decomposition (cap ~10-12 branches) plus an adversarial verification round that
  grades every finding CONFIRMED/UNCONFIRMED before it's reported.

Only `standard`'s enumerate-first step is backed by an observed failure. `deep` and `max` are a
reasoned bet, shipped anyway at the owner's explicit request for a genuine high-stakes option — not
something the evidence independently confirmed fixes anything.

## Scope, corrected same day

The first ship was named and framed as `investigate` — a research/audit tool, output always a findings
report. The owner caught this within the hour with two concrete counter-examples: planning a feature
implementation that must strictly follow an existing codebase's patterns and architecture (a *plan* is
the deliverable, not a report), and a thorough review of a diet (no code, no "investigation" in any
technical sense, output is analysis plus recommendations). Both examples run through the exact same
mechanism — enumerate the surface, dispatch/work each branch with a real depth and boundary discipline,
verify at `max`, synthesize — the failure was in the name and in step 3, which said "Report" as if the
output were always a findings list. Renamed to `thorough`; step 3 renamed "Synthesize" with explicit
instruction that the deliverable shape follows the task (report, plan, or analysis+recommendations).
No change to the underlying mechanism itself — the evidence and reasoning below still hold, they were
never actually about "investigation" specifically, just written as if they were.

## Why (current reasoning)

`audit-2026-08-31-thorough-skill-evidence.md` found **one** concrete instance of the failure this was
meant to fix — a session that skipped straight into ad-hoc coverage instead of enumerating the surface
first, caught by the owner, redone. Against this repo's own bar for a mandatory mechanism
(`decision-mechanism-over-prose.md`: observed **read-then-violated, repeatedly**), N=1 does not clear
it — and the same audit found the opposite signal too: the prose-only fix that followed held on its one
retest, and a separate case (a single agent given an explicit scope and explicit permission to take its
time) performed adequately with no mechanism at all. A blanket mandatory mechanism was not justified by
what was actually found.

What *is* justified, and what changed the scope from "build nothing" to "build the minimum": the
enumerate-first step is cheap, mechanical, and directly answers the one confirmed failure — it costs
one file write before searching starts, and turns "was this thorough?" from an assertion into a
checkable planned-vs-covered fact. That part ships as the always-on default, same honesty class as
`decision-retrievability.md` ("preventive, reasoned not measured").

The `deep`/`max` fan-out and verification machinery is a different kind of bet: the owner asked for it
directly, for cases where the stakes justify paying for breadth and depth regardless of whether last
week's transcripts happen to contain a matching failure. Gating it behind an explicit level, rather than
making it the default behavior every "be thorough" phrase triggers, keeps the honest half (`standard`)
and the speculative half (`deep`/`max`) from being presented as the same kind of claim. The two axes are
named separately throughout (`thorough/SKILL.md`, `investigator.md`'s "go deep, not just wide" section)
because the evidence and the owner's own framing both treat breadth (never covered) and depth (covered
but shallow) as distinct failure shapes, not one problem with one fix.

**External corroboration, same day.** `audit-2026-08-31-thorough-skill-external-techniques.md` checked
the shipped design against Anthropic's own published multi-agent research system and the wider
literature. Two production failure modes named there had no guard in the shipped design and were added:
per-item boundaries carried into `deep`/`max` dispatch briefs, so branches don't quietly
duplicate each other's work (an observed failure in Anthropic's own system, not a hypothetical); and
source-quality + "permission to conclude not found" guidance in `investigator.md`, against the same
system's observed unbounded/low-quality search failures. A third gap the local evidence never
surfaced — the skill never defined what makes one checklist *item* "covered", only that the whole
checklist should be — closed the same way, by a criterion converged on by multiple independent sources:
2+ corroborating sources or 1 authoritative one, stop at exhausted novelty rather than the first
plausible answer, and mark a capped/unresolved item as such rather than reporting it as done. The
`deep`/`max` branch caps (~6, ~10-12) turned out to sit close to Anthropic's own published effort-scaling
bands — left unchanged, now with outside corroboration rather than resting on this repo's judgment alone.

Component choice: one new subagent type (`investigator.md`), not two. A real precedent for a dedicated
verifier exists (`claude-security`'s `scan-verifier.md` panel-of-voters pattern, confirmed live in the
official marketplace) but nothing in the evidence calls for a second agent type yet — `max`'s
verification round reuses `investigator` in a VERIFY-mode dispatch instead. `effort: xhigh` and
`tools:` restricted to read/search (`Read, Grep, Glob, Bash, WebSearch, WebFetch`, no `Edit`/`Write`)
are frontmatter fields confirmed *in active use* across `claude-security`'s full shipped agent suite (7
agents) before relying on them here — not assumed from a single sighting. That confirms the fields are
real and accepted, not that this repo has verified the harness actually enforces them end to end; see
`status.md`'s Open item — a silently-ignored field would look identical from the outside until a real
install is tested.

**Checkpoint-on-notification, added 2026-09-01.** The first real `deep` run (`incident-2026-09-01-thorough-deep-session-limit.md`)
fired all branches in one batch, burned a near-full 5-hour session window, and lost every in-flight
branch's work outright when the account's usage limit hit mid-run — no partial findings were recoverable.
Checked live, empirically, with two follow-up test dispatches: every `Agent` dispatch in this harness
resolves asynchronously, and the harness delivers a completion notification automatically once each agent
finishes — **independently per agent, even for agents dispatched together in one batch** (a fast test
branch notified at ~3.5s, a slow one dispatched alongside it notified separately at ~52s). So batching
does not, by itself, expose every branch for the whole run; what exposes a branch is only that its own
notification hasn't arrived and been processed yet. The real defect in the original `deep` design was that
it said to dispatch everything and "collect all reports" before doing anything with them — holding every
branch's result uncommitted regardless of when each one actually finished, which is what turned the gym
run's usage-limit hit into a total loss. **The fix is checkpointing each notification the instant it
arrives; concurrency is a separate, secondary dial**, not the mechanism that prevents loss. A second thing
the test dispatches caught: a completion notification can fire more than once for the same agent, and an
early one is not always the final result (a test branch reported `status: completed` with an interim status
message before a later notification carried the real answer) — checkpointing must verify a notification
actually reads like a finished report before marking a branch done.

`deep`/`max` first shipped this as one branch at a time (concurrency capped at 1) — the most conservative
option, checkpointing each into the checklist file the moment a verified notification arrived. `0.3.1` →
`0.3.2`. Same day, further live testing (below) showed this was more conservative than the evidence
required, and replaced it with the fuller speed-lever design.

**Speed lever + resume, added 2026-09-01, same day.** The owner proposed generalizing `0.3.2`'s
all-or-nothing choice (parallel vs. strictly sequential) into two independent levers — a `speed` dial
controlling concurrency, and a persistent manifest enabling resume — and asked for it to be checked
against reality rather than assumed. `audit-2026-09-01-thorough-resume-design.md` records five live tests
run the same day:

- Batched dispatch **does** deliver independent per-agent completion notifications, not one joint
  notification once everything finishes (confirmed: two agents dispatched together notified separately,
  ~3.5s and ~52s apart) — meaning `0.3.2`'s own stated rationale (batching itself exposes every branch)
  was wrong. Checkpoint-on-notification is the actual mechanism; concurrency only controls how many
  branches are simultaneously *exposed* (dispatched but not yet checkpointed) at once — a real
  speed/exposure tradeoff, not a correctness fix. This justified reintroducing concurrency as a `speed`
  lever (`fast`/`regular`/`slow`, default `regular` — up to `ceil(cap/2)` branches outstanding at once,
  refilling as each is checkpointed) rather than leaving `deep`/`max` sequential-only.
- A completion notification can fire more than once, and an early one is not always final (confirmed: an
  interim status message arrived before the real answer) — checkpointing must verify a notification reads
  like a finished report before marking a branch done, at every speed.
- Subagent transcript paths are documented and stable (`code.claude.com/docs/en/sub-agents`):
  `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl` + a `.meta.json` companion.
  `SendMessage` to that agent ID resumes it from its own stored transcript with full history retained —
  confirmed directly, an agent recalled its own prior result from memory with zero tool calls.
- **This resume mechanism works across a genuinely separate session**, if that session's `subagents/`
  folder contains a copy of the target transcript — confirmed via a real, isolated test: a fresh session
  UUID, a copied-in transcript, a real separate `claude -p` process (Haiku, cost $0.0545) that had never
  dispatched the agent, successfully resumed it and recalled the correct original answer, zero redone
  work. The transcript's own embedded (mismatched) `sessionId` and a `toolUseId` with no counterpart in
  the new session's history did not block or visibly corrupt this. **Caveat carried into the design
  honestly**: one test, one small, cleanly-completed transcript — not verified at the scale of a real
  `investigator` branch (megabytes) or against a transcript cut off specifically by a usage-limit hit
  rather than ending cleanly. `thorough/SKILL.md` treats cross-session resume as best-effort with a
  fresh-dispatch fallback, not a guaranteed mechanism, on this basis.
- `$CLAUDE_CODE_SESSION_ID` reliably exposes the current session's own ID (confirmed directly) — simpler
  and more portable than any path-parsing heuristic, and what the manifest now records so a later,
  different session can find the origin session's transcripts.

`deep`/`max` now: track a manifest (origin session ID, project directory, per-branch status/agent ID) in
the same durable checklist file; checkpoint on verified notification at whichever speed is running; and
support resuming an interrupted run, same-session via `SendMessage`-by-ID or cross-session via
copy-then-`SendMessage`-by-ID with a fresh-dispatch fallback (`thorough/SKILL.md`, "Resuming an
interrupted run"). `0.3.2` → `0.3.3`. (`0.3.4`, below, adds per-branch results files and reorders resume
to try a direct transcript read before `SendMessage`.)

**Same-day finding: this significantly overlaps a real, native Claude Code feature — "dynamic workflows"
(`/docs/en/workflows`).** A workflow is a JS script Claude writes that orchestrates many subagents with
`agent()`/`pipeline()`/`parallel()`, journaled so a run is resumable — but explicitly **only within the
same session**; the docs state a fresh session "has nothing to replay and starts the workflow over." This
told us the platform's own native resume would *not* cover the cross-session case on its own — it's why
the custom `SendMessage`-plus-copied-transcript mechanism above was worth designing and testing rather
than assuming the native feature already handled it. Workflows also ship native concurrency control,
per-agent cost visibility, and a large-run cost warning (`/workflows`, >25 agents or >1.5M projected
tokens) — exactly the visibility whose absence made the gym run's cost invisible until the limit hit.
Bundled `/deep-research` already does much of what `thorough`'s `deep` level does. Not adopted this pass:
workflows are gated (opt-in on Pro via `/config`, can be org-disabled), so a workflow-only `thorough` would
break for consumers without them — this stays a prose skill for now, with whether to also ship an
experimental `arwyl-extras/workflows/*.js` alternative left as an open, not-yet-decided direction.

**Second real `deep` run, write-token duplication measured, cross-account resume gap found, added
2026-09-01.** A second real `deep`/`slow` run (`audit-2026-09-01-thorough-gym-live-run.md`) hit the
account's session limit a second time — mid-run again, this time at `slow` speed, confirming the loss is
driven by total token spend, not concurrency. Checkpoint-on-notification held: branches 1–3 survived. Two
new things were measured, not previously evidenced:

- **Write-token duplication is real and triples, not doubles.** A branch's subagent generates its findings
  once (output tokens, in the `<task-notification>`); the orchestrator then re-emits a condensed version via
  `Edit` to checkpoint it into the working file (13–21KB per branch, measured); `SKILL.md` step 4 then
  `Read` the whole working file back into context and `Write`ed a fresh ~110KB permanent knowledge file —
  a third re-emission of the same material. Confirmed the owner's own diagnosis of this cost, with real
  numbers behind it for the first time.
- **The documented cross-session resume mechanism (`SendMessage`-by-copied-agent-ID,
  `audit-2026-09-01-thorough-resume-design.md`) was distrusted for the cross-*account* case and never
  attempted.** What worked instead: reading the subagent's own raw transcript `.jsonl` directly with a
  one-off script and extracting its last real text turn — no live agent, no session/account match needed,
  just a file path. It also recovered a branch whose notification had arrived in the origin session one
  turn before the account limit killed the turn that would have checkpointed it — real evidence that
  `decision-thorough-skill.md`'s prior "lost outright" framing for an in-flight branch overstated the risk:
  the raw transcript is a free, reliable fallback independent of whether the notification round-trip
  completed.

**Fixes shipped, checked against Claude Code's actual permission model first.** Confirmed via
`code.claude.com/docs/en/sub-agents`: subagent frontmatter `tools:` is a flat allow-list of tool names, and
the `Agent` dispatch call carries no per-invocation permission override (only `model` is per-invocation) —
so a hard, harness-enforced "this dispatch may write only to this one path" is not natively available; the
real mechanism would be a `PreToolUse` hook cross-checking a live agent-id→path manifest, which adds real
complexity under concurrent (`fast`/`regular`) dispatch and isn't justified yet by more than this one
run's evidence (see "Rejected"). What shipped instead, `arwyl-extras` `0.3.3` → `0.3.4`:

- `investigator` gains the `Write` tool, narrowly: its dispatch brief now assigns a single per-branch
  result-file path, and it is instructed to write its full findings there and return only a short pointer
  + bottom-line in its report — prompt-enforced, not permission-enforced, the same honesty class as the
  branch-boundary discipline this skill already relies on prose for. A Write failure falls back to
  reporting in full, so a broken write never silently drops findings.
- The checklist file's "Checkpointed findings" now link to each branch's result file instead of inlining
  it — killing the hop-2 duplication (the `Edit` sizes measured above).
- `SKILL.md` step 4 (persistence) now reuses step 3's already-synthesized text instead of re-reading the
  working file and regenerating it — killing the hop-3 duplication.
- The manifest now records each branch's exact subagent transcript file path at dispatch time (not just
  the shared subagents directory once at the top), and "Resuming an interrupted run" now tries a direct
  transcript read first, same-session or cross-session/cross-account alike, before considering
  `SendMessage`-by-ID — the ordering this run actually needed.
- `SKILL.md` step 4 gained an explicit cleanup offer: once persistence succeeds, ask whether to delete the
  now-superseded working checklist file (and per-branch result files).

## Rejected

- **A blanket mandatory mechanism (fan-out always-on, no levels)** — the evidence bar this repo already
  holds itself to (`decision-mechanism-over-prose.md`) is not met; N=1 with a clean retest does not
  justify making the heavy path the only path.
- **Ship nothing, rely on the free technique alone** (explicit scope + explicit permission to take time
  + strict framing — what worked in the TheScriv counter-instance) — rejected as the *only* answer: it
  is real and worth knowing, but it doesn't explain why the one confirmed failure happened (no scope was
  given at all, because nothing had been enumerated yet), and it leaves the owner with no path to a
  deliberately higher-cost option for cases they judge worth it.
- **Scoping the skill to "investigation" as a task type** (the original `investigate` name and framing)
  — rejected same day the skill first shipped: the mechanism itself is task-shape-agnostic, and naming
  it as if the output were always a findings report actively misleads for a planning or non-technical
  analysis task. See "Scope, corrected same day" above.
- **A second `verifier` agent type**, or a multi-voter panel for `max`'s verify round (`scan-verifier.md`'s
  three-voters-per-lens pattern, and self-consistency literature generally) — real precedent exists for
  the *idea*, confirmed twice now (original design pass and `audit-2026-08-31-thorough-skill-external-techniques.md`),
  but self-consistency's own literature notes it doesn't clearly transfer to open-ended findings that
  can't be cleanly voted on, and nothing has shown our single-voter VERIFY mode actually produces wrong
  grades. **Named trigger to revisit:** a real `max` run whose single-verifier grade turns out wrong
  (a false CONFIRMED or false UNCONFIRMED caught later) — build the panel then, not speculatively now.
- **Reusing the `ReportFindings` tool** for the findings output — that tool is scoped to `/code-review`
  by its own description; not this skill's to borrow.
- **An effort-level vocabulary matching `/code-review`'s full low/medium/high/xhigh/max/ultra ladder** —
  three levels cover the breadth/depth tradeoff this evidence supports; a finer ladder can be added if a
  real case shows these three don't discriminate enough.
- **A `PreToolUse`-hook-enforced per-branch write scope**, added 2026-09-01 — the mechanically-correct
  version of the write-duplication fix, checking each `Write`/`Edit` call against a live agent-id→path
  manifest and denying anything outside it. Not shipped: it needs a way to identify which dispatched
  subagent a given tool call belongs to and keep the manifest current under concurrent (`fast`/`regular`)
  dispatch, and one run's evidence doesn't justify that complexity yet against this repo's own mechanism
  bar (`decision-mechanism-over-prose.md`). Shipped instead: the prompt-scoped version (see "Why"). **Named
  trigger to revisit:** `investigator` writing outside its assigned path in a real run.

## Consequences accepted

- `arwyl-extras` bumped `0.2.2` → `0.3.0` for the new skill + agent (`status.md`).
- `deep`/`max` ship as a reasoned bet, not a validated fix — if a future review finds they don't help
  (or that `standard` alone was already sufficient), that's a real possible outcome, not a contradiction
  of this decision; revisit then rather than treating the bet as proven by having shipped it.
- **Real-world cost confirmed, 2026-09-01**: the first live `deep` dispatch burned a near-full 5-hour
  session window in one run (measured tokens/tool-calls, not an estimate) — the bet in "Why" is no
  longer untested. That same run showed no mid-run checkpointing: all 5 in-flight `investigator`
  dispatches died with zero findings returned when the limit hit. Fixed same day by moving `deep`/`max`
  to sequential, checkpointed dispatch (see "Why" — Checkpoint-on-notification, added 2026-09-01);
  `arwyl-extras` bumped `0.3.1` → `0.3.2`. `incident-2026-09-01-thorough-deep-session-limit.md`.
- **Speed lever + resume shipped, same day, 2026-09-01**: `0.3.2`'s sequential-only choice was more
  conservative than the evidence required — five further live tests (see "Why" — Speed lever + resume,
  `audit-2026-09-01-thorough-resume-design.md`) showed checkpoint-on-verified-notification, not
  concurrency, is what prevents loss, and that a resume-by-agent-ID mechanism genuinely works both
  same-session and (tested once, at small scale) cross-session. `arwyl-extras` bumped `0.3.2` → `0.3.3`.
- **Write-scoping + resume-ordering fix shipped, same day, 2026-09-01**: a second real `deep` run
  (`audit-2026-09-01-thorough-gym-live-run.md`) hit the session limit a second time (this time at `slow`),
  measured the write-token duplication directly (triples, not doubles), and surfaced a real cross-account
  resume case that bypassed the documented `SendMessage`-by-ID mechanism entirely in favor of direct
  transcript-reading — `arwyl-extras` bumped `0.3.3` → `0.3.4`. Fixed: prompt-scoped `Write` for
  `investigator`, per-branch result files, transcript-read-first resume ordering, and a persistence
  cleanup offer (see "Why"). `investigator`'s read-only design is now narrowly relaxed (one `Write`, one
  assigned path, prompt-enforced) — a real departure from its original "no editing tools" framing,
  accepted because the cost it removes is measured, not assumed, and the fallback (report in full if the
  write fails) keeps the read-only design's actual guarantee — findings are never silently dropped —
  intact.
- **Still open, not closed by `0.3.4`**: `SendMessage`-by-agent-ID resume — cross-session-same-account
  (tested, `audit-2026-09-01-thorough-resume-design.md`) vs. cross-account (never actually attempted; the
  one real case fell back to transcript-reading before trying it) — remains a real gap in what's verified;
  the prompt-scoped `Write` restriction on `investigator` is not harness-enforced, only instructed (see
  "Rejected" — the `PreToolUse`-hook version); the cost warning still doesn't name a session-limit number
  for non-API accounts; and `max`'s cost (finer branches *plus* a full verify wave) has never actually run
  to confirm it's the several-times-`deep` estimate in the incident file, not measured.
- A second local-transcript search of this depth is expensive (two background passes, ~108
  transcripts); not a pattern to repeat casually for every future plugin addition — reserved for
  proposals of this size.
- Renaming same-day, before any install/publish, cost nothing beyond the edit itself — recorded here
  as a scope correction, not as a second shipped version needing its own audit.

## Deliberation

- `audit-2026-09-01-thorough-gym-live-run.md` — the second real `deep` run: write-token duplication
  measured directly, a real cross-account resume case, and the `0.3.4` fixes it justified.
- `audit-2026-09-01-thorough-resume-design.md` — the five live tests behind the `0.3.3` speed-lever and
  resume design: notification independence/duplication, subagent transcript path stability, same- and
  cross-session resume-by-ID, and the `$CLAUDE_CODE_SESSION_ID` env var.
- `incident-2026-09-01-thorough-deep-session-limit.md` — first real `deep` dispatch: cost confirmed via
  measured tokens/tool-calls, hard session limit hit.
- `audit-2026-08-31-thorough-skill-evidence.md` — the evidence review: the one confirmed failure,
  the clean retest, the counter-instance, and the verdict this decision is built on.
- `audit-2026-08-31-thorough-skill-external-techniques.md` — same-day external corroboration against
  Anthropic's own multi-agent research system and the wider literature; the source of the boundary,
  "covered"-criterion, and source-quality fixes, and of the named multi-voter-panel revisit trigger.
- `decision-mechanism-over-prose.md` — the bar this proposal was checked against, and did not clear in
  full (hence the leveled, opt-in shape rather than an always-on mechanism).
- `decision-retrievability.md` — the precedent for an honestly-labeled preventive addition on thin
  evidence.
- `decision-plugin-split.md` — why `arwyl-extras`, not `arwyl-lite`.
