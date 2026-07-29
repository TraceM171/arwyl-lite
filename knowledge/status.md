# Status — Current State

**As of 2026-07-29.**

## Current version

`0.1.16` (`claude_code/.claude-plugin/plugin.json`). Marketplace: `arwyl-lite-marketplace` → GitHub `TraceM171/arwyl-lite`.

(The push to get `0.1.7` out briefly failed — SSH agent couldn't sign with the hardware key, "agent refused operation" — retried clean once the key was touched; every version since has pushed normally.)

This machine's plugin cache is on `0.1.15` — confirmed behaviourally on 2026-07-29 (the field-test consumer's curate transcript loads the `0.1.15` cache path). The earlier claim that it was stuck at `0.1.13` was wrong; `installed_plugins.json`-style metadata is not evidence, see `stack.md`.

## Recent changes

- **2026-07-29** — bumped to `0.1.16` to ship the field-study rule fixes + status-budget hook (previously landed at `0.1.15` but not version-bumped, so no install picked them up).
- **2026-07-29** — field study of a consumer's first curate pass: 6 findings, 7 rule fixes, and a new `PostToolUse` status-budget hook. `audit-2026-07-29-field-study-curate.md`, `decision-mechanism-over-prose.md`.
- **`f4d5fcc`** — internal `field-study` skill (`.claude/skills/`, not shipped): study a consumer to find arwyl system gaps. `.claude/skills/field-study/SKILL.md`.
- **`9541468`** — added the "Place for retrieval" rule (retrievability as a second placement axis, wired through AGENTS/reflect/curate). Preventive — `decision-retrievability.md`.
- **`5b28d68`** — **Decision** added as a sixth kind, plus five rule fixes, all traced to one root cause in a field review. Bumped to 0.1.14. Why + rejected alternatives: `decision-taxonomy-kinds.md`.
- **`6aca49d`** — curate: `_curated.md` marker became a full UTC timestamp, stamped after the pass's own commit — both bare dates and same-commit stamping made a pass recount its own work as drift. Bumped to 0.1.13. `stack.md`.
- **`3df49f2`** — statusline: curate's own knowledge edits no longer count toward the dirtiness/dup-risk trigger (mirrors the existing reflect-boundary exclusion). Bumped to 0.1.12.
- **`b0471bd`** — statusline: dropped always-on dirty/changed baseline stats (nudge-only now), fixed read/edit % exceeding 100% after mid-session file renames/deletes. Bumped to 0.1.11.
- **`efd5ed9`** — added "Open entries are pointers, not plans" (status/plan split, `phases.md`/`plan.md`) and de-biased infra-only examples across the rule docs. Bumped to 0.1.10.
- **`85fe55a`** — merged statusline's dirtiness stat into the reflect segment (`reflect: N dirty (Y%)`), made the count clickable. Bumped to 0.1.9.
- **`0e783e3`** — fixed the reflect-boundary detector: tool-result and `isMeta` transcript entries were closing the boundary before reflect's own edits ran, so its own writes always counted as dirty. Bumped to 0.1.8.
- **`e0219f6`** — fixed reflect-boundary detection missing user-typed `/reflect` invocations (no assistant `tool_use` emitted for those) — partial fix, see `0e783e3` for the rest. Bumped to 0.1.7.
- **`2146543`** — fixed reflect-boundary detection not matching marketplace-namespaced skill names (`arwyl-lite:reflect`), so the nudge never cleared for the field-test consumer. Bumped to 0.1.6.
- **`d089882`** — made statusline's read/edited/branch/session counts clickable (OSC8 hyperlink) — each opens a generated local HTML page with details/diffs.
- **`655e47f`** — statusline's `reflect?` nudge gained a second trigger: fires again after >2 knowledge files edited since the last reflect pass, not just once per session. Bumped to 0.1.5.
- **`59a6207`** — closed the live-capture duplication gap: status.md recent-changes entries must be pointers not records (this rule), append-to-existing-file added as a mandatory `KNOWLEDGE_ORG.md` reread trigger, reflect gained a session-scoped dedup-audit step.
- **`09556ec`** — `SessionStart` hook stopped inlining large knowledge files (`_basic.md`/`status.md`) — see `stack.md`'s "AGENTS.md is inlined; knowledge files are not".
- **`cda2226`** — renamed from `agents-knowledge` to `arwyl-lite` (plugin + marketplace name).

## Open

- Restart Claude Code once to load the new internal `field-study` skill (first-time `.claude/skills/` dir; `/reload-plugins` won't do it) — owner, by hand.
- This `knowledge/` tree itself is brand new (scaffolded 2026-07-10) — expect a `reflect`/`curate` pass to reshape it as real work accumulates. No domains yet, by design.