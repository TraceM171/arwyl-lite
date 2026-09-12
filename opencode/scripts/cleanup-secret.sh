#!/usr/bin/env bash
# Securely deletes one or more files produced by capture-secret.sh.
# Usage: cleanup-secret.sh <path> [<path> ...]
set -euo pipefail

if [ "$#" -eq 0 ]; then
    echo "usage: cleanup-secret.sh <path> [<path> ...]"
    exit 1
fi

for f in "$@"; do
    [ -e "$f" ] || continue
    case "$f" in
        /dev/shm/arwyl-secrets/*|*/arwyl-secrets.*/*) ;;
        *) echo "REFUSED: $f is outside the arwyl-secrets scratch area, not touching it"; exit 1 ;;
    esac
    if command -v shred >/dev/null 2>&1; then
        shred -u "$f"
    else
        rm -f "$f"
    fi
done

echo "CLEANED"
