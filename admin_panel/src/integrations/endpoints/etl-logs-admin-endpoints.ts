import { baseApi } from '@/integrations/base-api';

export type EtlLogItem = {
  id: number;
  sourceApi: string;
  runDate: string;
  rowsFetched: number;
  rowsInserted: number;
  rowsSkipped: number;
  durationMs: number | null;
  status: 'ok' | 'partial' | 'error';
  errorMsg: string | null;
  createdAt: string;
};

export const etlLogsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listEtlLogsAdmin: builder.query<{ logs: EtlLogItem[] }, void>({
      query: () => ({ url: '/admin/hal/etl/logs' }),
      providesTags: [{ type: 'EtlLogs' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useListEtlLogsAdminQuery } = etlLogsAdminApi;
