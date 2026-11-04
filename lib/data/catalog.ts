import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/db";
import type { PilSection } from "@/db/schema";

const { products, manufacturers, batches, pilVersions } = schema;

/** Cache tag for everything shown on a product's scan page. Admin mutations call revalidateTag(productTag(gtin)). */
export const productTag = (gtin: string) => `product:${gtin}`;

export interface ScanBatch {
  batchNo: string;
  mfgDate: string | null;
  expiryDate: string | null;
  mrpPaise: number | null;
  status: "published" | "withdrawn";
  withdrawnReason: string | null;
  hasCoa: boolean;
  pilVersionId: number | null;
}

export interface ScanPil {
  id: number;
  kind: "prescribing_information" | "patient_leaflet";
  version: string;
  revisionDate: string | null;
  hasPdf: boolean;
  sections: PilSection[];
  /** True for the currently published version; false for superseded versions kept for older batches. */
  current: boolean;
}

export interface ScanProduct {
  gtin: string;
  brandName: string;
  composition: string;
  dosageForm: string | null;
  packSize: string | null;
  packType: string | null;
  schedule: "H" | "H1" | "X" | "G" | "OTC" | null;
  therapy: string | null;
  manufacturingLicenceNo: string | null;
  marketedBy: string;
  mrpPaise: number | null;
  mrpPer: string | null;
  storage: string | null;
  manufacturer: {
    id: string;
    legalName: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    whoGmpCertificateNo: string | null;
    whoGmpIssuer: string | null;
    whoGmpValidUntil: string | null;
    hasWhoGmpCertificate: boolean;
    /** Certificate uploaded and valid-until date today or later. Never present an expired certificate as current. */
    whoGmpCurrent: boolean;
  } | null;
  /** Published + superseded PIL versions, newest first (older batches show the leaflet they were packed with). */
  pils: ScanPil[];
  /** Published and withdrawn batches (never drafts), newest first. */
  batches: ScanBatch[];
}

/** Everything the public scan page needs for one GTIN, or null if it isn't published. */
export async function getScanProduct(gtin: string): Promise<ScanProduct | null> {
  "use cache";
  cacheTag(productTag(gtin));
  cacheLife("hours");

  const db = getDb();
  const [row] = await db
    .select()
    .from(products)
    .leftJoin(manufacturers, eq(products.manufacturerId, manufacturers.id))
    .where(and(eq(products.gtin, gtin), eq(products.status, "published")))
    .limit(1);
  if (!row) return null;

  const [pilRows, batchRows] = await Promise.all([
    db
      .select()
      .from(pilVersions)
      .where(and(eq(pilVersions.gtin, gtin), inArray(pilVersions.status, ["published", "superseded"])))
      .orderBy(desc(pilVersions.publishedAt)),
    db.select().from(batches).where(eq(batches.gtin, gtin)).orderBy(desc(batches.mfgDate)),
  ]);

  const p = row.products;
  const m = row.manufacturers;
  return {
    gtin: p.gtin,
    brandName: p.brandName,
    composition: p.composition,
    dosageForm: p.dosageForm,
    packSize: p.packSize,
    packType: p.packType,
    schedule: p.schedule,
    therapy: p.therapy,
    manufacturingLicenceNo: p.manufacturingLicenceNo,
    marketedBy: p.marketedBy,
    mrpPaise: p.mrpPaise,
    mrpPer: p.mrpPer,
    storage: p.storage,
    manufacturer: m
      ? {
          id: m.id,
          legalName: m.legalName,
          address: m.address,
          city: m.city,
          state: m.state,
          pinCode: m.pinCode,
          whoGmpCertificateNo: m.whoGmpCertificateNo,
          whoGmpIssuer: m.whoGmpIssuer,
          whoGmpValidUntil: m.whoGmpValidUntil,
          hasWhoGmpCertificate: Boolean(m.whoGmpCertificateBlob),
          whoGmpCurrent:
            Boolean(m.whoGmpCertificateBlob) &&
            m.whoGmpValidUntil !== null &&
            m.whoGmpValidUntil >= new Date().toISOString().slice(0, 10),
        }
      : null,
    pils: pilRows.map((v) => ({
      id: v.id,
      kind: v.kind,
      version: v.version,
      revisionDate: v.revisionDate,
      hasPdf: Boolean(v.pdfBlob),
      sections: v.sections,
      current: v.status === "published",
    })),
    batches: batchRows
      .filter((b): b is typeof b & { status: "published" | "withdrawn" } => b.status !== "draft")
      .map((b) => ({
        batchNo: b.batchNo,
        mfgDate: b.mfgDate,
        expiryDate: b.expiryDate,
        mrpPaise: b.mrpPaise,
        status: b.status,
        withdrawnReason: b.withdrawnReason,
        hasCoa: Boolean(b.coaBlob),
        pilVersionId: b.pilVersionId,
      })),
  };
}

/** Blob pathname for a published document, or null. Not cached: status must be checked on every download. */
export async function getDocumentBlob(
  doc:
    | { kind: "coa"; gtin: string; batchNo: string }
    | { kind: "pil"; pilVersionId: number }
    | { kind: "gmp"; manufacturerId: string },
): Promise<string | null> {
  const db = getDb();
  if (doc.kind === "coa") {
    const [b] = await db
      .select({ blob: batches.coaBlob, status: batches.status, productStatus: products.status })
      .from(batches)
      .innerJoin(products, eq(batches.gtin, products.gtin))
      .where(and(eq(batches.gtin, doc.gtin), eq(batches.batchNo, doc.batchNo)))
      .limit(1);
    return b && b.status === "published" && b.productStatus === "published" ? b.blob : null;
  }
  if (doc.kind === "pil") {
    const [v] = await db
      .select({ blob: pilVersions.pdfBlob, status: pilVersions.status, productStatus: products.status })
      .from(pilVersions)
      .innerJoin(products, eq(pilVersions.gtin, products.gtin))
      .where(eq(pilVersions.id, doc.pilVersionId))
      .limit(1);
    // Superseded versions stay downloadable: older batches were packed with them.
    return v && v.status !== "draft" && v.productStatus === "published" ? v.blob : null;
  }
  const [m] = await db
    .select({ blob: manufacturers.whoGmpCertificateBlob })
    .from(manufacturers)
    .where(eq(manufacturers.id, doc.manufacturerId))
    .limit(1);
  return m?.blob ?? null;
}
