import { baseApi } from "@/integrations/base-api";
import { cleanParams } from "@/integrations/shared/api";

export type PriceAdminItem = {
  id: number;
  productId: number;
  marketId: number;
  productSlug: string;
  productName: string;
  productNameTr?: string;
  productUnit?: string;
  productImage?: string | null;
  canonicalSlug?: string | null;
  categorySlug?: string;
  productActive?: boolean;
  marketSlug: string;
  marketName: string;
  marketType?: string;
  marketActive?: boolean;
  cityName: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  avgPriceMethod?: string;
  currency?: string;
  unit?: string;
  recordedDate: string;
  sourceApi: string;
  createdAt?: string | null;
  unitMismatch?: boolean;
  quarantined?: boolean;
  quarantineReason?: string | null;
  quarantineSeverity?: string | null;
};

export type PriceHistoryPoint = {
  id: number; recordedDate: string; minPrice: string | null; avgPrice: string;
  maxPrice: string | null; unit: string; sourceApi: string; avgPriceMethod: string;
};

export type PricePeerRow = {
  id: number; avgPrice: string; minPrice: string | null; maxPrice: string | null;
  unit: string; sourceApi: string; recordedDate: string;
  marketName: string; cityName: string; marketSlug: string;
};

export type PriceQuarantineTrace = {
  id: number; recordedDate: string; reasonCode: string; severity: string; status: string;
  avgPrice: string; peerMedian: string | null; deviationRatio: string | null;
  reviewNote: string | null; reviewedAt: string | null; createdAt: string;
};

export type PriceAdminDetail = {
  item: PriceAdminItem;
  history: PriceHistoryPoint[];
  peers: PricePeerRow[];
  quarantine: PriceQuarantineTrace[];
  stats: { rows30: number; min30: string | null; max30: string | null; avg30: string | null } | null;
};

export type PriceAdminPayload = {
  productId: number;
  marketId: number;
  avgPrice: number;
  minPrice?: number;
  maxPrice?: number;
  recordedDate: string;
  sourceApi?: string;
};

export type BulkPriceEntry = PriceAdminPayload;
export type BulkPriceResult = { ok: boolean; inserted: number; skipped: number; ids: number[] };

