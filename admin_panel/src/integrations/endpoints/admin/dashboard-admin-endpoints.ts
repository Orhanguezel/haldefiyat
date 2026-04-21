// =============================================================
// FILE: src/integrations/endpoints/admin/dashboard-admin-endpoints.ts
// =============================================================
import { baseApi } from '@/integrations/base-api';
import type { DashboardSummary } from "@/integrations/shared";
import { normalizeDashboardSummary } from "@/integrations/shared";

// ---- API -----------------------------------------------------
export const dashboardAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/dashboard/summary
    getDashboardSummaryAdmin: b.query<DashboardSummary, void>({
      query: () => ({ url: "/admin/dashboard/summary" }),
      transformResponse: (res: unknown) => normalizeDashboardSummary(res),
      providesTags: [{ type: "Dashboard" as const, id: "SUMMARY" }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetDashboardSummaryAdminQuery } = dashboardAdminApi;
