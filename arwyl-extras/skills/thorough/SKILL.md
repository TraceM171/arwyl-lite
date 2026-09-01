---
name: thorough
description: Do a big task — research, an implementation plan, a review or analysis in any domain — without missing anything, at a level a single agent working from a "be thorough" prompt reliably doesn't reach. Not domain-specific: a codebase investigation, a feature-implementation plan that must strictly follow existing patterns/architecture, a non-technical review (diet, finances, a document, anything), a debugging investigation. Not for reviewing a code diff/PR — use /code-review, which has its own effort levels. Three levels — standard (default), deep, max — trading cost for breadth and depth; deep/max also take a speed (fast/regular/slow) controlling dispatch concurrency. Use when the user says "thoroughly", "extremely thorough", "leave no stone unturned", "don't miss any detail", "check every X", "exhaustive", or names a level explicitly ("thorough at max", "deep thorough review of X"); also use to resume an interrupted deep/max run ("resume the investigation", "continue the thorough run", "pick up where we left off").
---

# Thorough Skill

Use this skill when the user wants a big task done with real breadth *and* depth — not a confident-sounding pass that stopped at the first plausible answer or the first thing that came to mind. It targets two separate failure shapes: **breadth** (parts of the task never got looked at) and **depth** (a part got looked at, but only its surface). Both need to be handled; fixing one does not fix the other. It is deliberately not scoped to any one domain or output shape — the deliverable follows from the task: a findings report, an implementation plan, an analysis with recommendations, whatever the ask actually calls for.

Not for reviewing a code diff or PR — `/code-review` is the specialized tool for that, with its own low/medium/high/xhigh/max/ultra ladder. This skill is for everything else that's big enough that missing something is genuinely costly: research questions, a feature-implementation plan that must strictly follow a codebase's existing patterns and architecture, system/config audits, "how does X actually work," debugging investigations, or a review/analysis with no code involved at all (diet, finances, a document, a decision).

## When Invoked

The user names this skill, or asks for something done thoroughly/exhaustively/without missing detail — in any domain, producing whatever kind of output the task calls for (not just a report). Also invoked to resume an interrupted `deep`/`max` run — "resume the investigation", "continue the thorough run", "pick up where we left off" — see "Resuming an interrupted run" below.

## Levels

Determine the level before doing anything else, and state which one you're running — never leave it silently guessed:

- An explicit level word wins: "standard"/"quick"/"normal" → `standard`; "deep"/"deeper"/"deep dive"/"very thorough" → `deep`; "max"/"maximum"/"extremely thorough"/"exhaustive"/"leave nothing out"/"leave no stone unturned"/"full depth" → `max`.
- For `deep`/`max`, also determine **speed** — how many `investigator` branches may be outstanding at once — before starting, and state it alongside the level: an explicit word wins ("fast"/"quickly"/"all at once" → `fast`; "slow"/"one at a time"/"carefully" → `slow`); no explicit word → default `regular`. `standard` has no subagents to schedule, so it never takes a speed word — ignore one if given.
- Plain "thoroughly" / "thorough" with no intensifier and no explicit level → this is what makes the skill load at all, not a level choice on its own. Default to `standard`. Loading the skill and picking a level are separate decisions — don't let the word that triggered the load also silently pick `deep`.
- No level named → default to `standard`.
- For `deep`/`max`: say plainly, before starting, the level and speed running, that this costs meaningfully more time and tool calls than a normal answer, that a checkpoint file will be written into the project's own working directory (not the ephemeral scratchpad) so completed branches survive an interruption, and how much an interruption could lose at the chosen speed — at most one branch at `slow`, up to about half the branch cap at `regular`, up to the whole cap at `fast`. A line, not a blocking question.

**Only `standard`'s enumerate-first step is backed by an observed failure** — a real session where a pass skipped straight into ad-hoc coverage instead of listing the surface first, caught by the user, fixed, and the fix held on one retest (`knowledge/decision-thorough-skill.md`, `knowledge/audit-2026-08-31-thorough-skill-evidence.md`). `deep` and `max` — the fan-out and verification machinery — are a reasoned bet for cases where the stakes justify the cost, not something the evidence independently confirmed fixes anything. Say so if asked.

