# IMS Authentication Plan
*Trailhead App — as of 2026-06-18*

## Problem Statement

1. **No frontend access gate.** The app HTML/JS is served from a public CDN URL (`*.adobeio-static.net`). Anyone who knows the URL can load it.
2. **Manual token entry.** Users must paste their IMS bearer token and org ID into a settings panel. Tokens expire after 24 hours and must be re-entered.
3. **Static `AEM_ADMIN_TOKEN`.** Helix Admin calls depend on a long-lived env var that must be manually rotated and re-deployed.

---

## Target State

- Users open the app and are prompted to **Sign in with Adobe** — one click, no copying tokens
- After login the app knows who they are (name, avatar, org) and auto-wires all action headers
- Backend actions use the **technical account (S2S OAuth)** for all Adobe API calls — no user token ever leaves the browser for Adobe-side operations
- Only users in the IMS org can load and use the app

---

## Two Deployment Contexts

### Context A — Embedded in Experience Cloud Shell (long-term home)
When the app is loaded via **Main Menu → Tools →  Client Name → Trailhead**, Adobe's shell injects IMS credentials automatically via the `exc-app` runtime. The existing `initRuntime()` callback in `index.js` already handles this — it receives `imsToken`, `imsOrg`, and `imsProfile` without any user action.

**Required work:** Ensure the app is registered as an App Builder extension in the Experience Cloud console. No auth UI changes needed for this path.

### Context B — Standalone URL (current testing path)
When accessed directly at `*.adobeio-static.net`, there is no shell to inject credentials. This requires an explicit IMS sign-in flow.

---

## Phase 1 — IMS PKCE Login Flow (Standalone)

**What:** Implement browser-side IMS OAuth PKCE (Proof Key for Code Exchange). This is the standard for single-page apps — no client secret in the browser, no server needed for the token exchange.

**New credential needed:** The current `IMS_OAUTH_S2S_CLIENT_ID` is a **machine-to-machine** credential and cannot be used for user login flows. A separate **OAuth Web App** or **OAuth Single Page App** credential must be created in the Adobe Developer Console for the same project.

### Flow

```
App loads → no token in localStorage
    ↓
Show "Sign in with Adobe" screen
    ↓
User clicks → generate PKCE code_verifier + code_challenge
    ↓
Redirect to: https://ims-na1.adobelogin.com/ims/authorize/v2
  ?client_id=<SPA_CLIENT_ID>
  &redirect_uri=<app_url>/callback
  &scope=openid,AdobeID,read_organizations
  &response_type=code
  &code_challenge=<challenge>
  &code_challenge_method=S256
    ↓
User signs in with Adobe credentials
    ↓
IMS redirects back to app with ?code=<auth_code>
    ↓
App POSTs to: https://ims-na1.adobelogin.com/ims/token/v3
  with code, code_verifier, client_id (no client_secret — PKCE)
    ↓
Receives: { access_token, expires_in, ... }
    ↓
GET https://ims-na1.adobelogin.com/ims/userinfo/v2
  Authorization: Bearer <access_token>
    ↓
Receives: { email, name, avatar, userId, projectedProductContext }
    ↓
Store token + org + profile in localStorage
App loads normally — no settings panel interaction needed
```

### Access Control via Org Check

After token exchange, fetch the user's org memberships and verify the Adobe org ID (`TODO`) is present. If not, show an "Access restricted" screen. This is a client-side guard — the backend action-level guard (below) is the authoritative one.

### Files to create/change
| File | Change |
|---|---|
| `web-src/src/auth.js` | New module — PKCE helpers, IMS redirect, token exchange, profile fetch, org check |
| `web-src/src/index.js` | On load: call `auth.ensureAuthenticated()` before rendering; replace settings panel token inputs with profile display; auto-call `getAuthHeaders()` from stored token |
| `web-src/index.html` | Add sign-in screen (hidden by default, shown when unauthenticated); update auth badge to show name + avatar |
| `web-src/src/wizard.js` | Same `auth.ensureAuthenticated()` gate |

### Token refresh
IMS access tokens expire in 24 hours. Store the expiry time alongside the token (`expires_at = Date.now() + expires_in * 1000`). On each `getAuthHeaders()` call, check expiry and redirect to re-auth if within 5 minutes of expiry.

---

## Phase 2 — Action-Level Org Allowlist

