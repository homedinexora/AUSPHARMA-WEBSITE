/**
 * Import ONE approved package-insert PDF for a product, as a DRAFT version (QA publishes it in /admin).
 * The PDF is stored privately in Blob; its text is parsed into sections as a pre-fill to check against the PDF.
 *
 * Usage: set -a; . ./.env.local; set +a; npx tsx scripts/import-insert.ts <ITEMID> <insert.pdf> [version]
 *   version defaults to "Rev. <date of revision>" when the insert has one, else "v1".
 * Uses the same PDF reader as the admin's "Upload insert" button. Re-running for the same version refreshes a
 * draft; it never touches a published version. Staff can do the same from /admin without this script.
 */
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { parseInsert } from "../lib/insert-parser";
import { extractPdfText } from "../lib/pdf-text";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const { products, pilVersions, auditLog } = schema;
const ACTOR = "import:insert";

async function main() {
  const [itemId, pdf, versionArg] = process.argv.slice(2);
  if (!itemId || !pdf) throw new Error("Usage: import-insert.ts <ITEMID> <insert.pdf> [version]");

  const [product] = await db.select().from(products).where(eq(products.itemId, itemId)).limit(1);
  if (!product) throw new Error(`No product ${itemId}`);

  const parsed = parseInsert(await extractPdfText(new Uint8Array(readFileSync(pdf))));
  const version = versionArg ?? (parsed.revisionDate ? `Rev. ${parsed.revisionDate}` : "v1");

  const [existing] = await db
    .select()
    .from(pilVersions)
    .where(and(eq(pilVersions.productId, itemId), eq(pilVersions.version, version)))
    .limit(1);
  if (existing && existing.status !== "draft") {
    throw new Error(`${itemId} ${version} is ${existing.status}; pass a new version name instead`);
  }

  const blob = await put(`inserts/${itemId}/${version.replace(/[^A-Za-z0-9.-]/g, "_")}.pdf`, readFileSync(pdf), {
    access: "private",
    contentType: "application/pdf",
    allowOverwrite: true,
  });
  const values = {
    productId: itemId,
    kind: parsed.kind,
    version,
    revisionDate: parsed.revisionDate,
    pdfBlob: blob.pathname,
    sections: parsed.sections,
    status: "draft" as const,
    createdBy: ACTOR,
  };
  const [row] = await db
    .insert(pilVersions)
    .values(values)
    .onConflictDoUpdate({
      target: [pilVersions.productId, pilVersions.version],
      set: { kind: values.kind, revisionDate: values.revisionDate, pdfBlob: values.pdfBlob, sections: values.sections },
    })
    .returning({ id: pilVersions.id });
  await db.insert(auditLog).values({
    actor: ACTOR,
    action: existing ? "insert.reimport" : "insert.import",
    entity: "pil_versions",
    entityId: String(row.id),
    after: { itemId, version, kind: parsed.kind, sections: parsed.sections.length, pdf: blob.pathname },
  });

  console.log(`${itemId} insert #${row.id}: ${parsed.kind}, ${version}, ${parsed.sections.length} sections (draft)`);
  for (const s of parsed.sections) console.log(`  ${s.key.padEnd(12)} ${s.title}${s.patientFacing ? "  [patient-facing]" : ""}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