export type PriceQuarantineStatus = "pending" | "approved" | "rejected" | "corrected" | "rolled_back";
export type PriceQuarantineItem = {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  marketId: number;
  marketName: string;
  recordedDate: string;
  sourceApi: string;
  unit: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  reasonCode: string;
  severity: "warning" | "critical";
  confidence: string;
  peerMedian: string | null;
  deviationRatio: string | null;
  status: PriceQuarantineStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

export const pricesAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPricesAdmin: builder.query<
      {
        items: PriceAdminItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        meta?: { latestRecordedDate?: string | null; rangeDays?: number };
      },
      {
        product?: string;
        q?: string;
        city?: string;
        market?: string;
        category?: string;
        unit?: string;
        source?: string;
        issue?: 'unit_mismatch' | 'inactive_product' | 'inactive_market' | 'quarantined' | 'any';
        sort?: 'date_desc' | 'date_asc' | 'price_desc' | 'price_asc' | 'product';
        days?: number;
        range?: string;
        limit?: number;
        page?: number;
        latestOnly?: boolean;
      } | void
    >({
      query: (params) => ({
        url: "/admin/hal/prices",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: "Prices" as const, id: "LIST" }],
    }),
    getPriceDetailAdmin: builder.query<PriceAdminDetail, number | string>({
      query: (id) => ({ url: `/admin/hal/prices/${id}/detail` }),
      providesTags: (_r, _e, id) => [{ type: "Prices" as const, id: `detail-${id}` }],
    }),
    listPriceSourcesAdmin: builder.query<{ items: { source: string; count: number; lastDate: string }[] }, void>({
      query: () => ({ url: "/admin/hal/price-sources" }),
      providesTags: [{ type: "Prices" as const, id: "SOURCES" }],
    }),
    listPriceCategoriesAdmin: builder.query<{ items: { slug: string; count: number }[] }, void>({
      query: () => ({ url: "/admin/hal/price-categories" }),
      providesTags: [{ type: "Prices" as const, id: "CATEGORIES" }],
    }),
    getPriceAdmin: builder.query<PriceAdminItem, number | string>({
      query: (id) => ({ url: `/admin/hal/prices/${id}` }),
      providesTags: (_r, _e, id) => [{ type: "Prices" as const, id }],
    }),
    createPriceAdmin: builder.mutation<{ ok: boolean; id?: number | null }, PriceAdminPayload>({
      query: (body) => ({ url: "/admin/hal/prices", method: "POST", body }),
      invalidatesTags: [{ type: "Prices" as const, id: "LIST" }],
    }),
    updatePriceAdmin: builder.mutation<{ ok: boolean }, { id: number | string; body: PriceAdminPayload }>({
      query: ({ id, body }) => ({ url: `/admin/hal/prices/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Prices" as const, id: "LIST" },
        { type: "Prices" as const, id },
      ],
    }),
    bulkCreatePricesAdmin: builder.mutation<BulkPriceResult, { entries: BulkPriceEntry[] }>({
      query: (body) => ({ url: "/admin/hal/prices/bulk-entry", method: "POST", body }),
      invalidatesTags: [{ type: "Prices" as const, id: "LIST" }],
    }),
    listPriceQuarantineAdmin: builder.query<
      {
        items: PriceQuarantineItem[];
        total: number;
        limit: number;
        offset: number;
        sla: {
          queueHours: number;
          criticalHours: number;
          overdue: number;
          criticalOverdue: number;
          oldestHours: number;
        };
      },
      {
        status?: PriceQuarantineStatus;
        severity?: "warning" | "critical";
        reason?: string;
        source?: string;
        unit?: string;
        dateFrom?: string;
        dateTo?: string;
        q?: string;
        limit?: number;
        offset?: number;
      } | void
    >({
      query: (params) => ({
        url: "/admin/hal/price-quarantine",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: "Prices" as const, id: "QUARANTINE" }],
    }),
    reviewPriceQuarantineAdmin: builder.mutation<
      { ok: boolean; id: number; status: PriceQuarantineStatus },
      {
        id: number;
        decision: "approve" | "reject" | "correct";
        note: string;
        confirmCritical?: boolean;
        avgPrice?: number;
        minPrice?: number | null;
        maxPrice?: number | null;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/hal/price-quarantine/${id}/review`, method: "PATCH", body }),
      invalidatesTags: [
        { type: "Prices" as const, id: "QUARANTINE" },
        { type: "Prices" as const, id: "LIST" },
      ],
    }),
    previewBulkPriceQuarantineAdmin: builder.mutation<
      {
        requested: number;
        found: number;
        actionable: number;
        skipped: number;
        critical: number;
        warning: number;
        decision: "approve" | "reject";
        previewToken: string;
        items: Array<{ id: number; severity: "warning" | "critical"; avgPrice: string; recordedDate: string }>;
      },
      { ids: number[]; decision: "approve" | "reject" }
    >({
      query: (body) => ({ url: "/admin/hal/price-quarantine/bulk-preview", method: "POST", body }),
    }),
    reviewBulkPriceQuarantineAdmin: builder.mutation<
      { ok: boolean; reviewed: number; decision: "approve" | "reject" },
      {
        ids: number[];
        decision: "approve" | "reject";
        note: string;
        previewToken: string;
        confirmBulk: true;
        confirmCritical?: boolean;
      }
    >({
      query: (body) => ({ url: "/admin/hal/price-quarantine/bulk-review", method: "POST", body }),
      invalidatesTags: [
        { type: "Prices" as const, id: "QUARANTINE" },
        { type: "Prices" as const, id: "LIST" },
      ],
    }),
    rollbackPriceQuarantineAdmin: builder.mutation<
      { ok: boolean; id: number; status: "rolled_back"; restoredPrevious: boolean },
      { id: number; note: string; confirmRollback: true }
    >({
      query: ({ id, ...body }) => ({ url: `/admin/hal/price-quarantine/${id}/rollback`, method: "POST", body }),
      invalidatesTags: [
        { type: "Prices" as const, id: "QUARANTINE" },
        { type: "Prices" as const, id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPricesAdminQuery,
  useGetPriceDetailAdminQuery,
  useListPriceSourcesAdminQuery,
  useListPriceCategoriesAdminQuery,
  useGetPriceAdminQuery,
  useCreatePriceAdminMutation,
  useUpdatePriceAdminMutation,
  useBulkCreatePricesAdminMutation,
  useListPriceQuarantineAdminQuery,
  useReviewPriceQuarantineAdminMutation,
  usePreviewBulkPriceQuarantineAdminMutation,
  useReviewBulkPriceQuarantineAdminMutation,
  useRollbackPriceQuarantineAdminMutation,
} = pricesAdminApi;
