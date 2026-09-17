import { describe, expect, it } from "vitest";
import { isResidualProduct } from "../src/modules/prices/residual-products";

describe("torba (artik) urun tespiti", () => {
  it("kanonik bagli muhtelif/diger kayitlarini yakalar", () => {
    for (const slug of ["elma-muhtelif", "dut-diger", "nar-muhtelif", "bakla-taze-diger"]) {
      expect(isResidualProduct({ slug, canonicalSlug: "elma" })).toBe(true);
    }
  });

  it("slug ortasinda gecen 'diger'i de yakalar", () => {
    // DOMATES DİĞER (İYİ TARIM) — desen slug sonuna bagli olsaydi kacardi.
    expect(isResidualProduct({ slug: "domates-diger-iyi-tarim", canonicalSlug: "domates" })).toBe(true);
    expect(isResidualProduct({ slug: "kavun-diger-iyi-tarim", canonicalSlug: "kavun" })).toBe(true);
  });

  it("KANONIK BAGSIZ kayit torba sayilmaz — kendi urunudur", () => {
    // "MERCAN KÖŞK DİĞER" bir ailenin artigi degil, kendi basina bir urun.
    expect(isResidualProduct({ slug: "mercan-kosk", canonicalSlug: null })).toBe(false);
    // Slug'i desene uysa bile bagsizsa haric tutulmaz: kendi sayfasi kendi verisi.
    expect(isResidualProduct({ slug: "elma-muhtelif", canonicalSlug: null })).toBe(false);
  });

  it("normal cesit kayitlarina dokunmaz", () => {
    for (const slug of ["elma-starking", "domates-salkim", "limon-mayer", "nar-hicaz"]) {
      expect(isResidualProduct({ slug, canonicalSlug: "elma" })).toBe(false);
    }
  });

  it("icinde tesadufen gecen harf dizisini kelime sanmaz", () => {
    expect(isResidualProduct({ slug: "digerbir-urun-adi", canonicalSlug: "x" })).toBe(false);
    expect(isResidualProduct({ slug: "muhtelifname", canonicalSlug: "x" })).toBe(false);
  });
});
