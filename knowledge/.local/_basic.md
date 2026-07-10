# Local Knowledge — Owner Context (Arwyl Lite)

Owner-specific context for maintaining this project — not needed by a different maintainer of the same plugin design, but real context for how *this* owner works.

## GitHub

- **Account:** `TraceM171`
- **Repo:** `git@github.com:TraceM171/arwyl-lite.git` (origin, both fetch/push). Also cloned read-only by Claude Code itself at `~/.claude/plugins/marketplaces/arwyl-lite-marketplace` (the marketplace's live checkout, refreshed via `/plugin marketplace update`) and cached per-version under `~/.claude/plugins/cache/arwyl-lite-marketplace/arwyl-lite/<version>/` (what's actually loaded at runtime).

## Personal usage

- Owner is also the maintainer and sole user of `sanctum` (a homelab project) — the plugin's primary real-world consumer, and the source of most concrete rules added so far (live-capture duplication, the append-trigger gap, the statusline dup-risk nudge). When weighing whether a new rule is worth adding: "would this have caught something that actually happened in sanctum" is a good test.
- This repo dogfoods itself: the plugin is installed here at project scope (`.claude/settings.json`), and the status line is symlinked to *this* working copy's `claude_code/statusline.py` (not the marketplace cache) — so changes here are visible immediately, without a version bump or reinstall cycle, while actively developing.

## Notes

- No urgency; solo-maintained, changes go straight to `main`.
- Prefers concrete evidence over speculative rule changes — trace the actual failure in sanctum's session logs first (or a synthetic test transcript), then design and test the fix, before writing it into the rules. See `655e47f`'s dup-risk nudge for the pattern.
