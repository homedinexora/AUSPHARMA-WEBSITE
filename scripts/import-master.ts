/**
 * One-off import of the ERP product master (JSON rows: ITEMID, ITEMNAME, BRAND, PACK, CLASSIFICATION, …)
 * plus facts confirmed from approved artwork/inserts. Everything is imported as DRAFT: nothing is public
 * until QA publishes it in the admin.
 *
 * Usage: set -a; . ./.env.local; set +a; npx tsx scripts/import-master.ts <master.json> [--inserts]
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
];

/** Per-SKU facts read from approved carton artwork (QR/barcode, licence, cautions) and inserts. */
const CONFIRMED: Record<string, Partial<typeof products.$inferInsert>> = {
  AUS0093: { gtin: "8906219880018", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880018.webp", storage: "Store protected from light & moisture, at a temperature not exceeding 25°C." },
  AUS0094: { gtin: "8906219880025", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880025.webp" },
  AUS0095: { gtin: "8906219880032", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880032.webp" },
  AUS0092: { gtin: "8906219880049", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880049.webp" },
  AUS0098: { gtin: "8906219880063", manufacturerId: "MFR-WINDLAS-P2", manufacturingLicenceNo: "34/UA/2013", schedule: "H", packImageBlob: "/packs/8906219880063.webp" },
  ACE0943: { manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "31/UA/2013", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." },
  ACE0949: { manufacturerId: "MFR-PURECURE", manufacturingLicenceNo: "31/UA/2013", storage: "Store protected from light & moisture, at a temperature not exceeding 30°C." },
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

const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

function packSize(row: Row): string | null {
  const n = row.PACK;
  if (!n) return null;
  return /TABLET|CAPSULE/i.test(row.PRODUCTFORM ?? "") ? `${n}'s` : n;
}

async function importProducts(rows: Row[]) {
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
      therapy: THERAPY[r.CLASSIFICATION ?? ""] ?? null,
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
