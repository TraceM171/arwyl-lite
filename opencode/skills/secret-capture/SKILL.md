---
name: secret-capture
description: Capture a brand-new secret (a freshly rotated or generated credential) directly from the user via a native OS dialog, so the value never enters this conversation. Use when a task needs a secret that doesn't already exist anywhere you can read it from — never ask the user to paste a secret into chat, and never type one into a tool-call argument yourself.
---

# Secret Capture Skill

## The problem this solves

Every tool call you make — a bash command string, a file-write's content, even an answer you type into
an ask-the-user tool — is transcript. There is no tool-call-safe way for a brand-new secret (one that
doesn't already exist in a file you can decrypt or reference) to reach you directly. This skill launches a
native OS dialog that the user types into; the value is written straight to a scratch file and you only
ever see a file path and a byte count.

**This is not the tool for reading an existing secret** (a live credential already decrypted somewhere,
a value already in an encrypted file). That's a different, already-solved problem — decrypt to a scratch
file and reference it by path, the same file-indirection discipline this skill's output should also get
downstream. Reach for this skill only when the value has never been written down anywhere you can reach.

## What's actually proven

Tested end-to-end only on Linux with a live X11/Wayland session (`zenity`). The macOS path (`osascript`)
and Windows path are dispatch code, not verified — treat their success as unconfirmed until someone
actually reports one working. On any platform, if there's no display server or no supported dialog tool,
the script refuses cleanly (a labelled failure, not a hang) — when that happens, fall back to the fully
manual protocol: tell the user to write the value themselves, out-of-band, in their own terminal/editor,
and say "done" when finished. Never offer to accept the value pasted into chat as a fallback.

OpenCode has its own permission system (`ask`/`allow`/`deny`, per tool and pattern) rather than Claude
Code's auto-mode classifier. Whether a particular OpenCode permission configuration could deny this
skill's bash call the way Claude Code's classifier was once observed to categorically block it is not
confirmed either way — if a run is denied, treat it as a configuration question to raise with the user,
not something to route around.

## Workflow

### 1. Invoke the capture script

This skill's own directory is shown above as "Base directory for this skill" — the script lives two
levels up from there, under `scripts/`. If the skill directory is
`.../opencode/skills/secret-capture`, the script is at `.../opencode/scripts/capture-secret.sh`.

Run it as an ordinary, synchronous bash call — **do not background it and do not poll for a result file.**
Confirmed live: OpenCode's bash tool tolerates at least ~90 seconds of foreground execution with no
timeout, truncation, or forced backgrounding
(`knowledge/audit-2026-09-11-opencode-bash-async-and-atref-test.md`), and the script's own internal
timeout (`ARWYL_SECRET_CAPTURE_TIMEOUT`, default 180s) already bounds how long the call can take — there
is nothing for a background-and-wait pattern to buy you here that the plain call doesn't already give you.

```
sh <skill-root>/scripts/capture-secret.sh "<what to paste, e.g. 'JuiceFS object storage key'>" "<why it's needed, e.g. 'rotating the compromised key after the 07-31 incident'>"
```

Make both arguments specific enough that the user can tell at a glance, without needing to check back with
you, exactly what value goes in the field and why you're asking for it right now — not "a secret" / "for
the task." A vague label defeats the point of showing it in the dialog at all.

Tell the user, in your own words, that a dialog should appear on their screen and to check for it if
they don't notice one immediately (it can land on an inactive workspace or fail to steal focus).

### 2. Read the result — one line, never the file

The bash call's own output is always exactly one line, and it never contains the secret itself:

- `CAPTURED path=<path> bytes=<N>` — success. Extract `<path>`.
- `CANCELLED: ...` — the user closed or cancelled the dialog. Ask what they'd like to do instead; don't retry silently in a loop.
- `TIMEOUT after <N>s, ...` — nobody answered in time. Same as cancelled: check in with the user.
- `NO_DISPLAY: ...` or `UNSUPPORTED: ...` — the mechanism isn't available here. Fall back to the manual protocol (above) — don't retry, don't offer chat-paste.
- **A tool-call denial from OpenCode's own permission system** — you won't get one of the lines above at
  all; the bash call itself comes back denied. Don't retry the same or a differently-shaped invocation —
  stop and tell the user plainly that this needs a permission-configuration change, or fall back to the
  manual protocol (above) if they'd rather not change it.

**Never call `read`, `cat`, or any other content-inspecting tool on the captured path.** The only thing
you're ever allowed to know about its contents is the byte count from step 1.

### 3. Use it by file-path indirection only

Reference `<path>` in downstream commands exactly the way an already-decrypted secret would be handled —
`--env-file`, a tool that reads a path argument, `sops` piping, a `sed` invocation redirecting from the
file. Never `cat` it, never embed its content as a literal command argument, never let any command whose
output you'll read echo the file's contents back. If you ever see what looks like the captured value
appear in a tool result anyway, stop immediately and tell the user — don't continue the task and don't
try to reason about whether it's "probably fine."

### 4. Clean up — every time, including on failure

Once the value is no longer needed (the task that consumed it is done, or it failed partway and you're
abandoning it), delete it:

```
sh <skill-root>/scripts/cleanup-secret.sh <path>
```

This is a mandatory last step, not an optional tidy-up — do it even if the task using the secret failed.
**Unlike the Claude Code version of this skill, there is no background sweep hook on OpenCode yet** (see
`knowledge/phases.md`'s Phase 3 — deferred, not confirmed buildable) — this explicit step is the *only*
cleanup that happens. Treat it as more load-bearing here, not less.

## Important notes

- One capture call gets you one value. Ask again for a second secret rather than trying to batch multiple values through one dialog.
- Both arguments become dialog text the user reads before typing anything — see step 1's specificity guidance.
- If the user pastes a secret into chat unprompted, that's already transcript and rotation is the only real fix — don't pretend this skill can retroactively help; say so plainly.
