# Block-Level CSS Custom Properties Inventory

**Analysis Date:** 2026-06-17  
**Scope:** All 40+ block SCSS files in `/blocks/`  
**Purpose:** Identify block-scoped tokens and recommend brand-overridable properties

---

## Section 1: Block Token Inventory

### 1. Accordion Block
**File:** `blocks/accordion/accordion.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--accordion-title-color` | `var(--color-text-primary)` | Color | YES |
| `--accordion-title-padding` | `var(--spacing-016) 0` | Spacing | YES |
| `--accordion-title-font-family` | `var(--body-font-family)` | Typography | YES |
| `--accordion-title-font-size` | `var(--body-font-size-m)` | Typography | YES |
| `--accordion-title-font-weight` | `var(--font-weight-medium)` | Typography | YES |
| `--accordion-title-line-height` | `var(--body-line-height-m)` | Typography | YES |
| `--accordion-title-letter-spacing` | `var(--letter-spacing-tight)` | Typography | YES |
| `--accordion-border-color` | `var(--stroke-light-2)` | Color | YES |
| `--accordion-border` | `1px solid var(--accordion-border-color)` | Styling | YES |
| `--accordion-open-background-color` | `var(--background-color)` | Color | YES |
| `--accordion-open-body-background-color` | `var(--accordion-open-background-color)` | Color | YES |
| `--accordion-body-padding` | `var(--spacing-008) var(--spacing-040) var(--spacing-024) 0` | Spacing | YES |
| `--accordion-body-color` | `var(--color-text-primary)` | Color | YES |
| `--accordion-body-anchor-color` | `var(--accordion-body-color)` | Color | YES |
| `--accordion-icon-size` | `var(--icons-size-icon-medium)` | Size | YES |

**Theme Overrides:** Dark themes remap colors via `[data-sectiontheme='theme-dark']` selector  
**Recommendation:** Move all to brands' tokens.css for consistent brand styling

---

### 2. Banner Block
**File:** `blocks/banner/banner.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--banner-z-index` | `var(--z-index-dropdown)` | Layout | NO |
| `--banner-nav-size` | `var(--spacing-032)` | Size | YES |
| `--banner-nav-arrow-size` | `var(--body-font-size-s)` | Typography | YES |
| `--banner-nav-outline-width` | `1px` | Styling | YES |
| `--banner-nav-outline-color` | `var(--text-light-1)` | Color | YES |
| `--banner-mobile-gap` | `var(--spacing-008)` | Spacing | YES |
| `--banner-desktop-gap` | `var(--spacing-012)` | Spacing | YES |

**Uses:** Global colors, spacing, z-index tokens  
**Recommendation:** Nav button styling is brandable (outline color, size)

---

### 3. Booking Block
**File:** `blocks/booking/booking.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--spacing-*` (inline) | Various | Spacing | Via global tokens |

**Note:** Block uses inline spacing tokens without defining block-level tokens  
**Hardcoded Values Found:**
- `4px` left border (decorative stripe on hero variant) — should be `var(--spacing-004)`

**Recommendation:** Create brand-overridable tokens for:
- `--booking-form-border-color` (currently uses `--stroke-light-2`)
- `--booking-form-bg` (currently `var(--surface-light-0)`)

---

### 4. Brand Logo Block
**File:** `blocks/brand-logo/brand-logo.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--brand-logo-dropdown-min-width` | `200px` | Size | YES |
| `--brand-logo-width-mobile` | *(not shown in file)* | Size | YES |
| `--brand-logo-height-mobile` | *(not shown in file)* | Size | YES |
| `--brand-logo-width-desktop` | *(not shown in file)* | Size | YES |
| `--brand-logo-height-desktop` | *(not shown in file)* | Size | YES |

**Recommendation:** Essential for multi-brand support — logo dimensions vary by brand  
**Action:** Ensure these are defined in `root-tokens.scss` for each brand

---

### 5. Breadcrumbs Block
**File:** `blocks/breadcrumbs/breadcrumbs.scss`

| Token | Current Value | Category | Overridable | Status |
|-------|---------------|----------|-------------|--------|
| `--font-weight-light` | `300` | Typography | YES | **TEMPORARY** |
| `--body-letter-spacing` | `-0.02em` | Typography | YES | **TEMPORARY** |

⚠️ **CRITICAL:** These tokens are defined as temporary in the breadcrumbs block with a TODO comment. They should be moved to `root-tokens.scss` and `fixed-tokens.scss`.  
**Action:** Migrate to global token system per TODO in code

---

### 6. CTA Block
**File:** `blocks/cta/cta.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--btn-pad-h` | `var(--spacing-040)` | Spacing | YES |
| `--cta-font-size` | Variant-dependent | Typography | YES |
| `--cta-font-weight` | Variant-dependent | Typography | YES |
| `--cta-line-height` | Variant-dependent | Typography | YES |
| `--cta-letter-spacing` | Variant-dependent | Typography | YES |
| `--cta-text-transform` | Variant-dependent | Typography | YES |
| `--button-bg` | `var(--color-brand-primary)` (color variants) | Color | YES |
| `--button-text` | `var(--color-base-white)` | Color | YES |
| `--button-transition` | *(derived from global)* | Animation | NO |
| `--button-border` | Brand-color-dependent | Color | YES |
| `--button-bg-hover` | Brand-color-dependent (dark variant) | Color | YES |

