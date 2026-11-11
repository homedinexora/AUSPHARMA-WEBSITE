"use server";

import { put } from "@vercel/blob";
import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { requireStaff, type Staff } from "@/lib/admin/auth";
import { CATALOG_TAG, productTag } from "@/lib/data/catalog";
import { isValidGtin13, normalizeBatch } from "@/lib/gtin";
import { insertVersionName } from "@/lib/admin/insert-version";
import { isDrugSchedule } from "@/lib/schedules";
import { parseInsert } from "@/lib/insert-parser";
import { extractPdfText } from "@/lib/pdf-text";

const { products, batches, pilVersions, auditLog } = schema;
const MAX_PDF = 4 * 1024 * 1024;

const back = (itemId: string, q: Record<string, string>) =>
  redirect(`/admin/products/${encodeURIComponent(itemId)}?${new URLSearchParams(q)}`);

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

async function audit(staff: Staff, action: string, entity: string, entityId: string, before: unknown, after: unknown) {
  await getDb().insert(auditLog).values({ actor: staff.email, action, entity, entityId, before, after });
}

async function getProduct(itemId: string) {
  const [p] = await getDb().select().from(products).where(eq(products.itemId, itemId)).limit(1);
  return p ?? null;
}

function refresh(...gtins: (string | null | undefined)[]) {
  for (const g of new Set(gtins.filter(Boolean) as string[])) updateTag(productTag(g));
  updateTag(CATALOG_TAG); // home, therapy and search lists
}

async function readPdf(f: FormData, key: string): Promise<{ file: File } | { error: string } | null> {
  const file = f.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_PDF) return { error: "PDF is larger than 4 MB" };
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== "%PDF-") return { error: "File is not a PDF" };
  return { file };
}

/* ------------------------------------------------------------------ products */

export async function updateProduct(itemId: string, form: FormData) {
  const staff = await requireStaff("editor");
  const before = await getProduct(itemId);
  if (!before) back(itemId, { error: "Product not found" });
  const p = before!;

  const gtin = str(form, "gtin");
  if (gtin && !isValidGtin13(gtin)) back(itemId, { error: "GTIN must be 13 digits with a valid GS1 check digit" });
  if (p.status === "published" && gtin !== p.gtin)
    back(itemId, { error: "GTIN of a published product cannot change (it is printed in the QR). Unpublish first." });
  if (gtin) {
    const [clash] = await getDb()
      .select({ itemId: products.itemId })
      .from(products)
      .where(and(eq(products.gtin, gtin), ne(products.itemId, itemId)))
      .limit(1);
    if (clash) back(itemId, { error: `GTIN ${gtin} is already used by ${clash.itemId}` });
  }

  const mrpRaw = str(form, "mrp");
  let mrpPaise: number | null = null;
  if (mrpRaw) {
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(mrpRaw)) back(itemId, { error: "MRP must be a rupee amount, e.g. 99.50" });
    mrpPaise = Math.round(Number(mrpRaw) * 100);
  }
  const schedule = str(form, "schedule");
  if (schedule && !isDrugSchedule(schedule)) back(itemId, { error: "Unknown schedule" });

  const division = str(form, "division");
  if (division && division !== "aquris") back(itemId, { error: "Unknown division" });

  const changes = {
    gtin,
    division,
    brandName: str(form, "brandName") ?? p.brandName,
    composition: str(form, "composition") ?? p.composition,
    dosageForm: str(form, "dosageForm"),
    packSize: str(form, "packSize"),
    packType: str(form, "packType"),
    schedule: schedule as (typeof products.$inferInsert)["schedule"],
    manufacturerId: str(form, "manufacturerId"),
    manufacturingLicenceNo: str(form, "manufacturingLicenceNo"),
    mrpPaise,
    mrpPer: str(form, "mrpPer"),
    storage: str(form, "storage"),
  };
  await getDb().update(products).set(changes).where(eq(products.itemId, itemId));
  await audit(staff, "product.update", "products", itemId, p, changes);
  refresh(p.gtin, gtin);
  back(itemId, { ok: "Saved" });
}

