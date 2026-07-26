import { describe, expect, it } from "vitest";
import { buildFaqItems } from "./HomeFaq";

describe("buildFaqItems", () => {
  it("uses live coverage and the real latest record date", () => {
    const items = buildFaqItems({
      activeCities: 12,
      activeMarkets: 18,
      trackedProducts: 247,
      latestRecordedDate: "2026-07-25",
    });

    expect(items[0].answer).toContain("25 Temmuz 2026");
    expect(items[1].answer).toContain("12 ilde 18 aktif hal ve pazar");
    expect(items[3].answer).toContain("247 tarım ürünü");
    expect(JSON.stringify(items)).not.toContain("250'den fazla");
    expect(JSON.stringify(items)).not.toContain("16 resmi ETL");
  });

  it("uses neutral wording when overview data is unavailable", () => {
    const items = buildFaqItems({});

    expect(items[0].answer).not.toContain("Invalid Date");
    expect(items[1].answer).toContain("Türkiye genelindeki aktif hal ve pazarlar");
    expect(items[3].answer).toContain("sebze, meyve, bakliyat");
  });
});
