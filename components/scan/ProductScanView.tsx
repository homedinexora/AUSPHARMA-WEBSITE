import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BatchSelector } from "@/components/scan/BatchSelector";
import { PilSections } from "@/components/scan/PilSections";
import { getScanProduct, type ScanProduct } from "@/lib/data/catalog";
import { parseScanPath } from "@/lib/gtin";
import { formatInr, formatPackDate, isPrescription, resolveScanView, type ScanView } from "@/lib/scan-view";
import { pvpi, site } from "@/lib/site";

/** Resolves the scan URL and renders the product page. Awaited inside <Suspense> by the route. */
export async function ProductScanView({ params }: { params: Promise<{ gtin: string; batch?: string }> }) {
  const { gtin: rawGtin, batch: rawBatch } = await params;
  const parsed = parseScanPath(rawGtin, rawBatch);
  if (!parsed.ok) {
    if (parsed.reason === "bad-batch") return <UnknownBatch gtin={rawGtin} />;
    notFound();
  }
  const product = await getScanProduct(parsed.gtin);
  if (!product) notFound();

  const view = resolveScanView(product, parsed.batch);
  return <ScanPage product={product} view={view} />;
}

function UnknownBatch({ gtin }: { gtin: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">That batch number doesn&rsquo;t look right</h1>
      <p className="mt-3 text-ink-soft">
        Batch numbers contain only letters, digits and hyphens. Please check the number printed on your pack.
      </p>
      <Link href={`/${gtin}`} className="mt-6 inline-block font-semibold text-brand-700 underline">
        Choose your batch
      </Link>
    </div>
  );
}

