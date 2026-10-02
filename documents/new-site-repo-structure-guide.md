# New Site: TODO Repo Structure Guide
*What the `create-site` action creates and updates in the TODO EDS codebase*

## Context

When a user creates a new site in Trailhead, the `create-site` action writes to **TODO* (the shared EDS codebase repo), not the Trailhead app repo. TODO is the repoless EDS "factory" — all brand sites share the same JavaScript codebase, differentiated by brand directories under `/brands/`.

---

## Files Created Per New Site

Given a new site named `acme-park`, the action creates:

```
brands/
  acme-park/
    tokens.css              ← brand CSS custom properties
    overrides.js            ← declares any brand-specific block overrides
    cf-overlay-paths.json   ← maps AEM content fragment paths to URL routes
    README.md               ← human reference (optional but recommended)
  acme-park-dev/
    cf-overlay-paths.json   ← dev CF path overrides (usually same as prod initially)
  acme-park-staging/
    cf-overlay-paths.json   ← staging CF path overrides
```

One file outside `brands/` is also updated:

```
scripts/
  dev-brand.js              ← add entry to BRAND_URLS map
```

---

## File Contents

### `brands/acme-park/tokens.css`

Generated from the Trailhead wizard token selections. Uses the schema in `config/token-schema.json` to map token values to CSS custom properties:

```css
/* ==========================================================================
   Acme Park — Brand Design Tokens
   Overrides root-tokens.css for the Acme Park brand site.
   ========================================================================== */

:root {
  /* Colors */
  --color-primary:           #<wizard value>;
  --color-secondary:         #<wizard value>;
  --color-tertiary:          #<wizard value>;
  --color-header-background: #<wizard value>;
  --surface-bg-cream:        #<wizard value>;
  --surface-dark-1:          #<wizard value>;

  /* Typography — H1 */
  --h1-font-weight: <wizard value>;
  --h1-font-style:  <wizard value>;
  --h1-line-height: <wizard value>;

  /* CTA / Buttons */
  --cta-font-weight:    <wizard value>;
  --cta-letter-spacing: <wizard value>;
  --cta-text-transform: <wizard value>;

  /* Logo sizing */
  --brand-logo-width-mobile:   <wizard value>;
  --brand-logo-height-mobile:  <wizard value>;
  --brand-logo-width-desktop:  <wizard value>;
  --brand-logo-height-desktop: <wizard value>;
}
```

When `brandPreset` is `base` (Start from Blueprint), tokens default to Lake Powell values. When `inherit`, tokens are left for the brand to override later.

---

### `brands/acme-park/overrides.js`

Declares which blocks have brand-specific JS or CSS. Starts empty — edited later by developers as brand customization grows:

```js
// Block names listed here load from brands/acme-park/blocks/{name}/{name}.js
// instead of the shared /blocks/{name}/{name}.js
// Add a block name to `css` to also load brands/acme-park/blocks/{name}/{name}.css
export default {
  js: [],
  css: [],
};
```

---

### `brands/acme-park/cf-overlay-paths.json`

Maps AEM Content Fragment paths to URL routes for CF-driven components (detail pages, card lists, carousels, etc.). Starts empty — filled in as content is structured in AEM:

```json
{
  "detail": {},
  "card": {},
  "carousel-card": {},
  "comparison": {},
  "map-item": {}
}
```

---

### `brands/acme-park-dev/cf-overlay-paths.json` and `brands/acme-park-staging/cf-overlay-paths.json`

Same shape as the production file. Initially identical. Dev and staging directories exist so developers can point CF paths at AEM dev/stage content without touching prod:

```json
{
  "detail": {},
  "card": {},
  "carousel-card": {},
  "comparison": {},
  "map-item": {}
}
```

---

### `scripts/dev-brand.js` — BRAND_URLS update

The `BRAND_URLS` map controls which AEM preview URL the local dev server uses when running `pnpm start:brand acme-park`. The action appends the new brand:

```js
// Before
const BRAND_URLS = {
  'lake-powell': 'https://main--lake-powell--aramark-destinations.aem.page',
  unbranded: 'https://main--unbranded--aramark-destinations.aem.page',
};

// After
const BRAND_URLS = {
  'lake-powell': 'https://main--lake-powell--aramark-destinations.aem.page',
  'acme-park':   'https://main--ap--aramark-destinations.aem.page',
  unbranded: 'https://main--unbranded--aramark-destinations.aem.page',
};
```

