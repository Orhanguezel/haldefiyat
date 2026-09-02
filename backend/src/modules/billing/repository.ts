/**
 * Abonelik durumu ve API anahtar tier'inin senkronizasyonu.
 *
 * TEK KAYNAK: hf_api_subscriptions. hf_api_keys.tier ondan TURETILIR — abonelik
 * degistiginde kullanicinin tum anahtarlari birlikte guncellenir. Anahtar basina
 * elle tier atamak (eski admin akisi) durur ama artik yalnizca istisna icindir;
 * bir sonraki abonelik olayi onu ezer.
 */

import { pool } from "@/db/client";
import { env } from "@/core/env";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/** Pro erisimi saglayan Stripe durumlari. Digerleri (past_due, unpaid...) vermez. */
const ENTITLING_STATUSES = new Set(["trialing", "active"]);

export interface SubscriptionRecord {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Su an pro erisimi var mi — durum VE donem sonu birlikte degerlendirilir. */
  active: boolean;
}

interface SubscriptionRow extends RowDataPacket {
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: Date | null;
  cancel_at_period_end: number;
}

function toRecord(row: SubscriptionRow): SubscriptionRecord {
  const periodEnd = row.current_period_end ? new Date(row.current_period_end) : null;
  const notExpired = periodEnd === null || periodEnd.getTime() > Date.now();
  return {
    userId:               row.user_id,
    stripeCustomerId:     row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status:               row.status,
    currentPeriodEnd:     periodEnd ? periodEnd.toISOString() : null,
    cancelAtPeriodEnd:    row.cancel_at_period_end === 1,
    active:               ENTITLING_STATUSES.has(row.status) && notExpired,
  };
}

export async function getSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const [rows] = await pool.query<SubscriptionRow[]>(
    "SELECT * FROM hf_api_subscriptions WHERE user_id = ? LIMIT 1",
    [userId],
  );
  const row = rows[0];
  return row ? toRecord(row) : null;
}

export async function hasProAccess(userId: string): Promise<boolean> {
  const sub = await getSubscription(userId);
  return sub?.active ?? false;
}

/**
 * Abonelik durumunu yazar ve kullanicinin anahtarlarini o duruma esitler.
 * Webhook'tan cagrilir; idempotenttir (ayni olay iki kez gelirse sonuc ayni).
 */
export async function upsertSubscription(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  await pool.query(
    `INSERT INTO hf_api_subscriptions
       (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stripe_customer_id     = VALUES(stripe_customer_id),
       stripe_subscription_id = VALUES(stripe_subscription_id),
       status                 = VALUES(status),
       current_period_end     = VALUES(current_period_end),
       cancel_at_period_end   = VALUES(cancel_at_period_end)`,
    [input.userId, input.stripeCustomerId, input.stripeSubscriptionId, input.status,
     input.currentPeriodEnd, input.cancelAtPeriodEnd ? 1 : 0],
  );
  await syncKeyTiers(input.userId);
}

/**
 * Kullanicinin iptal edilmemis anahtarlarini abonelik durumuna esitler.
 * Pro'dan free'ye duserken gunluk sayac SIFIRLANMAZ: sifirlamak, o gun pro
 * limitiyle harcanmis istekleri silip kullaniciya ikinci bir kota vermek olurdu.
 */
export async function syncKeyTiers(userId: string): Promise<number> {
  const pro = await hasProAccess(userId);
  const tier = pro ? "pro" : "free";
  const limit = pro ? env.API_KEY_PRO_DAILY_LIMIT : env.API_KEY_FREE_DAILY_LIMIT;
  const [result] = await pool.query<ResultSetHeader>(
    "UPDATE hf_api_keys SET tier = ?, daily_limit = ? WHERE user_id = ? AND revoked_at IS NULL",
    [tier, limit, userId],
  );
  return result.affectedRows;
}

/**
 * Stripe olay defteri — ayni event id ikinci kez islenmez.
 * true = ilk kez gorulen olay (islenmeli), false = tekrar teslimat (atlanmali).
 */
export async function recordStripeEvent(event: {
  id: string; type: string; apiVersion: string; payload: string;
}): Promise<boolean> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT IGNORE INTO hf_stripe_events (id, type, api_version, payload) VALUES (?, ?, ?, ?)",
    [event.id, event.type, event.apiVersion, event.payload],
  );
  return result.affectedRows > 0;
}
