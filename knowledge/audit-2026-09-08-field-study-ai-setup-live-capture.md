# Audit — field study of AI-setup, live-capture fan-out on unconfirmed conclusions (2026-09-08)

Frozen record of a read-only transcript study of AI-setup's last session (`fbd5790b`, profile
`~/.claude-profiles/second`), prompted by the owner's hypothesis that `arwyl-lite` consumers
write to `knowledge/` too often, too early — before a fact is actually verified, confirmed, or
thought through. Not run via the `field-study` skill; done by direct parsing of the session
transcript's `tool_use` blocks (Python over the `.jsonl`), same evidentiary bar. AI-setup was
previously studied in `audit-2026-09-02-field-study-ai-setup.md` (a different topic, `thorough`
`deep`) — this is a second, unrelated study of the same consumer, hence the shared prefix with a
different date and descriptor.

Living verdict: confirmed, with a sharper mechanism than the hypothesis as stated. One fix
shipped to `AGENTS.md` / `KNOWLEDGE_ORG.md`, bundled with an already-authored, previously
uncommitted statusline fix into this release (`0.1.27`; the statusline fix alone is `0.1.26`,
see its own `incident-2026-09-02-statusline-unborn-branch-knowledge-repo.md`).

## Baseline

- **Session studied:** `fbd5790b-4f93-4e53-b2c6-53bc2317966a.jsonl`, 2026-09-08 16:39:40–17:29:04Z
  (~49 min), AI-setup project. Task: replace the OpenCode Go "vehicle" for a multi-agent harness
  after Go was ruled out in the prior session (`5451dee5`, ends 16:37:34Z — confirmed no gap).
- **n=1, and the worst available case**, not a representative average session: an open,
  multi-constraint vendor investigation with the owner actively supplying corrections live. Stated
  here rather than generalized past it.
- Evidence: every `Write`/`Edit`/`MultiEdit` tool call whose `file_path` contained `knowledge/`
  (43 of 50 `knowledge/`-touching calls; 7 were read-only `grep`), each timestamped and diffed
  (`old_string`/`new_string`), cross-referenced against the session's `user` messages for what
  triggered each reversal, and against token `usage` fields for cost.

## Finding (confirmed gap) — no carve-out between a confirmed fact and a live working hypothesis

43 writes touched `knowledge/`; 7 were to `decision-field-run-vehicle.md`, compliant by design
(decisions are living, edited in place). The other 36 cluster into 6 discrete "capture rounds,"
each persisting the *same not-yet-closed* vendor choice across most of: the audit file, the
decision file, `status.md`'s NEXT/Open line, `status.md`'s recent-changes, `phases.md`,
occasionally `provider/_basic.md`:

| Round | Time | Conclusion persisted | What killed it |
|---|---|---|---|
| 1 | 16:48 | Synthetic, pending A22 verification | superseded next round (self-driven) |
| 2 | 16:51 | Synthetic, pack count TBD | superseded round 3 |
| 3 | 17:02 | Synthetic, 1 pack ($30/mo) | user: concurrency dismissed too easily (17:06) |
| 4 | 17:09–10 | Synthetic, 2 packs ($60/mo), "Correction" | user: $60 exceeds the $40 budget target; pm/senior share a model for cache — no flat plan clears that (17:14) |
| 5 | 17:18–19 | Prepaid OpenRouter, "Second correction" | superseded round 6 |
| 6 | 17:24–28 | MiniMax Token Plan, "Superseded below" | **not killed — session ends here, A22 never run** |

Rounds 3–6 were each triggered by the user catching a problem the agent had already committed to
`knowledge/`, not by the agent's own verification step (round 1→2 is the one self-driven
revision — not every write was wrong, but every write after the user started supplying
constraints was walked back within the same sitting). Round 6 is the cleanest single exhibit:
MiniMax is written into 5 files with the live-verification protocol (A22) never run, and nothing
has caught it because the session simply ended there — an unverified conclusion sitting in
persistent knowledge, not because anyone confirmed it.

**Ruled out: retrieval failure.** Checked whether the constraint that broke the Synthetic branch
(pm and senior must share a model to use prompt caching) was already documented pre-session, which
would make this a retrieval bug rather than a write-cadence one. `requirements.md` (unmodified
since 2026-09-05, unaffected by this session) has zero mentions of caching or concurrency;
`decision-model-tiers.md` and `decision-tier-providers.md` (also unmodified since 2026-09-05)
mention caching only in an unrelated cost-discount context. The constraint was genuine new
reasoning surfaced this session, not something sitting in the tree and missed.

