# Incident — `arwyl-extras` `0.3.0` failed to install: invalid `agents` manifest key

**Date:** 2026-08-31. Closed same day.

## What happened

`0.3.0` shipped `arwyl-extras/.claude-plugin/plugin.json` with an explicit `"agents": "./agents/"` key,
added alongside the pre-existing `"skills": "./skills/"` key on the assumption that `agents/` needed the
same explicit declaration `skills/` already had. On the owner's actual install, Claude Code's plugin
loader rejected the manifest outright: *"Plugin arwyl-extras has an invalid manifest file... Validation
errors: agents: Invalid input."* The whole plugin failed to load — not just the new `investigator`
agent, but the pre-existing `handoff` and `secret-capture` skills too, since an invalid manifest blocks
the plugin entirely.

## Why

The `"agents"` key's existence and general shape were checked against real precedent before shipping
(`claude-security`'s `agents/*.md` files, confirmed live) — but the check stopped at *the individual
agent files' frontmatter* (`effort:`, `tools:`) and never extended to *`claude-security`'s own
`plugin.json`*. Checked after the fact: no `plugin.json` anywhere on the machine — across every
installed marketplace, including `claude-security`, `plugin-dev`, and every other official plugin
shipping agents — declares an `"agents"` key at all. `agents/` is auto-discovered from its default
location without one, the same way `skills/` likely could be; `skills/./skills/` merely happened to
already be present and harmless from before this incident, not evidence that the same explicit-key
pattern generalizes to `agents`. Documentation (`plugin-dev`'s `plugin-structure` skill) shows both a
bare-string and an array form for an explicit `agents` key in *examples*, which reads as supported —
but no real installed plugin actually uses either form, and the real validator disagreed with the docs.

This is exactly the risk `status.md`'s Open item already named before any install was attempted: *"a
silently-ignored field would look identical from the outside until a real install is tested."* The
actual failure was louder than that — a hard validation error, not a silent no-op — which is a better
outcome than the one predicted: nothing shipped broken to a running session, the plugin simply refused
to install until fixed.

## Fix

Removed the `"agents"` key from `arwyl-extras/.claude-plugin/plugin.json` entirely; `agents/` is left to
auto-discover from its default path, same as every other plugin on this machine that ships one. Bumped
`0.3.0` → `0.3.1` for the cache (`decision-versioning.md`).

## Lesson

When adopting a manifest field from documentation plus one plugin's *file-level* usage, check that
plugin's own `.claude-plugin/plugin.json` too, not just the files docs and frontmatter point to — a
field can be real and correctly used at the file level while an assumed manifest declaration for it is
not, and the two checks are not redundant. Verifying "in active use" needs to mean the *specific
mechanism being added*, not an adjacent one that merely looks parallel to it.

## Deliberation

- `decision-thorough-skill.md`, `status.md`'s Open item — the shipped design and the caution that
  predicted this exact class of failure, before it was confirmed.
- Screenshot of the actual Claude Code "Installed Plugins" error, provided by the owner, 2026-08-31.
