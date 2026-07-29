# Audit — field study of a real consumer's first curate pass (2026-07-29)

Frozen record of a read-only field study run against the field-test consumer on 2026-07-29, hours
after that consumer's **first-ever `curate` pass**. Living verdicts: `decision-mechanism-over-prose.md`
and `stack.md`. Method: the `field-study` skill.

File paths in backticks below are quoted **from the consumer's tree or the synthetic test tree**
unless they name a file in `claude_code/` or this `knowledge/` — they are not paths in this repo.

## Baseline

- **Consumer arwyl version: 0.1.15**, established behaviourally per `stack.md`'s rule against
  trusting `installed_plugins.json` — the curate transcript loads
  `plugins/cache/arwyl-lite-marketplace/arwyl-lite/0.1.15/skills/{curate,knowledge-org}` and
  contains the 0.1.15-only "Place for retrieval" text. All findings are against the current design.
- **Tree:** 151 files, 18.6k lines, five domains, all six kinds present, 25 `decision-*.md`.
- **Models:** `reflect` and `curate` both ran on **Sonnet 5**. Tree-wide authorship: Sonnet 5 ×94,
  Sonnet 4.6 ×62, Opus 4.8 ×15 — no curate or reflect commit is Opus-authored.
- Evidence base: git history, the curate session transcript (823 entries), its six subagent
  transcripts, and three work-session transcripts.

Incidental correction: this repo's `status.md` had claimed the machine's plugin cache was stuck at
0.1.13. It is on 0.1.15.

## Finding 1 — the status budget is violated at write time in every session

Seven `reflect` commits from 2026-07-10 to 2026-07-28 exist mainly to trim over-budget `status.md`
entries. In **7 of 7**, the removed lines were introduced by the *immediately preceding work commit* —
the same session's own live capture:

| reflect commit | trimmed lines written by |
|---|---|
| `3821359` | `66b5b7a` |
| `ea4acd4` | `c0b5263` |
| `3417def` | `3cbc923`, `c8d8023` |
| `cc47cdf` | `a314a08` |
| `96a4f26` | `41029c2` |
| `374a647` | `24e6a60` |
| `116b159` | `ff885a2` |

**The rule was not missing.** In all three work-session transcripts checked, the agent invoked
`knowledge-org` *before* its `status.md` writes (idx 106→278, 260→341, 374→450), and `AGENTS.md` —
inlined every session — already stated the budget. Read twice, violated anyway. Cause: distance
between the read and the write, not ignorance.

Disposition → `decision-mechanism-over-prose.md`; shipped as `hooks/status-budget.py` plus the
character-based budget.

## Finding 2 — curate committed two fabricated facts; the catch came from outside the plugin

The pass committed two invented facts, corrected in the consumer's follow-up commit `071a040`:

1. **`infrastructure/vps.md`** — a subagent correctly flagged a contradiction ("CX22 vs CX23 — one
   of these is wrong. **Fix:** verify … and correct"). The main agent read the file (transcript idx
   222) and then, at idx 231, **invented a bridging fact**: "later resized CX22→CX23, then upgraded
   CX23→CX33" — a resize step recorded in no file in the tree, asserted as fact in a living model,
   inside an edit whose stated purpose was fixing a factual error.
2. **`status.md`** — a parenthetical lifted from an unrelated sentence in
   `audit-2026-07-16-borgmatic-containerization.md:123`.

**The mechanism is not "wrote off a subagent summary".** The subagent's report was correct and said
to verify; the agent had the source file open. Re-reading the source does not prevent this.

**The self-catch was not the system working.** Transcript idx 766–770: the catch came from an
`advisor` server-tool call (Opus 5, xhigh) — a harness feature of that owner's setup, not anything in
`curate.md` — fired after the user typed "continue", and *after* both the audit commit and the
`_curated.md` marker had landed. Without it, both fabrications ship under a marker certifying the
tree freshly audited.

Root cause: `curate.md`'s contradiction bullet offers two exits (resolve from knowledge, or ask the
user) and never closes the third — synthesising a fact that makes both sides consistent. Step 5's
"do not fabricate content to fill gaps" reads as being about *empty* gaps and did not fire.

Secondary: the late fix forced a marker re-stamp, and `curate.md` step 7 had no provision for
knowledge edits landing after the marker — only for stamping too early.

## Finding 3 — "prefer a stronger model" instructs an actor that cannot act

`curate.md` told the running agent to select a stronger model. By the time skill text is in context
the model is fixed; this is defective on logic regardless of sample size. The field observation
(curate on Sonnet 5) is **N=1** — that consumer's first curate pass — so it contradicts, but does not
falsify, `stack.md`'s claim that curate runs on Opus. Corrected in `stack.md` to an explicit
assumption. No claim is made that the model caused Finding 2.

## Finding 4 — the mega-file heuristic doesn't exempt frozen records

The five largest files in the consumer's tree are almost all closed dated records (a 719-line
`deploy-`, a 489-line `deploy-`, a 444-line `audit-`). The failure the rule targets — the file that
*grows by appending* — cannot occur in an append-only file that is already closed, and splitting one
rewrites frozen history. The pass left them, which is correct, but recorded no reason, so the next
pass re-litigates.

## Finding 5 — the day-component check was applied by eye, not swept

