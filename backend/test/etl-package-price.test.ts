import { describe, expect, test } from "bun:test";
import { parseKayseriHtml } from "@/modules/etl/fetcher";

/**
 * 2026-09-02 regresyonu: parsePriceTry'in "ayirici icermeyen 4-5 hane = kurus"
 * sezgiseli gercek paket fiyatlarini 100'e boluyordu. Kayseri'nin
 * "Muz Ithal (18kg) | Koli | 2300 | 2200" satiri 22,50 TL olarak kaydediliyor,
 * urun birimi kg oldugu icin de her gun PRODUCT_UNIT_MISMATCH karantinasina
 * dusuyordu. Dogru sonuc: paket agirligi ada yazildigi icin TL/kg'a cevrilir.
 */
function table(rows: string[][]): string {
  const body = rows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
  return `<html><body><table>${body}</table></body></html>`;
}

const HEADER = ["CİNSİ", "BİRİMİ", "EN YÜKSEK FİYAT", "EN DÜŞÜK FİYAT"];

describe("paket birimli fiyat ayristirma", () => {
  test("koli satirinin dort haneli fiyati kurus sanilmaz, kg'a cevrilir", () => {
    const rows = parseKayseriHtml(table([HEADER, ["Muz İthal (18kg)", "Koli", "2300 ₺", "2200 ₺"]]));
    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.unit).toBe("kg");
    // 2300/18 = 127,78 · 2200/18 = 122,22 — 22,50 degil
    expect(row.max).toBeCloseTo(127.78, 1);
    expect(row.min).toBeCloseTo(122.22, 1);
    expect(row.avg!).toBeGreaterThan(100);
  });

  test("agirligi bilinmeyen koli satirinda fiyat bolunmez, birim koli kalir", () => {
    const rows = parseKayseriHtml(table([HEADER, ["Muz İthal", "Koli", "2000 ₺", "1800 ₺"]]));
    expect(rows[0]!.unit).toBe("koli");
    expect(rows[0]!.max).toBe(2000);
    expect(rows[0]!.min).toBe(1800);
  });

  test("kg satirinda kurus sezgiseli korunur", () => {
    const rows = parseKayseriHtml(table([HEADER, ["Armut", "Kg", "8000", "7000"]]));
    expect(rows[0]!.unit).toBe("kg");
    expect(rows[0]!.max).toBe(80);
    expect(rows[0]!.min).toBe(70);
  });

  test("normal kg fiyatlari degismez", () => {
    const rows = parseKayseriHtml(table([HEADER, ["Armut", "Kg", "100 ₺", "70 ₺"]]));
    expect(rows[0]!.max).toBe(100);
    expect(rows[0]!.min).toBe(70);
    expect(rows[0]!.avg).toBe(85);
  });
});

/**
 * Ad ipucu ("... Kasa ...", "... (Koli)") tek basina paket demek degildir:
 * ambalaj TURUNU anlatan urun adlari kg fiyatiyla yayinlaniyor. Fiyat kg
 * tavaninin altindaysa satir kg kalir — aksi halde her gun karantinaya duserdi.
 */
import { normalizePriceRow } from "@/modules/etl/fetcher";

const SOURCE = { key: "kayseri_resmi", defaultUnit: "kg" } as never;

describe("paket tespitinde ad ipucu", () => {
  test("ambalaj adi tasiyan kg fiyatli satir kg kalir", () => {
    const row = normalizePriceRow(
      { name: "Domates Kasa Salkım", category: null, unit: "kg", avg: 40, min: 30, max: 50 } as never,
      SOURCE,
    );
    expect(row.unit).toBe("kg");
    expect(row.avg).toBe(40);
  });

  test("kg tavanini asan ad-ipuclu satir paket sayilir", () => {
    const row = normalizePriceRow(
      { name: "Muz İthal (Koli)", category: null, unit: "kg", avg: 1900, min: 1800, max: 2000 } as never,
      SOURCE,
    );
    expect(row.unit).toBe("koli");
    expect(row.avg).toBe(1900);
  });

  test("birim sutunu paket diyorsa fiyat dusuk olsa da paket kalir", () => {
    const row = normalizePriceRow(
      { name: "Limon", category: null, unit: "sandik", avg: 600, min: 550, max: 650 } as never,
      SOURCE,
    );
    expect(row.unit).toBe("koli");
  });

  test("paket satirinda kurus duzeltmesi uygulanmaz", () => {
    const row = normalizePriceRow(
      { name: "MUZ İTHAL KOLİ", category: null, unit: "koli", avg: 1900, min: 1800, max: 2000 } as never,
      SOURCE,
    );
    expect(row.avg).toBe(1900);
  });
});
