import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseBorsaHtml,
  parseBorsaText,
  parsePolatliBorsaJson,
  parseTobbBorsaHtml,
} from "../../src/modules/etl/sources/borsa/text-parsers";

const fixtureRoot = join(import.meta.dir, "fixtures");

function fixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), "utf8");
}

describe("borsa ETL parsers", () => {
  it("parses text bulletins and converts TL/Ton prices to kg", () => {
    const rows = parseBorsaText(fixture("borsa-text.txt"));

    expect(rows).toEqual([
      {
        name: "Buğday",
        category: "hububat",
        unit: "kg",
        min: 12,
        max: 12.5,
        avg: 12.25,
      },
      {
        name: "Arpa",
        category: "hububat",
        unit: "kg",
        min: 9,
        max: 9.6,
        avg: 9.3,
      },
    ]);
  });

  it("parses HTML bulletins through the shared text parser", () => {
    const rows = parseBorsaHtml(fixture("borsa-html.html"));

    expect(rows).toEqual([
      {
        name: "Mısır",
        category: "hububat",
        unit: "kg",
        min: 8,
        max: 8.4,
        avg: 8.2,
      },
      {
        name: "Pamuk",
        category: "sanayi-bitkisi",
        unit: "kg",
        min: 28,
        max: 31,
        avg: 29.5,
      },
    ]);
  });

  it("aggregates Polatli JSON rows with quantity-weighted averages", () => {
    const rows = parsePolatliBorsaJson(JSON.parse(fixture("polatli-borsa.json")));

    expect(rows).toEqual([
      {
        name: "Buğday",
        category: "hububat",
        unit: "tl/ton",
        min: 11,
        max: 13,
        avg: 12.25,
      },
      {
        name: "Arpa",
        category: "hububat",
        unit: "tl/ton",
        min: 9,
        max: 10,
        avg: 9.5,
      },
    ]);
  });

  it("parses TOBB borsa HTML tables for borsa products", () => {
    const rows = parseTobbBorsaHtml(`
      <table class="table">
        <tr>
          <th>Ürün</th><th>Birim</th><th>Son İşlem Tarihi</th><th>En Az</th><th>En Çok</th><th>Ortalama</th>
        </tr>
        <tr>
          <td>ZEYTİN SİYAH SALAMUR</td><td>KG</td><td>12.05.2026 17:11</td><td>150,000</td><td>150,000</td><td>150,000</td>
        </tr>
        <tr>
          <td>ZEYTİN YAĞI YEMEKLİK</td><td>KG</td><td>03.06.2026 16:55</td><td>245,000</td><td>250,000</td><td>245,850</td>
        </tr>
        <tr>
          <td>ZEYTİN YEŞİL HUSUSİ</td><td>KG</td><td>15.06.2026 16:06</td><td>100,000</td><td>100,000</td><td>100,000</td>
        </tr>
        <tr>
          <td>ZEYTİNYAĞI SIZMA</td><td>KG</td><td>15.06.2026 16:06</td><td>250,000</td><td>300,000</td><td>274,000</td>
        </tr>
        <tr>
          <td>NOHUT</td><td>KG</td><td>05.06.2026 10:19</td><td>36,880</td><td>36,880</td><td>36,880</td>
        </tr>
        <tr>
          <td>MERCİMEK KIRMIZI KIRILMIŞ İÇ.</td><td>KG</td><td>03.06.2026 17:03</td><td>83,150</td><td>92,000</td><td>91,020</td>
        </tr>
      </table>
    `);

    expect(rows).toEqual([
      {
        name: "Sofralık Zeytin",
        category: "sebze-meyve",
        unit: "kg",
        recordedDate: "2026-05-12",
        min: 150,
        max: 150,
        avg: 150,
      },
      {
        name: "Sofralık Zeytin",
        category: "sebze-meyve",
        unit: "kg",
        recordedDate: "2026-06-15",
        min: 100,
        max: 100,
        avg: 100,
      },
      {
        name: "Zeytinyağı",
        category: "yagli-tohum",
        unit: "kg",
        recordedDate: "2026-06-15",
        min: 250,
        max: 300,
        avg: 274,
      },
      {
        name: "Nohut",
        category: "bakliyat-kuru",
        unit: "kg",
        recordedDate: "2026-06-05",
        min: 36.88,
        max: 36.88,
        avg: 36.88,
      },
      {
        name: "Kırmızı Mercimek",
        category: "bakliyat-kuru",
        unit: "kg",
        recordedDate: "2026-06-03",
        min: 83.15,
        max: 92,
        avg: 91.02,
      },
    ]);
  });

  it("converts TOBB TL/ton but preserves real high-value olive KG prices", () => {
    const rows = parseTobbBorsaHtml(`
      <table class="table">
        <tr><th>Ürün</th><th>Birim</th><th>Tarih</th><th>En Az</th><th>En Çok</th><th>Ortalama</th></tr>
        <tr><td>NOHUT</td><td>TL/TON</td><td>13.08.2026</td><td>35.000,00</td><td>37.000,00</td><td>36.000,00</td></tr>
        <tr><td>BUĞDAY</td><td></td><td>13.08.2026</td><td>11.000,00</td><td>13.000,00</td><td>12.000,00</td></tr>
        <tr><td>ZEYTİN SİYAH SALAMUR</td><td>KG</td><td>13.08.2026</td><td>100,00</td><td>350,00</td><td>225,00</td></tr>
        <tr><td>ZEYTİNYAĞI SIZMA</td><td>KG</td><td>13.08.2026</td><td>800,00</td><td>900,00</td><td>850,00</td></tr>
      </table>
    `);

    expect(rows.map((row) => ({ name: row.name, min: row.min, max: row.max, avg: row.avg }))).toEqual([
      { name: "Nohut", min: 35, max: 37, avg: 36 },
      { name: "Buğday", min: 11, max: 13, avg: 12 },
      { name: "Sofralık Zeytin", min: 100, max: 350, avg: 225 },
      { name: "Zeytinyağı", min: 800, max: 900, avg: 850 },
    ]);
  });
});

