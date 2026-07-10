# Status — Current State

**As of 2026-07-11.**

## Current version

`0.1.11` (`claude_code/.claude-plugin/plugin.json`), pushed to `origin/main` (`b0471bd`). Marketplace: `arwyl-lite-marketplace` → GitHub `TraceM171/arwyl-lite`.

(The push to get `0.1.7` out briefly failed — SSH agent couldn't sign with the hardware key, "agent refused operation" — retried clean once the key was touched; every version since has pushed normally.)

This machine's marketplace checkout and plugin cache were last refreshed to `0.1.10` (`fd0c381`) via `/plugin marketplace update` + `/reload-plugins` on 2026-07-11 — now stale again against the `0.1.11` push above; needs another refresh cycle before this machine (or sanctum, which shares the cache) picks it up. Manual semver bump is still what actually invalidates a stale cached copy, even with the per-marketplace auto-update toggle on (cache is keyed by the `version` string).

## Known consumers

- **sanctum** — installed via the GitHub marketplace route, project-scope enabled (`.claude/settings.json`). Shares this machine's plugin cache (not a separate install) — still on the cached `0.1.10` until the next `/plugin marketplace update` picks up `0.1.11`. Last confirmed running the plugin during a 2026-07-09 `curate` pass, when the marketplace had just been migrated to this GitHub route.

## Recent changes

- **`b0471bd`** — statusline: dropped the always-on "N dirty/changed (Y%)" baseline stats from the reflect/curate segments — both now show only a bare dot + label + one-word reason (`dirtiness`) when their trigger fires, nothing otherwise. Also fixed read/edit % exceeding 100% (files renamed/merged/deleted mid-session, e.g. by a curate pass, were staying in the numerator after `total_files` dropped them — now filtered to paths that still exist). Bumped to 0.1.11.
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

- Refresh this machine's marketplace cache to `0.1.11` (`/plugin marketplace update` + `/reload-plugins`), then confirm sanctum picks it up next session (shared cache).
- This `knowledge/` tree itself is brand new (scaffolded 2026-07-10) — expect a `reflect`/`curate` pass to reshape it as real work accumulates. No domains yet, by design.
