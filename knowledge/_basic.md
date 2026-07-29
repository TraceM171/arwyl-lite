# Arwyl Lite — Knowledge Base Index

Arwyl Lite is structured knowledge-tree conventions and Claude Code tooling for agent-assisted development: a six-kinds taxonomy (index / status / model / decision / audit / pattern) plus a per-X convention for organizing a project's `knowledge/` tree, packaged as a Claude Code plugin — skills `reflect`, `curate`, `handoff`, `knowledge-org`; a `SessionStart` hook; a status line script.

For current state, see `status.md`. For distribution and design mechanics, see `stack.md`; for a choice still in force and why, see the `decision-*.md` files. No domain subdirectories yet — flat structure, by design, until enough content accumulates to justify one (per `KNOWLEDGE_ORG.md`'s "choosing domains") — the first candidate is a `consumers/` per-X domain, once there's a second consumer or tool integration.

## Subdirectory map

| Path | Contents |
|------|----------|
| `_basic.md` | this file — project index |
| `stack.md` | distribution and design mechanics — what we use and how it works |
| `decision-taxonomy-kinds.md` | the six kinds — why, and the alternatives rejected |
| `decision-retrievability.md` | retrievability as a second placement axis — why (preventive) |
| `decision-mechanism-over-prose.md` | when a rule gets a mechanism instead of more wording — why, and the bar |
| `audit-2026-07-17-retrievability-burial-test.md` | the burial test: design, results, why it didn't reproduce |
| `audit-2026-07-29-field-study-curate.md` | field study of a consumer's first curate pass: 6 findings, what worked |
| `status.md` | current version, recent changes, open items |
| `.local/_basic.md` | owner-specific context |

## Read order

1. This file
2. `status.md` — current state
3. `stack.md` — when a task touches distribution, versioning, or how a mechanism works
4. `decision-*.md` — when a settled choice is being questioned or built on

## What this project is

The product is `claude_code/` — the payload other projects install (as a Claude Code plugin, or via manual symlinks; see root `README.md`). This `knowledge/` tree is Arwyl Lite dogfooding its own conventions on itself — it is not the product.

## Philosophy

Design-first, and rules are added from concrete failure modes observed in a real consumer, not from speculative design. Most are: see `decision-taxonomy-kinds.md` and `audit-2026-07-29-field-study-curate.md`.

Three deliberate departures, each recorded rather than blurred:

- **"Place for retrieval" (2026-07-17)** — added from design-gap analysis *after* a synthetic test failed to reproduce the burial it targeted. `decision-retrievability.md`.
- **The frozen-file exemption to the mega-file rule, and the top-level home for cross-cutting decisions (2026-07-29)** — the consumer did the right thing in both cases and the rules were simply silent on it. These document existing correct practice rather than correct an observed failure; the risk they address (the next pass re-litigating, or a different consumer guessing wrong) is reasoned, not measured.

Where the bar *was* met, it is now met harder: the 2026-07-29 contradiction prohibition was traced to an observed fabrication, then A/B-tested against controls before shipping — the first rule here validated by reproducing its failure first. See `audit-2026-07-29-field-study-curate.md`.

**And where prose is the wrong instrument, a rule is not the answer at all** — `decision-mechanism-over-prose.md`.
