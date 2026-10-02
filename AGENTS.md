# AGENTS.md

## Overview

**AramarkTrailhead** is an Adobe App Builder application running on Adobe I/O Runtime. It is a serverless Brand CSS Design Token Manager that stores token sets per brand, generates CSS custom properties, and publishes them to GitHub via Pull Requests. The downstream consumer is an Adobe Edge Delivery Services (EDS) site.

Package name: **`AramarkTrailhead`**. Deploy target depends on the Adobe I/O project/workspace bound via `aio app use` (do not assume a hardcoded static CDN URL).

**Porting tier:** this branch is the `to-staging` stack — `to-main` plus style-guide
preview and RBAC enablement docs. Validate EDS CDN links in `preview.html` before
relying on the live preview.

---

## Project Rules

### Architecture

- **Platform:** Adobe App Builder (Adobe I/O Runtime) — serverless Node.js actions
- **State:** `@adobe/aio-lib-state` (Adobe I/O managed key-value store — no database)
- **Auth:** Adobe IMS via Experience Cloud Shell (`@adobe/exc-app`)
- **Frontend:** Vanilla JS SPA served as static assets at `web-src/`
- **CI/CD:** GitHub Actions — deploys to Adobe I/O Runtime via `aio` CLI
- **Actions live in** `actions/` — each sub-folder is one Runtime action (`index.js`)
- **Shared utilities** in `actions/utils.js`

### Action Inventory

| Action | Path | Purpose |
|--------|------|---------|
| `manage-tokens` | `actions/manage-tokens/index.js` | Brand token CRUD via Adobe I/O State |
| `publish-tokens` | `actions/publish-tokens/index.js` | Token → CSS → GitHub branch + PR |
| `list-sites` | `actions/list-sites/index.js` | List brand sites from GitHub `brands/` |
| `create-site` | `actions/create-site/index.js` | Scaffold a new brand site (GitHub files + PR + state seed) |
| `remove-brand` | `actions/remove-brand/index.js` | Remove brand from index/state |
| `content-status` | `actions/content-status/index.js` | Helix/AEM content publish status |

### Build & Development Commands

| Command | What it does |
|---------|-------------|
| `npm test` | Jest unit tests (`./test`) |
| `npm run lint` | ESLint across `test`, `src`, `actions` |
| `npm run lint:fix` | ESLint auto-fix |
| `aio app:build` | Build the App Builder app |
| `aio app:deploy` | Deploy to Adobe I/O Runtime |
| `aio app:undeploy` | Remove deployment |
| `aio app:run` | Local dev server (with hot reload) |
| `aio rt:activation:list` | List recent Runtime activations |
| `aio rt:activation:logs <id>` | Get logs for a specific activation |
| `aio rt:action:invoke <name>` | Invoke a Runtime action directly |
| `aio auth token` | Get current IMS access token |
| `aio where` | Show current org/project/workspace |

### Code Style (Always On)

These rules apply to **all** JavaScript generated or edited in this repo:

- Single quotes (`'`) not double quotes (`"`)
- Arrow function params always have parens: `(x) =>` not `x =>`
- Max line length 100 characters
- Unused params prefixed with `_`: `({ used, _unused })`
- Use `console.error` / `console.warn` / `console.info` — never `console.log`
- No trailing spaces at end of lines

After generating code, run `npm run lint:fix` and review what changed.

### Action Development Rules

- Every action **must** call `checkMissingRequestInputs()` from `actions/utils.js` to validate params
- Every action **must** call `getBearerToken()` from `actions/utils.js` — never read `Authorization` directly
- Mutating actions should call `authorize()` from `actions/authz.js` (enforced when `AUTHZ_ENFORCE=true`)
- RBAC enablement runbook: `documents/RBAC-ENABLEMENT.md`
- Return format: `{ statusCode: 200, body: { ... } }` — never throw unhandled errors from actions
- Auth annotation `require-adobe-auth: true` must be set for all non-public actions in `app.config.yaml`
- Environment vars declared in `app.config.yaml` under `inputs:` — never hardcode secrets
- Brand state keys: `brand.{slug}` (tokens), `.status`, `.meta`, `.pr`, `.audit`; index at `brand.__index__`
- Use shared `sanitiseBrandName` / `validateTokens` / `clearBrandState` / `resolveActor` / `recordBrandAudit` from `actions/utils.js`

### Testing Rules

- Unit tests co-located in `test/` mirroring `actions/` structure
- Mock `@adobe/aio-lib-state` in unit tests — never hit real state store in unit tests
- Use `jest.mock()` for `node-fetch` in action unit tests

### Git Safety — Hard Rules

- **NEVER push to `main`** without an explicit instruction in the current user message
- When creating a new branch, always set upstream explicitly: `git push --set-upstream origin <branch-name>`
- Before any `git push`, confirm active branch: `git branch --show-current`

### Key Files

| File | Purpose |
|------|---------|
| `app.config.yaml` | Runtime manifest — action routes, auth, env var injection |
| `config/token-schema.json` | Design token schema (categories, field types, defaults) |
| `config/brand-schema.json` | Brand configuration schema |
| `config/root-schema.json` | Root-level schema |
| `actions/utils.js` | Shared action utilities (auth, validation, response helpers) |
| `actions/branches.js` | Canonical Git branch defaults (all → `staging`) |
| `actions/authz.js` | Optional Product Profile RBAC (`AUTHZ_ENFORCE`) |
| `web-src/index.html` | SPA entry point |
| `web-src/wizard.html` | Token wizard UI |
| `documents/` | Architecture docs and design references |

---

## Agents & Prompts

**Agents** (use `@agent-name` in chat):
- `@appbuilder-debug` — App Builder Runtime specialist. Diagnoses action failures, activation logs, state store issues, auth problems, and deployment errors.

**Prompts** (use `/command` in chat):
- `/debug-action {name}` — Structured debugging workflow for a failing Runtime action
- `/deploy-check` — Pre-deploy compliance check (auth, params, lint, tests)
- `/new-action {name}` — Scaffold a new Runtime action following project conventions

---

## Skills

| Skill | Path | Purpose |
|-------|------|---------|
| App Builder Debug | `.agents/skills/appbuilder/debug/SKILL.md` | Diagnose Runtime action failures end-to-end |
| Action Development | `.agents/skills/appbuilder/action-development/SKILL.md` | Build/modify Runtime actions with TDD |
| Pre-Deploy Check | `.agents/skills/appbuilder/pre-deploy-check/SKILL.md` | Pre-deployment compliance gate |

---

## Model Routing Strategy

- **Claude Sonnet 4.6** = orchestrator, planning, reasoning, investigation
- **Claude Haiku 4.5** = read-only exploration and log analysis
- Run at most **4 subagents in parallel**
