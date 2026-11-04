import "server-only";
import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getDb, schema } from "@/db";
import type { PilSection } from "@/db/schema";
import type { PatientGuide } from "@/lib/patient-guide";

const { products, manufacturers, batches, pilVersions, patientGuides } = schema;

/** Cache tag for everything shown on a product's scan page. Admin mutations call revalidateTag(productTag(gtin)). */
export const productTag = (gtin: string) => `product:${gtin}`;
/** Cache tag for lists of published products (home, therapy, search). */
export const CATALOG_TAG = "catalog";

export interface CatalogItem {
  gtin: string;
  brandName: string;
  composition: string;
  packSize: string | null;
  dosageForm: string | null;
  therapy: string | null;
  prescription: boolean;
  packImage: string | null;
  /** Published batches, newest first (for the home verify card). */
  batches: { batchNo: string; expiryDate: string | null }[];
}

/** Published products that have a GTIN, with their published batches. Public data only. */
export async function listCatalog(): Promise<CatalogItem[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const db = getDb();
  const rows = await db
    .select({
      itemId: products.itemId,
      gtin: products.gtin,
      brandName: products.brandName,
      composition: products.composition,
      packSize: products.packSize,
      dosageForm: products.dosageForm,
      therapy: products.therapy,
      schedule: products.schedule,
      packImage: products.packImageBlob,
    })
    .from(products)
    .where(and(eq(products.status, "published"), isNotNull(products.gtin)))
    .orderBy(asc(products.brandName));
  if (rows.length === 0) return [];
  const bs = await db
    .select({ productId: batches.productId, batchNo: batches.batchNo, expiryDate: batches.expiryDate })
    .from(batches)
    .where(and(inArray(batches.productId, rows.map((r) => r.itemId)), eq(batches.status, "published")))
    .orderBy(desc(batches.mfgDate));
  return rows.map((r) => ({
    gtin: r.gtin!,
    brandName: r.brandName,
    composition: r.composition,
    packSize: r.packSize,
    dosageForm: r.dosageForm,
    therapy: r.therapy,
    prescription: r.schedule !== "OTC",
    packImage: r.packImage?.startsWith("/") ? r.packImage : null,
    batches: bs.filter((b) => b.productId === r.itemId).map((b) => ({ batchNo: b.batchNo, expiryDate: b.expiryDate })),
  }));
}

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
  /** Public pack shot path (e.g. /packs/{gtin}.webp), if any. */
  packImage: string | null;
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
  /** Published "Easy guide for patients", if any. */
  guide: { id: number; version: string; content: PatientGuide; hasPdf: boolean } | null;
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
  const p = row.products;

  const [pilRows, batchRows, guideRows] = await Promise.all([
    db
      .select()
      .from(pilVersions)
      .where(and(eq(pilVersions.productId, p.itemId), inArray(pilVersions.status, ["published", "superseded"])))
      .orderBy(desc(pilVersions.publishedAt)),
    db.select().from(batches).where(eq(batches.productId, p.itemId)).orderBy(desc(batches.mfgDate)),
    db
      .select()
      .from(patientGuides)
      .where(and(eq(patientGuides.productId, p.itemId), eq(patientGuides.status, "published")))
      .orderBy(desc(patientGuides.publishedAt))
      .limit(1),
  ]);
  const g = guideRows[0];

  const m = row.manufacturers;
  return {
    gtin,
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
    packImage: p.packImageBlob?.startsWith("/") ? p.packImageBlob : null,
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
    guide: g ? { id: g.id, version: g.version, content: g.content, hasPdf: Boolean(g.pdfBlob) } : null,
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
    | { kind: "guide"; guideId: number }
    | { kind: "gmp"; manufacturerId: string },
): Promise<string | null> {
  const db = getDb();
  if (doc.kind === "coa") {
    const [b] = await db
      .select({ blob: batches.coaBlob, status: batches.status, productStatus: products.status })
      .from(batches)
      .innerJoin(products, eq(batches.productId, products.itemId))
      .where(and(eq(products.gtin, doc.gtin), eq(batches.batchNo, doc.batchNo)))
      .limit(1);
    return b && b.status === "published" && b.productStatus === "published" ? b.blob : null;
  }
  if (doc.kind === "pil") {
    const [v] = await db
      .select({ blob: pilVersions.pdfBlob, status: pilVersions.status, productStatus: products.status })
      .from(pilVersions)
      .innerJoin(products, eq(pilVersions.productId, products.itemId))
      .where(eq(pilVersions.id, doc.pilVersionId))
      .limit(1);
    // Superseded versions stay downloadable: older batches were packed with them.
    return v && v.status !== "draft" && v.productStatus === "published" ? v.blob : null;
  }
  if (doc.kind === "guide") {
    const [v] = await db
      .select({ blob: patientGuides.pdfBlob, status: patientGuides.status, productStatus: products.status })
      .from(patientGuides)
      .innerJoin(products, eq(patientGuides.productId, products.itemId))
      .where(eq(patientGuides.id, doc.guideId))
      .limit(1);
    return v && v.status === "published" && v.productStatus === "published" ? v.blob : null;
  }
  const [m] = await db
    .select({ blob: manufacturers.whoGmpCertificateBlob })
    .from(manufacturers)
    .where(eq(manufacturers.id, doc.manufacturerId))
    .limit(1);
  return m?.blob ?? null;
}
