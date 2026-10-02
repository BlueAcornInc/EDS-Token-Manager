# Global CSS Custom Properties Catalog & Brand Overridability Analysis

**Generated:** 2026-06-17  
**Scope:** `/styles/` directory (root-tokens.scss, fixed-tokens.scss, styles.scss, typography.scss)  
**Purpose:** Identify which tokens are brandable vs. derived/constant

---

## Section 1: Global Token Inventory

### A. COLOR TOKENS

#### A1. Base Colors (Configurable in root-tokens.scss)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--color-base-white` | color | `#fff` | NO | Absolute white; no reason to change |
| `--color-base-black` | color | `#000` | NO | Absolute black; no reason to change |
| `--color-primary` | color | `#eb002a` (Aramark red) | **YES** | Core brand color; **PRIMARY OVERRIDE** |
| `--color-secondary` | color | `#022035` (dark navy) | **YES** | Secondary brand color; **PRIMARY OVERRIDE** |
| `--color-tertiary` | color | `var(--color-secondary)` | **YES** | Defaults to secondary; can be unique per brand |
| `--color-header-background` | color | `var(--color-secondary)` | **YES** | Header-specific override; useful for brands with non-secondary headers |
| `--color-alerts-success` | color | `#008545` (green) | MAYBE | Brand may prefer different success color |
| `--color-alerts-caution` | color | `#edc700` (yellow) | MAYBE | Brand may prefer different warning color |
| `--color-alerts-error` | color | `#d73044` (red/pink) | MAYBE | Brand may prefer different error color |
| `--color-alerts-general` | color | `#0084ff` (blue) | MAYBE | Brand may prefer different info color |

#### A2. Grey Scale (Configurable, hand-picked per brand)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--color-grey-50` | color | `#f6f9fb` | MAYBE | Light grey; useful for subtle backgrounds |
| `--color-grey-100` | color | `#e7ecf1` | MAYBE | Light grey |
| `--color-grey-200` | color | `#c4ccd8` | MAYBE | Medium-light grey |
| `--color-grey-300` | color | `#abb5c5` | MAYBE | Medium grey |
| `--color-grey-400` | color | `#727f96` | MAYBE | Medium grey |
| `--color-grey-500` | color | `#4f5b76` | MAYBE | Medium-dark grey |
| `--color-grey-600` | color | `#3f4b66` | MAYBE | Dark grey |
| `--color-grey-700` | color | `#2e3a55` | MAYBE | Dark grey |
| `--color-grey-800` | color | `#152a3f` | MAYBE | Very dark grey |
| `--color-grey-900` | color | `#041526` | MAYBE | Darkest grey (near-black) |

#### A3. Color Shades (Derived via color-mix from base colors — read-only)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--color-primary-50` to `--color-primary-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from `--color-primary` |
| `--color-secondary-50` to `--color-secondary-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from `--color-secondary` |
| `--color-tertiary-50` to `--color-tertiary-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from `--color-tertiary` |
| `--color-alerts-success-50` to `--color-alerts-success-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from success base |
| `--color-alerts-caution-50` to `--color-alerts-caution-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from caution base |
| `--color-alerts-error-50` to `--color-alerts-error-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from error base |
| `--color-alerts-general-50` to `--color-alerts-general-950` (10 tokens) | color | `color-mix()` formula | NO | Derived automatically from general base |

#### A4. Text Colors (Neutral light/dark)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--text-light-1` | color | `var(--color-base-white)` | NO | Semantic alias; change base instead |
| `--text-light-2` | color | `var(--color-grey-300)` | NO | Semantic alias; change base instead |
| `--text-light-3` | color | `var(--color-grey-600)` | NO | Semantic alias; change base instead |
| `--text-dark-1` | color | `var(--color-grey-900)` | NO | Primary dark text; semantic alias |
| `--text-dark-2` | color | `var(--color-grey-700)` | NO | Secondary dark text; semantic alias |
| `--text-dark-3` | color | `var(--color-grey-500)` | NO | Tertiary dark text; semantic alias |

#### A5. Semantic Color Aliases (Non-Brandable — Computed from Base Colors)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--color-brand-primary` | color | `var(--color-primary)` | NO | Alias; override `--color-primary` instead |
| `--color-brand-primary-500` | color | `var(--color-primary)` | NO | Alias |
| `--color-brand-primary-dark` | color | `var(--color-primary-700)` | NO | Alias |
| `--color-brand-secondary` | color | `var(--color-secondary)` | NO | Alias |
| `--color-brand-secondary-500` | color | `var(--color-secondary)` | NO | Alias |
| `--color-brand-secondary-dark` | color | `var(--color-secondary-700)` | NO | Alias |
| `--color-brand-tertiary` | color | `var(--color-tertiary)` | NO | Alias |
| `--color-brand-tertiary-500` | color | `var(--color-tertiary)` | NO | Alias |
| `--color-brand-tertiary-dark` | color | `var(--color-tertiary-700)` | NO | Alias |
| `--color-brand-light` | color | `var(--color-primary-100)` | NO | Derived from primary |
| `--color-brand-500` | color | `var(--color-primary)` | NO | Alias |
| `--color-text-primary` | color | `var(--text-dark-1)` | NO | Alias |
| `--color-neutral-50` through `--color-neutral-900` (10 tokens) | color | `var(--color-grey-*)` | NO | Aliases to grey scale |
| `--color-border` | color | `var(--color-grey-300)` | NO | Border color alias |
| `--color-error` | color | `var(--color-alerts-error)` | NO | Alias to error base |
| `--color-highlight` | color | `var(--color-primary-100)` | NO | Derived from primary |
| `--focus-ring-color` | color | `var(--surface-utility-focus)` | NO | Non-brand focus color (consistent across brands) |
| `--focus-outline` | color | `4px solid var(--surface-utility-focus)` | NO | Computed focus outline |
| `--color-focus-background` | color | `var(--color-primary-100)` | NO | Derived from primary |

