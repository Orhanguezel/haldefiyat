import { describe, expect, it } from "vitest";
import { buildMarketFaq, type MarketFaqInput } from "./market-faq";

const base: MarketFaqInput = {
  marketName: "İstanbul Bayrampaşa Toptancı Hali (İBB)",
  cityName: "İstanbul",
  latestDateTr: "7 Eylül 2026",
  productCount: 99,
  sourceLabel: "İstanbul Büyükşehir Belediyesi",
  staleBulletin: false,
};

describe("buildMarketFaq", () => {
  it("veri varken kapsam ve tarihi cevaba tasir", () => {
    const items = buildMarketFaq(base);
    expect(items).toHaveLength(5);
    expect(items[0]!.answer).toContain("7 Eylül 2026");
    expect(items[0]!.answer).toContain("99 ürün");
  });

  it("veri yokken tarih veya kapsam iddiasi kurmaz", () => {
    const items = buildMarketFaq({ ...base, latestDateTr: "", productCount: 0 });
    expect(items[0]!.answer).toContain("doğrulanmış güncel fiyat listesi bulunmuyor");
    expect(items[0]!.answer).not.toContain("7 Eylül");
    // Kapsam sorusu veri yokken hic sorulmaz.
    expect(items.some((item) => item.question.includes("kaç ürünün fiyatı"))).toBe(false);
  });

  it("bayat bultende tazelik uyarisi ekler", () => {
    const items = buildMarketFaq({ ...base, staleBulletin: true });
    expect(items[0]!.answer).toContain("yedi günden eski");
  });

  it("her sorunun bos olmayan bir cevabi var", () => {
    for (const item of buildMarketFaq(base)) {
      expect(item.question.length).toBeGreaterThan(10);
      expect(item.answer.length).toBeGreaterThan(40);
    }
  });
});