The EDS preview site segment is the wizard's **EDS site code**, not necessarily the
brand folder slug. Trailhead stores it in `site.json` and `brand.{slug}.meta.siteCode`.
The wizard derives initials from the site name by default, but a site code can be entered
or changed later. For example, `acme-park` with site code `ap` previews at
`https://main--ap--aramark-destinations.aem.page`.

Release branches use `TB-{brand-slug}-{sequence}` (for example,
`TB-ACME-PARK-1`). Their preview URLs follow
`https://{branch}--{site-code}--{github-owner}.aem.page/`; both the branch and the
site-code segment are distinct from the GitHub repository name. The branch segment is
lowercased in the hostname, so `TB-ACME-PARK-1` appears as `tb-acme-park-1`.

---

## What Does NOT Change

The following are untouched by `create-site`:

| File | Why |
|---|---|
| `config/cdn.yaml` | CDN rules are global, not brand-specific |
| `config/edgeFunctions.yaml` | Edge function wiring is global |
| `scripts/site-resolver.js` | Brand detection logic is generic — picks up any `/brands/{name}/` directory automatically |
| `scripts/scripts.js` | Runtime brand loading is generic |
| `blocks/` | Shared blocks need no changes for a new brand |
| `fstab.yaml` / `paths.yaml` | Do not exist in this repo |

Brand detection is fully runtime: the EDS page's AEM metadata `brand` field sets the active brand. No config file registration is needed.

---

## Naming Convention

The site name entered in the Trailhead wizard becomes the brand directory slug directly:

| Wizard field | Example value | Used as |
|---|---|---|
| Site name | `Acme Park` | Slugified: `acme-park` |
| Brand directory | — | `brands/acme-park/` |
| Dev directory | — | `brands/acme-park-dev/` |
| Staging directory | — | `brands/acme-park-staging/` |
| EDS site code | `ap` | `ap` |
| AEM preview URL | — | `main--ap--aramark-destinations.aem.page` |

Slugification rule: lowercase, spaces → hyphens, remove special characters.

---

## GitHub API Calls the `create-site` Action Makes

All writes go to the aramark-mb repo via the GitHub Contents API. The action authenticates with a **GitHub App installation token** (`getInstallationToken` using `GITHUB_APP_ID` / `GITHUB_APP_PRIVATE_KEY` / `GITHUB_APP_INSTALLATION_ID`).

| Operation | GitHub API call |
|---|---|
| Create `brands/acme-park/tokens.css` | `PUT /repos/{owner}/{repo}/contents/brands/acme-park/tokens.css` |
| Create `brands/acme-park/overrides.js` | `PUT /repos/{owner}/{repo}/contents/brands/acme-park/overrides.js` |
| Create `brands/acme-park/cf-overlay-paths.json` | `PUT /repos/{owner}/{repo}/contents/brands/acme-park/cf-overlay-paths.json` |
| Create `brands/acme-park/README.md` | `PUT /repos/{owner}/{repo}/contents/brands/acme-park/README.md` |
| Create `brands/acme-park-dev/cf-overlay-paths.json` | `PUT /repos/{owner}/{repo}/contents/brands/acme-park-dev/cf-overlay-paths.json` |
| Create `brands/acme-park-staging/cf-overlay-paths.json` | `PUT /repos/{owner}/{repo}/contents/brands/acme-park-staging/cf-overlay-paths.json` |
| Update `scripts/dev-brand.js` | `GET` current content → parse → append entry → `PUT` with updated SHA |

The current actions create working branches from `staging` and open pull requests targeting
`staging`; neither writes these site changes directly to `main`.

---

## Current vs Required `create-site` Implementation

The current action only creates `tokens.css` and `site.json`. The full implementation needs to add:

| Missing | Priority |
|---|---|
| `overrides.js` creation | MVP — required for brand loading to work |
| `cf-overlay-paths.json` creation (prod + dev + staging) | MVP — required; site-resolver.js imports this file |
| `dev-brand.js` update | MVP — required for local dev workflow |
| `README.md` creation | Post-MVP — nice to have, not functional |

`site.json` creation should be kept; it stores brand metadata referenced by site-resolver.js.