#### A6. Surface Colors (Semantic layers)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--surface-light-0` | color | `var(--color-base-white)` | NO | Semantic alias |
| `--surface-light-1` | color | `var(--color-grey-50)` | NO | Semantic alias |
| `--surface-light-2` | color | `var(--color-grey-100)` | NO | Semantic alias |
| `--surface-light-3` | color | `var(--color-grey-200)` | NO | Semantic alias |
| `--surface-dark-0` | color | `var(--color-grey-900)` | NO | Semantic alias |
| `--surface-dark-1` | color | `var(--color-grey-800)` | NO | Semantic alias |
| `--surface-dark-2` | color | `var(--color-grey-700)` | NO | Semantic alias |
| `--surface-dark-3` | color | `var(--color-grey-600)` | NO | Semantic alias |
| `--surface-brand-primary` | color | `var(--color-primary)` | NO | Semantic alias |
| `--surface-brand-primary-light` | color | `var(--color-primary-100)` | NO | Derived |
| `--surface-brand-primary-dark` | color | `var(--color-primary-900)` | NO | Derived |
| `--surface-brand-secondary` | color | `var(--color-secondary)` | NO | Semantic alias |
| `--surface-brand-secondary-light` | color | `var(--color-secondary-100)` | NO | Derived |
| `--surface-brand-secondary-dark` | color | `var(--color-secondary-900)` | NO | Derived |
| `--surface-utility-success` | color | `var(--color-alerts-success)` | NO | Semantic alias |
| `--surface-utility-success-tint` | color | `var(--color-alerts-success-100)` | NO | Derived |
| `--surface-utility-caution` | color | `var(--color-alerts-caution)` | NO | Semantic alias |
| `--surface-utility-caution-tint` | color | `var(--color-alerts-caution-200)` | NO | Derived |
| `--surface-utility-error` | color | `var(--color-alerts-error)` | NO | Semantic alias |
| `--surface-utility-error-tint` | color | `var(--color-alerts-error-200)` | NO | Derived |
| `--surface-utility-general` | color | `var(--color-alerts-general)` | NO | Semantic alias |
| `--surface-utility-general-tint` | color | `var(--color-alerts-general-100)` | NO | Derived |
| `--surface-utility-focus` | color | `var(--color-alerts-general-400)` | NO | Non-brand focus color |
| `--surface-bg-cream` | color | `#f0efed` | MAYBE | Cream background; rare override need |

#### A7. Stroke Colors (Borders & outlines)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--stroke-light-1` | color | `var(--color-base-white)` | NO | Semantic alias |
| `--stroke-light-2` | color | `var(--color-grey-100)` | NO | Semantic alias |
| `--stroke-light-3` | color | `var(--color-grey-200)` | NO | Semantic alias |
| `--stroke-light-4` | color | `var(--color-grey-300)` | NO | Semantic alias |
| `--stroke-dark-1` | color | `var(--color-grey-900)` | NO | Semantic alias |
| `--stroke-dark-2` | color | `var(--color-grey-800)` | NO | Semantic alias |
| `--stroke-dark-3` | color | `var(--color-grey-700)` | NO | Semantic alias |
| `--stroke-dark-4` | color | `var(--color-grey-600)` | NO | Semantic alias |
| `--stroke-brand-primary` | color | `var(--color-primary)` | NO | Semantic alias |
| `--stroke-brand-primary-light` | color | `var(--color-primary-100)` | NO | Derived |
| `--stroke-brand-primary-dark` | color | `var(--color-primary-900)` | NO | Derived |
| `--stroke-brand-secondary` | color | `var(--color-secondary)` | NO | Semantic alias |
| `--stroke-brand-secondary-light` | color | `var(--color-secondary-100)` | NO | Derived |
| `--stroke-brand-secondary-dark` | color | `var(--color-secondary-900)` | NO | Derived |
| `--stroke-utility-success` | color | `var(--color-alerts-success)` | NO | Semantic alias |
| `--stroke-utility-success-tint` | color | `var(--color-alerts-success-300)` | NO | Derived |
| `--stroke-utility-caution` | color | `var(--color-alerts-caution)` | NO | Semantic alias |
| `--stroke-utility-tint` | color | `var(--color-alerts-caution-300)` | NO | Derived |
| `--stroke-utility-error` | color | `var(--color-alerts-error)` | NO | Semantic alias |
| `--stroke-utility-error-tint` | color | `var(--color-alerts-error-300)` | NO | Derived |
| `--stroke-utility-general` | color | `var(--color-alerts-general)` | NO | Semantic alias |
| `--stroke-utility-general-tint` | color | `var(--color-alerts-general-300)` | NO | Derived |

#### A8. Text Colors (Brand-specific)

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--text-primary-main` | color | `var(--color-primary)` | NO | Semantic alias |
| `--text-primary-light` | color | `var(--color-primary-200)` | NO | Derived |
| `--text-primary-dark` | color | `var(--color-primary-800)` | NO | Derived |
| `--text-secondary-main` | color | `var(--color-secondary)` | NO | Semantic alias |
| `--text-secondary-light` | color | `var(--color-secondary-100)` | NO | Derived |
| `--text-secondary-dark` | color | `var(--color-secondary-800)` | NO | Derived |
| `--text-utility-success` | color | `var(--color-alerts-success)` | NO | Semantic alias |
| `--text-utility-caution` | color | `var(--color-alerts-caution)` | NO | Semantic alias |
| `--text-utility-error` | color | `var(--color-alerts-error)` | NO | Semantic alias |
| `--text-utility-general` | color | `var(--color-alerts-general)` | NO | Semantic alias |

#### A9. Icon Colors

| Token Name | Category | Current Value/Formula | Overridable? | Notes |
|---|---|---|---|---|
| `--icons-color-primary-main` | color | `var(--color-primary)` | NO | Semantic alias |
| `--icons-color-primary-light` | color | `var(--color-primary-200)` | NO | Derived |
| `--icons-color-primary-dark` | color | `var(--color-primary-800)` | NO | Derived |
| `--icons-color-secondary-main` | color | `var(--color-secondary)` | NO | Semantic alias |
| `--icons-color-secondary-light` | color | `var(--color-secondary-200)` | NO | Derived |
| `--icons-color-secondary-dark` | color | `var(--color-secondary-800)` | NO | Derived |
| `--icons-color-greyscale-light` | color | `var(--color-base-white)` | NO | Semantic alias |
| `--icons-color-greyscale-med` | color | `var(--color-grey-400)` | NO | Semantic alias |
| `--icons-color-greyscale-dark` | color | `var(--color-grey-900)` | NO | Semantic alias |
| `--icons-color-utility-success` | color | `var(--color-alerts-success)` | NO | Semantic alias |
| `--icons-color-utility-caution` | color | `var(--color-alerts-caution)` | NO | Semantic alias |
| `--icons-color-utility-error` | color | `var(--color-alerts-error)` | NO | Semantic alias |
| `--icons-color-utility-general` | color | `var(--color-alerts-general)` | NO | Semantic alias |

---

### B. TYPOGRAPHY TOKENS

#### B1. Font Families (Should remain consistent across brands)

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--body-font-family` | typography | `inter, inter-fallback, sans-serif` | MAYBE | Lake Powell uses Inter; brands may want different body font |
| `--heading-font-family` | typography | `petrona, petrona-fallback, montserrat, montserrat-fallback, sans-serif` | MAYBE | Lake Powell uses Petrona; other brands may prefer Montserrat |
| `--eyebrow-font-family` | typography | `var(--body-font-family)` | NO | Alias to body font |
| `--testimonial-font-family` | typography | `var(--heading-font-family)` | NO | Alias to heading font |
| `--icon-font-family` | typography | `phosphor, sans-serif` | NO | Icon glyphs; should not change |

