import { describe, expect, it } from "vitest";
import { gtinCheckDigit, isValidGtin13, normalizeBatch, parseScanPath } from "./gtin";

describe("gtinCheckDigit", () => {
  it("computes the GS1 check digit for the first 12 digits", () => {
    expect(gtinCheckDigit("890621988007")).toBe(0); // AUSPHARMA example 8906219880070
    expect(gtinCheckDigit("890000000000")).toBe(5); // template example 8900000000005
    expect(gtinCheckDigit("400638133393")).toBe(1); // 4006381333931 (GS1 reference)
  });
});

describe("isValidGtin13", () => {
  it("accepts valid GTIN-13s", () => {
    expect(isValidGtin13("8906219880070")).toBe(true);
    expect(isValidGtin13("4006381333931")).toBe(true);
  });
  it("rejects wrong check digit, wrong length and non-digits", () => {
    expect(isValidGtin13("8906219880071")).toBe(false);
    expect(isValidGtin13("890621988007")).toBe(false);
    expect(isValidGtin13("89062198800700")).toBe(false);
    expect(isValidGtin13("890621988007a")).toBe(false);
    expect(isValidGtin13("")).toBe(false);
  });
});

describe("normalizeBatch", () => {
  it("accepts letters, digits and hyphens, uppercasing for lookup", () => {
    expect(normalizeBatch("ab24017")).toBe("AB24017");
    expect(normalizeBatch("AB-24-017")).toBe("AB-24-017");
  });
  it("decodes URL-encoding and trims", () => {
    expect(normalizeBatch("%20AB24017%20")).toBe("AB24017");
  });
  it("rejects empty, too long, and unsafe characters", () => {
    expect(normalizeBatch("")).toBeNull();
    expect(normalizeBatch("A".repeat(41))).toBeNull();
    expect(normalizeBatch("AB/24")).toBeNull();
    expect(normalizeBatch("AB 24")).toBeNull();
    expect(normalizeBatch("..")).toBeNull();
    expect(normalizeBatch("%E0%A4")).toBeNull(); // malformed encoding
  });
});

describe("parseScanPath", () => {
  it("parses /{GTIN}", () => {
    expect(parseScanPath("8906219880070")).toEqual({ ok: true, gtin: "8906219880070", batch: null });
  });
  it("parses /{GTIN}/{batch}", () => {
    expect(parseScanPath("8906219880070", "ab24017")).toEqual({
      ok: true,
      gtin: "8906219880070",
      batch: "AB24017",
    });
  });
  it("accepts a 14-digit GTIN with a leading zero (GTIN-14 form of a GTIN-13)", () => {
    expect(parseScanPath("08906219880070")).toEqual({ ok: true, gtin: "8906219880070", batch: null });
  });
  it("reports why a scan path is not a product", () => {
    expect(parseScanPath("about")).toEqual({ ok: false, reason: "not-a-gtin" });
    expect(parseScanPath("8906219880071")).toEqual({ ok: false, reason: "bad-check-digit" });
    expect(parseScanPath("8906219880070", "AB/1")).toEqual({ ok: false, reason: "bad-batch" });
  });
});
