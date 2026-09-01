# Audit — second real `deep` run (Gym project), write-token duplication measured, cross-account resume validated a simpler mechanism (2026-09-01)

Frozen record of a `field-study` pass over a second real `thorough deep/slow` run, this time through the
shipped `0.3.3` design (`decision-thorough-skill.md`). Consumer: the same project as
`incident-2026-09-01-thorough-deep-session-limit.md` (generic here per that file's own convention),
running a 6-branch research task on training periodization. Traced directly from the session's own
transcripts and subagent JSONL logs — main-profile session `d9fba568` and a second, genuinely different
Claude account's session `48287cd1`, both against `~/.claude/projects/.../subagents/*.jsonl`.

## Method

Read-only transcript forensics: parsed both sessions' `.jsonl` files with `python3 -c` one-liners (never
loaded a full multi-MB transcript into context), diffed `tool_use` input sizes against the
`<task-notification>` payloads that preceded them, and located every `Agent`/`Edit`/`Write` call and its
byte size. Cross-referenced against `decision-thorough-skill.md` and its two prior audits so only new
findings are recorded here.

## Findings

**1. `0.3.3`'s checkpoint-on-notification design held under a second real account-limit hit, at `slow`
speed.** Confirmed live via cache path (`arwyl-extras/0.3.3` in the plugin cache — resolves `status.md`'s
prior "not yet installed" item). Branches 1–4 dispatched and checkpointed strictly sequentially; the
account then hit its usage limit mid-run — a second real occurrence of
`incident-2026-09-01-thorough-deep-session-limit.md`, this time at `slow`, not `fast`. Unlike the first
incident, branches 1–3 survived intact (already checkpointed to the working file before the limit hit).

**2. The "in-flight branch is lost outright" framing is stronger than what actually happened.** Branch 4's
completion notification *did* arrive in the origin session — full ~31,255-char report, index 279 of
`d9fba568.jsonl` — one turn before the account limit killed the assistant turn that would have
checkpointed it (index 280: `"You've hit your session limit"`). The work was not lost; it was sitting,
complete, in two places on disk (the origin session's own transcript, and the subagent's own
`agent-a5aaf219f59791238.jsonl`) — it just never got processed into the checklist file. `decision-
thorough-skill.md`'s open item ("branches in flight at the moment of an interruption are lost outright")
should read as "a branch's *notification* may arrive too late to be processed in the killed turn," not as
data loss — the raw transcript remains readable and recoverable after the fact, at zero cost, independent
of whether the notification round-trip completed.

**3. The documented resume mechanism (copy transcript + `SendMessage`-by-agent-ID) was neither trusted nor
used for the cross-account case — a plainer, more robust technique substituted itself.** The user's own
resume prompt into the second session stated plainly that cross-account `SendMessage`/`ListAgents` would
almost certainly not address Branch 4's agent ID, and instructed a fresh dispatch instead. The resuming
session did neither: it discovered that Bash has full filesystem access across Claude Code profiles
(profiles isolate Claude Code's own config/session storage, not OS-level file permissions), then read
`agent-a5aaf219f59791238.jsonl` directly with a `python3` one-liner — find the last `type: assistant`
entry with real text content, extract it, done. Zero tool calls, zero re-derived research, zero cost.
`SendMessage`-by-agent-ID was never attempted in this run — cross-account resume via that path remains
untested; what's now tested and confirmed working is direct-transcript-read, which needs no live agent,
no session/account match, and no Claude-Code-specific ID resolution — just a file path (`audit-2026-09-01-
thorough-resume-design.md`'s Finding 5 tested cross-*session* resume via copy-and-`SendMessage`, same
account; this is the first real cross-*account* data point, and it bypassed that mechanism entirely).

**4. Write-token duplication, measured directly, and worse than the two-hop version originally described.**
Traced three separate re-emissions of substantially the same content:
   - **Hop 1 → 2:** Branch 1's subagent generated a ~30,271-char final answer (its own output tokens,
     `<result>` in the notification). The orchestrator then re-emitted a ~13,096-char condensed version via
     a single `Edit` (`old_string` 114 chars, `new_string` 13,096) to checkpoint it — a second full
     generation pass over the same material. Branches 2–3 show the identical pattern: 15,589 and 21,383
     `new_string` chars respectively. This is the duplication originally flagged.
   - **Hop 2 → 3:** In the resuming session, `SKILL.md` step 4 ("offer persistence") `Read` the entire
     142KB/546-line working checklist file back into context, then `Write`ed a fresh
     `knowledge/training/audit-2026-09-training-cycles.md` — 109,563 new characters (~27K tokens) — a
     **third** re-emission of the same underlying findings.
   - Summed: roughly 44KB (branches 1–3's checkpoint `Edit`s) + 109KB (the final persistence `Write`) of
     model-generated text paraphrasing content that had already been generated once by the subagents that
     produced it.

**5. No cleanup step exists for the now-superseded working file.** After the final `Write` to
`knowledge/training/audit-2026-09-training-cycles.md`, nothing in the transcript or in `SKILL.md`'s step 4
addresses the 142KB `thorough-checklist-training-cycles.md` left at the project root. It is not
`.gitignore`d in that project.

## Verdict

Two of `decision-thorough-skill.md`'s open items get real evidence: the resume mechanism's actual failure
mode under cross-account conditions (findings 2–3), and the write-token duplication cost, now measured
rather than inferred (finding 4). Classified **system gap** on both counts — a different consumer running
the same `0.3.3` design would hit the identical duplication on every `deep`/`max` run, and would face the
identical choice (trust an untested cross-account `SendMessage`, or improvise transcript-reading) the next
time a session-limit hit forces an account switch mid-run. Finding 5 is a small, low-risk gap in the same
category. Proposed fixes for all three, checked for feasibility against Claude Code's actual permission
model (no per-path `Write`/`Edit` scoping in subagent frontmatter or `Agent` dispatch — confirmed against
`code.claude.com/docs/en/sub-agents`), are folded into `decision-thorough-skill.md` and shipped as
`arwyl-extras` `0.3.4`.

## Deliberation

- `decision-thorough-skill.md` — the living decision these findings were applied to; carries the resulting
  `SKILL.md`/`investigator.md` changes.
- `incident-2026-09-01-thorough-deep-session-limit.md` — the first occurrence of the session-limit hit this
  audit's findings 1–3 extend.
- `audit-2026-09-01-thorough-resume-design.md` — the same-account cross-session resume tests this audit's
  finding 3 contrasts against (cross-account is a new, harder case).