#### B2. Font Weights

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--font-weight-thin` | typography | `100` | NO | Standard weight value |
| `--font-weight-light` | typography | `300` | NO | Standard weight value |
| `--font-weight-normal` | typography | `400` | NO | Standard weight value |
| `--font-weight-medium` | typography | `500` | NO | Standard weight value |
| `--font-weight-bold` | typography | `700` | NO | Standard weight value |
| `--body-font-weight-light` | typography | `var(--font-weight-light)` | NO | Semantic alias |
| `--body-font-weight-regular` | typography | `var(--font-weight-normal)` | NO | Semantic alias |
| `--body-font-weight-medium` | typography | `var(--font-weight-medium)` | NO | Semantic alias |
| `--heading-font-weight` | typography | `var(--font-weight-medium)` | NO | Semantic alias |
| `--h1-font-weight` | typography | `var(--heading-font-weight)` | **YES** | H1-specific override; Lake Powell uses Light (300) |
| `--input-font-weight-light` | typography | `var(--font-weight-normal)` | NO | Semantic alias |
| `--input-font-weight-heavy` | typography | `var(--font-weight-medium)` | NO | Semantic alias |
| `--button-font-weight` | typography | `var(--font-weight-bold)` | NO | Semantic alias |
| `--cta-font-weight` | typography | `var(--font-weight-bold)` | **YES** | CTA button weight; Lake Powell may override |
| `--eyebrow-font-weight` | typography | `var(--font-weight-medium)` | NO | Semantic alias |
| `--details-font-weight-light` | typography | `var(--font-weight-medium)` | NO | Semantic alias |
| `--details-font-weight-dark` | typography | `var(--font-weight-bold)` | NO | Semantic alias |
| `--testimonial-font-weight` | typography | `250` | **YES** | Testimonial weight; Lake Powell v2 spec (ultra-thin) |
| `--list-font-weight` | typography | `var(--font-weight-light)` | NO | Semantic alias |
| `--display-font-weight` | typography | `var(--font-weight-light)` | NO | Semantic alias |

#### B3. Font Sizes — Body

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--body-font-size-m` | typography | `18px` | **YES** | Body 1 (primary); brand may adjust |
| `--body-font-size-s` | typography | `16px` | **YES** | Body 2 (secondary); brand may adjust |
| `--body-font-size-xs` | typography | `14px` | **YES** | Body 3; brand may adjust |
| `--body-font-size-xxs` | typography | `12px` | **YES** | Body 4 (micro-text); brand may adjust |
| `--body-line-height-m` | typography | `1.667` | NO | Figma-aligned; computed from 18px base |
| `--body-line-height-s` | typography | `1.75` | NO | Figma-aligned; computed from 16px base |
| `--body-line-height-xs` | typography | `1.571` | NO | Figma-aligned; computed from 14px base |
| `--body-line-height-xxs` | typography | `1.5` | NO | Figma-aligned; computed from 12px base |

#### B4. Font Sizes — Headings

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--heading-font-size-h1` | typography | `44px` (mobile), `64px` (desktop) | **YES** | H1 heading size; responsive override in @media |
| `--heading-font-size-h2` | typography | `24px` (mobile), `34px` (desktop) | **YES** | H2 heading size; responsive override in @media |
| `--heading-font-size-h3` | typography | `22px` (mobile), `24px` (desktop) | **YES** | H3 heading size; responsive override in @media |
| `--heading-font-size-h4` | typography | `20px` | **YES** | H4 heading size (no responsive override) |
| `--heading-font-size-xxl` | typography | `45px` (desktop only) | NO | Legacy heading size (@media >900px only) |
| `--heading-font-size-xl` | typography | `36px` (desktop only) | NO | Legacy heading size (@media >900px only) |
| `--heading-font-size-l` | typography | `28px` (desktop only) | NO | Legacy heading size (@media >900px only) |
| `--heading-font-size-m` | typography | `22px` (desktop only) | NO | Legacy heading size (@media >900px only) |
| `--heading-font-size-s` | typography | `20px` (desktop only) | NO | Legacy heading size (@media >900px only) |
| `--heading-font-size-xs` | typography | `18px` (desktop only) | NO | Legacy heading size (@media >900px only) |

#### B5. Font Sizes — Display / Hero

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--display-font-size` | typography | `44px` (mobile), `64px` (desktop) | **YES** | Hero/display heading; responsive via @media |
| `--display-font-size-mobile` | typography | `44px` | **YES** | Mobile display override |
| `--display-line-height` | typography | `1.2` | NO | Figma-aligned line-height |
| `--display-letter-spacing` | typography | `-0.03em` | NO | Figma-aligned letter-spacing |
| `--display-font-weight` | typography | `var(--font-weight-light)` | NO | Alias |
| `--display-font-style` | typography | `italic` | NO | Figma-aligned style |

