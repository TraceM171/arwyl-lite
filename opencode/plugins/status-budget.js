// tool.execute.after: flag over-budget knowledge/status.md "recent changes" entries.
//
// Why this exists as a hook rather than a rule. The entry budget is stated in the knowledge-org
// skill, in AGENTS.md, and in both reflect/curate skills — and a field study of a real Claude Code
// consumer found it violated in 7 of 7 sessions examined, every time by a writer that had invoked
// the knowledge-org skill *earlier in the same session*. The rule reaches the writer and is still
// missed, because the write happens under task pressure a hundred-plus turns after the reading.
// More prose is the intervention already shown not to work; feedback at the moment of the write is
// not. This is a from-scratch JS port of the same algorithm as claude_code/hooks/status-budget.py
// (adapted to OpenCode's tool.execute.after contract, not a shared file — see
// knowledge/decision-multi-tool-integration.md) — confirmed live that mutating `output.output` is
// what reaches the model; `metadata` does not (knowledge/audit-2026-09-11-opencode-hook-injection-test.md).
//
// Deliberately advisory. It reports; it never blocks and never edits. A false positive costs the
// agent one line of output to dismiss, so the failure mode of being wrong here is cheap — which is
// what makes it safe to run on every write/edit call.

import { readFile } from "node:fs/promises";

const DEFAULT_BUDGET = 300;
const MAX_REPORTED = 5;
const FILE_TOOLS = new Set(["write", "edit"]);

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const RECENT_RE = /recent\s+changes/i;
const BULLET_RE = /^[-*+]\s+/;

function budget() {
  const raw = process.env.ARWYL_STATUS_ENTRY_BUDGET;
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BUDGET;
}

// Lines under the first "Recent changes" heading, up to the next heading at the same-or-shallower level.
function recentChangesBlock(text) {
  const lines = text.split("\n");
  let start = null;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADING_RE);
    if (m && RECENT_RE.test(m[2])) {
      start = i + 1;
      level = m[1].length;
      break;
    }
  }
  if (start === null) return [];
  const out = [];
  for (let i = start; i < lines.length; i++) {
    const m = lines[i].match(HEADING_RE);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out;
}

// Split the block into top-level bullets. A new entry starts at any line beginning with a list
// marker; everything after it (including blank lines) belongs to that entry until the next marker.
function entries(block) {
  const found = [];
  let current = null;
  for (const line of block) {
    if (BULLET_RE.test(line)) {
      if (current) found.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    }
  }
  if (current) found.push(current);
  return found.map((parts) =>
    parts
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" ")
  );
}

export const StatusBudgetPlugin = async () => {
  return {
    "tool.execute.after": async (input, output) => {
      try {
        if (!FILE_TOOLS.has(input.tool)) return;
        const filePath = input.args?.filePath;
        if (!filePath) return;

        const normalized = filePath.replace(/\\/g, "/");
        if (!normalized.endsWith("knowledge/status.md")) return;

        let text;
        try {
          text = await readFile(filePath, "utf-8");
        } catch {
          return;
        }

        const limit = budget();
        const over = entries(recentChangesBlock(text)).filter((e) => e.length > limit);
        if (over.length === 0) return;

        over.sort((a, b) => b.length - a.length);
        const shown = over.slice(0, MAX_REPORTED);
        const bullets = shown
          .map((e) => `  - ${e.length} chars: ${e.slice(0, 70).trimEnd()}...`)
          .join("\n");
        const more =
          over.length > shown.length ? `\n  (+${over.length - shown.length} more over budget)` : "";

        const message =
          `\n\n[status-budget] knowledge/status.md: ${over.length} 'recent changes' ` +
          `entr${over.length === 1 ? "y is" : "ies are"} over the ${limit}-character budget ` +
          `(the knowledge-org skill, 'Recent-changes entries are pointers, not records').\n` +
          `${bullets}${more}\n` +
          `If one of these is an entry you just wrote: trim it to what changed + a link, and move ` +
          `the narrative to its real home (a dated audit/incident file, a decision-<topic>.md, or ` +
          `the per-X file). Pre-existing over-budget entries are not this write's problem — leave ` +
          `them for a reflect or curate pass.`;

        output.output += message;
      } catch {
        // Never let a knowledge-hygiene check interrupt real work.
      }
    },
  };
};

export default StatusBudgetPlugin;
