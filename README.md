# Agents Knowledge Template

Standardized knowledge organization for agent-assisted development.

## What This Is

This repository provides a template for organizing agent knowledge bases in your projects. It ensures consistent, maintainable, and shareable knowledge across team members and agent sessions.

## Quick Start

### 1. Setup in Your Project

Clone this repository somewhere on your system, then create hard links to `AGENTS.md` in each project's root:

```bash
# Clone to a permanent location
git clone <this-repo-url> ~/path/to/agents-template

# In each project, create hard links:
ln ~/path/to/agents-template/AGENTS.md ./AGENTS.md
ln ~/path/to/agents-template/KNOWLEDGE_ORG.md ./KNOWLEDGE_ORG.md

# Create knowledge directories
mkdir -p knowledge knowledge.local
```

### 2. Initialize Knowledge Bases

Create the required `_basic.md` files in each knowledge directory:

```bash
# knowledge/_basic.md — project-wide knowledge (shareable)
touch knowledge/_basic.md

# knowledge.local/_basic.md — personal preferences (not shared)
touch knowledge.local/_basic.md
```

### 3. Configure Your Agent

Point your agent to read `AGENTS.md` at project root. The agent will:
- Read `knowledge.local/_basic.md` and `knowledge/_basic.md` at first start
- Discover available files in both knowledge directories
- Follow the organization rules in `KNOWLEDGE_ORG.md`

## Directory Structure

```
project_root/
├── AGENTS.md           # Project agent configuration (hard link)
├── KNOWLEDGE_ORG.md    # Organization rules (hard link)
├── knowledge/          # Shared project knowledge
│   ├── _basic.md       # Always read at start
│   ├── auth/           # Authentication-related knowledge
│   ├── ui/             # UI/UX related knowledge
│   └── infra/          # Infrastructure knowledge
└── knowledge.local/    # Personal user knowledge
    ├── _basic.md       # Always read at start
    └── preferences/    # User-specific settings
```

## Key Rules

1. **Never edit `AGENTS.md`** — it is the source of truth for agent configuration
2. **Always read `KNOWLEDGE_ORG.md`** before modifying knowledge
3. **Keep knowledge tidy** — no obsolete or superseded entries
4. **Never use agent memories** — always persist information in knowledge folders

## Skills

### Reflect Skill

The `reflect.md` file in this repository can be used as a skill in both Claude Code and OpenCode.

**For Claude Code:** Copy or link it to your project's `.claude/skills/reflect/SKILL.md`:

```bash
mkdir -p .claude/skills/reflect
ln ~/path/to/agents-template/reflect.md .claude/skills/reflect/SKILL.md
```

Then invoke it with `/reflect` in Claude Code.

**For OpenCode:** Copy or link it to your project's `.opencode/skills/reflect/SKILL.md`:

```bash
mkdir -p .opencode/skills/reflect
ln ~/path/to/agents-template/reflect.md .opencode/skills/reflect/SKILL.md
```

Then invoke it using the `skill` tool.

The agent will review the conversation, identify learned information, and update the knowledge base accordingly.

## Claude Code Setup

To use this knowledge system with Claude Code:

### 1. Project Structure

Create the following in your project root:

```bash
# Create hard links to the template files
ln ~/path/to/agents-template/AGENTS.md ./AGENTS.md
ln ~/path/to/agents-template/KNOWLEDGE_ORG.md ./KNOWLEDGE_ORG.md

# Create knowledge directories
mkdir -p knowledge knowledge.local

# Initialize required _basic.md files
touch knowledge/_basic.md
touch knowledge.local/_basic.md

# Setup the reflect skill (optional)
mkdir -p .claude/skills/reflect
ln ~/path/to/agents-template/reflect.md .claude/skills/reflect/SKILL.md
```

### 2. How It Works

- Claude Code automatically looks for `.claude/skills/` in your project
- The `AGENTS.md` in project root provides knowledge base references
- Agents read `knowledge/_basic.md` and `knowledge.local/_basic.md` at first start
- Use `/reflect` to capture session learnings into the knowledge base

## OpenCode Setup

To use this knowledge system with OpenCode:

### 1. Project Structure

Create the following in your project root:

```bash
# Create hard links to the template files
ln ~/path/to/agents-template/AGENTS.md ./AGENTS.md
ln ~/path/to/agents-template/KNOWLEDGE_ORG.md ./KNOWLEDGE_ORG.md

# Create knowledge directories
mkdir -p knowledge knowledge.local

# Initialize required _basic.md files
touch knowledge/_basic.md
touch knowledge.local/_basic.md

# Setup the reflect skill
mkdir -p .opencode/skills/reflect
ln ~/path/to/agents-template/reflect.md .opencode/skills/reflect/SKILL.md
```

### 2. How It Works

- OpenCode automatically looks for `.opencode/skills/` in your project
- The `AGENTS.md` in project root provides knowledge base references
- Agents read `knowledge/_basic.md` and `knowledge.local/_basic.md` at first start
- Use the `skill` tool to invoke the reflect skill

## Workflow Summary

| Action | Command/Step |
|--------|--------------|
| Setup new project | Create hard links + directories |
| Capture session learning | Invoke `reflect.md` skill |
| Add shared knowledge | Edit `knowledge/<topic>/` files |
| Add personal knowledge | Edit `knowledge.local/<topic>/` files |
| Update knowledge structure | Read `KNOWLEDGE_ORG.md` first |
| Discover available knowledge | Agent runs `ls knowledge/` and `ls knowledge.local/` |