#### B6. Font Sizes — Other Typography Elements

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--eyebrow-font-size-s` | typography | `10px` | **YES** | Small eyebrow label |
| `--eyebrow-font-size-m` | typography | `14px` | **YES** | Medium eyebrow label |
| `--eyebrow-font-size-l` | typography | `16px` | **YES** | Large eyebrow label |
| `--details-font-size` | typography | `10px` | **YES** | Micro-text (badges, captions) |
| `--input-font-size-base` | typography | `16px` | NO | Standard input size |
| `--input-font-size-error` | typography | `14px` | NO | Error message size |
| `--testimonial-font-size` | typography | `24px` (mobile), `32px` (desktop) | **YES** | Quote/testimonial; responsive |
| `--cta-font-size` | typography | `var(--body-font-size-xs)` | NO | Alias to body XS (14px) |
| `--list-font-size` | typography | `var(--body-font-size-m)` | NO | Alias to body M (18px) |
| `--form-label-font-size` | typography | `var(--body-font-size-s)` | NO | Alias to body S (16px) |
| `--form-submit-font-size` | typography | `var(--body-font-size-s)` | NO | Alias to body S (16px) |
| `--form-text-font-size` | typography | `var(--body-font-size-s)` | NO | Alias to body S (16px) |
| `--form-input-font-size` | typography | `var(--body-font-size-s)` | NO | Alias to body S (16px) |
| `--form-error-font-size` | typography | `var(--body-font-size-xs)` | NO | Alias to body XS (14px) |
| `--form-checkbox-label-font-size` | typography | `var(--body-font-size-xs)` | NO | Alias to body XS (14px) |
| `--search-input-font-size-mobile` | typography | `28px` | **YES** | Search input mobile size |
| `--search-input-font-size-desktop` | typography | `40px` | **YES** | Search input desktop size |

#### B7. Line Heights

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--line-height-none` | typography | `0` | NO | Reset value |
| `--line-height-tight` | typography | `1` | NO | Standard value |
| `--line-height-snug` | typography | `1.25` | NO | Standard value |
| `--line-height-heading` | typography | `1.3` | NO | Figma-aligned for headings |
| `--line-height-normal` | typography | `1.6` | NO | Standard value |
| `--line-height-medium` | typography | `1.5` | NO | Standard value |
| `--line-height-relaxed` | typography | `1.75` | NO | Standard value |
| `--heading-line-height` | typography | `1.3` | NO | Figma-aligned |
| `--h1-line-height` | typography | `var(--heading-line-height)` | **YES** | H1-specific override; Lake Powell uses 1.2 |
| `--link-line-height` | typography | `1.5em` | NO | Figma-aligned |
| `--cta-line-height` | typography | `1` | NO | Figma-aligned |
| `--eyebrow-line-height` | typography | `1` | NO | Figma-aligned |
| `--details-line-height` | typography | `1.3` | NO | Figma-aligned |
| `--testimonial-line-height` | typography | `1.333` (mobile), `1.25` (desktop) | NO | Figma-aligned |
| `--list-line-height` | typography | `1.5em` | NO | Figma-aligned |
| `--input-line-height-base` | typography | `1` | NO | Standard value |
| `--input-line-height-error` | typography | `1.3` | NO | Standard value |

#### B8. Letter Spacing

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--letter-spacing-tightest` | typography | `-0.05em` | NO | Standard value |
| `--letter-spacing-snug` | typography | `-0.03em` | NO | Standard value |
| `--letter-spacing-tight` | typography | `-0.02em` | NO | Standard value (body text) |
| `--letter-spacing-none` | typography | `0em` | NO | Standard value |
| `--letter-spacing-wide` | typography | `0.05em` | NO | Standard value |
| `--letter-spacing-wider` | typography | `0.1em` | NO | Standard value |
| `--body-letter-spacing` | typography | `var(--letter-spacing-tight)` | NO | Alias |
| `--heading-letter-spacing` | typography | `var(--letter-spacing-snug)` | NO | Alias |
| `--display-letter-spacing` | typography | `-0.03em` | NO | Figma-aligned |
| `--link-letter-spacing` | typography | `var(--letter-spacing-tight)` | NO | Alias |
| `--cta-letter-spacing` | typography | `var(--letter-spacing-wider)` | **YES** | CTA/button tracking; Lake Powell may override |
| `--eyebrow-letter-spacing` | typography | `var(--letter-spacing-wider)` | NO | Alias |
| `--list-letter-spacing` | typography | `var(--letter-spacing-tight)` | NO | Alias |

#### B9. Text Transform

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--cta-text-transform` | typography | `uppercase` | **YES** | CTA/button transform; Lake Powell specifies this |
| `--eyebrow-text-transform` | typography | `uppercase` | NO | Always uppercase for eyebrows |

#### B10. Typography — Legacy Aliases (styles.scss)

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--background-color` | typography | `var(--surface-light-0)` | NO | Legacy alias |
| `--light-color` | typography | `var(--surface-light-1)` | NO | Legacy alias |
| `--dark-color` | typography | `var(--color-grey-500)` | NO | Legacy alias |
| `--text-color` | typography | `var(--text-dark-1)` | NO | Legacy alias |
| `--link-color` | typography | `var(--text-dark-1)` | NO | Legacy alias |
| `--link-hover-color` | typography | `var(--color-primary)` | NO | Derived from primary |

---

### C. SPACING & SIZING TOKENS

#### C1. Sizing Scale (Primitive length values)

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--sizing-000` through `--sizing-144` (37 tokens) | spacing | `0px` to `144px` | NO | Fixed primitive scale; do not override |

#### C2. Spacing Scale (Primitive length values)

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--spacing-000` through `--spacing-120` (20 tokens) | spacing | `0px` to `120px` | NO | Fixed primitive scale; do not override |
| `--spacing-small` | spacing | `var(--spacing-008)` | NO | Alias |
| `--spacing-xsmall` | spacing | `var(--spacing-004)` | NO | Alias |
| `--spacing-xxsmall` | spacing | `var(--spacing-002)` | NO | Alias |

#### C3. Border Radius

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--radius-none` | border/radius | `0px` | NO | No rounding |
| `--radius-xs` | border/radius | `2px` | **YES** | Minimal rounding; brand may want sharper/rounder |
| `--radius-s` | border/radius | `4px` | **YES** | Small rounding |
| `--radius-m` | border/radius | `8px` | **YES** | Medium rounding |
| `--radius-l` | border/radius | `12px` | **YES** | Large rounding |
| `--radius-xl` | border/radius | `16px` | **YES** | Extra-large rounding |
| `--radius-full` | border/radius | `999px` | NO | Full rounded (pill shape) |
| `--radius-circle` | border/radius | `50%` | NO | Full circle |