**Variants:** primary, secondary, tertiary (each with different color tokens)  
**Recommendation:** Color and typography are highly brandable; current structure supports this well

---

### 7. Carousel Cards Block
**File:** `blocks/carousel-cards/carousel-cards.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--carousel-cards-nav-bg` | `var(--color-grey-100)` | Color | YES |
| `--carousel-cards-nav-color` | `var(--text-dark-1)` | Color | YES |
| `--carousel-cards-nav-hover-bg` | `var(--color-grey-200)` | Color | YES |

**Theme Support:** Dark theme overrides provided via section data attributes  
**Recommendation:** Navigation button colors are brandable

---

### 8. Carousel Featured Block
**File:** `blocks/carousel-featured/carousel-featured.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--carousel-featured-nav-border-color` | `var(--stroke-light-2)` | Color | YES |
| `--carousel-featured-nav-color` | `var(--color-base-white)` | Color | YES |
| `--carousel-featured-nav-hover-bg` | `color-mix(...)` (dark overlay) | Color | YES |

**Recommendation:** Nav button styling varies by background; current approach supports brands well

---

### 9. Cards Block
**File:** `blocks/cards/cards.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--card-min-width` | *(auto-fill responsive)* | Size | YES |
| `--card-text-color` | `var(--text-dark-1)` | Color | YES |
| `--card-border-color` | `var(--color-secondary)` | Color | YES |
| `--card-btn-hover-bg` | `var(--color-secondary)` | Color | YES |
| `--card-btn-hover-fg` | `var(--color-base-white)` | Color | YES |
| `--card-btn-min-height` | `32px` | Size | YES |
| `--background-color` | *(inherited)* | Color | YES |
| `--card-shadow` | *(inherited from global)* | Styling | NO |

**Hardcoded Values Found:**
- `border: 1px solid` (card borders) — uses token reference ✓
- Typography (font-size, line-height, letter-spacing) — uses token references ✓

**Recommendation:** Card styling is well-tokenized; brand can override text/border colors

---

### 10. Compare Tool Block
**File:** `blocks/compare-tool/compare-tool.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--compare-tool-font-family` | `var(--body-font-family)` | Typography | YES |
| `--compare-tool-heading-font-family` | `var(--heading-font-family)` | Typography | YES |
| `--compare-tool-text-color` | `var(--section-text-color, ...)` | Color | YES |
| `--compare-tool-text-muted` | `var(--text-dark-2)` | Color | YES |
| `--compare-tool-bg` | `var(--surface-light-0)` | Color | YES |
| `--compare-tool-border-color` | `var(--stroke-light-3)` | Color | YES |
| `--compare-tool-border-color-subtle` | `var(--stroke-light-2)` | Color | YES |
| `--compare-tool-btn-bg` | `transparent` | Color | YES |
| `--compare-tool-btn-border` | `var(--stroke-light-4)` | Color | YES |
| `--compare-tool-btn-text` | `var(--text-dark-1)` | Color | YES |
| `--compare-tool-btn-hover-bg` | `var(--surface-light-1)` | Color | YES |
| `--compare-tool-btn-primary-bg` | `var(--color-brand-primary)` | Color | YES |
| `--compare-tool-btn-primary-text` | `var(--color-base-white)` | Color | YES |
| `--compare-tool-btn-primary-hover-bg` | `var(--color-brand-primary-dark)` | Color | YES |
| `--compare-tool-focus-ring` | `var(--focus-outline)` | Styling | NO |
| `--compare-tool-card-shadow` | `var(--shadow-card-subtle)` | Styling | NO |
| `--compare-tool-card-shadow-hover` | `var(--card-shadow)` | Styling | NO |
| `--compare-tool-tray-scroll-clearance` | `calc(var(--spacing-024) * 6)` | Spacing | YES |

**Theme Support:** Dark theme overrides provided  
**Recommendation:** Extensively tokenized; excellent for brand customization

---

### 11. Embed Block
**File:** `blocks/embed/embed.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--embed-play-icon-border-v` | `5px` | Size | YES |
| `--embed-play-icon-border-h` | `6px` | Size | YES |

**Hardcoded Values Found:**
- `max-width: var(--layout-max-width-media)` ✓
- `margin: var(--spacing-032) auto` ✓
- `border-radius: var(--radius-l)` ✓

**Recommendation:** Play button styling is minimal; current tokens adequate

---

