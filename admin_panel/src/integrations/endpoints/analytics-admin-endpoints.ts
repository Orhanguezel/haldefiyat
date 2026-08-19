import { baseApi } from '@/integrations/base-api';

export type AnalyticsRange = '7d' | '30d';

export interface AnalyticsSummary {
  totalRequests: number;
  humanRequests: number;
  botRequests: number;
  uniqueIps: number;
  pageviews: number;
  pagesPerVisitor: number;
  directTrafficPct: number;
  returningIps: number;
  adsPageviews: number;
  adsUniqueIps: number;
  newsletterTotal: number;
  newsletterNew: number;
  newsletterAdsCapturePct: number;
  b2bLikeIps: number;
  b2bIntentIps: number;
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  summary: AnalyticsSummary;
  daily: Array<{
    date: string;
    requests: number;
    humans: number;
    bots: number;
    ads: number;
    uniqueIps: number;
    errors: number;
  }>;
  topLandingPages: Array<{ name: string; count: number }>;
  topReferrers: Array<{ name: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  intentSignals: Array<{ path: string; uniqueIps: number }>;
}

export interface AdsAttributionResponse {
  range: AnalyticsRange;
  items: Array<{
    campaign: string;
    source: string;
    medium: string;
    pageviews: number;
    uniqueIps: number;
  }>;
}

export interface AdsDailyResponse {
  range: AnalyticsRange;
  items: Array<{
    date: string;
    campaign: string;
    source: string;
    medium: string;
    pageviews: number;
    uniqueIps: number;
  }>;
}

export interface DeviceDailyResponse {
  range: AnalyticsRange;
  items: Array<{
    date: string;
    device: string;
    requests: number;
    uniqueIps: number;
    adsRequests: number;
    adsUniqueIps: number;
  }>;
}

export interface AnalyticsFunnelResponse {
  range: AnalyticsRange;
  items: Array<{ name: string; count: number }>;
}

export interface AnalyticsRetentionResponse {
  range: AnalyticsRange;
  cohorts: Array<{
    date: string;
    visitors: number;
    d1: number;
    d1Pct: number;
    d3: number;
    d3Pct: number;
    d7: number;
    d7Pct: number;
    d14: number;
    d14Pct: number;
    d30: number;
    d30Pct: number;
  }>;
}

export interface AnalyticsHeatmapResponse {
  range: AnalyticsRange;
  items: Array<{
    weekday: number;
    hour: number;
    humans: number;
    uniqueIps: number;
  }>;
}

/** Bulten CTA hunisi — gosterimden aboneye. Backend: modules/tracking/cta.ts */
export interface CtaFunnelRow {
  placement: string;
  device: string;
  impression: number;
  focus: number;
  submit: number;
  success: number;
  whatsapp: number;
  conversionPct: number | null;
  engagePct: number | null;
}

export interface CtaFunnelResponse {
  success: boolean;
  data: { days: number; rows: CtaFunnelRow[] };
}

export interface ProductKpiResponse {
  days: number;
  generatedAt: string;
  priceFind: { averageMs: number | null; measuredJourneys: number; state: 'measured' | 'collecting' };
  search: {
    opened: number; submitted: number; selected: number; priceViewed: number; zeroResults: number;
    successPct: number | null; priceViewPct: number | null; zeroResultsPct: number | null;
    state: 'measured' | 'collecting';
  };
  anomalies: { published: number; quarantined: number; pending: number; retailQuarantined: number; ratePct: number | null };
  calls: {
    total: number; notified: number; accepted: number; completed: number;
    notifiedPct: number | null; acceptedPct: number | null; completedPct: number | null;
    byStatus: Record<string, number>; state: 'measured' | 'collecting';
  };
  thresholds: {
    priceFindAverageMs: number; searchSuccessPct: number; anomalyWarningPct: number; anomalyStopPct: number;
    minimumJourneySample: number; minimumSearchSample: number; minimumCallSample: number;
  };
}

export const analyticsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsOverviewAdmin: builder.query<AnalyticsOverview, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/overview?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'ANALYTICS_OVERVIEW' }],
    }),
    getAnalyticsAdsAttributionAdmin: builder.query<AdsAttributionResponse, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/ads-attribution?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'ADS_ATTRIBUTION' }],
    }),
    getAnalyticsAdsDailyAdmin: builder.query<AdsDailyResponse, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/ads-daily?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'ADS_DAILY' }],
    }),
    getAnalyticsDeviceDailyAdmin: builder.query<DeviceDailyResponse, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/device-daily?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'DEVICE_DAILY' }],
    }),
    getAnalyticsFunnelAdmin: builder.query<AnalyticsFunnelResponse, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/funnel?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'ANALYTICS_FUNNEL' }],
    }),
    getAnalyticsRetentionAdmin: builder.query<AnalyticsRetentionResponse, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/retention?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'ANALYTICS_RETENTION' }],
    }),
    getAnalyticsHeatmapAdmin: builder.query<AnalyticsHeatmapResponse, { range?: AnalyticsRange } | undefined>({
      query: (params) => ({ url: `/admin/analytics/heatmap?range=${params?.range ?? '7d'}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'ANALYTICS_HEATMAP' }],
    }),
    getCtaFunnelAdmin: builder.query<CtaFunnelResponse, { days?: number } | undefined>({
      query: (params) => ({ url: `/admin/analytics/cta-funnel?days=${params?.days ?? 30}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'CTA_FUNNEL' }],
    }),
    getProductKpisAdmin: builder.query<ProductKpiResponse, { days?: number } | undefined>({
      query: (params) => ({ url: `/admin/analytics/product-kpis?days=${params?.days ?? 30}` }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'PRODUCT_KPIS' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnalyticsOverviewAdminQuery,
  useGetAnalyticsAdsAttributionAdminQuery,
  useGetAnalyticsAdsDailyAdminQuery,
  useGetAnalyticsDeviceDailyAdminQuery,
  useGetAnalyticsFunnelAdminQuery,
  useGetAnalyticsRetentionAdminQuery,
  useGetAnalyticsHeatmapAdminQuery,
  useGetCtaFunnelAdminQuery,
  useGetProductKpisAdminQuery,
} = analyticsAdminApi;
