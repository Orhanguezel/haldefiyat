import { describe, expect, it } from "bun:test";
import type { BasketRow } from "../src/modules/prices/basket";
import { validateBasketPercentages } from "../src/modules/notifications/weekly-mail-digest";

function row(patch: Partial<BasketRow> = {}): BasketRow {
  return {
    productSlug: "domates",
    productName: "Domates",
    price: 12,
    marketCount: 5,
    weekCurrent: 12,
    prevPrice: 10,
    weeklyPct: 20,
    weeklyPairs: 5,
    yoyCurrent: null,
    lastYearAvg: null,
    yoyPct: null,
    yoyPairs: null,
    ...patch,
  };
}

describe("newsletter matched basket percentage guard", () => {
  it("accepts a recomputable matched-basket percentage", () => {
    expect(validateBasketPercentages([row()])).toEqual([]);
  });

  it("rejects missing pair evidence and mismatched percentages", () => {
    expect(validateBasketPercentages([row({ weeklyPairs: null })])).toContain("domates:missing_matched_basket");
    expect(validateBasketPercentages([row({ weeklyPct: 35 })])).toContain("domates:percentage_mismatch");
  });
});
