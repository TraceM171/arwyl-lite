#!/usr/bin/env bash
# Stop hook: safety-net sweep for anything capture-secret.sh left behind.
# Independent of the skill's own instructed cleanup step, same rationale as
# arwyl-lite's decision-mechanism-over-prose.md — a cleanup step that only
# happens if remembered is not a control. Silent: no output expected by the
# harness for this hook, this only ever deletes stale local scratch files.
set -euo pipefail

for dir in /dev/shm/arwyl-secrets "${TMPDIR:-/tmp}"/arwyl-secrets.*; do
    [ -d "$dir" ] || continue
    find "$dir" -type f -mmin +10 -print0 2>/dev/null | while IFS= read -r -d '' f; do
        if command -v shred >/dev/null 2>&1; then
            shred -u "$f" 2>/dev/null || rm -f "$f"
        else
            rm -f "$f"
        fi
    done
done

exit 0
