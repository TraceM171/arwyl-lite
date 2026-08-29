# Audit — field study of a second consumer, TheScriv (2026-08-29)

Frozen record of a read-only field study run against a second real consumer on 2026-08-29, via the
`field-study` skill. The first field study (`audit-2026-07-29-field-study-curate.md`) was of the
field-test consumer (infra); this one is of an unrelated **Kotlin Multiplatform mobile app**, chosen
precisely because "would a different consumer hit this?" needs a consumer that is *different*.

Living verdicts from this study: the plan-slot / plan-completion rule in `claude_code/KNOWLEDGE_ORG.md`
("Open entries are pointers, not plans"), the re-file checks in `claude_code/curate.md` step 3, the
scope check in `claude_code/reflect.md` step 1, and the curate-runtime note in `stack.md`. Shipped in
`0.1.25`.

File paths in backticks below are quoted **from the consumer's tree or its session transcripts**
unless they name a file in `claude_code/` or this `knowledge/`.

## Baseline

- **Consumer arwyl version: `0.1.17`**, established by cache path (only `0.1.17/` present under
  `~/.claude/plugins/cache/arwyl-lite-marketplace/arwyl-lite/`) plus a user-scope install. Current
  was `0.1.24`.
- **No version discount.** `reflect.md`, `curate.md`, and `KNOWLEDGE_ORG.md` had **zero commits**
  between `0.1.17` and `0.1.24` — the only rule-doc change in that span is the `0.1.22` `AGENTS.md`
  file-tools rule. Every rule finding is against current design.
- **Split-repo layout:** `knowledge/` is its own git repo (49 commits since 2026-05-28); code lives
  in a sibling `repo/`. First studied consumer with this shape.
- **Models:** both curate passes (2026-08-21, 2026-08-29) and the Books Center design/reflect session
  (2026-08-28) ran on **Opus 5**, all in fresh sessions. Day-to-day work and `reflect` run on
  Sonnet 5. Per-phase model assignment is written into the consumer's `phases.md`.
- **Tree:** 58 `.md`, ~5,700 lines, 8 domains + `.local/`, all six kinds. 1 top-level
  `decision-*.md` + 14 domain decisions.
- **Capture cadence:** 5 `reflect` commits against 42 inline `doc:` capture commits — live-capture is
  the steady state, `reflect` is the safety net.
- Evidence base: both knowledge-repo git histories, `grep` over 88 MB / 41 Claude Code session
  transcripts (not full reads), and tool-call-timeline reconstructions of the two curate sessions
  (`77d1beb9`, `75ab6252`) and the design session (`ef246055`).

## Finding 1 (confirmed gap) — a cross-domain plan filed as a single-domain `<domain>/plan.md`, missed by a full curate pass

The Books Center plan touches five domains (its phases land in `services/`, `architecture/`,
`platform/`, `ui/`, `testing/`; it is driven by three `decision-*.md` in three domains). It was
created as `features/plan.md` and stayed there through a whole Opus curate pass. Three rule gaps
combined:

**(a) Plan placement is a scope judgment the tooling never forced.** `KNOWLEDGE_ORG.md` and
`reflect.md` both said "cross-domain → `phases.md`; single-domain → `<domain>/plan.md`" with **no
test**. The design session (`ef246055`, Opus 5, `knowledge-org` skill in context, `phases.md`
referenced 16 times, plan file written via `cat >` heredoc) filed a five-domain plan as
`features/plan.md` and wired `_basic.md` + four decision files to it — subject ("Books" →
`features/`) beat scope, with no visible reasoning about the choice. The decision-placement rule two
sections up in the same file *does* give a test ("constrains work in more than one domain?").

**(b) A completed `phases.md` plan had no exit when frozen audits link to it.** The bot-check plan
shipped v1.3.4 on 2026-08-21. That day's curate pass recorded a forced deviation from the
"delete the plan file" rule: *"A completed plan was kept, not deleted. The rules say drain and
delete. Six frozen dated audits cite `../phases.md`, and I can't edit those to repoint — delete and
rename both dangle them."* So a **reserved name held a closed build record for 8 days** — friction
toward misfiling the next plan.

