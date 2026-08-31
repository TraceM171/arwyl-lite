# Audit — external technique research for the `thorough` skill (2026-08-31)

Frozen record of a web research pass, run the same day the skill first shipped (as `investigate`,
same-day rescoped and renamed to `thorough` — see `decision-thorough-skill.md`), to check the design
against how the wider industry and Anthropic's own published work handle depth/breadth in agentic work
generally — not just the one local transcript instance `audit-2026-08-31-thorough-skill-evidence.md`
found. Read-only web research via a background subagent (WebSearch/WebFetch).

## Findings

**Anthropic's own multi-agent research system** (`anthropic.com/engineering/multi-agent-research-system`,
cross-checked against a third-party summary) is the closest public precedent, built inside the same
product family this skill ships in. Two of its named production failure modes map directly onto gaps in
our shipped design:

- **Branch overlap.** An early production run had two subagents independently duplicate research on the
  same sub-topic because their dispatch briefs named an objective but not a boundary against neighboring
  branches. Our `deep`/`max` fan-out had "narrow scope" but nothing stopping the same overlap.
- **Unbounded/low-quality search.** Subagents observed "scouring the web endlessly for nonexistent
  sources" and preferring SEO-optimized content over authoritative sources. `investigator.md` had no
  guidance against either.

Anthropic's published effort-scaling bands — 1 agent / 3–10 calls for simple fact-finding, 2–4
subagents / 10–15 calls for comparisons, 10+ subagents for complex research — sit close to this skill's
`deep` (~6 branches) and `max` (~10-12 branches) caps: corroboration for the existing numbers, not a
reason to change them.

**Sufficiency/stopping criteria.** Independent of Anthropic's writeup, general deep-research analysis and
at least one peer-reviewed source converge on a similar answer: an item counts as researched when it has
2+ independent corroborating sources (or one clearly authoritative primary source), and when continued
searching stops surfacing anything new — not at the first plausible-sounding answer. This closes a real
gap: the shipped skill defined "the checklist is covered" as the finish line, but never defined what makes
one *item* covered, leaving it an unstated per-run judgment call.

**Self-consistency / multi-voter verification.** Well-validated in the literature for constrained,
comparable outputs, but the same literature is explicit that it does not transfer cleanly to open-ended
findings that can't be cleanly voted on. A real shipped precedent for a multi-voter panel already exists
in this Claude Code install (`claude-security`'s `scan-verifier.md`, three voters per refutation lens,
found during this skill's original design pass) — genuine outside support for the *idea* of a panel, but
not evidence that our specific single-item finding-verification task needs one yet.

**Checked and correctly not adopted:** multi-agent debate rounds (real effect size in the literature, but
recent work traces the gain to model/reasoning *diversity* — a poor fit for one `investigator` type on one
model, and added complexity against this project's trim-v1 discipline) and Chain-of-Verification's
draft→verify-questions→independent-recheck→revise structure (already what the shipped VERIFY mode does in
substance — corroboration, not a new mechanism).

## Verdict

Three concrete fixes applied same-day to the shipped skill: explicit per-item boundaries carried into
`deep`/`max` dispatch briefs (closes the overlap gap), an explicit "covered" bar — 2+ sources or one
authoritative one, stop at exhausted novelty — applied at every level, with explicit partial-marking on a
capped/unresolved item instead of reporting it as done, and source-quality + "permission to conclude not
found" guidance added to `investigator.md`. The `deep`/`max` branch caps are unchanged, now with external
corroboration. A multi-voter verification panel for `max` is explicitly *not* built — named instead as a
future-upgrade trigger in `decision-thorough-skill.md`, conditioned on a real `max` run actually
showing single-verifier false positives or negatives, not spawned speculatively from this research alone.

## Deliberation

- Reviewed live in-session, 2026-08-31, via a background research subagent, same day as
  `audit-2026-08-31-thorough-skill-evidence.md` (the local-transcript evidence this skill was
  originally built on).
- `decision-thorough-skill.md` — the living decision this audit's findings were applied to.