#### C4. Stroke Weights

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--weight-none` | border/radius | `0` | NO | No border |
| `--weight-s` | border/radius | `1` | NO | Thin border |
| `--weight-m` | border/radius | `2` | NO | Medium border |
| `--weight-l` | border/radius | `4` | NO | Thick border |
| `--stroke-weight-s` | border/radius | `var(--weight-s)` | NO | Alias |
| `--stroke-weight-m` | border/radius | `var(--weight-m)` | NO | Alias |
| `--stroke-weight-l` | border/radius | `var(--weight-l)` | NO | Alias |

---

### D. LAYOUT TOKENS

#### D1. Layout Dimensions

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--layout-max-width-content` | layout | `1200px` | **YES** | Main content container; brand may adjust |
| `--layout-max-width-outer` | layout | `1440px` | **YES** | Outer container width; brand may adjust |
| `--layout-max-width-header-mobile` | layout | `1248px` | **YES** | Header mobile max-width |
| `--layout-max-width-header-desktop` | layout | `1264px` | **YES** | Header desktop max-width |
| `--layout-max-width-narrow` | layout | `900px` | **YES** | Narrow container (sidebar/form) |
| `--layout-max-width-modal` | layout | `648px` | **YES** | Modal dialog max-width |
| `--layout-max-width-media` | layout | `800px` | **YES** | Media/image container width |
| `--nav-height` | layout | `64px` | **YES** | Navigation bar height; brand may adjust |
| `--nav-height-homepage` | layout | `98px` | **YES** | Homepage nav overlay height |
| `--card-min-width` | layout | `300px` | **YES** | Cards grid minimum width |

#### D2. Breakpoints (Documentation only — cannot be used in media queries)

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--breakpoint-mobile` | layout | `0px` | NO | Mobile breakpoint (reference only) |
| `--breakpoint-tablet` | layout | `600px` | NO | Tablet breakpoint (reference only) |
| `--breakpoint-tablet-mid` | layout | `768px` | NO | Mid-tablet breakpoint (reference only) |
| `--breakpoint-desktop` | layout | `900px` | NO | Desktop breakpoint (reference only) |
| `--breakpoint-wide` | layout | `1200px` | NO | Wide desktop breakpoint (reference only) |

---

### E. ANIMATION & TRANSITION TOKENS

#### E1. Transition Durations

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--transition-duration-instant` | animation | `0s` | NO | No animation |
| `--transition-duration-fast` | animation | `0.2s` | MAYBE | Fast transitions; brand may prefer different feel |
| `--transition-duration-normal` | animation | `0.3s` | MAYBE | Standard transitions |
| `--transition-duration-slow` | animation | `0.5s` | MAYBE | Slow transitions |
| `--button-transition` | animation | `var(--transition-duration-fast)` | NO | Alias |

---

### F. Z-INDEX TOKENS

#### F1. Stacking Order Scale

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--z-index-behind` | z-index | `-1` | NO | Behind main content |
| `--z-index-base` | z-index | `1` | NO | Base layer |
| `--z-index-header` | z-index | `2` | NO | Header layer |
| `--z-index-dropdown` | z-index | `10` | NO | Dropdown menus |
| `--z-index-sticky` | z-index | `50` | NO | Sticky elements |
| `--z-index-modal` | z-index | `100` | NO | Modal dialogs |
| `--z-index-popover` | z-index | `150` | NO | Popovers |
| `--z-index-tooltip` | z-index | `200` | NO | Tooltips |

---

### G. ASPECT RATIOS

#### G1. Common Media Aspect Ratios

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--aspect-ratio-square` | layout | `1 / 1` | NO | Square images |
| `--aspect-ratio-landscape` | layout | `4 / 3` | NO | Landscape format |
| `--aspect-ratio-portrait` | layout | `3 / 4` | NO | Portrait format |
| `--aspect-ratio-video` | layout | `16 / 9` | NO | Standard video/hero |
| `--aspect-ratio-ultrawide` | layout | `21 / 9` | NO | Ultrawide format |

---

### H. COMPONENT-SPECIFIC TOKENS

#### H1. Input Field Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--input-padding` | component | `0.5em` | **YES** | Input field padding |
| `--input-border-radius` | component | `var(--radius-xs)` | **YES** | Input field corner rounding |
| `--input-border-width` | component | `1px` | **YES** | Input field border thickness |
| `--input-border-color` | component | `var(--color-grey-600)` | **YES** | Input field default border |
| `--input-border-color-hover` | component | `var(--color-grey-900)` | **YES** | Input field hover border |
| `--input-border-color-focus` | component | `var(--color-alerts-general)` | **YES** | Input field focus border |
| `--input-outline-width` | component | `var(--weight-m)` | **YES** | Input field outline width |
| `--input-outline-offset` | component | `var(--spacing-002)` | **YES** | Input field outline offset |

