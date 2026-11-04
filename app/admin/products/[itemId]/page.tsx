import { asc, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import {
  addBatch,
  setBatchStatus,
  setInsertPublished,
  setProductPublished,
  toggleSectionPatientFacing,
  updateProduct,
  uploadCoa,
} from "@/app/admin/actions";
import { Flash, NotAuthorised, StaffOnly, StatusBadge } from "@/components/admin/Guard";
import { getStaff } from "@/lib/admin/auth";
import { InsertSectionList } from "@/components/scan/InsertSectionList";
import { getDb, schema } from "@/db";
import { hasRole } from "@/lib/admin/roles";

const { products, manufacturers, batches, pilVersions } = schema;

const input = "w-full rounded-sm border border-line bg-white px-3 py-2 text-sm";
const btn = "rounded-sm px-3 py-2 text-sm font-semibold";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg bg-white p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

async function Content({ params, searchParams }: PageProps<"/admin/products/[itemId]">) {
  if (!(await getStaff())) return <NotAuthorised />;
  const { itemId: raw } = await params;
  const itemId = decodeURIComponent(raw);
  const sp = await searchParams;
  const db = getDb();
  const [p] = await db.select().from(products).where(eq(products.itemId, itemId)).limit(1);
  if (!p) notFound();
  const [mfrs, bs, ins] = await Promise.all([
    db.select({ id: manufacturers.id, legalName: manufacturers.legalName }).from(manufacturers).orderBy(asc(manufacturers.legalName)),
    db.select().from(batches).where(eq(batches.productId, itemId)).orderBy(desc(batches.createdAt)),
    db.select().from(pilVersions).where(eq(pilVersions.productId, itemId)).orderBy(desc(pilVersions.createdAt)),
  ]);

  return (
    <StaffOnly>
      {(staff) => {
        const qa = hasRole(staff.role, "qa");
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href="/admin" className="text-sm text-brand-700 hover:underline">
                  ← All products
                </Link>
                <h1 className="mt-1 text-2xl font-semibold text-ink">{p.brandName}</h1>
                <p className="text-sm text-ink-soft">
                  {p.itemId} · {p.classification} · <StatusBadge status={p.status} />
                  {p.gtin && p.status === "published" ? (
                    <>
                      {" · "}
                      <Link href={`/${p.gtin}`} className="text-brand-700 underline" target="_blank">
                        View public page
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              {qa ? (
                <form action={setProductPublished.bind(null, itemId, p.status !== "published")}>
                  <button className={`${btn} ${p.status === "published" ? "border border-danger text-danger" : "bg-success text-white"}`}>
                    {p.status === "published" ? "Unpublish product" : "Publish product"}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-ink-soft">Only QA can publish.</p>
              )}
            </div>

            <Flash ok={typeof sp.ok === "string" ? sp.ok : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />

            <Card title="Pack details">
              <form action={updateProduct.bind(null, itemId)} className="grid gap-4 md:grid-cols-2">
                <Field label="GTIN-13" hint={p.status === "published" ? "Locked while published (printed in the QR)." : "13 digits from the pack barcode."}>
                  <input name="gtin" defaultValue={p.gtin ?? ""} inputMode="numeric" pattern="\d{13}" readOnly={p.status === "published"} className={`${input} font-mono`} />
                </Field>
                <Field label="Schedule">
                  <select name="schedule" defaultValue={p.schedule ?? ""} className={input}>
                    <option value="">Not set (treated as prescription)</option>
                    {["H", "H1", "X", "G", "OTC"].map((s) => (
                      <option key={s} value={s}>
                        {s === "OTC" ? "OTC (non-scheduled)" : `Schedule ${s}`}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Name as on pack">
                  <input name="brandName" defaultValue={p.brandName} required className={input} />
                </Field>
                <Field label="Composition (as on label)">
                  <input name="composition" defaultValue={p.composition} required className={input} />
                </Field>
                <Field label="Dosage form">
                  <input name="dosageForm" defaultValue={p.dosageForm ?? ""} className={input} />
                </Field>
                <Field label="Pack size / type">
                  <div className="flex gap-2">
                    <input name="packSize" defaultValue={p.packSize ?? ""} className={input} />
                    <input name="packType" defaultValue={p.packType ?? ""} className={input} />
                  </div>
                </Field>
                <Field label="MRP (₹, incl. of all taxes)">
                  <div className="flex gap-2">
                    <input name="mrp" defaultValue={p.mrpPaise != null ? (p.mrpPaise / 100).toFixed(2) : ""} inputMode="decimal" className={input} />
                    <input name="mrpPer" defaultValue={p.mrpPer ?? ""} placeholder="per Strip" className={input} />
                  </div>
                </Field>
                <Field label="Manufacturer (WHO-GMP site)">
                  <select name="manufacturerId" defaultValue={p.manufacturerId ?? ""} className={input}>
                    <option value="">Not set</option>
                    {mfrs.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.legalName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Mfg. licence no.">
                  <input name="manufacturingLicenceNo" defaultValue={p.manufacturingLicenceNo ?? ""} className={input} />
                </Field>
                <Field label="Storage">
                  <input name="storage" defaultValue={p.storage ?? ""} className={input} />
                </Field>
                <div className="md:col-span-2">
                  <button className={`${btn} bg-brand-600 text-white`}>Save pack details</button>
                </div>
              </form>
            </Card>

            <Card title="Batches & Certificates of Analysis">
              {bs.length ? (
                <ul className="divide-y divide-line">
                  {bs.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                      <span className="font-mono font-semibold">{b.batchNo}</span>
                      <StatusBadge status={b.status} />
                      <span className="text-ink-soft">
                        Mfg {b.mfgDate ?? "?"} · Exp {b.expiryDate ?? "?"}
                      </span>
                      <span className={b.coaBlob ? "text-success" : "text-warning"}>{b.coaBlob ? "CoA uploaded" : "No CoA"}</span>
                      {b.withdrawnReason ? <span className="text-danger">Reason: {b.withdrawnReason}</span> : null}
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <form action={uploadCoa.bind(null, itemId, b.id)} className="flex items-center gap-2">
                          <input name="coa" type="file" accept="application/pdf" required className="max-w-48 text-xs" />
                          <button className={`${btn} border border-line`}>{b.coaBlob ? "Replace CoA" : "Upload CoA"}</button>
                        </form>
                        {qa && b.status !== "published" ? (
                          <form action={setBatchStatus.bind(null, itemId, b.id, "published")}>
                            <button className={`${btn} bg-success text-white`}>Publish</button>
                          </form>
                        ) : null}
                        {qa && b.status === "published" ? (
                          <form action={setBatchStatus.bind(null, itemId, b.id, "withdrawn")} className="flex gap-2">
                            <input name="reason" required placeholder="Reason (shown publicly)" className={`${input} w-56`} />
                            <button className={`${btn} border border-danger text-danger`}>Withdraw</button>
                          </form>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">No batches yet.</p>
              )}
              <form action={addBatch.bind(null, itemId)} className="grid gap-3 rounded-md bg-brand-50 p-4 md:grid-cols-5 md:items-end">
                <Field label="Batch no.">
                  <input name="batchNo" required pattern="[A-Za-z0-9-]{1,40}" className={`${input} font-mono uppercase`} />
                </Field>
                <Field label="Mfg. date">
                  <input name="mfgDate" type="date" className={input} />
                </Field>
                <Field label="Expiry date">
                  <input name="expiryDate" type="date" className={input} />
                </Field>
                <Field label="CoA PDF (max 4 MB)">
                  <input name="coa" type="file" accept="application/pdf" className="text-xs" />
                </Field>
                <button className={`${btn} bg-brand-600 text-white`}>Add batch (draft)</button>
              </form>
            </Card>

            <Card title="Package inserts">
              {ins.length === 0 ? <p className="text-sm text-ink-soft">No insert yet.</p> : null}
              {ins.map((v) => (
                <div key={v.id} className="space-y-3 rounded-md border border-line p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold">{v.version}</span>
                    <StatusBadge status={v.status} />
                    <span className="text-ink-soft">{v.kind === "prescribing_information" ? "Prescribing information (HCP)" : "Patient leaflet"}</span>
                    {v.pdfBlob ? (
                      <a href={`/documents/pil/${v.id}`} target="_blank" className="text-brand-700 underline">
                        Approved PDF
                      </a>
                    ) : null}
                    {qa ? (
                      <form action={setInsertPublished.bind(null, itemId, v.id, v.status !== "published")} className="ml-auto">
                        <button className={`${btn} ${v.status === "published" ? "border border-danger text-danger" : "bg-success text-white"}`}>
                          {v.status === "published" ? "Unpublish" : "Publish this version"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                  <p className="text-xs text-warning">
                    Text was extracted automatically from the PDF. Check every section against the approved PDF before publishing.
                  </p>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                      Review {v.sections.length} sections ({v.sections.filter((s) => s.patientFacing).length} shown to patients)
                    </summary>
                    <ul className="mt-3 space-y-1 text-sm">
                      {v.sections.map((s) => (
                        <li key={s.key} className="flex items-center gap-3">
                          <span className="w-10 font-mono text-xs text-ink-soft">{/^\d/.test(s.key) ? s.key : ""}</span>
                          <span className="flex-1">{s.title}</span>
                          {v.status === "draft" ? (
                            <form action={toggleSectionPatientFacing.bind(null, itemId, v.id, s.key)}>
                              <button className="text-xs text-brand-700 underline">{s.patientFacing ? "Shown to patients ✓" : "HCP only"}</button>
                            </form>
                          ) : (
                            <span className="text-xs text-ink-soft">{s.patientFacing ? "Shown to patients" : "HCP only"}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4">
                      <InsertSectionList sections={v.sections} />
                    </div>
                  </details>
                </div>
              ))}
            </Card>
          </div>
        );
      }}
    </StaffOnly>
  );
}

export default function AdminProduct(props: PageProps<"/admin/products/[itemId]">) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