export async function setProductPublished(itemId: string, publish: boolean) {
  const staff = await requireStaff("qa");
  const p = await getProduct(itemId);
  if (!p) back(itemId, { error: "Product not found" });
  if (publish && !p!.gtin) back(itemId, { error: "Add the GTIN before publishing" });
  const set = publish
    ? { status: "published" as const, publishedAt: new Date(), publishedBy: staff.email }
    : { status: "draft" as const };
  await getDb().update(products).set(set).where(eq(products.itemId, itemId));
  await audit(staff, publish ? "product.publish" : "product.unpublish", "products", itemId, { status: p!.status }, set);
  refresh(p!.gtin);
  back(itemId, { ok: publish ? "Published" : "Unpublished" });
}

/* ------------------------------------------------------------------ batches */

export async function addBatch(itemId: string, form: FormData) {
  const staff = await requireStaff("editor");
  const p = await getProduct(itemId);
  if (!p) back(itemId, { error: "Product not found" });

  const batchNo = normalizeBatch(str(form, "batchNo") ?? "");
  if (!batchNo) back(itemId, { error: "Batch no. may contain only letters, digits and hyphens" });
  const mfgDate = str(form, "mfgDate");
  const expiryDate = str(form, "expiryDate");
  if (mfgDate && expiryDate && expiryDate <= mfgDate) back(itemId, { error: "Expiry must be after manufacturing date" });

  const pdf = await readPdf(form, "coa");
  if (pdf && "error" in pdf) back(itemId, { error: `CoA: ${pdf.error}` });

  const [exists] = await getDb()
    .select({ id: batches.id })
    .from(batches)
    .where(and(eq(batches.productId, itemId), eq(batches.batchNo, batchNo!)))
    .limit(1);
  if (exists) back(itemId, { error: `Batch ${batchNo} already exists` });

  let coaBlob: string | null = null;
  if (pdf && "file" in pdf) {
    const blob = await put(`coa/${itemId}/${batchNo}.pdf`, pdf.file, {
      access: "private",
      contentType: "application/pdf",
      allowOverwrite: true,
    });
    coaBlob = blob.pathname;
  }
  const row = { productId: itemId, batchNo: batchNo!, mfgDate, expiryDate, coaBlob, createdBy: staff.email };
  await getDb().insert(batches).values(row);
  await audit(staff, "batch.create", "batches", `${itemId}/${batchNo}`, null, row);
  back(itemId, { ok: `Batch ${batchNo} added as draft` });
}

export async function uploadCoa(itemId: string, batchId: number, form: FormData) {
  const staff = await requireStaff("editor");
  const pdf = await readPdf(form, "coa");
  if (!pdf) back(itemId, { error: "Choose a CoA PDF" });
  if (pdf && "error" in pdf) back(itemId, { error: `CoA: ${pdf.error}` });
  const [b] = await getDb().select().from(batches).where(eq(batches.id, batchId)).limit(1);
  if (!b || b.productId !== itemId) back(itemId, { error: "Batch not found" });
  const blob = await put(`coa/${itemId}/${b!.batchNo}.pdf`, (pdf as { file: File }).file, {
    access: "private",
    contentType: "application/pdf",
    allowOverwrite: true,
  });
  await getDb().update(batches).set({ coaBlob: blob.pathname }).where(eq(batches.id, batchId));
  await audit(staff, "batch.coa_upload", "batches", `${itemId}/${b!.batchNo}`, { coaBlob: b!.coaBlob }, { coaBlob: blob.pathname });
  refresh((await getProduct(itemId))?.gtin);
  back(itemId, { ok: `CoA uploaded for ${b!.batchNo}` });
}

export async function setBatchStatus(itemId: string, batchId: number, status: "published" | "withdrawn" | "draft", form?: FormData) {
  const staff = await requireStaff("qa");
  const [b] = await getDb().select().from(batches).where(eq(batches.id, batchId)).limit(1);
  if (!b || b.productId !== itemId) back(itemId, { error: "Batch not found" });
  if (status === "published" && !b!.coaBlob) back(itemId, { error: "Upload the CoA before publishing the batch" });
  const reason = form ? str(form, "reason") : null;
  if (status === "withdrawn" && !reason) back(itemId, { error: "Give a reason for withdrawing the batch" });
  const set = {
    status,
    withdrawnReason: status === "withdrawn" ? reason : null,
    ...(status === "published" ? { publishedAt: new Date(), approvedBy: staff.email } : {}),
  };
  await getDb().update(batches).set(set).where(eq(batches.id, batchId));
  await audit(staff, `batch.${status}`, "batches", `${itemId}/${b!.batchNo}`, { status: b!.status }, set);
  refresh((await getProduct(itemId))?.gtin);
  back(itemId, { ok: `Batch ${b!.batchNo}: ${status}` });
}

