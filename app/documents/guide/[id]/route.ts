import { getDocumentBlob } from "@/lib/data/catalog";
import { serveDocument } from "@/lib/serve-document";

export async function GET(_req: Request, ctx: RouteContext<"/documents/guide/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return new Response("Not found", { status: 404 });
  const blob = await getDocumentBlob({ kind: "guide", guideId: Number(id) });
  return serveDocument(blob, `Patient-guide_${id}.pdf`);
}