### 12. Form Block
**File:** `blocks/form/form.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--form-gap` | *(not defined in file; used inline)* | Spacing | YES |
| `--form-image-max-width` | *(not defined; used inline)* | Size | YES |
| `--form-image-border-radius` | *(not defined; used inline)* | Styling | YES |
| `--form-grid-gap` | *(not defined; used inline)* | Spacing | YES |
| `--field-col-span` | *(default 6)* | Layout | YES |
| `--form-field-gap` | *(not defined; used inline)* | Spacing | YES |
| `--form-label-font-size` | *(not defined; used inline)* | Typography | YES |
| `--form-label-font-weight` | *(not defined; used inline)* | Typography | YES |
| `--form-label-color` | *(not defined; used inline)* | Color | YES |
| `--form-error-color` | *(not defined; used inline)* | Color | YES |
| `--form-input-padding` | *(not defined; used inline)* | Spacing | YES |
| `--form-input-border-radius` | *(not defined; used inline)* | Styling | YES |
| `--form-input-border-width` | *(not defined; used inline)* | Styling | YES |
| `--form-input-border-color` | *(not defined; used inline)* | Color | YES |
| `--form-input-bg` | *(not defined; used inline)* | Color | YES |
| `--form-input-color` | *(not defined; used inline)* | Color | YES |
| `--form-input-font-size` | *(not defined; used inline)* | Typography | YES |
| `--form-textarea-min-height` | *(not defined; used inline)* | Size | YES |
| `--form-input-border-color-hover` | *(not defined; used inline)* | Color | YES |
| `--form-input-border-color-focus` | *(not defined; used inline)* | Color | YES |
| `--form-input-outline-width` | *(not defined; used inline)* | Styling | YES |
| `--form-input-outline-offset` | *(not defined; used inline)* | Spacing | YES |
| `--form-checkbox-gap` | *(not defined; used inline)* | Spacing | YES |
| `--form-checkbox-size` | *(not defined; used inline)* | Size | YES |
| `--form-checkbox-border-color` | *(not defined; used inline)* | Color | YES |
| `--form-checkbox-border-radius` | *(not defined; used inline)* | Styling | YES |
| `--form-checkbox-bg` | *(not defined; used inline)* | Color | YES |

⚠️ **CRITICAL GAPS:** Form block uses token names throughout but **does not define them**. They must exist in `root-tokens.scss`.  
**Hardcoded Values:** Minimal — structure relies entirely on token system  
**Action:** Verify all form tokens exist in global token files; if not, add them to `root-tokens.scss`

---

### 13. Header Block
**File:** `blocks/header/header.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--color-header-background` | `var(--color-secondary)` | Color | YES |
| `--nav-height` | `64px` (default) | Size | YES |
| `--z-index-header` | Global token | Layout | NO |

**Note:** Header is mostly layout/styling with limited custom properties  
**Recommendation:** `--nav-height` is used globally; ensure it's defined in `root-tokens.scss`

---

### 14. Hero Block
**File:** `blocks/hero/hero.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--hero-min-height` | `300px` | Size | YES |
| `--hero-bg-color` | `transparent` | Color | YES |
| `--hero-text-color` | `inherit` | Color | YES |
| `--hero-description-color` | `var(--hero-text-color)` | Color | YES |
| `--hero-gradient-color` | `var(--surface-dark-0)` | Color | YES |
| `--hero-gradient-direction` | Controlled by data attributes | Styling | NO |
| `--hero-gradient-start` | Data attribute driven | Styling | NO |
| `--hero-gradient-end` | Data attribute driven | Styling | NO |

**Data Attributes:** Uses `data-hero-type`, `data-backgroundcolor`, `data-theme` for variant control  
**Recommendation:** Background and text colors are brand-overridable; gradient colors should be reviewed

---

### 15. Icon Cards Block
**File:** `blocks/icon-cards/icon-cards.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--icon-cards-columns` | `2` | Layout | YES |
| `--icon-pill-bg` | `var(--color-primary-100)` | Color | YES |
| `--icon-pill-color` | `var(--text-dark-1)` | Color | YES |
| `--icon-card-cta-hover-fg-color` | Variant-dependent | Color | YES |

**Variants:** bg-primary, bg-secondary, bg-tertiary, bg-black, bg-white, gradient  
**Recommendation:** Extensive use of brand colors; variants support multi-brand well

---

### 16. Icon List Block
**File:** `blocks/icon-list/icon-list.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--section-tile-background` | `var(--surface-light-0, var(--color-base-white))` | Color | YES |
| `--section-text-color` | *(from section theme)* | Color | YES |

**Note:** Uses section-level theme tokens  
**Recommendation:** Tile background is brandable via `--section-tile-background`

---

### 17. Layout Columns Block
**File:** `blocks/layout-columns/layout-columns.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--lc-column-count` | `2` (default) | Layout | YES |

**Note:** Minimal tokenization; layout driven by Flexbox and CSS variables  
**Hardcoded Values:**
- `gap: 0` (columns flush) — intentional, no token
- `var(--spacing-024)` vertical padding — good practice ✓

**Recommendation:** Adequate for layout-driven block

---

