import "server-only";
import { get } from "@vercel/blob";

/**
 * Stream a private Blob PDF after the caller has checked it is publishable.
 * Short CDN cache so a withdrawn document stops being served within a minute.
 */
export async function serveDocument(pathname: string | null, filename: string): Promise<Response> {
  if (!pathname) return new Response("Document not available", { status: 404 });
  const result = await get(pathname, { access: "private" });
  if (!result) return new Response("Document not available", { status: 404 });
  return new Response(result.stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename.replace(/[^A-Za-z0-9._-]/g, "_")}"`,
      "Cache-Control": "public, max-age=0, s-maxage=60, must-revalidate",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