**What:** Each action validates that the request's `x-gw-ims-org-id` header matches the org. This is the authoritative access gate — it runs inside the trusted Adobe I/O Runtime environment regardless of how the frontend was accessed.

**Where:** `actions/utils.js` — new `assertAllowedOrg(params)` helper:

```js
const ALLOWED_ORG = 'B63321D5692DBE130A495FC5@AdobeOrg'

function assertAllowedOrg (params) {
  const org = (params.__ow_headers || {})['x-gw-ims-org-id']
  if (org !== ALLOWED_ORG) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
}
```

Call at the top of every action's `main()`:
```js
assertAllowedOrg(params)
```

This adds a hard server-side gate independent of the frontend flow.

---

## Phase 3 — Technical Account S2S Token in Actions

**What:** Replace the static `AEM_ADMIN_TOKEN` env var with on-demand S2S token generation inside each action. The action generates a fresh short-lived Adobe token using the technical account credentials already present in the env.

**Why:** Static tokens must be manually rotated. S2S OAuth tokens are generated on-demand, expire in 24 hours, and require no manual renewal.

### S2S token helper — `actions/utils.js`

```js
async function getS2SToken () {
  const res = await fetch('https://ims-na1.adobelogin.com/ims/token/v3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.IMS_OAUTH_S2S_CLIENT_ID,
      client_secret: process.env.IMS_OAUTH_S2S_CLIENT_SECRET,
      scope: 'openid,AdobeID,adobeio_api',
    }),
  })
  const { access_token } = await res.json()
  return access_token
}
```

### Usage in `create-site/index.js`

```js
// Replace:
const aemToken = params.AEM_ADMIN_TOKEN || process.env.AEM_ADMIN_TOKEN

// With:
const aemToken = await getS2SToken()
// Then pass to helixPut() as before
```

Remove `AEM_ADMIN_TOKEN` from `app.config.yaml` action inputs and from GitHub Secrets — it becomes unnecessary.

### Caching
S2S tokens are valid for 24 hours. Adobe I/O Runtime action containers can be reused across warm invocations. Store the token + expiry in a module-level variable and reuse it until 5 minutes before expiry, then regenerate. This avoids an IMS round-trip on every action call.

---

## Phase 4 — Remove Manual Token UI

Once Phases 1–3 are implemented:

- Remove `#ims-token-input` and `#ims-org-id-input` from the settings panel in `index.html`
- Remove `setupSettingsHandlers()` token-save logic in `index.js`
- Replace the auth badge with a user chip showing the signed-in user's name/avatar (from IMS profile)
- Keep the settings panel for GitHub owner/repo config only
- Keep `handleAuthError()` but redirect to re-auth instead of opening the settings panel

---

## Implementation Order

| Phase | Effort | Blocks |
|---|---|---|
| 2 — Org allowlist | 1 hour | Nothing — do first, zero risk |
| 3 — S2S token in actions | 2 hours | Needs new IMS scopes (`adobeio_api`) on the S2S credential |
| 1 — PKCE login flow | 1 day | Needs new OAuth SPA credential in Developer Console |
| 4 — Remove manual token UI | 2 hours | Needs Phase 1 complete |

### Prerequisites for Phase 1
1. In Adobe Developer Console → `EDSTaskrunner` project → add a new credential of type **OAuth Single Page App**
2. Set allowed redirect URI to the app's static URL: `TODO`
3. Note the new `client_id` — this is the SPA client ID used in the PKCE flow (different from the S2S client ID)

### Prerequisites for Phase 3
1. In the Developer Console → S2S credential → add scope `adobeio_api` (already present per the downloaded console.json — verify it covers Helix Admin calls)
2. Confirm the `IMS_OAUTH_S2S_CLIENT_ID` and `IMS_OAUTH_S2S_CLIENT_SECRET` env vars are present in `app.config.yaml` (they are via `$IMS_OAUTH_S2S_CLIENT_ID` etc.)

---

## What Does NOT Change

- `require-adobe-auth: true` on all actions stays — Adobe's gateway still validates every request
- GitHub calls continue using `APP_GITHUB_PAT` env var (correct pattern — this is a service credential, not user-delegated)
- `manage-tokens` I/O State action is unaffected
- EC Shell deployment path (`initRuntime`) is unaffected and already works correctly
