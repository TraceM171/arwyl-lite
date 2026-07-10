---
name: reflect
description: Collect everything learned during the current session and update knowledge accordingly. Use when the user says "reflect" or asks to "capture what we've learned".
---

# Reflect Skill

Use this skill when the user says "reflect" or asks to "capture what we've learned" or similar requests to summarize and persist session knowledge.

## When Invoked

The user wants the agent to collect everything learned during the current session and update the knowledge base accordingly.

Knowledge should already be captured inline as work happens, per AGENTS.md's "Capture as you go" — reflect is the end-of-session safety net for whatever didn't get written down live, not the primary capture mechanism. It's typically run once, near the end of a session, not after every few edits. A pass that finds little or nothing to add is the expected steady state, not a sign it wasn't needed.

## Workflow

### 1. Identify Learned Information

Review the conversation history and identify:
- New facts about the project
- Decisions made and their rationale
- Architecture choices, patterns, or conventions discovered
- User preferences revealed during the session
- Any other information worth persisting

### 2. Update Knowledge Files

For each piece of learned information:

1. Read the relevant knowledge directory structure with `ls ./knowledge/` or `ls ./knowledge/.local/`, including the domain's `_basic.md`.
2. **Find the canonical home before writing.** Quick grep the tree (or at least the relevant domain) for the fact — if it already lives in `status.md` or a dated audit, update or link there instead of restating it in a new place. `KNOWLEDGE_ORG.md`'s no-duplication rule applies at write time, not just at curate time.
3. **If the fact supersedes an existing one** (a value changed — MFA type, a group membership, a port, a variable name — not a brand-new addition), grep for the old value/term across the tree and fix or link *every* file that states it, not just the one this session naturally touches. This is the main way knowledge goes stale between curate passes; don't leave it for curate to find later.
4. Create files or subdirectories as needed (refer to `KNOWLEDGE_ORG.md` for structure rules). Before naming a new file, decide its kind: a reusable recipe is a `pattern`; a completed one-time action (a deploy, a cutover, an incident) is a dated `audit` file (`YYYY-MM[-descriptor].md`) from the start, not a generic runbook name that outlives its relevance.
5. **Update the domain's `_basic.md` in the same pass** whenever a file is created or renamed — an index that lags its directory is exactly the drift curate exists to clean up; don't manufacture more of it.
6. If a file is moved, renamed, or deleted this session, grep the tree for references to its old path and fix them now, not later.
7. Append new information to the appropriate file.
8. If information is time-sensitive or experimental, mark it clearly.

### 3. Commit and Push (if applicable)

If the knowledge directory is a separate repo (not in the project repo), ask the user whether they want to commit and push the changes before finishing.

### 4. Report Summary

After updating knowledge, provide a brief summary:
- What new information was captured
- Where it was stored
- Any gaps or uncertainties noted
- If while reading/writing you noticed substantial `KNOWLEDGE_ORG.md` deviations beyond this session's own edits — duplication, mega-files, misplaced content, missing `_basic.md`s, mixed kinds — flag it and suggest the user run `curate` for a full audit/cleanup. A file or two slightly off doesn't warrant this; a pattern across the tree does.

## Important Notes

- Only capture information the user explicitly shared or that was discovered through work
- Do not fabricate or assume information — ask the user if unsure
- Preserve existing knowledge structure — do not restructure unless necessary