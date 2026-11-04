import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/site/ProductCard";
import { listCatalog } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

async function Results({ searchParams }: PageProps<"/search">) {
  const raw = (await searchParams).q;
  const q = (typeof raw === "string" ? raw : "").trim().slice(0, 80);
  const needle = q.toLowerCase();
  const items = q
    ? (await listCatalog()).filter(
        (p) => p.brandName.toLowerCase().includes(needle) || p.composition.toLowerCase().includes(needle) || p.gtin === q,
      )
    : [];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium text-brand-600">
        {q ? <>Results for &ldquo;{q}&rdquo;</> : "Search products"}
      </h1>
      {q && items.length === 0 ? (
        <p className="text-sm text-ink-soft">No published products match. Try the product name or composition.</p>
      ) : null}
      {items.length ? <ProductGrid items={items} /> : null}
    </div>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Suspense fallback={<p className="text-sm text-ink-soft">Searching…</p>}>
          <Results {...props} />
        </Suspense>
      </div>
    </section>
  );
}
