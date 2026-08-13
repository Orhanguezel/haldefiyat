import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type PriceAdminItem = {
  id: number;
  productId: number;
  marketId: number;
  productSlug: string;
  productName: string;
  marketSlug: string;
  marketName: string;
  cityName: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  currency?: string;
  unit?: string;
  recordedDate: string;
  sourceApi: string;
};

export type PriceAdminPayload = {
  productId: number;
  marketId: number;
  avgPrice: number;
  minPrice?: number;
  maxPrice?: number;
  recordedDate: string;
  sourceApi?: string;
};

export type BulkPriceEntry = PriceAdminPayload;
export type BulkPriceResult = { ok: boolean; inserted: number; skipped: number; ids: number[] };

export type PriceQuarantineStatus = 'pending' | 'approved' | 'rejected' | 'corrected';
export type PriceQuarantineItem = {
  id: number; productId: number; productName: string; productSlug: string;
  marketId: number; marketName: string; recordedDate: string; sourceApi: string; unit: string;
  minPrice: string | null; maxPrice: string | null; avgPrice: string;
  reasonCode: string; severity: 'warning' | 'critical'; confidence: string;
  peerMedian: string | null; deviationRatio: string | null; status: PriceQuarantineStatus;
  reviewNote: string | null; reviewedBy: string | null; reviewedAt: string | null; createdAt: string;
};

export const pricesAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPricesAdmin: builder.query<
      { items: PriceAdminItem[]; total: number; page: number; limit: number; totalPages: number; meta?: { latestRecordedDate?: string | null; rangeDays?: number } },
      { product?: string; q?: string; city?: string; market?: string; category?: string; range?: string; limit?: number; page?: number; latestOnly?: boolean } | void
    >({
      query: (params) => ({
        url: '/admin/hal/prices',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Prices' as const, id: 'LIST' }],
    }),
    listPriceCategoriesAdmin: builder.query<{ items: { slug: string; count: number }[] }, void>({
      query: () => ({ url: '/admin/hal/price-categories' }),
      providesTags: [{ type: 'Prices' as const, id: 'CATEGORIES' }],
    }),
    getPriceAdmin: builder.query<PriceAdminItem, number | string>({
      query: (id) => ({ url: `/admin/hal/prices/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Prices' as const, id }],
    }),
    createPriceAdmin: builder.mutation<{ ok: boolean; id?: number | null }, PriceAdminPayload>({
      query: (body) => ({ url: '/admin/hal/prices', method: 'POST', body }),
      invalidatesTags: [{ type: 'Prices' as const, id: 'LIST' }],
    }),
    updatePriceAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: PriceAdminPayload }>({
      query: ({ id, body }) => ({ url: `/admin/hal/prices/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Prices' as const, id: 'LIST' }, { type: 'Prices' as const, id }],
    }),
    bulkCreatePricesAdmin: builder.mutation<BulkPriceResult, { entries: BulkPriceEntry[] }>({
      query: (body) => ({ url: '/admin/hal/prices/bulk-entry', method: 'POST', body }),
      invalidatesTags: [{ type: 'Prices' as const, id: 'LIST' }],
    }),
    listPriceQuarantineAdmin: builder.query<
      { items: PriceQuarantineItem[]; total: number; limit: number; offset: number },
      { status?: PriceQuarantineStatus; severity?: 'warning' | 'critical'; reason?: string; q?: string; limit?: number; offset?: number } | void
    >({
      query: (params) => ({ url: '/admin/hal/price-quarantine', params: cleanParams(params as Record<string, unknown> | undefined) }),
      providesTags: [{ type: 'Prices' as const, id: 'QUARANTINE' }],
    }),
    reviewPriceQuarantineAdmin: builder.mutation<
      { ok: boolean; id: number; status: PriceQuarantineStatus },
      { id: number; decision: 'approve' | 'reject' | 'correct'; note: string; confirmCritical?: boolean; avgPrice?: number; minPrice?: number | null; maxPrice?: number | null }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/hal/price-quarantine/${id}/review`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Prices' as const, id: 'QUARANTINE' }, { type: 'Prices' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPricesAdminQuery,
  useListPriceCategoriesAdminQuery,
  useGetPriceAdminQuery,
  useCreatePriceAdminMutation,
  useUpdatePriceAdminMutation,
  useBulkCreatePricesAdminMutation,
  useListPriceQuarantineAdminQuery,
  useReviewPriceQuarantineAdminMutation,
} = pricesAdminApi;
