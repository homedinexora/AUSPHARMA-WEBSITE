import { describe, expect, it } from "vitest";
import { hasRole, parseStaff } from "./roles";

describe("parseStaff", () => {
  it("parses email:role pairs case-insensitively and ignores junk", () => {
    const m = parseStaff(" QA@AusPharma.in:qa, a@auspharma.in:ADMIN ,bad, c@x.in:owner, e@x.in:editor");
    expect(m.get("qa@auspharma.in")).toBe("qa");
    expect(m.get("a@auspharma.in")).toBe("admin");
    expect(m.get("e@x.in")).toBe("editor");
    expect(m.has("c@x.in")).toBe(false);
    expect(m.size).toBe(3);
  });
  it("is empty (deny all) when unset", () => {
    expect(parseStaff(undefined).size).toBe(0);
  });
});

describe("hasRole", () => {
  it("ranks editor < qa < admin", () => {
    expect(hasRole("editor", "qa")).toBe(false);
    expect(hasRole("qa", "qa")).toBe(true);
    expect(hasRole("admin", "qa")).toBe(true);
    expect(hasRole(null, "editor")).toBe(false);
  });
});
