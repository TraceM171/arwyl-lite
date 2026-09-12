# `AGENTS.md` character budget: fixed at 9,000

**Status:** ACTIVE since 2026-09-08
**Decision:** `claude_code/AGENTS.md` stays under a fixed **9,000-character** budget — enforced at commit
time by `.githooks/pre-commit`, warned on in-session by `hooks/session-start.py`, the constant kept in sync
in both (`stack.md`). The budget does not move again: a new permanent rule gets its full text in
`KNOWLEDGE_ORG.md` (not inlined, so no size pressure there) with at most a short pointer in `AGENTS.md`, or
`AGENTS.md` gets trimmed to make room.

## Why (current reasoning)

- `AGENTS.md` is inlined verbatim into every session's `SessionStart` hook context, which Claude Code
  hard-caps at 10,000 characters with silent truncation past that (`stack.md`). With the ~150-character
  read-instruction line the hook appends, 9,000 leaves a worst case of ~9,150 — about 850 of margin.
- It is a cap meant to be stayed under, not adjusted whenever something doesn't fit. Each earlier raise was
  deliberate and individually justified (see Deliberation); the last attempted one was reverted on exactly
  this ground.

## Rejected

- **Raise the budget to fit the next rule** — done once more in `516c79a` (9,000 → 9,300, to fit a full
  paragraph added directly to `AGENTS.md`) and reverted in `8a17c62`: technically within precedent, but
  against the budget's actual purpose. The rule's full text moved to `KNOWLEDGE_ORG.md` instead, and
  `AGENTS.md` got a short pointer folded into an existing sentence — 8,988 characters, no other content
  trimmed.

## Deliberation

- `audit-2026-09-08-field-study-ai-setup-live-capture.md` — "A wrong instinct, caught before shipping": the
  9,300 raise and its reversal.
- Earlier raises, each recorded in `hooks/session-start.py`'s own comment: 8,000 → 8,500 in `0.1.14` (the
  Decision kind's reminder line), 8,500 → 8,800 in `0.1.15` (the "Place for retrieval" pointers,
  `decision-retrievability.md`), 8,800 → 9,000 in `0.1.22` (the file-tools rule, `33e6d46`).
