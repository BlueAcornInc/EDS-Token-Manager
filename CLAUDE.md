# CLAUDE.md — EDSTaskrunner (App Builder)

> Claude Code project instructions. See AGENTS.md for the full project reference.

## Project Overview

**EDSTaskrunner** is an Adobe App Builder / Adobe I/O Runtime serverless application.
It manages brand CSS design tokens and publishes them to GitHub as PRs. Not an EDS project —
no block development, no AEM Admin API work.

**Live URL:** `TODO`

---

## Code Style — Always On

- Single quotes (`'`) not double quotes (`"`)
- Arrow function params always have parens: `(x) =>` not `x =>`
- Max line length 100 characters
- Unused params prefixed with `_`: `({ used, _unused })`
- `console.error` / `console.warn` / `console.info` — never `console.log`
- No trailing spaces

After any JS change: `npm run lint:fix`

---

## Key Commands

```bash
npm test                          # Jest unit tests
npm run lint:fix                  # ESLint auto-fix
aio app:build                     # Build (validates app.config.yaml + webpack)
aio app:deploy                    # Deploy to I/O Runtime
aio where                         # Show current org/project/workspace
aio rt:activation:list --limit 20 # Recent activations
aio rt:activation:logs <id>       # Action logs
aio rt:action:invoke AramarkTrailhead/<name> --param k v --result
aio auth token                    # Get/check IMS token
```

---

## Action Development Rules

- Every action must call `checkMissingRequestInputs()` from `actions/utils.js`
- Every action must call `getBearerToken()` from `actions/utils.js`
- Return shape: `{ statusCode: 200, body: { ... } }`
- `require-adobe-auth: true` required for all non-public actions in `app.config.yaml`
- Never hardcode secrets — use `app.config.yaml` `inputs:` + `.env`
- State keys follow `{brand}:{category}` pattern

---

## Git Safety

- **NEVER push to `main`** without explicit instruction
- Always set upstream on new branches: `git push --set-upstream origin <branch>`
- Always confirm branch before push: `git branch --show-current`

---

## Skills (in `.agents/skills/appbuilder/`)

| Skill | Purpose |
|-------|---------|
| `debug/SKILL.md` | Diagnose Runtime action failures end-to-end |
| `action-development/SKILL.md` | TDD workflow for building/modifying actions |
| `pre-deploy-check/SKILL.md` | Pre-deployment compliance gate |

---

## Slash Commands (in `.claude/commands/`)

| Command | Purpose |
|---------|---------|
| `/debug-action` | Diagnose a failing Runtime action |
| `/deploy-check` | Pre-deploy compliance gate |
| `/new-action` | Scaffold a new Runtime action |