**Cost.** Knowledge-write turns were individually cheap (~1,575 output tokens/turn vs. ~1,892
session-wide average across 272 assistant turns, 514,654 output tokens total) — writes are not
where the token cost concentrates. The real cost is regeneration: edits in the audit file
explicitly labeled as corrections ("Correction (2026-09-08)...", "corrected... after an initial
pass got this wrong", "Superseded below by a later finding") total ~9,750 `new_string` characters
(~2,400 output tokens at a rough 4 chars/token) spent re-persisting content whose only job was
overwriting the previous wrong answer; the parallel correction-labeled `status.md` bullets add
~1,580 characters (~400 tokens). Not counted: the decision-file edits carrying the same reversals,
or round 1→2's non-labeled 3,426-character concurrency section, fully replaced by round 4's
3,134-character version.

**Dirtiness.** `status.md` NEXT-line bullets exceeded this project's own ≤300-character
`status.md`-entry convention in 5 of 6 versions written this session (323–413 characters, up to
38% over) — mechanism, not a standalone style gripe: each correction had to restate audit-level
reasoning into `status.md` instead of just repointing the link, because the audit's own conclusion
was still moving and a bare link wouldn't tell a reader mid-flip-flop why. (The audit file's own
`## Recommendation`/`## Concurrency` sections being rewritten in place 3× each is *not* a
violation — `KNOWLEDGE_ORG.md` line 46/339 makes audits append-only **after closure**, and this
one was still open.)

## Fix (`0.1.27`)

`KNOWLEDGE_ORG.md` gained a new subsection, "A moving conclusion is not yet a status fact":
before writing a candidate into `status.md`, `phases.md`, or a domain `_basic.md`, check whether a
different answer was already written there this session — if so, the candidate stays inside the
audit file (and an existing decision file's `Status: OPEN` line) until checked against what's
already on record and isn't waiting on a pending verification step. `status.md`'s Open line keeps
naming the open question and linking to it; it stops carrying the candidate's name, since that was
the part actually churning. `AGENTS.md`'s "Capture as you go" got a short in-sentence pointer to
the full rule rather than its own paragraph — see the mistake below for why.

**A wrong instinct, caught before shipping.** The first version of this fix (`516c79a`) added a
full paragraph directly to `AGENTS.md`, pushing it to 10,358 characters against the pre-commit
hook's 9,000-character budget (`AGENTS.md` is inlined verbatim into every session's `SessionStart`
hook context, hard-capped at 10,000 by Claude Code). Rather than trim, that commit raised
`AGENTS_MD_BUDGET` 9000 → 9300 in both `.githooks/pre-commit` and `hooks/session-start.py` —
technically within precedent (the budget had been raised twice before, `0.1.15`, `0.1.22`), but
against the budget's actual purpose: a cap meant to be stayed under, not adjusted whenever
something doesn't fit. Corrected in `8a17c62`: budget reverted to 9000, full rule relocated to
`KNOWLEDGE_ORG.md` (not inlined, no size pressure there), and `AGENTS.md` carries only a short
pointer folded into the existing "Capture as you go" opening sentence — 8,988 characters, no other
content trimmed. `hooks/session-start.py`'s budget comment now states directly that the constant
does not move again; new permanent rules get their full text elsewhere or `AGENTS.md` gets trimmed
to fit.

## Method notes

- Not run via the `field-study` skill — a direct transcript parse instead, prompted by a specific
  owner hypothesis rather than an open-ended consumer health check. Same evidentiary bar: every
  claim above traces to a specific tool call, timestamp, or `usage` field in the session
  transcript, not to inference.
- Several advisor consultations shaped both this audit and the fix under review, each catching a
  specific error rather than rubber-stamping the prior draft: reframed "wrote before verifying"
  into the sharper "fan-out per capture round" mechanism; caught an arithmetic error in the
  write-count breakdown and a mis-scoped cost claim (write-turns are cheap, regeneration is the
  real cost); caught that the fix as first drafted blocked `status.md`'s Open line entirely rather
  than letting it keep the (stable) question while dropping the (churning) candidate name; and,
  after publishing, caught that the version bump left `status.md`'s cache-verification paragraph
  stale — the same class of error this audit is about, applied to itself.
- n=1. This session was the worst case available (an open, contested, multi-round investigation),
  not a representative sample — the finding does not claim every `arwyl-lite` session fans out
  writes this way, only that the rule had no mechanism to stop one that does.

## Deliberation

- `claude_code/AGENTS.md`, `claude_code/KNOWLEDGE_ORG.md` — the fixed files.
- `516c79a` — initial fix (paragraph in `AGENTS.md`, budget raised 9000→9300).
- `8a17c62` — correction (budget reverted to 9000, full rule moved to `KNOWLEDGE_ORG.md`, short
  pointer folded into `AGENTS.md`'s existing sentence).
- Bumped `arwyl-lite` `0.1.26` → `0.1.27` (`decision-versioning.md`), bundled with the
  already-authored `0.1.26` statusline fix into one release —
  `incident-2026-09-02-statusline-unborn-branch-knowledge-repo.md`.
