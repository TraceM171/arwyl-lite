---
name: curate
description: Perform a thorough, whole-tree audit and cleanup of the knowledge base, restructuring it if needed to conform to KNOWLEDGE_ORG.md. Use when the user says "curate" or asks for a deep knowledge cleanup/audit — typically after many reflect runs have left the knowledge tree degraded. Run much less often than reflect; expect it to take longer since it is a thorough pass over the entire tree, not an incremental update.
---

# Curate Skill

Use this skill when the user says "curate" or asks for a deep cleanup, audit, or restructure of the knowledge base. Curate is reflect's big brother: reflect appends one session's learnings incrementally; curate re-examines everything already in the tree and brings it back into line with `KNOWLEDGE_ORG.md`, restructuring where needed.

## When Invoked

The user wants a thorough top-to-bottom review of the entire knowledge tree, not just recent changes. This is typically requested after many `reflect` runs have accumulated drift: duplicated facts, misplaced files, stale status masquerading as model content, mega-files, missing `_basic.md`s, broken kind boundaries, and similar rot. Curate has authority to fully restructure the tree when the current shape no longer fits, per the "Restructuring" section of `KNOWLEDGE_ORG.md`.

This is a heavier operation than reflect: expect to read every file in the tree, not skim it. The audit's value comes from careful judgment on ambiguous classification calls, not speed.

### Curate needs the strongest model available

**You cannot change your own model once this skill is running** — by the time you are reading this, the session's model is fixed. So this is not an instruction to "prefer a stronger model"; it is an instruction to *tell the user* which one you are on, the same way the fresh-eyes check offers them a deferral.

Before starting, name the model you are running on. If it is not the strongest one the harness offers, say so and offer to defer:

> *"I'm running on `<model>`. Curate leans on judgment for the ambiguous classification calls that are its whole point. Want me to run it now anyway, or restart on a stronger model?"*

Ask; don't refuse. A pass on a weaker model beats no pass — but the user should get to make that trade knowingly, and should know which one ran when they read the report. Name the model in the step 8 report either way.

### Curate needs fresh eyes

**Curate is a review, and a review of your own work is the weakest kind.** If this session wrote knowledge — did the work, ran `reflect`, captured the facts — then you are the author, and you will pass your own writing. You already decided that 10-line status entry was justified when you wrote it; you will decide it again now, for the same reasons, and the pass finds nothing.

This is not hypothetical: it is the observed failure mode. A curate run at the end of a long working session reliably approves that session's own output and reports the tree clean.

So, in order of preference:

1. **Best — run curate in a fresh session.** No memory of writing any of it. If the user invokes curate at the end of a heavy session, say so and offer to defer it: *"I wrote most of today's knowledge — a curate in a fresh session will catch things I'll rationalize. Want me to run it now anyway, or next session?"* Ask; don't refuse.
2. **Next best — delegate the audit to a subagent.** If the harness has one, spawn a general-purpose agent with instructions to read `KNOWLEDGE_ORG.md` and the whole tree and report findings, and give it *no* narrative about the session. It reads what is actually on disk, not what you meant to write. Then act on its findings yourself.
3. **If auditing your own session's writes anyway** — audit them **first and hardest**. For each one ask: *"if I found this file in a tree I had never seen, would I accept it?"* Not "did I have a good reason?" — you did, and it doesn't matter. The reader will not have your reason.

Never skip curate because it might be self-review. A compromised pass beats no pass. Just name the limitation in the step 8 report.

## Workflow

### 1. Read the rules in full

**Invoke the `knowledge-org` skill.** That is how you read the rules — it is the same content, delivered by the harness, and it works regardless of how this plugin was installed. Every judgment made later in this workflow is a rule from `KNOWLEDGE_ORG.md` applied to a specific file — do not rely on memory of the rules.

Do **not** go looking for a `KNOWLEDGE_ORG.md` file on disk. On a plugin install there is no such file in the project — it lives inside the plugin's own versioned cache directory, and guessing at that path wastes tool calls on files that do not exist and risks reading a stale version. Only if the skill is genuinely unavailable (a manual install, where the repo has its own copy at a path the project's `AGENTS.md`/`CLAUDE.md` points to) do you read the file directly.

`AGENTS.md`'s rules are already in context (injected at session start when running via the plugin).

### 2. Inventory the entire tree

- `ls -R ./knowledge/` (and `./knowledge/.local/`) to get a complete file list. Do not sample — every file gets read.
- For each file, note: path, apparent kind (index / status / model / audit / pattern), size, last-modified.
- Flag anything that doesn't fit the six kinds, or that lives outside the expected `knowledge/<domain>/` shape, for step 3.

