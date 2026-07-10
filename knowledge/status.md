# Status — Current State

**As of 2026-07-10.**

## Current version

`0.1.5` (`claude_code/.claude-plugin/plugin.json`), pushed to `origin/main` (`655e47f`). Marketplace: `arwyl-lite-marketplace` → GitHub `TraceM171/arwyl-lite`.

This machine's marketplace checkout (`~/.claude/plugins/marketplaces/arwyl-lite-marketplace`) was last confirmed at `a52fd67` (0.1.4) — one commit behind `main`. Cached versions on disk (`~/.claude/plugins/cache/arwyl-lite-marketplace/arwyl-lite/`): `0.1.0`–`0.1.4`; `0.1.5` not yet fetched. Needs a `/plugin marketplace update` to catch up.

Manual semver bump is still required for any consumer's cached copy to refresh — an auto-update toggle exists per-marketplace (`/plugin` → Marketplaces → enable) but even with it on, the cache is keyed by the `version` string, so a bump is still what actually invalidates the old cached copy.

## Known consumers

- **sanctum** — installed via the GitHub marketplace route, project-scope enabled (`.claude/settings.json`). Shares this machine's plugin cache (not a separate install) — whatever version is cached here is what sanctum sees next session. Last confirmed running the plugin during a 2026-07-09 `curate` pass, when the marketplace had just been migrated to this GitHub route.

## Recent changes

- **`655e47f`** — statusline `reflect?` nudge gained a second, independent trigger: more than 2 knowledge files edited since the last `reflect` pass (excluding reflect's own edits) re-fires the nudge, unlike the old "nothing captured at all" triggers, which fire at most once per session. Needed a two-pass transcript scan — the reflect boundary isn't knowable while still walking reflect's own edits in a single forward pass. Bumped to 0.1.5.
- **`59a6207`** — closed the gap that let sanctum duplicate facts across `status.md` and per-X files despite having read `KNOWLEDGE_ORG.md` shortly before writing: added "recent-changes entries are pointers, not records", extended the mandatory-reread trigger list to cover appending to an *existing* file (not just new/move/restructure — the actual failure mode observed), and gave `reflect` a session-scoped dedup-audit step instead of only checking for gaps.
- **`09556ec`** — `SessionStart` hook stopped inlining `knowledge/_basic.md` / `.local/_basic.md` / `status.md` content directly into hook context; large files were silently truncated past Claude Code's undocumented size cap, with no error surfaced. The hook now tells the agent to `Read` them itself.
- **`cda2226`** — renamed from `agents-knowledge` to `arwyl-lite` (plugin + marketplace name).

## Open

- Confirm sanctum's plugin actually picks up `0.1.5` next session there (needs the marketplace checkout refreshed past `a52fd67` first).
- This `knowledge/` tree itself is brand new (scaffolded 2026-07-10) — expect a `reflect`/`curate` pass to reshape it as real work accumulates. No domains yet, by design.
