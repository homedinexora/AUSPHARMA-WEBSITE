/**
 * Product verification data model. See docs/plans/product-coa-pil-admin-plan.md.
 * Nothing is public until status = "published" (approved by QA).
 * PDFs live in the private Blob store; columns hold the blob pathname, never a public URL.
 */
import { sql } from "drizzle-orm";
import {
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const publishStatus = pgEnum("publish_status", ["draft", "published", "archived"]);
export const batchStatus = pgEnum("batch_status", ["draft", "published", "withdrawn"]);
export const pilStatus = pgEnum("pil_status", ["draft", "published", "superseded"]);
export const drugSchedule = pgEnum("drug_schedule", ["H", "H1", "X", "G", "OTC"]);
/** prescribing_information = insert "for the use of a Registered Medical Practitioner…" (shown behind an HCP declaration);
 *  patient_leaflet = written for patients (shown openly). */
export const insertKind = pgEnum("insert_kind", ["prescribing_information", "patient_leaflet"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** WHO-GMP certified manufacturing partner (one row per manufacturing site). */
export const manufacturers = pgTable("manufacturers", {
  id: text("id").primaryKey(), // short code chosen by AUSPHARMA, e.g. MFR-001
  legalName: text("legal_name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pinCode: char("pin_code", { length: 6 }),
  licenceNumbers: text("licence_numbers"),
  whoGmpCertificateNo: text("who_gmp_certificate_no"),
  whoGmpIssuer: text("who_gmp_issuer"),
  whoGmpValidUntil: date("who_gmp_valid_until"),
  whoGmpCertificateBlob: text("who_gmp_certificate_blob"),
  ...timestamps,
});

/** One row per pack (SKU). Keyed by the ERP item ID; the GTIN-13 is added when assigned and drives the QR URL. */
export const products = pgTable(
  "products",
  {
    itemId: text("item_id").primaryKey(), // ERP ITEMID, e.g. AUS0102
    gtin: char("gtin", { length: 13 }).unique(),
    brand: text("brand"), // e.g. AUSRASTIN
    brandName: text("brand_name").notNull(), // full pack name, e.g. AUSRASTIN GOLD 10 CAP 10'S
    classification: text("classification"), // ERP CLASSIFICATION / CATEGORY, kept for reference
    category: text("category"),
    composition: text("composition").notNull(),
    dosageForm: text("dosage_form"),
    packSize: text("pack_size"),
    packType: text("pack_type"),
    schedule: drugSchedule("schedule"),
    therapy: text("therapy"), // slug from lib/therapies.ts
    manufacturerId: text("manufacturer_id").references(() => manufacturers.id),
    manufacturingLicenceNo: text("manufacturing_licence_no"),
    marketedBy: text("marketed_by").notNull().default("Auspharma Private Limited"),
    mrpPaise: integer("mrp_paise"), // money as integer paise
    mrpPer: text("mrp_per"),
    storage: text("storage"),
    shelfLifeMonths: integer("shelf_life_months"),
    packImageBlob: text("pack_image_blob"),
    status: publishStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by"),
    ...timestamps,
  },
  (t) => [
    check("gtin_13_digits", sql`${t.gtin} IS NULL OR ${t.gtin} ~ '^[0-9]{13}$'`),
    index("products_therapy_idx").on(t.therapy),
  ],
);

export interface PilSection {
  key: string; // e.g. "4.1" for numbered inserts, or a slug
  title: string;
  body: string; // limited Markdown (bold, lists, tables)
  /** Shown to everyone even on HCP-only inserts (e.g. "Patient counselling information"). */
  patientFacing?: boolean;
}

/** Patient Information Leaflet versions; the approved PDF is the master, sections mirror it. */
export const pilVersions = pgTable(
  "pil_versions",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.itemId),
    kind: insertKind("kind").notNull().default("prescribing_information"),
    version: text("version").notNull(), // as printed, e.g. "v2 / 03-2026"
    revisionDate: text("revision_date"),
    pdfBlob: text("pdf_blob"),
    sections: jsonb("sections").$type<PilSection[]>().notNull().default([]),
    status: pilStatus("status").notNull().default("draft"),
    createdBy: text("created_by"),
    approvedBy: text("approved_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("pil_versions_product_version_uq").on(t.productId, t.version)],
);

/** "Easy guide for patients" versions (plain-language, structured). Public only once QA publishes. */
export const patientGuides = pgTable(
  "patient_guides",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.itemId),
    version: text("version").notNull(),
    content: jsonb("content").$type<import("../lib/patient-guide").PatientGuide>().notNull(),
    pdfBlob: text("pdf_blob"),
    status: pilStatus("status").notNull().default("draft"),
    createdBy: text("created_by"),
    approvedBy: text("approved_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("patient_guides_product_version_uq").on(t.productId, t.version)],
);

/** Batches; the CoA PDF is shown publicly only when status = published. */
export const batches = pgTable(
  "batches",
  {
    id: serial("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.itemId),
    batchNo: text("batch_no").notNull(), // stored uppercase, [A-Z0-9-]
    mfgDate: date("mfg_date"),
    expiryDate: date("expiry_date"),
    mrpPaise: integer("mrp_paise"), // overrides product MRP when set
    coaBlob: text("coa_blob"),
    pilVersionId: integer("pil_version_id").references(() => pilVersions.id),
    status: batchStatus("status").notNull().default("draft"),
    withdrawnReason: text("withdrawn_reason"),
    createdBy: text("created_by"),
    approvedBy: text("approved_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("batches_product_batch_uq").on(t.productId, t.batchNo),
    check("batch_no_format", sql`${t.batchNo} ~ '^[A-Z0-9-]{1,40}$'`),
  ],
);

/** Append-only record of every change, for regulatory questions. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actor: text("actor").notNull(),
    action: text("action").notNull(), // e.g. product.publish, batch.withdraw
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);
