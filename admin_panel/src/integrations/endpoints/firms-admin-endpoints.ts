import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared/api';

export type FirmAdminItem = {
  id: number;
  externalId: string;
  slug: string;
  name: string;
  ownerUserId?: string | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  citySlug: string | null;
  districtSlug: string | null;
  photoUrl: string | null;
  sourceUrl: string;
  source?: 'halkatalogu' | 'user';
  status?: 'pending' | 'approved' | 'rejected';
  description?: string | null;
  claimStatus?: 'unclaimed' | 'pending' | 'verified';
  firmType: 'komisyoncu' | 'soguk_hava' | 'nakliye' | 'zirai_ilac';
  categories: string[] | null;
  isActive: number | boolean;
  lastSeenAt: string | null;
  sponsorshipTier?: string | null;
};

export type FirmClaimAdminItem = {
  id: number;
  firmId: number;
  userId: string;
  evidence: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string | null;
  firmName?: string | null;
  firmSlug?: string | null;
};

export type FirmAdminPatchPayload = {
  status?: FirmAdminItem['status'];
  claimStatus?: FirmAdminItem['claimStatus'];
  ownerUserId?: string | null;
  description?: string | null;
};

export type FirmSummary = {
  total: number;
  active: number;
  stale: number;
  activeSponsorships: number;
  wonValue: number;
  pipelineValue: number;
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

export type FirmDeal = {
  id: number;
  firmId: number;
  status: 'lead' | 'contacted' | 'negotiating' | 'won' | 'lost';
  dealType: 'reklam' | 'sponsorluk' | 'premium' | 'diger';
  value: string | null;
  currency: string;
  owner: string | null;
  notes: string | null;
  contactedAt: string | null;
  nextActionAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FirmDealPayload = {
  status?: FirmDeal['status'];
  dealType?: FirmDeal['dealType'];
  value?: number | null;
  currency?: string;
  owner?: string | null;
  notes?: string | null;
  contactedAt?: string | null;
  nextActionAt?: string | null;
};

export type FirmSponsorship = {
  id: number;
  firmId: number;
  tier: string;
  placement: 'il' | 'kategori' | 'global';
  placementSlug: string | null;
  startsAt: string;
  endsAt: string;
  isActive: number | boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FirmSponsorshipPayload = {
  firmId: number;
  tier?: string;
  placement?: FirmSponsorship['placement'];
  placementSlug?: string | null;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
};

export const firmsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFirmsAdmin: builder.query<FirmsAdminResponse, { q?: string; city?: string; type?: string; status?: string; limit?: number; offset?: number } | void>({
      query: (params) => ({
        url: '/admin/firms',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Firms' as const, id: 'LIST' }],
    }),
    updateFirmAdmin: builder.mutation<{ item: FirmAdminItem }, { firmId: number; body: FirmAdminPatchPayload }>({
      query: ({ firmId, body }) => ({ url: `/admin/firms/${firmId}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Firms' as const, id: 'LIST' }],
    }),
    listFirmClaimsAdmin: builder.query<{ items: FirmClaimAdminItem[] }, { status?: string } | void>({
      query: (params) => ({
        url: '/admin/firms/claims',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Firms' as const, id: 'CLAIMS' }],
    }),
    moderateFirmClaimAdmin: builder.mutation<{ item: FirmClaimAdminItem }, { claimId: number; status: 'approved' | 'rejected' }>({
      query: ({ claimId, status }) => ({ url: `/admin/firms/claims/${claimId}/moderate`, method: 'POST', body: { status } }),
      invalidatesTags: [{ type: 'Firms' as const, id: 'CLAIMS' }, { type: 'Firms' as const, id: 'LIST' }],
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
    listFirmDealsAdmin: builder.query<{ items: FirmDeal[] }, number>({
      query: (firmId) => ({ url: `/admin/firms/${firmId}/deals` }),
      providesTags: (_r, _e, firmId) => [{ type: 'Firms' as const, id: `DEALS-${firmId}` }],
    }),
    createFirmDealAdmin: builder.mutation<{ id: number }, { firmId: number; body: FirmDealPayload }>({
      query: ({ firmId, body }) => ({ url: `/admin/firms/${firmId}/deals`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { firmId }) => [{ type: 'Firms' as const, id: `DEALS-${firmId}` }, { type: 'Firms' as const, id: 'LIST' }],
    }),
    updateFirmDealAdmin: builder.mutation<{ ok: boolean }, { dealId: number; firmId: number; body: FirmDealPayload }>({
      query: ({ dealId, body }) => ({ url: `/admin/firms/deals/${dealId}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { firmId }) => [{ type: 'Firms' as const, id: `DEALS-${firmId}` }, { type: 'Firms' as const, id: 'LIST' }],
    }),
    deleteFirmDealAdmin: builder.mutation<{ ok: boolean }, { dealId: number; firmId: number }>({
      query: ({ dealId }) => ({ url: `/admin/firms/deals/${dealId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { firmId }) => [{ type: 'Firms' as const, id: `DEALS-${firmId}` }, { type: 'Firms' as const, id: 'LIST' }],
    }),
    listFirmSponsorshipsAdmin: builder.query<{ items: FirmSponsorship[] }, number>({
      query: (firmId) => ({ url: `/admin/firms/${firmId}/sponsorships` }),
      providesTags: (_r, _e, firmId) => [{ type: 'Firms' as const, id: `SPONSOR-${firmId}` }],
    }),
    createFirmSponsorshipAdmin: builder.mutation<{ id: number }, FirmSponsorshipPayload>({
      query: (body) => ({ url: '/admin/firms/sponsorships', method: 'POST', body }),
      invalidatesTags: (_r, _e, body) => [{ type: 'Firms' as const, id: `SPONSOR-${body.firmId}` }, { type: 'Firms' as const, id: 'LIST' }],
    }),
    updateFirmSponsorshipAdmin: builder.mutation<{ ok: boolean }, { sponsorshipId: number; firmId: number; body: Partial<FirmSponsorshipPayload> }>({
      query: ({ sponsorshipId, body }) => ({ url: `/admin/firms/sponsorships/${sponsorshipId}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { firmId }) => [{ type: 'Firms' as const, id: `SPONSOR-${firmId}` }, { type: 'Firms' as const, id: 'LIST' }],
    }),
    deleteFirmSponsorshipAdmin: builder.mutation<{ ok: boolean }, { sponsorshipId: number; firmId: number }>({
      query: ({ sponsorshipId }) => ({ url: `/admin/firms/sponsorships/${sponsorshipId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { firmId }) => [{ type: 'Firms' as const, id: `SPONSOR-${firmId}` }, { type: 'Firms' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFirmsAdminQuery,
  useUpdateFirmAdminMutation,
  useListFirmClaimsAdminQuery,
  useModerateFirmClaimAdminMutation,
  useListStaleFirmsAdminQuery,
  useRunFirmsEtlAdminMutation,
  useListFirmDealsAdminQuery,
  useCreateFirmDealAdminMutation,
  useUpdateFirmDealAdminMutation,
  useDeleteFirmDealAdminMutation,
  useListFirmSponsorshipsAdminQuery,
  useCreateFirmSponsorshipAdminMutation,
  useUpdateFirmSponsorshipAdminMutation,
  useDeleteFirmSponsorshipAdminMutation,
} = firmsAdminApi;