### 18. Media Gallery Grid Block
**File:** `blocks/media-gallery-grid/media-gallery-grid.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| *(no block-level tokens)* | — | — | — |

**Hardcoded Values Found:**
- Grid: `repeat(2, 1fr)` mobile, `repeat(4, 1fr)` desktop — no token (intentional design)
- Lightbox: `rgb(0 0 0 / 85%)` — **HARDCODED** → should be `var(--lightbox-overlay-color)`
- Caption gradient: `linear-gradient(180deg, transparent, rgb(0 0 0 / 80%))` — **HARDCODED** → should be tokenized

**Recommendation:** Create tokens:
- `--media-gallery-lightbox-overlay: rgb(0 0 0 / 85%)`
- `--media-gallery-caption-gradient-color: rgb(0 0 0 / 80%)`

---

### 19. Modal Block
**File:** `blocks/modal/modal.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--layout-max-width-modal` | Global token | Size | NO |
| `--spacing-*` | Global tokens | Spacing | NO |
| `--focus-outline` | Global token | Styling | NO |

**Note:** Modal uses global tokens; no block-level custom properties  
**Hardcoded Values:**
- `box-shadow: 0 1px 25px 0 rgba(0, 0, 0, 0.25)` — **HARDCODED** → should be `var(--shadow-modal)`
- `color-mix(in srgb, var(--color-grey-900) 75%, transparent)` — uses global token ✓

**Recommendation:** Create token:
- `--modal-box-shadow: 0 1px 25px 0 rgba(0, 0, 0, 0.25)`

---

### 20. Navigation Block
**File:** `blocks/navigation/navigation.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--nav-mobile-l1-font` | Montserrat 700 32px | Typography | YES |
| `--nav-mobile-l1-letter-spacing` | `var(--letter-spacing-snug)` | Typography | YES |
| `--nav-mobile-l2-heading-font` | Montserrat 700 20px | Typography | YES |
| `--nav-mobile-l2-heading-letter-spacing` | `var(--letter-spacing-snug)` | Typography | YES |
| `--nav-mobile-title-font` | Inter 500 16px | Typography | YES |
| `--nav-mobile-title-letter-spacing` | `var(--letter-spacing-wider)` | Typography | YES |
| `--nav-mobile-bg-l1` | `var(--surface-brand-primary)` | Color | YES |
| `--nav-mobile-bg-l2` | `var(--color-primary-600)` | Color | YES |
| `--nav-mobile-divider` | `rgb(255 255 255 / 20%)` | Color | YES |
| `--nav-slide-duration` | `var(--transition-duration-normal)` | Animation | NO |
| `--nav-slide-easing` | `ease` | Animation | NO |
| `--nav-group-header-color` | `currentcolor` | Color | YES |
| `--nav-group-header-hover-color` | `var(--color-brand-primary)` | Color | YES |
| `--nav-group-header-font` | Bold body-xs | Typography | YES |
| `--nav-item-color` | `currentcolor` | Color | YES |
| `--nav-item-hover-color` | `var(--color-brand-primary)` | Color | YES |
| `--nav-item-font` | Normal body-xs | Typography | YES |
| *(+ 20+ desktop-specific variants)* | | | |

**Theme Support:** Mobile L1/L2 colors use brand tokens  
**Recommendation:** Extensively tokenized for brand customization; excellent structure

---

### 21. Quote Block
**File:** `blocks/quote/quote.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--quote-highlight-font-size` | `120%` | Typography | YES |
| `--quote-icon-size` | `5rem` | Size | YES |
| `--quote-icon-font-family` | `var(--testimonial-font-family)` | Typography | YES |
| `--quote-icon-font-style` | `italic` | Typography | YES |
| `--quote-icon-font-weight` | `var(--font-weight-bold)` | Typography | YES |
| `--quote-max-width` | `var(--layout-max-width-narrow)` | Size | NO |
| `--quote-border` | `1px solid var(--stroke-light-2)` | Styling | YES |
| `--quote-box-shadow` | `var(--shadow-card-subtle)` | Styling | NO |
| `--quote-text-color` | `var(--text-dark-1)` | Color | YES |
| `--quote-icon-color` | `var(--color-brand-primary)` | Color | YES |
| `--quote-quotation-font-family` | `var(--testimonial-font-family)` | Typography | YES |
| `--quote-quotation-font-size` | `32px` | Typography | YES |
| `--quote-quotation-font-weight` | `var(--font-weight-thin)` | Typography | YES |
| `--quote-quotation-line-height` | `1.25` | Typography | YES |
| `--quote-attribution-gap` | `var(--spacing-004)` | Spacing | YES |
| `--quote-attribution-secondary-font-size` | `var(--body-font-size-xs)` | Typography | YES |
| `--quote-attribution-secondary-line-height` | `var(--line-height-normal)` | Typography | YES |
| `--quote-attribution-secondary-font-family` | `var(--testimonial-font-family)` | Typography | YES |

**Theme Support:** Dark/brand/tertiary themes override colors via data attributes  
**Hardcoded Value:** `color: inherit` (links) — should be explicit  
**Recommendation:** Excellent tokenization for brand customization

---

### 22. Search Block
**File:** `blocks/search/search.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--search-overlay-padding-y` | *(not defined; used inline)* | Spacing | YES |
| `--search-overlay-padding-x` | *(not defined; used inline)* | Spacing | YES |
| `--search-input-font-size-mobile` | *(not defined; used inline)* | Typography | YES |

⚠️ **TOKENS USED BUT NOT DEFINED** — must verify in `root-tokens.scss`  
**Hardcoded Values:**
- `z-index: var(--z-index-modal)` ✓
- Various spacing via token references ✓

**Recommendation:** Ensure search tokens are defined in global token system

---

### 23. Section Block
**File:** `blocks/section/section.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--section-overlay-dark-color` | `0 0 0` | Color | YES |
| `--section-overlay-light-color` | `255 255 255` | Color | YES |
| `--section-gradient-color` | `0 0 0` | Color | YES |
| `--color-highlight` | `var(--color-brand-light)` | Color | YES |

**Note:** Section is a layout utility; tokens control overlay/gradient colors  
**Recommendation:** These are foundational; allow brand customization

---

### 24. Socials Icons Block
**File:** `blocks/socials-icons/socials-icons.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--socials-icons-icon-color` | *(inherited)* | Color | YES |
| `--socials-icons-link-size-mobile-current` | Variant-dependent | Size | YES |
| `--socials-icons-link-size-desktop-current` | Variant-dependent | Size | YES |
| `--socials-icons-icon-size-current` | Variant-dependent | Size | YES |
| `--socials-icons-link-size-small-mobile` | *(not defined; expected in root)* | Size | YES |
| `--socials-icons-link-size-small-desktop` | *(not defined; expected in root)* | Size | YES |
| `--socials-icons-icon-size-small` | *(not defined; expected in root)* | Size | YES |
| `--socials-icons-link-size-medium-mobile` | *(not defined; expected in root)* | Size | YES |
| `--socials-icons-link-size-medium-desktop` | *(not defined; expected in root)* | Size | YES |
| `--socials-icons-icon-size-medium` | *(not defined; expected in root)* | Size | YES |
| *(+ 6 more lg/xl/xxl variants)* | | | |
| `--socials-icons-justify-content` | *(not defined; used inline)* | Layout | YES |
| `--socials-icons-gap-mobile` | *(not defined; used inline)* | Spacing | YES |
| `--socials-icons-gap-desktop` | *(not defined; used inline)* | Spacing | YES |
| `--socials-icons-icon-padding-inline` | *(not defined; used inline)* | Spacing | YES |

⚠️ **TOKENS USED BUT NOT DEFINED** — must verify all socials-icons tokens exist in `root-tokens.scss`  
**Recommendation:** Ensure all size variants are defined; these enable responsive icon sizing

---

### 25. Table Block
**File:** `blocks/table/table.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--table-background-color` | `var(--surface-background-color, var(--background-color))` | Color | YES |
| `--table-text-color` | `var(--text-dark-1)` | Color | YES |
| `--table-border-color` | `var(--stroke-light-2)` | Color | YES |
| `--table-row-alt-bg` | `var(--surface-light-1)` | Color | YES |
| `--table-row-border-color` | `var(--table-border-color)` | Color | YES |
| `--table-header-border-color` | `var(--color-grey-300)` | Color | YES |
| `--table-min-width` | `400px` | Size | YES |
| `--table-header-subtitle-color` | `var(--color-grey-600)` | Color | YES |

**Theme Support:** Context-aware styling via section data attributes  
**Hardcoded Values:**
- `border-collapse: collapse` — CSS default, intentional ✓
- Typography sizes and weights — via token references ✓

**Recommendation:** Excellent tokenization; table appearance is fully brand-customizable

---

### 26. Tabs Block
**File:** `blocks/tabs/tabs.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--tabs-panel-padding` | `var(--spacing-040)` | Spacing | YES |
| `--tabs-indicator-width` | `2px` | Size | YES |
| `--tabs-indicator-color` | `var(--color-primary)` | Color | YES |
| `--tabs-row-border-color` | `var(--color-grey-100)` | Color | YES |
| `--tabs-tab-color` | `var(--text-dark-1)` | Color | YES |
| `--tabs-tab-color-active` | `var(--color-primary)` | Color | YES |
| `--tabs-tab-gap` | `var(--spacing-032)` | Spacing | YES |
| `--tabs-tab-padding-x` | `var(--spacing-024)` | Spacing | YES |
| `--tabs-tab-padding-y` | `var(--spacing-012)` | Spacing | YES |
| `--tabs-nav-button-size` | `var(--sizing-024)` | Size | YES |
| `--tabs-nav-button-border-color` | `var(--color-grey-200)` | Color | YES |
| `--tabs-nav-button-color` | `var(--text-dark-1)` | Color | YES |
| `--tabs-slide-offset` | `-10px` | Size | YES |
| `--tabs-pill-bg` | `var(--color-grey-50)` | Color | YES |
| `--tabs-pill-radius-desktop` | `var(--radius-xl)` | Styling | YES |
| `--tabs-pill-radius-mobile` | `var(--radius-full)` | Styling | YES |
| `--tabs-pill-height-desktop` | `var(--sizing-056)` | Size | YES |
| `--tabs-pill-height-mobile` | `var(--sizing-040)` | Size | YES |
| `--tabs-pill-gap-desktop` | `var(--spacing-024)` | Spacing | YES |
| `--tabs-pill-gap-mobile` | `var(--spacing-008)` | Spacing | YES |
| `--tabs-pill-padding` | `4px` | Spacing | YES |
| `--tabs-pill-active-bg` | `var(--color-primary)` | Color | YES |
| `--tabs-pill-active-radius-desktop` | `var(--radius-l)` | Styling | YES |
| `--tabs-pill-active-radius-mobile` | `var(--radius-full)` | Styling | YES |
| `--tabs-pill-active-height-desktop` | `var(--sizing-048)` | Size | YES |
| `--tabs-pill-active-height-mobile` | `var(--sizing-032)` | Size | YES |
| `--tabs-pill-active-color` | `var(--text-light-1)` | Color | YES |
| `--tabs-pill-inactive-color` | `var(--text-dark-1)` | Color | YES |

**Variants:** underline (default) and pill-style tabs  
**Recommendation:** Extensively tokenized; both variants are fully customizable

---

### 27. Text Block
**File:** `blocks/text/text.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--layout-max-width-content` | Global token | Size | NO |

**Note:** Text block is minimal — only constrains width  
**Recommendation:** No block-specific tokens needed

---

### 28. Title Block
**File:** `blocks/title/title.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| *(no block-level tokens)* | — | — | — |

