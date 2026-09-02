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
import type { RowDataPacket } from "mysql2";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import { env } from "@/core/env";
import { isStripeConfigured } from "@/modules/billing/stripe-client";
import { API_SCOPES, grantScope, isApiScope, keyScopes, revokeScope } from "./scopes";
import {
  issueKey,
  listUserKeys,
  revokeKey,
  revokeKeyAdmin,
  upgradeTier,
  listAllKeysAdmin,
} from "./repository";

interface ApiKeyUsageRow extends RowDataPacket {
  keyId: number | string;
  keyPrefix: string | null;
  date: string | Date;
  requests: number | string;
  uniqueIps: number | string;
}

interface ApiKeyColumnRow extends RowDataPacket {
  Field: string;
}

function parseUsageDays(value: unknown): number {
  const raw = Number(value ?? 14);
  if (!Number.isFinite(raw)) return 14;
  return Math.min(90, Math.max(1, Math.trunc(raw)));
}

async function auditApiKeyIdColumnExists(api: FastifyInstance): Promise<boolean> {
  const [rows] = await api.db.query<ApiKeyColumnRow[]>(
    "SHOW COLUMNS FROM audit_request_logs WHERE Field = 'api_key_id'",
  );
  return rows.length > 0;
}

export async function registerApiKeysPublic(api: FastifyInstance) {
  // Plan/fiyatlandirma bilgisi — frontend /pro sayfasi icin (auth-free)
  api.get("/keys/plans", async (_req, reply) => {
    // Odeme yapilandirildiysa Pro self-service satin alinir; degilse eski
    // manuel onay akisina duseriz. Sayfa buna gore CTA gosterir — "Pro'ya Gec"
    // dugmesi calismayacak bir yere goturmez.
    const selfServe = isStripeConfigured();
    return reply.send({
      contract: {
        apiVersion: "v1",
        anonymousPerMinute: env.API_ANON_PER_MINUTE,
        keyedQuotaWindow: "UTC calendar day",
        pricingMode: selfServe ? "self_service" : "manual_approval",
        publicSla: null,
      },
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

  /**
   * Yazma yetkisi verme/alma — SELF-SERVICE DEGIL, bilincli olarak admin isi.
   * Anahtara yazma yetkisi vermek, o anahtarin sizmasi halinde musteri adina
   * islem yapilabilmesi demektir; bu karar bir insan tarafindan verilmelidir.
   */
  adminApi.post<{ Params: { id: string }; Body: { scope?: string } }>(
    "/api-keys/:id/scopes",
    async (req, reply) => {
      const id = parseInt(req.params.id, 10);
      const scope = String(req.body?.scope ?? "");
      if (!Number.isFinite(id)) return reply.status(400).send({ error: { code: "invalid_id", message: "Geçersiz anahtar." } });
      if (!isApiScope(scope)) {
        return reply.status(400).send({
          error: { code: "invalid_scope", message: `Tanımlı yetkiler: ${API_SCOPES.join(", ")}` },
        });
      }
      await grantScope(id, scope, getAuthUserId(req) ?? null);
      return reply.send({ ok: true, id, scopes: await keyScopes(id) });
    },
  );

  adminApi.delete<{ Params: { id: string; scope: string } }>(
    "/api-keys/:id/scopes/:scope",
    async (req, reply) => {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) return reply.status(400).send({ error: { code: "invalid_id", message: "Geçersiz anahtar." } });
      await revokeScope(id, decodeURIComponent(req.params.scope));
      return reply.send({ ok: true, id, scopes: await keyScopes(id) });
    },
  );

  adminApi.post<{ Params: { id: string } }>("/api-keys/:id/revoke", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "invalid_id" });
    await revokeKeyAdmin(id);
    return reply.send({ ok: true });
  });

  adminApi.get<{ Querystring: { days?: string | number } }>("/api-keys/daily-usage", async (req, reply) => {
    const days = parseUsageDays(req.query?.days);
    if (!(await auditApiKeyIdColumnExists(adminApi))) {
      return reply.send({ days, items: [] });
    }

    const [rows] = await adminApi.db.query<ApiKeyUsageRow[]>(
      `SELECT
         l.api_key_id AS keyId,
         k.key_prefix AS keyPrefix,
         DATE(l.created_at) AS date,
         COUNT(*) AS requests,
         COUNT(DISTINCT l.ip) AS uniqueIps
       FROM audit_request_logs l
       LEFT JOIN hf_api_keys k ON k.id = l.api_key_id
       WHERE l.api_key_id IS NOT NULL
         AND l.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY l.api_key_id, k.key_prefix, DATE(l.created_at)
       ORDER BY date DESC, requests DESC`,
      [days - 1],
    );

    return reply.send({
      days,
      items: rows.map((row) => ({
        keyId: Number(row.keyId),
        keyPrefix: row.keyPrefix ?? "",
        date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date).slice(0, 10),
        requests: Number(row.requests ?? 0),
        uniqueIps: Number(row.uniqueIps ?? 0),
      })),
    });
  });
}
