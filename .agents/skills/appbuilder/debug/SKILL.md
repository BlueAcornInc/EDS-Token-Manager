---
name: "App Builder Debug"
description: "End-to-end debugging workflow for Adobe App Builder Runtime action failures. Covers activation log analysis, auth issues, state store problems, deployment failures, and GitHub PR pipeline errors."
---

# Skill: App Builder Debug

## Purpose

Diagnose and resolve failures in Adobe App Builder / Adobe I/O Runtime actions for the
EDSTaskrunner project.

## When to Use

- A Runtime action returns an unexpected error (4xx, 5xx, timeout)
- `aio app:deploy` fails
- I/O State reads/writes are failing or returning stale data
- The publish-tokens GitHub PR pipeline is broken
- Auth errors between the UI and Runtime actions
- CloudEvents are not being delivered

---

## Step 1 — Establish Context

```bash
# Confirm which org/project/workspace you are in
aio where

# Confirm CLI is authenticated
aio auth token
```

If the workspace is wrong, stop and ask the user before proceeding.

---

## Step 2 — Get Activation Logs

```bash
# List last 20 activations
aio rt:activation:list --limit 20

# Get full record for a specific activation (result + logs)
aio rt:activation:get <activation-id>

# Or get just logs
aio rt:activation:logs <activation-id>
```

Look for:
- `error` fields in the activation result
- Stack traces in logs
- Which step in the action body threw

---

## Step 3 — Reproduce Directly

Invoke the action with minimal params to isolate the failure:

```bash
# Invoke with explicit params and get result inline
aio rt:action:invoke AramarkTrailhead/<action-name> \
  --param key value \
  --result
```

---

## Step 4 — Auth Diagnosis

If error is `401 Unauthorized`:

```bash
# Check IMS token validity
aio auth token --decode

# Re-authenticate if expired
aio login
```

Then verify `require-adobe-auth: true` is set in `app.config.yaml` for the action AND that the
UI is passing `Authorization: Bearer {token}` via `@adobe/exc-app`.

---

## Step 5 — State Store Diagnosis

If the action reads/writes `@adobe/aio-lib-state`:

1. Check key naming — keys must be `≤1024 chars`
2. Check TTL — default is 1 year; explicit `0` means use default
3. Check namespace — must match current `aio where` namespace
4. Invoke `manage-tokens` with `GET` to verify state is readable

---

## Step 6 — Deployment

### ⚠️ Known: `aio app:deploy` is blocked by Adobe Exchange publish lock

This app is published on Adobe Exchange (Production workspace). Running `aio app:deploy` locally will always print:

> `This application is published and the current workspace is Production, deployment will be skipped.`

**This is expected and NOT an error to fix.**

### How deployments actually work

**Actions** — deploy manually after every build using `aio rt:action:update`:

```bash
aio app:build

DIST=dist/application/actions/AramarkTrailhead
for action in manage-tokens publish-tokens list-sites github-branch-pr publish-events create-site remove-brand proxy-page; do
  aio rt:action:update AramarkTrailhead/$action $DIST/$action.zip --kind nodejs:22
  echo "✔ $action"
done
```
> ⚠️ **`aio rt:action:update` does NOT set default params from `app.config.yaml` inputs.**
> After updating an action that uses `inputs:` in `app.config.yaml`, you must also set the params
> explicitly with `--param` flags. Use values from `.env`:
> 
> ```bash
> aio rt:action:update AramarkTrailhead/manage-tokens dist/.../manage-tokens.zip \
>   --kind nodejs:22 \
>   --param LOG_LEVEL debug \
>   --param GITHUB_APP_ID $GITHUB_APP_ID \
>   --param GITHUB_APP_INSTALLATION_ID $GITHUB_APP_INSTALLATION_ID \
>   --param GITHUB_OWNER $GITHUB_OWNER \
>   --param GITHUB_REPO $GITHUB_REPO \
>   --param GITHUB_APP_PRIVATE_KEY "$GITHUB_APP_PRIVATE_KEY"
> ```
> 
> Verify params are set: `aio rt:action:get AramarkTrailhead/<action> | grep '"key"'`
**Web assets (frontend JS/CSS)** — deployed automatically by GitHub Actions CI on every push to `main`. The CI uses service account credentials (`oauth_sts`) that bypass the Exchange lock. Always push to `main` after web asset changes and confirm the run succeeded:

```bash
gh run list --limit 5
```

All recent runs should show `success`. If a run failed, check it with:

```bash
gh run view <run-id> --log-failed
```

### Build failure: `configure-site-seo` missing

If `aio app:build` fails with `Module not found: ../configure-site-seo/index` — this dependency was removed. Pull the latest `main` and rebuild.

### Verifying a deployment

After uploading action zips, check the latest activation:

```bash
aio rt:activation:list --limit 5
```

Cold-start `app error` activations from CLI invocations (no IMS token) are **normal** — the action requires Adobe IMS auth which CLI `--param` invocations don't provide. Successful UI invocations always show as `warm + success`.

---

## Step 7 — I/O State Direct Access (local script)

When the Runtime action is unreachable (auth blocked) but you need to read or patch state, use the `.env` credentials directly:

```bash
cd trailhead-app && node -e "
require('dotenv').config()
const stateLib = require('@adobe/aio-lib-state')
;(async () => {
  const state = await stateLib.init({
    ow: { namespace: process.env.AIO_runtime_namespace, auth: process.env.AIO_runtime_auth }
  })
  // Read index
  const entry = await state.get('brand.__index__')
  console.log(JSON.parse(entry?.value || '[]'))
})().catch(console.error)
"
```

Common state repair operations:

```bash
# Add a missing brand to the index
await state.put('brand.__index__', JSON.stringify([...index, 'brand-slug']), { ttl: 31536000 })

# Fix a brand showing as 'new' when it already exists on CDN
await state.put('brand.{slug}.status', 'synced', { ttl: 31536000 })

# Update brand meta (fullName, domain)
await state.put('brand.{slug}.meta', JSON.stringify({ fullName: 'Display Name', domain: 'example.com' }), { ttl: 31536000 })
```

---

## Step 8 — Document Finding

After diagnosis, summarize:
1. **Root cause** — what actually failed and why
2. **Fix applied** — exact change made
3. **Verification** — activation log or invoke result showing success
4. **Prevention** — what to add to tests or lint rules to catch this earlier
