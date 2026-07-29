#!/usr/bin/env python3
"""PostToolUse check: flag over-budget knowledge/status.md "recent changes" entries.

Why this exists as a hook rather than a rule. The entry budget is stated in KNOWLEDGE_ORG.md, in
AGENTS.md (inlined into every session), and in both skills — and a field study of a real consumer
found it violated in 7 of 7 sessions examined, every time by a writer that had invoked the
knowledge-org skill *earlier in the same session*. The rule reaches the writer and is still missed,
because the write happens under task pressure a hundred-plus turns after the reading. More prose is
the intervention already shown not to work; feedback at the moment of the write is not.

Deliberately advisory. It reports; it never blocks and never edits. A false positive costs the
agent one line of output to dismiss, so the failure mode of being wrong here is cheap — which is
what makes it safe to run on every status.md write.
"""
import json
import os
import re
import sys

# Character budget for one "recent changes" entry, whitespace-collapsed. Characters, not lines:
# hard-wrapped markdown makes a line count mean different things to writer and reviewer, so every
# pass re-litigates it. Calibrated against a real 96-entry status.md: well-formed entries ran
# 74-272 chars, entries a reflect pass had to trim ran 321-439 — an empty gap, with 300 in it.
# Consumers who want a different bar can set ARWYL_STATUS_ENTRY_BUDGET.
DEFAULT_BUDGET = 300
MAX_REPORTED = 5

HEADING_RE = re.compile(r"^#{1,6}\s+(.*)$")
RECENT_RE = re.compile(r"recent\s+changes", re.IGNORECASE)


def budget():
    raw = os.environ.get("ARWYL_STATUS_ENTRY_BUDGET", "")
    try:
        value = int(raw)
        return value if value > 0 else DEFAULT_BUDGET
    except (TypeError, ValueError):
        return DEFAULT_BUDGET


def recent_changes_block(text):
    """Return the lines under the first 'Recent changes' heading, up to the next heading."""
    lines = text.splitlines()
    start = None
    level = 0
    for i, line in enumerate(lines):
        m = HEADING_RE.match(line)
        if m and RECENT_RE.search(m.group(1)):
            start = i + 1
            level = len(line) - len(line.lstrip("#"))
            break
    if start is None:
        return []
    out = []
    for line in lines[start:]:
        m = HEADING_RE.match(line)
        if m and (len(line) - len(line.lstrip("#"))) <= level:
            break
        out.append(line)
    return out


def entries(block):
    """Split the block into top-level bullets. A new entry starts at any line beginning at column 0
    with a list marker; everything after it belongs to that entry.

    A blank line does NOT end an entry. The worst-offender shape is exactly the paragraph-style
    entry — bullet, blank line, indented narrative — so treating a blank as a terminator would drop
    the narrative and under-count the very entries this check exists to catch. Trailing blank lines
    are stripped when the entry is flattened, so they cost nothing.
    """
    found = []
    current = None
    for line in block:
        if re.match(r"^[-*+]\s+", line):
            if current is not None:
                found.append(current)
            current = [line]
        elif current is not None:
            current.append(line)
    if current is not None:
        found.append(current)
    return [" ".join(part.strip() for part in e if part.strip()) for e in found]


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return

    tool_input = payload.get("tool_input") or {}
    path = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
    if not path:
        return

    normalized = os.path.normpath(path).replace(os.sep, "/")
    if not normalized.endswith("knowledge/status.md"):
        return

    try:
        with open(path, encoding="utf-8") as handle:
            text = handle.read()
    except OSError:
        return

    limit = budget()
    over = [e for e in entries(recent_changes_block(text)) if len(e) > limit]
    if not over:
        return

    over.sort(key=len, reverse=True)
    shown = over[:MAX_REPORTED]
    bullets = "\n".join(
        "  - {} chars: {}...".format(len(e), e[:70].rstrip()) for e in shown
    )
    more = ""
    if len(over) > len(shown):
        more = "\n  (+{} more over budget)".format(len(over) - len(shown))

    message = (
        "knowledge/status.md: {} 'recent changes' entr{} over the {}-character budget "
        "(KNOWLEDGE_ORG.md, 'Recent-changes entries are pointers, not records').\n"
        "{}{}\n"
        "If one of these is an entry you just wrote: trim it to what changed + a link, and move the "
        "narrative to its real home (a dated audit/incident file, a decision-<topic>.md, or the "
        "per-X file). Pre-existing over-budget entries are not this write's problem — leave them "
        "for a reflect or curate pass."
    ).format(
        len(over),
        "y is" if len(over) == 1 else "ies are",
        limit,
        bullets,
        more,
    )

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": message,
        }
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never let a knowledge-hygiene check interrupt real work.
        pass
