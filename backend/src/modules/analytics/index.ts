// src/modules/analytics/index.ts
// hal-fiyatlari analytics = shared analytics module + hal-specific config.
// Single source of truth lives in @agro/shared-backend/modules/analytics.

import type { FastifyInstance } from "fastify";
import type { RowDataPacket } from "mysql2";
import {
  registerAnalyticsAdmin as registerSharedAnalyticsAdmin,
} from "@agro/shared-backend/modules/analytics";
import type { AnalyticsFunnelStep } from "@agro/shared-backend/modules/analytics";
import { ctaFunnel } from "@/modules/tracking/cta";
import { pool } from "@/db/client";

const HAL_INTENT_PATHS = ["/pro", "/embed", "/api-docs"];

const HAL_FUNNEL_STEPS: AnalyticsFunnelStep[] = [
  { key: "landing_pageviews", path: "/canli-hal-fiyatlari" },
  { key: "alerts_pageviews", path: "/uyarilar" },
  { key: "newsletter_new", source: "newsletter" },
];

function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

function safeDays(value: unknown): number {
  const days = Number(value ?? 30);
  return Number.isFinite(days) ? Math.min(90, Math.max(1, Math.trunc(days))) : 30;
}

async function productKpis(days: number) {
  const [searchRows, durationRows, qualityRows, callRows] = await Promise.all([
    pool.query<RowDataPacket[]>(
      `SELECT event, COUNT(DISTINCT visitor_hash, DATE(created_at)) AS total
       FROM hf_cta_events
       WHERE placement = 'product_search'
         AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
       GROUP BY event`,
      [days],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS journeys, AVG(TIMESTAMPDIFF(MICROSECOND, opened_at, viewed_at) / 1000) AS avgMs
       FROM (
         SELECT visitor_hash, DATE(created_at) AS event_day,
           MIN(CASE WHEN event = 'opened' THEN created_at END) AS opened_at,
           MIN(CASE WHEN event = 'price_viewed' THEN created_at END) AS viewed_at
         FROM hf_cta_events
         WHERE placement = 'product_search'
           AND created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
         GROUP BY visitor_hash, DATE(created_at)
       ) journey
       WHERE opened_at IS NOT NULL AND viewed_at IS NOT NULL
         AND viewed_at >= opened_at
         AND viewed_at <= DATE_ADD(opened_at, INTERVAL 30 MINUTE)`,
      [days],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM hf_price_history WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)) AS published,
         (SELECT COUNT(*) FROM hf_price_quarantine WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)) AS quarantined,
         (SELECT COUNT(*) FROM hf_price_quarantine WHERE status = 'pending') AS pending,
         (SELECT COUNT(*) FROM hf_retail_price_quarantine WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)) AS retailQuarantined`,
      [days, days, days],
    ),
    pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS total
       FROM hf_listing_call_requests
       WHERE created_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY)
       GROUP BY status`,
      [days],
    ),
  ]);

  const search = Object.fromEntries(searchRows[0].map((row) => [String(row.event), Number(row.total ?? 0)]));
  const calls = Object.fromEntries(callRows[0].map((row) => [String(row.status), Number(row.total ?? 0)]));
  const submitted = Number(search.submitted ?? 0);
  const selected = Number(search.selected ?? 0);
  const viewed = Number(search.price_viewed ?? 0);
  const zeroResults = Number(search.zero_results ?? 0);
  const duration = durationRows[0][0];
  const quality = qualityRows[0][0];
  const published = Number(quality?.published ?? 0);
  const quarantined = Number(quality?.quarantined ?? 0);
  const callTotal = Object.values(calls).reduce((sum, count) => sum + count, 0);
  const accepted = Number(calls.accepted ?? 0) + Number(calls.completed ?? 0);
  const completed = Number(calls.completed ?? 0);
  const notified = Number(calls.notified ?? 0) + accepted;

  return {
    days,
    generatedAt: new Date().toISOString(),
    priceFind: {
      averageMs: duration?.avgMs == null ? null : Math.round(Number(duration.avgMs)),
      measuredJourneys: Number(duration?.journeys ?? 0),
      state: Number(duration?.journeys ?? 0) >= 30 ? "measured" : "collecting",
    },
    search: {
      opened: Number(search.opened ?? 0),
      submitted,
      selected,
      priceViewed: viewed,
      zeroResults,
      successPct: percent(selected, submitted),
      priceViewPct: percent(viewed, submitted),
      zeroResultsPct: percent(zeroResults, submitted),
      state: submitted >= 100 ? "measured" : "collecting",
    },
    anomalies: {
      published,
      quarantined,
      pending: Number(quality?.pending ?? 0),
      retailQuarantined: Number(quality?.retailQuarantined ?? 0),
      ratePct: percent(quarantined, published + quarantined),
    },
    calls: {
      total: callTotal,
      notified,
      accepted,
      completed,
      notifiedPct: percent(notified, callTotal),
      acceptedPct: percent(accepted, callTotal),
      completedPct: percent(completed, callTotal),
      byStatus: calls,
      state: callTotal >= 30 ? "measured" : "collecting",
    },
    thresholds: {
      priceFindAverageMs: 15_000,
      searchSuccessPct: 40,
      anomalyWarningPct: 1,
      anomalyStopPct: 3,
      minimumJourneySample: 30,
      minimumSearchSample: 100,
      minimumCallSample: 30,
    },
  };
}

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

  adminApi.get<{ Querystring: { days?: string } }>("/analytics/product-kpis", async (req, reply) => {
    const days = safeDays(req.query.days);
    return reply.send(await productKpis(days));
  });
}
