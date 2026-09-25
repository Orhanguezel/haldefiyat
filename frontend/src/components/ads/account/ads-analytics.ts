import type { Campaign, CampaignReport } from "./ad-labels";

export type CampaignAnalytics = { campaign: Campaign; report: CampaignReport };

export type AnalyticsTotals = {
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
};

export function reportDateRange(days: number, now = new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - Math.max(1, days - 1));
  const iso = (value: Date) => value.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export function aggregateTotals(items: CampaignAnalytics[]): AnalyticsTotals {
  return items.reduce((sum, { report }) => ({
    impressions: sum.impressions + report.totals.impressions,
    uniqueImpressions: sum.uniqueImpressions + report.totals.uniqueImpressions,
    clicks: sum.clicks + report.totals.clicks,
    uniqueClicks: sum.uniqueClicks + report.totals.uniqueClicks,
    conversions: sum.conversions + report.totals.conversions,
  }), { impressions: 0, uniqueImpressions: 0, clicks: 0, uniqueClicks: 0, conversions: 0 });
}

export function aggregateDaily(items: CampaignAnalytics[]) {
  const byDate = new Map<string, { date: string; impressions: number; clicks: number }>();
  for (const { report } of items) {
    for (const row of report.scopes) {
      const current = byDate.get(row.date) ?? { date: row.date, impressions: 0, clicks: 0 };
      current.impressions += row.impressions;
      current.clicks += row.clicks;
      byDate.set(row.date, current);
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateDevices(items: CampaignAnalytics[]) {
  return items.reduce((sum, { report }) => ({
    desktop: {
      impressions: sum.desktop.impressions + report.devices.desktop.impressions,
      clicks: sum.desktop.clicks + report.devices.desktop.clicks,
    },
    mobile: {
      impressions: sum.mobile.impressions + report.devices.mobile.impressions,
      clicks: sum.mobile.clicks + report.devices.mobile.clicks,
    },
  }), { desktop: { impressions: 0, clicks: 0 }, mobile: { impressions: 0, clicks: 0 } });
}

export function aggregateConversions(items: CampaignAnalytics[]) {
  const totals = new Map<string, number>();
  for (const { report } of items) {
    for (const conversion of report.conversions) {
      totals.set(conversion.eventType, (totals.get(conversion.eventType) ?? 0) + Number(conversion.conversions));
    }
  }
  return [...totals.entries()].map(([eventType, conversions]) => ({ eventType, conversions }))
    .sort((a, b) => b.conversions - a.conversions);
}
