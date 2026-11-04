# Design reference: eurocross.in

Studied 2026-11-04 as **inspiration only**. Eurocross is another company's brand
(Saveo Healthtech Pvt Ltd); never copy its copy, graphics, logo, illustrations or
layout pixel-for-pixel. Screenshots: `eurocross-home.jpg` (desktop) and
`eurocross-qr-landing-mobile.jpg` (QR scan landing, 390px).

## What they do well (adopt the idea, in AUSPHARMA's own design)

1. **QR landing is mobile-first and action-led.** After a scan the page leads with
   one big card, "Verify the quality / Thank you for scanning", and a single primary
   button ("View lab report"). Secondary actions sit below as coloured tiles
   (plant video, GMP certificate, medicine details).
   → Our `/{GTIN}` page on mobile: product identity + **Certificate of Analysis**
   card first (batch selector if no batch in URL), then tiles for
   *Package insert*, *Manufacturer & WHO-GMP certificate*, *Report a side effect*.
2. **Trust strip under the hero.** Four icon + label items (certified, batch
   verification, ...) give the promise in one glance.
   → Ours: *WHO-GMP certified manufacturers*, *Batch-wise Certificate of Analysis*,
   *Scan-to-verify QR on every pack*, *Approved package insert online*.
3. **"Why us" quality pillars.** Four short process facts (audited QMS, batch
   manufacturing, controlled environment, regulatory acceptance), facts not adjectives.
   → Ours fits the "From Plant To Pack" steps in our mockup, reworded for sourcing
   from WHO-GMP partners (see brand guidelines §1a).
4. **Explains the pack.** An annotated pack graphic shows what each element on the
   box means (therapy icon, numbering, dosage tracker).
   → Ours: an annotated AUSPHARMA pack (therapy colour panel, QR code, batch
   number, MRP, "+a" mark) under "Where do I find my batch number?".
5. **Certificates are documents you can open**: "View EU-GMP Certificate" links to
   the actual certificate, not just a badge.
6. **Legal entity in the footer**: full registered name, address, phone, email.

## What not to copy

- **Patient testimonials** about results ("I've seen better results"). These are
  prohibited for us (`pharma-content-compliance` §3).
- **Single page with no navigation or links.** Ours needs crawlable pages (`pharma-seo`).
- Disabled-looking primary buttons when data hasn't loaded ("View lab report" rendered
  disabled). Ours renders server-side, so the CoA link is present on first paint or
  the page clearly says the batch isn't published yet.
- WhatsApp dosage reminders and "Track your dosage": out of scope for now (personal
  health data → DPDP consent, and messaging integrations).
- Fonts/colours: they use Poppins with navy/amber/green. We keep Inter and our teal
  palette (brand guidelines).
