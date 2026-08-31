---
name: thorough
description: Do a big task — research, an implementation plan, a review or analysis in any domain — without missing anything, at a level a single agent working from a "be thorough" prompt reliably doesn't reach. Not domain-specific: a codebase investigation, a feature-implementation plan that must strictly follow existing patterns/architecture, a non-technical review (diet, finances, a document, anything), a debugging investigation. Not for reviewing a code diff/PR — use /code-review, which has its own effort levels. Three levels — standard (default), deep, max — trading cost for breadth and depth. Use when the user says "thoroughly", "extremely thorough", "leave no stone unturned", "don't miss any detail", "check every X", "exhaustive", or names a level explicitly ("thorough at max", "deep thorough review of X").
---

# Thorough Skill

Use this skill when the user wants a big task done with real breadth *and* depth — not a confident-sounding pass that stopped at the first plausible answer or the first thing that came to mind. It targets two separate failure shapes: **breadth** (parts of the task never got looked at) and **depth** (a part got looked at, but only its surface). Both need to be handled; fixing one does not fix the other. It is deliberately not scoped to any one domain or output shape — the deliverable follows from the task: a findings report, an implementation plan, an analysis with recommendations, whatever the ask actually calls for.

Not for reviewing a code diff or PR — `/code-review` is the specialized tool for that, with its own low/medium/high/xhigh/max/ultra ladder. This skill is for everything else that's big enough that missing something is genuinely costly: research questions, a feature-implementation plan that must strictly follow a codebase's existing patterns and architecture, system/config audits, "how does X actually work," debugging investigations, or a review/analysis with no code involved at all (diet, finances, a document, a decision).

## When Invoked

The user names this skill, or asks for something done thoroughly/exhaustively/without missing detail — in any domain, producing whatever kind of output the task calls for (not just a report).

## Levels

Determine the level before doing anything else, and state which one you're running — never leave it silently guessed:

- An explicit level word wins: "standard"/"quick"/"normal" → `standard`; "deep"/"deeper"/"deep dive"/"very thorough" → `deep`; "max"/"maximum"/"extremely thorough"/"exhaustive"/"leave nothing out"/"leave no stone unturned"/"full depth" → `max`.
- Plain "thoroughly" / "thorough" with no intensifier and no explicit level → this is what makes the skill load at all, not a level choice on its own. Default to `standard`. Loading the skill and picking a level are separate decisions — don't let the word that triggered the load also silently pick `deep`.
- No level named → default to `standard`.
- For `deep`/`max`: say plainly, before starting, that this costs meaningfully more time and tool calls than a normal answer. A line, not a blocking question.

**Only `standard`'s enumerate-first step is backed by an observed failure** — a real session where a pass skipped straight into ad-hoc coverage instead of listing the surface first, caught by the user, fixed, and the fix held on one retest (`knowledge/decision-thorough-skill.md`, `knowledge/audit-2026-08-31-thorough-skill-evidence.md`). `deep` and `max` — the fan-out and verification machinery — are a reasoned bet for cases where the stakes justify the cost, not something the evidence independently confirmed fixes anything. Say so if asked.

## Workflow

### 1. Enumerate the task's surface — all levels, before anything else

Write the actual surface to a checklist in a real file (scratchpad), not just a mental plan: every sub-question, area, dimension, or requirement the task actually has, whatever the domain — files and patterns to inventory for an implementation plan, nutritional dimensions for a diet review, sub-questions for a research task. Bias toward more, narrower items over few broad ones — a checklist item should be scoped small enough that "fully covered" is achievable. This is the breadth fix, and it is the one step every level shares because it's the one the evidence is actually about.

**For every item, note its boundary against its neighbors** — what it does *not* cover, because that's a different item's job. At `deep`/`max` this boundary line is what stops two parallel branches from independently redoing the same work; without it, "narrow scope" alone doesn't prevent overlap (a real, observed failure in Anthropic's own multi-agent research system — two subagents duplicated work because their briefs named a topic but not a boundary).

