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

describe("gorunen adlar zaten farkliysa etiket eklenmez", () => {
  it("paketleme varyanti ana urunun adini bozmaz", () => {
    const rows = disambiguateProductUnitLabels([
      { nameTr: "LİMON", displayName: "Limon", unit: "kg" },
      { nameTr: "Limon (Sandık)", displayName: "Limon Sandık", unit: "koli" },
    ]);

    // "Limon" ile "Limon Sandık" zaten ayirt edilebiliyor; ikisi de dokunulmadan kalir.
    expect(rows.map((row) => row.displayName)).toEqual(["Limon", "Limon Sandık"]);
  });

  it("gercek cakismada etiket yine takilir", () => {
    const rows = disambiguateProductUnitLabels([
      { nameTr: "NANE", displayName: "Nane", unit: "demet" },
      { nameTr: "NANE", displayName: "Nane", unit: "kg" },
    ]);

    expect(rows.map((row) => row.displayName)).toEqual(["Nane (Demet)", "Nane (Kg)"]);
  });
});
