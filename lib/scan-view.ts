import type { ScanBatch, ScanPil, ScanProduct } from "./data/catalog";

export type BatchState = "none" | "published" | "withdrawn" | "unknown";

export interface ScanView {
  batchState: BatchState;
  /** The scanned batch when it is published or withdrawn; null when absent or unknown. */
  batch: ScanBatch | null;
  /** Requested batch number (normalised), even when unknown. */
  requestedBatch: string | null;
  coaAvailable: boolean;
  /** Leaflet to show: the one packed with the batch, otherwise the current one. */
  pil: ScanPil | null;
  pilIsOlderVersion: boolean;
  mrpPaise: number | null;
  /** Batches offered in the selector: published only. */
  selectableBatches: ScanBatch[];
}

export function resolveScanView(product: ScanProduct, batchNo: string | null): ScanView {
  const currentPil = product.pils.find((p) => p.current) ?? product.pils[0] ?? null;
  const selectableBatches = product.batches.filter((b) => b.status === "published");
  const found = batchNo ? (product.batches.find((b) => b.batchNo === batchNo) ?? null) : null;

  const batchState: BatchState = !batchNo ? "none" : !found ? "unknown" : found.status;

  const packedPil =
    found?.pilVersionId != null ? (product.pils.find((p) => p.id === found.pilVersionId) ?? null) : null;
  const pil = packedPil ?? currentPil;

  return {
    batchState,
    batch: found,
    requestedBatch: batchNo,
    coaAvailable: batchState === "published" && Boolean(found?.hasCoa),
    pil,
    pilIsOlderVersion: Boolean(pil && currentPil && pil.id !== currentPil.id),
    mrpPaise: found?.mrpPaise ?? product.mrpPaise,
    selectableBatches,
  };
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export function formatInr(paise: number): string {
  return inr.format(paise / 100);
}

/** Anything scheduled, or with an unknown schedule, is treated as prescription-only (the safe default). */
export function isPrescription(schedule: ScanProduct["schedule"]): boolean {
  return schedule !== "OTC";
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });

/** Pack-style date ("Dec 2027") from an ISO date string. */
export function formatPackDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}
