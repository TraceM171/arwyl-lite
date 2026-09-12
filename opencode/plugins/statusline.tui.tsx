/** @jsxImportSource @opentui/solid */
// Real implementation (not a stub) — ports claude_code/statusline.py's git + knowledge-activity +
// reflect?/curate? nudge segments into OpenCode's `sidebar_footer` slot. Deliberately drops
// context%/model/effort/cost: OpenCode's native sidebar already shows those, and no config exists
// to hide or relocate them (opencode#6026, opencode#20145 — both closed with no toggle shipped).
// See arwyl-lite's knowledge/audit-2026-09-12-opencode-statusline-feasibility.md and
// knowledge/phases.md's Phase 4 for the design history and the live comparison against
// `app_bottom`/`session_prompt_right` that led here.
//
// Confidence notes — read before touching detection logic:
// - git shell-out (node:child_process), `api.state.session.diff()`, `api.state.vcs.branch`: each
//   confirmed live against a real opencode 1.17.8 session during this build.
// - `write`/`edit` tool-arg shape (`input.filePath`, absolute path): confirmed in Phase 2
//   (opencode/plugins/status-budget.js). The `read` tool's exact arg field name is NOT
//   independently confirmed — `toolFilePath()` below tries a few plausible shapes defensively.
// - The reflect/curate boundary-and-window logic is a direct port of statusline.py's
//   (`reflect_boundary`, `curate_windows` — see claude_code/statusline.py:387-435) onto
//   `session.messages()`/`api.state.part()` instead of raw transcript JSONL. Presence detection
//   (did a skill run, did a slash command run) is the part most likely to need a live-tested shape
//   correction — unlike the git segment, this has not yet been exercised against a real
//   reflect/curate invocation.

import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { createSignal, onCleanup, onMount, Show } from "solid-js"

type Theme = TuiPluginApi["theme"]["current"]

const REFRESH_MS = 3000
const EDIT_BUDGET_TRIGGER = 8
const TOOL_CALL_ACTIVITY_TRIGGER = 45
const ACTIVITY_MINUTES_TRIGGER = 30
const DUP_RISK_TRIGGER = 2
const CURATE_DRIFT_TRIGGER = 10
const CURATE_NO_MARKER_FILE_TRIGGER = 15

type GitStatus =
  | { ok: true; branch: string; ins: number; del: number; ahead: number; behind: number }
  | { ok: false; error: string }

// Bun's `execFileSync` does not fully suppress a failed child's stderr the way Node does by
// default — an expected failure (no upstream, not a repo) was writing raw git stderr straight to
// the real terminal and corrupting the TUI's screen, confirmed live 2026-09-12. Every git call
// below passes this explicitly rather than relying on a default.
const QUIET_STDIO = ["ignore", "pipe", "ignore"] as const

function branchName(repoPath: string): string | undefined {
  try {
    const name = execFileSync("git", ["-C", repoPath, "rev-parse", "--abbrev-ref", "HEAD"], {
      encoding: "utf8",
      stdio: QUIET_STDIO,
    }).trim()
    if (name) return name
  } catch {
    /* fall through to the unborn-branch fallback below */
  }
  // An unborn branch (freshly `git init`'d, zero commits) fails rev-parse even though HEAD
  // resolves symbolically — symbolic-ref still finds it. Ports the same fallback
  // claude_code/statusline.py's git_status already needed
  // (incident-2026-09-02-statusline-unborn-branch-knowledge-repo.md) — not carrying it over would
  // reintroduce a bug already fixed once on the Claude Code side.
  try {
    const name = execFileSync("git", ["-C", repoPath, "symbolic-ref", "--short", "HEAD"], {
      encoding: "utf8",
      stdio: QUIET_STDIO,
    }).trim()
    return name || undefined
  } catch {
    return undefined
  }
}

