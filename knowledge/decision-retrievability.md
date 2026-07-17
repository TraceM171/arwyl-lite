# Retrievability as a placement dimension

**Status:** ACTIVE since 2026-07-17
**Decision:** Placement in the knowledge tree is chosen on **two** axes, not one. The six kinds and
owner-vs-project answer *where a fact is stored*; **retrievability** answers *whether the reader
arrives there when it applies*. Encoded as `KNOWLEDGE_ORG.md`'s "Place for retrieval, not just for
kind" (write-side), plus targeted read-side pointer-following in `AGENTS.md` and reachability steps
in the `reflect` and `curate` skills. A cross-cutting constraint gets a pointer in a guaranteed-read
file and/or the task sites it governs; the mandatory files stay short — pointers, never bodies.

## Why (current reasoning)

- The taxonomy fixed file location by kind/owner and never asked "when is this needed?", so a
  correctly-filed cross-cutting constraint (a budget rule, a preference, a security limit) can be
  unreachable at the moment it applies. The link is the only bridge for a fact whose trigger lies
  outside its own domain.
- **Honesty note — this is preventive, not failure-driven.** A synthetic test
  (`audit-2026-07-retrievability-burial-test.md`, 2026-07-17) built to reproduce this burial did
  **not** reproduce it: capture caught the aside, retrieval fired 4/4. The change targets the
  scale/distance regime the test could not reach, and makes explicit an instinct `reflect` already
  showed (it filed a cross-cutting preference into a mandatory-read file unprompted). This is the
  **first rule added from a design-gap analysis rather than an observed consumer failure** — a
  deliberate, one-off departure from the project's evidence-first bar (`_basic.md`), justified only
  because the fix is cheap and low-risk: pointers and guidance, no new kind, no new mechanism.

## Rejected

- **Blanket "read more / over-read the tree"** — the owner's literal ask was "better to know too
  much than too little", but a blanket over-read spends the finite guaranteed-attention budget, and
  does so worst exactly at the scale where burial would bite. Replaced with **targeted**
  pointer-following: chase the specific cross-cutting pointer that could apply, not the whole tree.
- **A new retrieval-index mechanism, or a seventh "constraint" kind** — over-engineering for a
  problem that has not manifested; existing kinds + pointers suffice.
- **Wait for an observed failure (the usual bar)** — overridden here only because the fix is cheap
  and the gap is structural. Not a general license to add speculative rules; see the honesty note.

## Deliberation

- `audit-2026-07-retrievability-burial-test.md` — the test design, results, and why it did not
  reproduce the burial it targeted.