**(c) `curate.md` step 3 had no re-file check.** Two fresh Opus passes reached **opposite verdicts**
on the squatting file: 2026-08-21 kept it in place; 2026-08-29 renamed it to
`architecture/audit-2026-08-14-bot-check-generalization.md` (13 files repointed), reasoning
*"a reserved name occupied by the wrong kind, which also blocked the plan slot."* The 2026-08-29
pass fixed **that** and still left `features/plan.md` misfiled — the **user** caught it
(*"aand shouldnt features/plan move to phases.md?"* → *"you were right, and I'd freed the slot
without asking who should occupy it."*).

**Disposition (`0.1.25`):**
- `KNOWLEDGE_ORG.md` "Open entries are pointers, not plans" — plan placement is now stated as a
  scope test (with the "check the plan's own outbound links" heuristic); the completion rule now
  leads with the invariant *"the reserved name must come free"* and gives an explicit
  convert-to-dated-record exit for a plan that accreted a real build log or is cited by frozen files.
- `curate.md` step 3 "Open/backlog scope" — two new checks: a `<domain>/plan.md` whose link
  topology is cross-domain belongs at `phases.md`; a reserved plan name holding a non-plan gets
  converted so the name frees.
- `reflect.md` step 1 — the session-scoped audit now asks, if a plan file was created this session,
  whether it is at the right scope.

**Not a mechanism, deliberately.** By `decision-mechanism-over-prose.md`'s test a rule read-then-
violated wants a mechanism — but this is N=1 on the placement miss, and a "is this plan
cross-domain?" mechanism is not cheap to build. Prose ships now; **a second consumer misfiling a
cross-domain plan despite the scope test is the mechanism trigger.**

## Finding 2 (confirmed, minor) — the per-X shadow-file rule misapplied to wave off a mega-file

`integrations/annas-archive.md` (353 lines) is described by its domain `_basic.md` with a
seven-clause list — `curate.md`'s own "the index entry is the split list" heuristic. The 2026-08-29
pass declined to split it, reasoning *"splitting either produces the `<x>-setup.md` shadow-file
shape the per-X rule forbids."* That is a **misapplication**: the shadow-file rule forbids splitting
one instance *by kind* (facts vs steps), not splitting a per-X *model* along its own topic seams. An
Opus pass reached for a real rule and used it to override the heuristic that actually applied.

**Disposition (`0.1.25`):** one clause added to `curate.md`'s per-X bullet — the shadow-file
prohibition does not exempt an oversized per-X model from the mega-file check; only a closed dated
record is exempt.

## Finding 3 (suspected, not shipped as a rule) — mandatory-read closure vs finite guaranteed-read space

`AGENTS.md`'s transitive rule grows the mandatory set without bound; `KNOWLEDGE_ORG.md`'s "Place for
retrieval" says keep the mandatory files short. Nothing reconciled them. TheScriv's per-session
mandatory set ≈ 664 lines (`_basic.md` 99 → `.local/_basic.md` 31 → `.local/collab.md` 207 →
`workflow.md` 137 → `status.md` 190). sanctum's `.local/collab.md` is 245 lines and likewise
transitively mandatory and likewise accreted portable / audit-kind content — **N=2 on the shape**.

**No observed failure** — no transcript showed an agent skipping a mandatory file or acting on a
stale assumption a mandatory read would have caught. So per the project's evidence-first bar this
stays **reasoned, not measured**.

**Disposition (`0.1.25`):**
- `KNOWLEDGE_ORG.md` "Place for retrieval" now states the reconciliation: the mandatory set is
  itself a budget, and the bar for adding a file to it is "bears on essentially every session
  regardless of task" — a code-only or running-system-only file is a proactive-consultation target.
- `curate.md`'s `.local/` scoping check gained a kind-purity pass: a `.local/` preferences file
  whose entries have grown dated `file:line`-cited "why we decided this" narratives is mixing
  owner-preference with audit-kind deliberation; when it is also mandatory-read, the narrative
  bloats a guaranteed-read file.
- **Not shipped:** a numeric closure-size budget or a "flag if it crowds the opening context"
  curate check — no calibration data, and an uncheckable threshold re-litigates every pass. If a
  real skip-failure shows up, that is when the check earns a threshold.

## Finding 4 (suspected, N=1) — no taxonomy home for "always-active project conventions"

`workflow.md` is a top-level file not on `KNOWLEDGE_ORG.md`'s allowed list, holding a mix no single
kind hosts (debug-marker convention, comment policy, pre-commit gate, mandatory feature/bug workflow
ordering, mail-safety, plus shared decisions-with-rejected-alternatives). It is *not* duplication
with `.local/collab.md` — the split (project conventions vs owner interaction prefs) is clean.

**sanctum resolves the same need via a domain file** (`operations/verification-discipline.md`, marked
always-read) and has no top-level conventions file — so this is **N=1**, and sanctum's answer
(domain-hosted) is plausibly the general one; TheScriv differs because a code project has no
operations-shaped domain.

**Disposition (`0.1.25`):** a bullet added to `KNOWLEDGE_ORG.md`'s "Cross-cutting knowledge that has
no domain" — standing work rules may live at the top level *as a fallback when no domain fits*, with
the guard that entries carrying real rejected alternatives are decisions and numbered procedures are
patterns. No new reserved name. **Open question, recorded not answered:** is domain-hosted the
general rule, or does a code project genuinely need a top-level slot? Wants a third data point.

## What's working — confirmed at N=2

- **The status-budget mechanism (`decision-mechanism-over-prose.md`) holds in a second consumer, via
  the plugin path.** The `PostToolUse` hook fired in exactly two TheScriv sessions (2026-08-25,
  2026-08-28), each flagging one entry marginally over (302, 301 chars); the agent trimmed both
  same-session. The 2026-07-29 Finding-1 pattern — a `reflect` pass trimming over-budget entries
  written by the immediately preceding commit — **did not recur**: 0 of 5 (vs 7 of 7). Current
  `status.md`: 58 of 58 entries ≤ 300. First confirmation outside the field-test consumer *and*
  outside this repo's working-copy hook wiring.
- **curate on an Opus-class model, N = 2, both fresh, both restructured.** Both passes did the
  step-0 model self-check, stated fresh-eyes, and restructured (2026-08-29 split a 577-line
  `patterns.md` three ways with 23 references repointed per section; relocated a mis-kinded
  reserved-name file; promoted two `.local/` sections). This answers `stack.md`'s N=1 caveat (now
  "varies by consumer choice — Sonnet ×1, Opus ×2") and closes the `status.md` Open watch item.
