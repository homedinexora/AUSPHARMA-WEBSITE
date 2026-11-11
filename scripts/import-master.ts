/**
 * One-off import of the ERP product master (JSON rows: ITEMID, ITEMNAME, BRAND, PACK, CLASSIFICATION, …)
 * plus facts confirmed from approved artwork/inserts. Everything is imported as DRAFT: nothing is public
 * until QA publishes it in the admin.
 *
 * Usage: set -a; . ./.env.local; set +a; npx tsx scripts/import-master.ts <master.json> [--inserts]
 *
 * WARNING: re-running overwrites name, composition, pack and CONFIRMED fields of existing products
 * (status is never changed). Once staff edit products in /admin, use the admin instead of this script.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../db/schema";
import { parseInsert } from "../lib/insert-parser";

type Row = Record<string, string | null>;
const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const { manufacturers, products, pilVersions, auditLog } = schema;
const ACTOR = "import:master-2026-11-04";

/** Manufacturing sites confirmed from approved artwork / inserts (not from the ERP column). */
const SITES = [
  {
    id: "MFR-WINDLAS-P2",
    legalName: "Windlas Biotech Limited (Plant-2)",
    address: "Khasra No. 141 to 143 & 145, Mohabewala Industrial Area",
    city: "Dehradun",
    state: "Uttarakhand",
    pinCode: "248110",
    licenceNumbers: "34/UA/2013",
  },
  {
    id: "MFR-PURECURE",
    legalName: "Pure & Cure Healthcare Pvt. Ltd. (A subsidiary of Akums Drugs & Pharmaceuticals Ltd.)",
    address: "Plot No. 26A, 27-30, Sector-8A, I.I.E., SIDCUL, Ranipur",
    city: "Haridwar",
    state: "Uttarakhand",
    pinCode: "249403",
    licenceNumbers: "31/UA/2013",
  },
  {
    id: "MFR-MALIK",
    legalName: "Malik Lifesciences Pvt. Ltd. (A subsidiary of Akums Drugs & Pharmaceuticals Ltd.)",
    address: "Plot No. 16, Vardhman Indl. Estate, Vill- Bahadarpur Saini, N.H.58",
    city: "Haridwar",
    state: "Uttarakhand",
    pinCode: "247667",
    licenceNumbers: "48/UA/SC/P-2013",
  },
];

