import Link from "next/link";
import { ProductGrid } from "@/components/site/ProductCard";
import { VerifyMedicine } from "@/components/site/VerifyMedicine";
import { listCatalog } from "@/lib/data/catalog";
import { formatPackDate } from "@/lib/scan-view";
import { site } from "@/lib/site";
import { therapies } from "@/lib/therapies";

const promises = [
  "Made by WHO-GMP certified manufacturing partners",
  "Each batch tested against Indian or international pharmacopoeia references",
  "A Certificate of Analysis you can open online",
];

const steps = [
  {
    title: "Made at certified sites",
    body: "Every AUSPHARMA generic is made by a WHO-GMP certified manufacturing partner. The product page names the site.",
  },
  {
    title: "Tested to standard",
    body: "Each batch is checked against Indian or international pharmacopoeia references before release.",
  },
  {
    title: "Stored and moved with care",
    body: "Packs are stored and transported as their label requires, from the plant to the pharmacy shelf.",
  },
  {
    title: "Read the report yourself",
    body: "Scan the QR code on your pack and choose your batch to open its Certificate of Analysis.",
  },
];

const coaChecks = [
  ["Identity", "Confirms that the correct active ingredient is present."],
  ["Assay", "Checks that the amount of medicine matches the approved specification."],
  ["Dissolution", "Measures how the medicine releases from the tablet or capsule."],
  ["Uniformity", "Checks consistency from one dosage unit to the next."],
  ["Purity", "Confirms related substances stay within approved limits."],
  ["Microbial limits", "Checks the product meets the required microbiological standards."],
] as const;

const faqs = [
  {
    q: "Where do I find my batch number?",
    a: "It is printed on the carton next to “Batch No.”, together with the manufacturing date, expiry date and MRP.",
  },
  {
    q: "What is a Certificate of Analysis?",
    a: "A Certificate of Analysis (CoA) is the laboratory report for one batch. It lists each test, the specification the batch must meet, and the result.",
  },
  {
    q: "Who makes AUSPHARMA medicines?",
    a: `${site.legalName} markets medicines made by WHO-GMP certified manufacturing partners. Each product page shows the manufacturer's name, address and manufacturing licence number.`,
  },
  {
    q: "Can I take a prescription medicine without a prescription?",
    a: "No. Medicines marked Rx must be used only as directed by a registered medical practitioner. Speak to your doctor or pharmacist if you have questions.",
  },
];

export default async function Home() {
  const catalog = await listCatalog();
  const verifyOptions = catalog.map((p) => ({
    gtin: p.gtin,
    name: [p.brandName, p.packSize].filter(Boolean).join(" · "),
    batches: p.batches.map((b) => ({ batchNo: b.batchNo, expiryLabel: formatPackDate(b.expiryDate) })),
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hero-from to-hero-to text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-white/80">AUSPHARMA · Quality generics</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">Quality generics you can verify</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/90">
              AUSPHARMA generics are made by WHO-GMP certified manufacturing partners and tested before they reach you.
              Look up the test report for your own pack.
            </p>
            <ul className="mt-6 space-y-2">
              {promises.map((t) => (
                <li key={t} className="flex gap-3 text-white/95">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden="true">
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <VerifyMedicine options={verifyOptions} />
        </div>
      </section>

      {/* Plant to pack */}
      <section aria-labelledby="steps-title" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <h2 id="steps-title" className="text-3xl font-medium text-brand-600">
            From plant to pack
          </h2>
          <p className="mt-2 text-ink-soft">What happens before a strip of AUSPHARMA reaches the shelf.</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <div className="flex items-center gap-3" aria-hidden="true">
                  <span className="size-3 rounded-full bg-brand-600" />
                  <span className="h-px flex-1 bg-brand-600/40" />
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink-soft">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-medium text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Browse */}
      <section aria-labelledby="browse-title" className="bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
          <h2 id="browse-title" className="text-3xl font-medium text-brand-600">
            Browse by therapy area
          </h2>
          <p className="mt-2 text-ink-soft">Pick a therapy area, then open any medicine to see its pack details and test reports.</p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {therapies.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/therapy/${t.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-600"
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: t.web }} aria-hidden="true" />
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            {catalog.length > 0 ? (
              <ProductGrid items={catalog.slice(0, 6)} />
            ) : (
              <p className="rounded-md bg-white px-5 py-4 text-sm text-ink-soft shadow-card">
                Product pages are being published. Scan the QR code on your pack to open its page.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CoA explainer */}
      <section aria-labelledby="coa-title" className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div>
            <h2 id="coa-title" className="text-3xl font-medium text-brand-600">
              What the Certificate of Analysis checks
            </h2>
            <p className="mt-3 text-ink-soft">
              A CoA records the results of tests run against Indian or international pharmacopoeia references.
            </p>
            <div className="mt-6 rounded-md bg-brand-100 p-5">
              <p className="font-medium text-brand-800">How to read it</p>
              <p className="mt-1 text-sm text-ink-soft">
                For each test the certificate shows the specification the batch must meet and the result for your batch.
              </p>
            </div>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {coaChecks.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr]">
                <dt className="text-xs font-semibold uppercase tracking-wider text-brand-700">{k}</dt>
                <dd className="text-sm text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1fr_1.4fr] lg:px-8">
          <div>
            <h2 id="faq-title" className="text-3xl font-medium text-brand-600">
              Common questions
            </h2>
            <p className="mt-3 text-ink-soft">Short answers about AUSPHARMA generics and how to check them.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-md border border-line bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink">
                  {f.q}
                  <span aria-hidden="true" className="text-brand-600 transition group-open:rotate-90">
                    ›
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
