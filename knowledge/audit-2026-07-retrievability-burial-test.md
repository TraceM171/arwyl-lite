# Audit — retrievability / information-burial test (2026-07-17)

Frozen record of a synthetic test run to probe whether the knowledge system buries facts a user
drops mid-session. The living verdict is in `decision-retrievability.md`.

## Question

Does a fact the user drops mid-session — a preference, a cross-cutting constraint — get (a)
**captured** by `reflect` and (b) **retrieved** by a later session at the moment it applies?
Motivated by three example asides: a language-switch preference, a cost-sensitivity constraint,
and ephemeral praise. The cost constraint was the one carried through the test.

## Method

A synthetic consumer tree ("homelab": Immich + Postgres + Traefik, a `services/` domain, a
`status.md` with an unstarted "offsite backups" open item). Constraint under test: a
cost-sensitivity aside, with a **shibboleth** planted in the policy file — €5/mo cap + explicit
sign-off before proposing any paid service + self-host-first — specific enough that generic
cost-awareness could not fake a pass. Cold subagents stood in for fresh sessions (the test runner
knew the aside and so could not self-judge).

- **Capture (Test A):** one agent ran `reflect` on a long buried-aside debug transcript, not told
  the aside was in it.
- **Retrieval (Test B):** agents got a reconstructed `SessionStart` hook + an innocuous rundown
  task, then — a turn later, for distance — a backup-provider question with **no cost mention**.
  - **B1 (×3):** cost policy filed in a top-level decision + a `_basic.md` pointer only.
  - **B2 (×1):** additionally linked at the task site (the `status.md` backup item).

Pre-registered rubric: **FIRED** = opens the policy file or echoes the shibboleth; generic "it's
cheap" does **not** count. Asymmetry: a fail is decisive, a pass is soft (the conditions favour
success).

## Findings

| Trial | Condition | Verdict |
|-------|-----------|---------|
| A | `reflect` on buried-aside transcript | **Caught** → `.local/_basic.md` |
| B1 ×3 | index pointer only | **Fired 3/3** |
| B2 | + task-site link | **Fired** (one turn earlier) |

- **Capture caught it.** `reflect` persisted the aside as an owner cost-consciousness preference in
  `.local/_basic.md` — a mandatory-read file — plus a full incident + decision write-up of the
  actual bug, and correctly skipped the assistant's unconfirmed speculation.
- **Retrieval fired 4/4.** All three B1 agents opened the policy on the backup turn from the
  `_basic.md` pointer alone; B2 fired a turn earlier via the task-site link. The shibboleth was
  applied every time.

## Interpretation — the burial hypothesis did NOT reproduce

Both predicted failures (capture miss, retrieval miss) failed to occur. The test is the **easy
case** and cannot disconfirm the scale hypothesis:

- **Tiny tree (7 files).** A file named `decision-cost-policy.md`, listed twice in the one index
  every agent reads, is trivially findable for a "which service to buy" task. At 100+ files with a
  long key-decisions list, that salience collapses.
- **~1 turn of distance.** Real burial is dozens of turns; the pointer scrolls out of attention.
- **Agents primed to consult** ("don't answer from assumptions") — more diligent than a heads-down
  mid-task session.
- **Topic proximity.** backups → buying storage → cost is an obvious associative pull; a
  semantically-distant trigger would not get it.

Both successes are upper bounds (priming inflates retrieval; extraction-mode inflates capture), so
real rates are ≤ observed. By the rubric, passes are weak evidence: burial was neither confirmed
nor refuted — only shown absent in the easy regime.

## The design gap the test did surface

Placement here is chosen by asking "what kind is this / whose is it?" — never "when will it be
needed?". Retrievability falls out as an unconsidered side effect: the same fact filed as an owner
preference lands in a mandatory-read file (always retrieved); filed as a project decision it lands
in a pointer-only top-level file (navigation-dependent). `reflect` happened to pick the
more-retrievable home unprompted. The root tension is a **finite guaranteed-attention budget vs. a
growing set of cross-cutting facts**.

## Limits / not closed

- End-to-end never closed on one artifact: A saved to `.local/`, B retrieved from a hand-placed
  top-level decision file — different artifacts.
- Capture is N=1.
- One of four retrieval trials had advisor input (3/4 fired advisor-free).
- Not run at scale/distance — the conditions that would actually stress it.

## What would stress it (not run)

Grow the tree to ~50–100 files, burying the pointer among 30+ key-decisions entries; insert real
turn-distance; use a semantically-distant trigger; and ultimately a real fresh Claude Code session
by hand. When re-run, seed the synthetic tree with a cheaper model (it is throwaway scaffolding) and
simulate the user sessions with a Sonnet-class model — the common day-to-day model, so retrieval
behaviour matches real use. Deferred — the owner judged the problem non-critical (the system is
reported working well in real use).