## Workflow

### 1. Enumerate the task's surface — all levels, before anything else

Write the actual surface to a checklist in a real file, not just a mental plan: every sub-question, area, dimension, or requirement the task actually has, whatever the domain — files and patterns to inventory for an implementation plan, nutritional dimensions for a diet review, sub-questions for a research task. Bias toward more, narrower items over few broad ones — a checklist item should be scoped small enough that "fully covered" is achievable. This is the breadth fix, and it is the one step every level shares because it's the one the evidence is actually about.

**Where the checklist file lives, and what it tracks, depends on the level.** `standard` runs single-handed in one continuous pass with nothing to protect against an interruption spanning it — the harness's own per-session scratchpad is fine, and there's nothing to track beyond the checklist items themselves. `deep`/`max` dispatch through `investigator` subagents and need to survive an interruption — most concretely, a session usage-limit hit once killed every in-flight branch in a real run with zero findings saved (`arwyl-lite`'s knowledge tree, `incident-2026-09-01-thorough-deep-session-limit.md`) — so for `deep`/`max`, disclosed to the user up front per the pre-flight line in "Levels" above, not a silent side effect:

- Write the checklist to a plainly-named durable file in the project's own working directory (e.g. `thorough-checklist-<topic>.md` at the project root), not `/tmp` or another ephemeral path. This is a working checkpoint, distinct from step 4's offered persistence into the knowledge tree.
- At the top of that file, record this run's manifest: the current session ID (read it with `echo $CLAUDE_CODE_SESSION_ID`) and the project's working directory — both needed to locate this run's subagent transcripts later if it's ever resumed from a different session (see "Resuming an interrupted run" below).
- Per branch (once decomposed in step 2b/2c), track: a branch id, its scope and boundary, status (`pending` → `launched` → `finished`), and its `investigator` agent ID once dispatched. Once `finished`, its checkpointed findings go inline in this same file.

Before starting, check whether that file already exists with branches marked done from an earlier, interrupted attempt on the same task — if so, go to "Resuming an interrupted run" instead of starting over.

**For every item, note its boundary against its neighbors** — what it does *not* cover, because that's a different item's job. At `deep`/`max` this boundary line is what stops two branches from independently redoing the same work; without it, "narrow scope" alone doesn't prevent overlap (a real, observed failure in Anthropic's own multi-agent research system — two subagents duplicated work because their briefs named a topic but not a boundary).

**Define "covered" concretely, not as a per-item judgment call:** an item counts as covered when it has 2+ independent corroborating sources, or 1 source clear enough to be authoritative on its own (a primary doc, the actual code/config, a food label, not a summary of it) — and when continuing to look has stopped surfacing anything new. Stop at that point, not at the first plausible-sounding answer, and not by continuing to search past the point where nothing new turns up either. For a question with one ground-truth source directly readable (the actual code/config the task is about), that single source satisfies the bar on its own — the 2+ rule is for claims resting on secondary, external, or otherwise not-directly-verifiable sources, not a demand to corroborate a primary source against itself.

### 2a. `standard` — work it yourself

Go through the checklist item by item, single-handed. For each: gather evidence, cite it (`file:line` / URL / command output) against the "covered" bar from step 1, and — this is the depth half, and there's no subagent to carry it for you at this level — don't stop at the first plausible finding. If it points somewhere further (a cross-reference, a "why" behind a value, a dependency), follow it before marking the item done. Mark each item covered, or explicitly flag what couldn't be resolved rather than guessing.

### 2b. `deep` — fan out for breadth, narrow scope for depth

Group the checklist into up to ~6 branches (combine related items rather than dropping any if there are more). For each branch, when it's dispatched: brief it with its own narrow scope, its boundary against neighboring branches from step 1 (state plainly what is *out of scope*, that's another branch's job), and no narrative about what you expect it to find, so it isn't primed toward a conclusion. The `investigator` agent (`arwyl-extras/agents/investigator.md`) carries the same "chase it to a root, don't stop at the surface" discipline as step 2a, but now within a scope narrow enough that it's actually achievable per branch. Record each branch's agent ID and mark it `launched` in the manifest the moment it's dispatched.

