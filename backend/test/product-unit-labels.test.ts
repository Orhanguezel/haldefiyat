import { describe, expect, it } from "vitest";
import { disambiguateProductUnitLabels } from "../src/modules/prices/product-unit-labels";
import { unitClass } from "../src/modules/etl/normalizer";

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

// Etiket modulu kendi birim eslemesini tutuyor (gerekcesi normalizedUnit'in
// basinda yazili). Bu test iki katmanin AYNI kararlari verdigini sabitler; ETL
// tarafinda bir sinif degisirse burasi da guncellensin diye kirmizi yanar.
describe("ETL unitClass hizasi", () => {
  it("bag ile demet ayni birimdir — iki katman da boyle sayar", () => {
    expect(unitClass("bağ")).toBe(unitClass("demet"));

    const rows = disambiguateProductUnitLabels([
      { nameTr: "ROKA", displayName: "Roka", unit: "demet" },
      { nameTr: "ROKA (BAĞ)", displayName: "Roka", unit: "bag" },
    ]);
    // Ayni birim → ortada belirsizlik yok, etiket takilmaz.
    expect(rows.map((row) => row.displayName)).toEqual(["Roka", "Roka"]);
  });

  it("kg/adet siniflari da ortusur", () => {
    for (const [a, b] of [["kg", "kilogram"], ["adet", "tane"]] as const) {
      expect(unitClass(a)).toBe(unitClass(b));
    }
    const rows = disambiguateProductUnitLabels([
      { nameTr: "AVOKADO", displayName: "Avokado", unit: "kilogram" },
      { nameTr: "AVOKADO", displayName: "Avokado", unit: "tane" },
    ]);
    expect(rows.map((row) => row.displayName)).toEqual(["Avokado (Kg)", "Avokado (Adet)"]);
  });
});