function ScanPage({ product: p, view }: { product: ScanProduct; view: ScanView }) {
  const rx = isPrescription(p.schedule);
  const m = p.manufacturer;
  const expiry = formatPackDate(view.batch?.expiryDate ?? null);
  const mfg = formatPackDate(view.batch?.mfgDate ?? null);

  return (
    <div className="bg-canvas">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 md:py-10 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* Identity */}
        <section
          aria-labelledby="product-title"
          className="grid gap-5 rounded-lg bg-white p-5 shadow-card md:grid-cols-[minmax(0,18rem)_1fr] md:items-center md:p-6 lg:col-span-2"
        >
          {p.packImage ? (
            <Image
              src={p.packImage}
              alt={`${p.brandName} pack`}
              width={1200}
              height={900}
              priority
              sizes="(min-width: 768px) 18rem, 100vw"
              className="mx-auto h-auto w-full max-w-xs rounded-md bg-brand-50"
            />
          ) : null}
          <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              AUS Pharma generic
            </span>
            <span className="rounded-full border border-brand-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              {rx ? "Prescription only" : "Over the counter"}
            </span>
          </div>
          <h1 id="product-title" className="mt-4 text-2xl font-semibold tracking-tight text-ink md:text-4xl">
            {p.brandName}
          </h1>
          <p className="mt-2 text-lg font-medium text-brand-700">{p.composition}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {[p.packSize, p.dosageForm].filter(Boolean).join(" · ")}
            {" · "}Marketed by {p.marketedBy}
          </p>
          {rx ? (
            <p className="mt-4 rounded-sm bg-brand-100 px-4 py-3 text-sm text-brand-800">
              <strong>Prescription medicine.</strong> Use only as directed by a registered medical practitioner.
            </p>
          ) : null}
          </div>
        </section>

        {/* Verify: CoA for the batch */}
        <section
          aria-labelledby="verify-title"
          className="rounded-lg bg-verify-50 p-5 md:p-6 lg:col-start-1"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-verify-600">Batch test report</p>
          <h2 id="verify-title" className="mt-1 text-2xl font-medium text-ink">
            Verify the quality
          </h2>

          {view.batchState === "published" && view.batch ? (
            <div className="mt-4 space-y-4">
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Fact label="Batch no." value={view.batch.batchNo} />
                <Fact label="Mfg." value={mfg} />
                <Fact label="Expiry" value={expiry} />
              </dl>
              {view.coaAvailable ? (
                <>
                  <p className="text-sm text-ink-soft">
                    The Certificate of Analysis records the laboratory tests this batch passed before release.
                  </p>
                  <a
                    href={`/documents/coa/${p.gtin}/${encodeURIComponent(view.batch.batchNo)}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-verify-600 px-4 py-3 font-semibold text-white hover:brightness-110 sm:w-auto"
                  >
                    View Certificate of Analysis (PDF)
                  </a>
                </>
              ) : (
                <p className="text-sm text-ink-soft">
                  The test report for this batch is being prepared. Please check again later.
                </p>
              )}
              <Link href={`/${p.gtin}`} className="block text-sm font-semibold text-verify-600 underline">
                Check a different batch
              </Link>
            </div>
          ) : null}

          {view.batchState === "withdrawn" && view.batch ? (
            <div role="alert" className="mt-4 rounded-sm border border-danger bg-white p-4 text-sm text-ink">
              <p className="font-semibold text-danger">Batch {view.batch.batchNo} has been withdrawn.</p>
              <p className="mt-1">
                Please do not use this pack. Return it to your pharmacist or contact us.
                {view.batch.withdrawnReason ? ` Reason: ${view.batch.withdrawnReason}` : ""}
              </p>
            </div>
          ) : null}

          {view.batchState === "unknown" ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-ink">
                We couldn&rsquo;t find a published test report for batch <strong>{view.requestedBatch}</strong>.
                Please check the batch number on your pack, or choose it below.
              </p>
              <BatchSelector
                gtin={p.gtin}
                batches={view.selectableBatches.map((b) => ({
                  batchNo: b.batchNo,
                  expiryLabel: formatPackDate(b.expiryDate),
                }))}
              />
            </div>
          ) : null}

          {view.batchState === "none" ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-ink-soft">
                Choose the batch number printed on your pack to open its Certificate of Analysis.
              </p>
              <BatchSelector
                gtin={p.gtin}
                batches={view.selectableBatches.map((b) => ({
                  batchNo: b.batchNo,
                  expiryLabel: formatPackDate(b.expiryDate),
                }))}
              />
            </div>
          ) : null}
        </section>

        {/* Quick links */}
        <nav aria-label="On this page" className="grid grid-cols-3 gap-3 lg:col-start-1">
          <Tile href="#pil" label="Package insert" />
          <Tile href="#manufacturer" label="Manufacturer & WHO-GMP" />
          <Tile href="/report-side-effect" label="Report a side effect" />
        </nav>

        {/* Label details */}
        <section aria-labelledby="label-title" className="rounded-lg bg-white p-5 shadow-card md:p-6 lg:col-start-1">
          <h2 id="label-title" className="text-2xl font-medium text-brand-600">
            Pack details
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Fact label="Composition" value={p.composition} />
            <Fact label="Dosage form" value={p.dosageForm} />
            <Fact label="Pack size" value={[p.packSize, p.packType].filter(Boolean).join(", ") || null} />
            <Fact
              label="MRP (incl. of all taxes)"
              value={view.mrpPaise != null ? `${formatInr(view.mrpPaise)}${p.mrpPer ? ` per ${p.mrpPer.toLowerCase()}` : ""}` : null}
            />
            <Fact label="Storage" value={p.storage} />
            <Fact label="Mfg. licence no." value={p.manufacturingLicenceNo} />
          </dl>
        </section>

        {/* Manufacturer */}
        <section
          id="manufacturer"
          aria-labelledby="mfr-title"
          className="scroll-mt-6 rounded-lg bg-brand-800 p-5 text-white md:p-6 lg:col-start-2 lg:row-span-3 lg:row-start-2"
        >
          <h2 id="mfr-title" className="text-lg font-semibold">
            Who makes this medicine
          </h2>
          {m ? (
            <div className="mt-3 space-y-3 text-sm text-white/90">
              <p>
                <span className="block text-xs font-semibold uppercase tracking-wider text-white/70">Manufactured by</span>
                <span className="font-semibold text-white">{m.legalName}</span>
                {m.address || m.city ? (
                  <span className="block">
                    {[m.address, m.city, m.state, m.pinCode].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </p>
              {m.whoGmpCurrent ? (
                <>
                  <p>
                    WHO-GMP certified site
                    {m.whoGmpIssuer ? `, certificate issued by ${m.whoGmpIssuer}` : ""}
                    {m.whoGmpValidUntil ? `, valid until ${formatPackDate(m.whoGmpValidUntil)}` : ""}.
                  </p>
                  <a
                    href={`/documents/gmp/${encodeURIComponent(m.id)}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex w-full items-center justify-center rounded-sm bg-cta px-4 py-3 font-semibold text-brand-800 hover:brightness-95"
                  >
                    View WHO-GMP certificate
                  </a>
                </>
              ) : null}
              <p>
                <span className="block text-xs font-semibold uppercase tracking-wider text-white/70">Marketed by</span>
                <span className="font-semibold text-white">{p.marketedBy}</span>
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/90">Marketed by {p.marketedBy}.</p>
          )}
        </section>

        {/* Leaflet */}
        <div id="pil" className="scroll-mt-6 lg:col-start-1">
          {view.pil ? (
            <PilSections pil={view.pil} gtin={p.gtin} isOlderVersion={view.pilIsOlderVersion} />
          ) : (
            <p className="text-sm text-ink-soft">Please read the patient information leaflet inside your pack.</p>
          )}
        </div>

        {/* Safety reporting */}
        <section aria-labelledby="safety-title" className="rounded-lg border border-line bg-white p-5 text-sm lg:col-start-1">
          <h2 id="safety-title" className="font-semibold text-ink">
            Noticed a side effect?
          </h2>
          <p className="mt-1 text-ink-soft">
            Tell your doctor or pharmacist, and{" "}
            <Link href="/report-side-effect" className="font-semibold text-brand-700 underline">
              report it to {site.brandName}
            </Link>{" "}
            or the national helpline (PvPI){" "}
            <a href={`tel:${pvpi.helpline.replaceAll("-", "")}`} className="font-semibold text-brand-700 underline">
              {pvpi.helpline}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}

function Tile({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-20 items-center justify-center rounded-md bg-white p-3 text-center text-sm font-semibold text-brand-700 shadow-card hover:bg-brand-100"
    >
      {label}
    </Link>
  );
}

/** Static shell shown while the product streams in. */
export function ProductScanSkeleton() {
  return (
    <div className="bg-canvas" aria-busy="true" aria-live="polite">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 md:py-10">
        <div className="h-40 animate-pulse rounded-lg bg-white" />
        <div className="h-56 animate-pulse rounded-lg bg-verify-50" />
        <span className="sr-only">Loading product details…</span>
      </div>
    </div>
  );
}
