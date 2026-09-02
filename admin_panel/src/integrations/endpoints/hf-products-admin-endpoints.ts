import { baseApi } from "@/integrations/base-api";
import { cleanParams } from "@/integrations/shared/api";

export type HfProductItem = {
  id: number;
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
  aliases: string[] | null;
  seoIndex: number | boolean;
  displayName: string | null;
  imageUrl: string | null;
  canonicalSlug: string | null;
  familySlug: string | null;
  dataQuality: number;
  searchVolume: number;
  displayOrder: number;
  isActive: number | boolean;
  gscCategory?: GscIndexCategory | null;
  gscLabel?: string | null;
  hasEditorial?: boolean;
  halMarkets30d?: number;
  borsaMarkets30d?: number;
  action?: HfProductAction;
};

export type HfProductAction =
  | "variant"
  | "indexed"
  | "recrawl_pending"
  | "ready_editorial"
  | "maintenance_pending"
  | "needs_coverage"
  | "seasonal_dry";

export type HfProductPayload = {
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
  aliases?: string[];
  seoIndex?: boolean;
  displayName?: string | null;
  imageUrl?: string | null;
  canonicalSlug?: string | null;
  familySlug?: string | null;
  dataQuality?: number;
  searchVolume?: number;
  displayOrder?: number;
  isActive?: boolean;
};

