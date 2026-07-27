import { baseApi } from '@/integrations/base-api';

export type EtlLogItem = {
  id: number;
  sourceApi: string;
  runDate: string;
  rowsFetched: number;
  rowsInserted: number;
  rowsSkipped: number;
  durationMs: number | null;
  status: 'ok' | 'partial' | 'error';
  errorMsg: string | null;
  createdAt: string;
};

export type ScraperStatus = {
  enabled: boolean;
  url: string | null;
  reachable: boolean;
  latencyMs: number | null;
  health: Record<string, unknown> | null;
  sources: string[];
  dynamicSources: string[];
  error?: string;
};

export type CronCatalogItem = {
  name: string;
  schedule: string;
  category: 'etl' | 'seo' | 'icerik' | 'sosyal' | 'bakim' | 'bildirim' | 'reklam';
  description: string;
};

export type CronCatalog = {
  timezone: string;
  tasks: CronCatalogItem[];
};

export type PriceSurgeItem = {
  productSlug: string;
  name: string;
  buckets: [number, number, number, number];
  pctChange: number;
  lastWeekPct: number;
  hals: number;
  latestAvg: number;
  severity: number;
  tier: 'güçlü' | 'izle';
};

export const etlLogsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEtlLogsAdmin: builder.query<{ logs: EtlLogItem[] }, void>({
      query: () => ({ url: '/admin/hal/etl/logs' }),
      providesTags: [{ type: 'EtlLogs' as const, id: 'LIST' }],
    }),
    earlyWarningAdmin: builder.query<{ items: PriceSurgeItem[]; generatedAt: string }, void>({
      query: () => ({ url: '/admin/early-warning' }),
    }),
    scraperStatusAdmin: builder.query<ScraperStatus, void>({
      query: () => ({ url: '/admin/hal/etl/scraper' }),
    }),
    cronCatalogAdmin: builder.query<CronCatalog, void>({
      query: () => ({ url: '/admin/hal/etl/cron' }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListEtlLogsAdminQuery,
  useEarlyWarningAdminQuery,
  useScraperStatusAdminQuery,
  useCronCatalogAdminQuery,
} = etlLogsAdminApi;
