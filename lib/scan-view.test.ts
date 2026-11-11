import { describe, expect, it } from "vitest";
import type { ScanBatch, ScanPil, ScanProduct } from "./data/catalog";
import { formatInr, isPrescription, resolveScanView, scheduleLabel } from "./scan-view";

const pil = (id: number, current: boolean): ScanPil => ({
  id,
  kind: "prescribing_information",
  version: `v${id}`,
  revisionDate: null,
  hasPdf: true,
  sections: [],
  current,
});

const batch = (batchNo: string, over: Partial<ScanBatch> = {}): ScanBatch => ({
  batchNo,
  mfgDate: "2026-01-01",
  expiryDate: "2027-12-31",
  mrpPaise: null,
  status: "published",
  withdrawnReason: null,
  hasCoa: true,
  pilVersionId: null,
  ...over,
});

const product = (over: Partial<ScanProduct> = {}): ScanProduct => ({
  gtin: "8906219880070",
  division: null,
  brandName: "Test 40 mg Tablet",
  composition: "Test 40 mg",
  dosageForm: null,
  packSize: "10's",
  packType: null,
  schedule: "H",
  therapy: null,
  manufacturingLicenceNo: null,
  marketedBy: "Auspharma Private Limited",
  mrpPaise: 9900,
  mrpPer: "Strip",
  storage: null,
  packImage: null,
  manufacturer: null,
  guide: null,
  pils: [pil(2, true), pil(1, false)],
  batches: [batch("AB2"), batch("AB1", { pilVersionId: 1 })],
  ...over,
});

describe("resolveScanView", () => {
  it("with no batch in the URL: asks for a batch and shows the current PIL", () => {
    const v = resolveScanView(product(), null);
    expect(v.batchState).toBe("none");
    expect(v.batch).toBeNull();
    expect(v.pil?.id).toBe(2);
    expect(v.pilIsOlderVersion).toBe(false);
    expect(v.mrpPaise).toBe(9900);
  });

  it("with a published batch: shows its CoA and the PIL it was packed with", () => {
    const v = resolveScanView(product(), "AB1");
    expect(v.batchState).toBe("published");
    expect(v.batch?.batchNo).toBe("AB1");
    expect(v.pil?.id).toBe(1);
    expect(v.pilIsOlderVersion).toBe(true);
  });

  it("falls back to the current PIL when the batch has none recorded", () => {
    expect(resolveScanView(product(), "AB2").pil?.id).toBe(2);
  });

  it("uses the batch MRP when it overrides the product MRP", () => {
    const p = product({ batches: [batch("AB3", { mrpPaise: 12050 })] });
    expect(resolveScanView(p, "AB3").mrpPaise).toBe(12050);
  });

  it("reports a withdrawn batch without exposing a CoA", () => {
    const p = product({ batches: [batch("AB9", { status: "withdrawn", withdrawnReason: "Recall" })] });
    const v = resolveScanView(p, "AB9");
    expect(v.batchState).toBe("withdrawn");
    expect(v.coaAvailable).toBe(false);
  });

  it("reports an unknown batch (not yet published)", () => {
    const v = resolveScanView(product(), "ZZ1");
    expect(v.batchState).toBe("unknown");
    expect(v.batch).toBeNull();
    expect(v.coaAvailable).toBe(false);
  });

  it("marks a published batch without an uploaded CoA as not available", () => {
    const p = product({ batches: [batch("AB4", { hasCoa: false })] });
    expect(resolveScanView(p, "AB4").coaAvailable).toBe(false);
  });

  it("lists only published batches in the selector", () => {
    const p = product({ batches: [batch("AB2"), batch("AB9", { status: "withdrawn" })] });
    expect(resolveScanView(p, null).selectableBatches.map((b) => b.batchNo)).toEqual(["AB2"]);
  });

  it("handles a product with no PIL yet", () => {
    expect(resolveScanView(product({ pils: [] }), null).pil).toBeNull();
  });
});

describe("formatInr", () => {
  it("formats paise as Indian rupees", () => {
    expect(formatInr(9900)).toBe("₹99.00");
    expect(formatInr(12345678)).toBe("₹1,23,456.78");
  });
});