`KNOWLEDGE_ORG.md` makes the day component **conditional** (>1 record of that prefix in that month).
Curate renamed 15 files across `infrastructure/` and `security/` and left two groups still meeting
the same condition: `operations/deploy-2026-06-` ×5 and `security/audit-2026-06` ×2. Its commit
describes the day as *"required"* — a conditional rule read as unconditional. Under "required" you
fix what you noticed; under the condition you enumerate. (The misreading is consistent with the
incomplete sweep; the agent's reasoning was not confirmed in the transcript.)

## Finding 6 — no documented home for a project-wide decision

The consumer has six top-level `decision-*.md` files, all genuinely cross-domain, and the placement
is correct — but nothing in `KNOWLEDGE_ORG.md` said so. The taxonomy diagram showed `decision-*.md`
only inside domains; the top-level section listed no decisions. Since 0.1.14 created the kind and
0.1.15 pushes cross-cutting constraints toward guaranteed-read placement, a consumer filing a
project-wide decision in "the closest domain" buries exactly what 0.1.15 exists to keep reachable.

## What was working

- **Fresh eyes was followed exactly** — fresh session, six cold per-domain subagents, and **all six
  invoked `Skill(knowledge-org)` as their first action**. Zero direct-read attempts for the rules,
  even though `curate.md`'s delegation step still carried the pre-0.1.14 "read `KNOWLEDGE_ORG.md`"
  phrasing. The 16 failed direct reads of the 2026-07-16 review did not recur.
- **The large-blast-radius pause fired** before a 15-file rename touching ~125 cross-references.
- **The Decision kind is doing its job** — six decisions extracted from dated audits, including two
  correction chains of exactly the shape `decision-taxonomy-kinds.md` was written to end.
- **The 0.1.13 marker ordering held**, and the agent improvised the correct repair when a late fix
  landed after the stamp.
- **Append-only held under pressure** — a dangling link inside a closed dated audit was left alone.

## Consumer-side observations (not arwyl's to fix)

- `operations/` holds 62 of 142 domain files (44%) and fails all three of `KNOWLEDGE_ORG.md`'s domain
  tests; its own `_basic.md` describes it with a five-clause list, which is the split list. The pass
  patched within domains rather than splitting, despite the user asking for a big restructure. Judged
  **one pass's judgment call, not a missing rule** — `curate.md` puts the patch-vs-restructure
  decision in curate's hands. Watch for it recurring in a second consumer.
- A "flagged for the owner" open question left sitting in a model file; `infrastructure/domain.md`
  collides with the taxonomy's own word for a subdirectory.

## A/B test of the Finding 2 fix (same day)

Unlike the 2026-07-17 burial test, the failure here was **observed first**, so the test could be
validated: reproduce it in a control arm before claiming a treatment arm fixed anything.

Synthetic 7-file tree, a planted contradiction of the same shape as the field one in a different
domain (`db.md`: provisioned as `db.t3.small`, and on `db.t3.xlarge` "since the `db.t3.large` →
`db.t3.xlarge` upgrade", with no file recording any `small` → `large` step). Six cold Sonnet
subagents, one tree each, no narrative about what was under test. Rubric pre-registered before the
run. Control got the 0.1.15 contradiction bullet; treatment got it plus the new prohibition and
citation test.

| Arm | Result |
|---|---|
| Control ×3 | 1 PASS, **2 wrote an unsourced factual assertion** (one reverted itself after an `advisor` call) |
| Treatment ×3 | 2 clean PASS, 1 ambiguous, **0 fabrications** |

**The control reproduced the failure, so the test is sensitive** and the treatment result carries
weight. Three caveats, all recorded rather than smoothed over:

- **The pre-registered failure mode was wrong in its specifics.** Both control failures *overwrote*
  the `small` claim with `large` — transplanting a value across a time boundary — rather than
  inventing the intermediate resize the rubric named. Same class of error, different route. Scored
  against the hypothesis, not the wording, and flagged as a rubric defect.
- **Controls had `advisor` access**, the same out-of-band reviewer that rescued the real pass, and it
  rescued one control. Controls were harder to fail than reality, so 2/3 is a floor.
- **N=3 per arm.** Supported, not proven.
- **The test validated the wording, not the delivery.** Both arms got the rule text inlined
  immediately next to the task. In real use `curate.md` is read at step 1 and the contradiction edit
  lands hundreds of turns later — the exact distance mechanism Finding 1 identifies as dominant. So
  this test is structurally optimistic in precisely the way this study documents elsewhere, and it
  cannot detect the failure mode that Finding 1 says matters most. It says the prohibition is the
  right *wording*; it says nothing about whether the wording survives the trip.

The ambiguous treatment trial was itself informative: it dismissed the planted contradiction as
"a gap, not a contradiction" and raised no question. `curate.md` was amended in response — an
undocumented discontinuity is in scope, and leaving one *without flagging it* is not one of the two
permitted exits. Deleting the inconvenient side was likewise added as an explicitly named instance of
the same error.

## Method notes

- Scope was deliberately narrow: curate had run hours earlier, so re-auditing the tree would have
  measured curate's output, not the system. The question asked was "what did curate miss, and which
  rule should have caught it" — which is what Findings 2, 4 and 5 answer.
- Structure (naming and placement) was assessed in a second pass, on request, after the first report.
