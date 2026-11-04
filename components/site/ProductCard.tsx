import Image from "next/image";
import Link from "next/link";
import type { CatalogItem } from "@/lib/data/catalog";

/** Catalogue card: identity only (no uses/claims), per pharma-content-compliance. */
export function ProductCard({ p }: { p: CatalogItem }) {
  return (
    <Link
      href={`/${p.gtin}`}
      className="group flex flex-col rounded-md border border-line bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-brand-600"
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-sm bg-brand-50">
        {p.packImage ? (
          <Image
            src={p.packImage}
            alt={`${p.brandName} pack`}
            width={400}
            height={300}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 40vw, 90vw"
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <span className="text-xs text-ink-soft">Pack image coming soon</span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink-soft">
        {p.packSize ? <span>{p.packSize}</span> : null}
        <span className="rounded-full border border-brand-600 px-2 py-0.5 text-brand-700">{p.prescription ? "Rx" : "OTC"}</span>
      </div>
      <h3 className="mt-1 text-base font-semibold text-ink">{p.brandName}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.composition}</p>
      <span className="mt-auto pt-3 text-sm font-semibold text-brand-700 group-hover:underline">View details ›</span>
    </Link>
  );
}

export function ProductGrid({ items }: { items: CatalogItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <ProductCard key={p.gtin} p={p} />
      ))}
    </div>
  );
}
