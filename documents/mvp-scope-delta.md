# Trailhead MVP Scope Delta
*As of 2026-06-18 — based on refined MVP spec*

This document records everything currently implemented that is **out of scope for MVP launch**, and everything the MVP spec requires that is **not yet implemented**. All deferred items are retained in the codebase as dead-code with a `// POST-MVP:` comment for future activation.

---

## 1. New Site Wizard — Features to Remove

### 1a. Clone / Template Mode (entire mode)
**Currently:** Step 0 presents two mode cards — "Clone an existing site" and "Start blank". Clone mode fetches the existing site list, lets the user pick a template, and passes `templateSiteId` to the action.

**MVP:** "Start blank" only. The mode selection step is eliminated entirely; the wizard opens directly to Basics.

**Deferred to post-MVP:**
- Clone/template mode card UI
- `list-sites` action call on wizard load
- Template site radio list (`wiz-site-list`, `wiz-site-item`)
- `templateSiteId` field passed to `create-site`
- Cloned token inheritance logic in `create-site/index.js`

---

### 1b. Basics Step — Fields to Remove
**Currently:** 6 fields — Site name, Primary domain, Group, GitHub codebase, Default locale, AEM content root.

**MVP:** 2 fields only — **Site name** and **AEM content root**.

**Deferred to post-MVP:**
| Field | Notes |
|---|---|
| Primary domain | Required for Helix Admin registration; deferred while AEM_ADMIN_TOKEN is unavailable |
| Group | "Parks & Destinations" / "Collegiate Hospitality" / "Shared Fragments" |
| GitHub codebase | "parks-destinations-eds" / "collegiate-hospitality-eds" |
| Default locale | en-US, en-CA, es-US, fr-CA |

---

### 1c. Brand Styles Step — Fields to Remove
**Currently:** 5 controls — Brand preset (inherit / base / custom), Redirect strategy, Generate sitemap, Allow search engine indexing, plus a clone banner.

**MVP:** 1 control — **Brand Starting Point**, two options only:
- **Start from Blueprint** — seeds tokens from the unbranded blueprint site (maps to current `brandPreset: 'base'`)
- **Start from Scratch** — no tokens set (maps to current `brandPreset: 'inherit'` with no template)

**Terminology change:** Rename "inherit" → "Start from Blueprint" and "base" → "Start from Scratch" in both the wizard UI and action payload.

**Deferred to post-MVP:**
| Control | Notes |
|---|---|
| Redirect strategy | inherit / none / custom |
| Generate sitemap.xml automatically | `sitemapEnabled` param |
| Allow search engine indexing | `robotsIndexable` param |
| "Custom" brand preset option | Requires additional token cloning UI |

---

### 1d. Content & Access Step — Entire Step Removed
**Currently:** Step 3 covers initial authors/groups (comma-separated AEM emails), starter content summary, and a launch checklist checkbox.

**MVP:** This step does not exist.

**Deferred to post-MVP:**
- Authors/groups field (`authors` param in `create-site`)
- Starter content provisioning logic
- Launch checklist GitHub issue creation (`launchChecklist` param)
- `wiz-content-box` UI component
- `wiz-checkbox-label` checklist checkbox

---

### 1e. Review Step — Simplified
**Currently:** Shows 9 review rows (Site, Domain, Group, Codebase, AEM root, Locale, Brand, Redirect strategy, Authors) plus a full artifacts grid (GitHub branch, tokens, site.json, blocks, sitemap, checklist, Helix/AEM config rows).

**MVP:** Review rows reduced to match remaining fields: **Site name**, **AEM content root**, **Brand starting point** only. Artifacts grid simplified to show only: GitHub branch + tokens file + site.json.

---

## 2. `create-site` Action — Parameters to Stub Out

The following params should be accepted but ignored (or defaulted) in the MVP action, preserved in the function signature for post-MVP activation:

| Param | MVP behaviour | Post-MVP |
|---|---|---|
| `domain` | Ignored; Helix Admin calls skipped | Register site with Helix Admin |
| `group` | Defaulted to `"Parks & Destinations"` | Wizard-selectable |
| `codebase` | Defaulted to `""` | Wizard-selectable |
| `locale` | Defaulted to `"en-US"` | Wizard-selectable |
| `templateSiteId` | Ignored | Clone token CSS from template site |
| `redirectStrategy` | Defaulted to `"inherit"` | Wizard-selectable |
| `sitemapEnabled` | Defaulted to `true` | Wizard checkbox |
| `robotsIndexable` | Defaulted to `false` | Wizard checkbox |
| `authors` | Ignored | Set AEM author permissions |
| `launchChecklist` | Defaulted to `false` | Open GitHub issue with checklist |

The Helix Admin registration calls (`helixPut` to `/config`, `/config/.../content-source`, `/config/.../sidekick`) are already gated behind `AEM_ADMIN_TOKEN`. This gate is sufficient for MVP; no additional changes needed there.

---

## 3. Token Schema — Items to Add for MVP

The MVP spec includes **2 color tokens not currently in `token-schema.json`**:

| Token | CSS Variable | Notes |
|---|---|---|
| Site Background color | `--surface-bg-cream` | Default: `#f0efed` (from root-tokens) |
| Dark Background color | `--surface-dark-1` | No default defined in root-tokens; placeholder needed |

These need to be added to the `colors` group in `config/token-schema.json` and surfaced in the token editor UI and `tokensToCSS()` output.

---

## 4. Token Editor (Main Interface) — No Removals

The 4-group token editor (Colors, Typography, CTA, Logo) aligns with the MVP spec, with the addition of the 2 new tokens above. No features need to be removed from the editor panel.

The action bar (Save, Export CSS, Request Release to Staging) aligns exactly.

---

## 5. Post-MVP Feature Backlog Summary

| Feature | Effort | Dependency |
|---|---|---|
| Clone/template site mode in wizard | Medium | `list-sites` action (already built) |
| Domain field + Helix Admin registration | Low | `AEM_ADMIN_TOKEN` provisioned |
| Group + codebase selection | Low | None |
| Locale selection | Low | None |
| Redirect strategy | Low | None |
| Sitemap / robots controls | Low | None |
| Authors / AEM access provisioning | Medium | AEM API access |
| Launch checklist GitHub issue | Low | `launchChecklist` param (already built) |
| Custom brand preset (clone tokens from any site) | Medium | Template site token API |