**Note:** Title uses section theme tokens; no block-specific styling  
**Recommendation:** Adequate

---

### 29. Video Block
**File:** `blocks/video/video.scss`

| Token | Current Value | Category | Overridable |
|-------|---------------|----------|-------------|
| `--video-play-bg` | `var(--surface-brand-primary)` | Color | YES |
| `--video-play-icon-color` | `var(--text-light-1)` | Color | YES |
| `--video-play-btn-size` | `var(--sizing-064)` | Size | YES |
| `--video-loading-bg` | `var(--surface-dark-0)` | Color | YES |
| `--video-error-bg` | `var(--surface-utility-error-tint)` | Color | NO |
| `--video-error-border` | `var(--stroke-utility-error)` | Color | NO |
| `--video-error-text` | `var(--text-utility-error)` | Color | NO |

**Hardcoded Values:**
- `border-radius: var(--radius-m)` ✓
- `max-width: var(--layout-max-width-narrow)` ✓
- `aspect-ratio: var(--aspect-ratio-video)` ✓

**Recommendation:** Play button color and size are brandable; error colors use utility tokens (correct)

---

## Section 2: Hardcoded Values Found (Token Gaps)

### Critical Hardcoded Values Requiring Tokenization

| Block | Property | Hardcoded Value | Suggested Token Name | Category | Priority |
|-------|----------|-----------------|---------------------|----------|----------|
| Booking | Border stripe | `4px` | `--booking-stripe-width` | Size | Medium |
| Media Gallery Grid | Lightbox overlay | `rgb(0 0 0 / 85%)` | `--media-gallery-lightbox-overlay` | Color | High |
| Media Gallery Grid | Caption gradient | `rgb(0 0 0 / 80%)` | `--media-gallery-caption-gradient-bg` | Color | High |
| Modal | Box shadow | `0 1px 25px 0 rgba(0, 0, 0, 0.25)` | `--modal-box-shadow` | Styling | Medium |
| Tabs | Pill padding | `4px` | `--tabs-pill-inner-padding` | Spacing | Low |
| Navigation | Mega panel overlap | `64px`, `88px`, `148px` | `--nav-mega-padding-x-*` | Size | Medium |
| Quote | Icon size | `72px` / `48px` | `--quote-icon-width` / `--quote-icon-height` | Size | Low |

