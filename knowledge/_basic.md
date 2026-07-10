# Arwyl Lite — Knowledge Base Index

Arwyl Lite is structured knowledge-tree conventions and Claude Code tooling for agent-assisted development: a five-kinds taxonomy (index / status / model / audit / pattern) plus a per-X convention for organizing a project's `knowledge/` tree, packaged as a Claude Code plugin — skills `reflect`, `curate`, `handoff`, `knowledge-org`; a `SessionStart` hook; a status line script.

For current state, see `status.md`. No domain subdirectories yet — flat structure, by design, until enough content accumulates to justify one (per `KNOWLEDGE_ORG.md`'s "choosing domains").

## Subdirectory map

| Path | Contents |
|------|----------|
| `_basic.md` | this file — project index |
| `status.md` | current version, known consumers, recent changes |
| `.local/_basic.md` | owner-specific context |

## What this project is

The product is `claude_code/` — the payload other projects install (as a Claude Code plugin, or via manual symlinks; see root `README.md`). This `knowledge/` tree is Arwyl Lite dogfooding its own conventions on itself — it is not the product.

## Key decisions

- **Five kinds of knowledge**: index / status / model / audit / pattern (`claude_code/KNOWLEDGE_ORG.md`) — the core taxonomy the whole system is built around.
- **Per-X convention**: one file per instance (service, integration, consumer, etc.) for any collection that would otherwise become a mega-file.
- **Distribution**: GitHub marketplace `TraceM171/arwyl-lite`, plugin name `arwyl-lite`, marketplace name `arwyl-lite-marketplace`. Previously named `agents-knowledge` (renamed `cda2226`).
- **Version-bump-for-cache**: Claude Code caches an installed plugin keyed by `plugin.json`'s `version` string, not by commit SHA. Pushing new commits alone does not reach existing installs — `version` must bump too, or the cached copy stays stale even after `/plugin marketplace update` refreshes the marketplace's own git checkout. Learned the hard way twice (`2d491a9`, `3e93d02`) before this became an explicit rule. Alternative exists (omit `version` entirely → falls back to commit-SHA versioning, fully automatic) but not adopted — this project keeps explicit semver.
- **`AGENTS.md` is inlined; knowledge files are not.** `claude_code/AGENTS.md` is pasted verbatim into the `SessionStart` hook's context (Claude Code hard-caps hook `additionalContext` at 10,000 characters, silent truncation past that, no error). A pre-commit hook (`.githooks`, opt in via `git config core.hooksPath .githooks`) blocks any commit that pushes it over an 8,000-character budget. `_basic.md`/`status.md` files are deliberately *not* inlined the same way — a growing `status.md` would blow the cap unnoticed — so the hook points the agent at them and lets it `Read` them instead (`09556ec`).
- **Never use Claude Code's own memory tool for project knowledge** — the `knowledge/` tree is the single source of truth (`AGENTS.md` "Memory discipline"). Applies to every project that installs this plugin, including this one.
- **Multi-tool intent, not multi-tool sharing**: `claude_code/` today; other tools (e.g. OpenCode) get their own top-level folder with real, adapted copies — not one abstraction shared across tools.
- **Commit style**: Conventional Commits prefix (`feat`/`fix`/`docs`/`chore`/`refine`/`rename`), short subject, body explaining why when it's non-obvious. No feature branches so far — history is linear on `main`.

## Known consumers

- **sanctum** (owner's homelab project) — installed via the GitHub marketplace route, project-scope enabled. First real-world user of `reflect`/`curate`/the statusline nudges; several of this system's rules (recent-changes-as-pointers, the append-to-existing-file mandatory-read trigger, the statusline dup-risk nudge) came directly from auditing sanctum's own session logs and finding where live capture went wrong in practice. See `status.md` for consumer/version tracking.

## Philosophy

Design-first, but every rule added to `KNOWLEDGE_ORG.md` / `AGENTS.md` so far has come from a concrete failure mode observed in a real consumer (sanctum), not from speculative design. See `status.md`'s "Recent changes" for the latest examples.
