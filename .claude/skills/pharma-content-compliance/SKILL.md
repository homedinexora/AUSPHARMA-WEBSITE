---
name: pharma-content-compliance
description: Use when writing, editing, or reviewing any public-facing content, page, product listing, form, or metadata on the AUSPHARMA website (India). Applies Indian drug-advertising rules (Drugs & Cosmetics Rules, Drugs and Magic Remedies Act, UCPMP 2024), pharmacovigilance, and DPDP privacy requirements. Load before any copy is written and before any page ships.
---

# Pharma Content Compliance (India)

AUSPHARMA's website is a public, general-audience channel. Indian law treats much
of what a pharma company publishes as **advertising or promotion**, so every
sentence, product page, image caption and meta description must pass this skill.

> **Not legal advice.** This skill is an engineering guardrail written from public
> sources. AUSPHARMA's regulatory/legal team must sign off on product pages,
> claims and the privacy notice before launch. When in doubt, **leave it out**
> and mark `TODO(regulatory):` with the question.

## 1. The rules this site must respect

| Source | What it means for the website |
|---|---|
| **Drugs & Cosmetics Act 1940 / Rules 1945:** Schedules **H, H1, X** | These are prescription-only medicines. Do **not** promote them to the general public. |
| **D&C Rules, Rule 106 + Schedule J** | No content may claim a drug prevents or cures any Schedule J disease or condition. |
| **Drugs and Magic Remedies (Objectionable Advertisements) Act 1954** | No advertisement suggesting a drug diagnoses, cures, mitigates, treats or prevents the diseases in its Schedule, and no misleading claims. (A 2020 amendment bill widening the list was drafted but **not enacted**; verify current status.) |
| **UCPMP 2024** (Dept. of Pharmaceuticals, mandatory for industry associations) | Promote a drug only **after marketing approval**, and only **within the approved terms** (indication, dosage, population). Claims must be balanced, evidence-based and up to date. Specific rules apply to the words **"safe"** and **"new"**; check the official text at pharma-dept.gov.in before using either. |
| **Pharmacovigilance Programme of India (PvPI)** | Give the public a clear way to report a suspected adverse drug reaction (ADR). |
| **DPDP Act 2023 + DPDP Rules 2025** (notified Nov 2025; notice/consent duties phase in to about **May 2027**) | Any form collecting personal data needs a clear notice, a purpose-specific consent, an easy way to withdraw it, and a grievance contact. Build to this standard **now**. |
| **ASCI Code** (self-regulatory) | Advertising must be truthful, substantiated, and not exploit fear. |

## 2. Content by page type

**Corporate pages** (About, Manufacturing, Quality, Careers, Contact, News)
- Allowed: company history, facilities, capabilities, therapeutic *areas* in neutral
  terms ("we manufacture cardiovascular and anti-diabetic formulations").
- Certifications (WHO-GMP, Schedule M, ISO, EU-GMP, USFDA): **only** ones AUSPHARMA
  actually holds, named exactly as on the certificate, with the issuing body.
  Unknown → `TODO(content):`.
- Numbers (years, products, countries, capacity): only from AUSPHARMA-supplied data.

**Product catalogue, public view**
- Prescription (Schedule H/H1/X) products: list at most **brand name, generic name
  and strength, dosage form, pack**. **No** indications, benefits, efficacy, imagery
  of patients, or "ask your doctor about…" calls to action.
- OTC products: claims must match the approved label exactly; no disease-cure language.
- Never show prices or "buy" / "order" / "add to cart" for prescription drugs. The
  site does not sell medicines.

**Product detail, healthcare professionals only**
- Indications, dosage, prescribing information and the approved label/PI PDF go behind
  an **HCP gate**: a modal or page stating *"This information is intended for
  registered medical practitioners and healthcare professionals only"* with
  "I am a healthcare professional" / "I am not" choices.
- The gate is a self-declaration, not verification; record the choice in a cookie
  only, with no personal data. Gated routes are `noindex` (see `pharma-seo`).
- Content must mirror the approved prescribing information; never paraphrase
  efficacy or safety data.

**News / blog / disease awareness**
- Disease-awareness content must be **unbranded**: no product names, no links from
  the article to a product page, and it ends with "Consult a registered medical
  practitioner."

## 3. Words and patterns that must not appear

Never use in public copy, alt text, meta descriptions or headings:

- Cure, cures, miracle, magic, guaranteed, permanent relief, 100% effective
- Safe / completely safe / no side effects / side-effect free *(see UCPMP: "safe" needs qualification)*
- New / latest breakthrough, for products on the Indian market for more than a year *(verify the exact UCPMP rule)*
- Best, No. 1, most effective, superior to [competitor], unless substantiated and approved
- Before/after imagery, patient testimonials, doctor endorsements of a product
- Fear-based copy ("Don't let diabetes kill you")

Quick check before committing copy:

```bash
grep -rniE "\b(cure[sd]?|miracle|magic|guarantee[d]?|100% (safe|effective)|no side.?effects?|side.?effect.?free|completely safe|best treatment|no\.? ?1)\b" app components content
```

Every hit needs a rewrite or a `TODO(regulatory):` note explaining why it stays.

## 4. Mandatory site elements

1. **Footer disclaimer** on every page:
   *"The information on this website is for general information only and is not a
   substitute for professional medical advice. Always consult a registered medical
   practitioner before starting, changing or stopping any medicine."*
2. **Report a side effect** page linked from the footer, with:
   - AUSPHARMA's pharmacovigilance contact: `TODO(content):` email + phone
   - PvPI national helpline **1800-180-3024** (toll-free) and the **ADR PvPI** mobile
     app. Verify both on ipc.gov.in before launch.
3. **Legal pages:** Privacy Policy, Terms of Use, Disclaimer, Cookie notice.
4. **Corporate identity:** registered name, registered office address, CIN, and
   drug manufacturing licence numbers, all `TODO(content):` until supplied.
   Never invent them.
5. **Grievance officer / data-protection contact** (DPDP): name/title + email.

## 5. Forms and personal data (DPDP)

For every form (contact, careers, ADR report, distributor enquiry):

- Collect **only** fields needed for the stated purpose. ADR reports may need health
  data, so treat them as sensitive: minimal fields, HTTPS, no analytics on that page.
- Show a short **notice beside the submit button**: what is collected, why, how
  long it's kept, and a link to the Privacy Policy.
- Consent checkbox **unticked by default**, one per purpose (e.g. "contact me
  about this enquiry" separate from "send me newsletters").
- Withdrawing consent must be as easy as giving it: link to a request form or email.
- **Analytics and marketing cookies load only after opt-in.** Strictly necessary
  cookies only by default.
- Never send form data to third parties (CRMs, email tools) without it being named in
  the Privacy Policy.

## 6. Review checklist (run before any page ships)

- [ ] No prescription-drug promotion visible to the public; HCP content gated and `noindex`
- [ ] No banned words or patterns (§3); grep check clean or each hit justified
- [ ] Every claim, number and certification traceable to AUSPHARMA-supplied source
- [ ] Footer disclaimer, "Report a side effect" link and legal links present
- [ ] Forms follow §5; analytics gated behind consent
- [ ] Images: no patients with branded products, no before/after, licensed stock only
- [ ] All `TODO(content):` and `TODO(regulatory):` items listed for AUSPHARMA review
- [ ] Regulatory/legal sign-off recorded before production launch
