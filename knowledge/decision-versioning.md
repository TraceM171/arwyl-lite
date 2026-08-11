# Explicit semver per plugin, bumped on every ship

**Status:** ACTIVE since 2026-07-10
**Decision:** Every plugin carries an explicit `version` in its `plugin.json`, and that version is
bumped for **any** change that should reach an install — including changes that alter nothing about
the knowledge-tree conventions themselves. The per-marketplace auto-update toggle stays on alongside
it. The caching mechanism this exists to work with is in `stack.md`'s "Version-bump-for-cache".

## Why (current reasoning)

Claude Code caches an installed plugin keyed by the `version` string, so an unbumped push simply does
not reach existing installs — the failure is silent, and it looks identical to a working release right
up until a consumer runs the old skill text. Learned the hard way twice (`2d491a9`, `3e93d02`) before
it became an explicit rule, and once more afterwards: `0.1.15` shipped rule fixes that no install
picked up until `0.1.16` bumped for them (`status.md`).

**Why explicit semver *specifically* was never written down.** The source this file was extracted from
(`stack.md`) recorded the choice and the alternative without recording a reason to prefer one. That gap
is left standing rather than filled with a plausible-sounding rationale — if the question is reopened,
it is genuinely open.

## Rejected

- **Omit `version` entirely** — Claude Code then falls back to commit-SHA versioning, fully automatic
  once the per-marketplace auto-update toggle is on. Considered, not adopted; the reason was not
  recorded at the time (see above).

## Consequences accepted

- A version bump is required even when the payload change is unrelated to a plugin's stated purpose —
  `arwyl-lite` went to `0.1.17` for a skill *removal* alone. A plugin's shipped skill set changing is
  a version-bump event regardless of cause (`decision-plugin-split.md`).
- Two plugins means two independently-bumped versions to track (`decision-plugin-split.md`).

## Deliberation

- `2d491a9`, `3e93d02` (2026-07-10) — the two pushes that did not reach installs, before the rule
  was explicit.
- `f18e998` — `0.1.16`, bumped solely so the `0.1.15` rule fixes would actually be picked up.
