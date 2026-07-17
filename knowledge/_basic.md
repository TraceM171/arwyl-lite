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
| `audit-2026-07-retrievability-burial-test.md` | the burial test: design, results, why it didn't reproduce |
| `status.md` | current version, known consumers, recent changes |
| `.local/_basic.md` | owner-specific context |

## Read order

1. This file
2. `status.md` — current state
3. `stack.md` — when a task touches distribution, versioning, or how a mechanism works
4. `decision-*.md` — when a settled choice is being questioned or built on

## What this project is

The product is `claude_code/` — the payload other projects install (as a Claude Code plugin, or via manual symlinks; see root `README.md`). This `knowledge/` tree is Arwyl Lite dogfooding its own conventions on itself — it is not the product.

## Philosophy

Design-first, and every rule added to `KNOWLEDGE_ORG.md` / `AGENTS.md` has come from a concrete failure mode observed in a real consumer (sanctum), not from speculative design — with one deliberate exception: the "Place for retrieval" rule (2026-07-17) was added from a design-gap analysis *after* a synthetic test failed to reproduce the burial it targeted. See `decision-retrievability.md` for why that exception was made, and `status.md`'s "Recent changes" for the latest examples.