/* ------------------------------------------------------------------ inserts */

export async function setInsertPublished(itemId: string, insertId: number, publish: boolean) {
  const staff = await requireStaff("qa");
  const [v] = await getDb().select().from(pilVersions).where(eq(pilVersions.id, insertId)).limit(1);
  if (!v || v.productId !== itemId) back(itemId, { error: "Insert not found" });
  if (publish) {
    // Only one current version: the previous published one becomes "superseded" (kept for older batches).
    await getDb()
      .update(pilVersions)
      .set({ status: "superseded" })
      .where(and(eq(pilVersions.productId, itemId), eq(pilVersions.status, "published")));
    await getDb()
      .update(pilVersions)
      .set({ status: "published", publishedAt: new Date(), approvedBy: staff.email })
      .where(eq(pilVersions.id, insertId));
  } else {
    await getDb().update(pilVersions).set({ status: "draft" }).where(eq(pilVersions.id, insertId));
  }
  await audit(staff, publish ? "insert.publish" : "insert.unpublish", "pil_versions", String(insertId), { status: v!.status }, null);
  refresh((await getProduct(itemId))?.gtin);
  back(itemId, { ok: publish ? `Insert ${v!.version} published` : `Insert ${v!.version} unpublished` });
}

/**
 * Upload an approved package-insert PDF as a new DRAFT version. Its text is parsed into sections as a
 * pre-fill; QA checks them against the PDF and publishes. A draft with the same version name is replaced;
 * a published or superseded version is never overwritten.
 */
export async function uploadInsert(itemId: string, form: FormData) {
  const staff = await requireStaff("editor");
  const p = await getProduct(itemId);
  if (!p) back(itemId, { error: "Product not found" });
  const pdf = await readPdf(form, "insert");
  if (!pdf) back(itemId, { error: "Choose the insert PDF" });
  if (pdf && "error" in pdf) back(itemId, { error: `Insert: ${pdf.error}` });
  const typed = str(form, "version");
  if (typed && !/^[A-Za-z0-9 ./_-]{1,40}$/.test(typed)) {
    back(itemId, { error: "Version may use letters, digits, spaces and . / _ - (max 40)" });
  }
  const kindChoice = str(form, "kind");

  const file = (pdf as { file: File }).file;
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";
  try {
    text = await extractPdfText(bytes);
  } catch {
    back(itemId, { error: "Insert: this PDF could not be read. Export it again from the artwork file." });
  }
  const parsed = text ? parseInsert(text) : null;
  const kind =
    kindChoice === "prescribing_information" || kindChoice === "patient_leaflet"
      ? kindChoice
      : (parsed?.kind ?? "prescribing_information"); // no text (scanned PDF): treat as HCP-only

  const db = getDb();
  const existing = await db.select().from(pilVersions).where(eq(pilVersions.productId, itemId));
  const version = insertVersionName({
    typed,
    revisionDate: parsed?.revisionDate ?? null,
    existing: existing.map((v) => v.version),
  });
  const same = existing.find((v) => v.version === version);
  if (same && same.status !== "draft") {
    back(itemId, { error: `Version "${version}" is ${same.status}. Type a new version name for this upload.` });
  }

  const blob = await put(`inserts/${itemId}/${version.replace(/[^A-Za-z0-9.-]/g, "_")}.pdf`, file, {
    access: "private",
    contentType: "application/pdf",
    allowOverwrite: true,
  });
  const values = {
    kind,
    revisionDate: parsed?.revisionDate ?? null,
    pdfBlob: blob.pathname,
    sections: parsed?.sections ?? [],
  };
  const [row] = await db
    .insert(pilVersions)
    .values({ productId: itemId, version, status: "draft", createdBy: staff.email, ...values })
    .onConflictDoUpdate({ target: [pilVersions.productId, pilVersions.version], set: values })
    .returning({ id: pilVersions.id });
  await audit(staff, same ? "insert.reupload" : "insert.upload", "pil_versions", String(row.id), null, {
    itemId,
    version,
    kind,
    sections: values.sections.length,
    pdfBlob: blob.pathname,
  });
  back(itemId, {
    ok: values.sections.length
      ? `Insert ${version} uploaded as a draft with ${values.sections.length} sections. Check them against the PDF before publishing.`
      : `Insert ${version} uploaded as a draft. No text was found (scanned PDF?), so the page will offer the PDF only.`,
  });
}

