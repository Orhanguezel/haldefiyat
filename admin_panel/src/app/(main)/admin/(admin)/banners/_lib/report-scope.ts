import type { BannerRevenueReport } from '@/integrations/endpoints/banners-admin-endpoints';

export type CampaignIdentity = { id: number; title: string; advertiser: string | null; position: string | null };
export const ALL_BRANDS = '__all__';
export const brandKey = (name: string | null) => name?.trim().toLocaleLowerCase('tr-TR') || '__unassigned__';
export function campaignIdsForScope(campaigns: CampaignIdentity[], brand: string, selected: number[] | null) {
  const selectedIds = selected === null ? null : new Set(selected);
  return new Set(campaigns.filter(c => (brand === ALL_BRANDS || brandKey(c.advertiser) === brand)
    && (selectedIds === null || selectedIds.has(c.id))).map(c => c.id));
}
const emptyTotals = () => ({ revenue: 0, collected: 0, outstanding: 0, impressions: 0, clicks: 0, conversions: 0 });
export function scopeRevenue(report: BannerRevenueReport | undefined, ids: Set<number>) {
  if (!report) return undefined;
  const campaigns = report.campaigns.filter(c => ids.has(c.bannerId));
  const totals = emptyTotals();
  const slots = new Map<string, ReturnType<typeof emptyTotals>>();
  for (const campaign of campaigns) {
    const slot = slots.get(campaign.position) ?? emptyTotals();
    for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[key] += campaign[key]; slot[key] += campaign[key];
    }
    slots.set(campaign.position, slot);
  }
  return { campaigns, totals, slots: [...slots].map(([key, values]) => ({ key, ...values })) };
}