### 3. Audit each file against KNOWLEDGE_ORG.md

Read every file and check it against each rule, not just the ones that seem obviously violated:

- **Kind purity — between files** — does the file mix kinds (state in a model, a recipe in a model, rationale in a model)? Split what's mixed.
- **Kind purity — *within* a dated file.** Read each dated audit's sections and classify each one *separately*. Audits are where mixed kinds hide, because "it's the record of that work" feels like it licenses including everything about that work. It does not. Look specifically for:
  - **Live status inside an append-only file** — "as of this writing", "built, not yet deployed", "blocked on X", "remaining steps". This is the worst case: the file can never be corrected (append-only), so the claim rots permanently *and* duplicates `status.md`. Move it to `status.md`/`plan.md`, leave the audit describing only what was true on its date.
  - **Design/config description** — how the thing is built belongs in the per-X or model file. The audit records the decision and the evidence, not the resulting spec.
  - **A conclusion with no living home** — see the decision check below.
- **Decisions with no living home.** For each dated audit, ask: *does this file contain a conclusion someone would later ask "is this still true?" about?* If yes, there must be a `decision-<topic>.md` stating it currently. Two smells that mean this is broken:
  - **Correction chains** — file B exists mainly to correct a fact in file A (a price, a limit, a name), and file C reaffirms it. Collapse: the live value goes in the decision file (edited in place); A/B/C stay as dated deliberation and get linked from it. A value that is *only* readable inside a correction file is stated nowhere current.
  - **A decision reachable only by reading N dated files in order.** That is the failure the Decision kind exists to end. Create the decision file, state the current answer + current reasoning + rejected alternatives, link the audits.
- **Duplication** — does a fact appear in more than one file? Identify the canonical home (`status.md` for state, `decision-<topic>.md` for a choice in force, a dated audit for history, one model file for reference) and convert the others to links.
- **Placement** — is the file in the right domain? Is anything sitting at top level that should be inside a domain?
- **Retrievability of cross-cutting constraints** — for a budget rule, a security limit, a style/language preference, or any decision that governs work *across* domains, ask not just "is it filed under the right kind?" but "will the reader arrive here when it applies?" Check both directions, per `KNOWLEDGE_ORG.md`'s "Place for retrieval, not just for kind":
  - **Under-linked** — a cross-cutting constraint whose only home is a top-level `decision-*.md` or a `.local/` preference, with no pointer from a guaranteed-read file *and* none from the task sites it governs (`status.md` Open items, the per-X files, the domain indexes where a constrained decision will land). Correctly filed, but nobody navigates to it from the task that trips it. Add the missing pointers.
  - **Over-stuffed (the inverse)** — a guaranteed-read file (`_basic.md`, `.local/_basic.md`) that has accreted the full text of many constraints until it is too long to be read carefully, diluting the mandatory-read budget. Pull the bodies out to their proper files; leave one-line pointers. Both directions are the same failure — the mandatory files must stay short *and* the cross-cutting facts must stay reachable, and the link is what reconciles them.
- **Naming** — `kebab-case.md`; dated files are `<prefix>-YYYY-MM[-DD][-descriptor].md` with the prefix from the closed list (`audit-`/`incident-`/`deploy-`/`upgrade-`) and the **prefix before the date**; decisions are `decision-<topic>.md` with no date; no `-v2` / `-final` / `-new` suffixes. Descriptor-first names (`domain-cutover-2026-06.md`) are violations — `git mv` them.

  **The day-component check is mechanical — run it, do not apply it by eye.** The day is required only *conditionally* (`KNOWLEDGE_ORG.md`: when more than one record of that prefix can land in the same month, or when the day is itself the identifier), and a conditional rule applied by eye turns into "fix the cluster I noticed." Enumerate instead — per directory, group dated files by `prefix-YYYY-MM` and flag every group with more than one member whose names lack a day:

  ```sh
  for d in knowledge knowledge/*/ knowledge/.local/; do
    ls "$d" 2>/dev/null \
      | grep -E  '^(audit|incident|deploy|upgrade)-[0-9]{4}-[0-9]{2}' \
      | grep -vE '^(audit|incident|deploy|upgrade)-[0-9]{4}-[0-9]{2}-[0-9]{2}' \
      | grep -oE '^(audit|incident|deploy|upgrade)-[0-9]{4}-[0-9]{2}' \
      | sort | uniq -c \
      | awk -v d="$d" '$1>1 {print d": "$2" x"$1" — needs day components"}'
  done
  ```

  Fix **every** group the sweep reports, not just the largest — the one you did not notice is the one that makes the tree's naming look arbitrary to the next reader. Dates come from `git log --diff-filter=A --format=%ad --date=short -- <file> | tail -1`, not from guessing.
