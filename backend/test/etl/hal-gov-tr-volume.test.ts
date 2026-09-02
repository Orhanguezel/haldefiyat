import { describe, expect, it } from "bun:test";
import { mergeHalGovTrByVolume } from "@/modules/etl/fetcher";

/**
 * hal.gov.tr urunu cesit bazinda hacimle verir. Hacim agirliklandirmasi cok
 * satirli gunleri duzeltiyordu ama TEK satirlik gunler kontrolu atliyordu: o gun
 * urunun yalnizca 4 kg'lik ozel satisi varsa o fiyat "Turkiye ulusal ortalamasi"
 * olarak yayinlaniyordu (BIBER SIVRI CIN 18 Agustos 2026: 404 TL, normali 57-95).
 */
const row = (name: string, avg: number, weight?: number) =>
  ({ name, category: "sebze", unit: "kg", avg, min: null, max: null, weight }) as never;

describe("hal.gov.tr hacim birlestirmesi", () => {
  it("tek satirlik butik satis ulusal ortalama olarak yayinlanmaz", () => {
    expect(mergeHalGovTrByVolume([row("ADAÇAYI", 3945.34, 4)])).toHaveLength(0);
  });

  it("tek satirlik gercek toptan islem yayinlanir", () => {
    const out = mergeHalGovTrByVolume([row("ARMUT", 37.56, 224_897)]);
    expect(out).toHaveLength(1);
    expect(out[0]!.avg).toBe(37.56);
  });

  it("cok satirli gunde hacim agirlikli ortalama alinir", () => {
    const out = mergeHalGovTrByVolume([
      row("ARMUT", 37.56, 224_897),
      row("ARMUT", 88.00, 18_770),
      row("ARMUT", 80.00, 45),
    ]);
    expect(out).toHaveLength(1);
    // Butik 45 kg'lik satis sonucu neredeyse hic kaydirmaz.
    expect(out[0]!.avg).toBeGreaterThan(37);
    expect(out[0]!.avg).toBeLessThan(42);
  });

  it("toplam hacim esigin altindaysa cok satirli gun de atlanir", () => {
    expect(mergeHalGovTrByVolume([
      row("ADAÇAYI", 58.44, 8),
      row("ADAÇAYI", 3945.34, 4),
    ])).toHaveLength(0);
  });

  it("hacim bildirilmemisse satir eskisi gibi gecer", () => {
    const out = mergeHalGovTrByVolume([row("KEKİK", 60), row("KEKİK", 80)]);
    expect(out).toHaveLength(1);
    expect(out[0]!.avg).toBe(70);
  });
});
