import { describe, expect, it } from "bun:test";
import { canonicalProductCategory } from "../../src/modules/etl/category-dictionary";

describe("canonical product category dictionary", () => {
  it("normalizes source category aliases", () => {
    expect(canonicalProductCategory({ rawCategory: "Su Ürünleri" })).toBe("balik");
    expect(canonicalProductCategory({ rawCategory: "Karkas Et" })).toBe("et");
    expect(canonicalProductCategory({ rawCategory: "Sebze ve Meyve" })).toBe("sebze-meyve");
  });

  it("uses explicit product evidence to prevent category mixing", () => {
    expect(canonicalProductCategory({ rawCategory: "Sebze", rawName: "Levrek" })).toBe("balik");
    expect(canonicalProductCategory({ rawCategory: "Balık", rawName: "Dana Karkas" })).toBe("et");
    expect(canonicalProductCategory({ rawCategory: null, rawName: "Canlı Kuzu", fallback: "diger" })).toBe("canli-hayvan");
  });
});

describe("balik adlari kategori sozlugu", () => {
  it("fener ve bakalyaro balik sayilir (sebze-meyveye dusmesin)", () => {
    expect(canonicalProductCategory({ rawName: "Fener", rawCategory: "SEBZE MEYVE" })).toBe("balik");
    expect(canonicalProductCategory({ rawName: "Bakalyaro (Berlam)", rawCategory: "" })).toBe("balik");
    expect(canonicalProductCategory({ rawName: "Lahoz", rawCategory: "" })).toBe("balik");
  });

  it("sebzeler etkilenmez", () => {
    expect(canonicalProductCategory({ rawName: "Domates", rawCategory: "SEBZE" })).toBe("sebze");
    expect(canonicalProductCategory({ rawName: "Havuç", rawCategory: "SEBZE" })).toBe("sebze");
  });
});
