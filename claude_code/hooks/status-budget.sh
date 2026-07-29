#!/bin/sh
# Same opt-in gate as session-start.sh: stay completely inert in projects with no knowledge/ tree,
# so an unrelated repo never gets knowledge-hygiene output just because the plugin is installed.
if [ -z "$CLAUDE_PROJECT_DIR" ] || [ ! -d "$CLAUDE_PROJECT_DIR/knowledge" ]; then
    exit 0
fi

# No python3 means no check. That is fine — this hook is advisory, and a missing interpreter must
# never surface as a hook error on an ordinary file edit. Exit clean and stay silent.
if ! command -v python3 >/dev/null 2>&1; then
    exit 0
fi

# Resolve the python script relative to this file, not to $CLAUDE_PLUGIN_ROOT. That variable is set
# when the plugin runs the hook, but NOT when a project wires this script directly from its own
# settings.json — which is how this repo dogfoods it against the working copy instead of the
# version-pinned cache. Deriving from $0 works in both cases.
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

# stdin (the PostToolUse JSON payload) is inherited by the child.
python3 "$here/status-budget.py" || exit 0
