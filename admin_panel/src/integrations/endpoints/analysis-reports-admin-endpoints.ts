import { baseApi } from '@/integrations/base-api';

export type AnalysisReportStatus = 'draft' | 'published' | 'archived';

export interface AnalysisReportAdmin {
  id: number;
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  yazar: string;
  tarih: string;
  etiketler: string[];
  hafta: string;
  weekStart: string;
  weekEnd: string;
  totalRecords: number;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  imageAlt: string | null;
  authorId: number | null;
  source: 'auto' | 'manual';
  status: AnalysisReportStatus;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AnalysisReportPatch {
  title?: string;
  slug?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  imageAlt?: string | null;
  authorId?: number | null;
  status?: AnalysisReportStatus;
}

export interface AnalysisReportCreate {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  tags?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  imageAlt?: string | null;
  authorId?: number | null;
  status?: AnalysisReportStatus;
}

export const analysisReportsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAnalysisReportsAdmin: builder.query<
      { items: AnalysisReportAdmin[] },
      { status?: AnalysisReportStatus | 'all'; limit?: number } | undefined
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.status) search.set('status', params.status);
        if (params?.limit) search.set('limit', String(params.limit));
        const qs = search.toString();
        return { url: `/admin/analysis/reports${qs ? `?${qs}` : ''}` };
      },
      providesTags: [{ type: 'AnalysisReports' as const, id: 'LIST' }],
    }),
    getAnalysisReportAdmin: builder.query<AnalysisReportAdmin, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/analysis/reports/${id}` }),
      transformResponse: (response: { data: AnalysisReportAdmin }) => response.data,
      providesTags: (_res, _err, { id }) => [{ type: 'AnalysisReports' as const, id }],
    }),
    createAnalysisReportAdmin: builder.mutation<{ data: AnalysisReportAdmin }, AnalysisReportCreate>({
      query: (body) => ({ url: '/admin/analysis/reports', method: 'POST', body }),
      invalidatesTags: [{ type: 'AnalysisReports' as const, id: 'LIST' }],
    }),
    generateAnalysisReportAdmin: builder.mutation<
      { data: AnalysisReportAdmin },
      { week?: string } | undefined
    >({
      query: (body) => ({ url: '/admin/analysis/reports/generate', method: 'POST', body: body ?? {} }),
      invalidatesTags: [{ type: 'AnalysisReports' as const, id: 'LIST' }],
    }),
    updateAnalysisReportAdmin: builder.mutation<
      { data: AnalysisReportAdmin },
      { id: number; patch: AnalysisReportPatch }
    >({
      query: ({ id, patch }) => ({ url: `/admin/analysis/reports/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'AnalysisReports' as const, id: 'LIST' },
        { type: 'AnalysisReports' as const, id },
      ],
    }),
    publishAnalysisReportAdmin: builder.mutation<{ data: AnalysisReportAdmin }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/analysis/reports/${id}/publish`, method: 'POST' }),
      invalidatesTags: [{ type: 'AnalysisReports' as const, id: 'LIST' }],
    }),
    draftAnalysisReportAdmin: builder.mutation<{ data: AnalysisReportAdmin }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/analysis/reports/${id}/draft`, method: 'POST' }),
      invalidatesTags: [{ type: 'AnalysisReports' as const, id: 'LIST' }],
    }),
    archiveAnalysisReportAdmin: builder.mutation<{ data: AnalysisReportAdmin }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/analysis/reports/${id}/archive`, method: 'POST' }),
      invalidatesTags: [{ type: 'AnalysisReports' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAnalysisReportsAdminQuery,
  useGetAnalysisReportAdminQuery,
  useCreateAnalysisReportAdminMutation,
  useGenerateAnalysisReportAdminMutation,
  useUpdateAnalysisReportAdminMutation,
  usePublishAnalysisReportAdminMutation,
  useDraftAnalysisReportAdminMutation,
  useArchiveAnalysisReportAdminMutation,
} = analysisReportsAdminApi;
