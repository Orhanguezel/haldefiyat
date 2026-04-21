/**
 * Haftalık push bülteni — tüm abonelere (Subscribed Users) broadcast.
 *
 * İçerik: son 7 gündeki en çok değişen 3-5 ürün (%) + özet başlık.
 * Trigger: cron "0 5 * * 1" (pazartesi 05:00 UTC = 08:00 Istanbul).
 *
 * Kullanıcı push'u açık tuttuğu sürece haftalık tek bildirim — not spam.
 */

import { trendingChanges } from "@/modules/prices/repository";
import { sendBroadcast, isOneSignalConfigured } from "./onesignal";
import { env } from "@/core/env";

export interface WeeklyDigestResult {
  sent:        boolean;
  reason?:     string;
  title?:      string;
  message?:    string;
  recipients?: number;
  movers?:     number;
}

/**
 * 2 ondalık basamak, Türkçe locale — push body içi kısa string.
 */
function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

/**
 * Bülten metnini oluştur ve push gönder. Return: ne gönderildi, neden.
 */
export async function runWeeklyDigest(): Promise<WeeklyDigestResult> {
  if (!isOneSignalConfigured()) {
    return { sent: false, reason: "onesignal-not-configured" };
  }

  const movers = await trendingChanges(20);
  if (!movers.length) {
    return { sent: false, reason: "no-movers" };
  }

  // Mutlak değişim büyüklüğüne göre zaten sıralı — ilk 5'i al, başlığa 3
  const top = movers.slice(0, 5);
  const headline = top
    .slice(0, 3)
    .map((m) => `${m.product?.nameTr ?? "Ürün"} ${fmtPct(m.changePct)}`)
    .join(" · ");

  const title   = "📈 Haftalık Hal Özeti";
  const message = `Bu hafta en çok değişen: ${headline}`;
  const url     = `${env.ONESIGNAL.launchUrl}?utm_source=push&utm_campaign=weekly-digest`;

  const response = await sendBroadcast({ title, message, url });
  return {
    sent:       response != null && !response.errors,
    title,
    message,
    recipients: response?.recipients,
    movers:     top.length,
  };
}