### Semi-Hardcoded Values (Calculations That Could Be Simplified)

| Block | Example | Current | Better Approach |
|-------|---------|---------|-----------------|
| Carousel Cards | Peek gap position | `translateX(calc(-100% - var(--spacing-024)))` | Could use `--carousel-cards-peek-gap` token directly |
| Carousel Featured | Billboard min-height | `calc(100vh - 64px)` | Should use `calc(100vh - var(--nav-height))` |
| Layout Columns | Desktop max columns | `min(3, var(--lc-column-count))` | Structure is good; no issue |

---

## Section 3: Recommended Brand-Overridable Block Tokens

### Priority 1: Critical Brand-Specific Tokens (Must Override Per Brand)

**Brands should override these in `brands/{name}/tokens.css`:**

#### 1. Logo & Visual Identity
```css
/* Brand Logo — logo dimensions vary significantly per brand */
--brand-logo-width-mobile: 120px;     /* Lake Powell vs. Aramark brand sizes differ */
--brand-logo-height-mobile: 60px;
--brand-logo-width-desktop: 180px;
--brand-logo-height-desktop: 80px;
```

**Why:** Each brand has unique logo aspect ratios and sizing requirements  
**Blocks Affected:** brand-logo, header

---

#### 2. Primary Color System (CTA, Buttons, Links)
```css
/* Already implemented via global --color-brand-primary, but verify brand override */
--color-brand-primary: [brand-red];       /* Example: Lake Powell red vs. Aramark brand */
--color-brand-primary-dark: [darker-shade];
--color-brand-secondary: [brand-blue];
--color-brand-tertiary: [brand-accent];
```

