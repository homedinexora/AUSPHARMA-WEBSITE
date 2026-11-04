---
name: auspharma-design-system
description: Use when building, styling, or reviewing any page, layout, or UI component of the AUSPHARMA website (Next.js + Tailwind). Defines the colour tokens, typography, spacing, layout grid, component patterns, imagery and accessibility rules every page must follow so the site looks consistent, trustworthy and not template-generic.
---

# AUSPHARMA Design System

The AUSPHARMA site is a corporate pharmaceutical website for the Indian market.
It has to read as **credible, clinical, calm and modern**: a company you would
trust with medicines. Every UI decision serves that goal.

**Core rule:** never hard-code a colour, font size, radius or shadow in a
component. Use the tokens below (Tailwind theme classes or CSS variables). If a
token is missing, add it to the theme first and then use it.

## 1. Tokens

Tokens live in `app/globals.css` in a Tailwind v4 `@theme` block. Values come from
the approved mockups; `auspharma-brand-guidelines` explains each one. Change them
here only, never in components.

```css
@import "tailwindcss";

@theme {
  /* Brand teal (from mockups) */
  --color-brand-50:  #f3f8f6;   /* alternate section bg */
  --color-brand-100: #dff6ef;   /* mint: verify card, info boxes, chips */
  --color-brand-600: #087f75;   /* primary: headings, links, buttons */
  --color-brand-700: #076b63;   /* teal text on mint, pressed */
  --color-brand-800: #08524c;   /* header, nav, dark cards */
  --color-brand-900: #06403c;   /* footer */

  --color-cta:        #ffb84d;  /* amber: one primary action per screen */
  --color-verify-600: #0877ad;  /* CoA / batch verification */
  --color-verify-50:  #e1f3ff;
  --color-hero-from:  #144764;
  --color-hero-to:    #12677d;

  /* Neutrals */
  --color-ink:      #173330;    /* headings, titles */
  --color-ink-soft: #586d6b;    /* body text (AA on white, brand-50, brand-100) */
  --color-line:     #dfe5ea;    /* borders, dividers */
  --color-surface:  #ffffff;
  --color-canvas:   #f3f8f6;

  /* Status */
  --color-success: #13795b;
  --color-warning: #a15c07;
  --color-danger:  #b42318;

  /* Typography: Inter only (supplied variable font) */
  --font-sans:    var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-inter), system-ui, sans-serif;

  /* Shape & depth */
  --radius-sm: 8px;    /* inputs, buttons */
  --radius-md: 12px;   /* cards */
  --radius-lg: 16px;   /* large panels, verify card */
  --shadow-card: 0 1px 2px rgb(23 51 48 / 0.06), 0 4px 16px rgb(23 51 48 / 0.06);
}
```

Therapy-area colours live in `lib/therapies.ts` (see `auspharma-brand-guidelines` §4),
not in the theme.

Load Inter from `assets/fonts/` with `next/font/local` in `app/layout.tsx`, exposing
`--font-inter` (snippet in `auspharma-brand-guidelines` §5). No Google Fonts requests.

## 2. Typography

| Role            | Classes                                                      |
|-----------------|--------------------------------------------------------------|
| Hero H1         | `font-display text-4xl md:text-6xl font-bold tracking-tight` |
| Section H2      | `font-display text-3xl md:text-4xl font-semibold tracking-tight` |
| Card / sub H3   | `font-display text-xl font-semibold`                         |
| Eyebrow label   | `text-sm font-semibold uppercase tracking-wider text-brand-600` |
| Body            | `text-base md:text-lg leading-relaxed text-ink-soft`         |
| Small / legal   | `text-sm text-ink-soft`                                      |

- One `h1` per page. Headings in order, no skipped levels.
- Body text measure: max `max-w-prose` (about 65 characters).
- Sentence case for headings and buttons ("Our manufacturing facility", not
  "Our Manufacturing Facility").
- Drug and molecule names keep their correct capitalisation; never stylise them.

## 3. Layout & spacing

