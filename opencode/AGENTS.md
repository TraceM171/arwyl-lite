# Project AGENTS.md

Agent entry point for this project. Defines the mandatory reads and the consultation contract for the knowledge tree.

## Mandatory reads

These files must be read in full, every session, before doing anything else:

- `knowledge/_basic.md` — project index (subdirectory map, key decisions, philosophy)
- `knowledge/.local/_basic.md` — owner-specific context (environment, accounts, collab rules)
- `knowledge/status.md` — current deployment/project state

**How this reaches you:** OpenCode loads this file natively as your project's `AGENTS.md` (or the global `~/.config/opencode/AGENTS.md`) — there is no hook, no character cap, no separate inlining step. The three knowledge files above are deliberately *not* pasted into this file the same way: `status.md` only grows, and a large file dropped into an always-loaded rules file can silently dominate context for no reason. So this file only points at them — read them yourself, in full, with your read tool, before doing anything else. If you don't actually see their content already in this conversation at the start of a session, don't assume it was preloaded — read it yourself.

**Transitive rule:** if any mandatory file above, or any file subsequently opened, explicitly marks another file as "always read" or "mandatory", treat that file as mandatory too and read it before acting. The mandatory set is a closure — follow it at runtime, do not wait to be told. (Example: `knowledge/.local/_basic.md` says "Always read `collab.md`" — so `collab.md` is mandatory by transitivity and must be read on the first turn.)

## Proactive consultation (read as needed)

Beyond the mandatory set, consult the rest of the knowledge tree **before acting, not after**. When a task touches a domain:

1. `status.md` is already mandatory reading (above) — but if the task touches the running system and it's been a while since you last looked at it this session (long conversation, resumed session, anything that could have pushed it out of view), re-open it. It is the snapshot of what is deployed, in flight, and recently changed. Stale assumptions about the system are the most common mistake.
2. Open the domain's `_basic.md` next (e.g. `knowledge/services/_basic.md`, `knowledge/security/_basic.md`, `knowledge/operations/_basic.md`) — it tells you what the domain contains and the recommended read order inside it.
3. Read the specific model / pattern / audit files in that domain that the task touches.
4. Cross-reference anything linked from the mandatory reads and from any `_basic.md` you open — links are routing hints, not optional. This includes a cross-cutting decision (cost, security, a preference) that governs the task from *outside* its own domain: follow that specific pointer rather than assuming it's someone else's concern.
5. Use the `knowledge-org` skill only when adding, moving, or restructuring knowledge files — not on every interaction.

Do not wait to be asked. If a relevant file exists, open it — err toward opening it. The cost of a quick read is lower than the cost of acting on a stale assumption.

## Use real file tools for knowledge, not raw shell redirection

Read knowledge files with a proper read tool and change them with a proper edit/write tool — avoid `cat`/`sed`/`head` for content and shell redirection (`>`, `sed -i`) to write, even in an auto-run session. A large file like `status.md` can truncate silently in raw shell output in a way a dedicated read call won't.

## Capture as you go

Update the knowledge tree inline, while working — the moment a fact is confirmed (not a still-moving guess; see the `knowledge-org` skill's "A moving conclusion is not yet a status fact"), a decision is made, or a stale value is caught, write it into the right file immediately (per the `knowledge-org` skill). For a cross-cutting constraint or preference, also leave a pointer where it will be *found* — the guaranteed-read index and/or the task sites it governs — not just where it belongs; see the `knowledge-org` skill's "Place for retrieval, not just for kind". Do not batch learnings up for a later `reflect` pass by default. `reflect` exists as an end-of-session catch-all for whatever slipped through, not as the primary capture mechanism — a `reflect` run that finds little or nothing to add because everything was already written down live is the expected outcome, not a sign it was skipped.

**Live capture writes small.** A fact confirmed mid-task gets a one-line `status.md` entry (what changed + a link) and, separately, a direct edit to the per-X file's current-state content if that's where the fact actually lives — not a multi-paragraph write-up duplicated into both. If the finding is incident-grade (something was broken, here's the root cause and the fix), it earns its own dated audit file immediately, mid-session, same as it would at `reflect` time — don't park the full narrative in `status.md` as a stand-in for the audit file you didn't feel like creating yet. See the `knowledge-org` skill's "Recent-changes entries are pointers, not records."

## Memory discipline — knowledge system only

**Never use a harness's own memory/persistence features to remember project facts.** This includes any built-in memory tool, auto-managed memory sidecar file, or other tool-level persistence layer the harness offers. They fragment context, drift from the source of truth, and bypass the org rules.

The knowledge tree (`knowledge/**`, governed by the `knowledge-org` skill's rules) is the single source of truth. Anything worth remembering across sessions — facts, decisions, preferences, conventions, environment quirks, deployment state — goes into the appropriate knowledge file using the six kinds, the per-X convention, and the domain structure. Do not write a sidecar memory file, do not call a memory tool, do not duplicate facts into a tool-managed store. If a memory feature offers to record something, write it into the knowledge tree instead and ignore the offer.

## Editing knowledge — the `knowledge-org` skill is mandatory reading first

**Read the knowledge-organization rules in full before any edit to the knowledge tree, by invoking the `knowledge-org` skill.** Mandatory, not optional. It loads the same rules every time, regardless of whether this project uses the project-local or global copy of the skill.

Triggers (any of these means you must read the rules first):

- Adding a new file
- Moving, renaming, or deleting a file
- Restructuring a domain (split, merge, promote top-level → domain, etc.)
- Changing the kind of a file (e.g. promoting status content into a model)
- Appending a substantial new entry to an existing file — a new incident write-up, a new gotcha, a multi-line narrative, a growing Open/backlog entry. (A single-value edit — bumping a version, flipping a flag, fixing a typo — does not require a re-read.) This is the trigger most often missed: editing an *existing* file doesn't look like "adding" or "restructuring," but a paragraph-sized addition is exactly where duplication and kind-mixing creep in.

Why hard: the rules (six kinds, per-X convention, no top-level cruft, no duplication, models contain no state/history/rationale/recipes) keep the tree navigable as it grows. Guessing produces drift; drift eventually forces a full rewrite.

Quick reminder (still read the full rules before editing):

- Files are one of six kinds: **index** / **status** / **model** / **decision** / **audit** / **pattern**.
- New files go into a domain subdirectory. Do not add top-level files.
- The per-X convention: one file per running service, integration, environment, etc.
- `.local/` is owner-specific. Test: *would a different owner of the same project need this?* If yes, it is not local.
- Model files contain no dates, state, history, rationale, recipes, or open questions — link instead.
- **A choice still in force is a decision, not an audit.** `decision-<topic>.md` in the domain it governs — living, edited in place; holds the current why + rejected alternatives. Dated audits hold the deliberation, frozen. Writing a dated file to correct a fact in an older one means that fact belongs in a decision/model file.
- Status lives only in `status.md`; entries ≤300 chars ending in a link, newest first. Audits are dated, append-only. Patterns are recipes, not design.
- Link, do not restate. If a fact appears in two files, one of them is wrong.
- Open/backlog entries are pointers too — ordered or cross-domain work goes in `phases.md`/`<domain>/plan.md`, not inline.
