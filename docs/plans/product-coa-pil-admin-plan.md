# Plan: product data, CoA and PIL management

Status: **agreed approach, not yet built** (2026-11-04).
Owner: AUSPHARMA website team. Related: `CLAUDE.md` → "Product verification system".

## Goal

Every pack's QR code (`auspharma.in/{GTIN}`, optionally `/{GTIN}/{batch}`) opens a page
showing the product's approved label data, its **Patient Information Leaflet (PIL)** and
the **Certificate of Analysis (CoA)** for the batch. AUSPHARMA staff maintain all of it in
an authenticated `/admin`, and nothing becomes public until QA approves it.

## Data model

| Record | Key fields | Maintained by |
|---|---|---|
| **Manufacturer** (WHO-GMP partner site) | ID, legal name, address, manufacturing licence no(s)., WHO-GMP certificate no., issuing authority, **valid until**, certificate PDF | Admin, rarely |
| **Product** (one per pack / GTIN) | **GTIN-13**, brand name, composition, dosage form, pack size, pack type, schedule, therapy area, manufacturer, manufacturing licence no., marketed by, MRP (+ per), storage, shelf life, pack photo, status | Data entry, once per product |
| **PIL version** (many per product) | version, date of revision, **approved PDF** (master), structured sections (below), status | Data entry drafts, QA publishes |
| **Batch** | GTIN + **batch no.**, mfg date, expiry date, optional batch MRP, **CoA PDF**, PIL version packed, status (draft / published / withdrawn) | QA, every batch |
| **Audit log** | who, what, when, before/after | Automatic |

Open question: if MRP changes between batches, batch MRP overrides product MRP (field already exists).

## 1. Entering products

**First load: spreadsheet import**
1. Admin → *Download template* (`docs/templates/AUSPHARMA_Product_Import_Template.xlsx`).
2. Team fills Manufacturers → Products → Batches. The sheet self-checks GTIN check digits,
   duplicates, unknown IDs and date order (✓ / ✗ columns).
3. Upload. The importer re-validates every row server-side and shows a preview:
   *"42 ready, 3 with errors"*, with plain-language reasons. Fix and re-upload, or confirm the rest.
   Rows marked EXAMPLE are ignored.
4. Bulk-upload PDFs/images named by rule (below); they attach automatically.

**Ongoing: forms.** Products → *Add product* → saved as **Draft** → QA **Publishes**.
Only then does `/{GTIN}` go live.

## 2. Adding CoAs

**A. Single:** CoA → *Upload* → find product (name/GTIN) → batch no., mfg/expiry dates → PDF.

**B. Bulk (everyday route):** drop many PDFs named `{GTIN}_{BATCH}.pdf`.
- File names are parsed and matched; new batches are created; unmatched files are listed with reasons.
- **Safety check:** the PDF's text is searched for the batch number, with a warning if absent
  (catches mis-named files). Scanned image PDFs can't be checked and are flagged for manual review.
- Dates come from the Batches sheet or are typed on the preview screen.

**After upload:** QA approves → published. *Replace* keeps history. *Withdraw* (e.g. recall)
shows a clear warning on that batch's page instead of the CoA.

**Phase 2:** manufacturing partners get logins scoped to their own products to upload CoAs
directly; AUSPHARMA QA still approves each.

## 3. Entering the PIL

Three inputs, one approved result:
1. **Approved PDF (required):** the printed leaflet stays the master and is always downloadable.
2. **Structured sections (for a readable mobile page):** standard sections:
   1. Name & composition
   2. Dosage form & presentation
   3. What it is used for
   4. Before you take it: contraindications, warnings, precautions
   5. Interactions
   6. Pregnancy, breastfeeding, driving
   7. How to take it: dose, missed dose, overdose
   8. Possible side effects + how to report
   9. Storage
   10. Manufacturer & marketer
   11. Date of revision / version

   Empty sections are hidden, and custom sections can be added for leaflets that need them.
   Formatting is limited to bold, lists and tables.
3. **Pre-fill:** *Extract text from PDF* fills the sections as a starting point. Staff verify
   every section against the approved copy before saving. Extracted text is never published unchecked.

**Versioning:** edits create a new version; old versions are kept. QA compares with the approved
leaflet and publishes. Each batch records the **PIL version packed** with it, so an older batch
shows its own leaflet, with a note when a newer one exists.

**Compliance:** the public Rx page shows the **approved leaflet text**, not marketing-style
"Uses / Side effects" chips (see `pharma-content-compliance`). Regulatory to confirm.

## File naming rules

| File | Name | Example |
|---|---|---|
| WHO-GMP certificate | `{ManufacturerID}_WHO-GMP.pdf` | `MFR-001_WHO-GMP.pdf` |
| PIL (approved leaflet) | `{GTIN}_PIL.pdf` | `8906219880070_PIL.pdf` |
| CoA | `{GTIN}_{Batch}.pdf` | `8906219880070_AB24017.pdf` |
| Pack photo | `{GTIN}.jpg` | `8906219880070.jpg` |

Batch numbers: letters, digits, hyphens only (they become part of the QR URL).

## What a customer sees after scanning (mobile first)

| Scan | Result |
|---|---|
| `/{GTIN}/{batch}`, published | Product identity → **View Certificate of Analysis** card → tiles: PIL, Manufacturer & WHO-GMP certificate, Report a side effect |
| `/{GTIN}` (no batch) | Same, with a **batch selector** ("Find the batch no. printed on your pack") |
| Batch not yet published | "The report for batch X isn't published yet" + contact + side-effect reporting |
| Unknown GTIN | Clear "product not found". Never a guess. |
| Withdrawn batch | Prominent warning, no CoA |

PIL section: collapsible headings, text-size control, *Download approved leaflet (PDF)*, version + revision date.

## Roles

- **Data entry:** create/edit drafts, upload files.
- **QA approver:** publish / withdraw products, PIL versions, batches. Only QA can make anything public.
- **Admin:** users, manufacturers, everything else.
- Audit log on every change. **WHO-GMP expiry alert** 60 days before `valid until`; an expired
  certificate is never shown as current.

## Build order

1. Foundation: Postgres + Blob storage, admin auth (company email allow-list), roles, audit log.
2. Manufacturers + products: forms, Excel import, PIL editor (PDF, sections, extract, versions).
3. Batches + CoAs: single + bulk upload, batch-number check, approval, withdraw.
4. Public pages: `/{GTIN}`, `/{GTIN}/{batch}`, batch selector, mobile-first, `noindex` for Rx.
5. Expiry alerts. Phase 2: manufacturer partner logins.

Proposed stack (pending confirmation): Next.js on Vercel, Vercel Postgres (Neon), Vercel Blob.

## Needed from AUSPHARMA

1. Current product list (any format), or the filled template.
2. One sample **CoA** PDF and one sample **PIL** PDF.
3. Manufacturing partners + WHO-GMP certificates.
4. How CoAs arrive today (manufacturer email? own QA?).
5. Does MRP change by batch?
6. Admin users and their roles (data entry / QA / admin).
