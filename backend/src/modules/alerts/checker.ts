import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfAlerts, hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";
import { sendTelegramAlert } from "./telegram";
import { sendEmailAlert, buildAlertEmailHtml } from "./email";
import { sendToExternalIds, isOneSignalConfigured } from "@/modules/notifications/onesignal";
import { repoGetUserByEmail } from "@agro/shared-backend/modules/auth/repository";
import { createUserNotification } from "@agro/shared-backend/modules/notifications/service";

const RETRIGGER_COOLDOWN_HOURS = 24;

type ActiveAlert = {
  id:               number;
  userId:           string | null;
  productId:        number;
  marketId:         number | null;
  thresholdPrice:   string | null;
  direction:        "above" | "below" | null;
  contactEmail:     string | null;
  contactTelegram:  string | null;
  lastTriggered:    Date | null;
};

type LatestPriceRow = {
  avgPrice:     string;
  recordedDate: Date | string;
  marketName:   string | null;
  productName:  string;
};

async function fetchActiveAlerts(): Promise<ActiveAlert[]> {
  const rows = await db
    .select({
      id:              hfAlerts.id,
      userId:          hfAlerts.userId,
      productId:       hfAlerts.productId,
      marketId:        hfAlerts.marketId,
      thresholdPrice:  hfAlerts.thresholdPrice,
      direction:       hfAlerts.direction,
      contactEmail:    hfAlerts.contactEmail,
      contactTelegram: hfAlerts.contactTelegram,
      lastTriggered:   hfAlerts.lastTriggered,
    })
    .from(hfAlerts)
    .where(eq(hfAlerts.isActive, 1));
  return rows as ActiveAlert[];
}

async function fetchLatestPrice(productId: number, marketId: number | null): Promise<LatestPriceRow | null> {
  const conds = [eq(hfPriceHistory.productId, productId)];
  if (marketId != null) conds.push(eq(hfPriceHistory.marketId, marketId));

  const rows = await db
    .select({
      avgPrice:     hfPriceHistory.avgPrice,
      recordedDate: hfPriceHistory.recordedDate,
      marketName:   hfMarkets.name,
      productName:  hfProducts.nameTr,
    })
    .from(hfPriceHistory)
    .innerJoin(hfMarkets,  eq(hfMarkets.id,  hfPriceHistory.marketId))
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(and(...conds))
    .orderBy(desc(hfPriceHistory.recordedDate))
    .limit(1);

  return rows[0] ? (rows[0] as LatestPriceRow) : null;
}

function shouldTrigger(latest: number, threshold: number, direction: "above" | "below"): boolean {
  if (direction === "above") return latest >= threshold;
  if (direction === "below") return latest <= threshold;
  return false;
}

function isInCooldown(lastTriggered: Date | null): boolean {
  if (!lastTriggered) return false;
  const diffMs = Date.now() - new Date(lastTriggered).getTime();
  return diffMs < RETRIGGER_COOLDOWN_HOURS * 60 * 60 * 1000;
}

function toDateString(d: Date | string): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export type CheckAlertsResult = {
  scanned: number;
  triggered: number;
  skipped: number;
};

export async function checkAndNotifyAlerts(): Promise<CheckAlertsResult> {
  const alerts = await fetchActiveAlerts();
  let triggered = 0;
  let skipped = 0;

  for (const a of alerts) {
    if (!a.direction || !a.thresholdPrice) { skipped++; continue; }
    if (isInCooldown(a.lastTriggered))     { skipped++; continue; }

    const latest = await fetchLatestPrice(a.productId, a.marketId);
    if (!latest) { skipped++; continue; }

    const lp = parseFloat(latest.avgPrice);
    const tp = parseFloat(a.thresholdPrice);
    if (!Number.isFinite(lp) || !Number.isFinite(tp)) { skipped++; continue; }
    if (!shouldTrigger(lp, tp, a.direction))          { skipped++; continue; }

    await notifyAlert(a, latest, lp, tp);
    await createAlertNotification(a, latest, lp, tp);
    await markTriggered(a.id);
    triggered++;
  }

  return { scanned: alerts.length, triggered, skipped };
}

async function notifyAlert(a: ActiveAlert, latest: LatestPriceRow, lp: number, tp: number) {
  const recordedDate = toDateString(latest.recordedDate);
  const subject = `HaldeFiyat: ${latest.productName} fiyat alarmi`;
  const direction = a.direction!;

  if (a.contactTelegram) {
    const dirText = direction === "above" ? "<b>ustune cikti</b>" : "<b>altina indi</b>";
    const marketLine = latest.marketName ? `\nHal: ${latest.marketName}` : "";
    const text =
      `<b>Fiyat Alarmi</b>\n` +
      `${latest.productName} fiyati esigin ${dirText}.${marketLine}\n` +
      `Guncel: ${lp.toFixed(2)} TL/kg\n` +
      `Esik:   ${tp.toFixed(2)} TL/kg\n` +
      `Tarih:  ${recordedDate}`;
    await sendTelegramAlert(a.contactTelegram, text);
  }

  if (a.contactEmail) {
    const html = buildAlertEmailHtml({
      productName:    latest.productName,
      marketName:     latest.marketName,
      latestPrice:    lp,
      thresholdPrice: tp,
      direction,
      recordedDate,
    });
    await sendEmailAlert(a.contactEmail, subject, html);

    // Push: alert'in e-postasına sahip kullanıcı OneSignal'e login olduysa
    // (frontend OneSignalProvider user.id ile) external_id eşleşmesi ile
    // bildirim gider. Kullanıcı push'u açmamışsa OneSignal sessizce skip.
    if (isOneSignalConfigured()) {
      try {
        const user = await repoGetUserByEmail(a.contactEmail);
        if (user?.id) {
          const dirLabel = direction === "above" ? "üstüne çıktı" : "altına indi";
          const marketLine = latest.marketName ? ` · ${latest.marketName}` : "";
          await sendToExternalIds([user.id], {
            title:   `${latest.productName} ${dirLabel}`,
            message: `Güncel ${lp.toFixed(2)} TL/kg, eşik ${tp.toFixed(2)} TL${marketLine}`,
            url:     `https://haldefiyat.com/urun/${encodeURIComponent(
              latest.productName.toLocaleLowerCase("tr-TR").replace(/[^a-z0-9]+/g, "-"),
            )}`,
          });
        }
      } catch { /* push hatası alerts'i durdurmasın */ }
    }
  }
}

async function markTriggered(alertId: number): Promise<void> {
  await db
    .update(hfAlerts)
    .set({ lastTriggered: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(hfAlerts.id, alertId));
}

async function createAlertNotification(
  a: ActiveAlert,
  latest: LatestPriceRow,
  lp: number,
  tp: number,
): Promise<void> {
  if (!a.userId) return;
  const dirLabel = a.direction === "above" ? "üstüne çıktı" : "altına indi";
  const marketSuffix = latest.marketName ? ` · ${latest.marketName}` : "";
  try {
    await createUserNotification({
      userId:  a.userId,
      title:   `${latest.productName} fiyat uyarısı`,
      message: `${latest.productName} ${dirLabel}. Güncel: ${lp.toFixed(2)} ₺/kg, eşik: ${tp.toFixed(2)} ₺/kg${marketSuffix}`,
      type:    "custom",
    });
  } catch { /* bildirim hatası akışı durdurmasın */ }
}