export type ProductReviewStatus = "pending" | "aliased" | "created" | "rejected";
export type ProductReviewItem = {
  id: number;
  sourceApi: string;
  marketId: number | null;
  marketName: string | null;
  rawName: string;
  normalizedName: string;
  rawCategory: string | null;
  suggestedCategory: string;
  rawUnit: string | null;
  canonicalUnit: string | null;
  matchKey: string | null;
  recordedDate: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string | null;
  reasonCode: "UNKNOWN_PRODUCT" | "UNKNOWN_UNIT";
  status: ProductReviewStatus;
  targetProductId: number | null;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type HfProductEditorialItem = {
  productSlug: string;
  aboutMd: string;
  priceFactorsMd: string;
  seasonMd: string;
  productionRegionMd: string;
  qualityIndicatorsMd: string | null;
  culinaryUsesMd: string | null;
  relatedSlugs: string[];
  source: "manual" | "ai_draft" | "ai_reviewed";
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
};

export type GscIndexCategory = "indexed" | "not_indexed" | "issue" | "unknown";

export type HfProductGsc = {
  url: string;
  checked: boolean;
  verdict: string | null;
  coverageState: string | null;
  lastCrawl: string | null;
  checkedAt: string | null;
  category: GscIndexCategory;
  label: string;
};

export type HfProductGscResult = {
  productId: number;
  slug: string;
  seoIndex: boolean;
  publicUrl: string;
  gsc: HfProductGsc;
};

export type HfGscSummary = {
  total: number;
  indexed: number;
  issue: number;
  realIssue: number;
  /** Google'in son taramasi urunun son degisikliginden ESKI: sayfa duzgun, verdikt bayat. */
  awaitingRecrawl: number;
  expectedExcluded: number;
  lastChecked: string | null;
  running: boolean;
};

export type HfProductEditorialPayload = {
  aboutMd?: string;
  priceFactorsMd?: string;
  seasonMd?: string;
  productionRegionMd?: string;
  qualityIndicatorsMd?: string | null;
  culinaryUsesMd?: string | null;
  relatedSlugs?: string[];
  source?: HfProductEditorialItem["source"];
  reviewedBy?: string | null;
  published?: boolean;
};

export const hfProductsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listHfProductsAdmin: builder.query<
      { items: HfProductItem[] },
      { q?: string; category?: string; isActive?: boolean; seoIndex?: boolean } | undefined
    >({
      query: (params) => ({
        url: "/admin/hal/products",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: "HfProducts" as const, id: "LIST" }],
    }),
    getHfProductAdmin: builder.query<HfProductItem, number | string>({
      query: (id) => ({ url: `/admin/hal/products/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "HfProducts" as const, id }],
    }),
    createHfProductAdmin: builder.mutation<{ ok: boolean; id?: number }, HfProductPayload>({
      query: (body) => ({ url: "/admin/hal/products", method: "POST", body }),
      invalidatesTags: [{ type: "HfProducts" as const, id: "LIST" }],
    }),
    updateHfProductAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: HfProductPayload }>({
      query: ({ id, body }) => ({ url: `/admin/hal/products/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "HfProducts" as const, id: "LIST" },
        { type: "HfProducts" as const, id },
      ],
    }),
    deleteHfProductAdmin: builder.mutation<{ ok: boolean }, number | string>({
      query: (id) => ({ url: `/admin/hal/products/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "HfProducts" as const, id: "LIST" }],
    }),
    getHfProductEditorialAdmin: builder.query<HfProductEditorialItem, number | string>({
      query: (id) => ({ url: `/admin/hal/products/${id}/editorial` }),
      providesTags: (_r, _e, id) => [{ type: "HfProducts" as const, id: `EDITORIAL-${id}` }],
    }),
    updateHfProductEditorialAdmin: builder.mutation<
      { ok: boolean },
      { id: number | string; body: HfProductEditorialPayload }
    >({
      query: ({ id, body }) => ({ url: `/admin/hal/products/${id}/editorial`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "HfProducts" as const, id: `EDITORIAL-${id}` },
        { type: "HfProducts" as const, id },
      ],
    }),
    autocompleteHfProducts: builder.query<
      { items: Pick<HfProductItem, "id" | "slug" | "nameTr" | "unit" | "categorySlug">[] },
      string
    >({
      query: (q) => ({ url: "/admin/hal/products/autocomplete", params: { q } }),
    }),
    mergeHfProductsAdmin: builder.mutation<
      { ok: boolean; master: string; merged: string[] },
      { masterId: number; variantIds: number[] }
    >({
      query: (body) => ({ url: "/admin/hal/products/merge", method: "POST", body }),
      invalidatesTags: [{ type: "HfProducts" as const, id: "LIST" }],
    }),
    getHfGscSummary: builder.query<HfGscSummary, void>({
      query: () => ({ url: "/admin/hal/gsc/summary" }),
      transformResponse: (response: { data: HfGscSummary }) => response.data,
      providesTags: [{ type: "HfProducts" as const, id: "GSC-SUMMARY" }],
    }),
    bulkRefreshHfGsc: builder.mutation<{ ok: boolean; started: boolean }, { limit?: number; force?: boolean } | void>({
      query: (body) => ({ url: "/admin/hal/gsc/bulk-refresh", method: "POST", body: body ?? {} }),
      invalidatesTags: [{ type: "HfProducts" as const, id: "GSC-SUMMARY" }],
    }),
    runHfSeoMaintenance: builder.mutation<
      {
        ok: boolean;
        flippedUp: number;
        flippedUpBorsa: number;
        flippedUpRetail: number;
        flippedUpNiche: number;
        demoted: number;
      },
      void
    >({
      query: () => ({ url: "/admin/hal/products/seo-maintenance", method: "POST", body: {} }),
      invalidatesTags: ["HfProducts"],
    }),
    getHfProductGscAdmin: builder.query<HfProductGscResult, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/hal/products/${id}/gsc` }),
      transformResponse: (response: { data: HfProductGscResult }) => response.data,
      providesTags: (_r, _e, { id }) => [{ type: "HfProducts" as const, id: `GSC-${id}` }],
    }),
    inspectHfProductGscAdmin: builder.mutation<HfProductGscResult, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/hal/products/${id}/gsc/inspect`, method: "POST" }),
      transformResponse: (response: { data: HfProductGscResult }) => response.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "HfProducts" as const, id: `GSC-${id}` }],
    }),
    getMergeSuggestionsAdmin: builder.query<
      {
        count: number;
        clusters: Array<{
          signature: string;
          size: number;
          master: HfProductMergeCandidate;
          variants: HfProductMergeCandidate[];
        }>;
      },
      void
    >({
      query: () => ({ url: "/admin/hal/products/merge-suggestions" }),
      providesTags: [{ type: "HfProducts" as const, id: "SUGGESTIONS" }],
    }),
    listProductReviewQueueAdmin: builder.query<
      {
        items: ProductReviewItem[];
        total: number;
        limit: number;
        offset: number;
        sla: { thresholdHours: number; overdue: number; oldestHours: number };
      },
      | {
          status?: ProductReviewStatus;
          source?: string;
          reason?: "UNKNOWN_PRODUCT" | "UNKNOWN_UNIT";
          q?: string;
          minAgeHours?: number;
          limit?: number;
          offset?: number;
        }
      | undefined
    >({
      query: (params) => ({
        url: "/admin/hal/product-review-queue",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: "HfProducts" as const, id: "REVIEW-QUEUE" }],
    }),
    reviewProductQueueItemAdmin: builder.mutation<
      { ok: boolean; id: number; status: ProductReviewStatus; targetProductId: number | null },
      {
        id: number;
        decision: "alias" | "create" | "reject";
        note: string;
        targetProductId?: number;
        slug?: string;
        nameTr?: string;
        categorySlug?: string;
        unit?: string;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/hal/product-review-queue/${id}/review`, method: "PATCH", body }),
      invalidatesTags: [
        { type: "HfProducts" as const, id: "REVIEW-QUEUE" },
        { type: "HfProducts" as const, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export type HfProductMergeCandidate = {
  id: number;
  slug: string;
  nameTr: string;
  displayName: string | null;
  seoIndex: number;
  dataQuality: number;
  searchVolume: number;
  hal: number;
};

export const {
  useListHfProductsAdminQuery,
  useGetHfProductAdminQuery,
  useCreateHfProductAdminMutation,
  useUpdateHfProductAdminMutation,
  useDeleteHfProductAdminMutation,
  useGetHfProductEditorialAdminQuery,
  useUpdateHfProductEditorialAdminMutation,
  useAutocompleteHfProductsQuery,
  useMergeHfProductsAdminMutation,
  useGetMergeSuggestionsAdminQuery,
  useGetHfProductGscAdminQuery,
  useInspectHfProductGscAdminMutation,
  useGetHfGscSummaryQuery,
  useBulkRefreshHfGscMutation,
  useRunHfSeoMaintenanceMutation,
  useListProductReviewQueueAdminQuery,
  useReviewProductQueueItemAdminMutation,
} = hfProductsAdminApi;