export async function toggleSectionPatientFacing(itemId: string, insertId: number, key: string) {
  const staff = await requireStaff("editor");
  const [v] = await getDb().select().from(pilVersions).where(eq(pilVersions.id, insertId)).limit(1);
  if (!v || v.productId !== itemId) back(itemId, { error: "Insert not found" });
  if (v!.status !== "draft") back(itemId, { error: "Only draft inserts can be edited" });
  const sections = v!.sections.map((s) => (s.key === key ? { ...s, patientFacing: !s.patientFacing } : s));
  await getDb().update(pilVersions).set({ sections }).where(eq(pilVersions.id, insertId));
  await audit(staff, "insert.section_audience", "pil_versions", String(insertId), { key }, null);
  back(itemId, { ok: "Section updated" });
}

/* ------------------------------------------------------------------ patient guides */

export async function saveGuide(itemId: string, guideId: number | null, form: FormData) {
  const staff = await requireStaff("editor");
  const { GUIDE_FIELDS, GuideFormatError, emptyGuide, parseBlock } = await import("@/lib/patient-guide");
  const { patientGuides } = schema;
  const version = str(form, "version");
  if (!version) back(itemId, { error: "Guide: give a version, e.g. “v2 / Nov 2026”" });

  const content = emptyGuide();
  try {
    for (const { field } of GUIDE_FIELDS) {
      (content as unknown as Record<string, unknown>)[field] = parseBlock(field, String(form.get(`g_${field}`) ?? ""));
    }
  } catch (e) {
    if (e instanceof GuideFormatError) back(itemId, { error: `Guide: ${e.message}` });
    throw e;
  }
  if (!content.headline) back(itemId, { error: "Guide: the headline is required" });

  const pdf = await readPdf(form, "guidePdf");
  if (pdf && "error" in pdf) back(itemId, { error: `Guide PDF: ${pdf.error}` });
  let pdfBlob: string | undefined;
  if (pdf && "file" in pdf) {
    const blob = await put(`guides/${itemId}/${version!.replace(/[^A-Za-z0-9.-]/g, "_")}.pdf`, pdf.file, {
      access: "private",
      contentType: "application/pdf",
      allowOverwrite: true,
    });
    pdfBlob = blob.pathname;
  }

  if (guideId) {
    const [g] = await getDb().select().from(patientGuides).where(eq(patientGuides.id, guideId)).limit(1);
    if (!g || g.productId !== itemId) back(itemId, { error: "Guide not found" });
    if (g!.status !== "draft") back(itemId, { error: "Only draft guides can be edited. Create a new version instead." });
    await getDb()
      .update(patientGuides)
      .set({ version: version!, content, ...(pdfBlob ? { pdfBlob } : {}) })
      .where(eq(patientGuides.id, guideId));
    await audit(staff, "guide.update", "patient_guides", String(guideId), { version: g!.version }, { version });
  } else {
    const [row] = await getDb()
      .insert(patientGuides)
      .values({ productId: itemId, version: version!, content, pdfBlob, createdBy: staff.email })
      .returning({ id: patientGuides.id });
    await audit(staff, "guide.create", "patient_guides", String(row.id), null, { version });
  }
  back(itemId, { ok: `Guide ${version} saved as draft` });
}

export async function setGuidePublished(itemId: string, guideId: number, publish: boolean) {
  const staff = await requireStaff("qa");
  const { patientGuides } = schema;
  const [g] = await getDb().select().from(patientGuides).where(eq(patientGuides.id, guideId)).limit(1);
  if (!g || g.productId !== itemId) back(itemId, { error: "Guide not found" });
  if (publish) {
    await getDb()
      .update(patientGuides)
      .set({ status: "superseded" })
      .where(and(eq(patientGuides.productId, itemId), eq(patientGuides.status, "published")));
    await getDb()
      .update(patientGuides)
      .set({ status: "published", publishedAt: new Date(), approvedBy: staff.email })
      .where(eq(patientGuides.id, guideId));
  } else {
    await getDb().update(patientGuides).set({ status: "draft" }).where(eq(patientGuides.id, guideId));
  }
  await audit(staff, publish ? "guide.publish" : "guide.unpublish", "patient_guides", String(guideId), { status: g!.status }, null);
  refresh((await getProduct(itemId))?.gtin);
  back(itemId, { ok: publish ? `Guide ${g!.version} published` : `Guide ${g!.version} unpublished` });
}
