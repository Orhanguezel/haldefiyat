import { describe, expect, it } from "bun:test";
import { productNameIssue } from "@/modules/hal-admin";

/**
 * 2026-09-02: canlida "DOMATES (...)", "SALATALIK (...)", "PORTAKAL (...)" ve
 * "Pazı)" bulundu — ucu de indeksli, en cok aranan urunler arasinda. Urun sayfasi
 * editoryal adi kullandigi icin temiz gorunuyordu; bozuk ad /prices/products
 * ucundan otomatik tamamlamaya, dropdown'lara ve ilan kayitlarina siziyordu.
 */
describe("urun adi kapisi", () => {
  it("parantezli mesru nitelendirmeyi kabul eder", () => {
    for (const ad of ["Domates (Salkım)", "MARUL (KIVIRCIK)", "Soğan Kuru", "LİMON", "Patates (Taze)"]) {
      expect(productNameIssue(ad)).toBeNull();
    }
  });

  it("elips parantezi reddeder", () => {
    expect(productNameIssue("DOMATES (...)")).not.toBeNull();
    expect(productNameIssue("PORTAKAL (…)".replace("…", "..."))).not.toBeNull();
  });

  it("ici bos parantezi reddeder", () => {
    expect(productNameIssue("SALATALIK ()")).not.toBeNull();
    expect(productNameIssue("BIBER (  )")).not.toBeNull();
  });

  it("dengesiz parantezi reddeder", () => {
    expect(productNameIssue("Pazı)")).not.toBeNull();
    expect(productNameIssue("PALAMUT-TORİK (DENİZ")).not.toBeNull();
    expect(productNameIssue("Patates (taze) kg)")).not.toBeNull();
  });
});
