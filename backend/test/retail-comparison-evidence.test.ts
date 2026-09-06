import { describe, expect, it } from "bun:test";
import { retailTitleMatches, sourceDate, verifiedDepot } from "@/modules/etl/retail-source-policy";
import { latestRetailByChain, type RetailObservation } from "@/modules/prices/retail-observations";
import { chooseGapCandidates, type GapCandidate } from "@/modules/social/cards/gap-policy";
import { gapCaption } from "@/modules/social/cards";

const observation: RetailObservation = {
  productSlug: "domates", productUnit: "kg", chainSlug: "sok", price: "29.90", unit: "kg",
  recordedDate: "2026-09-05", productNameRaw: "Domates 1 Kg", productUrl: "https://marketfiyati.org.tr/",
};
const candidate: GapCandidate = {
  ...observation, productName: "Domates", canonicalSlug: null, imageUrl: null,
  halPrice: 40, markets: 3, searchVolume: 100,
};
const group = (date = "2026-09-05") => ["domates", "patates", "limon"].map(slug => ({
  ...candidate, recordedDate: date, productSlug: slug, productNameRaw: `${slug} 1 Kg`,
}));

describe("source evidence", () => {
  it("uses the provider date instead of the scrape date and rejects bad/future/stale dates", () => {
    expect(sourceDate("05.09.2026 07:54", "2026-09-06")).toBe("2026-09-05");
    for (const date of [undefined, "31.02.2026 08:00", "07.09.2026 08:00", "01.09.2026 08:00"])
      expect(sourceDate(date, "2026-09-06")).toBeNull();
  });
  it("requires an explicit price unit and excludes conditional offers", () => {
    const depot = { price: 12, unitPriceValue: 48, unitPrice: "48,00 ₺/Kg", indexTime: "05.09.2026 07:54" };
    expect(verifiedDepot(depot, "kg", "2026-09-06")?.price).toBe(48);
    expect(verifiedDepot({ ...depot, unitPrice: "12 ₺/Adet" }, "kg", "2026-09-06")).toBeNull();
    expect(verifiedDepot({ ...depot, unitPrice: undefined }, "kg", "2026-09-06")).toBeNull();
    expect(verifiedDepot({ ...depot, promotionText: "2 al 1 öde" }, "kg", "2026-09-06")).toBeNull();
    expect(verifiedDepot({ ...depot, unitPrice: "48 ₺/Lt" }, "litre", "2026-09-06")?.unit).toBe("litre");
  });
  it("rejects real mismatches found in production without discarding valid gram-priced meat", () => {
    expect(retailTitleMatches("domates", "Şeker Domates 250 Gr")).toBeFalse();
    expect(retailTitleMatches("domates", "Kokteyl Domates 1 Kg")).toBeFalse();
    expect(retailTitleMatches("patates", "Torpat Parmak Patates 1 Kg")).toBeFalse();
    expect(retailTitleMatches("dana-kiyma", "Uzman Kasap Dana Kuzu Kıyma 400 Gr")).toBeFalse();
    expect(retailTitleMatches("yogurt", "Eker İncirli Yulaflı Probiyotik Yoğurt 125 Gr")).toBeFalse();
    expect(retailTitleMatches("dana-kiyma", "Dana Kıyma 400 Gr")).toBeTrue();
    expect(retailTitleMatches("domates", "Domates 1 Kg")).toBeTrue();
  });
});

describe("published retail data", () => {
  it("returns the actual newest quote, never a multi-day average labelled as today", () => {
    const rows = latestRetailByChain([observation, { ...observation, price: "80", recordedDate: "2026-09-04" }]);
    expect(rows[0]?.price).toBe("29.90");
    expect(rows[0]?.recordedDate).toBe("2026-09-05");
  });
  it("unverified newer rows cannot hide or replace an older verified quote", () => {
    const rows = latestRetailByChain([observation,
      { ...observation, price: "900", productUrl: null, recordedDate: "2026-09-06" },
      { ...observation, unit: "adet", recordedDate: "2026-09-06" }]);
    expect(rows).toEqual([observation]);
  });
  it("never mixes card dates to reach the three-product minimum", () => {
    expect(chooseGapCandidates([group()[0]!, ...group("2026-09-06").slice(1)], 6)).toEqual([]);
    expect(chooseGapCandidates([...group(), group("2026-09-06")[0]!], 6).map(r => r.recordedDate))
      .toEqual(["2026-09-05", "2026-09-05", "2026-09-05"]);
  });
  it("keeps negative, zero and positive gaps and counts distinct eligible chains", () => {
    const rows = group().map((r, i) => ({ ...r, price: String([30, 40, 50][i]) }));
    const chosen = chooseGapCandidates([...rows, { ...rows[0]!, chainSlug: "bim", price: "60" }], 6);
    expect(chosen).toHaveLength(3);
    expect(chosen.map(r => Number(r.price) - r.halPrice).sort((a,b) => a-b)).toEqual([-10, 0, 10]);
    expect(chosen.find(r => r.productSlug === "domates")?.chains).toBe(2);
  });
  it("rejects insufficient hal coverage and unit mixing before choosing the cheapest chain", () => {
    expect(chooseGapCandidates(group().map(r => ({ ...r, markets: 2 })), 6)).toEqual([]);
    const chosen = chooseGapCandidates([...group(), { ...candidate, price: "1", unit: "adet" }], 6);
    expect(chosen.find(r => r.productSlug === "domates")?.price).toBe("29.90");
  });
  it("caption preserves negative signs and refuses a mismatched header date", () => {
    const row = {
      productSlug: "domates", productName: "Domates", canonicalSlug: null, imageUrl: null,
      halPrice: 40, retailPrice: 30, retailChain: "ŞOK", gapPct: -25, markets: 3, chains: 2,
      recordedDate: "2026-09-05", sourceUrl: "https://marketfiyati.org.tr/", productNameRaw: "Domates 1 Kg",
    };
    expect(gapCaption([row], row.recordedDate, row.recordedDate)).toContain("−%25");
    expect(() => gapCaption([row], "2026-09-06", "2026-09-05")).toThrow("K4_DATE_MISMATCH");
  });
});
