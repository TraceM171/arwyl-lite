# Two plugins, not one — `arwyl-lite` and `arwyl-extras`

**Status:** ACTIVE since 2026-07-31
**Decision:** Ship a second, independent Claude Code plugin — `arwyl-extras` (`arwyl-extras/`, marketplace
entry `arwyl-extras@arwyl-lite-marketplace`) — for capabilities that are useful to a Claude Code session
but have no dependency on the knowledge-tree system. `arwyl-lite` keeps only what actually implements or
enforces the six-kinds/per-X conventions (`reflect`, `curate`, `knowledge-org`, the `SessionStart` hook,
the status-budget hook, the status line). Everything else starts in `arwyl-extras` and only moves back if
it turns out to need the knowledge tree after all.

First move: the `handoff` skill (`arwyl-extras/skills/handoff/`, out of `claude_code/skills/handoff/`).
It reads `@knowledge/*` pointers *when present* but does not require them — a project with no `knowledge/`
tree still gets a useful handoff. Second, shipped 2026-07-31: `secret-capture`
(`arwyl-extras/skills/secret-capture/`) — asks the owner for a secret via an out-of-band OS dialog, never
through a tool call Claude can read or write to. Same test, same non-dependency.

## Why (current reasoning)

`arwyl-lite`'s own index (`knowledge/_basic.md`) already scopes the project as "structured knowledge-tree
conventions and Claude Code tooling" — `handoff` fit the second half of that sentence only by
association, not because generating a session-summary prompt has anything to do with the six kinds or
the per-X convention. The owner flagged this directly: it "felt like an extra besides the arwyl-lite
knowledge system." The secret-capture tool sharpened the same question from the other direction — it's a
capability with real value in any Claude Code session, knowledge tree or not, and bolting it onto
`arwyl-lite` would mix a knowledge-hygiene plugin with a runtime-security one.

The concrete test used to sort a capability into one plugin or the other: **does removing the
`knowledge/` tree from a consuming project break it, or just make it thinner?** `reflect`/`curate` are
inert without a tree (nothing to reflect on). `knowledge-org` has nothing to teach. The `SessionStart`
hook and status-budget hook are explicitly no-ops without one (`stack.md`). `handoff` and secret-capture
both degrade gracefully instead — they do less, but still work.

Splitting rather than folding everything into `arwyl-lite` keeps the version-bump-for-cache mechanism
(`stack.md`) meaningful: a consumer who only wants secret-capture doesn't have to accept every future
knowledge-tree rule change riding along in the same version bump, and vice versa. It also means a
project can install `arwyl-extras` alone, with no `knowledge/` tree and no opinion on how one should be
organized.

## Rejected

- **Keep `handoff` in `arwyl-lite`, add secret-capture there too** — rejected as scope creep once named:
  neither capability implements or enforces a knowledge-tree convention, so bundling them with `reflect`/
  `curate`/`knowledge-org` makes the plugin's actual boundary ("knowledge-tree conventions") a lie every
  time it ships something unrelated.
- **A separate git repo per plugin** — rejected for now: one repo, one marketplace (`arwyl-lite-marketplace`),
  two `source` entries in `.claude-plugin/marketplace.json` pointing at two sibling directories
  (`./claude_code`, `./arwyl-extras`) — each still an independently versioned, independently installable
  plugin from Claude Code's perspective. Revisit only if the two payloads' release cadences turn out to
  actually conflict; no evidence of that yet.
- **A hard dependency from `arwyl-extras` on `arwyl-lite` being installed** — rejected; the entire point
  is a consumer can take one without the other. `arwyl-extras`' skills must not assume `arwyl-lite`
  conventions exist, only use them opportunistically when they do (see `handoff`'s `@knowledge/*`
  pointers, which are skipped rather than required when no tree exists).
- **Nest `arwyl-extras` under a `claude_code/` subfolder to mirror `arwyl-lite`'s multi-tool layout** —
  rejected for now: that nesting exists in `arwyl-lite` specifically for future non-Claude-Code tool
  copies (`stack.md`'s "Multi-tool intent"), and `arwyl-extras` has no such copy today (no manual-install
  / OpenCode variant shipped). Restructure into that shape only if and when a second tool integration is
  actually built, per `KNOWLEDGE_ORG.md`'s "restructure, do not patch" — not speculatively now.

## Consequences accepted

- Two `plugin.json` files, two versions, two changelogs-by-commit-message to track instead of one.
  Accepted: the alternative (one plugin whose description has to keep listing unrelated capabilities) is
  the actual complaint that started this.
- `arwyl-lite`'s own version bumped to `0.1.17` for the removal alone, even though nothing about
  knowledge-tree conventions changed — a plugin's shipped skill set changed, which is a version-bump
  event per `stack.md` regardless of cause.
- Verified end-to-end 2026-07-31, twice: two `source` entries under one marketplace both install and
  register cleanly (`audit-2026-07-31-arwyl-extras-symlink.md` covers the one real bug hit along the
  way), and again for `0.2.0` after `secret-capture` shipped — both skills confirmed by real invocation,
  not just presence in the skill listing.

## Deliberation

- Session 2026-07-31 (this repo) — the question that started it: whether a secret-capture tool belonged
  in `arwyl-lite` at all, which surfaced the pre-existing `handoff` misfit first.
- The field-test consumer's own `decision-secret-handling.md` and `deploy-2026-07-secret-handling-hook.md`
  (private project, referenced here only for the shape of the problem, not the content) — the gap that
  motivated the secret-capture skill: introducing a brand-new secret has no tool-call-safe path today.
