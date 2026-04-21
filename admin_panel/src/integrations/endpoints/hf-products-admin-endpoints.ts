import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type HfProductItem = {
  id: number;
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
  aliases: string[] | null;
  displayOrder: number;
  isActive: number | boolean;
};

export type HfProductPayload = {
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
  aliases?: string[];
  displayOrder?: number;
  isActive?: boolean;
};

export const hfProductsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listHfProductsAdmin: builder.query<{ items: HfProductItem[] }, { q?: string; category?: string; isActive?: boolean } | void>({
      query: (params) => ({
        url: '/admin/hal/products',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'HfProducts' as const, id: 'LIST' }],
    }),
    getHfProductAdmin: builder.query<HfProductItem, number | string>({
      query: (id) => ({ url: `/admin/hal/products/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'HfProducts' as const, id }],
    }),
    createHfProductAdmin: builder.mutation<{ ok: boolean; id?: number }, HfProductPayload>({
      query: (body) => ({ url: '/admin/hal/products', method: 'POST', body }),
      invalidatesTags: [{ type: 'HfProducts' as const, id: 'LIST' }],
    }),
    updateHfProductAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: HfProductPayload }>({
      query: ({ id, body }) => ({ url: `/admin/hal/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'HfProducts' as const, id: 'LIST' }, { type: 'HfProducts' as const, id }],
    }),
    deleteHfProductAdmin: builder.mutation<{ ok: boolean }, number | string>({
      query: (id) => ({ url: `/admin/hal/products/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'HfProducts' as const, id: 'LIST' }],
    }),
    autocompleteHfProducts: builder.query<{ items: Pick<HfProductItem, 'id' | 'slug' | 'nameTr' | 'unit' | 'categorySlug'>[] }, string>({
      query: (q) => ({ url: '/admin/hal/products/autocomplete', params: { q } }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListHfProductsAdminQuery,
  useGetHfProductAdminQuery,
  useCreateHfProductAdminMutation,
  useUpdateHfProductAdminMutation,
  useDeleteHfProductAdminMutation,
  useAutocompleteHfProductsQuery,
} = hfProductsAdminApi;
