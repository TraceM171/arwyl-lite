# Knowledge Organization Rules

This document defines how to organize knowledge directories.

## Directory Structure

Both `knowledge/` and `knowledge.local/` share the same structure rules:

### Required File

- **`_basic.md`** — Always required in the root of each knowledge directory. Must be read at first start before any other knowledge files.

### Directory Organization

- Use **one depth level max** for subdirectories (e.g., `auth/`, `ui/`, `infra/`)
- Each subdirectory should contain related files on a specific topic or aspect
- Do not nest directories deeper than one level

### Content Maintenance

- **Never maintain obsolete, superseded, or no longer valid entries**
- Keep knowledge tidy — delete or archive entries that are no longer relevant
- Outdated information must be removed or updated, not left to confuse future readers

## Summary

| Rule | Description |
|------|-------------|
| `_basic.md` | Mandatory in each knowledge directory root |
| Max depth | One level of subdirectories only |
| Tidiness | No obsolete or superseded entries |