- **`_basic.md` coverage** — does every directory (top level, every domain, `.local/`) have one, and does it accurately list what's in the directory and the recommended read order?
- **Mega-files** — any file that can't be summarized in one sentence, or that clearly bundles unrelated topics, is a split candidate. **Do not let a file's title do the summarizing** — "AFFiNE setup" reads like one topic while the file holds a deploy recipe, an admin pattern, and a root-cause analysis. Test against the *index's own description* of the file: if the `_basic.md` entry needs "X + Y + Z" or a comma-separated list of five things to describe it, that is the split list, already written for you. Length is a hint, not the test: past ~300 lines, look harder; past ~500, assume it splits until proven otherwise.

  **This heuristic applies to *living* files only** — models, patterns, indexes, `status.md`, decisions. It does **not** apply to a closed dated record. The failure mode the mega-file rule exists to prevent is the file that *grows by appending*, and that cannot happen to an append-only file that is already closed: nothing more will be added to it. Splitting one rewrites frozen history for navigability, which the append-only rule elsewhere tells you not to do. A 700-line `deploy-2026-06-*.md` is not a defect — if it is hard to navigate, add headings. Say so explicitly in the step 8 report when you leave a large dated file alone, so the next pass does not re-litigate it from scratch.
- **Per-X convention** — collections of similar instances (services, integrations, environments) each get their own file; flag any that got merged into one. Also flag the **inverse**: two files covering the *same* instance split by kind (`services/x.md` + `operations/x-setup.md`). Per `KNOWLEDGE_ORG.md`'s "Per-X files link to recipes", the steps belong with the generic recipe they extend and the facts belong in the per-X file — a per-service shadow file is not a valid home for either.

  **Do not mistake the sanctioned shape for this violation.** `operations/add-service-affine.md` — an instance-specific *extension of `operations/add-service.md`*, holding the ordered procedure, next to `services/affine.md` holding the facts — is exactly what `KNOWLEDGE_ORG.md` prescribes, not a shadow file. The distinguishing test is not "two files mention the same instance"; it is **whether the steps file is recognizable as an extension of a generic recipe that exists**. `add-service-<x>.md` beside `add-service.md`: correct, leave it. A free-floating `<x>-setup.md` extending nothing: violation, fold it in.

  **The shadow-file prohibition is about splitting one instance *by kind* — it does not exempt an oversized per-X *model* from the mega-file check.** A 350-line per-X file whose `_basic.md` entry needs a five- or six-clause list to describe it is still a split candidate: lift the shared design up into the domain model and leave the per-X file the instance-specific residue, or at minimum flag it in step 8. "It is per-X" is not the exemption — only *closed dated record* is. Observed in the field: a pass declined to split a genuinely multi-topic 350-line per-X file by citing the shadow-file rule, which does not apply to a topic-seam split.
- **`.local/` scoping** — for **every** file in `.local/`, apply the test: would a different owner of this project need it? If yes, it's misplaced and belongs in the shared tree. Apply this to files that have been there a long time, not just recent additions — a `.local/` file that started genuinely owner-specific accretes portable content section by section (a security protocol, a safety rule, a project standard), and nobody re-runs the test on a file that "was already there". Check **section by section**, not file by file: the fix is usually to move three sections out, not the whole file.

  Check **kind purity** here too, not only portability — observed accreting across two consumers. A `.local/` preferences file where each entry has grown a dated, `file:line`-cited *"why we decided this"* narrative is mixing owner-preference (keep) with audit-kind deliberation (a frozen account of a past session). When that file is also mandatory-read, the narrative bloats a guaranteed-read file. Move the arrival-stories into a dated audit, or drop them; leave the preference plus a link. The mandatory `.local/` files stay pointer-sized, same bar as `_basic.md`.
