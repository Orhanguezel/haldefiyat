import type { FastifyReply, FastifyRequest } from "fastify";

import { pool } from "@/db/client";
import { env } from "@/core/env";
import { normalizeClientIp } from "@/plugins/auditRequestLogger";

// Kendi SSR/internal trafigimiz (localhost + ozel aglar) kotadan muaf.
function isInternalIp(ip: string): boolean {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  );
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
    return reply.status(429).send({
      error: "export_daily_limit",
      message: `Gunluk ucretsiz CSV indirme limitine ulastiniz (${limit}/gun). Sinirsiz erisim icin API anahtari alin: /pro`,
      dailyLimit: limit,
    });
  }
}
