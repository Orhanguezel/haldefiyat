import { describe, expect, it } from "vitest";
import { findPiyasaForArticle, PIYASA_PAGES } from "./piyasa";

describe("findPiyasaForArticle", () => {
  it("limon analizini erdemli piyasa sayfasiyla eslestirir", () => {
    const hit = findPiyasaForArticle("limon-fiyatlari-2026-mersin-erdemli-piyasa-analizi");
    expect(hit?.slug).toBe("erdemli-limon");
  });

  it("etiketlerden de eslestirir", () => {
    const hit = findPiyasaForArticle("yaz-meyve-raporu", ["limon", "erdemli", "mersin"]);
    expect(hit?.slug).toBe("erdemli-limon");
  });

  it("urun eslesip bolge eslesmezse null — yanlis sayfaya yonlendirme", () => {
    // Antalya icin bolge sayfasi yok → null. Adana icin artik var → o sayfaya gider.
    expect(findPiyasaForArticle("limon-fiyatlari-antalya-analizi")).toBeNull();
    expect(findPiyasaForArticle("limon-fiyatlari-adana-analizi")?.slug).toBe("adana-limon");
    expect(findPiyasaForArticle("adana-mayer-limon-sezon-acilisi")?.slug).toBe("adana-mayer-limon");
  });

  it("alakasiz makale icin null", () => {
    expect(findPiyasaForArticle("agustos-4-hafta-2026-hal-raporu")).toBeNull();
    expect(findPiyasaForArticle("nar-fiyatlari-2026-sezon-acilisi-analizi")).toBeNull();
  });

  it("her yapilandirilmis sayfa kendi slug'iyla bulunabilir", () => {
    for (const page of Object.values(PIYASA_PAGES)) {
      expect(findPiyasaForArticle(page.slug)?.slug).toBe(page.slug);
    }
  });

  it("bos girdi cokmez", () => {
    expect(findPiyasaForArticle("")).toBeNull();
    expect(findPiyasaForArticle("", [])).toBeNull();
  });
});
