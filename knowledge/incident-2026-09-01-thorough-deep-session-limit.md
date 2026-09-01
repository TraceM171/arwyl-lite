# Incident — first real `deep` dispatch burned a near-full 5-hour session window (2026-09-01)

Frozen record of the `thorough` skill's `deep` level running for real, for the first time, through an
actual plugin-cache install (`arwyl-extras` `0.3.1`) — resolving `status.md`'s prior open item ("no
level has actually run yet") with a concrete, and costly, result. Consumer: a third real project (a
personal knowledge-tree project, non-code research/analysis domain) — kept generic here per this tree's
existing convention for personal-data-bearing consumers (`.local/_basic.md`).

## What happened

The owner ran `thorough` at `deep` on a research task (5 named branches, each with several specific
sub-questions requiring the "2+ corroborating sources or 1 authoritative one" bar from `SKILL.md`), on an
account with almost the full 5-hour usage window unused. Mid-run, the session hit its hard usage limit
outright — the transcript's own text reads `You've hit your session limit · resets 10:30pm
(Europe/Madrid)`, repeated across several follow-up turns.

## Measured facts (from the session's own transcripts and subagent logs)

- **Dispatch shape:** 5 `investigator` branches (`agentType":"arwyl-extras:investigator"` in each
  subagent's `.meta.json`) — within the `deep` cap of ~6, not a cap breach.
- **Model:** all 5 subagents ran `claude-sonnet-5`. `investigator.md`'s `model: inherit` did not silently
  escalate to a costlier model — this was not an Opus/fast-mode surprise.
- **`effort: xhigh` confirmed live** in the actual dispatched request — resolves
  `decision-thorough-skill.md`'s open doubt ("not that this repo has verified the harness actually
  enforces them end to end").
- **Per-branch tool calls:** 14–22 `WebSearch` + 8–22 `WebFetch` + 0–6 `Read` per branch — roughly
  30–40 tool calls per branch, ~150–200 total across the 5 branches. Proportionate to each branch's
  multi-part scope, not a runaway/unbounded search loop (no branch approached anything like hundreds of
  searches on its own).
- **Token volume, summed across just the 5 investigator subagents** (orchestrator overhead not
  included): ~11.4M cache-read input tokens + ~1.12M cache-creation input tokens.
- **Wall-clock:** all 5 branches ran concurrently, first tool call to last spanning ~5 minutes
  (16:19:30–16:24:36 UTC). Parallelism compressed the wall-clock time; it did not reduce total token
  throughput — five agents doing this much work at once is still five agents' worth of tokens, just
  incurred at once instead of in sequence.
- **Plugin version:** the profile that ran this had `arwyl-extras` `0.3.1` in its plugin cache (not just
  the `0.2.2` working-copy verification `status.md` had previously recorded) — the boundary,
  covered-criterion, and source-quality prose fixes from
  `audit-2026-08-31-thorough-skill-external-techniques.md` were live for this run.

## No checkpointing — the run's work was not recoverable

Checked what each of the 5 subagents actually returned at the cutoff, and what the orchestrator actually
received. All 5 subagent transcripts end with the identical 62-character string as their final message —
`You've hit your session limit · resets 10:30pm (Europe/Madrid)` — the harness terminating every in-flight
generation the instant the account-wide limit was hit (shared across the account, so it kills the
orchestrator and all concurrent subagents at once, not just whichever happened to be mid-turn). None of
the 5 branches reached synthesis. Because `Agent` dispatches are async in this harness, the tool result the
orchestrator had already received for each was only "Async agent launched successfully" — a launch
confirmation, not a report; the real findings were to arrive later as a completion notification that never
came. The run ended with the ~150–200 searches/fetches and ~12.5M tokens already spent, but zero usable
findings delivered anywhere.

The only artifacts that survived were whatever had already been physically written to disk before the
cutoff: the step-1 checklist file and a few raw fetched HTML pages, sitting in the session's ephemeral
`/tmp` scratchpad. That is incidental — not a designed checkpoint — and it captures the plan and some raw
source dumps, not the synthesized analysis (which claims are corroborated by which sources, chased to a
root) that the bulk of the spent tokens actually paid for. A resumed session picks the conversation back
up, but the killed subagent processes do not resume — re-running `deep` on the same topic after the reset
dispatches fresh `investigator` agents that redo the same searches from scratch, at roughly the same cost
as the run that just failed. **Hitting the limit mid-`deep`/`max` does not cost the remaining budget — it
costs the entire run, and the retry after reset pays the full price again.**

## Root cause

Not a bug. The cap was respected, the model stayed on Sonnet 5, and no branch exhibited an unbounded
search loop. This is `deep`'s designed mechanical shape working as specified: up to ~6 independently
thorough `effort: xhigh` agents, each individually capable of consuming a meaningful fraction of a
session's budget on its own to satisfy the "chase to a root, 2+ corroborating sources" bar, dispatched in
parallel. The gap is not in the mechanism — it's that `SKILL.md`'s existing warning ("say plainly this
costs meaningfully more time and tool calls than a normal answer") does not convey magnitude. It reads as
"somewhat slower," not "this one dispatch can consume your entire session-based usage window." Nothing in
the shipped design was calibrated against a non-API, session-limited (5-hour window) account specifically
— `decision-thorough-skill.md`'s "reasoned bet" framing assumed the owner would judge the stakes worth an
unspecified higher cost, not that the cost could exceed the entire available budget in one dispatch.

## Verdict

Real, measured cost data where before there was only a reasoned bet. `deep` did what it was built to do;
the task given to it (a niche, multi-part research topic across 5 branches, each demanding real
corroboration) was legitimately the kind of "big enough that missing something is genuinely costly" case
the skill targets — this is not a misuse case. What's now open, not closed by this incident: whether
`SKILL.md`'s cost warning should name the session-limit risk explicitly for non-API accounts, whether the
branch caps should differ for session-limited use, whether the orchestrator should checkpoint partial
findings as branches complete rather than waiting to synthesize everything at the end (so a limit hit
loses only the not-yet-returned branches, not the whole run), and that `max` — finer branches (cap ~10-12)
*plus* a fresh `effort: xhigh` VERIFY dispatch per finding — is not "somewhat more than `deep`," it is
plausibly several times this run's cost, not merely double, with the same all-or-nothing exposure.

## Deliberation

- Reviewed live in-session, 2026-09-01, from the consumer's own local transcript and subagent JSONL logs
  (`~/.claude-profiles/second/projects/-home-trace-Projects-gym/`, not this repo's own transcripts).
- `decision-thorough-skill.md` — the decision this incident's findings apply to.
- `audit-2026-08-31-thorough-skill-evidence.md`, `audit-2026-08-31-thorough-skill-external-techniques.md`
  — the design and evidence this level was built on.
