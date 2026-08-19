import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "@/core/env";
import { normalizeClientIp } from "@/plugins/auditRequestLogger";
import { isInternalIp } from "./export-guard";

// Anonim /api/v1/prices* trafigi icin IP basina gunluk kota. export-guard'in genellemesi:
// export DB sayimi kullanir (dusuk hacim), burasi her anonim fiyat isteginde calistigi icin
// bellek-ici sayac tutar (backend tek fork process — pm2 hal-backend). Restart sayaci
// sifirlar; kota kotu niyeti kesmek icindir, muhasebe audit_request_logs'ta zaten tam.
const DAY_COUNTS = new Map<string, { day: string; count: number }>();
const MAX_TRACKED_IPS = 50_000;

export function checkAndCountAnonPricesHit(
  ip: string,
  today: string,
  limit: number,
): { allowed: boolean; used: number } {
  let entry = DAY_COUNTS.get(ip);
  if (!entry || entry.day !== today) {
    entry = { day: today, count: 0 };
    DAY_COUNTS.set(ip, entry);
  }
  if (entry.count >= limit) return { allowed: false, used: entry.count };
  entry.count += 1;
  // Bellek tavani: gun donumunde eski gunun kayitlarini topluca birak.
  if (DAY_COUNTS.size > MAX_TRACKED_IPS) {
    for (const [key, value] of DAY_COUNTS) {
      if (value.day !== today) DAY_COUNTS.delete(key);
    }
  }
  return { allowed: true, used: entry.count };
}

/**
 * preHandler asamasinda calisir (apiKeyAuthHook onRequest'te auditApiKeyId'yi coktan
 * set etmis olur). /api/v1 kapsamina eklenir, path filtresiyle yalniz fiyat API'sini tutar.
 * Muaf: API key sahipleri (tier limitine tabiler), internal IP'ler (SSR/localhost).
 * 429 cevabi audit_request_logs'a normal akista yazilir — admin panel "429" kolonu sayar.
 */
export async function pricesAnonQuotaGuard(req: FastifyRequest, reply: FastifyReply) {
  const path = req.url.split("?")[0] ?? "";
  if (!path.startsWith("/api/v1/prices")) return;
  if ((req as FastifyRequest & { auditApiKeyId?: number }).auditApiKeyId) return;

  const ip = normalizeClientIp(req);
  if (isInternalIp(ip)) return;

  const limit = env.PRICES_ANON_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10);
  const { allowed, used } = checkAndCountAnonPricesHit(ip, today, limit);
  if (!allowed) {
    reply.header("X-RateLimit-Limit", String(limit));
    reply.header("X-RateLimit-Remaining", "0");
    return reply.status(429).send({
      error: {
        code: "prices_daily_limit",
        message: `Günlük anonim istek limitine ulaştınız (${limit}/gün). Kesintisiz erişim için ücretsiz API anahtarı alın: /pro`,
      },
      details: { dailyLimit: limit, usedToday: used },
    });
  }
}
