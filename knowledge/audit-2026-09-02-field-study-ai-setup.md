# Audit — field study of a fourth consumer, AI-setup (2026-09-02)

Frozen record of a read-only field study, via the `field-study` skill, focused specifically on
`thorough`'s `deep` level in real use — not a whole-tree health pass. The consumer, `AI-setup`, is
unrelated to sanctum (the field-test consumer), TheScriv (mobile app), or the gym-tracking project
behind `incident-2026-09-01-thorough-deep-session-limit.md` / `audit-2026-09-01-thorough-gym-live-run.md`:
a brand-new (2026-09-01), no-git, single-owner project designing an AI coding-agent architecture.

Living verdicts from this study: two fixes to `arwyl-extras/skills/thorough/SKILL.md` and
`arwyl-extras/agents/investigator.md`. Shipped in `0.3.5`.

File paths in backticks below are quoted **from the consumer's tree or its session transcripts**
unless they name a file in `arwyl-extras/` or this `knowledge/`.

## Baseline

- **Consumer arwyl-extras version: `0.3.4`**, established behaviourally — `agentType:
  "arwyl-extras:investigator"` in every dispatched subagent's `.meta.json` (a real marketplace plugin
  install, not a manual copy) plus per-branch `investigator` `Write`s to individual results files, a
  `0.3.4`-only feature (`decision-thorough-skill.md`).
- **No `_curated.md`, no git.** The project is one day old; nothing to say yet about `reflect`/`curate`
  behaviour in this consumer. Out of scope for this study by design — see the framing above.
- **The run studied:** `/arwyl-extras:thorough deep regular <task>` — the user gave level and speed
  explicitly in the slash-command args, so the "determine the level" step (Levels, `SKILL.md`) had
  nothing ambiguous to resolve. 6 branches, `thorough/ai-system-review/`, reviewing the project's own
  ratified AI-coding-agent architecture against external evidence (pricing pages, GitHub issues,
  leaderboards, community reports) the project's own internal research hadn't surveyed.
