// =============================================================
// FILE: src/integrations/endpoints/admin/audit-admin-endpoints.ts
// Ensotek – Admin Audit (RTK Query)
// FIX:
//  - List endpoints return { items, total }
//  - Daily endpoint returns { days, ...meta }
// =============================================================

import { baseApi } from '@/integrations/base-api';
import {
  AUDIT_ADMIN_BASE,
  coerceAuditList,
  coerceAuditMetricsDaily,
  coerceAuditGeoStats,
} from '@/integrations/shared';
import type {
  AuditAuthEventDto,
  AuditAuthEventsListQueryParams,
  AuditListResponse,
  AuditMetricsDailyQueryParams,
  AuditMetricsDailyResponseDto,
  AuditRequestLogDto,
  AuditRequestLogsListQueryParams,
  AuditGeoStatsQueryParams,
  AuditGeoStatsResponseDto,
  ClearAuditResponse,
  ClearAuditTarget,
} from '@/integrations/shared';

export const auditAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    listAuditRequestLogsAdmin: build.query<
      AuditListResponse<AuditRequestLogDto>,
      AuditRequestLogsListQueryParams | void
    >({
      query: (params) => ({
        url: `${AUDIT_ADMIN_BASE}/request-logs`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditList<AuditRequestLogDto>(raw),
      providesTags: [{ type: 'AuditRequestLog' as const, id: 'LIST' }],
    }),

    listAuditAuthEventsAdmin: build.query<
      AuditListResponse<AuditAuthEventDto>,
      AuditAuthEventsListQueryParams | void
    >({
      query: (params) => ({
        url: `${AUDIT_ADMIN_BASE}/auth-events`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditList<AuditAuthEventDto>(raw),
      providesTags: [{ type: 'AuditAuthEvent' as const, id: 'LIST' }],
    }),

    getAuditMetricsDailyAdmin: build.query<
      AuditMetricsDailyResponseDto,
      AuditMetricsDailyQueryParams | void
    >({
      query: (params) => ({
        url: `${AUDIT_ADMIN_BASE}/metrics/daily`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditMetricsDaily(raw),
      providesTags: [{ type: 'AuditMetric' as const, id: 'DAILY' }],
    }),

    getAuditGeoStatsAdmin: build.query<
      AuditGeoStatsResponseDto,
      AuditGeoStatsQueryParams | void
    >({
      query: (params) => ({
        url: `${AUDIT_ADMIN_BASE}/geo-stats`,
        method: 'GET',
        params: params ?? undefined,
      }),
      transformResponse: (raw: any) => coerceAuditGeoStats(raw),
      providesTags: [{ type: 'AuditMetric' as const, id: 'GEO' }],
    }),

    clearAuditLogsAdmin: build.mutation<ClearAuditResponse, { target?: ClearAuditTarget }>({
      query: ({ target = 'all' }) => ({
        url: `${AUDIT_ADMIN_BASE}/clear?target=${encodeURIComponent(target)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'AuditRequestLog' as const, id: 'LIST' },
        { type: 'AuditAuthEvent' as const, id: 'LIST' },
        { type: 'AuditMetric' as const, id: 'DAILY' },
        { type: 'AuditMetric' as const, id: 'GEO' },
      ],
    }),
  }),
});

export const {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditMetricsDailyAdminQuery,
  useGetAuditGeoStatsAdminQuery,
  useClearAuditLogsAdminMutation,
} = auditAdminApi;
