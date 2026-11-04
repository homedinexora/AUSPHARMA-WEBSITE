import { describe, expect, it } from "vitest";
import { sideEffectMailto, telHref } from "./contact";

describe("telHref", () => {
  it("strips spaces and dashes", () => {
    expect(telHref("1800 890 5877")).toBe("tel:18008905877");
    expect(telHref("1800-180-3024")).toBe("tel:18001803024");
  });
});

describe("sideEffectMailto", () => {
  it("prefills subject and the key questions, with spaces encoded as %20", () => {
    const m = sideEffectMailto()!;
    expect(m.startsWith("mailto:support@auspharma.in?")).toBe(true);
    const params = new URLSearchParams(m.split("?")[1]);
    expect(params.get("subject")).toBe("Side effect report");
    expect(params.get("body")).toContain("Batch no.");
    expect(m).not.toContain("+");
  });
});
