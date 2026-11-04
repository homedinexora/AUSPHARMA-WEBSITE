---
name: auspharma-brand-guidelines
description: Use for anything carrying the AUSPHARMA / AUS Pharma brand on the website: logo and name usage, brand colours, therapy-area colours, typography (Inter), imagery, tone of voice, OG images and favicons. Source of truth is the approved website mockups and the Rx therapy colour guide in docs/design/. For AUSPHARMA, use this skill, not example-skills:brand-guidelines (that one is Anthropic's brand).
---

# AUSPHARMA Brand Guidelines

**Sources (in `docs/design/`):**
- `mockup-home.jpg`, `mockup-category.jpg`, `mockup-product.jpg`: approved website
  designs, extracted from `website-designs.pptx`.
- `therapy-colour-guide.docx`: Rx range therapy colours (Pantone is master).
- Fonts: `assets/fonts/Inter-Variable.ttf` and `Inter-Italic-Variable.ttf` (SIL OFL 1.1, `OFL.txt`).

Colour values below were sampled from the mockups, then adjusted only where needed
to pass WCAG AA. Check any new pair with:

```bash
node .claude/skills/auspharma-brand-guidelines/contrast.mjs "<text hex>" "<background hex>"
```

## 1. Name

| Use | Form |
|---|---|
| Brand / wordmark / headings | **AUS Pharma** |
| Legal entity (footer, product pages, "Marketed by", CoA, legal pages) | **Auspharma Private Limited** |
| Domain | auspharma.in (canonical host: confirm `www.auspharma.in` vs apex) |

`TODO(brand):` the mockups use "AUS Pharma", "Auspharma Pvt Ltd" and the brief uses
"Auspharma Private Limited". Confirm the final wordmark spelling with AUSPHARMA.
Never write "Aus Pharma", "AusPharma" or "AUS-Pharma" in UI copy.

Strapline (from mockups): **"Quality generics you can verify"**.

## 2. Logo

- Mockup logo: a white rounded square holding a teal **"A"**, followed by the
  **AUS Pharma** wordmark in Inter Bold, white on the brand header.
- `TODO(brand):` no logo file has been supplied. Until it is, build the logo as an
  inline SVG component (`components/brand/Logo.tsx`) that reproduces the mockup mark,
  so swapping in the official SVG later is a one-file change.
- When the official logo arrives: put `logo.svg`, `logo-white.svg` and `mark.svg` in
  `public/brand/`, then generate `app/icon.svg`, `app/apple-icon.png` (180×180) and
  the OG image from it.
- Rules: keep clear space of at least the height of the "A" on every side. Minimum
  height 24px. Never stretch, recolour outside the palette, add shadows or effects, or
  place it on a busy photo.

## 3. Brand colours (website)

| Token | Hex | Use |
|---|---|---|
| `brand-900` | `#06403C` | Footer |
| `brand-800` | `#08524C` | Header and nav bar, dark side cards ("Quality you can verify"), "Seek medical help" panel |
| `brand-700` | `#076B63` | **Teal text on mint** (small text), pressed states |
| `brand-600` | `#087F75` | Primary teal: section headings, links, selected category, step dots, badges, primary buttons |
| `brand-100` | `#DFF6EF` | Mint: Verify card, info boxes, chips, Rx notice |
| `brand-50`  | `#F3F8F6` | Alternate section background |
| `cta`       | `#FFB84D` | Amber call-to-action ("Search Now", "Verify Your Medicine"). Text on it: `brand-800` or `ink` |
| `verify-600`| `#0877AD` | CoA / batch-verification blue: "View Certificate" button |
| `verify-50` | `#E1F3FF` | "Verify the quality" banner background |
| `hero-from` / `hero-to` | `#144764` → `#12677D` | Home hero gradient (navy to teal), white text |
| `ink`       | `#173330` | Headings, product titles, body emphasis |
| `ink-soft`  | `#586D6B` | Body and secondary text (mockup `#617775` darkened to pass AA on `brand-50`) |
| `line`      | `#DFE5EA` | Card borders and dividers (decorative only, not for meaningful UI) |

Contrast-checked pairs (all ≥ 4.5:1): white on `brand-600/800/900`, hero gradient and
`verify-600`; `ink`/`brand-800` on `cta`; `brand-700` and `ink-soft` on `brand-100`;
`ink-soft` on `brand-50` and white.
**Do not** put `brand-600` small text on `brand-100` (4.31:1); use `brand-700`.

Proportion: mostly white/`brand-50` surfaces, teal for structure, **amber only for
the single most important action** on a screen, verify-blue only for CoA/batch features.

## 4. Therapy-area colours

From the Rx therapy colour guide. On the website they mark **category identity only**:
category icons, a thin label pill, the pack-panel illustration. They never replace
the brand teal for buttons, links or headings. Same therapy, same colour, everywhere.

| Therapy | Panel (pack) | Web text-safe variant (white text) | Tint | Status |
|---|---|---|---|---|
| Cardiology | `#C8102E` | same | `#FABBCB` | Decided |
| Diabetes | `#0077B6` | same | `#99D6EA` | Decided |
| Anti-infectives | `#44883E` | **`#3D7A37`** (pack green fails AA with white text) | `#ADDC91` | Proposed |
| Pain, fever & inflammation | `#B94700` | same | `#FDBE87` | Proposed |
| Respiratory & anti-allergy | `#007F75` | same | `#7CE0D3` | Proposed |
| Gastro | `#D0006F` | same | `#F1A7DC` | Proposed |
| CNS / Neuro | `#6A2C91` | same | `#C5B4E3` | Proposed |

- Text on tints: always `ink` (all ≥ 7:1).
- Hex values are screen conversions; **Pantone is the master** for print. Don't
  "correct" pack photos to these hexes.
- `TODO(brand):` five therapies are "Proposed". Store them in one config
  (`lib/therapies.ts`) so approval changes are a one-line edit.
- Mockup navigation categories ("Cardiovascular & Chronic Disease", "Pain Relief &
  Anti-Inflammatory", "Anti-Infectives & Antibiotics", "Gastrointestinal Medicines",
  "Respiratory & Allergy Medicines") don't map 1:1 to the colour guide (Diabetes and
  CNS have no nav item yet). `TODO(brand):` confirm the final category list.