- **The 2026-07-29 fixes propagated.** Finding 4 (frozen-record mega-file exemption): the 2026-08-29
  pass left two closed dated files (574, 343 lines) alone **and recorded the reason** almost verbatim.
  Finding 5 (day-component naming): swept mechanically ("4 audits share that month, so the day is
  required"), zero violations tree-wide.
- **Decision kind + Finding 6 (top-level-decision home).** 1 top-level cross-cutting `decision-*.md`
  + 14 domain decisions — matches "more than two or three and they probably aren't cross-cutting"
  (contrast the field-test consumer's 6 top-level). No correction-chains.
- **Fresh-eyes + marker discipline.** Both curate passes genuinely fresh; the 2026-08-29 `/curate`
  session found the prior session's uncommitted work in the tree and committed it *separately first*
  ("so the curate diff is clean") before auditing — the shared `Claude-Session` git trailer on that
  snapshot commit and the audit commit is that artifact, not self-review. Marker re-stamped
  strictly-increasing after the user-prompted late fix.

## Consumer-side observations (not arwyl's to fix)

- On `0.1.17` + split-repo the statusline `curate?` nudge miscounts (the 2026-08-29 `_curated.md`
  value equals the last knowledge-edit commit instant to the second — exactly what `1805468` /
  `0.1.24` fixes) and bash-written knowledge files are invisible to the read/edit tracker (the
  `0.1.22` file-tools rule). The design session wrote every knowledge file via `cat >` / `cat >>`
  heredocs — not a violation on `0.1.17`, but a second consumer independently doing what the
  `0.1.22` rule was written to stop. The consumer updated after the study.
- 3 test-source comments cite `knowledge/` paths, breaking the consumer's own `workflow.md` rule
  (the 2026-08-29 curate flagged them; curate cannot edit code).
- `.opencode/skills/{reflect,curate}/SKILL.md` exist but are fossils (~arwyl `0.1.0`, unused since
  2026-05). Not a real multi-tool consumer — vestigial. No arwyl action.

## Method notes

- The `field-study` skill calls for a cold subagent to do the tree-health read. That subagent hit a
  session rate limit and terminated before reporting; the tree audit was done by the study runner,
  who had read 6 files closely first (primed on those) and the other ~50 + the mechanical sweeps
  cold. Finding 4 most wanted the independent read and did not get it — it is the softest of the
  four.
- Transcript evidence is `grep`, not full reads. The two curate sessions and the design session were
  reconstructed from tool-call timelines and their step-8 reports.
- Findings 3 and 4 ship as prose reconciliations / fallback allowances, not new constraints or
  mechanisms — the evidence supports naming the tension, not enforcing a number.
