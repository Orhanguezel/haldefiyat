import { describe, expect, test } from 'bun:test';
import { ALL_BRANDS, brandKey, campaignIdsForScope, scopeRevenue } from './report-scope';
import type { BannerRevenueReport } from '@/integrations/endpoints/banners-admin-endpoints';
const campaigns = [
  { id: 1, title: 'Yaz', advertiser: 'Vista Seeds', position: 'footer' },
  { id: 2, title: 'Yaz', advertiser: 'Vista Seeds', position: 'sidebar' },
  { id: 3, title: 'İhracat', advertiser: 'İhracat Radarı', position: 'footer' },
];
function report(multiplier = 1) {
  return { campaigns: campaigns.map(c => ({ bannerId: c.id, title: c.title, advertiser: c.advertiser, position: c.position,
    firmId: null, revenue: c.id * 100, collected: c.id * 50, outstanding: c.id * 50,
    impressions: c.id * 1000 * multiplier, clicks: c.id * 10 * multiplier, conversions: c.id * multiplier,
    cpm: 100, cpc: 10, cpa: 100 })) } as BannerRevenueReport;
}
describe('campaign report scope', () => {
  test('same brand and even same titles retain separate campaign IDs', () => {
    const ids = campaignIdsForScope(campaigns, brandKey('Vista Seeds'), [2]);
    expect([...ids]).toEqual([2]);
    const result = scopeRevenue(report(), ids)!;
    expect(result.campaigns.map(c => c.bannerId)).toEqual([2]);
    expect(result.totals.impressions).toBe(2000);
    expect(result.slots.map(s => s.key)).toEqual(['sidebar']);
  });
  test('combined brand report excludes other brands from all totals', () => {
    const ids = campaignIdsForScope(campaigns, brandKey('Vista Seeds'), null);
    const result = scopeRevenue(report(), ids)!;
    expect(result.totals).toEqual({ revenue: 300, collected: 150, outstanding: 150, impressions: 3000, clicks: 30, conversions: 3 });
    expect(result.slots.reduce((n,s) => n+s.impressions, 0)).toBe(3000);
    expect(scopeRevenue(report(2), ids)!.totals.impressions).toBe(6000);
  });
  test('empty selection stays empty and stale cross-brand IDs cannot leak', () => {
    expect(scopeRevenue(report(), campaignIdsForScope(campaigns, ALL_BRANDS, []))!.campaigns).toEqual([]);
    expect([...campaignIdsForScope(campaigns, brandKey('İhracat Radarı'), [1,2])]).toEqual([]);
    expect(campaignIdsForScope(campaigns, ALL_BRANDS, null).size).toBe(3);
  });
});
