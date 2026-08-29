# Mechanism over prose for rules violated under pressure

**Status:** ACTIVE since 2026-07-29
**Decision:** A rule that field evidence shows is **read and then violated anyway** does not get
restated more forcefully — it gets a **mechanism** that fires at the moment of the violation.
Rules the agent navigates to at the point of decision stay as prose. The dividing test is
empirical, not aesthetic: *was the rule in context, and violated regardless?*

First application: the `status.md` recent-changes budget, now enforced by the
`hooks/status-budget.py` `PostToolUse` hook, and restated in **characters** (300) rather than lines
so it is countable at all. Second, pre-existing: the `AGENTS.md` size budget in `.githooks/pre-commit`.

## Why (current reasoning)

The 2026-07-29 field study (`audit-2026-07-29-field-study-curate.md`) found the entry budget
violated in **7 of 7** work sessions examined, spanning three weeks and two arwyl versions. In every
case a `reflect` pass trimmed entries written by the *immediately preceding* commit — the same
session's own live capture.

The decisive detail is that the rule was **not missing**. In all three work-session transcripts
checked, the agent had invoked the `knowledge-org` skill *before* its `status.md` writes, and
`AGENTS.md` — inlined verbatim into every session — already stated the budget. The rule was in
context twice and the entry was written 4–8 lines long anyway. The mechanism is **distance**: the
rule is read early, the write lands 150+ turns later, mid-task, under the "just add the context
while I'm writing it" pressure `KNOWLEDGE_ORG.md` itself names.

`reflect.md` had already diagnosed this precisely — "the most-violated rule in the whole system…
violated *from inside this session*, by you" — and responded with more prose. That is the datum: the
system correctly identified the failure and its chosen remedy did not move it.

A second consequence: because `reflect` reliably cleans this up, the tree never actually corrupts,
which is why the problem stayed invisible for three weeks. The cost is rework every session plus
full exposure whenever `reflect` is skipped — and `reflect` is designed to be the optional safety
net, not the enforcement path. A rule whose only enforcement is the optional step is unenforced.

**Characters, not lines**, follows from the same evidence. A curate pass reported the budget fixed
while leaving 14 of 96 entries over two physical lines — because hard wrapping makes a line count
mean different things to writer, reviewer, and the next pass. 300 characters is calibrated against
that same file: well-formed entries ran 74–272, entries `reflect` had to trim ran 321–439, with an
empty gap between the two populations. Validated before shipping — it flags 2 of 96 entries, both
genuine offenders that had survived a `reflect` pass *and* a full `curate` pass, with zero false
positives on the other 94.

## Rejected

- **Restate the budget more forcefully / in one more file** — the intervention already falsified.
  It is stated in `KNOWLEDGE_ORG.md`, `AGENTS.md`, `reflect.md` and `curate.md` today, and the
  violation rate is 7/7.
- **A git pre-commit hook for the entry budget** — fires *later* than `reflect` does, so it does
  not close the distance that causes the failure; and a plugin cannot install one (the consumer
  must set `core.hooksPath` by hand). Right shape for `AGENTS.md`, wrong shape here.
- **A blocking hook** — rejected as disproportionate. The check is a heuristic over prose; a false
  positive that halts a real edit costs far more than one it merely mentions. Advisory only: it
  reports, never blocks and never edits.
- **Make `reflect` responsible for it, explicitly** — this is the status quo by accident, and it is
  what makes the rule unenforced whenever `reflect` is skipped. Codifying it would make the optional
  step load-bearing.
- **Mechanisms for every rule** — rejected. Most rules are consulted at the decision point they
  govern and prose works fine there. The bar for a mechanism is observed read-then-violated
  behaviour, which keeps the shipped machinery small.

## Consequences accepted

- The plugin now ships a `PostToolUse` hook, so it has a runtime footprint on ordinary file edits.
  Mitigated by the same opt-in gate as `SessionStart` (inert with no `knowledge/` tree), an early
  path check, and failing silent on every error path.
- Budgets stated in characters read as more arbitrary than "two lines". Accepted: a checkable
  arbitrary number beats an uncheckable intuitive one.
- Consumers who disagree with 300 can set `ARWYL_STATUS_ENTRY_BUDGET` rather than fork the rule.

## Deliberation

- `audit-2026-07-29-field-study-curate.md` — the field study: the 7/7 evidence, the transcript
  timing that rules out "the rule didn't reach the writer", and the character calibration.
- `audit-2026-08-29-field-study-thescriv.md` — field-confirmed in a second, unrelated consumer.
  The `PostToolUse` hook fired via the **plugin-delivered** path (not this repo's working-copy
  wiring), flagged two marginal overages (301, 302 chars) the agent then trimmed, and the sanctum
  7-of-7 pattern (a `reflect` pass trimming the preceding commit's over-budget entries) did **not**
  recur — 0 of 5, with 58 of 58 `status.md` entries under budget.
