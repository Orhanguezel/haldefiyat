/**
 * Telegram interactive bot (inbound webhook).
 *
 * Kullanim:
 *   1. .env'e `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_WEBHOOK_SECRET` ekle.
 *   2. Servisi baslat, admin endpoint ile webhook URL'sini Telegram'a kaydet:
 *      POST /api/v1/admin/telegram-bot/set-webhook
 *   3. Kullanici bot'a /start, /yardim, /trending, /domates yazar; bot DM cevap doner.
 *
 * Komutlar:
 *   /start, /help, /yardim   → hosgeldin + komut listesi
 *   /trending                → top 5 yukselen + 5 dusen (son 7 gun)
 *   /<urun>  (orn /domates)  → o urun icin son fiyat raporu (min/avg/max + market listesi)
 *   Serbest metin (orn "salatalik") → ayni ürün araması
 *
 * Guvenlik: Webhook secret header (`X-Telegram-Bot-Api-Secret-Token`) ile dogrulanir.
 */

import type { FastifyInstance } from "fastify";
import { env } from "@/core/env";
import { handleTelegramUpdate, type TelegramUpdate } from "./commands";

export async function registerTelegramBotPublic(api: FastifyInstance) {
  /**
   * POST /api/v1/telegram/webhook
   * Telegram bu endpoint'e update gonderir. Token + secret ile dogrulanir.
   */
  api.post<{ Body: TelegramUpdate }>("/telegram/webhook", async (req, reply) => {
    const expected = env.TELEGRAM_WEBHOOK_SECRET;
    if (expected) {
      const got = req.headers["x-telegram-bot-api-secret-token"];
      if (got !== expected) {
        return reply.status(401).send({ ok: false, error: "invalid_secret" });
      }
    }

    // Webhook'a hizli 200 dondurmek Telegram retry'larini onler; cevap arka planda gider.
    void handleTelegramUpdate(req.body).catch((err) => {
      req.log.error({ err }, "[telegram-bot] update handler error");
    });
    return reply.send({ ok: true });
  });
}

export async function registerTelegramBotAdmin(adminApi: FastifyInstance) {
  /**
   * POST /api/v1/admin/telegram-bot/set-webhook
   * Telegram'a webhook URL'sini kaydeder. Body: { url?: string } (varsayilan: PUBLIC_BASE_URL + /api/v1/telegram/webhook)
   */
  adminApi.post<{ Body: { url?: string } }>("/telegram-bot/set-webhook", async (req, reply) => {
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return reply.status(400).send({ ok: false, error: "TELEGRAM_BOT_TOKEN_missing" });
    }

    const baseUrl = req.body?.url
      || (env.PUBLIC_BASE_URL ? `${env.PUBLIC_BASE_URL}/api/v1/telegram/webhook` : null);
    if (!baseUrl) {
      return reply.status(400).send({ ok: false, error: "url_required_or_PUBLIC_BASE_URL_unset" });
    }

    const secret = env.TELEGRAM_WEBHOOK_SECRET;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: baseUrl,
        secret_token: secret || undefined,
        allowed_updates: ["message"],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    return reply.send({ ok: Boolean(body.ok), webhookUrl: baseUrl, telegram: body });
  });

  /**
   * GET /api/v1/admin/telegram-bot/webhook-info
   * Mevcut webhook durumu (Telegram'dan getWebhookInfo).
   */
  adminApi.get("/telegram-bot/webhook-info", async (_req, reply) => {
    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      return reply.status(400).send({ ok: false, error: "TELEGRAM_BOT_TOKEN_missing" });
    }
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const body = await res.json().catch(() => ({}));
    return reply.send(body);
  });
}
