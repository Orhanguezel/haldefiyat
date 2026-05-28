/**
 * X-API-Key header bazli rate limit hook'u.
 * - Header yoksa: default fastify-rate-limit (IP bazli) gecerli kalir.
 * - Header varsa: tier-bazli daily limit kontrolu yapilir; asarsa 429.
 *
 * Global olarak `app.addHook("onRequest", apiKeyAuthHook)` ile baglanir.
 * Auth-required endpoint'lere zarar vermez (oraya zaten requireAuth eklenmis).
 */

import type { FastifyRequest, FastifyReply } from "fastify";
import { validateAndConsume } from "./repository";

const SKIP_PATHS = [
  "/api/health",
  "/api/v1/health",
  "/api/v1/telegram/webhook",
];

export async function apiKeyAuthHook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Webhook + health probe'lari rate limit/key kontrolune girmez
  if (SKIP_PATHS.some((p) => req.url.startsWith(p))) return;

  const rawKey =
    (req.headers["x-api-key"] as string | undefined) ||
    (req.headers["X-API-Key"] as string | undefined);

  if (!rawKey) return; // anahtar yoksa IP rate-limit'i devreye girer

  const result = await validateAndConsume(rawKey);
  if (!result.ok) {
    if (result.reason === "limit_exceeded") {
      reply.header("X-RateLimit-Tier", result.record!.tier);
      reply.header("X-RateLimit-Limit", String(result.record!.dailyLimit));
      reply.header("X-RateLimit-Remaining", "0");
      return reply.status(429).send({
        error: "rate_limit_exceeded",
        tier: result.record!.tier,
        dailyLimit: result.record!.dailyLimit,
        message: "Günlük istek limitiniz doldu. Pro tier için /pro sayfasını ziyaret edin.",
      }) as unknown as void;
    }
    return reply.status(401).send({
      error: "invalid_api_key",
      reason: result.reason,
    }) as unknown as void;
  }

  (req as FastifyRequest & { auditApiKeyId?: number }).auditApiKeyId = result.record!.id;

  // Basarili: header'larla bilgi don, limit muafiyetini isaretle
  reply.header("X-RateLimit-Tier", result.record!.tier);
  reply.header("X-RateLimit-Limit", String(result.record!.dailyLimit));
  reply.header("X-RateLimit-Remaining", String(result.record!.dailyLimit - result.record!.usedToday));
  // Fastify rate-limit muafiyeti: bayrak set et — app.ts'de ek skip listesi yok,
  // bu hook zaten daily limit'i DB tarafinda uyguluyor, ek IP-limit risksiz (key sahibi
  // yine de 600/dakika global cap altinda).
}
