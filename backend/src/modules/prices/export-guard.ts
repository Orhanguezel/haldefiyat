import type { FastifyReply, FastifyRequest } from "fastify";

import { isInternalIpValue } from "@agro/shared-backend/modules/audit/helpers";

import { pool } from "@/db/client";
import { env } from "@/core/env";
import { normalizeClientIp } from "@/plugins/auditRequestLogger";

// Kendi SSR/internal trafigimiz kotadan muaf. Shared isInternalIpValue,
// ANALYTICS_INTERNAL_IP_PREFIXES env'ini de okur — VPS'in kendi public egress
// IP'si (SSR fetch'leri nginx uzerinden donunce o IP ile gelir) oraya eklenir;
// aksi halde sitenin kendi SSR'i anonim kotaya carpip 429 yiyebilirdi.
export function isInternalIp(ip: string): boolean {
  return !ip || ip.startsWith("172.") || isInternalIpValue(ip);
}

// /prices/export icin anonim (API key'siz) IP basina gunluk CSV indirme kotasi.
// Gecerli API key varsa (global apiKeyAuthHook req.auditApiKeyId set eder) kota uygulanmaz —
// key sahibi zaten tier gunluk limitine tabi. Sayac icin ek altyapi yok: bugunku export
// istekleri audit_request_logs'ta (senkron loglanir) ip+path ile sayilir.
export async function exportQuotaGuard(req: FastifyRequest, reply: FastifyReply) {
  if ((req as FastifyRequest & { auditApiKeyId?: number }).auditApiKeyId) return;

  const ip = normalizeClientIp(req);
  if (isInternalIp(ip)) return;

  const limit = env.EXPORT_ANON_DAILY_LIMIT;
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM audit_request_logs
     WHERE ip = ? AND path = '/api/v1/prices/export' AND created_at >= CURDATE()`,
    [ip],
  );
  const used = Number((rows as Array<{ c?: number | string }>)[0]?.c ?? 0);
  if (used >= limit) {
    reply.header("X-Export-Daily-Limit", String(limit));
    // error obje olmali: global onSend normalizer string 'error'i INTERNAL_SERVER_ERROR'a duser.
    return reply.status(429).send({
      error: {
        code: "export_daily_limit",
        message: `Günlük ücretsiz CSV indirme limitine ulaştınız (${limit}/gün). Sınırsız erişim için API anahtarı alın: /pro`,
      },
      details: { dailyLimit: limit },
    });
  }
}
