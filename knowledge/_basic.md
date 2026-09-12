# Arwyl Lite — Knowledge Base Index

Arwyl Lite is structured knowledge-tree conventions and agent tooling for agent-assisted development: a six-kinds taxonomy (index / status / model / decision / audit / pattern) plus a per-X convention for organizing a project's `knowledge/` tree, packaged as a Claude Code plugin — skills `reflect`, `curate`, `knowledge-org`; a `SessionStart` hook; a status line script — and, for OpenCode, real adapted copies of the same `reflect`/`curate`/`knowledge-org` skills plus a `sidebar_footer` TUI status plugin and a character-budget server hook, shipped as a real installable package (`decision-multi-tool-integration.md`, `decision-package-install.md`). A sibling plugin, `arwyl-extras` (`arwyl-extras/`), ships capabilities with no knowledge-tree dependency: `handoff` and `secret-capture` — see `decision-plugin-split.md`.

For current state, see `status.md`. For distribution and design mechanics, see `stack.md`; for a choice still in force and why, see the `decision-*.md` files. No domain subdirectories yet — flat structure, by design, until enough content accumulates to justify one (per `KNOWLEDGE_ORG.md`'s "choosing domains") — the first candidate is a `consumers/` per-X domain, once there's a second consumer (a project consuming arwyl-lite). A second *tool* integration (e.g. `opencode/`, see `decision-multi-tool-integration.md`) does not trigger this — it is a product payload, not a knowledge domain.

## Subdirectory map

| Path | Contents |
|------|----------|
| `_basic.md` | this file — project index |
| `stack.md` | distribution and design mechanics — what we use and how it works |
| `decision-taxonomy-kinds.md` | the six kinds — why, and the alternatives rejected |
| `decision-versioning.md` | explicit semver, bumped on every ship (both `plugin.json`s and `opencode/package.json`) — why, and the SHA-versioning alternative rejected |
| `decision-agents-md-budget.md` | `AGENTS.md`'s 9,000-character budget is fixed — why it no longer gets raised |
| `decision-retrievability.md` | retrievability as a second placement axis — why (preventive) |
| `decision-mechanism-over-prose.md` | when a rule gets a mechanism instead of more wording — why, and the bar |
| `decision-plugin-split.md` | why `handoff` and `secret-capture` live in `arwyl-extras`, not `arwyl-lite` |
| `decision-secret-capture-scope.md` | why `secret-capture` has no guard hook, no MCP-tool interface, and (on OpenCode) no sweep backstop — yet |
| `decision-thorough-skill.md` | leveled `thorough` skill in `arwyl-extras` (any domain, not investigation-only) — why leveled/opt-in, not a blanket mechanism |
| `decision-multi-tool-integration.md` | why each tool gets real adapted copies, not a shared abstraction — and what stays out of the OpenCode port |
| `decision-package-install.md` | `opencode/` as a real installable package (bootstrap-on-load), alongside manual symlink install |
| `decision-opencode-statusline-design.md` | why `sidebar_footer` over `app_bottom`/`session_prompt_right`, git+knowledge+nudges-only scope, dialogs not OSC8 |
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
| `audit-2026-09-02-field-study-ai-setup.md` | first full `deep` completion (a fourth consumer): a non-collapsing checklist status line and an over-length `investigator` report, both fixed in `0.3.5` |
| `incident-2026-09-02-statusline-unborn-branch-knowledge-repo.md` | `knowledge:` git segment silently dropped for a freshly `git init`'d, zero-commit `knowledge/` repo; fixed in `0.1.26` |
| `audit-2026-09-08-field-study-ai-setup-live-capture.md` | second field study of AI-setup: live-capture fan-out on unconfirmed conclusions, 6 capture rounds for one open question in one session; fixed in `0.1.27` |
| `audit-2026-09-11-opencode-hook-injection-test.md` | live test: OpenCode's `tool.execute.after` can inject model context via `output.output` — unblocked OpenCode Phase 2 |
| `audit-2026-09-11-opencode-bash-async-and-atref-test.md` | live tests: bash-tool detachment mechanics, a 90s+ synchronous call survives with no cap, `@file` pointers don't auto-expand in skill content — shaped OpenCode Phase 3 |
| `audit-2026-09-12-opencode-statusline-feasibility.md` | feature-by-feature statusline port study — narrowed the OpenCode plan's blanket "Not planned" |
| `audit-2026-09-12-opencode-package-install-verification.md` | live verification of the OpenCode package, both halves, and the two loader bugs it caught (`main` field, missing `knowledge/` gate) |
| `deploy-2026-09-12-opencode-support.md` | closed build record of OpenCode support Phases 1–4 — formerly `phases.md`; frozen files citing `phases.md` mean this file |
| `status.md` | current version, recent changes, open items |
| `_curated.md` | reserved marker — UTC timestamp of the last `curate` pass, read by the status line |
| `.local/_basic.md` | owner-specific context |

## Read order

1. This file
2. `status.md` — current state
3. `stack.md` — when a task touches distribution, versioning, or how a mechanism works
4. `decision-*.md` — when a settled choice is being questioned or built on

## What this project is

The product is `claude_code/` (plugin `arwyl-lite`) and `arwyl-extras/` (plugin `arwyl-extras`) — two independently installable Claude Code payloads, both from the same `arwyl-lite-marketplace` (see root `README.md`; why two, `decision-plugin-split.md`) — plus `opencode/`, a real installable OpenCode package (server + TUI plugin exports) with real adapted copies rather than a shared abstraction (`decision-multi-tool-integration.md`, `decision-package-install.md`, `deploy-2026-09-12-opencode-support.md`). This `knowledge/` tree is Arwyl Lite dogfooding its own conventions on itself — it is not the product.

## Philosophy

Design-first, and rules are added from concrete failure modes observed in a real consumer, not from speculative design — see `decision-taxonomy-kinds.md`, `audit-2026-07-29-field-study-curate.md`, `audit-2026-08-29-field-study-thescriv.md`. Departures from that bar are recorded where they were made, not blurred:

- **Preventive, reasoned not measured** — "Place for retrieval" (`decision-retrievability.md`); the frozen-file exemption to the mega-file rule and the top-level home for cross-cutting decisions (`audit-2026-07-29-field-study-curate.md`, Findings 4 and 6).
- **Traced to an observed misfile, shipped as untested prose** — the plan-slot / plan-completion fix (`audit-2026-08-29-field-study-thescriv.md`, Finding 1).
- **Met harder** — the contradiction prohibition, reproduced in a control arm before shipping (`audit-2026-07-29-field-study-curate.md`, A/B test).

Where prose is the wrong instrument, a rule is not the answer at all — `decision-mechanism-over-prose.md`.