**Define "covered" concretely, not as a per-item judgment call:** an item counts as covered when it has 2+ independent corroborating sources, or 1 source clear enough to be authoritative on its own (a primary doc, the actual code/config, a food label, not a summary of it) — and when continuing to look has stopped surfacing anything new. Stop at that point, not at the first plausible-sounding answer, and not by continuing to search past the point where nothing new turns up either. For a question with one ground-truth source directly readable (the actual code/config the task is about), that single source satisfies the bar on its own — the 2+ rule is for claims resting on secondary, external, or otherwise not-directly-verifiable sources, not a demand to corroborate a primary source against itself.

### 2a. `standard` — work it yourself

Go through the checklist item by item, single-handed. For each: gather evidence, cite it (`file:line` / URL / command output) against the "covered" bar from step 1, and — this is the depth half, and there's no subagent to carry it for you at this level — don't stop at the first plausible finding. If it points somewhere further (a cross-reference, a "why" behind a value, a dependency), follow it before marking the item done. Mark each item covered, or explicitly flag what couldn't be resolved rather than guessing.

### 2b. `deep` — fan out for breadth, narrow scope for depth

Group the checklist into up to ~6 branches (combine related items rather than dropping any if there are more). Dispatch one `investigator` subagent per branch, **in parallel** — a single message with multiple Agent calls, not sequential — each briefed with its own narrow branch, its boundary against neighboring branches from step 1 (state plainly what is *out of scope*, that's another branch's job), and no narrative about what you expect it to find, so it isn't primed toward a conclusion. The `investigator` agent (`arwyl-extras/agents/investigator.md`) carries the same "chase it to a root, don't stop at the surface" discipline as step 2a, but now within a scope narrow enough that it's actually achievable per branch. Collect all reports; merge without editing their claims.

### 2c. `max` — finer branches, then verify

Same as `deep` but decompose to smaller, more numerous branches (cap ~10-12), combining related items rather than dropping any if the checklist is larger than the cap — run excess branches as a second parallel wave rather than silently skipping them. Narrower scope buys more achievable depth per branch. After merging, run a verification round: for each finding (or the highest-stakes subset if volume is large), dispatch a fresh `investigator` in **VERIFY** mode against that finding plus its citation. Grade each **CONFIRMED** / **UNCONFIRMED** — a finding that fails verification is reported as UNCONFIRMED, never silently dropped and never silently upgraded.

If a branch or the run as a whole hits its cap before every item clears the "covered" bar from step 1, say so explicitly rather than presenting the partial result as complete — a capped run that reads like a finished one is worse than one that names its own limit.

### 3. Synthesize — coverage first, then the actual deliverable

Lead with the checklist itself: what was covered, what turned up nothing, what couldn't be resolved. State the level that ran. This ordering is deliberate: it's what makes the breadth and depth actually demonstrable to the reader instead of merely asserted.

Then produce whatever the task actually needed — this is not always a findings list:

- A research or review task → findings, each with its citation and (at `max`) its CONFIRMED/UNCONFIRMED grade.
- An implementation-planning task → an actual plan: the concrete steps, referencing the specific existing patterns/files/conventions found and why each step follows them — not a restatement of the checklist as if it were the answer.
- A non-technical analysis (diet, finances, a document, a decision) → the findings plus concrete recommendations, not just a list of what was checked.

Match the shape to the ask. Producing a checklist-shaped report when the task asked for a plan is itself a form of not finishing the job.

### 4. Offer persistence (optional)

If a `knowledge/` tree exists in this project, offer to write the work up per its own conventions — a dated `audit-<topic>.md` for a research/review-shaped task, a `plan.md`/`phases.md` for an implementation plan per `KNOWLEDGE_ORG.md`'s plan rules (invoke `knowledge-org` if writing either). If no knowledge tree exists, or the task isn't about this project at all, just deliver the output — this skill doesn't require a knowledge tree.

## Important Notes

- `deep` and `max` cost real time and tokens; reserve them for cases where missing something is genuinely costly, not every question that mentions "thorough."
- The `investigator` subagent is read-only and never invoked directly by a user — only this skill dispatches it, and only at `deep`/`max`.
- This skill never implements anything itself, even when the deliverable is a plan for implementation. It researches, plans, or analyzes, and reports; any actual edit, build, or purchase is a separate, explicit follow-up the user decides on.
