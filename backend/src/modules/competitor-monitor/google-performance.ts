import { getGscAuthHeaders, getGscDateRange, queryGsc, resolveGscSite } from '@agro/shared-backend/modules/searchConsole/service';
interface Metric { position: number; clicks: number; impressions: number; page: string | null }
interface Snapshot { startDate: string; endDate: string; fetchedAt: string; status: 'ok' | 'unavailable'; queries: Record<string, Metric> }
let cache: { until: number; value: Snapshot } | null = null;
let pending: Promise<Snapshot> | null = null;
/** Separate, dated Google metric. Never substitute a scraped rank for GSC. */
export async function googlePerformance(): Promise<Snapshot> {
  if (cache && cache.until > Date.now()) return cache.value;
  if (pending) return pending;
  pending = (async () => {
    const { startDate, endDate } = getGscDateRange('LAST_28_DAYS');
    const value: Snapshot = { startDate, endDate, fetchedAt: new Date().toISOString(), status: 'ok', queries: {} };
    try {
      const headers = await getGscAuthHeaders();
      const site = (await resolveGscSite()).replace(/^"+|"+$/g, '');
      const body = { startDate, endDate, type: 'web', dataState: 'final', rowLimit: 25000 };
      const [queries, pages] = await Promise.all([queryGsc(site, headers, { ...body, dimensions: ['query'] }), queryGsc(site, headers, { ...body, dimensions: ['query', 'page'] })]);
      for (const r of queries) {
        const q = String((r.keys as string[])[0]);
        value.queries[q] = { position: Number(r.position), clicks: Number(r.clicks), impressions: Number(r.impressions), page: null };
      }
      const best: Record<string, number> = {};
      for (const r of pages) {
        const [q, page] = r.keys as string[];
        if (q && value.queries[q] && Number(r.impressions) > (best[q] ?? -1)) {
          value.queries[q]!.page = page ?? null; best[q] = Number(r.impressions);
        }
      }
    } catch { value.status = 'unavailable'; }
    cache = { until: Date.now() + (value.status === 'ok' ? 3600000 : 60000), value };
    return value;
  })();
  try { return await pending; } finally { pending = null; }
}
