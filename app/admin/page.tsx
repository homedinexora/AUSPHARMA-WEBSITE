import { and, asc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { Flash, NotAuthorised, StaffOnly, StatusBadge } from "@/components/admin/Guard";
import { getStaff } from "@/lib/admin/auth";
import { getDb, schema } from "@/db";

const { products, batches } = schema;

type Filter = "all" | "draft" | "published" | "no-gtin";

async function ProductTable({ q, filter }: { q: string; filter: Filter }) {
  const db = getDb();
  const where = and(
    q
      ? or(
          ilike(products.brandName, `%${q}%`),
          ilike(products.itemId, `%${q}%`),
          ilike(products.composition, `%${q}%`),
          ilike(products.gtin, `%${q}%`),
        )
      : undefined,
    filter === "draft" ? eq(products.status, "draft") : undefined,
    filter === "published" ? eq(products.status, "published") : undefined,
    filter === "no-gtin" ? isNull(products.gtin) : undefined,
  );
  const rows = await db
    .select({
      itemId: products.itemId,
      brandName: products.brandName,
      gtin: products.gtin,
      classification: products.classification,
      status: products.status,
      batchCount: sql<number>`(select count(*)::int from ${batches} where ${batches.productId} = ${products.itemId})`,
    })
    .from(products)
    .where(where)
    .orderBy(asc(products.brandName));

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-ink-soft">
          <tr>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">GTIN</th>
            <th className="px-4 py-3">Class</th>
            <th className="px-4 py-3">Batches</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.itemId} className="hover:bg-brand-50">
              <td className="px-4 py-3 font-mono text-xs text-ink-soft">{r.itemId}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/products/${encodeURIComponent(r.itemId)}`} className="font-semibold text-brand-700 hover:underline">
                  {r.brandName}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs">{r.gtin ?? <span className="text-warning">missing</span>}</td>
              <td className="px-4 py-3 text-xs text-ink-soft">{r.classification}</td>
              <td className="px-4 py-3">{r.batchCount}</td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-4 py-3 text-xs text-ink-soft">{rows.length} products</p>
    </div>
  );
}

async function Content({ searchParams }: PageProps<"/admin">) {
  if (!(await getStaff())) return <NotAuthorised />;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const filter = (["draft", "published", "no-gtin"].includes(String(sp.f)) ? sp.f : "all") as Filter;
  return (
    <StaffOnly>
      {(staff) => (
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-ink">Products</h1>
              <p className="text-sm text-ink-soft">
                Signed in as {staff.email} · role <strong>{staff.role}</strong>
              </p>
            </div>
            <form className="flex flex-wrap gap-2" role="search">
              <input
                name="q"
                defaultValue={q}
                placeholder="Name, item ID, GTIN, composition"
                className="w-64 rounded-sm border border-line bg-white px-3 py-2 text-sm"
              />
              <select name="f" defaultValue={filter} className="rounded-sm border border-line bg-white px-3 py-2 text-sm">
                <option value="all">All</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="no-gtin">Missing GTIN</option>
              </select>
              <button className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Filter</button>
            </form>
          </div>
          <Flash ok={typeof sp.ok === "string" ? sp.ok : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />
          <ProductTable q={q} filter={filter} />
        </div>
      )}
    </StaffOnly>
  );
}

export default function AdminHome(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
