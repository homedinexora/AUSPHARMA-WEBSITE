import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductScanSkeleton, ProductScanView } from "@/components/scan/ProductScanView";
import { scanMetadata } from "@/lib/scan-metadata";

/** QR scan landing: auspharma.in/{GTIN}. URL scheme is printed on packs; never change it. */
export async function generateMetadata({ params }: PageProps<"/[gtin]">): Promise<Metadata> {
  const { gtin } = await params;
  return scanMetadata(gtin);
}

export default function ProductPage({ params }: PageProps<"/[gtin]">) {
  return (
    <Suspense fallback={<ProductScanSkeleton />}>
      <ProductScanView params={params} />
    </Suspense>
  );
}
