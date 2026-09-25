import { getGscAuthHeaders, getGscDateRange, queryGsc, resolveGscSite } from '@agro/shared-backend/modules/searchConsole/service';

export interface LandingPageMetric {
  page: string;
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
}

export interface GoogleMetric {
  position: number;
  clicks: number;
  impressions: number;
  ctr: number;
  page: string | null;
  pages: LandingPageMetric[];
}

export interface GooglePerformanceSnapshot {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  fetchedAt: string;
  status: 'ok' | 'unavailable';
  scope: { country: 'tur'; device: 'MOBILE'; type: 'web'; dataState: 'final' };
  queries: Record<string, GoogleMetric>;
  previousQueries: Record<string, GoogleMetric>;
}

let cache: { until: number; value: GooglePerformanceSnapshot } | null = null;
let pending: Promise<GooglePerformanceSnapshot> | null = null;
const scope = { country: 'tur', device: 'MOBILE', type: 'web', dataState: 'final' } as const;

function shiftIsoDate(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function metricOf(row: Record<string, unknown>): GoogleMetric {
  return {
    position: Number(row.position ?? 0),
    clicks: Number(row.clicks ?? 0),
    impressions: Number(row.impressions ?? 0),
    ctr: Number(row.ctr ?? 0),
    page: null,
    pages: [],
  };
}

function queryBody(startDate: string, endDate: string, dimensions: string[]) {
  return {
    startDate,
    endDate,
    type: scope.type,
    dataState: scope.dataState,
    dimensions,
    rowLimit: 25_000,
    dimensionFilterGroups: [{
      filters: [
        { dimension: 'country', operator: 'equals', expression: scope.country },
        { dimension: 'device', operator: 'equals', expression: scope.device },
      ],
    }],
  };
}

function queryMap(rows: Array<Record<string, unknown>>): Record<string, GoogleMetric> {
  const result: Record<string, GoogleMetric> = {};
  for (const row of rows) {
    const query = String((row.keys as string[] | undefined)?.[0] ?? '').trim();
    if (query) result[query] = metricOf(row);
  }
  return result;
}

/** Separate, dated Google metric. Never substitute a scraped rank for GSC. */
export async function googlePerformance(): Promise<GooglePerformanceSnapshot> {
  if (cache && cache.until > Date.now()) return cache.value;
  if (pending) return pending;
  pending = (async () => {
    const { startDate, endDate } = getGscDateRange('LAST_28_DAYS');
    const previousEndDate = shiftIsoDate(startDate, -1);
    const previousStartDate = shiftIsoDate(previousEndDate, -27);
    const value: GooglePerformanceSnapshot = {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate,
      fetchedAt: new Date().toISOString(),
      status: 'ok',
      scope,
      queries: {},
      previousQueries: {},
    };
    try {
      const headers = await getGscAuthHeaders();
      const site = (await resolveGscSite()).replace(/^"+|"+$/g, '');
      const [queries, pages, previousQueries] = await Promise.all([
        queryGsc(site, headers, queryBody(startDate, endDate, ['query'])),
        queryGsc(site, headers, queryBody(startDate, endDate, ['query', 'page'])),
        queryGsc(site, headers, queryBody(previousStartDate, previousEndDate, ['query'])),
      ]);
      value.queries = queryMap(queries);
      value.previousQueries = queryMap(previousQueries);
      for (const row of pages) {
        const [query, page] = (row.keys as string[] | undefined) ?? [];
        const metric = query ? value.queries[query] : undefined;
        if (!metric || !page) continue;
        const pageMetric = metricOf(row);
        metric.pages.push({
          page,
          position: pageMetric.position,
          clicks: pageMetric.clicks,
          impressions: pageMetric.impressions,
          ctr: pageMetric.ctr,
        });
      }
      for (const metric of Object.values(value.queries)) {
        metric.pages.sort((a, b) => b.impressions - a.impressions);
        metric.pages = metric.pages.slice(0, 5);
        metric.page = metric.pages[0]?.page ?? null;
      }
    } catch {
      value.status = 'unavailable';
    }
    cache = { until: Date.now() + (value.status === 'ok' ? 3_600_000 : 60_000), value };
    return value;
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}
