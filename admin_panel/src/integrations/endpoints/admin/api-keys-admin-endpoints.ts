import { baseApi } from '@/integrations/base-api';
import {
  API_KEYS_ADMIN_BASE,
  normalizeAdminApiKeyDailyUsageResponse,
  normalizeAdminApiKeysResponse,
  type AdminApiKeyDailyUsageResponse,
  type AdminApiKeysResponse,
  type AdminRevokeApiKeyInput,
  type AdminRevokeApiKeyResponse,
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

    adminRevokeApiKey: build.mutation<AdminRevokeApiKeyResponse, AdminRevokeApiKeyInput>({
      query: ({ id }) => ({
        url: `${API_KEYS_ADMIN_BASE}/${id}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'ApiKey' as const, id },
        { type: 'ApiKeys' as const, id: 'LIST' },
      ],
    }),

    adminGetApiKeyDailyUsage: build.query<AdminApiKeyDailyUsageResponse, { days?: number } | void>({
      query: (params) => ({
        url: `${API_KEYS_ADMIN_BASE}/daily-usage`,
        method: 'GET',
        params: { days: params?.days ?? 14 },
      }),
      transformResponse: (raw: unknown) => normalizeAdminApiKeyDailyUsageResponse(raw),
      providesTags: [{ type: 'ApiKeys' as const, id: 'DAILY_USAGE' }],
    }),
  }),
});

export const {
  useAdminListApiKeysQuery,
  useAdminGetApiKeyDailyUsageQuery,
  useAdminRevokeApiKeyMutation,
  useAdminSetApiKeyTierMutation,
} = apiKeysAdminApi;
