import type { FastifyInstance } from "fastify";
import type { RowDataPacket } from "mysql2";

interface WidgetEmbedderRow extends RowDataPacket {
  host: string | null;
  hits: number | string;
  uniqueIps: number | string;
  lastSeen: string | Date | null;
}

interface DataPullerRow extends RowDataPacket {
  ip: string;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  hits: number | string;
  uniquePaths: number | string;
  exportHits: number | string;
  lastSeen: string | Date | null;
}

interface GeoCityRow extends RowDataPacket {
  country: string | null;
  city: string | null;
  hits: number | string;
  uniqueIps: number | string;
  botHits: number | string;
}

const INTERNAL_HOST_RE = /(haldefiyat|bereketfide|vistaseed|vistaseeds)/i;
const BOT_UA_RE = /bot|crawl|spider|python|curl|wget|http|axios|go-http/i;
const BOT_UA_SQL = "LOWER(COALESCE(user_agent, '')) REGEXP 'bot|crawl|spider|python|curl|wget|http|axios|go-http'";

function parseDays(value: unknown): number {
  const raw = Number(value ?? 30);
  if (!Number.isFinite(raw)) return 30;
  return Math.min(90, Math.max(1, Math.trunc(raw)));
}

function n(value: unknown): number {
  return Number(value ?? 0) || 0;
}

function parseMinHits(value: unknown): number {
  const raw = Number(value ?? 500);
  if (!Number.isFinite(raw)) return 500;
  return Math.min(100000, Math.max(1, Math.trunc(raw)));
}

function parseTrafficKind(value: unknown): "all" | "human" | "bot" {
  return value === "human" || value === "bot" ? value : "all";
}

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export async function registerAuditConsumersAdmin(adminApi: FastifyInstance) {
  adminApi.get("/audit/widget-embedders", async (req, reply) => {
    const days = parseDays((req.query as { days?: string | number }).days);
    const [rows] = await adminApi.db.query<WidgetEmbedderRow[]>(
      `SELECT
         SUBSTRING_INDEX(SUBSTRING_INDEX(referer, '/', 3), '//', -1) AS host,
         COUNT(*) AS hits,
         COUNT(DISTINCT ip) AS uniqueIps,
         MAX(created_at) AS lastSeen
       FROM audit_request_logs
       WHERE path = '/api/v1/prices/widget'
         AND referer IS NOT NULL
         AND referer <> ''
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY host
       ORDER BY hits DESC
       LIMIT 100`,
      [days],
    );

    return reply.send({
      days,
      items: rows.map((row) => {
        const host = row.host ?? "";
        return {
          host: host || "unknown",
          hits: n(row.hits),
          uniqueIps: n(row.uniqueIps),
          lastSeen: toIso(row.lastSeen),
          internal: INTERNAL_HOST_RE.test(host),
        };
      }),
    });
  });

  adminApi.get("/audit/data-pullers", async (req, reply) => {
    const query = req.query as { days?: string | number; min_hits?: string | number };
    const days = parseDays(query.days ?? 7);
    const minHits = parseMinHits(query.min_hits);
    const [rows] = await adminApi.db.query<DataPullerRow[]>(
      `SELECT
         ip,
         user_agent AS userAgent,
         COALESCE(NULLIF(country, ''), '') AS country,
         COALESCE(NULLIF(city, ''), '') AS city,
         COUNT(*) AS hits,
         COUNT(DISTINCT path) AS uniquePaths,
         SUM(CASE WHEN path LIKE '/api/v1/prices%export%' OR path = '/api/v1/prices/export' THEN 1 ELSE 0 END) AS exportHits,
         MAX(created_at) AS lastSeen
       FROM audit_request_logs
       WHERE path LIKE '/api/v1/prices%'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY ip, user_agent, country, city
       HAVING hits >= ?
       ORDER BY hits DESC
       LIMIT 100`,
      [days, minHits],
    );

    return reply.send({
      days,
      minHits,
      items: rows.map((row) => {
        const userAgent = row.userAgent ?? "";
        return {
          ip: row.ip,
          userAgent: userAgent || null,
          country: row.country || null,
          city: row.city || null,
          hits: n(row.hits),
          uniquePaths: n(row.uniquePaths),
          exportHits: n(row.exportHits),
          lastSeen: toIso(row.lastSeen),
          bot: BOT_UA_RE.test(userAgent),
        };
      }),
    });
  });

  adminApi.get("/audit/geo-cities", async (req, reply) => {
    const query = req.query as { days?: string | number; traffic?: string };
    const days = parseDays(query.days ?? 30);
    const traffic = parseTrafficKind(query.traffic);
    const trafficSql =
      traffic === "bot" ? `AND ${BOT_UA_SQL}` : traffic === "human" ? `AND NOT (${BOT_UA_SQL})` : "";
    const [rows] = await adminApi.db.query<GeoCityRow[]>(
      `SELECT
         COALESCE(NULLIF(country, ''), 'UNKNOWN') AS country,
         COALESCE(NULLIF(city, ''), 'UNKNOWN') AS city,
         COUNT(*) AS hits,
         COUNT(DISTINCT ip) AS uniqueIps,
         SUM(CASE WHEN ${BOT_UA_SQL} THEN 1 ELSE 0 END) AS botHits
       FROM audit_request_logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         AND country IS NOT NULL
         AND country <> ''
         ${trafficSql}
       GROUP BY country, city
       ORDER BY hits DESC
       LIMIT 50`,
      [days],
    );

    return reply.send({
      days,
      traffic,
      items: rows.map((row) => ({
        country: row.country || "UNKNOWN",
        city: row.city || "UNKNOWN",
        hits: n(row.hits),
        uniqueIps: n(row.uniqueIps),
        botHits: n(row.botHits),
      })),
    });
  });
}
