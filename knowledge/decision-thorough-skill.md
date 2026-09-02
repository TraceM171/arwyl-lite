# Leveled `thorough` skill for `arwyl-extras`

**Status:** ACTIVE since 2026-08-31 (reaffirmed 2026-09-01, twice — first the dispatch redesign below, then
again same day after a second real `deep` run measured write-token duplication and a cross-account resume
gap; and again 2026-09-02 after a fourth consumer's `deep` run completed fully for the first time and
surfaced two more real fixes; see "Why", `incident-2026-09-01-thorough-deep-session-limit.md`,
`audit-2026-09-01-thorough-resume-design.md`, `audit-2026-09-01-thorough-gym-live-run.md`,
`audit-2026-09-02-field-study-ai-setup.md`)
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

**Checkpoint-on-notification, added 2026-09-01.** The first real `deep` run
(`incident-2026-09-01-thorough-deep-session-limit.md`) dispatched all branches in one batch and waited to
"collect all reports" before doing anything with them; when the account's usage limit hit mid-run, every
in-flight branch was lost outright, with zero findings recoverable. Two live test dispatches
(`audit-2026-09-01-thorough-resume-design.md`, Findings 1–2) showed batching itself was never the real
exposure mechanism — the harness delivers a completion notification independently per agent, even for
agents dispatched together, so what exposes a branch is only that its own notification hasn't been
processed yet. **The fix is checkpointing each notification the instant it verifiably arrives; concurrency
is a separate, secondary dial**, not what prevents loss — and a notification can fire more than once, with
an early one not always the final result, so checkpointing must verify a notification reads like a
finished report before marking a branch done.

`deep`/`max` first shipped this as one branch at a time (concurrency capped at 1) — the most conservative
option, checkpointing each into the checklist file the moment a verified notification arrived. `0.3.1` →
`0.3.2`. Same day, further live testing (below) showed this was more conservative than the evidence
required, and replaced it with the fuller speed-lever design.

**Speed lever + resume, added 2026-09-01, same day.** The owner proposed generalizing `0.3.2`'s
all-or-nothing choice (parallel vs. strictly sequential) into two independent levers — a `speed` dial
controlling concurrency, and a persistent manifest enabling resume — checked against reality via five
live tests (`audit-2026-09-01-thorough-resume-design.md`): checkpoint-on-verified-notification, not
concurrency, is what prevents loss, which justified reintroducing concurrency as a genuine
speed/exposure tradeoff (`speed`: `fast`/`regular`/`slow`, default `regular`, up to `ceil(cap/2)` branches
outstanding at once, refilling as each is checkpointed) rather than leaving `deep`/`max` sequential-only;
subagent transcript paths are documented and stable, and `SendMessage`-by-agent-ID genuinely resumes a
finished agent from its own retained history with zero redone work — confirmed same-session, and once, at
small scale, across a genuinely separate session (one small, cleanly-completed transcript; not verified at
real-branch scale or against a usage-limit-killed transcript, so `thorough/SKILL.md` treats cross-session
resume as best-effort with a fresh-dispatch fallback, not guaranteed). `$CLAUDE_CODE_SESSION_ID` reliably
exposes the current session's own ID, and the manifest now records it so a later, different session can
find the origin session's transcripts.

`deep`/`max` now: track a manifest (origin session ID, project directory, per-branch status/agent ID) in
the same durable checklist file; checkpoint on verified notification at whichever speed is running; and
support resuming an interrupted run, same-session via `SendMessage`-by-ID or cross-session via
copy-then-`SendMessage`-by-ID with a fresh-dispatch fallback (`thorough/SKILL.md`, "Resuming an
interrupted run"). `0.3.2` → `0.3.3`. (`0.3.4`, below, adds per-branch results files and reorders resume
to try a direct transcript read before `SendMessage`.)

**Same-day finding: this significantly overlaps a real, native Claude Code feature — "dynamic workflows"
(`/docs/en/workflows`)** — journaled subagent orchestration with native concurrency control, per-agent
cost visibility, and a large-run cost warning, but explicitly resumable only within the same session
(`audit-2026-09-01-thorough-resume-design.md`, Finding 7) — confirming the cross-session gap this design's
custom `SendMessage`-plus-copied-transcript mechanism exists to close, and that the visibility whose
absence made the gym run's cost invisible is a solved problem natively. Bundled `/deep-research` already
does much of what `thorough`'s `deep` level does. Not adopted this pass: workflows are gated (opt-in on
Pro via `/config`, org-disableable), so a workflow-only `thorough` would break for consumers without
them — this stays a prose skill for now, with whether to also ship an experimental
`arwyl-extras/workflows/*.js` alternative left as an open, not-yet-decided direction.

