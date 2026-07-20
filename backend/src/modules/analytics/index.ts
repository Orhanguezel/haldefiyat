// src/modules/analytics/index.ts
// hal-fiyatlari analytics = shared analytics module + hal-specific config.
// Single source of truth lives in @agro/shared-backend/modules/analytics.

import type { FastifyInstance } from "fastify";
import {
  registerAnalyticsAdmin as registerSharedAnalyticsAdmin,
} from "@agro/shared-backend/modules/analytics";
import type { AnalyticsFunnelStep } from "@agro/shared-backend/modules/analytics";
import { ctaFunnel } from "@/modules/tracking/cta";

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

  // CTA huni ozeti — hal'e ozgu oldugu icin ortak modulde degil burada.
  adminApi.get<{ Querystring: { days?: string } }>("/analytics/cta-funnel", async (req, reply) => {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const rows = await ctaFunnel(days);
    return reply.send({ success: true, data: { days, rows } });
  });
}
