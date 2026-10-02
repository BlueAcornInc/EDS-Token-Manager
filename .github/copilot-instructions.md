# GitHub Copilot Instructions

## Project Rules

See [AGENTS.md](../AGENTS.md) for the full set of project-specific conventions, architecture overview, action development rules, build commands, and available skills.

**Start every task by reading `AGENTS.md` if you haven't already in this session.**

---

## Code Style (Always On)

These rules apply to **all** JavaScript generated or edited in this repo:

- Single quotes (`'`) not double quotes (`"`)
- Arrow function params always have parens: `(x) =>` not `x =>`
- Max line length 100 characters
- Unused params prefixed with `_`: `({ used, _unused })`
- Use `console.error` / `console.warn` / `console.info` — never `console.log`
- No trailing spaces at end of lines

After generating code, run `npm run lint:fix` then review what changed.

---

## Skills

Before starting any task, check `.agents/skills/` for a relevant skill and follow it if one exists.

Available skill directories:
- `.agents/skills/appbuilder/` — Adobe App Builder action development, debugging, and deployment

Key skills:
| Skill | Path |
|-------|------|
| App Builder Debug | `.agents/skills/appbuilder/debug/SKILL.md` |
| Action Development | `.agents/skills/appbuilder/action-development/SKILL.md` |
| Pre-Deploy Check | `.agents/skills/appbuilder/pre-deploy-check/SKILL.md` |

---

## Agents & Prompts

**Agents** (use `@agent-name` in chat):
- `@appbuilder-debug` — Diagnoses Runtime action failures, activation logs, state store issues, auth problems, and deployment errors

**Prompts** (use `/command` in chat):
- `/debug-action {name}` — Structured debugging for a failing action
- `/deploy-check` — Pre-deploy compliance check
- `/new-action {name}` — Scaffold a new Runtime action
