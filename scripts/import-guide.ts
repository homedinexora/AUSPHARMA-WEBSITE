/**
 * Import a transcribed patient guide as a DRAFT version (QA publishes it in /admin).
 * Usage: set -a; . ./.env.local; set +a; npx tsx scripts/import-guide.ts
 */
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import { ausrastinGold10Guide } from "../lib/guides/ausrastin-gold-10";

async function main() {
  const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
  const itemId = "AUS0102"; // AUSRASTIN GOLD 10 CAP 10'S
  const version = "2nd iteration (layman) / Oct 2026";
  const blob = await put(`guides/${itemId}/2nd-iteration.pdf`, readFileSync("docs/samples/ausrastin-gold-10-patient-guide.pdf"), {
    access: "private",
    contentType: "application/pdf",
    allowOverwrite: true,
  });
  await db
    .insert(schema.patientGuides)
    .values({ productId: itemId, version, content: ausrastinGold10Guide, pdfBlob: blob.pathname, status: "draft", createdBy: "import:guide" })
    .onConflictDoUpdate({
      target: [schema.patientGuides.productId, schema.patientGuides.version],
      set: { content: ausrastinGold10Guide, pdfBlob: blob.pathname },
    });
  console.log(`guide for ${itemId} imported as draft (${version}), pdf ${blob.pathname}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
