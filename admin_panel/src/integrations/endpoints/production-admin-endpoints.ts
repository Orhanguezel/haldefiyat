import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type ProductionAdminItem = {
  id: number;
  year: number;
  species: string;
  speciesSlug: string;
  categorySlug: string;
  regionSlug: string;
  productionTon: string;
  sourceApi: string;
  note: string | null;
};

export type ProductionAdminPayload = {
  year: number;
  species: string;
  speciesSlug: string;
  categorySlug: string;
  regionSlug: string;
  productionTon: number;
  sourceApi: string;
  note?: string | null;
};

export const productionAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProductionAdmin: builder.query<{ items: ProductionAdminItem[] }, { species?: string; region?: string; category?: string; yearFrom?: number; yearTo?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/admin/hal/production',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Production' as const, id: 'LIST' }],
    }),
    getProductionAdmin: builder.query<ProductionAdminItem, number | string>({
      query: (id) => ({ url: `/admin/hal/production/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'Production' as const, id }],
    }),
    createProductionAdmin: builder.mutation<{ ok: boolean; id?: number }, ProductionAdminPayload>({
      query: (body) => ({ url: '/admin/hal/production', method: 'POST', body }),
      invalidatesTags: [{ type: 'Production' as const, id: 'LIST' }],
    }),
    updateProductionAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: ProductionAdminPayload }>({
      query: ({ id, body }) => ({ url: `/admin/hal/production/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Production' as const, id: 'LIST' }, { type: 'Production' as const, id }],
    }),
    deleteProductionAdmin: builder.mutation<{ ok: boolean }, number | string>({
      query: (id) => ({ url: `/admin/hal/production/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Production' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProductionAdminQuery,
  useGetProductionAdminQuery,
  useCreateProductionAdminMutation,
  useUpdateProductionAdminMutation,
  useDeleteProductionAdminMutation,
} = productionAdminApi;
