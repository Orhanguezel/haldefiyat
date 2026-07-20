import { baseApi } from '@/integrations/base-api';

export type EtlSourceFreshness = {
  sourceApi: string;
  staleDays: number;
  baselineDays: number;
  lastChanged: string;
  rows: number;
  isStale: boolean;
};

export type EtlPriceJump = {
  marketName: string;
  productSlug: string;
  peerMedian: number;
  value: number;
  ratio: number;
  days: number;
};

export type EtlFreshnessResponse = {
  sources: EtlSourceFreshness[];
  staleSources: EtlSourceFreshness[];
  priceJumps: EtlPriceJump[];
};

export const etlFreshnessAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    etlFreshnessAdmin: builder.query<EtlFreshnessResponse, void>({
      query: () => ({ url: '/admin/hal/etl/freshness' }),
      providesTags: [{ type: 'EtlLogs' as const, id: 'FRESHNESS' }],
    }),
  }),
  overrideExisting: false,
});

export const { useEtlFreshnessAdminQuery } = etlFreshnessAdminApi;
