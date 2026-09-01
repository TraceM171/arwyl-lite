# Arwyl Lite — Knowledge Base Index

Arwyl Lite is structured knowledge-tree conventions and Claude Code tooling for agent-assisted development: a six-kinds taxonomy (index / status / model / decision / audit / pattern) plus a per-X convention for organizing a project's `knowledge/` tree, packaged as a Claude Code plugin — skills `reflect`, `curate`, `knowledge-org`; a `SessionStart` hook; a status line script. A sibling plugin, `arwyl-extras` (`arwyl-extras/`), ships capabilities with no knowledge-tree dependency: `handoff` and `secret-capture` — see `decision-plugin-split.md`.

For current state, see `status.md`. For distribution and design mechanics, see `stack.md`; for a choice still in force and why, see the `decision-*.md` files. No domain subdirectories yet — flat structure, by design, until enough content accumulates to justify one (per `KNOWLEDGE_ORG.md`'s "choosing domains") — the first candidate is a `consumers/` per-X domain, once there's a second consumer or tool integration.

## Subdirectory map

| Path | Contents |
|------|----------|
| `_basic.md` | this file — project index |
| `stack.md` | distribution and design mechanics — what we use and how it works |
| `decision-taxonomy-kinds.md` | the six kinds — why, and the alternatives rejected |
| `decision-versioning.md` | explicit semver, bumped on every ship — why, and the SHA-versioning alternative rejected |
| `decision-retrievability.md` | retrievability as a second placement axis — why (preventive) |
| `decision-mechanism-over-prose.md` | when a rule gets a mechanism instead of more wording — why, and the bar |
| `decision-plugin-split.md` | why `handoff` and `secret-capture` live in `arwyl-extras`, not `arwyl-lite` |
| `decision-secret-capture-scope.md` | why `secret-capture` has no guard hook and no MCP-tool interface (yet) |
| `decision-thorough-skill.md` | leveled `thorough` skill in `arwyl-extras` (any domain, not investigation-only) — why leveled/opt-in, not a blanket mechanism |
| `audit-2026-07-17-retrievability-burial-test.md` | the burial test: design, results, why it didn't reproduce |
| `audit-2026-07-29-field-study-curate.md` | field study of a consumer's first curate pass: 6 findings, what worked |
| `audit-2026-08-29-field-study-thescriv.md` | field study of a second consumer (mobile app): 1 confirmed gap (plan-slot / plan-completion), rule fixes in `0.1.25`, and what's working confirmed at N=2 |
| `audit-2026-08-31-thorough-skill-evidence.md` | evidence review behind `decision-thorough-skill.md`: N=1 failure, a clean prose-fix retest, one counter-instance |
| `audit-2026-08-31-thorough-skill-external-techniques.md` | same-day external corroboration: Anthropic's multi-agent research system, sourcing/coverage fixes applied |
| `incident-2026-07-31-arwyl-extras-symlink.md` | `arwyl-extras` shipped an empty `handoff` skill — a `git mv`'d symlink, not content |
| `incident-2026-07-31-capture-secret-cleanup-bug.md` | `set -e` silently skipped `capture-secret.sh`'s cleanup on every non-happy-path exit |
| `incident-2026-07-31-secret-capture-auto-mode-block.md` | `secret-capture` categorically blocked under Claude Code auto mode; works under manual |
| `incident-2026-08-31-arwyl-extras-invalid-agents-key.md` | `0.3.0` failed to install: explicit `agents` manifest key rejected — no real plugin uses one |
| `incident-2026-09-01-thorough-deep-session-limit.md` | first real `deep` dispatch: cap/model/effort confirmed as designed, but burned a near-full 5-hour session window |
| `audit-2026-09-01-thorough-resume-design.md` | five live tests behind the `0.3.3` speed-lever/resume redesign: notification independence, subagent transcript paths, same- and cross-session resume-by-ID |
| `audit-2026-09-01-thorough-gym-live-run.md` | second real `deep` run: write-token duplication measured (triples), a real cross-account resume case that bypassed `SendMessage`-by-ID, `0.3.4` fixes |
| `status.md` | current version, recent changes, open items |
| `_curated.md` | reserved marker — UTC timestamp of the last `curate` pass, read by the status line |
| `.local/_basic.md` | owner-specific context |

## Read order

1. This file
2. `status.md` — current state
3. `stack.md` — when a task touches distribution, versioning, or how a mechanism works
4. `decision-*.md` — when a settled choice is being questioned or built on

## What this project is

The product is `claude_code/` (plugin `arwyl-lite`) and `arwyl-extras/` (plugin `arwyl-extras`) — two independently installable payloads other projects consume, both from the same `arwyl-lite-marketplace` (see root `README.md`; why two, `decision-plugin-split.md`). This `knowledge/` tree is Arwyl Lite dogfooding its own conventions on itself — it is not the product.

## Philosophy

Design-first, and rules are added from concrete failure modes observed in a real consumer, not from speculative design. Most are: see `decision-taxonomy-kinds.md`, `audit-2026-07-29-field-study-curate.md`, and `audit-2026-08-29-field-study-thescriv.md`.

Three deliberate departures, each recorded rather than blurred:

- **"Place for retrieval" (2026-07-17)** — added from design-gap analysis *after* a synthetic test failed to reproduce the burial it targeted. `decision-retrievability.md`.
- **The frozen-file exemption to the mega-file rule (2026-07-29)** — the consumer left its large closed dated records alone, which was correct, and the rules were simply silent on it. Documents existing correct practice rather than correcting an observed failure; the risk it addresses (the next pass re-litigating) is reasoned, not measured.
- **The top-level home for cross-cutting decisions (2026-07-29)** — likewise: the consumer filed its six project-wide decisions at top level correctly, and nothing in the rules said so. The risk addressed (a different consumer guessing wrong and burying the constraint) is reasoned, not measured.

Where the bar *was* met, it is now met harder: the 2026-07-29 contradiction prohibition was traced to an observed fabrication, then A/B-tested against controls before shipping — the first rule here validated by reproducing its failure first. See `audit-2026-07-29-field-study-curate.md`.

The 2026-08-29 plan-slot / plan-completion fix (`0.1.25`) sits between the two: it was traced to a real observed misfile — a completed cross-domain plan left squatting the `phases.md` name, two curate passes reaching opposite verdicts on it, the downstream misfile caught by the user — but the fix itself is prose, not A/B-tested. `audit-2026-08-29-field-study-thescriv.md`.

**And where prose is the wrong instrument, a rule is not the answer at all** — `decision-mechanism-over-prose.md`.
