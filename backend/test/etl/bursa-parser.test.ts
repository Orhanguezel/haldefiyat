import { describe, expect, test } from "bun:test";
import { parseBursaHtml } from "../../src/modules/etl/fetcher";

describe("Bursa hal parser", () => {
  test("aynı ürünün kg ve sandık satırlarını ayrı ürün adıyla döndürür", () => {
    const html = `
      <table>
        <tr><th>Ürün</th><th>BR</th><th>FİYAT</th></tr>
        <tr><td>Limon</td><td>Kg.</td><td>20,00 - 220,00 TL</td></tr>
        <tr><td>Limon</td><td>Sandık</td><td>135,00 - 3960,00 TL</td></tr>
      </table>`;

    expect(parseBursaHtml(html)).toEqual([
      { name: "Limon", category: null, unit: "kg.", avg: 120, min: 20, max: 220 },
      { name: "Limon (Sandık)", category: null, unit: "sandik", avg: 2047.5, min: 135, max: 3960 },
    ]);
  });
});
