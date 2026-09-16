import { describe, expect, it } from "vitest";
import { compactMetaDescription, compactMetaText, compactMetaTitle, fitMetaDescription } from "./meta-text";

describe("meta text compaction", () => {
  it("keeps already bounded metadata unchanged", () => {
    expect(compactMetaTitle("HaldeFiyat Endeksi")).toBe("HaldeFiyat Endeksi");
  });

  it("prefers a complete sentence when it is not too short", () => {
    const value = `${"Güncel hal fiyatları ve şehir karşılaştırması. ".repeat(3)}Ek açıklama.`;
    const result = compactMetaDescription(value);

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith(".")).toBe(true);
  });

  it("clips at a word boundary and adds an ellipsis", () => {
    const result = compactMetaText("uzun ".repeat(30), 40);

    expect(result.length).toBeLessThanOrEqual(40);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("compactMetaTitle", () => {
  it("kuyrugu butunuyle dusurur, kelimeyi ortasindan kesmez", () => {
    const result = compactMetaTitle("Domates Fiyatları Bugün Kaç TL? 16 Eylül 2026 — Hal ve Toptan");

    expect(result).toBe("Domates Fiyatları Bugün Kaç TL? 16 Eylül 2026");
    expect(result).not.toContain("…");
  });

  it("birden fazla kuyruk varsa gerektigi kadarini dusurur", () => {
    const result = compactMetaTitle("Elma Starking Fiyatları Bugün Kaç TL? 16 Eylül 2026 — Hal ve Toptan — HaldeFiyat");

    expect(result).toBe("Elma Starking Fiyatları Bugün Kaç TL? 16 Eylül 2026");
  });

  it("sigan basligi oldugu gibi birakir", () => {
    const fitting = "Soğan Fiyatları Bugün Kaç TL? 16 Eylül 2026 — Hal ve Toptan";
    expect(compactMetaTitle(fitting)).toBe(fitting);
  });

  it("bas kismi tek basina sigmiyorsa eski kirpmaya doner", () => {
    const result = compactMetaTitle(`${"Çok Uzun Ürün Adı ".repeat(6)}— Hal ve Toptan`);

    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("fitMetaDescription", () => {
  it("sigmayan cumleyi hic eklemez, ortasindan kesmez", () => {
    const result = fitMetaDescription(
      "İstanbul salatalık hal fiyatı. 16 Eylül 2026: ortalama 18,50 TL/kg.",
      ["İstanbul Bayrampaşa Toptancı Hali (İBB) günlük kaydı.", "90 günlük fiyat seyri, çeşit ve kaynak bilgisi."],
    );

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result).not.toContain("…");
    expect(result).toContain("Bayrampaşa");
    expect(result).not.toContain("90 günlük");
  });

  it("hepsi siğiyorsa hepsini ekler", () => {
    const result = fitMetaDescription("Adana limon hal fiyatı.", ["Adana Hali günlük kaydı.", "90 günlük fiyat seyri."]);

    expect(result).toBe("Adana limon hal fiyatı. Adana Hali günlük kaydı. 90 günlük fiyat seyri.");
  });

  it("opsiyonel yoksa bas kismi aynen birakir", () => {
    expect(fitMetaDescription("Sadece baş.")).toBe("Sadece baş.");
  });
});

describe("compactMetaTitle — noktalama siniri", () => {
  it("elle yazilmis uzun basligi soru isaretinde bitirir", () => {
    const result = compactMetaTitle("HaldeFiyat Endeksi Nasıl Hesaplanır? Sepet, Baz Hafta ve Okuma Kılavuzu");

    expect(result).toBe("HaldeFiyat Endeksi Nasıl Hesaplanır?");
    expect(result).not.toContain("…");
  });

  it("virgulde keser ve virgulu birakmaz", () => {
    const result = compactMetaTitle("Nisan Son Hafta: Sezonluk Sebzeler Piyasaya Girdi, Fiyatlarda İkiye Bölünme");

    expect(result).toBe("Nisan Son Hafta: Sezonluk Sebzeler Piyasaya Girdi");
  });

  it("butcenin yarisindan kisa sinira razi olmaz", () => {
    const result = compactMetaTitle("Kısa: bu başlığın ilk noktalaması çok erken geliyor ve geri kalanı uzun sürüyor");

    expect(result.length).toBeLessThanOrEqual(60);
    expect(result.startsWith("Kısa")).toBe(true);
    expect(result.length).toBeGreaterThan(20);
  });
});
