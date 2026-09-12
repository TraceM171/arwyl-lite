// arwyl-lite-opencode package entry (server side) — the package-install alternative to the
// README's manual symlink dance. On first load in a project THAT ALREADY HAS a `knowledge/`
// directory, bootstraps AGENTS.md, the five skills, and the two secret-capture scripts onto disk
// (never overwriting anything that already exists), then delegates to the exact same status-budget
// check the manual-install path uses — imported, not duplicated, so there is exactly one copy of
// that algorithm regardless of which install method a consumer picked. See
// knowledge/decision-package-install.md.
//
// The `knowledge/` gate matters and is not incidental: this package is meant to be installed
// user-wide (global config), same as the original Claude Code plugin — and the Claude Code version
// only ever *acts* in a project that already has a `knowledge/` folder, the user's own deliberate
// per-project opt-in signal. A global install force-scaffolding AGENTS.md/skills into every
// directory `opencode` happens to touch would be a real regression from that behavior, caught live
// 2026-09-12 testing exactly this. Creating the *first* `knowledge/` folder in a new project stays
// a deliberate, manual step (`mkdir knowledge`) — this plugin only fills in what's missing once
// that folder exists, never creates it from nothing.
//
// This package's own tree doubles as the bundle source: `../AGENTS.md`, `../skills/*`,
// `../scripts/*` are the identical files the manual-install README instructs symlinking — no
// separate "bundled/" copy to keep in sync by hand.
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StatusBudgetPlugin } from "./status-budget.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = dirname(HERE);

function copyIfMissing(src, dest) {
  if (existsSync(dest)) return;
  const st = statSync(src);
  if (st.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const name of readdirSync(src)) copyIfMissing(join(src, name), join(dest, name));
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

function touchIfMissing(path) {
  if (existsSync(path)) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "");
}

// Exported (not just called internally) so the copy logic can be exercised directly in a plain
// node/bun script against a scratch directory — the safe way to verify it without needing a real
// opencode session, a real provider, or an interactive pty.
export function bootstrap(directory) {
  try {
    // The gate: do nothing at all in a project that hasn't opted in yet. `mkdir knowledge` is the
    // deliberate first step of adopting arwyl-lite in a new project — this plugin never takes it
    // on the user's behalf, global install or not.
    if (!existsSync(join(directory, "knowledge"))) return;

    copyIfMissing(join(PKG_ROOT, "AGENTS.md"), join(directory, "AGENTS.md"));
    copyIfMissing(join(PKG_ROOT, "skills"), join(directory, ".opencode", "skills"));
    copyIfMissing(join(PKG_ROOT, "scripts"), join(directory, ".opencode", "scripts"));
    touchIfMissing(join(directory, "knowledge", "_basic.md"));
    touchIfMissing(join(directory, "knowledge", ".local", "_basic.md"));
  } catch {
    // Best-effort — never fail plugin load over a scaffold step. Worst case, a consumer finishes
    // the setup by hand per the README, same as if they'd chosen manual install from the start.
  }
}

export default {
  id: "arwyl-lite-opencode",
  server: async (input, options) => {
    bootstrap(input.directory);
    return StatusBudgetPlugin(input, options);
  },
};
