// =============================================================
// FILE: src/integrations/endpoints/admin/custom-pages-admin-endpoints.ts
// =============================================================
import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared';
import type {
  CustomPageCreatePayload,
  CustomPageDto,
  CustomPageListQueryParams,
  CustomPageReorderPayload,
  CustomPageUpdatePayload,
} from '@/integrations/shared';

export const customPagesAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/custom-pages
    listCustomPagesAdmin: b.query<CustomPageDto[], CustomPageListQueryParams | void>({
      query: (params) => ({
        url: '/admin/custom-pages',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'CustomPages' as const, id: 'LIST' }],
    }),

    // GET /admin/custom-pages/:id
    getCustomPageAdmin: b.query<CustomPageDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/custom-pages/${encodeURIComponent(id)}`,
        params: cleanParams(locale ? { locale } : undefined),
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'CustomPages' as const, id }],
    }),

    // POST /admin/custom-pages
    createCustomPageAdmin: b.mutation<CustomPageDto, CustomPageCreatePayload>({
      query: (body) => ({ url: '/admin/custom-pages', method: 'POST', body }),
      invalidatesTags: [{ type: 'CustomPages' as const, id: 'LIST' }],
    }),

    // PATCH /admin/custom-pages/:id
    updateCustomPageAdmin: b.mutation<CustomPageDto, { id: string; patch: CustomPageUpdatePayload }>({
      query: ({ id, patch }) => ({
        url: `/admin/custom-pages/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'CustomPages' as const, id: 'LIST' },
        { type: 'CustomPages' as const, id },
      ],
    }),

    // DELETE /admin/custom-pages/:id
    deleteCustomPageAdmin: b.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/custom-pages/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'CustomPages' as const, id: 'LIST' }],
    }),

    // POST /admin/custom-pages/reorder
    reorderCustomPagesAdmin: b.mutation<{ ok: boolean }, CustomPageReorderPayload>({
      query: (body) => ({ url: '/admin/custom-pages/reorder', method: 'POST', body }),
      invalidatesTags: [{ type: 'CustomPages' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListCustomPagesAdminQuery,
  useGetCustomPageAdminQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  useReorderCustomPagesAdminMutation,
} = customPagesAdminApi;
