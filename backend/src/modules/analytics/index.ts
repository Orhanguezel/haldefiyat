import type { FastifyInstance } from "fastify";
import type { RowDataPacket } from "mysql2";

type RangeKey = "7d" | "30d";

interface CountRow extends RowDataPacket {
  value: number | string | null;
}

interface SegmentRow extends RowDataPacket {
  b2bLikeIps: number | string | null;
  b2bIntentIps: number | string | null;
}

interface OverviewSummaryRow extends RowDataPacket {
  totalRequests: number | string | null;
  humanRequests: number | string | null;
  botRequests: number | string | null;
  uniqueIps: number | string | null;
  pageviews: number | string | null;
  adsPageviews: number | string | null;
  adsUniqueIps: number | string | null;
  directPageviews: number | string | null;
}

interface DailyRow extends RowDataPacket {
  date: string;
  requests: number | string;
  humans: number | string;
  ads: number | string;
  uniqueIps: number | string;
}

interface NameCountRow extends RowDataPacket {
  name: string | null;
  count: number | string;
}

interface DeviceRow extends RowDataPacket {
  device: string;
  count: number | string;
}

interface AdsAttributionRow extends RowDataPacket {
  campaign: string | null;
  source: string | null;
  medium: string | null;
  pageviews: number | string;
  uniqueIps: number | string;
}

interface RetentionCohortRow extends RowDataPacket {
  date: string;
  visitors: number | string;
  d1: number | string;
  d3: number | string;
  d7: number | string;
}

interface HeatmapRow extends RowDataPacket {
  weekday: number | string;
  hour: number | string;
  humans: number | string;
  uniqueIps: number | string;
}

const BOT_UA_SQL =
  "LOWER(COALESCE(user_agent, '')) REGEXP 'bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|googlebot|bingbot|yandex|headless|lighthouse'";
