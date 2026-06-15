import fp from "fastify-plugin";
import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { RowDataPacket } from "mysql2";
import geoip from "geoip-lite";
import { isBotUserAgent, isInternalIpValue } from "@agro/shared-backend/modules/audit/helpers";

type RequestWithUser = FastifyRequest & {
  user?: unknown;
  auth?: { user?: unknown };
  requestContext?: { get?: (key: string) => unknown };
  auditApiKeyId?: number;
  auditError?: { message?: string; code?: string };
  auditPageview?: { url: string; path: string; referer: string | null };
};

type UserRecord = Record<string, unknown>;

const requestStarts = new WeakMap<FastifyRequest, bigint>();
const ATTRIBUTION_COLUMNS = ["gclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
let hasAttributionColumnsCache: boolean | null = null;
let hasApiKeyIdColumnCache: boolean | null = null;
let hasBotInternalColumnsCache: boolean | null = null;

interface AuditColumnRow extends RowDataPacket {
  Field: string;
}

const ASSET_EXT_RE =
  /\.(?:avif|css|gif|ico|jpg|jpeg|js|json|map|png|svg|txt|webmanifest|webp|woff|woff2|xml)$/i;

const SKIP_EXACT_PATHS = new Set([
  "/health",
  "/api/health",
  "/favicon.ico",
  "/favicon.png",
  "/robots.txt",
  "/manifest.webmanifest",
]);

const SKIP_PREFIXES = [
  "/_next/",
  "/assets/",
  "/icons/",
  "/uploads/",
  "/api/v1/admin/audit/stream",
  "/api/v1/admin/etl/run",
];

function firstHeader(req: FastifyRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  return String(value ?? "").trim();
}

function firstForwardedIp(value: string): string {
  return value.split(",").map((item) => item.trim()).find(Boolean) ?? "";
}

function normalizeClientIp(req: FastifyRequest): string {
  const cf = firstHeader(req, "cf-connecting-ip");
  if (cf) return cf;

  const realIp = firstHeader(req, "x-real-ip");
  if (realIp) return realIp;

  const forwarded = firstHeader(req, "x-forwarded-for");
  if (forwarded) {
    const ip = firstForwardedIp(forwarded);
    if (ip) return ip;
  }

  return String(req.ip || req.socket.remoteAddress || "").trim();
}

function getUrlParts(req: FastifyRequest): { url: string; path: string; searchParams: URLSearchParams } {
  const auditPageview = (req as RequestWithUser).auditPageview;
  if (auditPageview) {
    const parsed = new URL(auditPageview.url, "http://haldefiyat.local");
    return {
      url: auditPageview.url,
      path: auditPageview.path,
      searchParams: parsed.searchParams,
    };
  }

  const rawUrl = String(req.raw.url ?? req.url ?? "/") || "/";
  const parsed = new URL(rawUrl, "http://haldefiyat.local");
  return {
    url: rawUrl,
    path: parsed.pathname || "/",
    searchParams: parsed.searchParams,
  };
}

function shouldSkip(req: FastifyRequest): boolean {
  if (String(req.method).toUpperCase() === "OPTIONS") return true;

  const { path } = getUrlParts(req);
  if (SKIP_EXACT_PATHS.has(path)) return true;
  if (ASSET_EXT_RE.test(path)) return true;
  if (SKIP_PREFIXES.some((prefix) => path.startsWith(prefix))) return true;

  return false;
}

function userRecord(value: unknown): UserRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UserRecord)
    : null;
}

function normalizeUser(req: FastifyRequest): { userId: string | null; isAdmin: number } {
  const request = req as RequestWithUser;
  const candidate =
    request.user ??
    request.auth?.user ??
    request.requestContext?.get?.("user") ??
    null;
  const user = userRecord(candidate);
  if (!user) return { userId: null, isAdmin: 0 };

  const roles = Array.isArray(user.roles) ? user.roles.map(String) : [];
  const role = String(user.role ?? "");
  const isAdmin =
    user.is_admin === true ||
    user.is_admin === 1 ||
    user.is_admin === "1" ||
    role === "admin" ||
    roles.includes("admin")
      ? 1
      : 0;

  return {
    userId: user.id ? String(user.id) : null,
    isAdmin,
  };
}

function attr(searchParams: URLSearchParams, key: string): string | null {
  const value = searchParams.get(key)?.trim();
  return value ? value.slice(0, 255) : null;
}

async function auditAttributionColumnsExist(app: FastifyInstance): Promise<boolean> {
  if (hasAttributionColumnsCache !== null) return hasAttributionColumnsCache;

  try {
    const columnList = ATTRIBUTION_COLUMNS.map((column) => `'${column}'`).join(", ");
    const [rows] = await app.db.query<AuditColumnRow[]>(
      `SHOW COLUMNS FROM audit_request_logs WHERE Field IN (${columnList})`,
    );
    hasAttributionColumnsCache = rows.length === ATTRIBUTION_COLUMNS.length;
    return hasAttributionColumnsCache;
  } catch {
    hasAttributionColumnsCache = false;
    return false;
  }
}