#### H2. Form Block Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--form-gap` | component | `var(--spacing-032)` | **YES** | Form row spacing |
| `--form-image-max-width` | component | `40%` | **YES** | Form image width |
| `--form-image-border-radius` | component | `var(--radius-m)` | **YES** | Form image rounding |
| `--form-grid-gap` | component | `var(--spacing-024)` | **YES** | Form multi-column gap |
| `--form-field-gap` | component | `var(--spacing-004)` | **YES** | Form label-input gap |
| `--form-label-font-size` | component | `var(--body-font-size-s)` | NO | Alias |
| `--form-label-font-weight` | component | `var(--font-weight-bold)` | NO | Alias |
| `--form-label-color` | component | `var(--text-dark-1)` | NO | Semantic |
| `--form-input-padding` | component | `var(--input-padding)` | **YES** | Input field padding |
| `--form-input-border-radius` | component | `var(--input-border-radius)` | **YES** | Input border rounding |
| `--form-input-border-width` | component | `var(--input-border-width)` | **YES** | Input border thickness |
| `--form-input-border-color` | component | `var(--input-border-color)` | **YES** | Input default border |
| `--form-input-border-color-hover` | component | `var(--input-border-color-hover)` | **YES** | Input hover border |
| `--form-input-border-color-focus` | component | `var(--input-border-color-focus)` | **YES** | Input focus border |
| `--form-input-outline-width` | component | `var(--input-outline-width)` | **YES** | Input outline width |
| `--form-input-outline-offset` | component | `var(--input-outline-offset)` | **YES** | Input outline offset |
| `--form-input-bg` | component | `var(--surface-light-0)` | NO | Semantic |
| `--form-input-color` | component | `var(--text-dark-1)` | NO | Semantic |
| `--form-input-font-size` | component | `var(--body-font-size-s)` | NO | Alias |
| `--form-textarea-min-height` | component | `120px` | **YES** | Textarea minimum height |
| `--form-checkbox-size` | component | `var(--sizing-016)` | **YES** | Checkbox dimension |
| `--form-checkbox-border-color` | component | `var(--stroke-dark-1)` | **YES** | Checkbox border |
| `--form-checkbox-border-radius` | component | `var(--radius-xs)` | **YES** | Checkbox rounding |
| `--form-checkbox-bg` | component | `var(--surface-light-0)` | NO | Semantic |
| `--form-checkbox-checked-color` | component | `var(--color-brand-primary)` | NO | Semantic |
| `--form-checkbox-checkmark-color` | component | `var(--surface-light-0)` | NO | Semantic |
| `--form-checkbox-label-font-size` | component | `var(--body-font-size-xs)` | NO | Alias |
| `--form-checkbox-gap` | component | `var(--spacing-008)` | **YES** | Checkbox-label spacing |
| `--form-radio-size` | component | `var(--sizing-016)` | **YES** | Radio button dimension |
| `--form-radio-dot-size` | component | `var(--sizing-008)` | **YES** | Radio button dot size |
| `--form-radio-border-color` | component | `var(--stroke-dark-1)` | **YES** | Radio button border |
| `--form-radio-bg` | component | `var(--surface-light-0)` | NO | Semantic |
| `--form-radio-checked-color` | component | `var(--color-brand-primary)` | NO | Semantic |
| `--form-radio-group-gap` | component | `var(--spacing-008)` | **YES** | Radio group spacing |
| `--form-radio-options-gap` | component | `var(--spacing-012)` | **YES** | Radio options spacing |
| `--form-radio-option-gap` | component | `var(--spacing-004)` | **YES** | Radio option spacing |
| `--form-error-font-size` | component | `var(--body-font-size-xs)` | NO | Alias |
| `--form-error-color` | component | `var(--color-alerts-error)` | NO | Semantic |
| `--form-footer-gap` | component | `var(--spacing-024)` | **YES** | Form footer spacing |
| `--form-footer-margin-top` | component | `var(--spacing-032)` | **YES** | Form footer top margin |
| `--form-footer-padding-top` | component | `var(--spacing-024)` | **YES** | Form footer top padding |
| `--form-footer-border-width` | component | `var(--stroke-weight-s)` | **YES** | Form footer border width |
| `--form-footer-border-color` | component | `var(--stroke-light-4)` | **YES** | Form footer border color |
| `--form-submit-padding-vertical` | component | `var(--button-padding-vertical)` | NO | Alias |
| `--form-submit-padding-horizontal` | component | `var(--button-padding-horizontal)` | NO | Alias |
| `--form-submit-font-size` | component | `var(--body-font-size-s)` | NO | Alias |
| `--form-submit-font-weight` | component | `var(--button-font-weight)` | NO | Alias |
| `--form-submit-line-height` | component | `var(--button-line-height)` | NO | Alias |
| `--form-submit-color` | component | `var(--text-light-1)` | NO | Semantic |
| `--form-submit-bg` | component | `var(--color-brand-primary)` | NO | Semantic |
| `--form-submit-bg-hover` | component | `var(--color-brand-primary-dark)` | NO | Semantic |
| `--form-submit-border-radius` | component | `var(--button-border-radius)` | NO | Alias |
| `--form-submit-transition` | component | `var(--button-transition)` | NO | Alias |
| `--form-dark-bg` | component | `var(--surface-dark-0)` | NO | Semantic |
| `--form-dark-text-color` | component | `var(--text-light-1)` | NO | Semantic |
| `--form-dark-input-bg` | component | `var(--surface-dark-1)` | NO | Semantic |
| `--form-dark-input-border-color` | component | `var(--stroke-light-3)` | NO | Semantic |
| `--form-dark-border-color` | component | `var(--stroke-light-3)` | NO | Semantic |
| `--form-dark-submit-bg` | component | `var(--color-base-white)` | NO | Semantic |
| `--form-dark-submit-color` | component | `var(--color-grey-900)` | NO | Semantic |
| `--form-dark-submit-bg-hover` | component | `var(--color-grey-100)` | NO | Semantic |
| `--form-light-bg` | component | `var(--surface-light-1)` | NO | Semantic |
| `--form-light-submit-bg` | component | `var(--color-brand-primary)` | NO | Semantic |
| `--form-light-submit-color` | component | `var(--text-light-1)` | NO | Semantic |
| `--form-light-submit-bg-hover` | component | `var(--color-brand-primary-dark)` | NO | Semantic |
| `--form-theme-padding` | component | `var(--spacing-032)` | **YES** | Form theme padding |
| `--form-theme-border-radius` | component | `var(--radius-m)` | **YES** | Form theme rounding |
| `--form-text-color` | component | `var(--text-dark-1)` | NO | Semantic |
| `--form-text-font-size` | component | `var(--body-font-size-s)` | NO | Alias |

#### H3. Button Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--button-padding-vertical` | component | `0.5em` | **YES** | Button padding top/bottom |
| `--button-padding-horizontal` | component | `1.2em` | **YES** | Button padding left/right |
| `--button-border-radius` | component | `2.4em` | **YES** | Button pill-shaped rounding |
| `--button-border-width` | component | `var(--weight-m)` | **YES** | Button border thickness |
| `--button-line-height` | component | `var(--line-height-snug)` | NO | Alias |
| `--button-touch-target` | component | `var(--sizing-048)` | **YES** | Minimum button touch size |

#### H4. Fragment Detail Page CTA Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--fragment-detail-page-cta-border-radius` | component | `var(--radius-s)` | **YES** | Fragment CTA rounding |
| `--fragment-detail-page-cta-color-primary` | component | `var(--color-brand-primary)` | NO | Semantic |
| `--fragment-detail-page-cta-color-secondary` | component | `var(--color-brand-secondary)` | NO | Semantic |
| `--fragment-detail-page-cta-color-tertiary` | component | `var(--color-brand-tertiary)` | NO | Semantic |
| `--fragment-detail-page-cta-color-black` | component | `var(--color-neutral-900)` | NO | Semantic |
| `--fragment-detail-page-cta-color-white` | component | `var(--color-base-white)` | NO | Semantic |
| `--fragment-detail-page-cta-text-on-dark` | component | `var(--color-base-white)` | NO | Semantic |
| `--fragment-detail-page-cta-text-on-light` | component | `var(--color-grey-900)` | NO | Semantic |

#### H5. Card Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--card-shadow` | component | `0 4px 16px rgb(0 0 0 / 20%)` | **YES** | Card elevation shadow |

