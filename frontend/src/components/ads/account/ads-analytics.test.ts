import { describe, expect, it } from "vitest";
import { aggregateDaily, aggregateDevices, aggregateTotals, reportDateRange, type CampaignAnalytics } from "./ads-analytics";

const item = (id: number, impressions: number, clicks: number): CampaignAnalytics => ({
  campaign: { id, firmId: null, listingId: null, title: `Kampanya ${id}`, position: "global_top", ownerType: "account", listing: null, lifecycleStatus: "live", imageUrl: null, caption: null, device: "all", startAt: null, endAt: null, impressions, clicks, uniqueImpressions: impressions, uniqueClicks: clicks, conversions: 0, performanceStatus: "normal" },
  report: { from: "2026-09-01", to: "2026-09-02", totals: { impressions, uniqueImpressions: impressions, clicks, uniqueClicks: clicks, ctr: impressions ? clicks / impressions : 0, conversions: 0 }, devices: { desktop: { impressions: 40, uniqueImpressions: 40, clicks: 1, uniqueClicks: 1 }, mobile: { impressions: impressions - 40, uniqueImpressions: impressions - 40, clicks: Math.max(0, clicks - 1), uniqueClicks: Math.max(0, clicks - 1) } }, scopes: [{ date: "2026-09-01", device: "desktop", scopeKey: "slot:global_top", impressions, uniqueImpressions: impressions, clicks, uniqueClicks: clicks, ctr: impressions ? clicks / impressions : 0 }], conversions: [] },
});

describe("ads analytics", () => {
  it("aggregates campaign totals and daily values", () => {
    const items = [item(1, 100, 2), item(2, 50, 1)];
    expect(aggregateTotals(items)).toMatchObject({ impressions: 150, clicks: 3 });
    expect(aggregateDaily(items)).toEqual([{ date: "2026-09-01", impressions: 150, clicks: 3 }]);
  });

  it("aggregates devices and creates an inclusive date window", () => {
    expect(aggregateDevices([item(1, 100, 2)])).toEqual({ desktop: { impressions: 40, clicks: 1 }, mobile: { impressions: 60, clicks: 1 } });
    expect(reportDateRange(7, new Date("2026-09-23T12:00:00Z"))).toEqual({ from: "2026-09-17", to: "2026-09-23" });
  });
});