async function auditApiKeyIdColumnExists(app: FastifyInstance): Promise<boolean> {
  if (hasApiKeyIdColumnCache !== null) return hasApiKeyIdColumnCache;

  try {
    const [rows] = await app.db.query<AuditColumnRow[]>(
      "SHOW COLUMNS FROM audit_request_logs WHERE Field = 'api_key_id'",
    );
    hasApiKeyIdColumnCache = rows.length > 0;
    return hasApiKeyIdColumnCache;
  } catch {
    hasApiKeyIdColumnCache = false;
    return false;
  }
}

async function auditBotInternalColumnsExist(app: FastifyInstance): Promise<boolean> {
  if (hasBotInternalColumnsCache !== null) return hasBotInternalColumnsCache;

  try {
    const [rows] = await app.db.query<AuditColumnRow[]>(
      "SHOW COLUMNS FROM audit_request_logs WHERE Field IN ('is_bot', 'is_internal')",
    );
    hasBotInternalColumnsCache = rows.length === 2;
    return hasBotInternalColumnsCache;
  } catch {
    hasBotInternalColumnsCache = false;
    return false;
  }
}

function responseTimeMs(req: FastifyRequest): number {
  const start = requestStarts.get(req);
  if (!start) return 0;
  const elapsedNs = process.hrtime.bigint() - start;
  return Math.max(0, Math.round(Number(elapsedNs) / 1_000_000));
}

function resolveGeo(req: FastifyRequest, ip: string): { country: string | null; city: string | null } {
  // Once CDN/Cloudflare header'larina bak
  const cfCountry = firstHeader(req, "cf-ipcountry");
  if (cfCountry) {
    return {
      country: cfCountry,
      city: firstHeader(req, "x-geo-city") || null,
    };
  }

  // Local/private IP'lerde lookup atla
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return { country: "LOCAL", city: null };
  }

  // geoip-lite ile MaxMind lookup
  try {
    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        country: geo.country || null,
        city: geo.city || null,
      };
    }
  } catch {
    /* ignore */
  }

  return { country: null, city: null };
}

export const auditRequestLoggerPlugin: FastifyPluginAsync = fp(async (app) => {
  app.addHook("onRequest", async (req) => {
    requestStarts.set(req, process.hrtime.bigint());
  });

  app.addHook("onResponse", async (req, reply: FastifyReply) => {
    if (shouldSkip(req)) return;

    try {
      const { url, path, searchParams } = getUrlParts(req);
      const ip = normalizeClientIp(req);
      const { userId, isAdmin } = normalizeUser(req);
      const { country, city } = resolveGeo(req, ip);
      const userAgent = firstHeader(req, "user-agent") || null;
      const isBot = isBotUserAgent(userAgent) ? 1 : 0;
      const isInternal = isInternalIpValue(ip, country) ? 1 : 0;
      const auditError = (req as RequestWithUser).auditError;
      const statusCode = Number(reply.statusCode || reply.raw.statusCode || 0);
      const errorMessage =
        statusCode >= 400 && auditError?.message ? String(auditError.message).slice(0, 512) : null;
      const errorCode =
        statusCode >= 400 && auditError?.code ? String(auditError.code).slice(0, 64) : null;

      const baseValues = [
        String(req.id || ""),
        String(req.method || "").toUpperCase(),
        url,
        path,
        statusCode,
        responseTimeMs(req),
        ip,
        userAgent,
        (req as RequestWithUser).auditPageview?.referer ?? firstHeader(req, "referer") ?? null,
        userId,
        isAdmin,
        country,
        city,
        errorMessage,
        errorCode,
        null,
      ];
      const attributionValues = [
          attr(searchParams, "gclid"),
          attr(searchParams, "utm_source"),
          attr(searchParams, "utm_medium"),
          attr(searchParams, "utm_campaign"),
          attr(searchParams, "utm_content"),
          attr(searchParams, "utm_term"),
      ];

      const hasAttributionColumns = await auditAttributionColumnsExist(app);
      const hasApiKeyIdColumn = await auditApiKeyIdColumnExists(app);
      const hasBotInternalColumns = await auditBotInternalColumnsExist(app);

      const columns = [
        "req_id", "method", "url", "path", "status_code", "response_time_ms", "ip", "user_agent", "referer",
        "user_id", "is_admin",
        ...(hasBotInternalColumns ? ["is_bot", "is_internal"] : []),
        "country", "city", "error_message", "error_code", "request_body",
        ...(hasApiKeyIdColumn ? ["api_key_id"] : []),
        ...(hasAttributionColumns ? ["gclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] : []),
      ];

      const values = [
        ...baseValues.slice(0, 11),
        ...(hasBotInternalColumns ? [isBot, isInternal] : []),
        ...baseValues.slice(11),
        ...(hasApiKeyIdColumn ? [(req as RequestWithUser).auditApiKeyId ?? null] : []),
        ...(hasAttributionColumns ? attributionValues : []),
      ];
      await app.db.query(
        `INSERT INTO audit_request_logs (${columns.map((column) => `\`${column}\``).join(", ")})
         VALUES (${columns.map(() => "?").join(", ")})`,
        values,
      );
    } catch (err) {
      req.log.warn({ err }, "audit_request_log_failed");
    } finally {
      requestStarts.delete(req);
    }
  });
});
