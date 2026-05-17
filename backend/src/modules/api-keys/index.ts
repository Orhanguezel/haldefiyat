/**
 * API anahtarlari modulu.
 *
 * Public/auth-required:
 *   GET    /api/v1/keys           → kullanicinin kendi anahtarlari
 *   POST   /api/v1/keys           → yeni anahtar olustur (free tier default, max 3 aktif)
 *   DELETE /api/v1/keys/:id       → revoke
 *
 * Pro tier durumu (genel bilgi, frontend /pro sayfasi icin):
 *   GET    /api/v1/keys/plans     → free + pro tier limit + fiyat bilgisi (auth-free)
 *
 * Admin:
 *   GET    /api/v1/admin/api-keys             → tum aktif anahtarlar
 *   POST   /api/v1/admin/api-keys/:id/tier    → free/pro yukseltme (manuel; odeme sonra)
 *
 * Header bazli kullanim: `X-API-Key: hf_xxxxxxxx...` — apiKeyAuth onRequest hook'unda
 * dogrulanir + tier-bazli rate limit uygulanir (./middleware.ts).
 */

import type { FastifyInstance } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import { env } from "@/core/env";
import {
  issueKey,
  listUserKeys,
  revokeKey,
  upgradeTier,
  listAllKeysAdmin,
} from "./repository";

export async function registerApiKeysPublic(api: FastifyInstance) {
  // Plan/fiyatlandirma bilgisi — frontend /pro sayfasi icin (auth-free)
  api.get("/keys/plans", async (_req, reply) => {
    return reply.send({
      plans: [
        {
          tier: "free",
          dailyLimit: env.API_KEY_FREE_DAILY_LIMIT,
          priceMonthlyTL: 0,
          features: [
            `${env.API_KEY_FREE_DAILY_LIMIT} istek/gün`,
            "Tüm public endpoint'ler",
            "API key ile yüksek limit",
          ],
        },
        {
          tier: "pro",
          dailyLimit: env.API_KEY_PRO_DAILY_LIMIT,
          priceMonthlyTL: env.PRO_PRICE_MONTHLY_TL,
          features: [
            `${env.API_KEY_PRO_DAILY_LIMIT.toLocaleString("tr-TR")} istek/gün`,
            "Öncelikli destek",
            "Yüksek hacim için fiyat indirimi (manuel görüşme)",
          ],
        },
      ],
    });
  });

  api.get("/keys", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    if (!userId) return reply.status(401).send({ error: "auth_required" });
    const items = await listUserKeys(userId);
    return reply.send({ items });
  });

  api.post<{ Body: { name?: string } }>(
    "/keys",
    { onRequest: [requireAuth] },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.status(401).send({ error: "auth_required" });
      try {
        const issued = await issueKey(userId, req.body?.name);
        // Ham anahtar yalniz bu cevapta doner — kullanici saklamali.
        return reply.send({
          ok: true,
          key: issued,
          notice: "Anahtarı şimdi kopyalayın; bir daha gösterilmeyecek.",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(400).send({ ok: false, error: msg });
      }
    },
  );

  api.delete<{ Params: { id: string } }>(
    "/keys/:id",
    { onRequest: [requireAuth] },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.status(401).send({ error: "auth_required" });
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid_id" });
      await revokeKey(userId, id);
      return reply.send({ ok: true });
    },
  );
}

export async function registerApiKeysAdmin(adminApi: FastifyInstance) {
  adminApi.get("/api-keys", async (_req, reply) => {
    const items = await listAllKeysAdmin(200);
    return reply.send({ items });
  });

  adminApi.post<{ Params: { id: string }; Body: { tier: "free" | "pro" } }>(
    "/api-keys/:id/tier",
    async (req, reply) => {
      const id = parseInt(req.params.id, 10);
      const tier = req.body?.tier;
      if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid_id" });
      if (tier !== "free" && tier !== "pro") {
        return reply.status(400).send({ error: "tier 'free' veya 'pro' olmalı" });
      }
      await upgradeTier(id, tier);
      return reply.send({ ok: true });
    },
  );
}
