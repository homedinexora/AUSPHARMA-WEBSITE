import { getDocumentProxy } from "unpdf";

interface Piece {
  str: string;
  x: number;
  y: number;
  width: number;
  size: number;
}

/**
 * Rebuild lines from positioned text pieces: top to bottom, then left to right. PDF.js returns pieces
 * in drawing order, which in CorelDRAW inserts is not reading order. Inserts are single-column.
 */
export function piecesToLines(pieces: readonly Piece[]): string[] {
  const sorted = pieces.filter((p) => p.str.length > 0).toSorted((a, b) => b.y - a.y || a.x - b.x);
  const lines: Piece[][] = [];
  for (const p of sorted) {
    const line = lines[lines.length - 1];
    // Same line when the baselines are within half a character height.
    if (line && Math.abs(line[0].y - p.y) < Math.max(line[0].size, p.size) * 0.5) line.push(p);
    else lines.push([p]);
  }
  return lines.map((line) => {
    let text = "";
    let end = -Infinity;
    for (const p of line.toSorted((a, b) => a.x - b.x)) {
      const gap = p.x - end;
      if (text && gap > p.size * 0.15 && !/\s$/.test(text) && !/^\s/.test(p.str)) text += " ";
      text += p.str;
      end = p.x + p.width;
    }
    return text.replace(/\s+/g, " ").trim();
  });
}

/**
 * Extract a PDF's text one line per line, in reading order, close to `pdftotext` (no -layout),
 * so the same insert parser works for uploads in the admin and for the import scripts.
 * Returns "" for a scanned (image-only) PDF.
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(data);
  try {
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      const pieces: Piece[] = [];
      for (const item of content.items) {
        if (!("str" in item)) continue;
        const [a, b, , , x, y] = item.transform as number[];
        pieces.push({ str: item.str, x, y, width: item.width, size: Math.hypot(a, b) || item.height || 1 });
      }
      pages.push(piecesToLines(pieces).filter(Boolean).join("\n"));
    }
    return pages.join("\n").trim();
  } finally {
    await pdf.destroy();
  }
}