- Page container: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`.
- Vertical section rhythm: `py-16 md:py-24`. Alternate `bg-surface` and
  `bg-canvas` between sections; do not stack two sections with the same background.
- Spacing scale: Tailwind's default 4px scale only (`gap-4`, `gap-6`, `gap-8`,
  `gap-12`). No arbitrary values like `mt-[37px]`.
- Grid: 12-column mentally; use `grid gap-8 md:grid-cols-2 lg:grid-cols-3` for
  card grids. Max 4 columns.
- Mobile first. Every layout must work at 360px wide with no horizontal scroll.

## 4. Components

Build these once in `components/ui/` and reuse them. Do not restyle one-offs inline.

- **Button**: variants `primary` (bg-brand-600, white text, hover brand-700),
  `cta` (bg-cta, text-brand-800, for the single key action such as "Verify"/"Search
  Now"), `verify` (bg-verify-600, white text, CoA actions only), `secondary`
  (white, `border-line`, ink text), `ghost` (text only). Sizes `md`, `lg`. Radius
  `rounded-sm`. Always has a visible `focus-visible` ring
  (`ring-2 ring-brand-600 ring-offset-2`). One `cta` button per view.
- **Card**: `bg-surface rounded-lg border border-line shadow-card p-6`. Hover lifts
  only when the whole card is a link.
- **Section header**: eyebrow + H2 + one-sentence intro, left-aligned by default;
  centred only for the hero and closing CTA.
- **Navbar** (per mockups): `bg-brand-800`, white logo left, product search centre,
  then a second row of therapy categories. Collapses to an accessible disclosure menu
  under `md`. No "Delivery address"/"Login" until compliance clears it (brand §7a).
- **Footer**: dark (`bg-brand-900`, white/85 text). Holds company details, the
  regulatory/legal links (Privacy, Terms, Disclaimer) and the medical disclaimer line.
- **Stat block**: large number (`font-display text-4xl text-brand-600`) + short
  label. Only use real, sourced numbers; never invent statistics.
- **Forms**: labels above inputs, `rounded-md border-line`, error text in
  `text-danger` with `aria-describedby`. Never rely on placeholder text as a label.

## 5. Imagery & icons

- Photography: real labs, manufacturing, people and quality control, bright and
  neutral-toned. No pills spilling out of bottles, no syringes, no
  sick-patient clichés.
- Use `next/image` with explicit `width`/`height` (or `fill` + `sizes`) and
  meaningful `alt`. Decorative images get `alt=""`.
- Icons: `lucide-react`, stroke 1.75, `size-5` inline / `size-8` in feature cards,
  coloured `text-brand-600`. One icon set only.
- Never use stock images that show a recognisable branded product from another company.

## 6. Accessibility (non-negotiable)

- WCAG 2.2 AA: text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI borders).
- Every interactive element is reachable and operable by keyboard, with a
  visible focus style.
- Respect `prefers-reduced-motion`; animations are subtle (opacity/translate,
  ≤ 200ms) and never block content.
- Use semantic landmarks: `header`, `nav`, `main`, `footer`; and a skip-to-content link.

## 7. Anti-patterns: do not ship

- Purple/blue "AI startup" gradients, glassmorphism, neon glows.
- Centred walls of text; more than two typefaces; emoji as icons.
- Lorem ipsum or invented facts (product names, certifications, addresses,
  statistics). Use a clearly marked `TODO(content):` placeholder instead.
- Medical or therapeutic claims in marketing copy (see the CDSCO note in `CLAUDE.md`).

## Review checklist

Before calling a page done:

- [ ] Only theme tokens used; no hex values or arbitrary sizes in components
- [ ] Renders correctly at 360px, 768px and 1280px (check with a Playwright screenshot)
- [ ] One `h1`, ordered headings, landmarks and skip link present
- [ ] Keyboard-navigable with visible focus; contrast passes AA
- [ ] Images via `next/image` with correct `alt`
- [ ] No placeholder or invented content left unmarked
