# Audit — live experiments behind the `thorough` `0.3.3` resume/speed redesign (2026-09-01)

Frozen record of same-day follow-up work after `0.3.2` (sequential-only `deep`/`max` dispatch, shipped in
response to `incident-2026-09-01-thorough-deep-session-limit.md`). The owner proposed a fuller design —
a speed lever plus a dispatch manifest plus cross-session resume — and asked for it to be checked against
reality rather than assumed. Four live experiments and one round of official-docs research, all run
in-session on 2026-09-01, are recorded here; `decision-thorough-skill.md` carries the resulting design.

## Method

Direct, reproducible tests against the actual running harness (this repo's own Claude Code session),
plus WebFetch against Anthropic's official Claude Code docs (`code.claude.com/docs/en/sub-agents`,
`/docs/en/workflows`) rather than third-party summaries where a claim needed authoritative sourcing.

## Findings

**1. Batched dispatch delivers independent per-agent notifications, not one joint notification.**
Dispatched two agents together in a single message — one trivial (`date +%s`), one deliberately slow
(`sleep 45 && date +%s`). Notifications arrived separately: the fast one at ~3.5s, the slow one at ~52s.
This overturned `0.3.2`'s own stated reasoning, which had claimed batching itself was what exposed every
branch for the whole run. It doesn't — what exposes a branch is only that its own notification hasn't
been processed yet. The actual defect in the pre-`0.3.2` design was dispatching everything and waiting to
"collect all reports" before checkpointing anything, regardless of when each branch actually finished.

**2. A completion notification can fire more than once, and an early one is not always final.** The same
slow-branch test agent reported `status: completed` with an interim status message ("I'll wait for its
completion notification...") at ~7.6s, then a second notification ~52s in carried the real answer. Any
checkpoint logic that trusts the first notification as final risks saving a non-answer and marking the
branch done prematurely.

**3. Subagent transcript file paths are documented and stable, not an internal detail.** Confirmed via
`code.claude.com/docs/en/sub-agents`: the agent ID returned at dispatch is used to name the transcript at
`~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`, with a companion
`agent-{agentId}.meta.json`. The docs also state plainly that a subagent **cannot** be resumed via
`claude --resume <id>` in the traditional session-resume sense — it resumes only through `SendMessage`
to its ID/name, "within their session."

**4. `SendMessage` to a completed agent genuinely resumes it from its own stored transcript, full history
intact.** Sent a message to an agent that had finished ~20 minutes and many turns earlier in this session,
asking it to recall its own prior result *from memory, without redoing the work*. It answered correctly —
the exact original number — with **zero tool calls**. Not a re-derivation; genuine recall from retained
context.

**5. The same resume mechanism works across a genuinely separate session, if that session's `subagents/`
folder contains a copy of the target transcript.** Real, isolated test: generated a fresh session UUID,
created its `subagents/` directory, copied a completed agent's `.jsonl` + `.meta.json` into it (no new
dispatch — reused an already-finished test agent), then launched a real, separate `claude -p` process
(model `haiku`, `--permission-mode bypassPermissions`) that had never dispatched that agent. It
`SendMessage`'d the copied-in agent ID and got back the exact correct original answer, recalled from
memory, zero redone work. Total cost: **$0.0545**, ~16.8s API time. The transcript's own embedded
`"sessionId"` field (naming the *original* session, not the new one) and the `meta.json`'s `toolUseId`
(pointing at a tool-call entry absent from the new session's own history) did not block or visibly corrupt
the resume — it worked cleanly despite the identity mismatch. Test session cleaned up afterward.

**Caveats on Finding 5, carried forward honestly:** one test, one small, cleanly-completed, single-turn
transcript. Not verified: behavior at the scale of a real `investigator` branch transcript (megabytes,
many tool calls — one gym branch was 4MB); behavior against a transcript cut off specifically by a
usage-limit hit rather than ending cleanly, since deliberately draining an account's limit to test this
was judged not worth the cost. `decision-thorough-skill.md` and `thorough/SKILL.md` both flag cross-session
resume as best-effort with a fresh-dispatch fallback, not a guaranteed mechanism, on this basis.

**6. `$CLAUDE_CODE_SESSION_ID` reliably exposes the current session's own ID.** Confirmed by reading the
env var directly and matching it against the known session directory name. Simpler and more reliable than
any path-parsing heuristic (e.g. inferring it from a scratchpad path convention that may not be portable
across installs).

**7. Claude Code has a native "dynamic workflows" feature that substantially overlaps this skill's
purpose, but doesn't solve the cross-session case.** `/docs/en/workflows`: a JS-scripted orchestration
layer (`agent()`/`pipeline()`/`parallel()`) with its own journaling and resume, native concurrency
control, per-agent cost visibility, and a large-run cost warning (>25 agents or >1.5M projected tokens) —
exactly the visibility whose absence made the gym incident's cost invisible until the limit hit. Its own
resume is documented as same-session only: "a session you start fresh has nothing to replay and starts
the workflow over." This settles, in the negative, whether the native feature already does what Finding 5
does by hand — it doesn't, which is why Finding 5's custom mechanism was worth building. Not adopted this
pass regardless: workflows are gated (opt-in on Pro via `/config`, org-disableable), so a workflow-only
`thorough` would break for consumers without them; `/deep-research`, a bundled workflow, already
overlaps much of `deep`'s purpose, which is a real strategic question for a later pass, not this one.

## Verdict

All five live tests support the owner's proposed design (speed lever + dispatch manifest + resume) more
strongly than the `0.3.2` design it replaces. Findings 1–2 relocate the real safety mechanism from
"never run concurrently" to "checkpoint on a verified notification, regardless of concurrency" — which
makes a genuine speed/exposure tradeoff dial (fast/regular/slow) sound, where `0.3.2` had none. Findings
3–6 turn cross-session resume from a speculative DIY idea into a tested (if scale-unverified) mechanism.
Shipped as `arwyl-extras` `0.3.3`; see `decision-thorough-skill.md` for the resulting design and its
still-open items (scale, limit-kill-specific behavior, `max` still never run for real).

## Deliberation

- `decision-thorough-skill.md` — the living decision these findings were applied to.
- `incident-2026-09-01-thorough-deep-session-limit.md` — the original failure this whole line of work
  responds to.
- `audit-2026-08-31-thorough-skill-evidence.md`, `audit-2026-08-31-thorough-skill-external-techniques.md`
  — the original design and evidence `0.3.0`/`0.3.1` were built on.
