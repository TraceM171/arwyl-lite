# Audit — evidence review for a proposed thorough-task skill (2026-08-31)

Frozen record of a review run at the owner's request, to check whether a proposed new plugin
mechanism — a leveled skill for `arwyl-extras` that does a big task (research, planning, review, any
domain) without missing anything, prompted by a recurring impression that a single agent under-delivers
on explicit thoroughness requests — was backed by anything
more than that impression, before shipping it. Read-only search across the owner's local Claude Code
session transcripts (`~/.claude/projects/*/*.jsonl`, 108 files across the owner's projects, not just
this repo), run as a background subagent in two passes: a narrow first pass, then a widened second
pass after the first came back thinner than expected.

## Method

Grep across transcripts for genuine user-authored requests for extreme thoroughness (excluding skill
boilerplate and system-reminder text), then read the surrounding context of each hit to judge whether
the following work enumerated a checklist up front or went ad-hoc, and whether it visibly fell short —
a user follow-up correcting a miss, or a redo whose own commit message names what the first pass
skipped.

## Findings

**One clear, concrete failure** — the field-test consumer's project, a config-audit pass (2026-08-05):
the assistant went straight into ad-hoc coverage of whatever the previous stage had surfaced, with no
upfront enumeration step. The owner's own correction: *"What i expect is first you do an exhaustive
list of things to configure... and then give me the configuration sites."* The redo's own commit
message names the gap directly: *"the part the first pass skipped."* The fix applied afterward was
prose-only — an instruction added to the field-test consumer's own `knowledge/operations/per-app-pass.md`
— no mechanism, no artifact, no checklist file.

**The prose fix held on its one retest.** Five days later, the same corrected per-app-pass methodology
was applied to a different app in the same project. That pass explicitly invoked the corrected
methodology and pulled the settings list from the app's own config schema rather than "whatever the
previous stage surfaced," contrasting itself against the earlier failure in its own working notes. No
further per-app pass of the same shape was found to test a third occurrence.

**One counter-instance, TheScriv project:** a single agent, given an explicit scope (a named commit
range, 52 files) and explicit permission to take its time under a strict-reviewer framing, produced a
cited gap list with no visible follow-up complaint in the rest of that transcript. A single
well-briefed agent was not the bottleneck here.

**Zero corroborating failures** elsewhere in the corpus — the remaining transcripts across sandbox,
Llave, CV, and the rest of the field-test consumer's and TheScriv's own histories turned up no second
independent instance of either an unenumerated investigation or a shallow one.

## Verdict

Real evidence, but **N=1** for the actual failure, with the one available retest of the prose fix
coming back clean and one independent case where a single agent performed adequately with no mechanism
at all. This does not clear this repo's own bar for a mandatory mechanism
(`decision-mechanism-over-prose.md`: observed **read-then-violated, repeatedly**) — it is a single
occurrence, not a pattern. It is enough to justify a **preventive, honestly-labeled** addition, the
same class as `decision-retrievability.md`, not a validated one. See `decision-thorough-skill.md`
for the resulting scope call: the one piece directly tied to the confirmed failure — enumerate the
surface before searching — ships as the default behavior; heavier fan-out/verification machinery ships
too, at the owner's explicit request for a high-stakes option, but gated behind opt-in levels and
labeled as a reasoned bet rather than a confirmed fix.

## Deliberation

- Reviewed live in-session, 2026-08-31, via two background search passes over local session
  transcripts (narrow, then widened after the first pass's N=1 result was judged too thin to act on
  without a second look).
- References the field-test consumer's project only for the shape of the evidence, not by name — per
  this tree's existing convention for that private project (`.local/_basic.md`). TheScriv is named
  directly, consistent with `audit-2026-08-29-field-study-thescriv.md`.
