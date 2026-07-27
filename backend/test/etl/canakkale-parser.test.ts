import { describe, expect, test } from "bun:test";
import { parseCanakkaleHtml } from "../../src/modules/etl/fetcher";

describe("Çanakkale hal parser", () => {
  test("statik sayfadaki gerçek tarihi tüm fiyat satırlarına taşır", () => {
    const rows = parseCanakkaleHtml(`
      <table>
        <tr><th>TOPTANCI HALİ SEBZE MEYVE FİYAT LİSTESİ</th><th>07.07.2026</th></tr>
        <tr><th>SEBZE</th></tr>
        <tr>
          <th>MALZEMENİN ADI</th><th>BİRİM</th>
          <th>ASGARİ SATIŞ FİYATI</th><th>AZAMİ SATIŞ FİYATI</th>
        </tr>
        <tr><td>DOMATES</td><td>Kg</td><td>20,00TL</td><td>50,00TL</td></tr>
      </table>
    `);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "DOMATES",
      min: 20,
      max: 50,
      avg: 35,
      recordedDate: "2026-07-07",
    });
  });

  test("sayfa tarihi yoksa çağıranın tarih fallback'ine izin verir", () => {
    const rows = parseCanakkaleHtml(`
      <table>
        <tr><th>SEBZE</th></tr>
        <tr><td>DOMATES</td><td>Kg</td><td>20,00TL</td><td>50,00TL</td></tr>
      </table>
    `);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.recordedDate).toBeUndefined();
  });
});
