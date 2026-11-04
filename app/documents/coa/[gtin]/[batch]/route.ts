import { getDocumentBlob } from "@/lib/data/catalog";
import { parseScanPath } from "@/lib/gtin";
import { serveDocument } from "@/lib/serve-document";

export async function GET(_req: Request, ctx: RouteContext<"/documents/coa/[gtin]/[batch]">) {
  const { gtin, batch } = await ctx.params;
  const parsed = parseScanPath(gtin, batch);
  if (!parsed.ok || !parsed.batch) return new Response("Not found", { status: 404 });
  const blob = await getDocumentBlob({ kind: "coa", gtin: parsed.gtin, batchNo: parsed.batch });
  return serveDocument(blob, `CoA_${parsed.gtin}_${parsed.batch}.pdf`);
}