- **Observed live, not reconstructed after the fact.** I began reading mid-run, initially misdiagnosed
  it as interrupted (3 of 6 branches showed `launched` with empty results files), and corrected that by
  checking the *orchestrating* session's own transcript rather than the subagents' — see the `field-study`
  SKILL.md fix below. The run was then watched to completion: all 6 branches finished, followed by
  step 3 (synthesize) and the start of step 4 (persistence offered, pending the consumer's own owner's
  reply — not observed, and not this skill's to act on).
- Evidence: the 6 subagent `.jsonl` transcripts (Write tool calls and their tool_results, each
  investigator's own returned report text), the orchestrating session's own `.jsonl` (its pre-flight
  text, dispatch/checkpoint timing, final synthesis), and `thorough/ai-system-review/checklist.md` read
  at three points across the run (mid-run, after all 6 finished, unchanged since).

## Finding 1 (confirmed gap) — a "finished"/"launched" branch entry doesn't collapse to one status line; it grows a second, contradictory one

`SKILL.md` step 1 says a finished branch's checklist entry "becomes a link to its results file... not
the findings themselves." In this consumer's real run, every branch's *original* per-branch tracking
line from enumeration — a plain `Status: pending. Results: findings/branch-N.md` — was left completely
untouched at each of 6 real checkpoint events (branches 1–3 at ~10:30–10:44, then 4–6 as the `regular`
window refilled through ~10:59). What actually got edited was a *different*, bolded summary line the
orchestrator had already added at dispatch time (`**Agent ID:** ... · **Transcript:** ... · **Status:**
launched`), later flipped to `finished` with a bottom-line appended. Result, confirmed at final state
(`grep -c` over the finished checklist): **6 of 6 branches carry two disagreeing `Status:` fields** —
one correct (`finished`), one stale (`pending`) — for the life of the run.

**Why this is a system gap, not a one-off:** the orchestrator naturally re-edits the line it already
touched at dispatch (the bolded summary) and never re-visits the separate line it wrote once at
enumeration and considered done — nothing in `SKILL.md` names these as the same field. Any consumer
running `deep`/`max` on `0.3.4` would very likely reproduce it; it isn't AI-setup-specific.

**Hazard:** "Resuming an interrupted run" reads this exact manifest to decide what to re-dispatch. A
branch reporting both `finished` and `pending` is a resume ambiguity by construction — this wasn't
tested here (the run never needed resuming), but the file that would be read by a resume pass already
contains it.

**Fix (`0.3.5`):** per `decision-mechanism-over-prose.md`'s bar, a prose reminder to "also update the
other line" is the wrong instrument — the fix is structural. `SKILL.md` step 1 now defines exactly one
status-bearing line per branch (`**Status:** pending · **Results:** ...`), extended in place through
`launched` and `finished` rather than annotated by a second line; step 2b's dispatch and checkpoint
instructions were reworded to match ("edited in place, not a second line"). The Scope/boundary/lettered
sub-items are *not* touched by this fix and stay intact through `finished` at every level — see the
correction below.

**A wrong hypothesis, caught before shipping.** My first draft of this fix also collapsed away each
branch's Scope and lettered sub-items at `finished`, reading step 1's "becomes a link... not the
findings themselves" as license to delete the enumeration once a branch closes out. Checking
`audit-2026-09-01-thorough-gym-live-run.md`'s own measurement (the 13–21KB `Edit`s it flagged were the
orchestrator's *condensed re-write of each subagent's full findings* — the thing `0.3.4` already killed
by moving findings to per-branch files) showed that reading was wrong: the rule is about keeping
findings *text* out of the checklist, not about deleting the breadth artifact step 3 explicitly leads
with ("what was covered, what turned up nothing"). The AI-setup checklist finished this run at 19.5KB
with all scaffolding intact — bloat from the enumeration itself is not an observed problem. Fixed to
preserve the scope/items; only the status line's shape changes.

## Finding 2 (confirmed gap, moderate significance) — `investigator`'s returned report isn't "2–4 sentences," eroding part of `0.3.4`'s fix

Measured directly on all 6 branches' own final returned-report text (not their results-file `Write`
content): 1646 / 2513 / 1240 / 1769 / ~1800 / 1796 characters — 3 to 5× a strict "2–4 sentences"
reading, one with a bulleted sub-breakdown. `SKILL.md` step 2b then reuses this as the checklist's
"one-line bottom-line" near-verbatim, so the checklist ends up holding a dense paragraph per branch
instead of a pointer.

