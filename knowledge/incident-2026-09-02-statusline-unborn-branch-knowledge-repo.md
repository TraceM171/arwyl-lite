# Incident — statusline silently dropped the `knowledge:` git segment for a freshly `git init`'d repo

**Date:** 2026-09-02. Closed same day.

## What happened

Owner reported (Gym project, a split knowledge/code layout — `knowledge/` is its own repo, `project_dir`
is not) that the `knowledge:` line's git segment (branch, ahead/behind, diffstat — the split-repo case
`status.md`'s 2026-08-04 entries shipped in `0.1.18`–`0.1.20`) wasn't rendering at all, even though
`knowledge/` genuinely has its own `.git` and the running `statusline.py` (see Deliberation — resolved
to be this repo's own working copy, so no reinstall was needed to already have the split-repo logic).
Traced to: `knowledge/` had just been `git init`'d, zero commits made yet, all 43 files still untracked
("On branch master / No commits yet").

On an unborn branch, `git rev-parse --abbrev-ref HEAD` exits **128** (fatal: ambiguous argument 'HEAD')
even though it happens to still print `HEAD` to stdout. `git_status()` in `claude_code/statusline.py`
treated any nonzero exit as total failure:

```python
name = branch.stdout.strip()
if branch.returncode != 0 or not name:
    return None
```

`render_repo()` then returned `None`, `knowledge_repo_str` stayed `None`, and the `kn_str` line silently
omitted the git segment — no error, no placeholder, just absent. The read/edit-count half of the
`knowledge:` line was unaffected (it doesn't call `git_status()`), which is why the line still rendered,
just without the git part — easy to miss as "nothing's there" rather than "one segment failed."

## Fix

Fall back to `git symbolic-ref --short HEAD` when `rev-parse --abbrev-ref HEAD` fails — it resolves the
unborn-branch case (returns `master` at rc=0) without changing behavior for the two cases that already
worked: a normal branch (rev-parse succeeds first) and detached HEAD with commits (rev-parse succeeds,
returns literal `HEAD`; symbolic-ref would fail here but is never reached). Verified `git_status()`
directly against both `~/Projects/gym/knowledge` (unborn — now returns
`("master", 0, 0, 0, 0, [])` instead of `None`) and `arwyl-lite` itself (normal repo — unaffected,
`("main", 9, 1, 0, 0, [...])`), then ran the full script end-to-end against a simulated Gym payload and
confirmed the `knowledge:` line now renders `master ↑0↓0 +0-0`.

The rest of `git_status()` (diff/numstat/rev-list against `HEAD`) already degraded gracefully on an
unborn branch — those subprocess calls fail too, but the code never checked their return codes, only
parsed stdout with regex/line-splitting that defaults to 0/empty on empty output. Only the branch-name
check was a hard gate.

## Known caveat, not fixed here

The diffstat (`+ins-del`) only ever counts *tracked* file changes vs. `HEAD` — untracked files never
count toward it or toward the dirty dot, in every repo this script renders, not just unborn ones. So
Gym's `knowledge:` segment now renders, but as a clean green `master ↑0↓0 +0-0` despite 43 real untracked
files sitting there uncommitted. This is pre-existing, uniform behavior across the whole script, not
something the unborn-branch fix introduced — left as-is; revisit only if it causes a real observed
confusion (same evidence bar as `_basic.md` "Philosophy").

## Lesson

A subprocess whose stdout can be non-empty on failure needs the return-code check to be the actual
gate — `git rev-parse --abbrev-ref HEAD`'s "print `HEAD` anyway, then fail" behavior on an unborn branch
is an easy trap: `name` looks populated, but only `returncode` tells you it's not usable. Test git-status
helpers against a repo state actually confirmed live in the field (freshly initialized, zero commits),
not just against already-seeded repos like the one this project itself runs in.

## Deliberation

- `claude_code/statusline.py::git_status()` — the fixed function.
- Bumped `arwyl-lite` `0.1.25` → `0.1.26` (`decision-versioning.md`) for the plugin's own shipped
  artifact/marketplace cache — but on this machine the fix was live immediately regardless: the global
  `statusLine` command (`~/.claude/settings.json`) runs `~/.claude/statusline.py`, which is a symlink
  straight to `claude_code/statusline.py` in this repo's own working copy, not a plugin-cache path.
  Confirmed the same file is what gym's session executes too (one global `statusLine` setting, not
  per-project). A different install (marketplace-cache-only, no dev symlink) would need the version
  bump plus a reinstall to pick this up.
- Prior split-repo statusline work this segment belongs to: the 2026-08-04 entries in `status.md`.
