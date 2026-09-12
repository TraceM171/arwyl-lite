#!/usr/bin/env bash
# Captures a secret from the human via a native OS dialog. The value is
# redirected straight to a file — it never touches this script's own
# stdout/stderr, which is the one channel a caller's tool-call result can
# see. Only a file path and byte count are ever printed.
#
# Usage: capture-secret.sh "<what to paste>" "<why it's needed>"
# Exit codes: 0 captured, 1 cancelled, 2 timed out, 3 no display server,
# 4 no supported dialog tool found for this platform.
set -uo pipefail

WHAT="${1:-a secret}"
WHY="${2:-no reason given}"
TIMEOUT_SECS="${ARWYL_SECRET_CAPTURE_TIMEOUT:-180}"

# Both values are attacker-uncontrolled (Claude-authored, not raw user input),
# but escape anyway so an embedded quote can't break the dialog tool's own
# argument boundary or, worse, an AppleScript string literal.
escape_dq() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
WHAT_ESC="$(escape_dq "$WHAT")"
WHY_ESC="$(escape_dq "$WHY")"

if [ -d /dev/shm ] && [ -w /dev/shm ]; then
    OUT_DIR="/dev/shm/arwyl-secrets"
else
    OUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/arwyl-secrets.XXXXXXXX")"
fi
mkdir -p "$OUT_DIR"
chmod 700 "$OUT_DIR"
OUT_FILE="$(mktemp "$OUT_DIR/secret.XXXXXXXX")"
chmod 600 "$OUT_FILE"

# Backstop: any exit — success path disables this explicitly below — cleans
# up the scratch file, so no code path (including one not anticipated here)
# can leave a captured value behind on disk.
trap 'rm -f "$OUT_FILE" "$OUT_FILE.tmp" 2>/dev/null' EXIT

fail() {
    echo "$1"
    exit "$2"
}

have() { command -v "$1" >/dev/null 2>&1; }

run_with_timeout() {
    if have timeout; then
        timeout "${TIMEOUT_SECS}s" "$@"
    else
        "$@"
    fi
}

capture_linux() {
    local rc=0
    if [ -z "${DISPLAY:-}" ] && [ -z "${WAYLAND_DISPLAY:-}" ]; then
        return 3
    fi
    if have zenity; then
        # zenity --password only accepts --password/--username and silently
        # ignores --text (no error) — it always shows its own fixed "Type
        # your password" template. --entry --hide-text is the dialog type
        # that actually renders custom --text while still masking input.
        run_with_timeout zenity --entry --hide-text \
            --title="Claude Code needs a secret" \
            --text="Please paste: ${WHAT_ESC}

Why: ${WHY_ESC}

This value is written directly to disk; Claude never sees it." \
            >"$OUT_FILE" 2>/dev/null || rc=$?
        return "$rc"
    fi
    if have kdialog; then
        run_with_timeout kdialog --password "Please paste: ${WHAT_ESC}
Why: ${WHY_ESC}" \
            >"$OUT_FILE" 2>/dev/null || rc=$?
        return "$rc"
    fi
    return 4
}

capture_macos() {
    local rc=0
    have osascript || return 4
    run_with_timeout osascript \
        -e "display dialog \"Please paste: ${WHAT_ESC} — Why: ${WHY_ESC}\" default answer \"\" with hidden answer with title \"Claude Code needs a secret\"" \
        -e "text returned of result" \
        >"$OUT_FILE" 2>/dev/null || rc=$?
    return "$rc"
}

capture_windows() {
    # Not yet verified against a real Windows session.
    return 4
}

rc=0
case "$(uname -s)" in
    Linux) capture_linux || rc=$? ;;
    Darwin) capture_macos || rc=$? ;;
    MINGW*|MSYS*|CYGWIN*) capture_windows || rc=$? ;;
    *) rc=4 ;;
esac

case "$rc" in
    124) fail "TIMEOUT after ${TIMEOUT_SECS}s, no value captured" 2 ;;
    3)   fail "NO_DISPLAY: no display server detected — fall back to the manual out-of-band protocol" 3 ;;
    4)   fail "UNSUPPORTED: no supported dialog tool found on this platform — fall back to the manual out-of-band protocol" 4 ;;
esac

if [ "$rc" -ne 0 ] || [ ! -s "$OUT_FILE" ]; then
    fail "CANCELLED: no value captured (dialog closed or cancelled)" 1
fi

# Strip a trailing newline some dialog tools append to their output.
printf '%s' "$(cat "$OUT_FILE")" >"$OUT_FILE.tmp" && mv "$OUT_FILE.tmp" "$OUT_FILE"
chmod 600 "$OUT_FILE"

BYTES=$(wc -c <"$OUT_FILE" | tr -d ' ')
trap - EXIT
echo "CAPTURED path=${OUT_FILE} bytes=${BYTES}"
