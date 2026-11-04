# AUSPHARMA Website

Corporate website for AUSPHARMA, a pharmaceutical company operating in **India**.

## Stack

- **Next.js** (App Router, TypeScript, React Server Components by default)
- **Tailwind CSS v4** with design tokens in `app/globals.css`
- **Deployment:** Vercel
- Package manager: npm

## Project skills

- `auspharma-design-system` (`.claude/skills/auspharma-design-system/`): load before
  building or reviewing any page or component. All styling follows its tokens and rules.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use
`mcp__claude-in-chrome__*` tools.

## Workflow: which skills to use when

| Task | Skill |
|------|-------|
| New page, section or feature | `superpowers:brainstorming`, then `superpowers:writing-plans` |
| Building UI | `auspharma-design-system` + `example-skills:frontend-design` + `agent-protocols:frontend-ui-engineering` |
| React/Next.js code | `vercel-react-best-practices`, `vercel-composition-patterns` |
| Framework/library questions | `agent-protocols:source-driven-development` (check official Next.js docs) |
| Logic (forms, utilities) | `superpowers:test-driven-development` |
| Visual check | Playwright: screenshot at 360px, 768px and 1280px |
| Before claiming done | `superpowers:verification-before-completion` |
| Before merging | `agent-protocols:code-review-and-quality`, `agent-protocols:security-and-hardening`, `web-design-guidelines` |
| Before going live | `agent-protocols:shipping-and-launch`, `agent-protocols:performance-optimization` |
| Deploying | `deploy-to-vercel` (confirm with the user before any deploy) |

## Content rules (India / CDSCO)

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
