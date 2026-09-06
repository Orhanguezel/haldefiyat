import { describe, expect, it } from "bun:test";
import { retailVariant, sameRetailOffer, depotRejectionReason } from "@/modules/etl/retail-source-policy";
import { retailRunWarnings } from "@/modules/etl/retail-run-evidence";
import type { MarketfiyatiEtlResult } from "@/modules/etl/market-scrapers/marketfiyati";
import { realListingSql } from "@/modules/listings/evidence-policy";

describe("retail evidence closeout", () => {
  it("keeps fat, type, and normalized package distinct", () => {
    expect(retailVariant("sut", "Dost %0,5 Yağlı UHT Süt 1 L")).toMatchObject({ fat: "%0,5", kind: "UHT süt", packageAmount: 1, packageUnit: "litre" });
    expect(retailVariant("yogurt", "Sütaş Kaymaksız Yoğurt 500 Gr")).toMatchObject({ fat: "Belirtilmemiş", kind: "Kaymaksız yoğurt", packageAmount: 0.5, packageUnit: "kg" });
    expect(retailVariant("sut", "Süt").packageAmount).toBeNull();
  });
  it("cannot use other fat, brands, or packs as an identical historical offer", () => {
    expect(sameRetailOffer("Marka Tam Yağlı Süt 1 L", "Marka %0,5 Süt 1 L")).toBe(false);
    expect(sameRetailOffer("Marka Yoğurt 1 Kg", "Marka Yoğurt 3 Kg")).toBe(false);
    expect(sameRetailOffer(null, "Marka Yoğurt 1 Kg")).toBe(false);
    expect(sameRetailOffer(" Marka Yoğurt 1 Kg ", "marka yoğurt 1 kg")).toBe(true);
  });
  it("reports rejection reason independent of source error samples", () => {
    const depot = { price: 20, unitPriceValue: 20, unitPrice: "20 TL/kg", indexTime: "05.09.2026 09:00" };
    expect(depotRejectionReason(depot, "kg", "2026-09-06")).toBeNull();
    expect(depotRejectionReason({...depot, discount:true}, "kg", "2026-09-06")).toBe("PROMOTION");
    expect(depotRejectionReason({...depot, unitPrice:"20 TL/adet"}, "kg", "2026-09-06")).toBe("UNIT_MISSING_OR_MISMATCH");
    expect(depotRejectionReason(depot, "kg", "2026-09-10")).toBe("SOURCE_DATE_INVALID_OR_STALE");
  });
  it("warns when run writes zero or coverage collapses despite no thrown exception", () => {
    const result = { inserted:0, verifiedOffers:20, offersByChain:{sok:20}, searchFailures:2, writeFailures:{RETAIL_WRITE_ERROR:1}, throttled:false } as unknown as MarketfiyatiEtlResult;
    expect(retailRunWarnings(result,100)).toEqual(["ZERO_WRITES","LOW_CHAIN_COVERAGE","COVERAGE_DROP_GT_30_PERCENT","SOURCE_SEARCH_ERRORS","WRITE_OR_QUARANTINE_FAILURES"]);
  });
  it("rejects interpolated aliases in reusable listing predicate", () => {
    expect(() => realListingSql("l; DROP TABLE x")).toThrow();
    expect(realListingSql("l")).toContain("l.description");
  });
});
