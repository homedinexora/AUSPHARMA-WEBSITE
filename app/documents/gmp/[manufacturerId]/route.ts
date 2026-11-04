import { getDocumentBlob } from "@/lib/data/catalog";
import { serveDocument } from "@/lib/serve-document";

export async function GET(_req: Request, ctx: RouteContext<"/documents/gmp/[manufacturerId]">) {
  const { manufacturerId } = await ctx.params;
  const id = decodeURIComponent(manufacturerId);
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) return new Response("Not found", { status: 404 });
  const blob = await getDocumentBlob({ kind: "gmp", manufacturerId: id });
  return serveDocument(blob, `WHO-GMP_${id}.pdf`);
}
