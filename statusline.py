#!/usr/bin/env python3
import json, os, re, subprocess, sys, time

try:
    data = json.load(sys.stdin)
except Exception:
    print("claude")
    sys.exit(0)

G, Y, R, C, RESET = "\033[92m", "\033[93m", "\033[91m", "\033[96m", "\033[0m"
DIM = "\033[2m"
SEP = f"{DIM} · {RESET}"

def remaining_dot_color(remaining_pct):
    return G if remaining_pct > 50 else Y if remaining_pct > 20 else R

def used_dot_color(used_pct):
    return G if used_pct < 50 else Y if used_pct < 80 else R

# Context dot — green < 50%, yellow < 80%, red >= 80%
ctx = data.get("context_window", {})
pct = ctx.get("used_percentage") or 0
ctx_str = f"{used_dot_color(pct)}●{RESET}\033[1m {pct:.0f}%{RESET}"

# Friendly model name from statusline JSON's display_name field
model_obj = data.get("model", {})
if isinstance(model_obj, dict):
    friendly = model_obj.get("display_name") or model_obj.get("id", "")
else:
    friendly = str(model_obj)

model_str = f"\033[1m{friendly}{RESET}"

max_ctx = ctx.get("context_window_size")
if max_ctx:
    size_str = f"{max_ctx // 1_000_000}M" if max_ctx >= 1_000_000 else f"{max_ctx // 1000}k"
    model_str += f"{DIM} ({size_str}){RESET}"

effort_obj = data.get("effort")
if isinstance(effort_obj, dict) and effort_obj.get("level"):
    model_str += f"\033[1m [{effort_obj['level']}]{RESET}"

def fmt_reset(rl):
    resets_at = rl.get("resets_at")
    used = rl.get("used_percentage")
    if resets_at is None or used is None:
        return None
    secs = max(0, int(resets_at - time.time()))
    d, rem = divmod(secs, 86400)
    h, rem = divmod(rem, 3600)
    m = rem // 60
    if d:
        countdown = f"{d}d {h}h"
    elif h:
        countdown = f"{h}h {m:02d}m"
    else:
        countdown = f"{m}m"
    c = used_dot_color(used)
    return f"{c}●{RESET}\033[1m {used:.0f}%{RESET} ({countdown})"

rate = data.get("rate_limits", {})
rl_parts = [s for s in [fmt_reset(rate.get("five_hour", {})), fmt_reset(rate.get("seven_day", {}))] if s]

# Git branch — dot color reflects real state: clean (green), uncommitted (yellow), unpushed (cyan)
# Branch stats = uncommitted diff vs HEAD (staged + unstaged)
def git_status():
    cwd = data.get("cwd") or data.get("workspace", {}).get("current_dir")
    if not cwd:
        return None
    try:
        branch = subprocess.run(
            ["git", "-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=2,
        )
        name = branch.stdout.strip()
        if branch.returncode != 0 or not name:
            return None
        diff = subprocess.run(
            ["git", "-C", cwd, "diff", "--shortstat", "HEAD"],
            capture_output=True, text=True, timeout=2,
        )
        out = diff.stdout.strip()
        ins = int(m.group(1)) if (m := re.search(r"(\d+) insertion", out)) else 0
        dele = int(m.group(1)) if (m := re.search(r"(\d+) deletion", out)) else 0
        ahead = subprocess.run(
            ["git", "-C", cwd, "rev-list", "--count", "@{u}.."],
            capture_output=True, text=True, timeout=2,
        )
        unpushed = int(ahead.stdout.strip()) if ahead.returncode == 0 and ahead.stdout.strip().isdigit() else 0
        return name, ins, dele, unpushed
    except Exception:
        return None

git_info = git_status()
git_str = None
if git_info:
    branch, b_added, b_removed, unpushed = git_info
    dirty = bool(b_added or b_removed)
    dot = Y if dirty else C if unpushed else G
    branch_stats = f"{DIM}branch {RESET}{DIM}+{b_added} -{b_removed}{RESET}"
    git_str = f"{dot}●{RESET} {branch}{SEP}{branch_stats}"

# Lines added/removed this session (whole session, not knowledge-scoped)
cost = data.get("cost", {})
added, removed = cost.get("total_lines_added"), cost.get("total_lines_removed")
lines_str = None
if added is not None or removed is not None:
    lines_str = f"{DIM}session {RESET}\033[1m+{added or 0} -{removed or 0}{RESET}"

# Knowledge-tree activity this session — knowledge/**.md files read vs edited, as % of the tree
def knowledge_activity():
    transcript_path = data.get("transcript_path")
    project_dir = data.get("workspace", {}).get("project_dir") or data.get("cwd")
    if not transcript_path or not project_dir:
        return None
    knowledge_dir = os.path.join(project_dir, "knowledge")
    if not os.path.isdir(knowledge_dir):
        return None
    knowledge_root = knowledge_dir + os.sep
    total_files = sum(len(files) for _, _, files in os.walk(knowledge_dir))
    read_files, edited_files = set(), set()
    try:
        with open(transcript_path) as f:
            for line in f:
                try:
                    entry = json.loads(line)
                except Exception:
                    continue
                if entry.get("type") != "assistant":
                    continue
                for block in entry.get("message", {}).get("content") or []:
                    if not isinstance(block, dict) or block.get("type") != "tool_use":
                        continue
                    name = block.get("name")
                    inp = block.get("input") or {}
                    fp = inp.get("file_path") or inp.get("notebook_path")
                    if not fp or not fp.startswith(knowledge_root):
                        continue
                    if name == "Read":
                        read_files.add(fp)
                    elif name in ("Edit", "Write", "NotebookEdit"):
                        edited_files.add(fp)
    except OSError:
        return None
    return len(read_files), len(edited_files), total_files

kn = knowledge_activity()
kn_str = None
if kn is not None:
    n_read, n_edit, total_files = kn
    read_pct = (n_read / total_files * 100) if total_files else 0
    edit_pct = (n_edit / total_files * 100) if total_files else 0
    read_part = f"\033[1m{n_read}{RESET}{DIM} read ({RESET}\033[1m{read_pct:.0f}%{RESET}{DIM}){RESET}"
    edit_part = f"\033[1m{n_edit}{RESET}{DIM} edited ({RESET}\033[1m{edit_pct:.0f}%{RESET}{DIM}){RESET}"
    kn_str = f"{DIM}knowledge:{RESET} " + SEP.join([read_part, edit_part])

git_line_parts = [p for p in [git_str, lines_str] if p]
status_parts = [ctx_str, model_str] + rl_parts

lines = []
if kn_str:
    lines.append(kn_str)
if git_line_parts:
    lines.append(SEP.join(git_line_parts))
lines.append(SEP.join(status_parts))
print("\n".join(lines))
