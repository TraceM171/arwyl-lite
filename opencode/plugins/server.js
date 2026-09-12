// arwyl-lite-opencode package entry (server side) — the package-install alternative to the
// README's manual symlink dance. On every load in a project THAT ALREADY HAS a `knowledge/`
// directory, syncs the package-owned files — AGENTS.md, the five skills, and the two
// secret-capture scripts — to this package's current content, then delegates to the exact same
// status-budget check the manual-install path uses — imported, not duplicated, so there is exactly
// one copy of that algorithm regardless of which install method a consumer picked. See
// knowledge/decision-package-install.md.
//
// The `knowledge/` gate matters and is not incidental: this package is meant to be installed
// user-wide (global config), same as the original Claude Code plugin — and the Claude Code version
// only ever *acts* in a project that already has a `knowledge/` folder, the user's own deliberate
// per-project opt-in signal. A global install force-scaffolding AGENTS.md/skills into every
// directory `opencode` happens to touch would be a real regression from that behavior, caught live
// 2026-09-12 testing exactly this. Creating the *first* `knowledge/` folder in a new project stays
// a deliberate, manual step (`mkdir knowledge`) — this plugin never creates it from nothing.
//
// Updating the package replaces what it installed: a changed file is rewritten, a file or skill a
// newer version no longer ships is removed, an unchanged file is left untouched. What the package
// installed is recorded in `.opencode/.arwyl-lite-manifest.json` — that record is what lets an
// update tell "a skill this package shipped and has since dropped" apart from "a skill the project
// added itself". Two things are never touched: a symlink (a manual, Option-B install pointing at a
// checkout owns it) and an AGENTS.md the project already had — AGENTS.md is replaced only if this
// package wrote it (recorded in the manifest, or still byte-identical to the package's own copy).
//
// This package's own tree doubles as the bundle source: `../AGENTS.md`, `../skills/*`,
// `../scripts/*` are the identical files the manual-install README instructs symlinking — no
// separate "bundled/" copy to keep in sync by hand.
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StatusBudgetPlugin } from "./status-budget.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = dirname(HERE);
const MANIFEST = join(".opencode", ".arwyl-lite-manifest.json");

// The only shapes a manifest entry may take. Entries are deleted on update, so anything else read
// back from the manifest (a hand-edited or corrupted file) is ignored rather than trusted.
const OWNABLE = /^(AGENTS\.md|\.opencode[\\/](skills|scripts)[\\/][^\\/]+)$/;

// Every project-relative path this package owns, paired with its source in the package: AGENTS.md,
// then one entry per bundled skill directory and per bundled script — never the whole
// `.opencode/skills` directory, which may also hold the project's own skills.
function packageEntries() {
  const entries = [["AGENTS.md", join(PKG_ROOT, "AGENTS.md")]];
  for (const kind of ["skills", "scripts"]) {
    for (const name of readdirSync(join(PKG_ROOT, kind))) {
      entries.push([join(".opencode", kind, name), join(PKG_ROOT, kind, name)]);
    }
  }
  return entries;
}

function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function sameFile(src, dest) {
  try {
    return statSync(dest).isFile() && readFileSync(src).equals(readFileSync(dest));
  } catch {
    return false;
  }
}

// Make dest match src: rewrite only files whose bytes differ, and remove anything in dest that src
// no longer has, so a file dropped from a skill doesn't linger after an update.
function syncInto(src, dest) {
  if (statSync(src).isDirectory()) {
    if (existsSync(dest) && !statSync(dest).isDirectory()) rmSync(dest, { force: true });
    mkdirSync(dest, { recursive: true });
    const names = readdirSync(src);
    for (const name of readdirSync(dest)) {
      if (!names.includes(name)) rmSync(join(dest, name), { recursive: true, force: true });
    }
    for (const name of names) syncInto(join(src, name), join(dest, name));
  } else if (!sameFile(src, dest)) {
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
}

function readOwned(directory) {
  try {
    const { owned } = JSON.parse(readFileSync(join(directory, MANIFEST), "utf8"));
    return Array.isArray(owned)
      ? owned.filter((rel) => typeof rel === "string" && OWNABLE.test(rel) && !rel.includes(".."))
      : [];
  } catch {
    return [];
  }
}

function touchIfMissing(path) {
  if (existsSync(path)) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, "");
}

// Exported (not just called internally) so the sync logic can be exercised directly in a plain
// node/bun script against a scratch directory — the safe way to verify it without needing a real
// opencode session, a real provider, or an interactive pty.
export function bootstrap(directory) {
  try {
    // The gate: do nothing at all in a project that hasn't opted in yet. `mkdir knowledge` is the
    // deliberate first step of adopting arwyl-lite in a new project — this plugin never takes it
    // on the user's behalf, global install or not.
    if (!existsSync(join(directory, "knowledge"))) return;

    const previouslyOwned = readOwned(directory);
    const entries = packageEntries();
    const shipped = new Set(entries.map(([rel]) => rel));

    // Something an earlier version installed that this one no longer ships (a removed or renamed
    // skill or script) goes, so an update doesn't leave it behind.
    for (const rel of previouslyOwned) {
      const dest = join(directory, rel);
      if (!shipped.has(rel) && !isSymlink(dest)) rmSync(dest, { recursive: true, force: true });
    }

    const owned = [];
    for (const [rel, src] of entries) {
      const dest = join(directory, rel);
      if (isSymlink(dest)) continue;
      if (rel === "AGENTS.md" && existsSync(dest) && !previouslyOwned.includes(rel) && !sameFile(src, dest)) {
        continue;
      }
      syncInto(src, dest);
      owned.push(rel);
    }

    const manifestPath = join(directory, MANIFEST);
    const manifest = JSON.stringify({ owned }, null, 2) + "\n";
    if (!existsSync(manifestPath) || readFileSync(manifestPath, "utf8") !== manifest) {
      mkdirSync(dirname(manifestPath), { recursive: true });
      writeFileSync(manifestPath, manifest);
    }

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