**Checkpoint every branch's findings the moment its completion notification arrives — this is the actual safety mechanism, independent of speed.** Confirmed live: this harness delivers an independent completion notification per agent even when several are dispatched together — a fast test branch notified at ~3.5s and a slow one dispatched in the same batch notified separately at ~52s, not jointly. A batched dispatch does *not* inherently expose every branch for the whole run; what exposes a branch is only that its own notification hasn't arrived and been processed yet, and all dispatches in this harness are asynchronous regardless of speed — exposure is about how many are outstanding at once, not about sync vs. async transport. Also confirmed live: a completion notification can fire more than once for the same dispatch, and an early one is not always the real result — a test branch reported `status: completed` with an interim status message before a second, later notification carried the actual answer. Before checkpointing a notification's content as a branch's finished report, check that it actually reads like one (cites evidence against the branch's scope, isn't a mid-task status update); if it doesn't, treat the branch as still running rather than marking it done. The instant a branch's notification checks out: append its findings to the checklist file and mark it `finished`, *before* doing anything else — including before dispatching another branch.

**Speed controls how many branches may be simultaneously outstanding (dispatched but not yet `finished`) — a real speed/exposure tradeoff, not a correctness one:**

- **`fast`** — dispatch all branches together, in one message with multiple `Agent` calls. Fastest wall-clock; an interruption can lose up to the whole branch cap's worth of work if it lands before any notifications have been processed and checkpointed.
- **`regular`** (default) — keep up to `ceil(cap/2)` branches outstanding at once (3 of `deep`'s 6, for example) in a sliding window: the moment any outstanding branch is checkpointed, immediately dispatch the next not-yet-dispatched branch, keeping the window full until the checklist is exhausted. Not batched waves — continuous refill.
- **`slow`** — one branch outstanding at a time: dispatch it, wait for its checkpointed notification, only then dispatch the next. Slowest, but an interruption can lose at most one branch's work.

Merge reports without editing their claims.

### 2c. `max` — finer branches, then verify, same speed lever

Same as `deep` but decompose to smaller, more numerous branches (cap ~10-12), combining related items rather than dropping any if the checklist is larger than the cap — run excess branches through the same speed-governed dispatch rather than silently skipping them. Narrower scope buys more achievable depth per branch.

After merging, run a verification round: for each finding (or the highest-stakes subset if volume is large), dispatch a fresh `investigator` in **VERIFY** mode against that finding plus its citation — governed by the same speed lever and the same checkpoint-on-verified-notification pattern as discovery, recording each grade into the checklist file as it comes back rather than batching the whole verify round. Grade each **CONFIRMED** / **UNCONFIRMED** — a finding that fails verification is reported as UNCONFIRMED, never silently dropped and never silently upgraded.

If a branch or the run as a whole hits its cap before every item clears the "covered" bar from step 1, say so explicitly rather than presenting the partial result as complete — a capped run that reads like a finished one is worse than one that names its own limit.

### 3. Synthesize — coverage first, then the actual deliverable

Lead with the checklist itself: what was covered, what turned up nothing, what couldn't be resolved. State the level and speed that ran. This ordering is deliberate: it's what makes the breadth and depth actually demonstrable to the reader instead of merely asserted.

Then produce whatever the task actually needed — this is not always a findings list:

- A research or review task → findings, each with its citation and (at `max`) its CONFIRMED/UNCONFIRMED grade.
- An implementation-planning task → an actual plan: the concrete steps, referencing the specific existing patterns/files/conventions found and why each step follows them — not a restatement of the checklist as if it were the answer.
- A non-technical analysis (diet, finances, a document, a decision) → the findings plus concrete recommendations, not just a list of what was checked.

Match the shape to the ask. Producing a checklist-shaped report when the task asked for a plan is itself a form of not finishing the job.

### 4. Offer persistence (optional)

If a `knowledge/` tree exists in this project, offer to write the work up per its own conventions — a dated `audit-<topic>.md` for a research/review-shaped task, a `plan.md`/`phases.md` for an implementation plan per `KNOWLEDGE_ORG.md`'s plan rules (invoke `knowledge-org` if writing either). If no knowledge tree exists, or the task isn't about this project at all, just deliver the output — this skill doesn't require a knowledge tree.

## Resuming an interrupted run

Only relevant to `deep`/`max`, and only when a checklist file from an earlier, interrupted attempt already exists (per step 1). **State plainly that resume is best-effort and newer/less-proven than the rest of this skill** — if an attempt doesn't cleanly produce a real continuation, fall back to a fresh dispatch for that branch rather than trust a broken one.

### Same session resumed

The checklist file and its manifest are reachable (already in context, or read from disk). For every branch still `pending` or `launched` (not `finished`):

- **`launched`**: `SendMessage` its recorded agent ID, asking it to report its current status and findings from memory, without redoing any work. If a real report comes back (the same finished-report check from step 2b), checkpoint it and mark `finished`. If the send fails, or the reply doesn't read like a coherent continuation of that branch's scope, fall back to dispatching a fresh `investigator` for that branch instead.
- **`pending`**: dispatch it normally, per the speed lever currently in force.

### A different session — the user says there's an interrupted run to pick up

1. Locate the checklist file (the user names it, or it's discoverable in the project's working directory) and read its manifest: the origin session ID, the project directory, and each branch's status/agent ID.
2. For every branch not yet `finished` (`pending` or `launched`):
   - If **`launched`**: locate the origin session's subagent transcripts at `~/.claude/projects/{sanitized-project-path}/{origin-session-id}/subagents/`, and copy that branch's `agent-{agentId}.jsonl` (and `agent-{agentId}.meta.json`, if present) into *this* session's own subagents directory — `~/.claude/projects/{sanitized-project-path}/$CLAUDE_CODE_SESSION_ID/subagents/`, creating it if needed. **Confirmed live**: a fresh session can `SendMessage` an agent ID this way and resume it from its own stored transcript, with full history retained, even though it never dispatched that agent itself — tested end to end on a real (if small) transcript, at negligible cost. Not yet verified at the scale of a real multi-thousand-line `investigator` branch, or against a transcript that was cut off specifically by a usage-limit hit rather than a clean completion — treat it as likely to work, not guaranteed to.
   - `SendMessage` the (now-local) agent ID, asking it to report its status and findings from memory without redoing work. If a real report comes back, checkpoint it and mark `finished`.
   - **If the copy-and-resume attempt fails, or the reply doesn't read like a coherent continuation of that branch's actual scope**, fall back: dispatch a *fresh* `investigator` for that branch, whose dispatch prompt states plainly that a predecessor's research transcript for this exact branch exists at the origin path (give the literal path) and instructs it to Read that file itself first, and continue or verify from what's there rather than repeating searches already done. No extraction or filtering step needed on the orchestrator's side — the fresh agent's own Read/Bash access and judgment do that.
   - If **`pending`**: dispatch it normally.
3. Continue the run — checkpointing, speed lever, synthesis — exactly as if this session had run it from the start.

## Important Notes

- `deep` and `max` cost real time and tokens; reserve them for cases where missing something is genuinely costly, not every question that mentions "thorough."
- The `investigator` subagent is read-only and never invoked directly by a user — only this skill dispatches it, and only at `deep`/`max`.
- `deep`/`max` checkpoint every branch into the checklist file the moment its notification arrives (and reads like a real report, not an interim status message) — this is the actual safety mechanism, and it holds at every speed. The speed lever (`fast`/`regular`/`slow`, default `regular`) only controls how many branches are simultaneously exposed to an interruption; see `decision-thorough-skill.md` before changing the defaults.
- An interrupted `deep`/`max` run can be resumed, same-session or from a different session — see "Resuming an interrupted run" above. Cross-session resume is newer and less proven than the rest of this skill; treat it as best-effort, with a fresh-dispatch fallback always available.
- This skill never implements anything itself, even when the deliverable is a plan for implementation. It researches, plans, or analyzes, and reports; any actual edit, build, or purchase is a separate, explicit follow-up the user decides on.