describe("isPrescription", () => {
  it("treats every scheduled drug and unknown schedule as prescription", () => {
    expect(isPrescription("H")).toBe(true);
    expect(isPrescription("H1")).toBe(true);
    expect(isPrescription("X")).toBe(true);
    expect(isPrescription("G")).toBe(true);
    expect(isPrescription(null)).toBe(true);
    expect(isPrescription("OTC")).toBe(false);
  });
});

// Drugs and Cosmetics Rules 1945, Rule 97(1) as substituted by the Fifth Amendment Rules 2018 (in force 1 Nov 2018).
describe("scheduleLabel", () => {
  it("Schedule G: 'prescription drug' caution box, medical supervision, no Rx symbol (clause a)", () => {
    expect(scheduleLabel("G")).toEqual({
      symbol: null,
      badge: "Sch. G",
      heading: "Schedule G prescription drug – caution",
      cautions: ["It is dangerous to take this preparation except under medical supervision."],
    });
  });
  it("Schedule H: Rx symbol, not to be sold without prescription (clause b)", () => {
    expect(scheduleLabel("H")).toEqual({
      symbol: "Rx",
      badge: "Rx",
      heading: "Schedule H prescription drug – caution",
      cautions: ["Not to be sold by retail without the prescription of a Registered Medical Practitioner."],
    });
  });
  it("Schedule H1: Rx symbol and both cautions (clause e)", () => {
    const l = scheduleLabel("H1");
    expect(l.symbol).toBe("Rx");
    expect(l.heading).toBe("Schedule H1 prescription drug – caution");
    expect(l.cautions).toEqual([
      "It is dangerous to take this preparation except in accordance with the medical advice.",
      "Not to be sold by retail without the prescription of a Registered Medical Practitioner.",
    ]);
  });
  it("Schedule X: XRx symbol and warning (clause d)", () => {
    expect(scheduleLabel("X")).toEqual({
      symbol: "XRx",
      badge: "XRx",
      heading: "Schedule X prescription drug – warning",
      cautions: ["To be sold by retail on the prescription of a Registered Medical Practitioner only."],
    });
  });
  it("OTC: no caution box", () => {
    expect(scheduleLabel("OTC")).toEqual({ symbol: null, badge: "OTC", heading: "Over the counter", cautions: [] });
  });
  it("unknown schedule: treated as prescription (safe default) without quoting a schedule it may not have", () => {
    expect(scheduleLabel(null)).toEqual({
      symbol: "Rx",
      badge: "Rx",
      heading: "Prescription medicine",
      cautions: ["Use only as directed by a registered medical practitioner."],
    });
  });
});

// Products not listed in Schedule H but prescription-only under their marketing permission (e.g. newer molecules),
// labelled with the prescription caution alone or alongside a Schedule G box (as on Mankind's DYNAGLIPT-M).
describe("scheduleLabel: prescription caution without a Schedule H listing", () => {
  const RX = "Not to be sold by retail without the prescription of a Registered Medical Practitioner.";
  it("RX: prescription caution only, no Rx symbol or schedule heading (as printed on the pack)", () => {
    expect(scheduleLabel("RX")).toEqual({ symbol: null, badge: "Rx", heading: "Prescription only – caution", cautions: [RX] });
  });
  it("G_RX: Schedule G box plus the prescription caution", () => {
    expect(scheduleLabel("G_RX")).toEqual({
      symbol: null,
      badge: "Rx",
      heading: "Schedule G prescription drug – caution",
      cautions: ["It is dangerous to take this preparation except under medical supervision.", RX],
    });
  });
  it("both stay prescription products (noindex, HCP gate)", () => {
    expect(isPrescription("RX")).toBe(true);
    expect(isPrescription("G_RX")).toBe(true);
  });
});

// Combinations with a Schedule H drug and metformin (Schedule G) print both boxes, e.g. GLUCOBIT-GM 2 and AUSGLIMER MV1/MV2.
describe("scheduleLabel: Schedule H + Schedule G", () => {
  it("H_G: Rx symbol, Schedule H caution and the Schedule G caution", () => {
    expect(scheduleLabel("H_G")).toEqual({
      symbol: "Rx",
      badge: "Rx",
      heading: "Schedule H prescription drug – caution",
      cautions: [
        "Not to be sold by retail without the prescription of a Registered Medical Practitioner.",
        "Schedule G prescription drug – caution: It is dangerous to take this preparation except under medical supervision.",
      ],
    });
    expect(isPrescription("H_G")).toBe(true);
  });
});
