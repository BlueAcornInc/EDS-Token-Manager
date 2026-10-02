# Trailhead — Phase 1 (Site Creation + Brand Token Manager)

This folder is a design reference for Phase 1 of Trailhead, an internal
Adobe App Builder control plane for a repoless EDS "site factory" (30+
Aramark Parks & Destinations / Collegiate Hospitality sites on a shared
Helix 5 instance, each with independent dev/staging/production
environments).

**These `.jsx` files are visual/interaction prototypes, not production
code.** They use inline styles and fake/hardcoded data for portability as
standalone mockups. Treat them like an interactive Figma file: a reference
for layout, states, copy, and behavior — not something to import directly
into the real app. Re-derive them as proper components against the real
component library and a real backend before shipping.

## What's in this folder

```
trailhead-phase1/
├── README.md                          (this file)
├── design-tokens.css                  canonical token source
└── screens/
    ├── new-site-wizard.jsx            site creation flow
    └── brand-token-manager.jsx        brand token editor + release flow
```

## Why these two screens are Phase 1

Standing up a new site and giving it a brand are the two things that have
to work before anything else in Trailhead matters. Site health monitoring,
icon governance, and the Universal Editor icon picker (Phase 2+) all
assume sites already exist and have a brand applied. This is the minimum
viable slice.

---

## Screen: New Site Wizard (`screens/new-site-wizard.jsx`)

**Job:** Stand up a new site on the shared repoless Helix 5 instance
without anyone hand-editing config.

**Flow:** 5 steps — Start → Basics → Brand & domain → Content & access →
Review.

- **Start** — clone an existing site (inherits brand, blocks, icons,
  redirects; presented as the recommended path given 30+ similar
  properties) or start blank.
- **Basics** — site name, primary domain, group (`Parks & Destinations` /
  `Collegiate Hospitality` / `Shared Fragments`), GitHub codebase, locale,
  AEM content root.
- **Brand & domain** — brand starting point (inherit / base / custom),
  redirect strategy, sitemap + robots config. Search-engine indexing
  defaults to **off** — a deliberate safety rail, not an oversight.
- **Content & access** — initial authors/groups, a summary of what gets
  inherited when cloning, optional launch-checklist issue.
- **Review** — splits "what you configured" from "what gets created,"
  itself split into GitHub artifacts vs. Helix5/AEM artifacts. Explicitly
  states new sites land in **dev only**; promotion to staging/production
  is a separate action elsewhere in the app, not part of this flow.

### Data contract this screen needs from the backend
```
NewSiteRequest = {
  mode: "template" | "blank",
  templateSiteId?: string,        // if mode === "template"
  siteName: string,                // becomes internal identifier, lowercase-hyphenated
  domain: string,
  group: "Parks & Destinations" | "Collegiate Hospitality" | "Shared Fragments",
  codebase: string,                 // which shared GitHub repo
  locale: string,
  aemRoot: string,
  brandPreset: "inherit" | "base" | "custom",
  redirectStrategy: "inherit" | "none" | "custom",
  sitemapEnabled: boolean,
  robotsIndexable: boolean,
  authors: string,                  // comma-separated emails or AEM group names
  launchChecklist: boolean
}
```

### Open decision — not yet resolved, flag before building
Does cloning copy the **source site's actual redirects**, or always start
from the group-level default redirect rules? The prototype currently
defaults the redirect strategy to "inherit group rules," not "inherit from
the specific site being cloned" — these are different behaviors and the
UI doesn't yet distinguish them clearly. Confirm intended behavior before
implementing.

### Other things to confirm before estimating
- What "clone" actually copies is asserted in the UI copy (block registry,
  icon set, page templates) but there's no real cloning mechanism behind
  it in the prototype — this needs an actual content/config copy operation
  against the Admin API / GitHub, not just a UI claim.
- "Create site" on the Review step has no real action wired up — it needs
  to call whatever orchestration actually creates the GitHub branch, the
  Helix 5 site config (via the Configuration Service API), and the launch
  checklist issue.

---

## Screen: Brand Token Manager (`screens/brand-token-manager.jsx`)

**Job:** Let a site owner edit controlled brand tokens (color, typography,
spacing, radius) and see the effect on real components before requesting
a release.

**Layout:** token list on the left, grouped by category, each token
showing how many components it `affects`. Live component preview on the
right (hero, card grid, all 4 button variants, form field, alert banner)
driven by the same token values via CSS custom properties — not
screenshots. Light/dark theme toggle in the preview pane.

**Flow:** edit tokens → preview updates immediately → click "Request
release to staging" → diff modal shows old value → new value per changed
token plus affected components → confirm → toast confirmation.

### Key rule — already decided, do not relitigate
**"Request release to staging" always targets the staging branch**,
regardless of which environment is selected anywhere else in the app.
There is no path from this screen to push directly to production.

This is also a **copy/microcopy decision, not just a UI label**: all
user-facing text avoids Git vocabulary ("PR," "diff," "merge") in favor of
release-workflow language a site owner recognizes — "Request release to
staging," "Release requested," "awaiting review." The underlying
mechanism (almost certainly a GitHub PR under the hood) should stay an
implementation detail invisible to the user.

### Data contract this screen needs from the backend
```
Token = {
  key: string,        // must match the actual SCSS/CSS variable name in the repo
  label: string,       // human-readable, shown in UI
  value: string,
  affects: string[]    // component names — see open question below
}
```
Grouped into categories: `color`, `typography`, `spacing`, `radius`.

### Open decisions — not yet resolved, flag before building
- **Where does `affects` actually come from?** In the prototype it's a
  hardcoded list per token. In the real system this probably needs to be
  derived from a block registry (a Phase 2+ concept) rather than
  hand-maintained — if the block registry doesn't exist yet, this screen
  has an implicit dependency that needs sequencing.
- **No validation is represented.** The prototype assumes every edit is
  valid (any hex value, any font string). Real implementation needs
  schema validation (valid hex, font in an approved list, etc.) before the
  release-request action is even enabled.
- **Multi-site brand inheritance** (base-brand → corporate-brand → site
  overrides) is explicitly out of scope for this prototype — it's
  single-site only. Decide whether that's a Phase 1 requirement or a
  fast-follow; the wizard's "Brand starting point: inherit" option assumes
  *some* per-site token store exists, but doesn't assume an inheritance
  chain.

---

## Shared dependency between the two screens

Both screens need to read from **the same token schema and the same
release-to-staging mechanism** — build that data contract and release
flow once, not twice. The wizard's "Brand starting point" step and the
Token Manager's edit screen should ultimately read from and write to the
same underlying token store, not two parallel implementations.

## Design tokens (`design-tokens.css`)

Canonical CSS custom properties referenced by both screens — colors,
typography, spacing, radius, elevation, plus the status-color and
environment-color conventions used consistently across all of Trailhead
(not just these two screens). Both `.jsx` prototypes currently duplicate
these values inline for portability; the real build should import from
one shared source instead of letting each screen's implementation drift.

## Explicitly out of scope for Phase 1

Icon governance (admin registry + pending-review queue), the Universal
Editor icon picker, the site health / drift dashboard, redirect /
metadata / block-registry tooling, and multi-site brand inheritance are
all later-phase work and intentionally not included in this folder.
