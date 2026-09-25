import { describe, expect, it } from "vitest";
import { findPiyasaForArticle, findPiyasaForCityProduct, PIYASA_PAGES, productIntentLinks } from "./piyasa";

describe("findPiyasaForArticle", () => {
  it("Mersin ve Erdemli limon analizini ana guncel Mersin sayfasiyla eslestirir", () => {
    const hit = findPiyasaForArticle("limon-fiyatlari-2026-mersin-erdemli-piyasa-analizi");
    expect(hit?.slug).toBe("mersin-limon");
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

describe("productIntentLinks", () => {
  it("genel limon sayfasindan bolgesel sorgu sahiplerine baglanir", () => {
    expect(productIntentLinks("limon")).toEqual([
      expect.objectContaining({ href: "/fiyat/adana/limon", title: "Adana Limon Fiyatları" }),
      expect.objectContaining({ href: "/piyasa/mersin-limon", title: "Mersin Limon Fiyatları" }),
      expect.objectContaining({ href: "/piyasa/erdemli-limon", title: "Erdemli Limon Fiyatları" }),
    ]);
  });

  it("Mayer urun sayfasini Adana Mayer bolgesel sayfasina baglar", () => {
    expect(productIntentLinks("limon-mayer")[0]?.href).toBe("/piyasa/adana-mayer-limon");
  });
});

describe("findPiyasaForCityProduct", () => {
  it("Adana limon sayfasini Erdemli yerine Adana rehberiyle eslestirir", () => {
    expect(findPiyasaForCityProduct("adana", "limon")?.slug).toBe("adana-limon");
  });

  it("sehir eslesmiyorsa baska bolgenin sayfasini vermez", () => {
    expect(findPiyasaForCityProduct("izmir", "limon")).toBeNull();
  });
});