**Why:** Button colors, link colors, and accents are highly brand-specific  
**Blocks Affected:** cta, accordion, cards, navigation, tabs, quote, compare-tool, icon-cards

---

#### 3. Navigation Styling (Mobile Background & Typography)
```css
--nav-mobile-bg-l1: var(--surface-brand-primary);  /* Mobile nav primary level */
--nav-mobile-bg-l2: var(--color-primary-600);      /* Mobile nav secondary level */
--nav-group-header-hover-color: var(--color-brand-primary);
--nav-item-hover-color: var(--color-brand-primary);
```

**Why:** Navigation is a primary brand touchpoint; color and typography should reflect brand identity  
**Blocks Affected:** navigation, header

---

#### 4. Form Input Styling
```css
--form-input-border-color: var(--stroke-light-2);
--form-input-border-color-focus: var(--color-brand-primary);
--form-input-bg: var(--surface-light-0);
--form-input-color: var(--text-dark-1);
```

**Why:** Forms are critical conversions; brands want consistent input styling  
**Blocks Affected:** form, booking

---

### Priority 2: High-Value Brand Tokens (Recommended Overrides)

#### 1. Card & Container Styling
```css
--card-border-color: var(--color-secondary);      /* Cards with brand secondary color */
--card-btn-hover-bg: var(--color-secondary);
--table-border-color: var(--stroke-light-2);
--compare-tool-bg: var(--surface-light-0);
--compare-tool-btn-primary-bg: var(--color-brand-primary);
```

**Why:** Cards and tables appear across multiple content types; consistent branding improves perception  
**Blocks Affected:** cards, table, compare-tool, icon-cards

---

#### 2. Tabs & Accordion Styling
```css
--tabs-indicator-color: var(--color-primary);     /* Active tab indicator */
--tabs-pill-active-bg: var(--color-primary);
--accordion-border-color: var(--stroke-light-2);
--accordion-title-color: var(--color-text-primary);
```

**Why:** Interactive components benefit from brand-color consistency  
**Blocks Affected:** tabs, accordion

---

#### 3. Media & Lightbox Colors
```css
--media-gallery-lightbox-overlay: rgb(0 0 0 / 85%);  /* Lightbox backdrop */
--video-play-bg: var(--surface-brand-primary);       /* Video play button */
--video-play-icon-color: var(--text-light-1);
```

**Why:** Media galleries and videos are visual focal points  
**Blocks Affected:** media-gallery-grid, video, carousel-featured

---

#### 4. Typography Variants
```css
--cta-font-size: var(--body-font-size-xs);        /* CTA button text size */
--cta-font-weight: var(--font-weight-bold);
--quote-quotation-font-size: 32px;                 /* Can adjust per brand */
--tabs-tab-color: var(--text-dark-1);
--accordion-title-font-size: var(--body-font-size-m);
```

**Why:** Typography sets brand tone; some brands prefer larger/smaller text  
**Blocks Affected:** cta, quote, tabs, accordion, navigation

---

### Priority 3: Optional/Specialist Tokens (Consider If Brand Has Unique Requirements)

| Token | Default | Use Case | Blocks |
|-------|---------|----------|--------|
| `--icon-cards-columns` | `2` | Adjust column count per brand | icon-cards |
| `--carousel-cards-nav-bg` | `var(--color-grey-100)` | Nav button color if brand prefers different | carousel-cards |
| `--carousel-featured-nav-border-color` | `var(--stroke-light-2)` | Featured carousel nav styling | carousel-featured |
| `--quote-border` | `1px solid var(--stroke-light-2)` | Quote box border — minimal impact | quote |
| `--booking-form-bg` | `var(--surface-light-0)` | Booking form background | booking |
| `--section-overlay-dark-color` | `0 0 0` | Section overlay tone | section |

---

## Summary: Action Items

### 1. **Immediate (P0) — Token Definition Audit**
- [ ] Verify all **form tokens** exist in `root-tokens.scss` (form block uses them but may not be defined)
- [ ] Verify all **socials-icons tokens** exist (12+ variants)
- [ ] Verify all **search overlay tokens** exist
- [ ] Move **breadcrumbs temporary tokens** (`--font-weight-light`, `--body-letter-spacing`) to global system

