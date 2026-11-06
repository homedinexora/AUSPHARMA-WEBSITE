import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanExtractedText, parseInsert } from "./insert-parser";

const fixture = (name: string) => readFileSync(join(__dirname, "__fixtures__", `${name}.txt`), "utf8");

describe("cleanExtractedText", () => {
  it("restores fi/fl ligatures that CorelDRAW PDFs emit as private-use characters", () => {
    expect(cleanExtractedText("insufciency, blood ow, ﬁrst")).toBe(
      "insufficiency, blood flow, first",
    );
  });
});

describe("parseInsert: line joining", () => {
  const body = (lines: string) =>
    parseInsert(`For the use of a Registered Medical Practitioner\nTitle\nWARNINGS\n${lines}`).sections[0].body;

  it("joins a word hyphenated across lines without adding a space", () => {
    expect(body("use with ACE-\ninhibitors and a life-\nthreatening overdose")).toBe(
      "use with ACE-inhibitors and a life-threatening overdose",
    );
  });
  it("treats a Wingdings bullet at the start of a line as a list item", () => {
    expect(body("The following are discussed in more detail in other sections of the labeling:\nŸ Anaphylactic reactions\nŸ Hepatic dysfunction")).toBe(
      "The following are discussed in more detail in other sections of the labeling:\n\n- Anaphylactic reactions\n- Hepatic dysfunction",
    );
  });
});

describe("parseInsert: numbered CDSCO format (ACEELO)", () => {
  const r = parseInsert(fixture("ACEELO"));

  it("detects prescribing information from the RMP-only header", () => {
    expect(r.kind).toBe("prescribing_information");
  });
  it("captures the generic title", () => {
    expect(r.title).toBe("Aceclofenac, Paracetamol & Chlorzoxazone Tablets");
  });
  it("splits numbered sections and subsections with readable titles", () => {
    const s = r.sections.find((x) => x.key === "4.1");
    expect(s?.title).toBe("Therapeutic indications");
    expect(s?.body).toContain("Acute Musculoskeletal spasm");
    expect(r.sections.find((x) => x.key === "4.3")?.title).toBe("Contraindications");
    expect(r.sections.find((x) => x.key === "2")?.title).toBe("Qualitative and quantitative composition");
  });
  it("drops empty parent headings such as 4. CLINICAL PARTICULARS", () => {
    expect(r.sections.find((x) => x.key === "4")).toBeUndefined();
    expect(r.sections.every((x) => x.body.trim().length > 0)).toBe(true);
  });
  it("marks patient counselling information as patient-facing", () => {
    const pc = r.sections.find((x) => x.key === "9");
    expect(pc?.patientFacing).toBe(true);
    expect(pc?.body).toContain("Keep this leaflet");
    expect(r.sections.filter((x) => x.patientFacing)).toHaveLength(1);
  });
  it("reads the date of revision", () => {
    expect(r.revisionDate).toBe("09-10-2026");
  });
  it("tidies dotted composition leaders", () => {
    expect(r.sections.find((x) => x.key === "2")?.body).toContain("Aceclofenac IP: 100 mg");
  });
  it("leaves no private-use characters", () => {
    expect(r.sections.some((x) => /[-]/.test(x.body))).toBe(false);
  });
});

describe("parseInsert: heading format (ACEELO-PS)", () => {
  const r = parseInsert(fixture("ACEELO-PS"));

  it("detects prescribing information", () => {
    expect(r.kind).toBe("prescribing_information");
    expect(r.title).toBe("Aceclofenac, Paracetamol & Serratiopeptidase Tablets");
  });
  it("splits ALL-CAPS and colon headings into sections", () => {
    const titles = r.sections.map((x) => x.title);
    expect(titles).toContain("Composition");
    expect(titles).toContain("Pharmaceutical form");
    expect(titles).toContain("Special warnings and precautions for use");
    expect(titles).toContain("Storage conditions");
    expect(r.sections.find((x) => x.title === "Composition")?.body).toContain("Serratiopeptidase IP: 15 mg");
  });
  it("has unique section keys and no empty sections", () => {
    const keys = r.sections.map((x) => x.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(r.sections.every((x) => x.body.trim().length > 0)).toBe(true);
  });
  it("has no patient-facing section when the insert has none", () => {
    expect(r.sections.filter((x) => x.patientFacing)).toHaveLength(0);
  });
});

describe("parseInsert: heading format with spaced colons and glyph bullets (AQURIS AMOXICLA)", () => {
  const r = parseInsert(fixture("AQURIS-AMOXICLA"));
  const section = (title: string) => r.sections.find((x) => x.title === title);

  it("detects prescribing information and the generic title", () => {
    expect(r.kind).toBe("prescribing_information");
    expect(r.title).toBe("Amoxycillin and Potassium Clavulanate Tablets IP 625 mg");
  });
  it('reads an ALL-CAPS heading written "COMPOSITION :"', () => {
    expect(r.sections[0].title).toBe("Composition");
    expect(section("Composition")?.body).toContain("Eq. to Amoxycillin: 500 mg");
    expect(section("Composition")?.body).toContain("Eq. to Clavulanic Acid: 125 mg");
    expect(section("Composition")?.body).not.toContain("500 mg Potassium");
  });
  it("keeps a colon sub-heading such as Renal impairment inside its section", () => {
    expect(section("Renal impairment")).toBeUndefined();
    const dosage = section("Dosage and administration");
    expect(dosage?.body).toContain("**Renal impairment**");
    expect(dosage?.body).toContain("glomerular filtration rate");
  });
  it("turns a bullet glyph on its own line into a list item", () => {
    const ue = section("Undesirable effects")?.body ?? "";
    expect(ue).toContain("- Anaphylactic reactions (see Warnings and Precautions)");
    expect(ue).not.toMatch(/Ÿ/);
  });
  it("restores ligatures and has unique keys", () => {
    expect(section("Effects on the ability to drive and use machines")?.body).toContain("influence");
    const keys = r.sections.map((x) => x.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
