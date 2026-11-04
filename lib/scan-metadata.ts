import "server-only";
import type { Metadata } from "next";
import { getScanProduct } from "@/lib/data/catalog";
import { parseScanPath } from "@/lib/gtin";
import { isPrescription } from "@/lib/scan-view";

/** Rx pages and every batch page are noindex (see pharma-seo skill); canonical is always /{GTIN}. */
export async function scanMetadata(rawGtin: string, rawBatch?: string): Promise<Metadata> {
  const parsed = parseScanPath(rawGtin, rawBatch);
  if (!parsed.ok) return { title: "Product not found", robots: { index: false, follow: false } };
  const product = await getScanProduct(parsed.gtin);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const indexable = !isPrescription(product.schedule) && parsed.batch === null;
  return {
    title: parsed.batch ? `${product.brandName}: batch ${parsed.batch}` : product.brandName,
    description: `${product.composition}. Pack details, patient information leaflet and batch Certificate of Analysis.`,
    alternates: { canonical: `/${parsed.gtin}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}
