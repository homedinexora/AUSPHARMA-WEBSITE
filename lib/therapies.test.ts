import { describe, expect, it } from "vitest";
import { activeTherapies, therapies } from "./therapies";

describe("activeTherapies", () => {
  it("keeps only therapy areas that have at least one product, in menu order", () => {
    const items = [{ therapy: "gastro" }, { therapy: "cardiology" }, { therapy: "gastro" }];
    expect(activeTherapies(items).map((t) => t.slug)).toEqual(["cardiology", "gastro"]);
  });

  it("returns nothing when no products are published", () => {
    expect(activeTherapies([])).toEqual([]);
  });

  it("ignores products without a therapy or with an unknown one", () => {
    expect(activeTherapies([{ therapy: null }, { therapy: "dermatology" }])).toEqual([]);
  });

  it("can return every area", () => {
    expect(activeTherapies(therapies.map((t) => ({ therapy: t.slug })))).toEqual(therapies);
  });
});
