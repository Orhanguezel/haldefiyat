import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type MarketAdminItem = {
  id: number;
  slug: string;
  name: string;
  cityName: string;
  regionSlug: string | null;
  sourceKey: string | null;
  displayOrder: number;
  isActive: number | boolean;
};

export type MarketAdminPayload = {
  slug: string;
  name: string;
  cityName: string;
  regionSlug?: string | null;
  sourceKey?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export const marketsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listMarketsAdmin: builder.query<{ items: MarketAdminItem[] }, { q?: string; city?: string; isActive?: boolean } | void>({
      query: (params) => ({
        url: '/admin/hal/markets',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Markets' as const, id: 'LIST' }],
    }),
    getMarketAdmin: builder.query<MarketAdminItem, number | string>({
      query: (id) => ({ url: `/admin/hal/markets/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Markets' as const, id }],
    }),
    createMarketAdmin: builder.mutation<{ ok: boolean; id?: number }, MarketAdminPayload>({
      query: (body) => ({ url: '/admin/hal/markets', method: 'POST', body }),
      invalidatesTags: [{ type: 'Markets' as const, id: 'LIST' }],
    }),
    updateMarketAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: MarketAdminPayload }>({
      query: ({ id, body }) => ({ url: `/admin/hal/markets/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Markets' as const, id: 'LIST' }, { type: 'Markets' as const, id }],
    }),
    deleteMarketAdmin: builder.mutation<{ ok: boolean }, number | string>({
      query: (id) => ({ url: `/admin/hal/markets/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Markets' as const, id: 'LIST' }],
    }),
    autocompleteMarkets: builder.query<{ items: Pick<MarketAdminItem, 'id' | 'slug' | 'name' | 'cityName'>[] }, string>({
      query: (q) => ({ url: '/admin/hal/markets/autocomplete', params: { q } }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListMarketsAdminQuery,
  useGetMarketAdminQuery,
  useCreateMarketAdminMutation,
  useUpdateMarketAdminMutation,
  useDeleteMarketAdminMutation,
  useAutocompleteMarketsQuery,
} = marketsAdminApi;
