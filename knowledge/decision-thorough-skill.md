# Leveled `thorough` skill for `arwyl-extras`

**Status:** ACTIVE since 2026-08-31
**Decision:** Ship a new `thorough` skill plus a dispatched `investigator` subagent in `arwyl-extras`
(`arwyl-extras/skills/thorough/`, `arwyl-extras/agents/investigator.md`) — not `arwyl-lite`, per the
same no-knowledge-tree-dependency split test as `decision-plugin-split.md`. Domain-agnostic: research,
an implementation plan that must strictly follow existing patterns, a non-technical review (diet,
finances, a document), anything big enough that missing something is costly — not scoped to
"investigation" as a task type, and not scoped to code. Three levels, trading cost for breadth and
depth:

- **`standard`** (default) — write the task's surface to a checklist file before doing anything else,
  then work it single-handed, citing evidence and chasing each item past its first plausible finding.
- **`deep`** — the same enumeration, then fans the checklist out to parallel `investigator` dispatches
  (cap ~6 branches), one per branch, narrow scope buying real depth per branch.
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
per-item boundaries carried into `deep`/`max` dispatch briefs, so parallel branches don't quietly
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

## Consequences accepted

- `arwyl-extras` bumped `0.2.2` → `0.3.0` for the new skill + agent (`status.md`).
- `deep`/`max` ship as a reasoned bet, not a validated fix — if a future review finds they don't help
  (or that `standard` alone was already sufficient), that's a real possible outcome, not a contradiction
  of this decision; revisit then rather than treating the bet as proven by having shipped it.
- A second local-transcript search of this depth is expensive (two background passes, ~108
  transcripts); not a pattern to repeat casually for every future plugin addition — reserved for
  proposals of this size.
- Renaming same-day, before any install/publish, cost nothing beyond the edit itself — recorded here
  as a scope correction, not as a second shipped version needing its own audit.

## Deliberation

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
