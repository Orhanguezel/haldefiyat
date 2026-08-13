import { describe, expect, it } from "vitest";
import { disambiguateProductUnitLabels } from "../src/modules/prices/product-unit-labels";

describe("disambiguateProductUnitLabels", () => {
  it("labels only a name that exists in multiple real units", () => {
    const rows = disambiguateProductUnitLabels([
      { nameTr: "AVOKADO", displayName: "Avokado", unit: "kg" },
      { nameTr: "AVOKADO", displayName: "Avokado", unit: "adet" },
      { nameTr: "DOMATES", displayName: "Domates", unit: "kg" },
    ]);
    expect(rows.map((row) => row.displayName)).toEqual(["Avokado (Kg)", "Avokado (Adet)", "Domates"]);
  });

  it("uses package labels only when the source unit is actually package based", () => {
    const rows = disambiguateProductUnitLabels([
      { nameTr: "LİMON", displayName: "Limon", unit: "kg" },
      { nameTr: "LİMON", displayName: "Limon", unit: "kasa" },
    ]);
    expect(rows.map((row) => row.displayName)).toEqual(["Limon (Kg)", "Limon (Kasa)"]);
  });
});
