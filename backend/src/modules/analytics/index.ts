// src/modules/analytics/index.ts
// hal-fiyatlari analytics = shared analytics module + hal-specific config.
// Single source of truth lives in @agro/shared-backend/modules/analytics.

import type { FastifyInstance } from "fastify";
import {
  registerAnalyticsAdmin as registerSharedAnalyticsAdmin,
} from "@agro/shared-backend/modules/analytics";
import type { AnalyticsFunnelStep } from "@agro/shared-backend/modules/analytics";

const HAL_INTENT_PATHS = ["/pro", "/embed", "/api-docs"];

const HAL_FUNNEL_STEPS: AnalyticsFunnelStep[] = [
  { key: "landing_pageviews", path: "/canli-hal-fiyatlari" },
  { key: "alerts_pageviews", path: "/uyarilar" },
  { key: "newsletter_new", source: "newsletter" },
];

export async function registerAnalyticsAdmin(adminApi: FastifyInstance) {
  await registerSharedAnalyticsAdmin(adminApi, {
    intentPaths: HAL_INTENT_PATHS,
    funnelSteps: HAL_FUNNEL_STEPS,
  });
}
