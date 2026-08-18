import { describe, expect, it } from "vitest";
import {
  buildMetaDescriptionFrom, buildMetaTitleFor, buildReportTitle, indexStatusOf,
  looksLikeCasefoldArtifact, trNum, trPct, trPctSigned, trPeriod, trPeriodShort, trPrice,
  type IndexPoint,
} from "../src/modules/analysis/report-format";

const week = (indexWeek: string, indexValue: number, basketAvg: number, weekStart: string, weekEnd: string): IndexPoint =>
  ({ indexWeek, indexValue, basketAvg, weekStart, weekEnd });

describe("tr-TR biçimlendirme", () => {
  it("ondalık ayracı olarak virgül kullanır", () => {
    expect(trNum(74.32, 2)).toBe("74,32");
    expect(trNum(74.32, 1)).toBe("74,3");
  });

  it("yüzdeyi işaretsiz ve işaretli biçimde verir", () => {
    expect(trPct(-20)).toBe("%20,0");
    expect(trPctSigned(-2.8)).toBe("−%2,8");
    expect(trPctSigned(7.6)).toBe("+%7,6");
  });

  it("fiyatı ₺ ile biçimler", () => {
    expect(trPrice(1234.5)).toBe("1.234,50 ₺");
  });

  it("ham ISO tarih yerine Türkçe dönem üretir", () => {
    expect(trPeriod("2026-08-10", "2026-08-16")).toBe("10 – 16 Ağustos 2026");
    expect(trPeriod("2026-07-27", "2026-08-02")).toBe("27 Temmuz – 2 Ağustos 2026");
    expect(trPeriodShort("2026-08-10", "2026-08-16")).toBe("10–16 Ağu");
  });

  it("geçersiz tarihte boş döner, Invalid Date sızdırmaz", () => {
    expect(trPeriod("", "")).toBe("");
    expect(trPeriod("bozuk", "2026-08-16")).toBe("");
    expect(trNum(Number.NaN)).toBe("—");
  });
});

describe("indexStatusOf", () => {
  const history = [
    week("2026-29", 85.22, 47.39, "2026-07-13", "2026-07-19"),
    week("2026-30", 82.34, 45.78, "2026-07-20", "2026-07-26"),
    week("2026-31", 76.65, 42.62, "2026-07-27", "2026-08-02"),
    week("2026-32", 74.48, 41.41, "2026-08-03", "2026-08-09"),
  ];

  it("yeni seri dibini tanır", () => {
    const status = indexStatusOf(history, "2026-32");
    expect(status?.isNewLow).toBe(true);
    expect(status?.label).toBe("Endeks 74,5 ile Yeni Dipte");
  });

  it("marjinal yeni dipte bile %1 altı değişimi yataylaşma olarak etiketler", () => {
    const flat = [...history, week("2026-33", 74.32, 41.33, "2026-08-10", "2026-08-16")];
    const status = indexStatusOf(flat, "2026-33");
    // Teknik olarak yeni dip (74,32 < 74,48) ama -%0,2'yi "yeni dip" diye sunmak abartı olur.
    expect(status?.isNewLow).toBe(true);
    expect(status?.label).toBe("Endeks 74,3 ile Yataylaştı");
    expect(status?.sentence).toContain("düşüş serisini durdurdu");
    expect(status?.changePct).toBeCloseTo(-0.21, 2);
  });

  it("yükselişi ayrı etiketler", () => {
    const up = [...history, week("2026-33", 80, 44, "2026-08-10", "2026-08-16")];
    expect(indexStatusOf(up, "2026-33")?.label).toBe("Endeks 80,0 ile Yükseldi");
  });

  it("bilinmeyen hafta için null döner", () => {
    expect(indexStatusOf(history, "2026-99")).toBeNull();
  });
});

describe("başlık ve meta", () => {
  const history = [
    week("2026-30", 82.34, 45.78, "2026-07-20", "2026-07-26"),
    week("2026-31", 76.65, 42.62, "2026-07-27", "2026-08-02"),
    week("2026-32", 74.48, 41.41, "2026-08-03", "2026-08-09"),
    week("2026-33", 74.32, 41.33, "2026-08-10", "2026-08-16"),
  ];
  const status = indexStatusOf(history, "2026-33");

  it("başlığı endeks-öncelikli kurar", () => {
    const title = buildReportTitle("Ağustos 3. Hafta", status, { productName: "Fasulye", changePct: -20 });
    expect(title).toBe("Ağustos 3. Hafta Hal Raporu: Endeks 74,3 ile Yataylaştı; Fasulye %20,0 Geriledi");
  });

  it("endeks yoksa yalnız hareket parçasını kullanır", () => {
    expect(buildReportTitle("Ağustos 3. Hafta", null, { productName: "Fasulye", changePct: -20 }))
      .toBe("Ağustos 3. Hafta Hal Raporu: Fasulye %20,0 Geriledi");
  });

  it("meta title 60 karakteri aşmaz ve asla kelime ortasında kesilmez", () => {
    const title = buildReportTitle("Ağustos 3. Hafta", status, { productName: "Fasulye", changePct: -20 });
    const meta = buildMetaTitleFor("Ağustos 3. Hafta", status, 2026, title);
    expect(meta.length).toBeLessThanOrEqual(60);
    expect(meta.endsWith("…")).toBe(false);
    expect(meta).toBe("Ağustos 3. Hafta Hal Raporu: Endeks 74,3 ile Yataylaştı");
  });

  it("çok uzun başlıkta bile kesik değil kompozisyon fallback'i verir", () => {
    const longMover = { productName: "Çok Uzun Bir Ürün Adı Olan Sebze Çeşidi", changePct: -12.3456 };
    const title = buildReportTitle("Ağustos 3. Hafta", status, longMover);
    const meta = buildMetaTitleFor("Ağustos 3. Hafta", status, 2026, title);
    expect(meta.length).toBeLessThanOrEqual(60);
    expect(meta.includes("…")).toBe(false);
  });

  it("meta açıklamayı cümle sınırında bitirir", () => {
    const summary = "Bir cümle. ".repeat(30);
    const desc = buildMetaDescriptionFrom(summary);
    expect(desc.length).toBeLessThanOrEqual(155);
    expect(desc.endsWith(".")).toBe(true);
  });
});

describe("looksLikeCasefoldArtifact", () => {
  it("bozuk İ-casefold adlarını yakalar", () => {
    expect(looksLikeCasefoldArtifact("Incır")).toBe(true);
    expect(looksLikeCasefoldArtifact("Istavrıt (Deniz)")).toBe(true);
    expect(looksLikeCasefoldArtifact("Ithal Uskumru")).toBe(true);
  });

  it("gerçekten dotless yazılan Türkçe adlara dokunmaz", () => {
    expect(looksLikeCasefoldArtifact("Ispanak")).toBe(false);
    expect(looksLikeCasefoldArtifact("Isırgan (Yaş-Taze)")).toBe(false);
    expect(looksLikeCasefoldArtifact("İncir")).toBe(false);
    expect(looksLikeCasefoldArtifact("Domates")).toBe(false);
    expect(looksLikeCasefoldArtifact("")).toBe(false);
  });
});
