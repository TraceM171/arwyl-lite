# Status — Current State

**As of 2026-07-16.**

## Current version

`0.1.13` (`claude_code/.claude-plugin/plugin.json`), pushed to `origin/main` (`b586a1f`). Marketplace: `arwyl-lite-marketplace` → GitHub `TraceM171/arwyl-lite`.

(The push to get `0.1.7` out briefly failed — SSH agent couldn't sign with the hardware key, "agent refused operation" — retried clean once the key was touched; every version since has pushed normally.)

This machine's marketplace checkout and plugin cache were refreshed to `0.1.13` via `/plugin marketplace update` + `/reload-plugins` on 2026-07-16, right after the push above.

## Known consumers

- **sanctum** — installed via the GitHub marketplace route, project-scope enabled (`.claude/settings.json`). Shares this machine's plugin cache (not a separate install) — the refresh above updates the one cache both draw from, so sanctum picks up `0.1.13` on its next session/`/reload-plugins`, no separate marketplace-update needed there. Last confirmed running the plugin during a 2026-07-15 `curate` pass (the one whose bare-date marker exposed the drift-counting bug fixed in `0.1.13` — see Recent changes).

## Recent changes

- **`6aca49d`** — curate: `_curated.md` marker changed from a bare date to a full UTC timestamp, and marker-stamping moved to after the pass's own commit (not before) — bare-date `git log --since` is midnight-inclusive and double-counted same-day pre-pass commits as drift; even a timestamp alone still let the pass's own closing commit count itself as drift the next time. Bumped to 0.1.13.
- **`3df49f2`** — statusline: curate's own knowledge edits no longer count toward the dirtiness/dup-risk trigger (mirrors the existing reflect-boundary exclusion). Bumped to 0.1.12.
- **`b0471bd`** — statusline: dropped always-on dirty/changed baseline stats (nudge-only now), fixed read/edit % exceeding 100% after mid-session file renames/deletes. Bumped to 0.1.11.
- **`efd5ed9`** — added "Open entries are pointers, not plans" (status/plan split, `phases.md`/`plan.md`) and de-biased infra-only examples across the rule docs. Bumped to 0.1.10.
- **`85fe55a`** — merged statusline's dirtiness stat into the reflect segment (`reflect: N dirty (Y%)`), made the count clickable. Bumped to 0.1.9.
- **`0e783e3`** — fixed the reflect-boundary detector: tool-result and `isMeta` transcript entries were closing the boundary before reflect's own edits ran, so its own writes always counted as dirty. Bumped to 0.1.8.
- **`e0219f6`** — fixed reflect-boundary detection missing user-typed `/reflect` invocations (no assistant `tool_use` emitted for those) — partial fix, see `0e783e3` for the rest. Bumped to 0.1.7.
- **`2146543`** — fixed reflect-boundary detection not matching marketplace-namespaced skill names (`arwyl-lite:reflect`), so the nudge never cleared for sanctum. Bumped to 0.1.6.
- **`d089882`** — made statusline's read/edited/branch/session counts clickable (OSC8 hyperlink) — each opens a generated local HTML page with details/diffs.
- **`655e47f`** — statusline's `reflect?` nudge gained a second trigger: fires again after >2 knowledge files edited since the last reflect pass, not just once per session. Bumped to 0.1.5.
- **`59a6207`** — closed the live-capture duplication gap: status.md recent-changes entries must be pointers not records (this rule), append-to-existing-file added as a mandatory `KNOWLEDGE_ORG.md` reread trigger, reflect gained a session-scoped dedup-audit step.
- **`09556ec`** — `SessionStart` hook stopped inlining large knowledge files (`_basic.md`/`status.md`) — see `stack.md`'s "AGENTS.md is inlined; knowledge files are not".
- **`cda2226`** — renamed from `agents-knowledge` to `arwyl-lite` (plugin + marketplace name).

## Open

- Confirm sanctum's next `curate` pass rewrites its `_curated.md` from the old bare date (`2026-07-15`) into the new timestamp format — the shared-cache refresh to `0.1.13` is done (see Current version); this is the one remaining step.
- This `knowledge/` tree itself is brand new (scaffolded 2026-07-10) — expect a `reflect`/`curate` pass to reshape it as real work accumulates. No domains yet, by design.
