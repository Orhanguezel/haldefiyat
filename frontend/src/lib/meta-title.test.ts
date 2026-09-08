import { describe, expect, it } from "vitest";
import { compactMetaTitle } from "./meta-text";
import { fitTitle, marketQualifier, pickTitle, TITLE_MAX } from "./meta-title";

describe("marketQualifier", () => {
  it("sehir adini ve kurumsal kelimeleri atip ayirt edici yeri birakir", () => {
    expect(marketQualifier("İstanbul Bayrampaşa Toptancı Hali (İBB)", "İstanbul")).toBe("Bayrampaşa");
    expect(marketQualifier("Antalya Serik Hali", "Antalya")).toBe("Serik");
    expect(marketQualifier("Kocaeli Merkez Sebze Meyve Hali", "Kocaeli")).toBe("Merkez");
  });

  it("hal adi yalniz sehir + kurumsal kelimelerden olusuyorsa bos doner", () => {
    expect(marketQualifier("Ankara Toptancı Hali", "Ankara")).toBe("");
    expect(marketQualifier("Adana Büyükşehir Belediyesi Toptancı Hali", "Adana")).toBe("");
  });

  it("sehirden farkli ilce adini korur", () => {
    expect(marketQualifier("Finike Toptancı Hali", "Antalya")).toBe("Finike");
  });

  it("parantez icini yalniz gercek bir ayrim adiysa kullanir", () => {
    expect(marketQualifier("Antalya Toptancı Hali (Merkez)", "Antalya")).toBe("Merkez");
    // "(İBB)" kisaltma, "(hal.gov.tr)" alan adi — ikisi de aramada karsiligi yok.
    expect(marketQualifier("İstanbul Toptancı Hali (İBB)", "İstanbul")).toBe("");
    expect(marketQualifier("Türkiye Toptancı Hali (hal.gov.tr)", "Türkiye")).toBe("");
  });
});

describe("fitTitle", () => {
  it("sigan kuyrugu ekler", () => {
    expect(fitTitle("İstanbul Hal Fiyatları Bugün 7 Eylül 2026", ["Bayrampaşa"]))
      .toBe("İstanbul Hal Fiyatları Bugün 7 Eylül 2026 — Bayrampaşa");
  });

  it("butceyi asan kuyrugu hic eklemez — kirpma yerine dusurme", () => {
    const head = "Kahramanmaraş Hal Fiyatları Bugün 27 Ağustos 2026";
    expect(fitTitle(head, ["Büyükşehir Belediyesi Toptancı Hali"])).toBe(head);
  });

  it("bos ve bosluklu kuyruklari atlar", () => {
    expect(fitTitle("Adana Limon Fiyatları", ["", "   "])).toBe("Adana Limon Fiyatları");
  });

  it("urettigi baslik compactMetaTitle tarafindan kirpilmaz", () => {
    const title = fitTitle("İstanbul Hal Fiyatları Bugün 7 Eylül 2026", ["Bayrampaşa"]);
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(compactMetaTitle(title)).toBe(title);
    expect(title).not.toContain("…");
  });
});

describe("pickTitle", () => {
  it("tercih sirasindaki ilk sigan adayi secer", () => {
    expect(pickTitle(["a".repeat(70), "kisa aday", "daha kisa"])).toBe("kisa aday");
  });

  it("kimligi korumak icin tarihi feda eder", () => {
    const head = "Ankara Hal Fiyatları";
    const tail = " — Polatlı Ticaret Borsası";
    const chosen = pickTitle([
      `${head} Bugün 27 Ağustos 2026${tail}`,
      `${head} 27 Ağustos 2026${tail}`,
      `${head}${tail}`,
      `${head} Bugün 27 Ağustos 2026`,
      head,
    ]);
    expect(chosen).toBe(`${head}${tail}`);
    expect(chosen.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("hicbiri sigmazsa en kisasini verir", () => {
    expect(pickTitle(["b".repeat(80), "c".repeat(65)])).toBe("c".repeat(65));
  });
});

/**
 * Baslik kurma kurali hal sayfasinda yasiyor; bu test o kuralin degismez
 * ozelligini korur: kaynagi kapali bir hal aylarca indexli kalabiliyor
 * (Mersin 78 gundur 22 Haziran verisiyle yayinda), bayat bir sayfa hicbir
 * kosulda "Bugun" demez.
 */
function halTitle(city: string, qualifier: string, dateLabel: string, fresh: boolean) {
  const head = `${city} Hal Fiyatları`;
  const when = fresh ? `Bugün ${dateLabel}` : `— Son Liste ${dateLabel}`;
  const tail = qualifier ? ` — ${qualifier}` : "";
  return pickTitle([
    `${head} ${when}${tail}`,
    `${head} ${dateLabel}${tail}`,
    `${head}${tail}`,
    `${head} ${when}`,
    head,
  ]);
}

describe("hal basligi tazelik kurali", () => {
  it("bayat bulten hicbir kuyruk kombinasyonunda 'Bugün' demez", () => {
    const qualifiers = ["", "Bayrampaşa", "Polatlı Ticaret Borsası", "UZUNKOPRU TICARET BORSASI"];
    for (const q of qualifiers) {
      for (const city of ["Mersin", "İstanbul", "Kahramanmaraş", "Ankara"]) {
        const title = halTitle(city, q, "22 Haziran 2026", false);
        expect(title).not.toContain("Bugün");
        expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
      }
    }
  });

  it("taze bultende 'Bugün' ve tarih birlikte kalir", () => {
    const title = halTitle("İstanbul", "Bayrampaşa", "7 Eylül 2026", true);
    expect(title).toBe("İstanbul Hal Fiyatları Bugün 7 Eylül 2026 — Bayrampaşa");
  });

  it("bayat + kisa kuyrukta 'Son Liste' isareti korunur", () => {
    expect(halTitle("Mersin", "", "22 Haziran 2026", false))
      .toBe("Mersin Hal Fiyatları — Son Liste 22 Haziran 2026");
  });
});
