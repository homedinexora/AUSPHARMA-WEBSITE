import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductScanSkeleton, ProductScanView } from "@/components/scan/ProductScanView";
import { scanMetadata } from "@/lib/scan-metadata";

/** QR scan landing with batch: auspharma.in/{GTIN}/{batch}. URL scheme is printed on packs; never change it. */
export async function generateMetadata({ params }: PageProps<"/[gtin]/[batch]">): Promise<Metadata> {
  const { gtin, batch } = await params;
  return scanMetadata(gtin, batch);
}

export default function ProductBatchPage({ params }: PageProps<"/[gtin]/[batch]">) {
  return (
    <Suspense fallback={<ProductScanSkeleton />}>
      <ProductScanView params={params} />
    </Suspense>
  );
}
