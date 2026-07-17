---
name: field-study
description: Study how the arwyl system behaves in a real consumer project (like sanctum) to find gaps to fix in THIS repo. Call with a target project path, plus optional focus areas. Use when the maintainer says "field study", "field review", or asks to analyze how arwyl is working in a consumer. Internal to this repo — never shipped in the plugin.
---

# Field Study Skill (internal to this repo)

Use when the maintainer wants to study how the arwyl system is *behaving* in a real third-party consumer project — its knowledge tree, its recent `reflect`/`curate` runs, its agent sessions — and turn what's found into concrete improvements to **this** repo.

This is the skill behind the "sanctum field review" that produced most of arwyl's rules, and behind synthetic studies like `knowledge/audit-2026-07-retrievability-burial-test.md`. It generalizes that work so it can be pointed at any consumer.

## What this is, and what it is NOT

- **IS:** a maintainer-side, **read-only** investigation of a consumer, whose output is *candidate changes to this repo* (`claude_code/KNOWLEDGE_ORG.md`, `claude_code/AGENTS.md`, the skills, the hook, the status line).
- **IS NOT `reflect`/`curate`.** Those are consumer-side maintenance a consumer runs on its *own* tree. This skill never maintains the consumer — drift in the consumer is **evidence about the system**, not something to fix.
- **IS NOT part of the plugin.** It lives in this repo's `.claude/skills/` and studies consumers; it is never shipped to them, so it may freely reference this repo's own files.

## The one question that matters: consumer error, or system gap?

Every finding gets classified. A consumer doing something wrong is only interesting if the *system* led them to it, or failed to catch it. The test — the same one the org rules use — is: **would a different consumer on the same arwyl version hit this too?**

