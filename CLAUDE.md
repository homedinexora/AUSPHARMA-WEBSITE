# AUSPHARMA Website

Corporate website for AUSPHARMA, a pharmaceutical company operating in **India**.

## Stack

- **Next.js 16.3+** (App Router, TypeScript, React Server Components by default). 16.3+ makes
  `next dev` generate version-matched agent docs; follow them.
- **Tailwind CSS v4** with design tokens in `app/globals.css`
- **Deployment:** Vercel
- Package manager: npm

## Project skills

- `auspharma-design-system`: load before building or reviewing any page or component.
  All styling follows its tokens and rules.
- `pharma-content-compliance`: load before writing or reviewing any public content,
  product listing, form or metadata. Indian drug-advertising, pharmacovigilance and DPDP rules.
- `pharma-seo`: load when adding routes, metadata, sitemap/robots, JSON-LD or OG images.
- `auspharma-brand-guidelines`: name, logo, colours (incl. therapy colours), Inter font,
  voice. Sources in `docs/design/` (mockups, therapy colour guide); fonts in `assets/fonts/`.
  Use it instead of `example-skills:brand-guidelines` (Anthropic's brand).

## Product verification system (core feature)

Packs carry a QR code to `auspharma.in/{GTIN}` (GS1 GTIN-13, e.g. `8906219880070`),
optionally `/{GTIN}/{batch}`. The product page shows label data, the approved package
insert and the batch Certificate of Analysis, with a batch selector when no batch is
in the URL. An authenticated `/admin` lets AUSPHARMA staff manage pack data and upload
CoA PDFs per GTIN + batch. QR URLs are printed on packs: **never change this URL
scheme**, and keep old GTIN/batch URLs working forever.

## Browser tools

- **Our own site (local `next dev` or a preview deployment):** use `agent-browser`, via
  the `next-dev-loop` skill. Install if missing: `npm i -g agent-browser && agent-browser install`.
- **Other websites (research, references):** use gstack's `/browse` skill.
- Never use `mcp__claude-in-chrome__*` tools.

## Workflow: which skills to use when

| Task | Skill |
|------|-------|
| New page, section or feature | `superpowers:brainstorming`, then `superpowers:writing-plans` |
| Building UI | `auspharma-design-system` + `example-skills:frontend-design` + `agent-protocols:frontend-ui-engineering` |
| React/Next.js code | `vercel-plugin:react-best-practices`, `vercel-composition-patterns` |
| Vercel platform (storage, env vars, functions, domains, auth) | `vercel-plugin` skills, e.g. `vercel-storage`, `env-vars`, `vercel-functions`, `domains` |
| Framework/library questions | `agent-protocols:source-driven-development` (check official Next.js docs) |
| Logic (forms, utilities) | `superpowers:test-driven-development` |
| Visual check | Playwright: screenshot at 360px, 768px and 1280px |
| Confirm a change works in the running app | `next-dev-loop` (needs `next dev` running) |
| Slow pages or large bundles | `next-bundle-optimizer`, `next-cache-components-*`, `next-partial-prefetching-*` |
| Before claiming done | `superpowers:verification-before-completion` |
| Writing any copy or product listing | `pharma-content-compliance` + `writing-guidelines` |
| Routes, metadata, sitemap, JSON-LD | `pharma-seo` |
| Before merging | `agent-protocols:code-review-and-quality`, `agent-protocols:security-and-hardening`, `web-design-guidelines`, `pharma-content-compliance` checklist |
| Before going live | `agent-protocols:shipping-and-launch`, `agent-protocols:performance-optimization` |
| Deploying | `/vercel-plugin:deploy` (preview by default; confirm with the user before any production deploy) |

## Content rules (India / CDSCO)

Summary only; `pharma-content-compliance` has the full rules and review checklist.
The site is for a general audience, so:

- **No promotion of prescription (Schedule H/H1/X) medicines to the public.** Product
  information for prescription drugs belongs behind a "For healthcare
  professionals only" gate, or is limited to name, composition and dosage form.
- **No therapeutic claims** in marketing copy ("cures", "best treatment", "100% safe").
  Nothing that could fall under the Drugs and Magic Remedies (Objectionable
  Advertisements) Act.
- Every page footer carries a medical disclaimer and links to Privacy Policy, Terms of Use
  and Disclaimer. Privacy handling of any form data must follow the DPDP Act 2023.
- **Never invent facts:** product names, certifications (WHO-GMP, etc.), addresses,
  licence numbers or statistics. Mark unknown content with `TODO(content):` for
  AUSPHARMA to supply.

## Conventions

- Components in `components/` (shared UI primitives in `components/ui/`), routes in `app/`.
- Server components by default; add `"use client"` only where interactivity requires it.
- Run `npm run lint` and `npm run build` before every commit; both must pass.