#### H6. Shadow Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--shadow-s` | component | `0 2px 8px rgb(0 0 0 / 10%)` | **YES** | Small shadow |
| `--shadow-m` | component | `0 4px 16px rgb(0 0 0 / 15%)` | **YES** | Medium shadow (modals) |
| `--shadow-l` | component | `0 8px 32px rgb(0 0 0 / 20%)` | **YES** | Large shadow (popovers) |
| `--shadow-card-subtle` | component | `0 5px 10px 0 rgb(0 0 0 / 5%)` | **YES** | Card resting shadow |
| `--shadow-brand-switcher` | component | `0 1px 15px 0 rgb(0 0 0 / 15%)` | **YES** | Dropdown elevation |
| `--shadow-mega-panel` | component | `0 1px 25px 0 rgb(0 0 0 / 25%)` | **YES** | Mega-menu elevation |
| `--dropdown-box-shadow` | component | `0 0.2rem 0.4rem rgb(0 0 0 / 7.5%)` | **YES** | Dropdown shadow |
| `--elevation-4` | component | `0 60px 60px -60px rgb(0 0 0 / 10%), 0 25px 25px -53px rgb(0 0 0 / 10%)` | **YES** | Figma V2 Elevation 4 |

#### H7. Brand Logo Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--brand-logo-width-mobile` | component | `154px` | **YES** | Logo width on mobile |
| `--brand-logo-height-mobile` | component | `34px` | **YES** | Logo height on mobile |
| `--brand-logo-width-desktop` | component | `172px` | **YES** | Logo width on desktop |
| `--brand-logo-height-desktop` | component | `38px` | **YES** | Logo height on desktop |

#### H8. Socials Icons Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--socials-icons-justify-content` | component | `flex-start` | **YES** | Icon alignment |
| `--socials-icons-gap-mobile` | component | `var(--spacing-016)` | **YES** | Icon gap on mobile |
| `--socials-icons-gap-desktop` | component | `var(--spacing-024)` | **YES** | Icon gap on desktop |
| `--socials-icons-link-size-small-mobile` | component | `var(--sizing-040)` | **YES** | Small icon link size (mobile) |
| `--socials-icons-link-size-small-desktop` | component | `var(--sizing-048)` | **YES** | Small icon link size (desktop) |
| `--socials-icons-link-size-medium-mobile` | component | `var(--sizing-056)` | **YES** | Medium icon link size (mobile) |
| `--socials-icons-link-size-medium-desktop` | component | `var(--sizing-064)` | **YES** | Medium icon link size (desktop) |
| `--socials-icons-link-size-large-mobile` | component | `var(--sizing-064)` | **YES** | Large icon link size (mobile) |
| `--socials-icons-link-size-large-desktop` | component | `var(--sizing-072)` | **YES** | Large icon link size (desktop) |
| `--socials-icons-link-size-xl-mobile` | component | `var(--sizing-072)` | **YES** | XL icon link size (mobile) |
| `--socials-icons-link-size-xl-desktop` | component | `var(--sizing-080)` | **YES** | XL icon link size (desktop) |
| `--socials-icons-link-size-xxl-mobile` | component | `var(--sizing-080)` | **YES** | XXL icon link size (mobile) |
| `--socials-icons-link-size-xxl-desktop` | component | `var(--sizing-096)` | **YES** | XXL icon link size (desktop) |
| `--socials-icons-icon-size-small` | component | `var(--icons-size-icon-medium)` | NO | Semantic |
| `--socials-icons-icon-size-medium` | component | `var(--sizing-040)` | NO | Semantic |
| `--socials-icons-icon-size-large` | component | `var(--sizing-056)` | NO | Semantic |
| `--socials-icons-icon-size-xl` | component | `var(--sizing-064)` | NO | Semantic |
| `--socials-icons-icon-size-xxl` | component | `var(--sizing-072)` | NO | Semantic |
| `--socials-icons-icon-color` | component | `var(--section-text-color, var(--text-dark-1))` | **YES** | Icon fill color |
| `--socials-icons-icon-padding-inline` | component | `var(--spacing-008)` | **YES** | Icon internal padding |

#### H9. Icon Sizes

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--icons-size-icon-small` | component | `var(--sizing-016)` | NO | Semantic |
| `--icons-size-icon-medium` | component | `var(--sizing-024)` | NO | Semantic |
| `--icons-size-icon-large` | component | `var(--sizing-032)` | NO | Semantic |

#### H10. Carousel Featured Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--carousel-featured-billboard-card-width` | component | `400px` | **YES** | Billboard variant card width |
| `--carousel-featured-sbs-nav-offset` | component | `250px` | **YES** | Side-by-side nav button offset |

#### H11. Search Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--search-icon-gap` | component | `1ch` | **YES** | Search icon spacing |
| `--search-result-indent` | component | `34px` | **YES** | Search result indentation |
| `--search-overlay-padding-x` | component | `var(--spacing-024)` | **YES** | Search overlay horizontal padding (mobile) |
| `--search-overlay-padding-y` | component | `var(--spacing-024)` | **YES** | Search overlay vertical padding (mobile) |
| `--search-overlay-padding-x-desktop` | component | `60px` | **YES** | Search overlay horizontal padding (desktop) |
| `--search-overlay-padding-y-desktop` | component | `var(--spacing-056)` | **YES** | Search overlay vertical padding (desktop) |

#### H12. Utility Tokens

| Token Name | Category | Current Value | Overridable? | Notes |
|---|---|---|---|---|
| `--transparent` | component | `transparent` | NO | CSS value |

---

## Section 2: Currently Overridden by Brands

Based on analysis of existing brand token files:

### Lake Powell (`brands/lake-powell/tokens.css`)

The Lake Powell brand currently overrides these tokens:

1. **`--color-primary`** | `#b04c1a` (Aramark red → Lake Powell brown/rust)
2. **`--color-secondary`** | `#174355` (dark navy → Lake Powell teal)
3. **`--color-tertiary`** | `#639654` (Aramark secondary → Lake Powell green)
4. **`--color-header-background`** | `var(--color-grey-800)` (dark grey instead of secondary)
5. **`--h1-font-weight`** | `var(--font-weight-light)` (Light instead of Medium)
6. **`--h1-font-style`** | `italic` (Italic instead of normal)
7. **`--h1-line-height`** | `1.2` (Tighter line-height for display)
8. **`--cta-font-weight`** | `var(--font-weight-bold)` (Bold for uppercase buttons)
9. **`--cta-letter-spacing`** | `0.1em` (Extra wide tracking for CTAs)
10. **`--cta-text-transform`** | `uppercase` (Uppercase CTA text)
11. **`--brand-logo-width-mobile`** | `154px`
12. **`--brand-logo-height-mobile`** | `34px`
13. **`--brand-logo-width-desktop`** | `172px`
14. **`--brand-logo-height-desktop`** | `38px`

