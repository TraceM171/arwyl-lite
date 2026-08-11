# `secret-capture`'s scope: what shipped, what didn't (yet)

**Status:** ACTIVE since 2026-07-31
**Decision:** Ship `secret-capture` (`arwyl-extras/skills/secret-capture/`) as a skill + Bash script,
capture and cleanup only — no exposure-warning guard hook, no MCP-tool interface. Both omissions are
deliberate scope limits, not unfinished work, each revisited only under a stated trigger.

## Skill + script, not an MCP tool

Claude Code plugins can bundle a real MCP server (a typed, always-listed tool rather than a skill Claude
must be told to invoke) — confirmed live, the `/reload-plugins` output explicitly counts "plugin MCP
servers" as a category. That would remove the one real weak point in the current design: I have to
correctly follow `SKILL.md`'s prose to compute the plugin-root path, background the call, and parse its
one-line output, rather than making a structured tool call.

**Rejected for now** — an MCP tool would not add secrecy protection beyond what already exists (the
"never let the value enter context" guarantee already comes from the script choosing not to print it to
stdout; an MCP server would need the identical discipline in its own response, not gain anything from the
transport). What it would buy is invocation reliability and always-on discoverability, at the cost of a
persistent server process and more plugin-lifecycle surface — and per `decision-mechanism-over-prose.md`,
this project builds mechanism from *observed* failure, not speculatively. Every test of the skill so far
succeeded, including a cold read of `SKILL.md`'s own instructions with no prior context. Revisit if the
skill-based invocation actually misfires in real use, or if the owner wants the discoverability regardless
of evidence.

## Capture + cleanup only, no exposure-warning guard hook

A `PreToolUse` hook could substring-match the active secret's value against every `Bash`/`Write`/`Edit`
call and deny matches — but unlike the field-test consumer's `block-env-dump.sh` (which pattern-matches command *syntax*
with no value in hand), this would need the plaintext readable from disk for the *entire* checkout window,
not just the seconds a consuming command needs it — a real widening of exposure versus today. It would
also need a static, never-value-interpolated deny reason (or the guard becomes the leak), and a
minimum-length floor so short values don't false-positive against ordinary commands and train the habit of
working around it — exactly the failure mode the field-test consumer's own decision doc already rejected a broader hook
for.

**Rejected for now, by explicit owner choice** (asked directly, chose "capture + cleanup only") — not
because the guard is a bad idea, but because it's a separate mechanism with its own risk surface that
doesn't need to ship in the same pass as capture itself. Revisit only with a concrete plan for the three
risks above, not as a default follow-up.

## Consequences accepted

- The `secret-capture` skill's own text still has to instruct "reference by path only, never `cat` it" as
  prose, same as the field-test consumer's shapes 2–4 today — no mechanical backstop for that discipline yet.
- If the skill-based invocation is field-verified as reliable, "no MCP tool" is a standing choice, not
  just a starting one — re-litigate deliberately if raised again, don't treat this file's silence as
  permission to skip the question next time.

## Deliberation

- Session 2026-07-31 (this repo) — both calls made in the same conversation that built and shipped
  `secret-capture`: MCP raised and deferred by the owner after the skill was already working end-to-end;
  the guard hook raised and deferred *before* building anything, via a direct question.
- `decision-plugin-split.md` — the sibling decision this skill shipped under; scoped to *why two plugins*,
  not to `secret-capture`'s own internal design, hence a separate file here.
- `incident-2026-07-31-capture-secret-cleanup-bug.md` — a real bug found while building this skill (a
  `set -e` pitfall that silently skipped cleanup on failure paths), unrelated to the scope choices above
  but discovered in the same session.
