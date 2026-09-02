/**
 * Pro abonelik uclari.
 *
 * Public (JWT):
 *   GET  /api/v1/billing/subscription  → kullanicinin plan durumu
 *   POST /api/v1/billing/checkout      → Stripe Checkout oturumu (mode=subscription)
 *   POST /api/v1/billing/portal        → Stripe musteri portali (iptal/kart/fatura)
 *
 * Webhook (imzali, auth'suz):
 *   POST /api/webhooks/stripe          → abonelik durumunu senkronlar
 *
 * FAIL-CLOSED: Stripe yapilandirilmamissa checkout 503 doner. Odeme yolunda
 * "yapilandirilmamis ama calisiyor gibi" bir durum OLMAZ.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHmac, timingSafeEqual } from "crypto";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import { pool } from "@/db/client";
import { env } from "@/core/env";
import type { RowDataPacket } from "mysql2";
import {
  createSubscriptionCheckout,
  createBillingPortalSession,
  isStripeConfigured,
  StripeNotConfiguredError,
} from "./stripe-client";
import {
  getSubscription,
  upsertSubscription,
  recordStripeEvent,
  syncKeyTiers,
} from "./repository";

const TOLERANCE_SECONDS = 5 * 60;

interface UserRow extends RowDataPacket { email: string | null }

async function userEmail(userId: string): Promise<string | null> {
  const [rows] = await pool.query<UserRow[]>("SELECT email FROM users WHERE id = ? LIMIT 1", [userId]);
  return rows[0]?.email ?? null;
}

function siteBase(): string {
  return (env.PUBLIC_BASE_URL || "https://haldefiyat.com").replace(/\/$/, "");
}

/**
 * Stripe-Signature dogrulamasi: v1 = HMAC-SHA256("{t}.{rawBody}", whsec).
 * SDK'siz — https://docs.stripe.com/webhooks#verify-manually
 * timingSafeEqual kullanilir; uzunluk farkinda karsilastirma yapilmaz.
 */
export function verifyStripeSignature(rawBody: Buffer, header: string, secret: string): boolean {
  const parts = new Map<string, string[]>();
  for (const kv of header.split(",")) {
    const idx = kv.indexOf("=");
    if (idx < 0) continue;
    const key = kv.slice(0, idx).trim();
    const value = kv.slice(idx + 1).trim();
    if (!parts.has(key)) parts.set(key, []);
    parts.get(key)!.push(value);
  }
  const timestamp = Number(parts.get("t")?.[0] ?? NaN);
  const signatures = parts.get("v1") ?? [];
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  // Replay penceresi: eski imzali istek tekrar oynatilamaz.
  if (Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  return signatures.some((sig) => {
    const sigBuf = Buffer.from(sig, "utf8");
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}

function toDate(seconds: unknown): Date | null {
  const n = Number(seconds);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000) : null;
}

export async function registerBillingPublic(api: FastifyInstance) {
  api.get("/billing/subscription", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    if (!userId) return reply.status(401).send({ error: "auth_required" });
    const sub = await getSubscription(userId);
    return reply.send({
      configured: isStripeConfigured(),
      tier: sub?.active ? "pro" : "free",
      subscription: sub,
      priceMonthlyTL: env.PRO_PRICE_MONTHLY_TL,
      dailyLimit: sub?.active ? env.API_KEY_PRO_DAILY_LIMIT : env.API_KEY_FREE_DAILY_LIMIT,
    });
  });

  api.post<{ Body: { locale?: string } }>(
    "/billing/checkout",
    { onRequest: [requireAuth] },
    async (req, reply) => {
      const userId = getAuthUserId(req);
      if (!userId) return reply.status(401).send({ error: "auth_required" });

      const existing = await getSubscription(userId);
      if (existing?.active) {
        return reply.status(409).send({ error: "already_subscribed" });
      }
      try {
        const base = siteBase();
        const session = await createSubscriptionCheckout({
          userId,
          email: await userEmail(userId),
          // Daha once musteri olusmussa ayni musteriye bagla — Stripe'ta
          // kullanici basina ikinci bir musteri kaydi olusmasin.
          customerId: existing?.stripeCustomerId ?? null,
          successUrl: `${base}/hesabim/api?odeme=basarili`,
          cancelUrl: `${base}/pro?odeme=iptal`,
          locale: req.body?.locale ?? "tr",
        });
        return reply.send({ ok: true, url: session.url });
      } catch (err) {
        if (err instanceof StripeNotConfiguredError) {
          req.log.error({ err: err.message }, "stripe_not_configured");
          return reply.status(503).send({ error: "odeme_yapilandirilmamis" });
        }
        req.log.error({ err }, "stripe_checkout_failed");
        return reply.status(502).send({ error: "odeme_saglayici_hatasi" });
      }
    },
  );

  api.post("/billing/portal", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    if (!userId) return reply.status(401).send({ error: "auth_required" });
    const sub = await getSubscription(userId);
    if (!sub?.stripeCustomerId) return reply.status(404).send({ error: "abonelik_yok" });
    try {
      const session = await createBillingPortalSession(sub.stripeCustomerId, `${siteBase()}/hesabim/api`);
      return reply.send({ ok: true, url: session.url });
    } catch (err) {
      if (err instanceof StripeNotConfiguredError) return reply.status(503).send({ error: "odeme_yapilandirilmamis" });
      req.log.error({ err }, "stripe_portal_failed");
      return reply.status(502).send({ error: "odeme_saglayici_hatasi" });
    }
  });
}

