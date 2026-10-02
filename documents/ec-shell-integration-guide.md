# Experience Cloud Shell Integration Guide
*Trailhead App — single Production deployment, GH CLI setup*

## Overview

Trailhead is **environment agnostic** — it writes to the GitHub repo and doesn't have environment-specific configs of its own. It lives in one place: the **Production workspace** in the Developer Console, published once to the EC Shell.

The app already has all the runtime plumbing (`exc-runtime.js`, `@adobe/exc-app`, `initRuntime()`). Once deployed as a registered extension, the shell auto-injects IMS credentials. No token entry needed.

---

## What was just changed in this repo

`app.config.yaml` now declares the extension:

```yaml
extensions:
  dx/excshell/1:
    $include: src/dx-excshell-1/ext.config.yaml
```

Two new files were created:
- `src/dx-excshell-1/ext.config.yaml` — extension manifest (entry point, actions, runtime manifest)
- `src/dx-excshell-1/package.json` — shell metadata (title, description shown in the menu)

The existing `application:` block remains in `app.config.yaml` as a fallback for local `aio app run`.

---

## Step 1 — Create the Production Workspace (Developer Console UI)

The shell extension must be deployed to a **Production** workspace. This step has to be done in the browser — `aio` CLI cannot create workspaces.

1. Go to [developer.adobe.com/console](https://developer.adobe.com/console) → your project (`EDSTaskrunner`)
2. Click **Add workspace** → **Production**
3. Name it `Production`
4. Inside the Production workspace, click **Add service → API**
5. Add **I/O Management API** (same as Test workspace)
6. Click **Generate key pair** → create an **OAuth Server-to-Server** credential
7. **Download** the workspace JSON (`console.json`) — you'll need values from it in the next step

---

## Step 2 — Set GitHub Secrets via GH CLI

With the downloaded `console.json` open, set the Production secrets on the repo. These mirror the `*_STAGE` secrets from the Test workspace setup.

```bash
REPO="TODO"

# From the Production workspace console.json → project → workspace
gh secret set CLIENTID_PROD              --repo $REPO --body "<client_id>"
gh secret set CLIENTSECRET_PROD          --repo $REPO --body "<client_secret>"
gh secret set TECHNICALACCID_PROD        --repo $REPO --body "<technical_account_id>"
gh secret set TECHNICALACCEMAIL_PROD     --repo $REPO --body "<technical_account_email>"
gh secret set IMSORGID_PROD              --repo $REPO --body "<ims_org_id>"

# Runtime namespace and auth from the Production workspace
gh secret set AIO_RUNTIME_NAMESPACE_PROD --repo $REPO --body "<namespace>"
gh secret set AIO_RUNTIME_AUTH_PROD      --repo $REPO --body "<auth>"

# Project/workspace IDs (from console.json)
gh secret set AIO_PROJECT_ID_PROD                    --repo $REPO --body "<project_id>"
gh secret set AIO_PROJECT_NAME_PROD                  --repo $REPO --body "EDSTaskrunner"
gh secret set AIO_PROJECT_ORG_ID_PROD                --repo $REPO --body "<org_id>"
gh secret set AIO_PROJECT_WORKSPACE_ID_PROD          --repo $REPO --body "<workspace_id>"
gh secret set AIO_PROJECT_WORKSPACE_NAME_PROD        --repo $REPO --body "Production"
gh secret set AIO_PROJECT_WORKSPACE_DETAILS_SERVICES_PROD --repo $REPO \
  --body '[{"code":"AdobeIOManagementAPISDK","name":"I/O Management API"}]'

# Scopes — copy from SCOPES_STAGE, they are the same
gh secret set SCOPES_PROD --repo $REPO --body "<scopes string from SCOPES_STAGE>"
```

To verify all secrets are set:
```bash
gh secret list --repo TODO
```

---

## Step 3 — Add the Production Deploy Workflow

Create `.github/workflows/deploy_prod.yml`:

```yaml
name: AIO App CI — Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm i
      - uses: adobe/aio-cli-setup-action@1.3.0
        with:
          os: ubuntu-latest
          version: 11.x.x
      - uses: adobe/aio-apps-action@3.3.0
        with:
          os: ubuntu-latest
          command: oauth_sts
          CLIENTID: ${{ secrets.CLIENTID_PROD }}
          CLIENTSECRET: ${{ secrets.CLIENTSECRET_PROD }}
          TECHNICALACCOUNTID: ${{ secrets.TECHNICALACCID_PROD }}
          TECHNICALACCOUNTEMAIL: ${{ secrets.TECHNICALACCEMAIL_PROD }}
          IMSORGID: ${{ secrets.IMSORGID_PROD }}
          SCOPES: ${{ secrets.SCOPES_PROD }}
      - uses: adobe/aio-apps-action@3.3.0
        with:
          os: ubuntu-latest
          command: build
        env:
          AIO_RUNTIME_NAMESPACE: ${{ secrets.AIO_RUNTIME_NAMESPACE_PROD }}
      - uses: adobe/aio-apps-action@3.3.0
        with:
          os: ubuntu-latest
          command: deploy
        env:
          AIO_RUNTIME_NAMESPACE: ${{ secrets.AIO_RUNTIME_NAMESPACE_PROD }}
          AIO_RUNTIME_AUTH: ${{ secrets.AIO_RUNTIME_AUTH_PROD }}
          AIO_PROJECT_ID: ${{ secrets.AIO_PROJECT_ID_PROD }}
          AIO_PROJECT_NAME: ${{ secrets.AIO_PROJECT_NAME_PROD }}
          AIO_PROJECT_ORG_ID: ${{ secrets.AIO_PROJECT_ORG_ID_PROD }}
          AIO_PROJECT_WORKSPACE_ID: ${{ secrets.AIO_PROJECT_WORKSPACE_ID_PROD }}
          AIO_PROJECT_WORKSPACE_NAME: ${{ secrets.AIO_PROJECT_WORKSPACE_NAME_PROD }}
          AIO_PROJECT_WORKSPACE_DETAILS_SERVICES: ${{ secrets.AIO_PROJECT_WORKSPACE_DETAILS_SERVICES_PROD }}
          GITHUB_APP_ID: ${{ secrets.APP_GITHUB_APP_ID }}
          GITHUB_APP_PRIVATE_KEY: ${{ secrets.APP_GITHUB_APP_PRIVATE_KEY }}
          GITHUB_APP_INSTALLATION_ID: ${{ secrets.APP_GITHUB_APP_INSTALLATION_ID }}
          GITHUB_OWNER: ${{ secrets.APP_GITHUB_OWNER }}
          GITHUB_REPO: ${{ secrets.APP_GITHUB_REPO }}
```

**Key difference from staging:** no `noPublish` flag. Without it, `aio app deploy` registers the extension with the EC Shell in addition to deploying the runtime actions. The staging workflow keeps `noPublish` so test deploys never appear in the shell.

---

## Step 4 — Approve the Extension (Developer Console)

After the first Production deploy completes:

1. Go to the Developer Console → `EDSTaskrunner` project → **Production** workspace
2. Find the **App Builder App** section
3. Click **Submit for review** if prompted, or click **Approve / Publish** directly
   - Internal org apps typically allow self-approval
4. Status changes to **Published**

---

## Step 5 — Assign Users (Adobe Admin Console)

The app only appears in the EC Shell menu for users assigned to it.

1. Go to [adminconsole.adobe.com](https://adminconsole.adobe.com) → **Products**
2. Find **EDSTaskrunner** (the App Builder product)
3. Open or create a product profile (e.g. "Trailhead Users")
4. Add users or groups who should see Trailhead

Users see **Trailhead** in the EC Shell menu under **Main Menu → Tools** on their next login.

---

## Step 6 — Verify Auth is Working

Once a user loads the app through the EC Shell:

1. `exc-runtime.js` confirms the iframe is hosted by `experience.adobe.com`
2. `initRuntime()` fires and receives `{ imsToken, imsOrg, imsProfile }` from the shell
3. Stored automatically in localStorage — no user action needed
4. All action calls go out with the correct `Authorization` and `x-gw-ims-org-id` headers
5. The settings panel no longer needs to be touched for auth

---

## Workspace Summary

| Workspace | Triggered by | Published to shell | Purpose |
|---|---|---|---|
| Test | push to `staging` branch | No (`noPublish`) | Developer testing |
| Production | push to `main` | Yes | Live, used by client team |

Dev and Stage workspaces in the console are available but Trailhead doesn't need them — the app has no environment-specific configuration of its own. The staging CI deploy to the Test workspace is the R&D path; Production is the single live deployment.
