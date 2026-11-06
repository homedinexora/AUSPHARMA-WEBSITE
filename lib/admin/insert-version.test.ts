import { describe, expect, it } from "vitest";
import { insertVersionName } from "./insert-version";

describe("insertVersionName", () => {
  it("uses the name staff typed, trimmed", () => {
    expect(insertVersionName({ typed: "  Rev. 01/2027 ", revisionDate: "09-10-2026", existing: [] })).toBe("Rev. 01/2027");
  });
  it("uses the insert's date of revision when nothing is typed", () => {
    expect(insertVersionName({ typed: null, revisionDate: "09-10-2026", existing: ["v1"] })).toBe("Rev. 09-10-2026");
  });
  it("otherwise numbers versions v1, v2 … skipping names already used", () => {
    expect(insertVersionName({ typed: null, revisionDate: null, existing: [] })).toBe("v1");
    expect(insertVersionName({ typed: null, revisionDate: null, existing: ["v1", "Rev. 09-10-2026", "v2"] })).toBe("v3");
  });
});
