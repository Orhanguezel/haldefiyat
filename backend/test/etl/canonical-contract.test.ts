import { describe, expect, it } from "bun:test";
import { canonicalUnit, scoreProductMatch } from "../../src/modules/etl/canonical-contract";

describe("canonical product contract", () => {
  it("maps only explicit known units and never guesses kg", () => {
    expect(canonicalUnit("Kg.")).toBe("kg");
    expect(canonicalUnit("Sandık")).toBe("kasa");
    expect(canonicalUnit("Bağ")).toBe("bag");
    expect(canonicalUnit("Paket")).toBe("paket");
    expect(canonicalUnit("Lt.")).toBe("litre");
    expect(canonicalUnit("Ton")).toBe("ton");
    expect(canonicalUnit("sardalya")).toBeNull();
    expect(canonicalUnit(null)).toBeNull();
  });

  it("normalizes recorded spelling fixtures without merging real variants", () => {
    expect(scoreProductMatch({ rawName: "Avakado", rawUnit: "adet", canonicalName: "Avokado" }).score).toBe(95);
    expect(scoreProductMatch({ rawName: "Maydonoz", rawUnit: "demet", canonicalName: "Maydanoz", aliases: ["Maydonoz"] }).score).toBe(95);
    expect(scoreProductMatch({ rawName: "Incir", rawUnit: "kg", canonicalName: "İncir" }).score).toBe(95);
    expect(scoreProductMatch({ rawName: "Hındıstan Cevizi", rawUnit: "adet", canonicalName: "Hindistan Cevizi", aliases: ["Hındıstan Cevizi"] }).score).toBe(95);
    expect(scoreProductMatch({ rawName: "Domates Beef", rawUnit: "kg", canonicalName: "Domates" }).reviewRequired).toBeTrue();
  });

  it("requires review for unknown units and products", () => {
    expect(scoreProductMatch({ rawName: "Domates", rawUnit: "çuval", canonicalName: "Domates" }).reason).toBe("UNKNOWN_UNIT");
    expect(scoreProductMatch({ rawName: "Yeni Çeşit", rawUnit: "kg", canonicalName: "Domates" }).reason).toBe("UNKNOWN_PRODUCT");
  });
});
