import { describe, expect, it } from "vitest";
import { getProductDisplayName } from "./product-display-name";

describe("getProductDisplayName", () => {
  it("prefers the clean configured name over an ellipsis placeholder", () => {
    expect(getProductDisplayName({ nameTr: "DOMATES (...)", displayName: "Domates" })).toBe("Domates");
  });

  it("removes an ellipsis placeholder when no configured name exists", () => {
    expect(getProductDisplayName({ nameTr: "DOMATES (...)" })).toBe("Domates");
  });

  // Birim etiketini artik BACKEND takiyor (disambiguateProductUnitLabels) ve
  // yalnizca gercek cakismada: `roka` (demet) ile `roka-bag` (bağ) ayni gorunen
  // ada sahip oldugu icin ikisi de etiketlenir ve etiket buraya hazir gelir.
  // Frontend'in ETL adindaki "(BAĞ)"i kendi basina geri yazmasi gerekmiyor —
  // gerekmediginde de yaziyordu: "LİMON (KG) YENİ" elle girilen "Limon Yeni"yi
  // eziyordu (15 urun).
  it("backend'in taktigi birim etiketini korur", () => {
    expect(getProductDisplayName({ nameTr: "ROKA (BAĞ)", displayName: "Roka (Bağ)" })).toBe("Roka (Bağ)");
  });

  it("cakisma yoksa ETL'deki birim parantezini geri yazmaz", () => {
    expect(getProductDisplayName({ nameTr: "ROKA (BAĞ)", displayName: "Roka" })).toBe("Roka");
  });

  it("accepts a configured name that carries the qualifier without parentheses", () => {
    // Arama dili "salçalık domates"; niteleyici korunuyor, parantez sart degil.
    expect(getProductDisplayName({ nameTr: "DOMATES (SALÇALIK)", displayName: "Salçalık Domates" })).toBe("Salçalık Domates");
    expect(getProductDisplayName({ nameTr: "DOMATES (SALÇALIK)", displayName: "Domates" })).toBe("Domates (Salçalık)");
  });
});

describe("birim parantezi niteleyici sayilmaz", () => {
  it("elle yazilan adi birim parantezi ezmez", () => {
    expect(getProductDisplayName({ nameTr: "LİMON (KG) YENİ", displayName: "Limon Yeni" })).toBe("Limon Yeni");
    expect(getProductDisplayName({ nameTr: "ROKA (BAĞ)", displayName: "Roka" })).toBe("Roka");
    expect(getProductDisplayName({ nameTr: "Patates (kg)", displayName: "Patates" })).toBe("Patates");
  });

  it("gercek niteleyici hala display_name'i ezer", () => {
    expect(getProductDisplayName({ nameTr: "DOMATES (SALÇALIK)", displayName: "Domates" })).toBe("Domates (Salçalık)");
  });

  it("birim + gercek niteleyici birlikteyse niteleyici kazanir", () => {
    expect(getProductDisplayName({ nameTr: "MARUL (AYSBERG) (ADET)", displayName: "Marul" })).toBe("Marul (Aysberg) (Adet)");
  });

  it("display_name niteleyiciyi parantezsiz tasiyorsa korunur", () => {
    expect(getProductDisplayName({ nameTr: "DOMATES (SALÇALIK)", displayName: "Salçalık Domates" })).toBe("Salçalık Domates");
  });
});
