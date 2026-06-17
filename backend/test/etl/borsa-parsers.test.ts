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
        name: "Mercimek",
        category: "bakliyat-kuru",
        unit: "kg",
        recordedDate: "2026-06-03",
        min: 83.15,
        max: 92,
        avg: 91.02,
      },
    ]);
  });
});
