import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type AlertAdminItem = {
  id: number;
  productId: number;
  marketId: number | null;
  thresholdPrice: string | null;
  direction: 'above' | 'below';
  contactEmail: string | null;
  contactTelegram: string | null;
  isActive: number | boolean;
  lastTriggered: string | null;
  createdAt: string;
  productSlug: string;
  productName: string;
  marketSlug: string | null;
  marketName: string | null;
};

export const alertsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAlertsAdmin: builder.query<{ items: AlertAdminItem[] }, { productSlug?: string; isActive?: boolean; limit?: number } | void>({
      query: (params) => ({
        url: '/admin/hal/alerts',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Alerts' as const, id: 'LIST' }],
    }),
    updateAlertAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: { isActive?: boolean } }>({
      query: ({ id, body }) => ({ url: `/admin/hal/alerts/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Alerts' as const, id: 'LIST' }, { type: 'Alerts' as const, id }],
    }),
    deleteAlertAdmin: builder.mutation<{ ok: boolean }, number | string>({
      query: (id) => ({ url: `/admin/hal/alerts/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Alerts' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAlertsAdminQuery,
  useUpdateAlertAdminMutation,
  useDeleteAlertAdminMutation,
} = alertsAdminApi;