- **Dated files** — confirm closed audits/incidents haven't been edited in place; corrections to *what happened* should be new dated files. (Corrections to a *still-true fact* are different — those belong in the decision/model file, edited in place. See the decision check above.)
- **Stale content** — status claims that no longer match reality, dead links, references to removed files or domains.
- **Resolved open questions.** A model or decision file that poses a choice ("host agent vs container — decide at build time", "TBD", "to be confirmed") when another file already records the answer. Grep the tree for `TBD`, `to be decided`, `at build time`, `vs\.`, `TODO` and check each against the per-X files and `status.md`. This is a knowledge-to-knowledge contradiction — resolvable from existing knowledge, so **fix it**, don't just flag it. It is the most common form of quiet rot: the question was answered and nobody went back.
- **`status.md` hygiene** — every "recent changes" entry is ≤300 characters and ends with a link (`KNOWLEDGE_ORG.md`'s hard budget — count it, newlines collapsed to spaces; do not eyeball line counts); entries are strictly newest-first; the Open section holds only atomic one-line pointers. Over-long entries: move the narrative to its real home and cut the entry to a line + link.
- **Open/backlog scope** — does `status.md` (or a domain's own backlog) hold an entry that has an internal order/dependency, spans more than one domain, or has grown past ~5–7 items? Per `KNOWLEDGE_ORG.md`'s "Open entries are pointers, not plans", that belongs in `phases.md`/`<domain>/plan.md`, not inline. Two more checks, from a field study where a fresh pass missed both while touching the exact files:
  - **A `<domain>/plan.md` whose scope is actually cross-domain** — its phases or driving decisions land in more than one domain → it belongs at top-level `phases.md`. Look at its outbound links: mostly-cross-domain means wrong home. The feature it delivers "belonging" to that domain is not the test.
  - **A reserved `phases.md`/`<domain>/plan.md` name holding a non-plan** — a completed build record, a closed audit. Convert it per `KNOWLEDGE_ORG.md`'s plan-completion rule (`git mv` to a dated `audit-`/`deploy-` in the owning domain; free the name). A squatting finished plan is precisely what forces the next plan to misfile.
- **Inconsistencies and contradictions** — facts that conflict across files (two files claiming different values/states for the same thing, rationale that contradicts a decision recorded elsewhere). If the existing knowledge resolves it, fix the stale side. A factcheck against the actual code/config/resource is capped at a couple of quick, targeted reads (a file or two, a command or two) per finding — not a live-system audit: no SSH sessions, no querying running services, no sweeping multiple compose files or scripts to build a picture. If confirming a suspected mismatch would take more than that, skip the check and go straight to marking it for review instead — knowledge review is the main focus, not a codebase investigation. Curate never edits code or anything outside the knowledge tree, and never silently rewrites knowledge to match what it finds in code — any mismatch a factcheck turns up between knowledge and the code gets marked in the findings list for review in step 8, never resolved in place. If a knowledge-to-knowledge contradiction can't be resolved from existing knowledge, that's a business-level fact question — add it to the findings list as a question for the user in step 8.

  **Never resolve a contradiction by writing a third fact that reconciles the two.** This is the failure mode this bullet exists to prevent, and it is not covered by "do not fabricate content to fill gaps" in step 5 — that reads as being about *empty* gaps, and it does not fire here. A contradiction has exactly two honest exits: **one side is supported by a source you have read** (fix the other side), or **neither is** (leave both, flag it in step 8). Inventing a bridge that makes both sides true is a third exit, and it is closed.

  It is worth naming because it does not feel like fabricating. It feels like *resolving* — the two facts are reconciled, the file now reads consistently, and the invented connective tissue is the least interesting part of the sentence. Observed in the field: a model file said an instance was rebuilt as a "CX22" and separately that it was "upgraded CX23→CX33". The pass wrote *"later resized CX22→CX23, then upgraded CX23→CX33"* — a resize step recorded in no file in the tree, asserted as fact in a living model, in an edit whose stated purpose was fixing a factual error. Reading the file first does not prevent this; the source was open at the time.

  **The test that does work is citation:** for any *new factual assertion* you are about to write — as opposed to a move, rename, dedup, or link — be able to quote the line that supports it. If you cannot quote it, you cannot assert it. Write the question into the step 8 findings instead and leave the contradiction standing; an unresolved contradiction the user can see beats a resolved one they cannot.

  Two clarifications, both from trials where a pass got this wrong:

  - **Deleting the inconvenient side is the same error as inventing a bridge.** Overwriting "provisioned as X" with "provisioned as Y" because a *different* file says Y — at a different point in time — is not resolving a contradiction, it is asserting an unsourced fact that happens to make the file read cleanly. Transplanting a value across a time boundary needs a citation like any other assertion.
  - **A history with an undocumented discontinuity counts as a contradiction here**, even though no two files state different values *for the same instant*. "Provisioned as X … has been on Z since the Y→Z upgrade", with nothing recording X→Y, is exactly the case this rule is for. Do not classify it as "a gap, not a contradiction" and move on — an unflagged gap is indistinguishable from a fact nobody has questioned. If you leave it standing, it goes in the step 8 findings as a question. Leaving it *and saying nothing* is not one of the two exits.

Keep a running list of findings: file, rule violated, proposed fix. This list is the basis for step 4.

### 4. Decide: patch vs. restructure

Per `KNOWLEDGE_ORG.md`'s "Restructuring" section — if the findings are a handful of local fixes (rename a file, split one mega-file, delete a duplicate), just do them. If the findings show the domain taxonomy itself no longer fits (multiple junk-drawer domains, systemic misplacement, kinds mixed everywhere), plan a restructuring.

Deciding *what* to restructure — which files move, merge, split, or get deleted — is an organization-of-knowledge call, and that decision is curate's to make on its own judgment; don't ask the user how to organize it.

**Before executing** a restructuring that moves, merges, or deletes more than a few files, summarize the plan and pause for the user's go-ahead. This isn't an organizational question (curate already decided the plan) — it's a safety checkpoint on a hard-to-reverse batch action across potentially many files: cheap to preview, expensive to redo. Small, obviously-correct fixes (fixing one filename, adding a missing `_basic.md`) don't need this pause.

### 5. Execute

- Use `git mv` for renames/moves so history is preserved, per `KNOWLEDGE_ORG.md`.
- Split mega-files along the seams identified in step 3; update the domain's `_basic.md` to list the new files.
- Merge/deduplicate: keep the fact in its canonical file, replace the others with a link.
- Create any missing `_basic.md` files.
- Do not fabricate content to fill gaps. Classification is an organization-of-knowledge call — decide it directly from `KNOWLEDGE_ORG.md` and best judgment rather than asking the user; note genuinely borderline calls in the final report (step 8) instead of stopping to ask.
- Leave closed dated audits untouched; if one contains a fact that needs correcting, open a new dated file per the append-only rule instead of editing the original.

### 6. Commit and Push the Audit (if applicable)

Same as reflect: if the knowledge directory is a separate repo, ask the user whether to commit and push the changes before finishing. If it's part of the project repo, follow the project's normal commit conventions and only commit if asked. Do **not** include `_curated.md` in this commit — the marker isn't stamped yet (step 7).

### 7. Stamp the Curate Marker

Run `date -u +%Y-%m-%dT%H:%M:%SZ` and write its output, and nothing else, to `knowledge/_curated.md` (create it if missing). Use the actual command output, not a remembered or guessed timestamp. This is a reserved marker file per `KNOWLEDGE_ORG.md` — tooling (e.g. the status line) reads it to gauge drift since the last curate pass. Do this even on a run that found nothing to fix; a clean audit still resets the drift clock.

Stamp and commit this **after** step 6's commit lands, as its own small trailing commit (same repo/push decision as step 6) — never bundled with the audit commit. The marker's timestamp has to sit strictly after everything this pass touched; if it shared a commit with the audit, or landed before it, the next drift check would immediately recount this session's own work as post-curate drift (`git log --since=<marker>` includes anything at or after that instant). A bare date had this same problem at whole-day granularity — see `status.md`; this ordering closes the narrower same-commit version of it.

**If anything under `knowledge/` changes after the marker commit lands — a late fix, a correction caught while writing the step 8 report, an answer the user gives at the end — re-stamp the marker as a new trailing commit.** The invariant is not "stamp once at step 7"; it is *the marker timestamp sits strictly after every knowledge edit this pass made*. A late edit breaks that invariant just as surely as stamping early does, and the repair is the same one-line commit. Do not skip it because the pass is "already finished" — the marker is what the next drift check trusts.

### 8. Report Summary

Report:
- What was audited (file/directory count)
- What changed structurally (splits, merges, moves, renames, deletions) — a compact list, not a diff dump
- What was left as-is and why, for anything that looked borderline
- Any open questions that need the user's call

## Important Notes

- Curate operates on the whole tree; reflect operates on the current session. Don't use curate to do reflect's job (appending new session learnings) — run reflect first if there's fresh material, then curate to clean up.
- Curate can restructure fully, but "restructure, do not patch" is not a license to reorganize a domain that's already clean — see `KNOWLEDGE_ORG.md`'s "wrong time to restructure" list.
- Curate only ever edits files under `knowledge/` (including `.local/`). It never edits code, config, or any file outside the knowledge tree — a knowledge/code mismatch gets flagged for review, not fixed on either side.
- Curate asks the user only about business-level fact questions (e.g. which of two conflicting facts is true). Organization, classification, and restructuring calls are curate's own to make from `KNOWLEDGE_ORG.md` — never ask the user how to organize. The one exception: pause for a go-ahead before executing a large-blast-radius restructuring (many files moved/merged/deleted) — that's a safety checkpoint on the action, not a question about organization.
