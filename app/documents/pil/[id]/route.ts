import { getDocumentBlob } from "@/lib/data/catalog";
import { serveDocument } from "@/lib/serve-document";

export async function GET(_req: Request, ctx: RouteContext<"/documents/pil/[id]">) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return new Response("Not found", { status: 404 });
  const blob = await getDocumentBlob({ kind: "pil", pilVersionId: Number(id) });
  return serveDocument(blob, `PIL_${id}.pdf`);
}
