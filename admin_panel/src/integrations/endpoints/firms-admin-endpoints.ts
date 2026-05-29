import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type FirmAdminItem = {
  id: number;
  externalId: string;
  slug: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  citySlug: string | null;
  districtSlug: string | null;
  photoUrl: string | null;
  sourceUrl: string;
  firmType: 'komisyoncu' | 'soguk_hava' | 'nakliye' | 'zirai_ilac';
  categories: string[] | null;
  isActive: number | boolean;
  lastSeenAt: string | null;
  sponsorshipTier?: string | null;
};

export type FirmSummary = {
  total: number;
  active: number;
  stale: number;
  activeSponsorships: number;
  dealsByStatus: Record<string, number>;
};

export type FirmsAdminResponse = {
  items: FirmAdminItem[];
  meta: { total: number; limit: number; offset: number };
  summary: FirmSummary;
};

export type FirmEtlRunBody = {
  city?: string;
  type?: FirmAdminItem['firmType'] | 'all';
  dryRun?: boolean;
  limit?: number;
  delayMs?: number;
  includeDetails?: boolean;
};

export type FirmEtlRunResult = {
  dryRun?: boolean;
  discovered: number;
  fetched?: number;
  inserted?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  first?: FirmAdminItem[];
};

export const firmsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFirmsAdmin: builder.query<FirmsAdminResponse, { q?: string; city?: string; type?: string; limit?: number; offset?: number } | void>({
      query: (params) => ({
        url: '/admin/firms',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Firms' as const, id: 'LIST' }],
    }),
    listStaleFirmsAdmin: builder.query<{ items: FirmAdminItem[] }, { days?: number } | void>({
      query: (params) => ({
        url: '/admin/firms/stale',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Firms' as const, id: 'STALE' }],
    }),
    runFirmsEtlAdmin: builder.mutation<FirmEtlRunResult, FirmEtlRunBody>({
      query: (body) => ({ url: '/admin/firms/etl/run', method: 'POST', body }),
      invalidatesTags: [{ type: 'Firms' as const, id: 'LIST' }, { type: 'Firms' as const, id: 'STALE' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFirmsAdminQuery,
  useListStaleFirmsAdminQuery,
  useRunFirmsEtlAdminMutation,
} = firmsAdminApi;
