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
  seoIndex?: number | boolean;
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
  name?: string;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  citySlug?: string | null;
  districtSlug?: string | null;
  categories?: string[];
  firmType?: FirmAdminItem['firmType'];
  seoIndex?: boolean;
  isActive?: boolean;
  photoUrl?: string | null;
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


export type FirmProduct = {
  id: number;
  productSlug: string | null;
  productName: string;
  note: string | null;
  price: string | null;
  imageUrl: string | null;
  displayOrder: number;
};

export type FirmPriceRow = {
  id: number;
  productSlug: string | null;
  productName: string;
  unit: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  recordedDate: string;
};

export type FirmManageItem = FirmAdminItem & {
  photoUrl: string | null;
  description: string | null;
  products: FirmProduct[];
  prices: FirmPriceRow[];
};

export type FirmPriceHistoryDay = { date: string; items: FirmPriceRow[] };

export type FirmPriceInput = {
  productSlug?: string | null;
  productName: string;
  unit: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  avgPrice: number;
  recordedDate: string;
};

export type FirmProductInput = {
  productSlug?: string | null;
  productName: string;
  note?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
};

export type FirmLeadItem = {
  id: number;
  firmId: number;
  firmName: string;
  firmSlug: string;
  citySlug: string | null;
  status: string;
  dealType: string;
  owner: string | null;
  notes: string | null;
  createdAt: string | null;
};