// Tolerant like statusline.py's git_status: only a missing branch is a real failure. Each later
// git call (diffstat, ahead/behind) fails silently to 0 — an unborn branch or a repo with no
// upstream fails those calls too, and that's normal, not an error for the whole repo.
function gitStatus(repoPath: string): GitStatus {
  const branch = branchName(repoPath)
  if (!branch) return { ok: false, error: "not a git repository" }

  let ins = 0
  let del = 0
  try {
    const shortstat = execFileSync("git", ["-C", repoPath, "diff", "--shortstat", "HEAD"], {
      encoding: "utf8",
      stdio: QUIET_STDIO,
    })
    ins = Number(shortstat.match(/(\d+) insertion/)?.[1] ?? 0)
    del = Number(shortstat.match(/(\d+) deletion/)?.[1] ?? 0)
  } catch {
    /* no HEAD commit yet — 0/0 is correct */
  }

  let ahead = 0
  let behind = 0
  try {
    const out = execFileSync(
      "git",
      ["-C", repoPath, "rev-list", "--left-right", "--count", "HEAD...@{u}"],
      { encoding: "utf8", stdio: QUIET_STDIO },
    )
      .trim()
      .split(/\s+/)
    if (out.length === 2) {
      ahead = Number(out[0]) || 0
      behind = Number(out[1]) || 0
    }
  } catch {
    /* no upstream configured — 0/0 is correct */
  }

  return { ok: true, branch, ins, del, ahead, behind }
}

// Direct port of claude_code/statusline.py's find_git_repos/_is_repo_root: if `root` itself is a
// repo, that's the only result. Otherwise scan up to `maxDepth` levels for every nested repo and
// return all of them — a project whose root isn't a repo can still have one or more repos inside
// it, each needing its own line, not a single failing placeholder for the root.
const SKIP_DIR_NAMES = new Set(["node_modules", ".venv", "venv", "__pycache__", "dist", "build", ".cache"])

function isRepoRoot(dir: string): boolean {
  return existsSync(join(dir, ".git"))
}

function findGitRepos(root: string, maxDepth = 3): string[] {
  if (!root || !existsSync(root)) return []
  if (isRepoRoot(root)) return [root]
  const repos: string[] = []
  let frontier = [root]
  for (let depth = 0; depth < maxDepth; depth++) {
    const nextFrontier: string[] = []
    for (const d of frontier) {
      let entries: string[]
      try {
        entries = readdirSync(d).sort()
      } catch {
        continue
      }
      for (const name of entries) {
        if (name.startsWith(".") || SKIP_DIR_NAMES.has(name)) continue
        const p = join(d, name)
        let isDir = false
        try {
          isDir = statSync(p).isDirectory()
        } catch {
          continue
        }
        if (!isDir) continue
        if (isRepoRoot(p)) repos.push(p)
        else nextFrontier.push(p)
      }
    }
    frontier = nextFrontier
    if (frontier.length === 0) break
  }
  return repos
}

// Per-file diffstat for the dialog's file list — statusline.py's own `git diff --numstat HEAD`
// parsing (a is/-'s'-marked line means binary, skipped).
function gitFileStats(repoPath: string): Array<{ path: string; a: number; d: number }> {
  try {
    const out = execFileSync("git", ["-C", repoPath, "diff", "--numstat", "HEAD"], {
      encoding: "utf8",
      stdio: QUIET_STDIO,
    })
    const stats: Array<{ path: string; a: number; d: number }> = []
    for (const line of out.split("\n")) {
      const parts = line.split("\t")
      if (parts.length !== 3) continue
      const [a, d, path] = parts
      if (a === "-" || d === "-") continue
      stats.push({ path, a: Number(a), d: Number(d) })
    }
    return stats
  } catch {
    return []
  }
}

// Direct port of statusline.py's git_diff_patches: `git diff HEAD -- <paths>`, split per file at
// `diff --git a/X b/Y` headers, keeping only the hunk lines (from the first `@@` on).
function gitDiffPatches(repoPath: string, paths: string[]): Record<string, string> {
  if (paths.length === 0) return {}
  let out: string
  try {
    out = execFileSync("git", ["-C", repoPath, "diff", "HEAD", "--", ...paths], {
      encoding: "utf8",
      stdio: QUIET_STDIO,
    })
  } catch {
    return {}
  }
  const patches: Record<string, string> = {}
  let currentPath: string | undefined
  let currentLines: string[] = []
  let inHunk = false
  for (const line of out.split("\n")) {
    const m = line.match(/^diff --git a\/(?:.*) b\/(.*)$/)
    if (m) {
      if (currentPath !== undefined) patches[currentPath] = currentLines.join("\n")
      currentPath = m[1]
      currentLines = []
      inHunk = false
      continue
    }
    if (line.startsWith("@@")) inHunk = true
    if (inHunk) currentLines.push(line)
  }
  if (currentPath !== undefined) patches[currentPath] = currentLines.join("\n")
  return patches
}

