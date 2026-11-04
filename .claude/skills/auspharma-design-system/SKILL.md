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

Tokens live in `app/globals.css` in a Tailwind v4 `@theme` block. The brand
palette is a **placeholder** until AUSPHARMA supplies official brand colours:
change the values here only, never in components.

```css
@import "tailwindcss";

@theme {
  /* Brand: placeholder, swap for official values */
  --color-brand-50:  #eef7f7;
  --color-brand-100: #d5ecec;
  --color-brand-500: #0f7c80;   /* primary: clinical teal */
  --color-brand-600: #0b6467;   /* primary hover */
  --color-brand-700: #0a4f52;
  --color-brand-900: #062f31;

  --color-accent-500: #1f4fd1;  /* links, focus, secondary CTA */

  /* Neutrals: slightly cool greys */
  --color-ink:      #0f1b24;    /* headings, body text */
  --color-ink-soft: #46535e;    /* secondary text (≥4.5:1 on white) */
  --color-line:     #dfe5ea;    /* borders, dividers */
  --color-surface:  #ffffff;
  --color-canvas:   #f6f8fa;    /* alternating section background */

  /* Status */
  --color-success: #13795b;
  --color-warning: #a15c07;
  --color-danger:  #b42318;

  /* Typography */
  --font-sans:    var(--font-inter), system-ui, sans-serif;
  --font-display: var(--font-manrope), var(--font-inter), system-ui, sans-serif;

  /* Shape & depth */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-card: 0 1px 2px rgb(15 27 36 / 0.06), 0 4px 16px rgb(15 27 36 / 0.06);
}
```

Load fonts with `next/font/google` in `app/layout.tsx` (Inter for body, Manrope
for display), exposing `--font-inter` and `--font-manrope`. Never use a `<link>`
tag to Google Fonts.

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

- **Button**: variants `primary` (bg-brand-500, white text, hover brand-600),
  `secondary` (white, `border-line`, ink text), `ghost` (text only). Sizes `md`,
  `lg`. Radius `rounded-md`. Always has a visible `focus-visible` ring
  (`ring-2 ring-accent-500 ring-offset-2`). One primary button per view.
- **Card**: `bg-surface rounded-lg border border-line shadow-card p-6`. Hover lifts
  only when the whole card is a link.
- **Section header**: eyebrow + H2 + one-sentence intro, left-aligned by default;
  centred only for the hero and closing CTA.
- **Navbar**: sticky, white with bottom `border-line`, logo left, 5–6 links max,
  one primary CTA ("Contact us"). Collapses to an accessible disclosure menu
  under `md`.
- **Footer**: dark (`bg-brand-900`, white/70 text). Holds company details, the
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
  coloured `text-brand-500`. One icon set only.
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