- **Yes → system gap →** a candidate change to this repo. This is the gold.
- **No** (this owner's one-off choice, unrelated to the system) → note it briefly, move on.

A gap is only a gap *relative to the current design*. Before calling something a gap, confirm the consumer is on a recent arwyl version and the current rules don't already address it — an old consumer reproducing an already-fixed issue is not a new finding.

## Inputs (from the invocation arguments)

- **Required — target project path**: the first argument is the consumer to study (e.g. the sanctum repo). If it's missing, ask for it before doing anything else.
- **Optional — focus areas**: any remaining text is specific concerns to deep-dive *in addition to* the general pass, e.g. "the user feels `curate` isn't catching mega-files" or "`reflect` seems to drop preferences". Treat each as a **hypothesis to investigate with evidence**, not a conclusion to confirm.

## Workflow

### 1. Orient on the current system (this repo)

You are judging the consumer against what arwyl prescribes *today*. Load, from this repo:

- `claude_code/KNOWLEDGE_ORG.md`, `claude_code/AGENTS.md`, and the skill files (`reflect.md`, `curate.md`, `handoff.md`) — the rules and workflows the consumer's agents were meant to follow.
- `knowledge/status.md` and `knowledge/decision-*.md` — the current design decisions and their rationale, so you don't re-flag something already decided or re-open a settled choice.

### 2. Establish the consumer's baseline

- **Which arwyl version is it running?** Use behavioural evidence, not `installed_plugins.json` (unreliable — see `knowledge/stack.md`): the `_curated.md` marker format, the `/plugin` UI, version-discriminating behaviour in its output.
- **When did it last `reflect`/`curate`?** (`_curated.md` timestamp; git log of its `knowledge/`.)
- **Which model runs its `reflect`/`curate`?** (Typically a Sonnet-class model for `reflect`, an Opus-class one for `curate` — see `stack.md`.) This shapes both the behaviour to expect and the kind of fix that works — a concrete checklist for the weaker/frequent case, a judgment call for the stronger/rare one.
- Sketch the shape of its `knowledge/` tree: domains, file count, which kinds are present.

### 3. Gather evidence (read-only; get cold eyes)

**Reviewing is weakest when you are primed** (see `curate`'s "needs fresh eyes"). If you helped build this consumer's knowledge, or the tree is large, delegate the evidence-gathering read to a subagent given *no* narrative about the consumer — it reads what is on disk, not what you remember or hoped you wrote. Then diagnose its findings yourself.

Draw from as many of these as exist:

**a. Tree health as a system signal.** Run the `curate` audit dimensions over the consumer's tree — kind purity, duplication, mega-files, `status.md` budget, decisions reachable only through a chain of dated audits, `_basic.md` coverage, stale content, retrievability of cross-cutting constraints. **Do not fix anything.** Here each violation is a data point: heavy or repeated drift of one kind means the system is not preventing it in practice — so *which rule was supposed to, and why didn't it?*

**b. What recent `reflect`/`curate` runs actually did.** Read the consumer's `knowledge/` git history. Did `reflect` capture the right things and file them in the right kind and home? Did it miss things the session clearly produced? Did `curate` genuinely clean, or rubber-stamp its own session's writes (the self-review failure)? Correction-chains, misfiles, a decision with no living home, a `status.md` entry grown into a paragraph — trace each back to the rule that should have caught it.

**c. Agent behaviour in session transcripts** (the richest source, when available). This is where sanctum's reviews found the sharpest rules — agents making failed direct-read attempts for a file that only exists in the plugin cache (16 in one review), acting on a stale `status.md` assumption, or batching learnings instead of capturing live. Look for: instructions that did not produce the intended behaviour, tool calls wasted, files that should have been read and weren't, the consultation contract ignored.

**d. The focus areas** from the arguments. Investigate each with evidence. If the real logs neither confirm nor deny a suspected gap, say so plainly — and consider a synthetic test (step 5) rather than guessing.

### 4. Diagnose and classify each finding

- **Evidence** — concrete and cited: a file, a commit, a transcript excerpt. No "it seems like".
- **Classification** — consumer error / **system gap** / needs-more-evidence.
- For a system gap: **which file in this repo owns it**, and *why the current wording or mechanism failed to prevent it*.
- **Honesty discipline** (from `knowledge/audit-2026-07-retrievability-burial-test.md`): an observed, repeated failure is strong evidence; a single occurrence, or a plausible-but-unseen worry, is weak. Do not promote a hypothesis to a gap. The project's bar is evidence-first (`knowledge/_basic.md`) — a rule change wants a real failure behind it.

### 5. When real evidence is inconclusive: a synthetic test

If a gap is *suspected* but the consumer's real logs don't settle it, reproduce it synthetically — the method already recorded in `knowledge/audit-2026-07-retrievability-burial-test.md`:

- Build the **minimal conditions** that would trigger it (a small synthetic tree, a seeded input).
- **Pre-register a rubric**, and plant a distinctive shibboleth so a "pass" is measurable, not interpretable after the fact.
- Use **cold subagents** as stand-in fresh sessions — you are contaminated the moment you know what you're testing, so you cannot be the fresh session yourself.
- **Asymmetry:** a reproduced failure is decisive; a non-reproduction is weak (the test was probably too easy) — report which one you actually got, and don't let a pass read as "the system is fine".
- Seed throwaway scaffolding with a cheap model; simulate the user sessions with a Sonnet-class model (the common day-to-day one).

### 6. Report — oriented to improving THIS repo

Produce a findings report, ranked by **confidence × breadth** (how many consumers a fix would help):

- **Confirmed system gaps** — evidence, the owning file here, and a proposed change (rule / skill / doc / hook / status line) concrete enough to act on.
- **Suspected gaps** — what to run (a synthetic test, or more log-reading) to confirm *before* writing any rule.
- **Consumer-side notes** — drift that is the consumer's own to fix; mention it for the maintainer to relay, but this skill does not fix it.
- **What's working** — briefly. A rule demonstrably doing its job is worth knowing too, and guards against "fixing" something that isn't broken.

Do **not** auto-apply changes to this repo. Surface findings and proposals; the maintainer decides what earns a rule, often after a confirming test. If a finding warrants a change, suggest capturing the study itself as a dated `audit-*.md` here and the resulting choice as a `decision-*.md` — the same audit + decision pairing this skill's own worked example used.

## Boundaries

- **Read-only on the consumer.** Never edit, commit, `reflect`, or `curate` the consumer's tree. Editing it both oversteps (that is the consumer's own maintenance) and destroys the evidence you came to study.
- **No auto-changes to this repo.** Findings and proposals only; the maintainer applies them.
- **Evidence over speculation.** Cite it or test it. Do not infer a gap from a single data point or a feeling — that is exactly the speculative-rule failure the project's evidence-first bar exists to prevent.
