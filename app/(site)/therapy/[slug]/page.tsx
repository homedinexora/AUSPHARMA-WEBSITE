import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/site/ProductCard";
import { listCatalog } from "@/lib/data/catalog";
import { getTherapy, therapies } from "@/lib/therapies";

export function generateStaticParams() {
  return therapies.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/therapy/[slug]">): Promise<Metadata> {
  const t = getTherapy((await params).slug);
  return t
    ? { title: `${t.name} medicines`, alternates: { canonical: `/therapy/${t.slug}` } }
    : { title: "Not found", robots: { index: false } };
}

export default async function TherapyPage({ params }: PageProps<"/therapy/[slug]">) {
  const t = getTherapy((await params).slug);
  if (!t) notFound();
  const items = (await listCatalog()).filter((p) => p.therapy === t.slug);
  return (
    <>
      <section className="bg-brand-800 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <span className="size-14 shrink-0 rounded-md" style={{ backgroundColor: t.web }} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/80">AUS Pharma medicines</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">{t.name}</h1>
          </div>
        </div>
      </section>
      <section className="bg-canvas">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-medium text-brand-600">Products in this area</h2>
            <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
              {items.length} {items.length === 1 ? "product" : "products"}
            </span>
          </div>
          {items.length ? (
            <ProductGrid items={items} />
          ) : (
            <p className="rounded-md bg-white px-5 py-4 text-sm text-ink-soft shadow-card">
              Product pages for this area are being published.
            </p>
          )}
          <p className="rounded-md border border-brand-600 bg-brand-100 px-5 py-4 text-sm text-ink">
            <strong>Use medicines responsibly.</strong> Products marked Rx require a valid prescription. Always follow the
            advice of your registered medical practitioner or pharmacist.
          </p>
        </div>
      </section>
    </>
  );
}
