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

export interface ScheduleLabel {
  /** Symbol Rule 97 puts at the top left of the label (Rx / XRx), if any. */
  symbol: "Rx" | "XRx" | null;
  /** Short badge for catalogue cards. */
  badge: string;
  heading: string;
  cautions: string[];
}

const NOT_WITHOUT_RX = "Not to be sold by retail without the prescription of a Registered Medical Practitioner.";

/**
 * Cautionary label text per schedule, mirroring Drugs and Cosmetics Rules 1945, Rule 97(1)(a)–(e) as substituted by
 * the Fifth Amendment Rules 2018 (in force 1 Nov 2018). The QR page is an extension of the pack label, so it repeats
 * the statutory wording rather than paraphrasing it. NDPS (NRx) products are not in the range.
 */
export function scheduleLabel(schedule: ScanProduct["schedule"]): ScheduleLabel {
  switch (schedule) {
    case "G":
      return {
        symbol: null,
        badge: "Sch. G",
        heading: "Schedule G prescription drug – caution",
        cautions: ["It is dangerous to take this preparation except under medical supervision."],
      };
    case "H":
      return { symbol: "Rx", badge: "Rx", heading: "Schedule H prescription drug – caution", cautions: [NOT_WITHOUT_RX] };
    case "H1":
      return {
        symbol: "Rx",
        badge: "Rx",
        heading: "Schedule H1 prescription drug – caution",
        cautions: ["It is dangerous to take this preparation except in accordance with the medical advice.", NOT_WITHOUT_RX],
      };
    case "X":
      return {
        symbol: "XRx",
        badge: "XRx",
        heading: "Schedule X prescription drug – warning",
        cautions: ["To be sold by retail on the prescription of a Registered Medical Practitioner only."],
      };
    case "OTC":
      return { symbol: null, badge: "OTC", heading: "Over the counter", cautions: [] };
    default:
      // Schedule not entered yet: treat as prescription (safe default) without quoting a schedule it may not have.
      return {
        symbol: "Rx",
        badge: "Rx",
        heading: "Prescription medicine",
        cautions: ["Use only as directed by a registered medical practitioner."],
      };
  }
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });

/** Pack-style date ("Dec 2027") from an ISO date string. */
export function formatPackDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : dateFmt.format(d);
}
