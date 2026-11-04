import { describe, expect, it } from "vitest";
import { GUIDE_FIELDS, GuideFormatError, emptyGuide, parseBlock, serializeBlock } from "./patient-guide";
import { ausrastinGold10Guide } from "./guides/ausrastin-gold-10";

describe("parseBlock", () => {
  it("parses pipe-separated rows", () => {
    expect(parseBlock("ingredients", "Rosuvastatin | 10 mg | Cholesterol medicine\nAspirin|75 mg|Blood thinner")).toEqual([
      { name: "Rosuvastatin", strength: "10 mg", role: "Cholesterol medicine" },
      { name: "Aspirin", strength: "75 mg", role: "Blood thinner" },
    ]);
  });
  it("splits example lists and ignores blank lines", () => {
    expect(parseBlock("dangerous", "\nEye drops | Brinzolamide, Dorzolamide | Tell your eye doctor\n\n")).toEqual([
      { group: "Eye drops", examples: ["Brinzolamide", "Dorzolamide"], note: "Tell your eye doctor" },
    ]);
  });
  it("parses how-it-works blocks with a Result line", () => {
    const v = parseBlock("howItWorks", "A · In the liver\nStep one\nStep two\nResult: less cholesterol\n\nB · In the blood\nStep\nResult: fewer clots");
    expect(v).toHaveLength(2);
    expect(v[0]).toEqual({ title: "A · In the liver", steps: ["Step one", "Step two"], result: "less cholesterol" });
  });
  it("rejects malformed rows with a message naming the block", () => {
    expect(() => parseBlock("ingredients", "Rosuvastatin | 10 mg")).toThrow(GuideFormatError);
    expect(() => parseBlock("ingredients", "Rosuvastatin | 10 mg")).toThrow(/Ingredients/);
    expect(() => parseBlock("safety", "Alcohol | AVOID | maybe")).toThrow(/tone must be one of/);
    expect(() => parseBlock("howItWorks", "Title\nStep")).toThrow(/Result/);
  });
  it("makes the ease-it column optional for side effects", () => {
    expect(parseBlock("sideEffects", "Nausea | Feeling sick")).toEqual([{ name: "Nausea", description: "Feeling sick", easeIt: "" }]);
  });
});

describe("serializeBlock ∘ parseBlock round-trips every field", () => {
  const g = ausrastinGold10Guide;
  for (const { field } of GUIDE_FIELDS) {
    it(field, () => {
      expect(parseBlock(field, serializeBlock(field, g[field]))).toEqual(g[field]);
    });
  }
  it("empty guide round-trips", () => {
    const e = emptyGuide();
    for (const { field } of GUIDE_FIELDS) expect(parseBlock(field, serializeBlock(field, e[field]))).toEqual(e[field]);
  });
});
