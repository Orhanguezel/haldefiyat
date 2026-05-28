import { baseApi } from '@/integrations/base-api';

export interface AuditWidgetEmbedderDto {
  host: string;
  hits: number;
  uniqueIps: number;
  lastSeen: string | null;
  internal: boolean;
}

export interface AuditWidgetEmbeddersResponse {
  days: number;
  items: AuditWidgetEmbedderDto[];
}

export interface AuditDataPullerDto {
  ip: string;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  hits: number;
  uniquePaths: number;
  exportHits: number;
  lastSeen: string | null;
  bot: boolean;
}

export interface AuditDataPullersResponse {
  days: number;
  minHits: number;
  items: AuditDataPullerDto[];
}

export type AuditGeoTrafficKind = 'all' | 'human' | 'bot';

export interface AuditGeoCityDto {
  country: string;
  city: string;
  hits: number;
  uniqueIps: number;
  botHits: number;
}

export interface AuditGeoCitiesResponse {
  days: number;
  traffic: AuditGeoTrafficKind;
  items: AuditGeoCityDto[];
}

export const auditConsumersAdminApi = baseApi.injectEndpoints({
  overrideExisting: false,
  endpoints: (build) => ({
    getAuditWidgetEmbeddersAdmin: build.query<AuditWidgetEmbeddersResponse, { days?: number } | void>({
      query: (params) => ({
        url: 'admin/audit/widget-embedders',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'WIDGET_EMBEDDERS' }],
    }),
    getAuditDataPullersAdmin: build.query<AuditDataPullersResponse, { days?: number; min_hits?: number } | void>({
      query: (params) => ({
        url: 'admin/audit/data-pullers',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'DATA_PULLERS' }],
    }),
    getAuditGeoCitiesAdmin: build.query<AuditGeoCitiesResponse, { days?: number; traffic?: AuditGeoTrafficKind } | void>({
      query: (params) => ({
        url: 'admin/audit/geo-cities',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: [{ type: 'AuditMetric' as const, id: 'GEO_CITIES' }],
    }),
  }),
});

export const {
  useGetAuditWidgetEmbeddersAdminQuery,
  useGetAuditDataPullersAdminQuery,
  useGetAuditGeoCitiesAdminQuery,
} = auditConsumersAdminApi;
