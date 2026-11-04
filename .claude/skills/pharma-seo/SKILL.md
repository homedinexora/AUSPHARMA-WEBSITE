---
name: pharma-seo
description: Use when adding or changing any route, page metadata, sitemap, robots rules, structured data (JSON-LD), Open Graph images, or performance-sensitive code on the AUSPHARMA Next.js website. Covers Next.js App Router SEO APIs, India-focused search setup, Core Web Vitals budgets, and SEO rules that stay within pharma compliance.
---

# SEO for the AUSPHARMA Website (Next.js App Router)

Goal: AUSPHARMA ranks for its **company name, capabilities and corporate topics**
(manufacturing, quality, careers, partnering) in India, while prescription-product
pages stay out of public search. SEO never overrides `pharma-content-compliance`.

> Next.js APIs evolve. Confirm signatures against the version-matched docs that
> `next dev` generates (`node_modules/next/dist/docs/`) before relying on this file.

## 1. Metadata: every route

Set a site-wide base in `app/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://TODO(content)-domain.in"),
  title: { default: "AUSPHARMA", template: "%s | AUSPHARMA" },
  description: "TODO(content): one-sentence corporate description, no product claims",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_IN", siteName: "AUSPHARMA" },
  robots: { index: true, follow: true },
};
```

Per page: `export const metadata` for static pages, `generateMetadata()` for dynamic
routes. Each page needs:

- **Unique `title`**: 50–60 characters, primary keyword first, no product claims.
- **Unique `description`**: 140–160 characters, factual, passes the compliance word check.
- **`alternates.canonical`**: the page's own path (relative; `metadataBase` resolves it).
- `<html lang="en-IN">` in the root layout. If Hindi pages are added, use
  `alternates.languages` (`en-IN`, `hi-IN`) for hreflang.

## 2. Crawl control

- **`app/robots.ts`** returns `MetadataRoute.Robots`: allow `/`, disallow
  `/hcp/` (gated professional content), `/admin/` and `/api/`, and point to the sitemap.
- **`app/sitemap.ts`** returns `MetadataRoute.Sitemap`: public pages only, with
  `lastModified`. **Never** include HCP-gated URLs, `/admin`, or Rx QR product pages.
- **QR product pages** (`/{GTIN}`, `/{GTIN}/{batch}`): **Rx products are `noindex`**.
  They exist for people holding the pack, not for search. OTC products may be indexed
  at `/{GTIN}` only. Batch URLs are always `noindex` with a canonical to `/{GTIN}`.
- **`/admin`** is never indexed (`noindex` + auth); it is not a public page.
- HCP-gated routes also set `robots: { index: false, follow: false }` in their
  metadata. `robots.txt` alone does not stop indexing.
- Preview deployments must not be indexed. Vercel adds `X-Robots-Tag: noindex` to
  non-production URLs by default; keep that on.

## 3. Structured data (JSON-LD)

Render JSON-LD in a Server Component, escaping `<` to prevent script injection:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
  }}
/>
```

Use:

- **`Organization`** (home page): `name`, `legalName`, `url`, `logo`, `address`
  (`PostalAddress`, `addressCountry: "IN"`), `contactPoint`, `sameAs` (official
  LinkedIn etc.). All values from AUSPHARMA, otherwise omit the field.
- **`WebSite`** (home page): `name`, `url`.
- **`BreadcrumbList`** on every nested page.
- **`JobPosting`** on careers listings, if jobs are published (follow Google's
  required fields).
- **`NewsArticle`** for press releases.

Do **not** add `Drug`, `MedicalWebPage` health claims, `Review` or `AggregateRating`
markup for prescription products. Structured data is public promotion too.

Validate with Google's Rich Results Test and the Schema.org validator before launch.

## 4. Social sharing

- `app/opengraph-image.tsx` (using `ImageResponse` from `next/og`) for a branded
  default 1200×630 image; per-section overrides where useful.
- OG images follow the design system tokens and carry no product claims.

## 5. Performance budgets (Core Web Vitals, measured on mobile)

| Metric | Budget |
|---|---|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| First-load JS per route | keep minimal; investigate with `next-bundle-optimizer` |

How to stay inside them:
- Server Components by default; `"use client"` only for real interactivity.
- `next/image` with explicit sizes; set `priority` on the hero image only.
- `next/font` for fonts (no layout shift, no external font requests).
- No third-party scripts before consent; load analytics with `next/script`
  `strategy="afterInteractive"` only after opt-in.
- Measure with Lighthouse (mobile) and Vercel Speed Insights after deploy.

## 6. India-specific search setup (launch tasks)

- Google Search Console: verify the domain, submit the sitemap. Also Bing Webmaster Tools.
- Google Business Profile for the registered office / plant, with the exact same
  name, address and phone as the site footer and `Organization` JSON-LD (NAP consistency).
- Prefer a `.in` or `.com` domain owned by AUSPHARMA; keep one canonical host
  (redirect `www` ↔ apex and `http` → `https`).

## 7. Content and URL rules

- One `h1` per page, matching the page's main search intent.
- Lowercase, hyphenated, stable URLs: `/about`, `/manufacturing`, `/quality`,
  `/careers`, `/news/[slug]`, `/contact`, `/report-side-effect`.
- Descriptive internal link text ("our quality systems", not "click here").
- Every image has meaningful `alt` text (no claims, no keyword stuffing).
- Custom `app/not-found.tsx` with links back to main sections.

## 8. Pre-launch SEO checklist

- [ ] `metadataBase`, unique title/description/canonical on every public page
- [ ] `robots.ts` and `sitemap.ts` present; HCP routes excluded and `noindex`
- [ ] `Organization`, `WebSite`, `BreadcrumbList` JSON-LD valid; no `Drug`/review markup
- [ ] OG image renders; `lang="en-IN"` set
- [ ] Lighthouse mobile: Performance ≥ 90, SEO = 100, Accessibility ≥ 95
- [ ] CWV within budget (§5)
- [ ] All meta text passes `pharma-content-compliance` §3 word check
- [ ] Search Console + sitemap submitted after production launch
