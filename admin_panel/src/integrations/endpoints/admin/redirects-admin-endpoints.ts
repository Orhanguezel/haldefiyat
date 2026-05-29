// =============================================================
// FILE: src/integrations/endpoints/admin/redirects-admin-endpoints.ts
// Hal — Admin 301/410 redirects + SEO audit (RTK Query)
// =============================================================

import { baseApi } from '@/integrations/base-api';
import {
  REDIRECTS_ADMIN_BASE,
  SEO_AUDIT_ADMIN_BASE,
} from '@/integrations/shared';
import type {
  RedirectInputDto,
  RedirectUpsertResponseDto,
  RedirectsListQueryParams,
  RedirectsListResponseDto,
  SeoAuditResponseDto,
} from '@/integrations/shared';

export const redirectsAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listRedirectsAdmin: build.query<RedirectsListResponseDto, RedirectsListQueryParams | void>({
      query: (params) => ({
        url: REDIRECTS_ADMIN_BASE,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'Redirects' as const, id: 'LIST' }],
    }),

    upsertRedirectsAdmin: build.mutation<
      RedirectUpsertResponseDto,
      RedirectInputDto | { items: RedirectInputDto[] }
    >({
      query: (body) => ({
        url: REDIRECTS_ADMIN_BASE,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Redirects' as const, id: 'LIST' }],
    }),

    updateRedirectAdmin: build.mutation<
      { ok: boolean },
      { id: number; patch: Partial<RedirectInputDto> & { isActive?: number } }
    >({
      query: ({ id, patch }) => ({
        url: `${REDIRECTS_ADMIN_BASE}/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: [{ type: 'Redirects' as const, id: 'LIST' }],
    }),

    deleteRedirectAdmin: build.mutation<{ ok: boolean }, number>({
      query: (id) => ({
        url: `${REDIRECTS_ADMIN_BASE}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Redirects' as const, id: 'LIST' }],
    }),

    getSeoAuditAdmin: build.query<SeoAuditResponseDto, { filter?: 'issues' | 'all' } | void>({
      query: (params) => ({
        url: SEO_AUDIT_ADMIN_BASE,
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'SeoAudit' as const, id: 'LIST' }],
    }),
  }),
});

export const {
  useListRedirectsAdminQuery,
  useUpsertRedirectsAdminMutation,
  useUpdateRedirectAdminMutation,
  useDeleteRedirectAdminMutation,
  useGetSeoAuditAdminQuery,
} = redirectsAdminApi;