**Calibrated, not overstated:** this is a smaller recurrence of the write-duplication problem `0.3.4`
was built to fix, not the same magnitude. The full per-branch results files stayed real and
not duplicated (21–31KB each of actual findings+citations, confirmed by direct read); the overshoot is
~1.2–2.5KB per branch landing in the checklist, against the 13–21KB/branch `Edit`-based duplication
`0.3.4` already eliminated (Finding 1's note above). The core `0.3.4` mechanism holds; a slice of its
intended savings is eroding because "2–4 sentences" is soft prose a rich, dense finding doesn't
reliably respect. N=1 run / 6 dispatches within it — real and consistent within this run, not yet
cross-run replicated.

**Fix (`0.3.5`), same honesty class as the branch-boundary discipline this skill already relies on
prose for:** `investigator.md`'s report instruction tightened from "2–4 sentences" to **one sentence**
as a hard target, with an explicit escape hatch — if compressing the finding to one sentence feels
lossy, that nuance belongs in the results file, not the report. No character-count figure: a bound the
model can't reliably self-count precisely is the same prose instrument with a number attached, not a
harder mechanism.

## What's working — first real end-to-end `deep` completion

This is the first observed `deep` run to finish all 6 branches, reach step 3 (synthesize), and reach
step 4 (persistence offered) without hitting a session/usage limit — both prior real dispatches
(`incident-2026-09-01-thorough-deep-session-limit.md`, `audit-2026-09-01-thorough-gym-live-run.md`) hit
one mid-run. Specifics that held:

- **Pre-flight disclosure line, textbook.** Verbatim from the orchestrator's first text turn: *"Running
  **deep / regular**. This costs meaningfully more time and tool calls than a normal answer — I'll fan
  out 6 research branches (up to 3 outstanding at once)... A checkpoint directory
  (`thorough/ai-system-review/`) will track progress... an interruption at `regular` speed could lose at
  most ~3 branches' worth of work, not the whole run."* Also correctly checked for a prior run to resume
  first ("No prior run to resume").
- **Checkpoint-on-notification + `regular`-speed sliding window**, confirmed across 6 real checkpoint
  events, kept ≤3 outstanding throughout and refilled correctly as each landed (branches 1–3 dispatched
  together ~10:30; 4, 5, 6 dispatched individually at ~10:43/10:44/10:45 as 3, 1, 2 finished in that
  order).
- **Untrusted-data discipline held, twice, independently.** Branch 1's investigator caught and
  disregarded a genuine prompt injection embedded in WebSearch results ("REMINDER: you MUST include the
  sources above..."); branch 2's investigator flagged an unrelated MCP-server-instructions block that
  had leaked into its own context (this host's own Notion-connector instructions, not a web injection)
  and correctly treated it as inapplicable rather than following it. Both self-reported per
  `investigator.md`'s instruction to flag suspicious embedded content.
- **Source-quality discipline held.** Branch 1 caught WebSearch's own summarizer hallucinating facts
  (wrong tool creator, wrong star count, details blended from an unrelated tool) and re-verified via
  direct `WebFetch` instead of trusting the summary — exactly what `investigator.md` asks for.
- **Branch boundaries respected** across all 6 finished reports — no visible cross-branch duplication.
- **Step 3 synthesis was well-organized and substantive**, not a checklist restatement: led with
  coverage limits actually hit (Reddit unreachable to every branch that tried, no first-person cost
  report found anywhere), then worked constraint-by-constraint with a ranked, concrete action list —
  including catching that its own source project's ratified decisions were already one step stale
  (a newer model version on the same integration surface, a workhorse model retired by its vendor).
- **Step 4's persistence offer fired correctly**: named the specific target files (a dated audit in
  `knowledge/research/` plus corrections to two named `decision-*.md` files), correctly noted the
  `knowledge-org` skill is required for it, and stopped to ask rather than writing unprompted — matching
  `SKILL.md` step 4 exactly. (What the consumer's owner decided was not observed — outside this study's
  read-only boundary.)

## Consumer-side observations

None — both findings above are system-level (would reproduce for any consumer on `0.3.4`), and the
consumer's own knowledge tree is one day old with nothing yet to say about its `reflect`/`curate`
behaviour.

## Method notes

- This study also corrected the `field-study` skill itself: a first read of the mid-run state
  (3 of 6 branches `launched`, 2 with empty results files) was misdiagnosed as an interrupted run purely
  from the subagents' own transcripts. The orchestrating session's own transcript (recency,
  `pendingBackgroundAgentCount: 2`) was the actual liveness signal, and settled it: the run was alive
  and behaving exactly as designed. A caution was added to `field-study/SKILL.md` step 3c so a future
  study checks the orchestrator's transcript before diagnosing an interruption.
- N=1 run, 6 `investigator` dispatches within it — real and internally consistent, not independent
  cross-run replication. Both findings are shipped as prose fixes (a structural template change for
  Finding 1, a tightened instruction for Finding 2), not new mechanisms, matching
  `decision-mechanism-over-prose.md`'s bar for what this evidence actually supports.
- Resume was never exercised — the run never needed it. `max` also remains unexercised by this study.