function truncateDiffLines(lines: string[], max = 300): string[] {
  if (lines.length <= max) return lines
  return [...lines.slice(0, max), `… truncated (${lines.length - max} more lines)`]
}

function diffLineColor(theme: Theme, line: string) {
  if (line.startsWith("@@")) return theme.diffHunkHeader
  if (line.startsWith("+") && !line.startsWith("+++")) return theme.diffAdded
  if (line.startsWith("-") && !line.startsWith("---")) return theme.diffRemoved
  return theme.diffContext
}

// Dialog frame geometry — read from arwyl-lite's own reference doc
// (../AI-setup/knowledge/plugin/opencode-plugin-api.md, "Dialog frame geometry"): panel width is a
// fixed constant per size clamped to terminalWidth-2, and there's no maxHeight, so content must be
// bounded by the plugin itself (a scrollbox) rather than relying on the dialog to clip it.
function dialogSizeFor(cols: number): "medium" | "large" | "xlarge" {
  const usable = cols - 2
  if (usable >= 116) return "xlarge"
  if (usable >= 88) return "large"
  return "medium"
}

function usableDialogRows(rows: number): number {
  return rows - Math.round(rows / 4) - 1
}

function countFilesRecursive(dir: string): number {
  let total = 0
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return 0
  }
  for (const name of entries) {
    if (name === ".git") continue
    const p = join(dir, name)
    try {
      const st = statSync(p)
      total += st.isDirectory() ? countFilesRecursive(p) : 1
    } catch {
      /* skip unreadable entries */
    }
  }
  return total
}

// See the confidence note at the top of the file: only `filePath` is confirmed (write/edit, Phase
// 2); the rest are defensive guesses for `read`'s shape, not verified.
function toolFilePath(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined
  const i = input as Record<string, unknown>
  const args = i.args as Record<string, unknown> | undefined
  const candidate = i.filePath ?? i.path ?? i.file_path ?? args?.filePath ?? args?.path
  return typeof candidate === "string" ? candidate : undefined
}

const KNOWN_FILE_TOOLS = new Set(["read", "write", "edit"])

type Activity = {
  readFiles: Set<string>
  editedFiles: Set<string>
  nonKnowledgeEdits: Set<string>
  toolCalls: number
  reflected: boolean
  editedSinceReflect: Set<string>
}

