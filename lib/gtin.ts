/**
 * GTIN and batch parsing for QR scan URLs: auspharma.in/{GTIN} and /{GTIN}/{batch}.
 * These URLs are printed on packs; parsing rules must stay backwards-compatible.
 */

const BATCH_PATTERN = /^[A-Z0-9-]{1,40}$/;

/** GS1 check digit for the first 12 digits of a GTIN-13 (weights 1,3,1,3… from the left). */
export function gtinCheckDigit(first12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidGtin13(value: string): boolean {
  if (!/^\d{13}$/.test(value)) return false;
  return gtinCheckDigit(value.slice(0, 12)) === Number(value[12]);
}

/** Decode, trim and uppercase a batch number; null if it isn't a safe batch identifier. */
export function normalizeBatch(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const batch = decoded.trim().toUpperCase();
  if (!BATCH_PATTERN.test(batch) || /^-+$/.test(batch)) return null;
  return batch;
}

export type ScanPath =
  | { ok: true; gtin: string; batch: string | null }
  | { ok: false; reason: "not-a-gtin" | "bad-check-digit" | "bad-batch" };

export function parseScanPath(rawGtin: string, rawBatch?: string): ScanPath {
  let digits = rawGtin.trim();
  // A GTIN-13 may also be encoded as GTIN-14 with a leading zero.
  if (/^0\d{13}$/.test(digits)) digits = digits.slice(1);
  if (!/^\d{13}$/.test(digits)) return { ok: false, reason: "not-a-gtin" };
  if (!isValidGtin13(digits)) return { ok: false, reason: "bad-check-digit" };
  if (rawBatch === undefined) return { ok: true, gtin: digits, batch: null };
  const batch = normalizeBatch(rawBatch);
  if (!batch) return { ok: false, reason: "bad-batch" };
  return { ok: true, gtin: digits, batch };
}
