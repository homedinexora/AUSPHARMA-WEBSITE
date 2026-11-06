import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseInsert } from "./insert-parser";
import { extractPdfText, piecesToLines } from "./pdf-text";

const root = join(__dirname, "..");
const pdf = (name: string) => new Uint8Array(readFileSync(join(root, "docs/samples/inserts", `${name}_insert.pdf`)));
const fixture = (name: string) => readFileSync(join(__dirname, "__fixtures__", `${name}.txt`), "utf8");

describe("piecesToLines", () => {
  it("orders pieces top to bottom, then left to right, regardless of drawing order", () => {
    const lines = piecesToLines([
      { str: "second", x: 0, y: 80, width: 30, size: 10 },
      { str: "line", x: 35, y: 100, width: 20, size: 10 },
      { str: "First", x: 0, y: 100, width: 25, size: 10 },
    ]);
    expect(lines).toEqual(["First line", "second"]);
  });
});

// The admin parses uploads with PDF.js; the import scripts use pdftotext. Both must give the same structure.
describe.each([
  ["ACEELO", "ACEELO"],
  ["ACEELO-PS", "ACEELO-PS"],
  ["AQURIS-AMOXICLA", "AQURIS-AMOXICLA"],
])("extractPdfText + parseInsert (%s)", (file, fx) => {
  it("matches the pdftotext parse: kind, title, revision date and every section", async () => {
    const viaPdfJs = parseInsert(await extractPdfText(pdf(file)));
    const viaPdftotext = parseInsert(fixture(fx));
    expect(viaPdfJs.kind).toBe(viaPdftotext.kind);
    expect(viaPdfJs.title).toBe(viaPdftotext.title);
    expect(viaPdfJs.revisionDate).toBe(viaPdftotext.revisionDate);
    expect(viaPdfJs.sections.map((s) => [s.key, s.title, !!s.patientFacing])).toEqual(
      viaPdftotext.sections.map((s) => [s.key, s.title, !!s.patientFacing]),
    );
  });
});

describe("extractPdfText details", () => {
  it("keeps composition doses and restores ligatures (AMOXICLA)", async () => {
    const r = parseInsert(await extractPdfText(pdf("AQURIS-AMOXICLA")));
    expect(r.sections.find((s) => s.key === "composition")?.body).toContain("Eq. to Clavulanic Acid: 125 mg");
    expect(r.sections.find((s) => s.title === "Effects on the ability to drive and use machines")?.body).toContain(
      "influence",
    );
    expect(r.sections.find((s) => s.title === "Undesirable effects")?.body).toContain(
      "- Anaphylactic reactions (see Warnings and Precautions)",
    );
  });
  it("keeps hyphenated words whole (ACEELO)", async () => {
    const r = parseInsert(await extractPdfText(pdf("ACEELO")));
    expect(r.sections.find((s) => s.key === "4.9")?.body).toContain("life-threatening");
  });
});