/**
 * Webhook — kendi kapsaminda ham gövde parser'i ile kaydedilir: imza HAM gövde
 * uzerinden hesaplanir, JSON parse edilmis gövde ile dogrulanamaz.
 */
export async function registerStripeWebhook(app: FastifyInstance) {
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => {
    done(null, body);
  });

  app.post("/webhooks/stripe", async (req: FastifyRequest, reply: FastifyReply) => {
    const secret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
    if (!secret) {
      req.log.error("STRIPE_WEBHOOK_SECRET yok — webhook fail-closed");
      return reply.status(503).send({ error: "webhook_disabled" });
    }
    const rawBody = req.body as Buffer;
    const signature = req.headers["stripe-signature"];
    if (!Buffer.isBuffer(rawBody) || typeof signature !== "string") {
      return reply.status(400).send({ error: "invalid_payload" });
    }
    if (!verifyStripeSignature(rawBody, signature, secret)) {
      return reply.status(400).send({ error: "invalid_signature" });
    }

    let event: Record<string, unknown>;
    try { event = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>; }
    catch { return reply.status(400).send({ error: "invalid_json" }); }
    if (!event.id || !event.type) return reply.status(400).send({ error: "invalid_event" });

    const fresh = await recordStripeEvent({
      id: String(event.id),
      type: String(event.type),
      apiVersion: String(event.api_version ?? ""),
      payload: rawBody.toString("utf8"),
    });
    if (!fresh) return reply.send({ received: true, duplicate: true });

    try {
      await handleStripeEvent(event, req);
    } catch (err) {
      // Islem hatasinda 500 doneriz: Stripe tekrar dener ve olay kaybolmaz.
      // Olay defterinden de silinir ki tekrar islenebilsin.
      await pool.query("DELETE FROM hf_stripe_events WHERE id = ?", [String(event.id)]);
      req.log.error({ err, type: event.type }, "stripe_event_handling_failed");
      return reply.status(500).send({ error: "handling_failed" });
    }
    return reply.send({ received: true });
  });
}

async function handleStripeEvent(event: Record<string, unknown>, req: FastifyRequest): Promise<void> {
  const type = String(event.type);
  const data = (event.data as { object?: Record<string, unknown> })?.object ?? {};

  if (type === "checkout.session.completed") {
    const userId = String(data.client_reference_id ?? (data.metadata as Record<string, string>)?.user_id ?? "");
    const customerId = String(data.customer ?? "");
    const subscriptionId = data.subscription ? String(data.subscription) : null;
    if (!userId || !customerId) {
      req.log.warn({ session: data.id }, "checkout_session_without_user");
      return;
    }
    // Donem sonu bu olayda yok; subscription.* olayi hemen ardindan gelir ve
    // dogru tarihi yazar. Burada erisimi hemen aciyoruz ki kullanici odeme
    // sonrasi bekletilmesin.
    await upsertSubscription({
      userId, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId,
      status: "active", currentPeriodEnd: null, cancelAtPeriodEnd: false,
    });
    return;
  }

  if (type.startsWith("customer.subscription.")) {
    const subscriptionId = String(data.id ?? "");
    const customerId = String(data.customer ?? "");
    const metaUser = (data.metadata as Record<string, string> | undefined)?.user_id ?? "";
    // Kullaniciyi once metadata'dan, yoksa musteri kaydindan cozeriz.
    let userId = metaUser;
    if (!userId && customerId) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT user_id FROM hf_api_subscriptions WHERE stripe_customer_id = ? LIMIT 1", [customerId],
      );
      userId = String(rows[0]?.user_id ?? "");
    }
    if (!userId) {
      req.log.warn({ subscriptionId, customerId }, "subscription_event_without_user");
      return;
    }
    const status = type === "customer.subscription.deleted" ? "canceled" : String(data.status ?? "incomplete");
    await upsertSubscription({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId || null,
      status,
      currentPeriodEnd: toDate(data.current_period_end),
      cancelAtPeriodEnd: data.cancel_at_period_end === true,
    });
    return;
  }

  if (type === "invoice.payment_failed") {
    const customerId = String(data.customer ?? "");
    if (!customerId) return;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT user_id FROM hf_api_subscriptions WHERE stripe_customer_id = ? LIMIT 1", [customerId],
    );
    const userId = String(rows[0]?.user_id ?? "");
    if (!userId) return;
    // Durumu Stripe'in subscription.updated olayi yazar; burada yalnizca
    // anahtarlari mevcut duruma esitleriz (past_due ise pro erisimi duser).
    await syncKeyTiers(userId);
  }
}