## 5. Typography

**Inter only** (variable font, supplied). Load with `next/font/local`:

```ts
import localFont from "next/font/local";
export const inter = localFont({
  src: [
    { path: "../assets/fonts/Inter-Variable.ttf", style: "normal" },
    { path: "../assets/fonts/Inter-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
});
```

| Role | Style (from mockups) |
|---|---|
| Hero H1 | 48–56px, weight 500–600, white, tight leading |
| Section H2 ("From Plant To Pack") | 28–32px, weight 500, `brand-600` |
| Card / product title | 18–20px, weight 600, `ink` |
| Eyebrow ("AUS PHARMA · QUALITY GENERICS", "STEP 1") | 12–13px, weight 600–700, uppercase, letter-spacing ~0.06em |
| Body | 15–16px, weight 400, `ink-soft`, line-height 1.6 |
| Field label ("COMPOSITION", "PACK SIZE") | 11–12px, weight 600, uppercase, `ink-soft` |

Mockup H2s use Title Case ("Browse By Category"). `TODO(brand):` confirm; the design
system's default is sentence case.

## 6. Signature UI patterns (from the mockups)

- **Verify card:** mint card with item + batch selectors and an amber button. It is
  the brand's core promise; keep it prominent on home and product pages.
- **Plant-to-pack steps:** dot-and-line timeline, 4 steps.
- **Category browser:** left list of therapy pills, right panel of product cards.
- **Product card:** pack image on a light tile, pack size + `OTC`/`RX` outline badge,
  title, composition, "View Details >".
- **Verify the quality banner** (product page): `verify-50` background, ribbon-seal
  illustration, `verify-600` "View Certificate" button.
- **Quality side card:** `brand-800` card with tick list + amber button.
- Rounded corners ~12px on cards, ~8px on inputs and buttons; soft shadows; generous whitespace.

## 7. Imagery

- Pack renders: front-facing strip or carton on a light tile, consistent angle and
  lighting across products. Use real approved pack artwork; never mock up a pack
  for a product that doesn't exist.
- Photography (when used): the WHO GMP plant, QC lab and real staff (with consent),
  bright and clean. No stock images of pills spilling, syringes or distressed patients.
- Icons: thin-stroke line icons (lucide), `brand-600`.

## 7a. Brand-level conflicts with compliance (resolve before build)

The mockups include elements `pharma-content-compliance` flags. Don't build them
as drawn until AUSPHARMA's regulatory team decides:

- **Public "Uses", "How to take", "Side effects", "Safety advice", "Starts in / Lasts"
  on Rx (Schedule H) products.** Public promotion risk. Show the approved package
  insert instead; the QR page shows label data + insert.
- **"Generally safe" chip.** Uses "safe"; rephrase (e.g. "Use caution").
- **"Delivery Address" + "Login" in the header, "Search Medicines".** Implies an
  online pharmacy. Drop delivery/login unless AUSPHARMA really sells online (which
  has its own licensing). Keep search as "Search products".
- **"Heart protection", "Cardiovascular risk" use chips.** Therapeutic claims.

## 8. Voice

- Plain, calm, factual, in Indian English spelling (colour, organisation, licence).
- Promise **verifiability**, not superiority: "Check the test report for your batch",
  not "India's best generics".
- Short sentences. Explain technical terms once (e.g. "Certificate of Analysis (CoA)").
- All copy also passes `pharma-content-compliance` §3.