describe("TOBB borsa — yas urun ve sert kabuklu eslemesi", () => {
  const row = (name: string, unit: string, date: string, min: string, max: string, avg: string) =>
    `<tr><td>${name}</td><td>${unit}</td><td>${date}</td><td>${min}</td><td>${max}</td><td>${avg}</td><td>1.000</td></tr>`;
  const page = (rows: string) => `<table><thead><tr><th>Ürün Adı</th></tr></thead><tbody>${rows}</tbody></table>`;

  it("Nevsehir patatesi eslesir (borsa 'veri uretmiyor' sanilmisti)", () => {
    const rows = parseTobbBorsaHtml(page(row("PATATES YENİ ÜRÜN", "KG", "02.09.2026 10:18", "2,000", "50,000", "14,930")));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.name).toBe("Patates");
    expect(rows[0]!.category).toBe("sebze");
    expect(rows[0]!.avg).toBeCloseTo(14.93, 2);
  });

  it("Ordu findigi kabuklu/ic ayrimiyla eslesir", () => {
    const rows = parseTobbBorsaHtml(page(
      row("FINDIK KABUKLU TOMBUL (LEVANT)", "KG", "09.07.2026 16:29", "170,000", "170,000", "170,000")
      + row("FINDIK İÇ TOMBUL", "KG", "09.07.2026 16:29", "300,000", "320,000", "310,000"),
    ));
    expect(rows.map((r) => r.name).sort()).toEqual(["Fındık (Kabuklu)", "Fındık (İç)"].sort());
  });

  it("tohumluk patates yemeklik fiyatina karismaz", () => {
    expect(parseTobbBorsaHtml(page(row("PATATES TOHUMLUK", "KG", "02.09.2026 10:18", "20,000", "30,000", "25,000")))).toHaveLength(0);
  });

  it("un hala elenir (islenmis urun ham fiyatina karismaz)", () => {
    expect(parseTobbBorsaHtml(page(row("BUĞDAY UNU TİP 2", "KG", "02.09.2026 10:18", "669,190", "1.119,640", "913,480")))).toHaveLength(0);
  });
});
