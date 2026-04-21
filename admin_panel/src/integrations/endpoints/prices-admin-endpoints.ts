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

export const pricesAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPricesAdmin: builder.query<
      { items: PriceAdminItem[]; meta?: { latestRecordedDate?: string | null; rangeDays?: number } },
      { product?: string; city?: string; market?: string; category?: string; range?: string; limit?: number; latestOnly?: boolean } | void
    >({
      query: (params) => ({
        url: '/admin/hal/prices',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Prices' as const, id: 'LIST' }],
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
  }),
  overrideExisting: false,
});

export const {
  useListPricesAdminQuery,
  useGetPriceAdminQuery,
  useCreatePriceAdminMutation,
  useUpdatePriceAdminMutation,
  useBulkCreatePricesAdminMutation,
} = pricesAdminApi;
