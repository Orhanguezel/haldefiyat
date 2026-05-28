import { baseApi } from '@/integrations/base-api';
import {
  API_KEYS_ADMIN_BASE,
  normalizeAdminApiKeysResponse,
  type AdminApiKeysResponse,
  type AdminSetApiKeyTierInput,
  type AdminSetApiKeyTierResponse,
} from '@/integrations/shared';

export const apiKeysAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    adminListApiKeys: build.query<AdminApiKeysResponse, void>({
      query: () => ({
        url: API_KEYS_ADMIN_BASE,
        method: 'GET',
      }),
      transformResponse: (raw: unknown) => normalizeAdminApiKeysResponse(raw),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((key) => ({ type: 'ApiKey' as const, id: key.id })),
              { type: 'ApiKeys' as const, id: 'LIST' },
            ]
          : [{ type: 'ApiKeys' as const, id: 'LIST' }],
    }),

    adminSetApiKeyTier: build.mutation<AdminSetApiKeyTierResponse, AdminSetApiKeyTierInput>({
      query: ({ id, tier }) => ({
        url: `${API_KEYS_ADMIN_BASE}/${id}/tier`,
        method: 'POST',
        body: { tier },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ApiKey' as const, id },
        { type: 'ApiKeys' as const, id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useAdminListApiKeysQuery,
  useAdminSetApiKeyTierMutation,
} = apiKeysAdminApi;