export type FirmFacetEntry = { key: string; count: number };
export type FirmFacets = {
  cities: FirmFacetEntry[];
  types: FirmFacetEntry[];
  statuses: FirmFacetEntry[];
  claimStatuses: FirmFacetEntry[];
  sources: FirmFacetEntry[];
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
  contractNumber: string | null;
  contractUrl: string | null;
  renewalReminderDays: number;
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
  contractNumber?: string | null;
  contractUrl?: string | null;
  renewalReminderDays?: number;
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

export type FirmAdCampaign = {
  id: number;
  position: string;
  title: string;
  lifecycleStatus: string;
  paymentStatus: string;
  impressions: number;
  clicks: number;
  startAt: string | null;
  endAt: string | null;
};

export type FirmAdCampaignPayload = {
  dealId?: number | null;
  position: string;
  title: string;
  caption?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  tier?: string;
  placement?: FirmSponsorship['placement'];
  placementSlug?: string | null;
  startsAt: string;
  endsAt: string;
  device?: 'all' | 'desktop' | 'mobile';
  desktopRow?: number;
  desktopColumns?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'waived';
  salesOwner?: string | null;
};

export const firmsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listFirmsAdmin: builder.query<FirmsAdminResponse, {
      q?: string; city?: string; type?: string; status?: string;
      claimStatus?: string; source?: string; hasPhone?: 'true' | 'false'; sponsored?: 'true';
      staleDays?: number; sort?: string; limit?: number; offset?: number;
    } | void>({
      query: (params) => ({
        url: '/admin/firms',
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: 'Firms' as const, id: 'LIST' }],
    }),
    replyFirmLeadAdmin: builder.mutation<
      { ok: boolean; to: string },
      { dealId: number; body: { subject: string; message: string; replyTo?: string | null } }
    >({
      query: ({ dealId, body }) => ({ url: `/admin/firms/leads/${dealId}/reply`, method: 'POST', body }),
      invalidatesTags: [{ type: 'Firms' as const, id: 'LEADS' }],
    }),
    listFirmLeadsAdmin: builder.query<
      { items: FirmLeadItem[]; meta: { total: number; limit: number; offset: number } },
      { status?: string; limit?: number; offset?: number } | void
    >({
      query: (params) => ({ url: '/admin/firms/leads', params: cleanParams(params as Record<string, unknown> | undefined) }),
      providesTags: [{ type: 'Firms' as const, id: 'LEADS' }],
    }),
    getFirmManage: builder.query<{ item: FirmManageItem }, { firmId: number }>({
      query: ({ firmId }) => ({ url: `/firms/${firmId}/manage` }),
      providesTags: (_r, _e, arg) => [{ type: 'Firms' as const, id: `MANAGE-${arg.firmId}` }],
    }),
    getFirmPriceHistory: builder.query<{ days: number; items: FirmPriceHistoryDay[] }, { firmId: number; days?: number }>({
      query: ({ firmId, days }) => ({ url: `/firms/${firmId}/price-history`, params: days ? { days } : undefined }),
      providesTags: (_r, _e, arg) => [{ type: 'Firms' as const, id: `HISTORY-${arg.firmId}` }],
    }),
    createFirmProductAdmin: builder.mutation<{ id: number }, { firmId: number; body: FirmProductInput }>({
      query: ({ firmId, body }) => ({ url: `/firms/${firmId}/products`, method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Firms' as const, id: `MANAGE-${arg.firmId}` }],
    }),
    updateFirmProductAdmin: builder.mutation<{ ok: boolean }, { firmId: number; productId: number; body: Partial<FirmProductInput> }>({
      query: ({ firmId, productId, body }) => ({ url: `/firms/${firmId}/products/${productId}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Firms' as const, id: `MANAGE-${arg.firmId}` }],
    }),
    deleteFirmProductAdmin: builder.mutation<{ ok: boolean }, { firmId: number; productId: number }>({
      query: ({ firmId, productId }) => ({ url: `/firms/${firmId}/products/${productId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Firms' as const, id: `MANAGE-${arg.firmId}` }],
    }),
    upsertFirmPriceAdmin: builder.mutation<{ id: number }, { firmId: number; body: FirmPriceInput }>({
      query: ({ firmId, body }) => ({ url: `/firms/${firmId}/prices`, method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Firms' as const, id: `MANAGE-${arg.firmId}` },
        { type: 'Firms' as const, id: `HISTORY-${arg.firmId}` },
      ],
    }),
    deleteFirmPriceAdmin: builder.mutation<{ ok: boolean }, { firmId: number; priceId: number }>({
      query: ({ firmId, priceId }) => ({ url: `/firms/${firmId}/prices/${priceId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'Firms' as const, id: `MANAGE-${arg.firmId}` },
        { type: 'Firms' as const, id: `HISTORY-${arg.firmId}` },
      ],
    }),
    uploadFirmImage: builder.mutation<{ url: string }, { file: File }>({
      query: ({ file }) => {
        const form = new FormData();
        form.append('file', file);
        return { url: '/storage/firms/upload', method: 'POST', body: form };
      },
    }),
    getFirmAdmin: builder.query<{ item: FirmAdminItem }, { firmId: number }>({
      query: ({ firmId }) => ({ url: `/admin/firms/${firmId}` }),
      providesTags: (_r, _e, arg) => [{ type: 'Firms' as const, id: arg.firmId }],
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
    clearFirmContactsAdmin: builder.mutation<{ ok: boolean }, { firmId: number }>({
      query: ({ firmId }) => ({ url: `/admin/firms/${firmId}/clear-contacts`, method: 'POST' }),
      invalidatesTags: [{ type: 'Firms' as const, id: 'LIST' }],
    }),
    moderateFirmClaimAdmin: builder.mutation<{ item: FirmClaimAdminItem }, { claimId: number; status: 'approved' | 'rejected' }>({
      query: ({ claimId, status }) => ({ url: `/admin/firms/claims/${claimId}/moderate`, method: 'POST', body: { status } }),
      invalidatesTags: [{ type: 'Firms' as const, id: 'CLAIMS' }, { type: 'Firms' as const, id: 'LIST' }],
    }),
    getFirmFacetsAdmin: builder.query<FirmFacets, void>({
      query: () => ({ url: '/admin/firms/facets' }),
      providesTags: [{ type: 'Firms' as const, id: 'FACETS' }],
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
    listFirmAdCampaignsAdmin: builder.query<{ items: FirmAdCampaign[]; summary: { impressions: number; clicks: number } }, number>({
      query: (firmId) => ({ url: `/admin/firms/${firmId}/ad-campaigns` }),
      providesTags: (_r, _e, firmId) => [{ type: 'Firms' as const, id: `ADS-${firmId}` }],
    }),
    createFirmAdCampaignAdmin: builder.mutation<{ id: number; bannerId: number; sponsorshipId: number }, { firmId: number; body: FirmAdCampaignPayload }>({
      query: ({ firmId, body }) => ({ url: `/admin/firms/${firmId}/ad-campaigns`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { firmId }) => [
        { type: 'Firms' as const, id: `ADS-${firmId}` },
        { type: 'Firms' as const, id: `SPONSOR-${firmId}` },
        { type: 'Firms' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListFirmsAdminQuery,
  useReplyFirmLeadAdminMutation,
  useListFirmLeadsAdminQuery,
  useGetFirmManageQuery,
  useGetFirmPriceHistoryQuery,
  useCreateFirmProductAdminMutation,
  useUpdateFirmProductAdminMutation,
  useDeleteFirmProductAdminMutation,
  useUpsertFirmPriceAdminMutation,
  useDeleteFirmPriceAdminMutation,
  useUploadFirmImageMutation,
  useGetFirmAdminQuery,
  useUpdateFirmAdminMutation,
  useClearFirmContactsAdminMutation,
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
  useListFirmAdCampaignsAdminQuery,
  useCreateFirmAdCampaignAdminMutation,
  useGetFirmFacetsAdminQuery,
} = firmsAdminApi;