const ATTRIBUTION_COLUMNS = ["gclid", "utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const CACHE_TTL_MS = 5 * 60 * 1000;
let hasAttributionColumnsCache: boolean | null = null;
const analyticsCache = new Map<string, { expiresAt: number; value: unknown }>();

interface AuditColumnRow extends RowDataPacket {
  Field: string;
}

function parseRange(value: unknown): { key: RangeKey; days: number } {
  return value === "30d" ? { key: "30d", days: 30 } : { key: "7d", days: 7 };
}

function n(value: unknown): number {
  return Number(value ?? 0) || 0;
}

function getCached<T>(key: string): T | null {
  const hit = analyticsCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    analyticsCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function setCached<T>(key: string, value: T): T {
  analyticsCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
}

async function one<T extends RowDataPacket>(app: FastifyInstance, sql: string): Promise<T | null> {
  const [rows] = await app.db.query<T[]>(sql);
  return rows[0] ?? null;
}

async function many<T extends RowDataPacket>(app: FastifyInstance, sql: string): Promise<T[]> {
  const [rows] = await app.db.query<T[]>(sql);
  return rows;
}

async function hasAuditAttributionColumns(app: FastifyInstance): Promise<boolean> {
  if (hasAttributionColumnsCache !== null) return hasAttributionColumnsCache;

  const columnList = ATTRIBUTION_COLUMNS.map((column) => `'${column}'`).join(", ");
  const [rows] = await app.db.query<AuditColumnRow[]>(
    `SHOW COLUMNS FROM audit_request_logs WHERE Field IN (${columnList})`,
  );
  hasAttributionColumnsCache = rows.length === ATTRIBUTION_COLUMNS.length;
  return hasAttributionColumnsCache;
}

function since(days: number): string {
  return `created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
}

function humanPageviewWhere(alias = ""): string {
  const prefix = alias ? `${alias}.` : "";
  const userAgent = `${prefix}user_agent`;
  return `${prefix}ip IS NOT NULL
    AND ${prefix}ip <> ''
    AND ${prefix}path NOT LIKE '/api/%'
    AND NOT (LOWER(COALESCE(${userAgent}, '')) REGEXP 'bot|crawler|spider|slurp|facebookexternalhit|whatsapp|telegrambot|googlebot|bingbot|yandex|headless|lighthouse')`;
}

export async function registerAnalyticsAdmin(adminApi: FastifyInstance) {
  adminApi.get("/analytics/overview", async (req, reply) => {
    const { days, key } = parseRange((req.query as { range?: string }).range);
    const hasAttributionColumns = await hasAuditAttributionColumns(adminApi);
    const adsSummarySql = hasAttributionColumns
      ? `SUM(CASE WHEN gclid IS NOT NULL AND gclid <> '' THEN 1 ELSE 0 END) AS adsPageviews,
        COUNT(DISTINCT CASE WHEN gclid IS NOT NULL AND gclid <> '' THEN ip END) AS adsUniqueIps`
      : "0 AS adsPageviews, 0 AS adsUniqueIps";
    const dailyAdsSql = hasAttributionColumns
      ? "SUM(CASE WHEN gclid IS NOT NULL AND gclid <> '' THEN 1 ELSE 0 END) AS ads"
      : "0 AS ads";
    const cacheKey = `overview:${key}:${hasAttributionColumns ? "attr" : "base"}`;
    const cached = getCached(cacheKey);
    if (cached) return reply.send(cached);

    const summary = await one<OverviewSummaryRow>(
      adminApi,
      `SELECT
        COUNT(*) AS totalRequests,
        SUM(CASE WHEN NOT (${BOT_UA_SQL}) THEN 1 ELSE 0 END) AS humanRequests,
        SUM(CASE WHEN ${BOT_UA_SQL} THEN 1 ELSE 0 END) AS botRequests,
        COUNT(DISTINCT ip) AS uniqueIps,
        SUM(CASE WHEN path NOT LIKE '/api/%' THEN 1 ELSE 0 END) AS pageviews,
        ${adsSummarySql},
        SUM(CASE WHEN path NOT LIKE '/api/%' AND (referer IS NULL OR referer = '') THEN 1 ELSE 0 END) AS directPageviews
       FROM audit_request_logs
       WHERE ${since(days)}`,
    );

    const newsletterTotal = await one<CountRow>(
      adminApi,
      "SELECT COUNT(*) AS value FROM newsletter_subscribers WHERE unsubscribed_at IS NULL",
    );
    const newsletterNew = await one<CountRow>(
      adminApi,
      `SELECT COUNT(*) AS value FROM newsletter_subscribers WHERE unsubscribed_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`,
    );
    const returningIps = await one<CountRow>(
      adminApi,
      `SELECT COUNT(DISTINCT current.ip) AS value
       FROM audit_request_logs current
       WHERE current.created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
         AND current.ip IN (
           SELECT DISTINCT previous.ip
           FROM audit_request_logs previous
           WHERE previous.created_at < DATE_SUB(NOW(), INTERVAL ${days} DAY)
         )`,
    );
    const segmentSummary = await one<SegmentRow>(
      adminApi,
      `WITH ip_stats AS (
         SELECT
           ip,
           COUNT(*) AS pageviews,
           COUNT(DISTINCT DATE(created_at)) AS active_days,
           MAX(
             CASE
               WHEN LOWER(COALESCE(user_agent, '')) NOT REGEXP 'mobile|android|iphone|ipod|ipad|tablet'
                AND WEEKDAY(created_at) BETWEEN 0 AND 4
                AND HOUR(created_at) BETWEEN 8 AND 18
               THEN 1 ELSE 0
             END
           ) AS desktop_business_hour,
           MAX(CASE WHEN path IN ('/pro', '/embed', '/api-docs') THEN 1 ELSE 0 END) AS has_intent
         FROM audit_request_logs
         WHERE ${since(days)}
           AND ${humanPageviewWhere()}
         GROUP BY ip
       )
       SELECT
         SUM(CASE WHEN desktop_business_hour = 1 AND (active_days >= 2 OR pageviews >= 5 OR has_intent = 1) THEN 1 ELSE 0 END) AS b2bLikeIps,
         SUM(CASE WHEN has_intent = 1 THEN 1 ELSE 0 END) AS b2bIntentIps
       FROM ip_stats`,
    );

    const [daily, topLandingPages, topReferrers, devices, intentSignals] = await Promise.all([
      many<DailyRow>(
        adminApi,
        `SELECT
          DATE(created_at) AS date,
          COUNT(*) AS requests,
          SUM(CASE WHEN NOT (${BOT_UA_SQL}) THEN 1 ELSE 0 END) AS humans,
          ${dailyAdsSql},
          COUNT(DISTINCT ip) AS uniqueIps
         FROM audit_request_logs
         WHERE ${since(days)}
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
      ),
      many<NameCountRow>(
        adminApi,
        `SELECT path AS name, COUNT(*) AS count
         FROM audit_request_logs
         WHERE ${since(days)} AND path NOT LIKE '/api/%'
         GROUP BY path
         ORDER BY count DESC
         LIMIT 10`,
      ),
      many<NameCountRow>(
        adminApi,
        `SELECT COALESCE(NULLIF(referer, ''), 'Direct') AS name, COUNT(*) AS count
         FROM audit_request_logs
         WHERE ${since(days)} AND path NOT LIKE '/api/%'
         GROUP BY COALESCE(NULLIF(referer, ''), 'Direct')
         ORDER BY count DESC
         LIMIT 10`,
      ),
      many<DeviceRow>(
        adminApi,
        `SELECT
          CASE
            WHEN LOWER(COALESCE(user_agent, '')) REGEXP 'mobile|android|iphone|ipod' THEN 'mobile'
            WHEN LOWER(COALESCE(user_agent, '')) REGEXP 'ipad|tablet' THEN 'tablet'
            ELSE 'desktop'
          END AS device,
          COUNT(*) AS count
         FROM audit_request_logs
         WHERE ${since(days)} AND path NOT LIKE '/api/%' AND NOT (${BOT_UA_SQL})
         GROUP BY device
         ORDER BY count DESC`,
      ),
      many<NameCountRow>(
        adminApi,
        `SELECT path AS name, COUNT(DISTINCT ip) AS count
         FROM audit_request_logs
         WHERE ${since(days)}
           AND path IN ('/pro', '/embed', '/api-docs')
         GROUP BY path
         ORDER BY count DESC`,
      ),
    ]);

    const pageviews = n(summary?.pageviews);
    const directPageviews = n(summary?.directPageviews);
    const uniqueIps = n(summary?.uniqueIps);
    const adsUniqueIps = n(summary?.adsUniqueIps);
    const newsletterNewCount = n(newsletterNew?.value);

    return reply.send(setCached(cacheKey, {
      range: key,
      summary: {
        totalRequests: n(summary?.totalRequests),
        humanRequests: n(summary?.humanRequests),
        botRequests: n(summary?.botRequests),
        uniqueIps,
        pageviews,
        pagesPerVisitor: uniqueIps > 0 ? Number((pageviews / uniqueIps).toFixed(2)) : 0,
        directTrafficPct: pageviews > 0 ? Number(((directPageviews / pageviews) * 100).toFixed(1)) : 0,
        returningIps: n(returningIps?.value),
        adsPageviews: n(summary?.adsPageviews),
        adsUniqueIps,
        newsletterTotal: n(newsletterTotal?.value),
        newsletterNew: newsletterNewCount,
        newsletterAdsCapturePct: adsUniqueIps > 0 ? Number(((newsletterNewCount / adsUniqueIps) * 100).toFixed(1)) : 0,
        b2bLikeIps: n(segmentSummary?.b2bLikeIps),
        b2bIntentIps: n(segmentSummary?.b2bIntentIps),
      },
      daily: daily.map((row) => ({
        date: row.date,
        requests: n(row.requests),
        humans: n(row.humans),
        ads: n(row.ads),
        uniqueIps: n(row.uniqueIps),
      })),
      topLandingPages: topLandingPages.map((row) => ({ name: row.name ?? "—", count: n(row.count) })),
      topReferrers: topReferrers.map((row) => ({ name: row.name ?? "Direct", count: n(row.count) })),
      devices: devices.map((row) => ({ device: row.device, count: n(row.count) })),
      intentSignals: intentSignals.map((row) => ({ path: row.name ?? "—", uniqueIps: n(row.count) })),
    }));
  });

  adminApi.get("/analytics/ads-attribution", async (req, reply) => {
    const { days, key } = parseRange((req.query as { range?: string }).range);
    if (!(await hasAuditAttributionColumns(adminApi))) {
      return reply.send({ range: key, items: [] });
    }
    const cacheKey = `ads-attribution:${key}`;
    const cached = getCached(cacheKey);
    if (cached) return reply.send(cached);

    const rows = await many<AdsAttributionRow>(
      adminApi,
      `SELECT
        COALESCE(NULLIF(utm_campaign, ''), 'unknown') AS campaign,
        COALESCE(NULLIF(utm_source, ''), 'unknown') AS source,
        COALESCE(NULLIF(utm_medium, ''), 'unknown') AS medium,
        COUNT(*) AS pageviews,
        COUNT(DISTINCT ip) AS uniqueIps
       FROM audit_request_logs
       WHERE ${since(days)} AND gclid IS NOT NULL AND gclid <> ''
       GROUP BY campaign, source, medium
       ORDER BY pageviews DESC
       LIMIT 20`,
    );

    return reply.send(setCached(cacheKey, {
      range: key,
      items: rows.map((row) => ({
        campaign: row.campaign ?? "unknown",
        source: row.source ?? "unknown",
        medium: row.medium ?? "unknown",
        pageviews: n(row.pageviews),
        uniqueIps: n(row.uniqueIps),
      })),
    }));
  });

  adminApi.get("/analytics/funnel", async (req, reply) => {
    const { days, key } = parseRange((req.query as { range?: string }).range);
    const cacheKey = `funnel:${key}`;
    const cached = getCached(cacheKey);
    if (cached) return reply.send(cached);
    const rows = await many<NameCountRow>(
      adminApi,
      `SELECT metric AS name, value AS count
       FROM (
         SELECT 'landing_pageviews' AS metric, COUNT(*) AS value
         FROM audit_request_logs
         WHERE ${since(days)} AND path = '/canli-hal-fiyatlari'
         UNION ALL
         SELECT 'alerts_pageviews' AS metric, COUNT(*) AS value
         FROM audit_request_logs
         WHERE ${since(days)} AND path = '/uyarilar'
         UNION ALL
         SELECT 'newsletter_new' AS metric, COUNT(*) AS value
         FROM newsletter_subscribers
         WHERE unsubscribed_at IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
       ) funnel`,
    );

    return reply.send(setCached(cacheKey, {
      range: key,
      items: rows.map((row) => ({ name: row.name ?? "—", count: n(row.count) })),
    }));
  });

  adminApi.get("/analytics/retention", async (req, reply) => {
    const { days, key } = parseRange((req.query as { range?: string }).range);
    const cacheKey = `retention:${key}`;
    const cached = getCached(cacheKey);
    if (cached) return reply.send(cached);
    const firstSeenCutoffDays = Math.max(days - 1, 1);
    const rows = await many<RetentionCohortRow>(
      adminApi,
      `WITH first_seen AS (
         SELECT ip, DATE(MIN(created_at)) AS cohort_date
         FROM audit_request_logs
         WHERE ${humanPageviewWhere()}
         GROUP BY ip
         HAVING cohort_date >= DATE_SUB(CURDATE(), INTERVAL ${firstSeenCutoffDays} DAY)
       ),
       visits AS (
         SELECT DISTINCT ip, DATE(created_at) AS visit_date
         FROM audit_request_logs
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
           AND ${humanPageviewWhere()}
       )
       SELECT
         DATE_FORMAT(first_seen.cohort_date, '%Y-%m-%d') AS date,
         COUNT(DISTINCT first_seen.ip) AS visitors,
         COUNT(DISTINCT CASE WHEN DATEDIFF(visits.visit_date, first_seen.cohort_date) = 1 THEN first_seen.ip END) AS d1,
         COUNT(DISTINCT CASE WHEN DATEDIFF(visits.visit_date, first_seen.cohort_date) BETWEEN 1 AND 3 THEN first_seen.ip END) AS d3,
         COUNT(DISTINCT CASE WHEN DATEDIFF(visits.visit_date, first_seen.cohort_date) BETWEEN 1 AND 7 THEN first_seen.ip END) AS d7
       FROM first_seen
       LEFT JOIN visits
         ON visits.ip = first_seen.ip
        AND visits.visit_date > first_seen.cohort_date
       GROUP BY first_seen.cohort_date
       ORDER BY first_seen.cohort_date ASC`,
    );

    return reply.send(setCached(cacheKey, {
      range: key,
      cohorts: rows.map((row) => {
        const visitors = n(row.visitors);
        const d1 = n(row.d1);
        const d3 = n(row.d3);
        const d7 = n(row.d7);
        return {
          date: row.date,
          visitors,
          d1,
          d1Pct: visitors > 0 ? Number(((d1 / visitors) * 100).toFixed(1)) : 0,
          d3,
          d3Pct: visitors > 0 ? Number(((d3 / visitors) * 100).toFixed(1)) : 0,
          d7,
          d7Pct: visitors > 0 ? Number(((d7 / visitors) * 100).toFixed(1)) : 0,
        };
      }),
    }));
  });

  adminApi.get("/analytics/heatmap", async (req, reply) => {
    const { days, key } = parseRange((req.query as { range?: string }).range);
    const cacheKey = `heatmap:${key}`;
    const cached = getCached(cacheKey);
    if (cached) return reply.send(cached);
    const rows = await many<HeatmapRow>(
      adminApi,
      `SELECT
         WEEKDAY(created_at) AS weekday,
         HOUR(created_at) AS hour,
         COUNT(*) AS humans,
         COUNT(DISTINCT ip) AS uniqueIps
       FROM audit_request_logs
       WHERE ${since(days)}
         AND ${humanPageviewWhere()}
       GROUP BY WEEKDAY(created_at), HOUR(created_at)
       ORDER BY WEEKDAY(created_at), HOUR(created_at)`,
    );

    return reply.send(setCached(cacheKey, {
      range: key,
      items: rows.map((row) => ({
        weekday: n(row.weekday),
        hour: n(row.hour),
        humans: n(row.humans),
        uniqueIps: n(row.uniqueIps),
      })),
    }));
  });
}