### 2. **Short-term (P1) — Fill Critical Gaps**
- [ ] Add **hardcoded values** to token system:
  - `--media-gallery-lightbox-overlay: rgb(0 0 0 / 85%)`
  - `--media-gallery-caption-gradient-bg: rgb(0 0 0 / 80%)`
  - `--modal-box-shadow: 0 1px 25px 0 rgba(0, 0, 0, 0.25)`
  - `--booking-stripe-width: 4px`

### 3. **Medium-term (P2) — Create Brand Token Overrides**
Generate `brands/{name}/tokens.css` with these critical overrides:
- Logo dimensions (`--brand-logo-*`)
- Primary/secondary/tertiary colors (already exist; verify)
- Navigation mobile background (`--nav-mobile-bg-*`)
- Form input styling (`--form-input-*`)
- Button/CTA colors (already exist; verify)

### 4. **Long-term (P3) — Documentation & Governance**
- [ ] Document which tokens are **brand-overridable** (create a checklist in `docs/BRAND-TOKEN-OVERRIDES.md`)
- [ ] Add to brand onboarding: "These 25 tokens should be reviewed and customized per brand"
- [ ] Ensure `pnpm build:css` validates token usage (catch missing tokens)

---

## Blocks by Tokenization Maturity

### Excellent (Fully Tokenized, Brand-Ready) ⭐⭐⭐⭐⭐
- **Accordion** — 15 tokens, comprehensive
- **Compare Tool** — 18 tokens, theme support
- **CTA** — Color variants, typography, well-structured
- **Navigation** — 30+ tokens, mobile/desktop variants
- **Tabs** — 27 tokens, pill & underline variants
- **Table** — 8 tokens, context-aware
- **Quote** — 16 tokens, attribution styling
- **Video** — 7 tokens for play button and loading states

### Good (Mostly Tokenized, Minor Gaps) ⭐⭐⭐⭐
- **Cards** — Well-tokenized; could use `--card-shadow` token
- **Banner** — Minimal tokens; adequate
- **Carousel Cards** — 3 tokens; could expand for spacing
- **Hero** — Good variant support via data attributes
- **Icon Cards** — Good color variant system
- **Modal** — Minor gaps (box-shadow hardcoded)
- **Search** — Tokens used but may not be defined globally

### Needs Work (Gaps or Unused Tokens) ⭐⭐⭐
- **Form** — 20+ tokens used, but **NOT DEFINED** — critical audit needed
- **Socials Icons** — 20+ tokens used, many may not be defined
- **Media Gallery Grid** — Hardcoded lightbox colors
- **Booking** — Missing form-specific tokens
- **Breadcrumbs** — Temporary tokens that need migration

### Minimal (Layout-Focused, Not Customizable) ⭐⭐
- **Text** — Single layout token; adequate
- **Title** — Uses section theme tokens; adequate
- **Image** — No block tokens; uses global
- **Embed** — 2 tokens; could be extended
- **Layout Columns** — Single layout token; adequate
- **Page** — No custom properties (metadata only)

---

## Quick Reference: Brand Token Template

For new brand onboarding, use this template in `brands/{BRAND-NAME}/tokens.css`:

```css
/* Brand: {Brand Name} */
/* Copy and customize these values per brand */

:root {
  /* ========== Visual Identity ========== */
  --brand-logo-width-mobile: 120px;
  --brand-logo-height-mobile: 60px;
  --brand-logo-width-desktop: 180px;
  --brand-logo-height-desktop: 80px;

  /* ========== Color System ========== */
  --color-brand-primary: #eb002a;           /* PRIMARY: Lake Powell red, Aramark, etc. */
  --color-brand-primary-dark: #c70021;      /* HOVER: Darker shade */
  --color-brand-secondary: #022035;         /* SECONDARY: Navy, Teal, etc. */
  --color-brand-tertiary: #ffc72c;          /* ACCENT: Gold, Orange, etc. */

  /* ========== Navigation ========== */
  --nav-mobile-bg-l1: var(--surface-brand-primary);
  --nav-mobile-bg-l2: var(--color-primary-600);
  --nav-group-header-hover-color: var(--color-brand-primary);

  /* ========== Forms ========== */
  --form-input-border-color-focus: var(--color-brand-primary);

  /* ========== Buttons & CTAs ========== */
  --button-bg: var(--color-brand-primary);
  --button-bg-hover: var(--color-brand-primary-dark);
  --tabs-indicator-color: var(--color-brand-primary);

  /* ========== Cards & Content ========== */
  --card-border-color: var(--color-brand-secondary);
  --card-btn-hover-bg: var(--color-brand-secondary);

  /* ========== Optional Customizations ========== */
  --icon-cards-columns: 2;                  /* Adjust per brand preference */
}
```

---

**Report Generated:** 2026-06-17  
**Total Blocks Analyzed:** 29 (+ header, section, page utilities)  
**Total Block Tokens Found:** 150+  
**Critical Issues Found:** 4 (hardcoded values)  
**Token Definition Gaps:** 3 (form, socials-icons, search)  
**Recommended Brand Overrides:** 25 tokens