**Second real `deep` run, write-token duplication measured, cross-account resume gap found, added
2026-09-01.** A second real `deep`/`slow` run (`audit-2026-09-01-thorough-gym-live-run.md`) hit the
account's session limit again — confirming the loss is driven by total token spend, not concurrency — but
checkpoint-on-notification held this time (branches 1–3 survived). Two things were measured, not
previously evidenced: **write-token duplication is real and triples, not doubles** — a branch's subagent
generates its findings once, the orchestrator's checkpoint `Edit` re-emits a condensed version, then
`SKILL.md` step 4 re-reads and re-`Write`s the whole thing again as a fresh permanent knowledge file, a
third re-emission of the same material; and **the documented cross-session resume mechanism was
distrusted for the cross-account case and never attempted** — reading the subagent's own raw transcript
`.jsonl` directly substituted itself, no live agent or session/account match needed, and also recovered a
branch whose notification had arrived one turn before the account limit killed the turn that would have
checkpointed it — real evidence the prior "lost outright" framing for an in-flight branch overstated the
risk, since the raw transcript is a free, reliable fallback independent of whether the notification
round-trip completed.

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

**First full `deep` completion, observed live in a fourth consumer, two more real fixes, added
2026-09-02.** `audit-2026-09-02-field-study-ai-setup.md` watched a real `deep`/`regular` run to
completion for the first time — no session/usage limit hit, confirming the pre-flight disclosure, the
`regular` sliding window, and checkpoint-on-notification all hold as designed across a full 6-branch run.
Two gaps surfaced: a branch's checklist entry never actually collapsed to the single status line step 1
describes — the checkpoint step edits a *different*, already-touched line and never revisits the original
enumeration-time line, so every branch ends up carrying two disagreeing `Status:` values for the life of
the run (a real resume ambiguity, though resume was never exercised in this run); and `investigator`'s
returned report ran several times over its "2–4 sentences" bound, which the orchestrator reuses
near-verbatim as the checklist bottom-line, eroding a small slice of `0.3.4`'s write-duplication fix (the
core fix holds — this is a much smaller leak than the duplication it already eliminated).

Both fixed as prose/structure, not new mechanisms — per `decision-mechanism-over-prose.md`'s bar, N=1
run (6 dispatches within it) doesn't justify a harness-enforced check for either. `arwyl-extras` `0.3.4`
→ `0.3.5`:

- `SKILL.md` step 1 now defines exactly one status-bearing line per branch, extended in place through
  `pending` → `launched` → `finished` rather than annotated by a second line; step 2b's dispatch and
  checkpoint instructions reworded to match. The Scope/boundary/lettered sub-items are explicitly *not*
  touched by this — a wrong first draft of this fix collapsed them away, caught by checking what
  `audit-2026-09-01-thorough-gym-live-run.md`'s 13–21KB measurement actually was (the findings-text
  re-write `0.3.4` already killed, not the enumeration).
- `investigator.md`'s report instruction tightened from "2–4 sentences" to **one sentence** as a hard
  target, with an explicit escape hatch: if compressing a finding to one sentence feels lossy, that
  nuance belongs in the results file, not the report.
- `field-study/SKILL.md` gained a liveness caution: a subagent's own transcript looking stale mid-run
  isn't evidence of an interrupted `deep` run — check the orchestrating session's own transcript
  (recency, `pendingBackgroundAgentCount`) before diagnosing one. (Learned the hard way, same study —
  see its Method notes.)

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
- **Real-world cost confirmed, 2026-09-01** (see "Why" — Checkpoint-on-notification): the bet in "Why" is
  no longer untested; fixed same day by moving `deep`/`max` to sequential, checkpointed dispatch.
  `arwyl-extras` bumped `0.3.1` → `0.3.2`.
- **Speed lever + resume shipped, same day, 2026-09-01** (see "Why" — Speed lever + resume): `0.3.2`'s
  sequential-only choice was more conservative than the evidence required. `arwyl-extras` bumped
  `0.3.2` → `0.3.3`.
- **Write-scoping + resume-ordering fix shipped, same day, 2026-09-01** (see "Why" — Second real `deep`
  run and Fixes shipped): `arwyl-extras` bumped `0.3.3` → `0.3.4`. `investigator`'s read-only design is
  now narrowly relaxed (one `Write`, one assigned path, prompt-enforced) — a real departure from its
  original "no editing tools" framing, accepted because the cost it removes is measured, not assumed, and
  the fallback (report in full if the write fails) keeps the read-only design's actual guarantee —
  findings are never silently dropped — intact.
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
- **First full `deep` completion confirmed, fourth consumer, 2026-09-02** (see "Why" — First full `deep`
  completion): real evidence the checkpoint-on-notification + `regular`-speed design can complete
  end-to-end. `arwyl-extras` bumped `0.3.4` → `0.3.5`. Still not exercised by this run: resume (never
  needed it) and `max`.

## Deliberation

- `audit-2026-09-02-field-study-ai-setup.md` — first observed full `deep` completion (a fourth,
  unrelated consumer): the checklist-collapse and investigator-report-length fixes behind `0.3.5`.
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
