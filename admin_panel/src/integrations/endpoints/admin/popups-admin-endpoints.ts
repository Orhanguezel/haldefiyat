// =============================================================
// FILE: src/integrations/endpoints/admin/popups-admin-endpoints.ts
// =============================================================
import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared';
import type {
  PopupDto,
  PopupListQueryParams,
  PopupCreatePayload,
  PopupUpdatePayload,
  PopupReorderPayload,
  PopupSetStatusPayload,
} from '@/integrations/shared';

const B = '/admin/popups';

export const popupsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/popups
    listPopupsAdmin: b.query<PopupDto[], PopupListQueryParams | void>({
      query: (params) => ({
        url: B,
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Popups' as const, id: 'LIST' }],
    }),

    // GET /admin/popups/:id
    getPopupAdmin: b.query<PopupDto, { id: number; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `${B}/${id}`,
        params: cleanParams(locale ? { locale } : undefined),
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Popups' as const, id }],
    }),

    // POST /admin/popups
    createPopupAdmin: b.mutation<PopupDto, PopupCreatePayload>({
      query: (body) => ({ url: B, method: 'POST', body }),
      invalidatesTags: [{ type: 'Popups' as const, id: 'LIST' }],
    }),

    // PATCH /admin/popups/:id
    updatePopupAdmin: b.mutation<PopupDto, { id: number; patch: PopupUpdatePayload }>({
      query: ({ id, patch }) => ({ url: `${B}/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Popups' as const, id: 'LIST' },
        { type: 'Popups' as const, id },
      ],
    }),

    // DELETE /admin/popups/:id
    deletePopupAdmin: b.mutation<void, number>({
      query: (id) => ({ url: `${B}/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Popups' as const, id: 'LIST' }],
    }),

    // POST /admin/popups/reorder
    reorderPopupsAdmin: b.mutation<void, PopupReorderPayload>({
      query: (body) => ({ url: `${B}/reorder`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Popups' as const, id: 'LIST' }],
    }),

    // PATCH /admin/popups/:id/status
    setPopupStatusAdmin: b.mutation<void, { id: number; body: PopupSetStatusPayload }>({
      query: ({ id, body }) => ({ url: `${B}/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Popups' as const, id: 'LIST' },
        { type: 'Popups' as const, id },
      ],
    }),
  }),
});

export const {
  useListPopupsAdminQuery,
  useGetPopupAdminQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
  useReorderPopupsAdminMutation,
  useSetPopupStatusAdminMutation,
} = popupsAdminApi;