### Unbranded (`brands/unbranded/tokens.css`)

The Unbranded brand intentionally has **NO overrides** — it uses all root-tokens.css defaults as-is.

---

## Section 3: Recommended Brand-Overridable Tokens

### Priority Tier 1: MUST Override (Brand Identity)

These tokens define the visual brand identity and should be in every brand's `tokens.css`:

| Token | Reason | Example Override (Lake Powell) |
|---|---|---|
| `--color-primary` | Core brand color; used in CTAs, links, accents | `#b04c1a` (rust brown) |
| `--color-secondary` | Secondary brand color; used in headers, backgrounds | `#174355` (teal) |
| `--color-tertiary` | Tertiary accent color (optional but recommended) | `#639654` (green) |
| `--color-header-background` | Navigation bar background; critical for brand | `var(--color-grey-800)` |
| `--color-alerts-success`, `--color-alerts-error`, `--color-alerts-caution` | Status colors; may need brand-specific adjustments | As-is (shared system) |

### Priority Tier 2: SHOULD Override (Typography & Visual Hierarchy)

These tokens control the brand's typographic voice and visual polish:

| Token | Reason | Example Override (Lake Powell) |
|---|---|---|
| `--heading-font-family` | Brand typography personality (Petrona vs. Montserrat) | Petrona (serif) |
| `--body-font-family` | Body typography personality | Inter (sans-serif) |
| `--h1-font-weight` | H1-specific weight; often lighter for display | Light (300) |
| `--h1-font-style` | H1-specific style; italics for elegance | Italic |
| `--h1-line-height` | H1 leading; tighter for display text | 1.2 |
| `--cta-font-weight` | Button/CTA emphasis | Bold (700) |
| `--cta-letter-spacing` | Button tracking for impact | 0.1em (extra wide) |
| `--cta-text-transform` | Button case (uppercase for impact) | uppercase |
| `--body-font-size-m`, `--body-font-size-s`, `--body-font-size-xs` | Body text scale; may vary by brand readability preference | Considered; left as-is for Lake Powell |
| `--testimonial-font-weight`, `--testimonial-font-size` | Quote/testimonial styling | Considered; left as-is |

### Priority Tier 3: COULD Override (Component Customization)

These tokens allow fine-tuning of specific components and are good candidates for brand-specific customization:

| Token | Reason | When to Override |
|---|---|---|
| `--radius-xs`, `--radius-s`, `--radius-m`, `--radius-l`, `--radius-xl` | Border radius scale; sharper vs. rounder UI personality | Brand prefers sharp (tech-forward) vs. round (friendly) |
| `--button-padding-vertical`, `--button-padding-horizontal` | Button sizing; tighter vs. spacious | Brand button style preference |
| `--button-border-radius` | Button shape (pill vs. rounded vs. sharp) | Brand CTA visual style |
| `--layout-max-width-content`, `--layout-max-width-outer` | Page container widths; may vary by brand | Rare; only if brand has unique layout constraints |
| `--nav-height`, `--nav-height-homepage` | Navigation bar height; affects visual rhythm | Rare; usually matches primary brand size spec |
| `--brand-logo-width-mobile`, `--brand-logo-height-mobile`, `--brand-logo-width-desktop`, `--brand-logo-height-desktop` | Logo sizing in header; brand-specific dimensions | Always customize to brand logo aspect ratio |
| `--card-min-width` | Cards grid minimum width; affects responsive breakpoint | Brand layout preference |
| `--card-shadow`, `--shadow-*` tokens | Shadow depth; affects elevation/depth perception | Brand visual style (minimal vs. prominent shadows) |
| `--form-*` tokens | Form styling: padding, borders, sizing, colors | Brand form UX preference |
| `--input-padding`, `--input-border-radius` | Input field sizing and shape | Brand form style |
| `--carousel-featured-billboard-card-width`, `--carousel-featured-sbs-nav-offset` | Carousel sizing | Brand carousel layout preference |
| `--search-overlay-padding-*`, `--search-input-font-size-*` | Search input area sizing | Brand search UX style |
| `--socials-icons-*` | Social icon sizing and spacing | Brand footer/social block styling |
| `--transition-duration-fast`, `--transition-duration-normal`, `--transition-duration-slow` | Animation speed; affects perceived responsiveness | Brand motion personality (snappy vs. leisurely) |

### Priority Tier 4: DO NOT Override (System/Derived Values)

These tokens are computed from base tokens and should **never** be overridden directly. If you need to change them, override their source token instead:

| Token Category | Reason |
|---|---|
| `--color-*-50` through `--color-*-950` (all shade scales) | Automatically derived from base color via `color-mix()`; overriding breaks color harmony |
| `--sizing-*`, `--spacing-*` (primitive scales) | Fixed dimension system; do not override |
| `--surface-*`, `--stroke-*`, `--text-*` (semantic aliases) | Computed from base tokens; override sources instead |
| `--icons-color-*` (icon colors) | Derived from brand colors; change base color instead |
| All `color-neutral-*`, `color-brand-*` aliases | Change `--color-grey-*` or `--color-primary` instead |
| `--z-index-*` scale | Stacking order system; do not override |
| `--weight-*`, `--line-height-*`, `--letter-spacing-*` primitives | Core system values; rarely need override |

---

## Summary Statistics

**Total CSS Custom Properties:** 612

| Category | Count | Brandable | Not Brandable |
|---|---|---|---|
| Colors (base + shades + semantic) | 180 | 13 | 167 |
| Typography (fonts, weights, sizes, spacing) | 180 | 21 | 159 |
| Spacing & Sizing (primitives) | 60 | 0 | 60 |
| Layout (widths, heights, breakpoints) | 14 | 8 | 6 |
| Borders & Radius | 11 | 7 | 4 |
| Shadows | 8 | 8 | 0 |
| Z-Index | 8 | 0 | 8 |
| Aspect Ratios | 5 | 0 | 5 |
| Component-Specific | 146 | 77 | 69 |
| **TOTALS** | **612** | **134** | **478** |

**Recommendation:** Every new brand should override at minimum the **Tier 1 tokens** (13 color/header tokens) to establish visual identity. **Tier 2 tokens** (11 typography tokens) should be reviewed and customized to match the brand's typographic voice. **Tier 3 and beyond** can be customized as needed for component-specific visual refinements.