function emptyActivity(): Activity {
  return {
    readFiles: new Set(),
    editedFiles: new Set(),
    nonKnowledgeEdits: new Set(),
    toolCalls: 0,
    reflected: false,
    editedSinceReflect: new Set(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Part/Message shapes aren't fully
// typed for this use in the pinned .d.ts; matched defensively against the reference doc's
// documented shapes instead (ToolPart, TextPartInput).
function isSkillCall(part: any, name: "reflect" | "curate"): boolean {
  if (part?.type !== "tool" || part.tool !== "skill") return false
  const input = part.state?.input
  const skillName = input?.name ?? input?.skill
  if (typeof skillName !== "string") return false
  return skillName.split(":").pop() === name
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSlashCommand(part: any, name: "reflect" | "curate"): boolean {
  return (
    part?.type === "text" &&
    typeof part.text === "string" &&
    new RegExp(`^/(?:[^:\\s]+:)?${name}\\b`).test(part.text.trim())
  )
}

function computeActivity(api: TuiPluginApi, sessionId: string, knowledgeRoot: string): Activity {
  const result = emptyActivity()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let messages: readonly any[] = []
  try {
    messages = api.state.session.messages(sessionId) as readonly any[]
  } catch {
    return result
  }

  // First pass: find the reflect boundary and curate windows, mirroring statusline.py's own
  // two-pass approach (claude_code/statusline.py:387-435) — a curate pass's own edits must not
  // count as post-reflect drift.
  let reflectBoundary = -1
  let awaitingBoundary = false
  const curateWindows: Array<[number, number]> = []
  let awaitingCurateBoundary = false
  let curateWindowStart = -1
  let reflected = false

  for (let idx = 0; idx < messages.length; idx++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parts: any[] = []
    try {
      parts = api.state.part(messages[idx].id) as any[]
    } catch {
      continue
    }
    for (const part of parts) {
      const isReflectCmd = isSlashCommand(part, "reflect")
      const isCurateCmd = isSlashCommand(part, "curate")
      if (awaitingBoundary && part?.type === "text" && !isReflectCmd) {
        reflectBoundary = idx
        awaitingBoundary = false
      }
      if (awaitingCurateBoundary && part?.type === "text" && !isCurateCmd) {
        curateWindows.push([curateWindowStart, idx])
        awaitingCurateBoundary = false
      }
      if (isReflectCmd || isSkillCall(part, "reflect")) {
        reflected = true
        awaitingBoundary = true
      }
      if (isCurateCmd || isSkillCall(part, "curate")) {
        curateWindowStart = idx
        awaitingCurateBoundary = true
      }
    }
  }
  if (awaitingBoundary) reflectBoundary = messages.length
  if (awaitingCurateBoundary) curateWindows.push([curateWindowStart, messages.length])
  result.reflected = reflected

  // Second pass: tally file-tool calls against the boundary/windows found above.
  for (let idx = 0; idx < messages.length; idx++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parts: any[] = []
    try {
      parts = api.state.part(messages[idx].id) as any[]
    } catch {
      continue
    }
    for (const part of parts) {
      if (part?.type !== "tool" || part.state?.status !== "completed") continue
      const tool = String(part.tool ?? "").toLowerCase()
      if (!KNOWN_FILE_TOOLS.has(tool)) continue
      result.toolCalls++
      const fp = toolFilePath(part.state.input)
      if (!fp) continue
      if (fp.startsWith(knowledgeRoot)) {
        if (tool === "read") {
          result.readFiles.add(fp)
        } else {
          result.editedFiles.add(fp)
          const inCurateWindow = curateWindows.some(([s, e]) => s <= idx && idx <= e)
          if (idx > reflectBoundary && !inCurateWindow) result.editedSinceReflect.add(fp)
        }
      } else if (tool !== "read") {
        result.nonKnowledgeEdits.add(fp)
      }
    }
  }
  return result
}

function curateDrift(knowledgeDir: string, totalFiles: number): { changed: number; trigger: boolean } | undefined {
  const markerPath = join(knowledgeDir, "_curated.md")
  let sinceTs: string | undefined
  if (existsSync(markerPath)) {
    try {
      const content = readFileSync(markerPath, "utf8").trim()
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(content)) sinceTs = content
    } catch {
      /* treat as no marker */
    }
  }
  if (!sinceTs) return { changed: totalFiles, trigger: totalFiles >= CURATE_NO_MARKER_FILE_TRIGGER }

  let repoRoot: string
  try {
    repoRoot = execFileSync("git", ["-C", knowledgeDir, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: QUIET_STDIO,
    }).trim()
  } catch {
    return undefined
  }
  if (!repoRoot) return { changed: totalFiles, trigger: totalFiles >= CURATE_NO_MARKER_FILE_TRIGGER }

  // `path.relative(x, x)` returns `""`, unlike Python's `os.path.relpath(x, x)` which returns
  // `"."` — a real cross-language porting bug caught live 2026-09-12: when `knowledge/` is its
  // own repo, `repoRoot === knowledgeDir` and an empty pathspec makes git reject the command
  // outright ("empty string is not a valid pathspec"). `git log` wants `.` for "the whole repo".
  const pathspec = relative(repoRoot, knowledgeDir) || "."
  const markerPathspec = relative(repoRoot, markerPath)
  let markerCommit = ""
  try {
    markerCommit = execFileSync(
      "git",
      ["-C", repoRoot, "log", "-1", "--format=%H", "--", markerPathspec],
      { encoding: "utf8", stdio: QUIET_STDIO },
    ).trim()
  } catch {
    return undefined
  }
  // `<marker commit>..HEAD` when the marker is committed (exact — see the same reasoning in
  // claude_code/statusline.py's curate_signal), falling back to `--since` only when it isn't.
  const revArg = markerCommit ? `${markerCommit}..HEAD` : `--since=${sinceTs}`
  try {
    const out = execFileSync(
      "git",
      ["-C", repoRoot, "log", revArg, "--name-only", "--pretty=format:", "--", pathspec],
      { encoding: "utf8", stdio: QUIET_STDIO },
    )
    const changed = new Set(
      out
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ).size
    return { changed, trigger: changed >= CURATE_DRIFT_TRIGGER }
  } catch {
    return undefined
  }
}

type Snapshot = {
  sessionIns: number
  sessionDel: number
  repos: Array<{ label: string; path: string; status: GitStatus }>
  knowledgeRepo?: { path: string; status: GitStatus }
  knowledgeDir: string
  totalKnowledgeFiles: number
  activity: Activity
  reflectTrigger?: string
  curateTrigger: boolean
}

function computeSnapshot(api: TuiPluginApi, sessionId: string): Snapshot {
  const directory = api.state.path?.directory ?? process.cwd()
  const knowledgeDir = join(directory, "knowledge")
  const knowledgeExists = existsSync(knowledgeDir)

  let sessionIns = 0
  let sessionDel = 0
  try {
    for (const f of api.state.session.diff(sessionId)) {
      sessionIns += f.additions
      sessionDel += f.deletions
    }
  } catch {
    /* leave at 0/0 */
  }

  // Real repo discovery, not a hardcoded "project" + "knowledge" pair — see findGitRepos above.
  // `knowledge/`, if it turns up as one of the discovered repos, is pulled out and rendered
  // separately (grouped with the knowledge stats below), same as statusline.py does.
  const allRepos = findGitRepos(directory)
  const knowledgeIsRepo = allRepos.includes(knowledgeDir)
  const repos = allRepos
    .filter((r) => r !== knowledgeDir)
    .map((r) => ({ label: r === directory ? "" : relative(directory, r) + "/ ", path: r, status: gitStatus(r) }))
  const knowledgeRepo = knowledgeIsRepo ? { path: knowledgeDir, status: gitStatus(knowledgeDir) } : undefined

  const totalKnowledgeFiles = knowledgeExists ? countFilesRecursive(knowledgeDir) : 0
  const activity = knowledgeExists ? computeActivity(api, sessionId, knowledgeDir + "/") : emptyActivity()

  let session: ReturnType<TuiPluginApi["state"]["session"]["get"]>
  try {
    session = api.state.session.get(sessionId)
  } catch {
    session = undefined
  }
  const durationMin = session ? (Date.now() - session.time.created) / 60000 : 0
  const editsTrigger = activity.nonKnowledgeEdits.size >= EDIT_BUDGET_TRIGGER && activity.editedFiles.size === 0
  const activityTrigger =
    activity.toolCalls >= TOOL_CALL_ACTIVITY_TRIGGER &&
    durationMin >= ACTIVITY_MINUTES_TRIGGER &&
    activity.editedFiles.size === 0
  const noCaptureTrigger = !activity.reflected && (editsTrigger || activityTrigger)
  const dupRiskTrigger = activity.editedSinceReflect.size > DUP_RISK_TRIGGER

  let reflectTrigger: string | undefined
  if (noCaptureTrigger || dupRiskTrigger) {
    const reasons = [
      editsTrigger && !activity.reflected ? "edits" : undefined,
      activityTrigger && !activity.reflected ? "activity" : undefined,
      dupRiskTrigger ? "dirtiness" : undefined,
    ].filter((r): r is string => Boolean(r))
    reflectTrigger = reasons.join("+")
  }

  const drift = knowledgeExists ? curateDrift(knowledgeDir, totalKnowledgeFiles) : undefined
  const curateTrigger = Boolean(drift?.trigger)

  return {
    sessionIns,
    sessionDel,
    repos,
    knowledgeRepo,
    knowledgeDir,
    totalKnowledgeFiles,
    activity,
    reflectTrigger,
    curateTrigger,
  }
}

function gitDotColor(theme: Theme, g: GitStatus) {
  if (!g.ok) return theme.error
  if (g.ins || g.del) return theme.warning
  if (g.ahead || g.behind) return theme.info
  return theme.success
}

// Colored diff body — DiffBody per statusline.py's _diff_html, one <text> row per line so each
// line's color is independent (opentui text color applies per-span, not per-character-run across
// a multi-line string).
function DiffBody(props: { theme: Theme; text: string }) {
  const lines = truncateDiffLines(props.text.split("\n"))
  return (
    <box flexDirection="column" gap={0}>
      {lines.map((line) => (
        <text>
          <span style={{ fg: diffLineColor(props.theme, line) }}>{line.length ? line : " "}</span>
        </text>
      ))}
    </box>
  )
}

// Knowledge-activity dialog — the read/edited file lists from statusline.py's knowledge detail
// page. `dirty` (editedSinceReflect) gets the same "dirty" marker the Python version's dirty-badge
// used, confirmed present in the original at claude_code/statusline.py:172-176/622-625.
function KnowledgeDialogBody(props: {
  theme: Theme
  knowledgeDir: string
  readFiles: string[]
  editedFiles: string[]
  dirty: Set<string>
  rows: number
}) {
  const rel = (p: string) => relative(props.knowledgeDir, p)
  return (
    <scrollbox scrollY height={props.rows} contentOptions={{ flexDirection: "column" }}>
      <text>
        <span style={{ fg: props.theme.text }}>{"Read"}</span>
      </text>
      <Show
        when={props.readFiles.length > 0}
        fallback={
          <text>
            <span style={{ fg: props.theme.textMuted }}>{"none"}</span>
          </text>
        }
      >
        <box flexDirection="column" gap={0}>
          {props.readFiles.map((p) => (
            <text>
              <span style={{ fg: props.theme.text }}>{rel(p)}</span>
            </text>
          ))}
        </box>
      </Show>
      <text>{" "}</text>
      <text>
        <span style={{ fg: props.theme.text }}>{"Edited"}</span>
      </text>
      <Show
        when={props.editedFiles.length > 0}
        fallback={
          <text>
            <span style={{ fg: props.theme.textMuted }}>{"none"}</span>
          </text>
        }
      >
        <box flexDirection="column" gap={0}>
          {props.editedFiles.map((p) => (
            <text>
              <span style={{ fg: props.theme.text }}>{rel(p)}</span>
              <span style={{ fg: props.theme.warning }}>{props.dirty.has(p) ? "  dirty" : ""}</span>
            </text>
          ))}
        </box>
      </Show>
    </scrollbox>
  )
}

// Per-repo diff dialog — the "Changed files" page from statusline.py, real patch bodies via
// gitDiffPatches. Not built for the session-scoped diff (owner call): session.diff() only gives
// counts, and there's no clean way to attribute "what the agent touched this session" as a real
// patch the way a repo's `git diff` naturally can — the risk of a misleading diff outweighs it.
function RepoDialogBody(props: {
  theme: Theme
  files: Array<{ path: string; a: number; d: number }>
  patches: Record<string, string>
  rows: number
}) {
  // Collapsed by default, matching the original's <details>/<summary> — only the changed-files
  // list shows up front; clicking a row expands that file's own diff, not every diff at once.
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }
  return (
    <scrollbox scrollY height={props.rows} contentOptions={{ flexDirection: "column" }}>
      <Show
        when={props.files.length > 0}
        fallback={
          <text>
            <span style={{ fg: props.theme.textMuted }}>{"no changes"}</span>
          </text>
        }
      >
        <box flexDirection="column" gap={0}>
          {props.files.map((f) => (
            <box flexDirection="column" gap={0}>
              <text onMouseUp={() => toggle(f.path)}>
                <span style={{ fg: props.theme.text }}>
                  <b>{f.path}</b>
                </span>
                <span style={{ fg: props.theme.textMuted }}>{`  +${f.a} -${f.d}`}</span>
              </text>
              <Show when={expanded().has(f.path) ? props.patches[f.path] : undefined}>
                {(patch) => <DiffBody theme={props.theme} text={patch()} />}
              </Show>
            </box>
          ))}
        </box>
      </Show>
    </scrollbox>
  )
}

function Footer(props: { api: TuiPluginApi; sessionId: string }) {
  const theme = props.api.theme.current
  const [snap, setSnap] = createSignal(computeSnapshot(props.api, props.sessionId))

  onMount(() => {
    const timer = setInterval(() => setSnap(computeSnapshot(props.api, props.sessionId)), REFRESH_MS)
    onCleanup(() => clearInterval(timer))
  })

  // `snap()` is called fresh at each JSX position below (never destructured into a plain variable
  // beforehand) — Solid only tracks a signal reactively where it's read inside a JSX child/prop
  // expression; a `const s = snap()` hoisted above the JSX would freeze at the first render.
  const gitLine = (g: GitStatus, label: string, onClick?: () => void) => (
    <text onMouseUp={onClick}>
      <span style={{ fg: gitDotColor(theme, g) }}>{"●"}</span>
      <span style={{ fg: theme.textMuted }}>{" "}</span>
      <span style={{ fg: theme.textMuted }}>{label}</span>
      <span style={{ fg: theme.text }}>{g.ok ? g.branch : "?"}</span>
      <span style={{ fg: theme.textMuted }}>{" ↑"}</span>
      <span style={{ fg: theme.text }}>{g.ok ? String(g.ahead) : "?"}</span>
      <span style={{ fg: theme.textMuted }}>{"↓"}</span>
      <span style={{ fg: theme.text }}>{g.ok ? String(g.behind) : "?"}</span>
      <span style={{ fg: theme.text }}>{g.ok && (g.ins || g.del) ? ` +${g.ins}-${g.del}` : ""}</span>
    </text>
  )

  const openSized = (render: () => unknown) => {
    const cols = Number(props.api.renderer?.terminalWidth) || 120
    props.api.ui.dialog.replace(render, () => {})
    props.api.ui.dialog.setSize(dialogSizeFor(cols))
  }

  const dialogRows = () => usableDialogRows(Number(props.api.renderer?.terminalHeight) || 40)

  // Repo dialogs shell out fresh on click rather than reusing the interval-computed snapshot —
  // the click is the user asking "what's actually in there right now," not a cached 0-3s-old read.
  const openRepoDialog = (repoPath: string) => {
    const files = gitFileStats(repoPath)
    const patches = gitDiffPatches(
      repoPath,
      files.map((f) => f.path),
    )
    openSized(() => <RepoDialogBody theme={theme} files={files} patches={patches} rows={dialogRows()} />)
  }

  const openKnowledgeDialog = () => {
    const a = snap().activity
    openSized(() => (
      <KnowledgeDialogBody
        theme={theme}
        knowledgeDir={snap().knowledgeDir}
        readFiles={[...a.readFiles].sort()}
        editedFiles={[...a.editedFiles].sort()}
        dirty={a.editedSinceReflect}
        rows={dialogRows()}
      />
    ))
  }

  return (
    <box flexDirection="column" gap={0}>
      <text>
        <span style={{ fg: theme.textMuted }}>{"session "}</span>
        <span style={{ fg: theme.text }}>{`+${snap().sessionIns}-${snap().sessionDel}`}</span>
      </text>
      {snap().repos.map((r) => gitLine(r.status, r.label, () => openRepoDialog(r.path)))}
      <text>{" "}</text>
      <Show when={snap().knowledgeRepo}>
        {(kr) => gitLine(kr().status, "", () => openRepoDialog(kr().path))}
      </Show>
      <text onMouseUp={() => openKnowledgeDialog()}>
        <span style={{ fg: theme.text }}>{`${snap().activity.readFiles.size}`}</span>
        <span style={{ fg: theme.textMuted }}>{" ("}</span>
        <span style={{ fg: theme.text }}>
          {`${snap().totalKnowledgeFiles ? Math.round((snap().activity.readFiles.size / snap().totalKnowledgeFiles) * 100) : 0}%`}
        </span>
        <span style={{ fg: theme.textMuted }}>{") · "}</span>
        <span style={{ fg: theme.text }}>{`${snap().activity.editedFiles.size}`}</span>
        <span style={{ fg: theme.textMuted }}>{" ("}</span>
        <span style={{ fg: theme.text }}>
          {`${snap().totalKnowledgeFiles ? Math.round((snap().activity.editedFiles.size / snap().totalKnowledgeFiles) * 100) : 0}%`}
        </span>
        <span style={{ fg: theme.textMuted }}>{")"}</span>
      </text>
      <Show when={snap().reflectTrigger}>
        {(reason) => (
          <text>
            <span style={{ fg: theme.warning }}>{"●"}</span>
            <span style={{ fg: theme.text }}>{" reflect?"}</span>
            <span style={{ fg: theme.textMuted }}>{` (${reason()})`}</span>
          </text>
        )}
      </Show>
      <Show when={snap().curateTrigger}>
        <text>
          <span style={{ fg: theme.warning }}>{"●"}</span>
          <span style={{ fg: theme.text }}>{" curate?"}</span>
          <span style={{ fg: theme.textMuted }}>{" (dirtiness)"}</span>
        </text>
      </Show>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 50,
    slots: {
      sidebar_footer(_ctx, slotProps) {
        return <Footer api={api} sessionId={slotProps.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = { id: "arwyl-statusline", tui }
export default plugin
