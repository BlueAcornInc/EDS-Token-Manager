# Enabling Trailhead RBAC (`AUTHZ_ENFORCE`)

By default Trailhead only requires a valid Adobe IMS login. **Role-based access
control is off** until you set `AUTHZ_ENFORCE=true` **and** create matching
Product Profiles in the Adobe Admin Console.

This guide is the runbook for turning enforcement on safely.

---

## What you get when enforcement is on

| Role (from IMS Product Profile) | Can do |
|---------------------------------|--------|
| **Administrator** | All brands; create/remove sites; save; publish; site-factory ops |
| **Brand Manager – {Brand}** | Read/write/publish **only** brands listed in their profile name(s) |
| **Viewer** | Read/list/preview only — no save, publish, create, or remove |
| **No matching profile** | **403** on every authorized action |

Enforcement is **server-side** (`actions/authz.js`). The UI may still show
controls until role-aware UI is shipped; the API will reject unauthorized calls.

---

## Prerequisites

1. Access to **Adobe Admin Console** (`adminconsole.adobe.com`) for your org
2. Access to the **Adobe Developer Console** App Builder project / workspace
   used by Trailhead (so you can set Runtime env vars and redeploy)
3. Ability to assign users to Product Profiles
4. A short maintenance window — users without a profile will lose access once
   you flip the flag

---

## Step 1 — Create Product Profiles (Admin Console)

In Admin Console → **Products** → your Experience Cloud / App Builder product
(or the product that owns Trailhead’s IMS entitlements) → **Product profiles**.

Create profiles with these **exact** display names (string match in code):

| Profile name | Who |
|--------------|-----|
| `EDS Token Manager - Administrator` | Platform / digital ops admins |
| `EDS Token Manager - Viewer` | Read-only stakeholders |
| `EDS Token Manager - Brand Manager - {slug}` | One profile **per brand** |

### Brand Manager naming rules

- `{slug}` is the brand slug Trailhead uses (same as `brands/{slug}` and state
  keys), **not** the marketing full name.
- Example: for brand `pepsi` create  
  `EDS Token Manager - Brand Manager - pepsi`
- The suffix is passed through `sanitiseBrandName` (lowercase, safe slug). Prefer
  creating the profile with the already-sanitised slug.
- Users can be in **multiple** Brand Manager profiles (one per brand).

> **Reuse existing AEM groups?** Possible only if those groups’ **exact names**
> match the strings above. Renaming Admin Console profiles is usually safer than
> changing code.

### Assign users

1. Open each profile → **Users** → add people (or map directory groups if your
   org uses that).
2. Give at least **two admins** the Administrator profile before enabling
   enforce (so you are not locked out of create/remove).
3. Assign Brand Managers **before** go-live so they do not get a blank 403.

**Role priority** when a user has several profiles:

1. Administrator (full access)
2. Else any Brand Manager profile(s) → brand-scoped write
3. Else Viewer → read-only
4. Else none → denied

---

## Step 2 — Confirm groups appear on the IMS token

After assignment, the user must **sign out / sign in** (or wait for token
refresh) so IMS includes the new groups.

Trailhead loads groups from:

```text
GET https://ims-na1.adobelogin.com/ims/profile/v1
Authorization: Bearer <user IMS token>
```

Expect `groups` (or `roles[].name`) to include the profile strings from Step 1.

**Quick check (local):**

1. Open Trailhead in Experience Cloud Shell while logged in as a test user.
2. In DevTools → Application / Local Storage, copy the IMS token if present, or
   use `aio auth token` for a developer identity.
3. Call the profile API with that Bearer token and confirm the group names.

If groups are missing, enforcement will treat the user as **none** (403).

---

## Step 3 — Set `AUTHZ_ENFORCE` and redeploy

`AUTHZ_ENFORCE` is injected into Runtime actions via `app.config.yaml` (`$AUTHZ_ENFORCE`).

### Local / `aio app run`

In `.env` (never commit):

```bash
AUTHZ_ENFORCE=true
```

Then restart:

```bash
aio app run
```

Accepted truthy values in code: `true`, `"true"`, `"1"`.

### Stage / production workspace

1. Set the secret/env var in the Adobe Developer Console workspace (or wherever
   you manage App Builder `.env` / CI secrets for this app):

   ```bash
   AUTHZ_ENFORCE=true
   ```

2. Redeploy so actions pick up the new input:

   ```bash
   aio app deploy
   ```

3. Confirm with `aio where` that you deployed the intended org/project/workspace.

### Rollback

Set `AUTHZ_ENFORCE=false` (or remove it) and redeploy. Authz immediately returns
allow-as-admin again. Product Profiles can stay in place for the next attempt.

---

## Step 4 — Verify by role

| Test as | Expect |
|---------|--------|
| Administrator | List all brands; save; publish; create-site; remove-brand; site-factory |
| Brand Manager – pepsi | Can save/publish `pepsi`; **403** on another brand’s save/publish |
| Viewer | Can get/list; **403** on save, publish, create, remove |
| User with no profile | **403** with message like `No Trailhead Product Profile assigned` |

Useful Runtime checks:

```bash
aio rt:activation:list --limit 20
aio rt:activation:logs <activationId>
```

Look for 403 bodies from `authorize()`.

---

## Permissions matrix (enforced)

| Operation | Admin | Brand Manager (assigned brand) | Viewer |
|-----------|-------|--------------------------------|--------|
| list / get / queue / launch-readiness / cf-matrix | yes | yes (scoped where brand applies) | yes |
| save / publish / rename / update-meta / repair | yes | yes (own brands) | no |
| create-site / remove-brand | yes | no | no |
| site-factory provision / batch-provision | yes | per op + brand rules | no |

Exact op names live in `READ_OPS` / `WRITE_OPS` in `actions/authz.js`.

---

## Known gaps (read before enabling)

As of current `main`:

1. **`list-sites` and `content-status` do not receive `AUTHZ_ENFORCE`** in
   `app.config.yaml` and do not call `authorize()`. Those endpoints remain
   “any authenticated IMS user” even when enforce is on. Prefer not exposing
   them broadly, or complete the Phase 1 authz wiring before org-wide enforce.
2. **UI is not role-aware yet** — Save/Publish/Create may still appear for
   viewers; the API rejects the call. Plan for support tickets until role-aware
   UI ships.
3. **Brand Manager slug must match** state/GitHub slug. A profile named
   `… Brand Manager - Pepsi Co` will not match brand `pepsi`.
4. **New brands** need a new Admin Console profile (or an admin to operate them)
   before Brand Managers can edit them under enforcement.

---

## Checklist

- [ ] Administrator profile created; ≥2 admins assigned
- [ ] Viewer profile created (if needed)
- [ ] Brand Manager profile per live brand slug; managers assigned
- [ ] Test users’ IMS profile API shows the expected group strings
- [ ] `AUTHZ_ENFORCE=true` set in the target workspace `.env` / secrets
- [ ] `aio app deploy` (or CI deploy) completed for that workspace
- [ ] Admin / brand-manager / viewer / no-profile smoke tests passed
- [ ] Rollback plan agreed (`AUTHZ_ENFORCE=false` + redeploy)

---

## Related docs

- Role design / feasibility: `documents/ENHANCEMENT_APPROACH.md`
- Code: `actions/authz.js`
- Env summary: root `README.md`
