---
name: "Pre-Deploy Check"
description: "Pre-deployment compliance gate for AramarkEDSTaskrunner App Builder app. Validates lint, tests, app.config.yaml integrity, env vars, and bundle size before deploying to Adobe I/O Runtime."
---

# Skill: Pre-Deploy Check

## Purpose

Run the full compliance gate before deploying to Adobe I/O Runtime. Catch failures in CI
rather than production.

## Checklist

### 1. Confirm Workspace

```bash
aio where
```

Verify you are in the correct org / project / workspace (not accidentally in prod when
targeting stage, or vice versa). **Stop if unexpected.**

### 2. Lint

```bash
npm run lint
```

Zero errors required. Auto-fix first if needed:

```bash
npm run lint:fix
```

### 3. Unit Tests

```bash
npm test
```

All tests must pass. Zero skipped tests unless explicitly justified.

### 4. Build

```bash
aio app:build --verbose
```

- No YAML parse errors in `app.config.yaml`
- No Webpack module resolution failures
- Bundle files exist in `dist/`

### 5. Bundle Size Check

```bash
ls -lh dist/
```

Each action bundle should be **well under 48 MB**. If any approaches this limit:
- Check `webpack-config.js` — ensure `@adobe/aio-sdk`, `@adobe/aio-lib-state`,
  `node-fetch` are in `externals` (provided by Runtime, should not be bundled)

### 6. Env Var Audit

Cross-reference `.env` against `app.config.yaml`:

```bash
grep -E '^\s+[A-Z_]+:' app.config.yaml | grep -v LOG_LEVEL
```

Every variable referenced in `app.config.yaml` must be present in `.env`.
The `.env` file must never be committed (verify `.gitignore` contains `.env`).

### 7. Auth Annotations

Every non-public action in `app.config.yaml` must have:

```yaml
annotations:
  require-adobe-auth: true
  final: true
```

Scan for missing `require-adobe-auth`:

```bash
grep -A5 'function:' app.config.yaml | grep -B3 -v 'require-adobe-auth'
```

### 8. Deploy

Only after all checks pass:

```bash
aio app:deploy
```

### 9. Smoke Test

```bash
# Invoke each action with minimal params and verify 200 or expected 400
aio rt:action:invoke AramarkTrailhead/manage-tokens --param method GET --result
aio rt:action:invoke AramarkTrailhead/list-sites --result
```

### 10. Verify Activation Logs

```bash
aio rt:activation:list --limit 10
```

No `500` status codes from the smoke test invocations.

---

## GO / NO-GO

| Check | Result |
|-------|--------|
| Correct workspace | ☐ |
| Lint passes | ☐ |
| Unit tests pass | ☐ |
| Build succeeds | ☐ |
| Bundle size OK | ☐ |
| Env vars complete | ☐ |
| Auth annotations present | ☐ |
| Smoke tests pass | ☐ |

**All must be checked before marking deployment complete.**