/** Per-SKU facts read from approved carton artwork (QR/barcode, licence, cautions) and inserts. */
const CONFIRMED: Record<string, Partial<typeof products.$inferInsert>> = {
  AUS0093: { gtin: "8906219880018", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880018.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 25°C." },
  AUS0094: { gtin: "8906219880025", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880025.webp" },
  AUS0095: { gtin: "8906219880032", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880032.webp" },
  AUS0092: { gtin: "8906219880049", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880049.webp" },
  AUS0098: { gtin: "8906219880063", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880063.webp" },
  // Cartons received 2026-11-04 (barcode + QR decoded; licence/manufacturer/storage read from panels).
  // ACEELO and ACEELO PS are NSAIDs (confirmed by AUSPHARMA); ACEELO's ERP category is MUSCLE RELAXANT.
  ACE0943: {
    therapy: "pain-fever-inflammation",
    composition: "Each film coated tablet contains: Aceclofenac IP 100 mg; Paracetamol IP 325 mg; Chlorzoxazone USP 250 mg. Colours: Sunset Yellow FCF & Titanium Dioxide IP", // from the approved insert
    gtin: "8906219880247", manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "31/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880247.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." },
  ACE0949: {
    therapy: "pain-fever-inflammation",
    composition: "Each film coated tablet contains: Aceclofenac IP 100 mg; Paracetamol IP 325 mg; Serratiopeptidase IP 15 mg (as enteric coated granules equivalent to enzyme activity 30,000 units). Colours: Sunset Yellow FCF & Titanium Dioxide IP", // from the approved insert
    gtin: "8906219880254", manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "51/UA/SC/P-2013", schedule: "H", packImageBlob: "/packs/8906219880254.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." },
  AUS0090: {
    composition: "Each film coated tablet contains: Cilnidipine IP 10 mg. Colour: Titanium Dioxide IP", // from the approved mono carton (Nov 2026)
    gtin: "8906219880070", manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "31/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880070.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." },
  AQU0447: {
    composition: "Each film coated tablet contains: Amoxycillin Trihydrate IP eq. to Amoxycillin 500 mg; Potassium Clavulanate Diluted IP eq. to Clavulanic Acid 125 mg. Colour: Titanium Dioxide IP", // from the approved insert
    gtin: "8906219880186", manufacturerId: "MFR-MALIK", manufacturingLicenceNo: "48/UA/SC/P-2013", schedule: "H", packImageBlob: "/packs/8906219880186.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 25°C." },
  AUS0099: {
    composition: "Each uncoated sustained release tablet contains: Metformin Hydrochloride IP 1000 mg", // from the approved mono carton (Nov 2026)
    gtin: "8906219880148", manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "31/UA/2013", schedule: "G", packImageBlob: "/packs/8906219880148.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." },
  // Bone Plus 500 = CALVITD3 renamed on pack (confirmed by AUSPHARMA). Schedule not printed: left unset.
  AQU0486: {
    gtin: "8906219880193",
    brandName: "AQURIS BONE PLUS 500 TAB 15'S",
    composition:
      "Each film coated tablet contains: 1.25 g of Calcium Carbonate from an Organic Source (Oyster Shell) equivalent to Elemental Calcium 500 mg; Cholecalciferol IP (Vitamin D3) 250 IU (As Stabilized Form)",
    manufacturerId: "MFR-PURECURE",
    manufacturingLicenceNo: "51/UA/SC/P-2013",
    schedule: "OTC", // confirmed by AUSPHARMA
    packImageBlob: "/packs/8906219880193.webp",
    storage: "Store protected from light & moisture, at a temperature not exceeding 25°C.",
  },
  "AQU-NEW-BPXT": {
    gtin: "8906219880223",
    schedule: "OTC", // confirmed by AUSPHARMA
    manufacturerId: "MFR-PURECURE",
    manufacturingLicenceNo: "51/UA/SC/P-2013",
    packImageBlob: "/packs/8906219880223.webp",
    storage: "Store protected from light & moisture, at a temperature not exceeding 25°C.",
  },
  // Outer carton + digital insert received 2026-11-11 (barcode + QR decoded). Carton prints "SCHEDULE G" and the Rx caution;
  // the ERP says metformin SR but the approved carton/insert say a plain film coated tablet.
  AUS0097: {
    gtin: "8906219880100",
    composition: "Each film coated tablet contains: Metformin Hydrochloride IP 500 mg; Sitagliptin Phosphate Monohydrate IP eq. to Sitagliptin 50 mg. Colours: Ferric Oxide USPNF Red, Black Oxide of Iron & Titanium Dioxide IP", // from the approved carton
    manufacturerId: "MFR-PURECURE",
    manufacturingLicenceNo: "31/UA/2013",
    schedule: "G",
    packImageBlob: "/packs/8906219880100.webp",
    storage: "Store protected from light & moisture, at a temperature not exceeding 30°C.",
  },
  AUS0102: { manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "31/UA/2013", schedule: "H", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." }, // from strip foil (no GTIN on foil)
};

const THERAPY: Record<string, string> = {
  CARDIOLOGY: "cardiology",
  DIABETICS: "diabetes",
  "C.N.S DRUGS": "cns-neuro",
  "INFECTIONS & INFESTATION": "anti-infectives",
  "ANTI ALLERGIC DRUGS": "respiratory-allergy",
  "GASTRO ENTROLOGY": "gastro",
  // BONE DISORDERS, SKIN DISORDERS, GENITO URINARY: no colour-guide therapy yet (left null).
};

/**
 * ERP CATEGORY overrides CLASSIFICATION: the ERP files pain relievers and anti-emetics under C.N.S DRUGS, but
 * AUSPHARMA places them under Pain, fever & inflammation and Gastro (confirmed Nov 2026).
 */
const CATEGORY_THERAPY: Record<string, string> = {
  "NSAID'S": "pain-fever-inflammation",
  "ANALGESICS & ANTIPYRETICS": "pain-fever-inflammation",
  "ANTI EMETICS": "gastro", // e.g. AQURIS DOMONE-10
};

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function packSize(row: Row): string | null {
  const n = row.PACK;
  if (!n) return null;
  return /TABLET|CAPSULE/i.test(row.PRODUCTFORM ?? "") ? `${n}'s` : n;
}

/**
 * Products confirmed by AUSPHARMA but not (yet) in the ERP master. Temporary item IDs start "AQU-NEW-";
 * replace with the ERP ITEMID when assigned.
 */
const EXTRA_ROWS: Row[] = [
  {
    ITEMID: "AQU-NEW-BPXT",
    ITEMNAME: "AQURIS BONE PLUS XT TAB 15'S",
    BRAND: "AQURIS BONE PLUS",
    PACK: "15",
    CLASSIFICATION: "BONE DISORDERS",
    CATEGORY: "CALCIUM BALANCE",
    PRODUCTFORM: "TABLET",
    COMPOSITION:
      "Each film coated tablet contains: Calcium Carbonate IP 1250 mg eq. to Elemental Calcium 500 mg; Vitamin D3 IP 2000 IU; Methylcobalamin IP 1500 mcg; L-Methylfolate Calcium 1 mg; Pyridoxal 5-Phosphate 20 mg",
    PACKINGTYPE: "BLISTER",
  },
];

async function importProducts(masterRows: Row[]) {
  const rows = [...masterRows, ...EXTRA_ROWS];
  for (const s of SITES) {
    await db.insert(manufacturers).values(s).onConflictDoUpdate({ target: manufacturers.id, set: s });
  }
  let n = 0;
  for (const r of rows) {
    const itemId = r.ITEMID!;
    const values = {
      itemId,
      brand: r.BRAND,
      division: "aquris", // all AUSPHARMA products belong to the +aquris division (confirmed Nov 2026)
      brandName: r.ITEMNAME!,
      composition: r.COMPOSITION!,
      classification: r.CLASSIFICATION,
      category: r.CATEGORY,
      dosageForm: r.PRODUCTFORM ? titleCase(r.PRODUCTFORM) : null,
      packSize: packSize(r),
      packType: r.PACKINGTYPE ? titleCase(r.PACKINGTYPE) : null,
      therapy: CATEGORY_THERAPY[r.CATEGORY ?? ""] ?? THERAPY[r.CLASSIFICATION ?? ""] ?? null,
      marketedBy: "Auspharma Private Limited",
      ...CONFIRMED[itemId],
    };
    await db
      .insert(products)
      .values({ ...values, status: "draft" })
      .onConflictDoUpdate({ target: products.itemId, set: values }); // never changes status
    n++;
  }
  await db.insert(auditLog).values({ actor: ACTOR, action: "product.import", entity: "products", entityId: "*", after: { count: n } });
  console.log(`products upserted: ${n} (all draft)`);
}

async function importInserts() {
  const inserts = [
    { itemId: "ACE0943", pdf: "docs/samples/inserts/ACEELO_insert.pdf" },
    { itemId: "ACE0949", pdf: "docs/samples/inserts/ACEELO-PS_insert.pdf" },
    { itemId: "AQU0447", pdf: "docs/samples/inserts/AQURIS-AMOXICLA_insert.pdf" },
    { itemId: "AUS0097", pdf: "docs/samples/inserts/AUSITA-M_insert.pdf" },
  ];
  for (const ins of inserts) {
    const text = execFileSync("pdftotext", [ins.pdf, "-"], { encoding: "utf8" });
    const parsed = parseInsert(text);
    const version = parsed.revisionDate ? `Rev. ${parsed.revisionDate}` : "v1";
    const blob = await put(`inserts/${ins.itemId}/${version.replace(/[^A-Za-z0-9.-]/g, "_")}.pdf`, readFileSync(ins.pdf), {
      access: "private",
      contentType: "application/pdf",
      allowOverwrite: true,
    });
    await db
      .insert(pilVersions)
      .values({
        productId: ins.itemId,
        kind: parsed.kind,
        version,
        revisionDate: parsed.revisionDate,
        pdfBlob: blob.pathname,
        sections: parsed.sections,
        status: "draft",
        createdBy: ACTOR,
      })
      .onConflictDoUpdate({
        target: [pilVersions.productId, pilVersions.version],
        set: { sections: parsed.sections, pdfBlob: blob.pathname, kind: parsed.kind },
      });
    console.log(`insert ${ins.itemId}: ${parsed.sections.length} sections, ${version}, blob ${blob.pathname}`);
  }
}

async function main() {
  const [file, flag] = process.argv.slice(2);
  const rows: Row[] = JSON.parse(readFileSync(file, "utf8"));
  await importProducts(rows);
  if (flag === "--inserts") await importInserts();
  const result = await db.execute(
    sql`select count(*)::int as n, count(gtin)::int as with_gtin, count(*) filter (where status='published')::int as published from products`,
  );
  console.log("db:", result.rows[0]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
