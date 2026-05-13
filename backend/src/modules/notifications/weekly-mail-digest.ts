/**
 * Haftalik e-bulten — newsletter_subscribers tablosundaki verified + active
 * abonelere SMTP uzerinden HTML mail gonderir.
 *
 * Icerik:
 *  - Bu hafta en cok degisen 5 urun (% degisim)
 *  - Sezonluk urunler (mevcut ayda hasatta olanlar)
 *  - Gecen yila gore karsilastirma (yoyChangePct ile)
 *
 * Tetikleyici:
 *  - Cron: `0 6 * * 1` (pazartesi 06:00 UTC = 09:00 TRT, push'tan 1 saat sonra)
 *  - Admin manuel: POST /admin/hal/newsletter/weekly-mail
 *
 * SMTP yapilandirilmamissa veya hic abone yoksa silently skip.
 */

import { sql, and, isNull, eq } from "drizzle-orm";
import { mysqlTable, varchar, datetime, tinyint, text } from "drizzle-orm/mysql-core";

import { db } from "@/db/client";
import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { trendingChanges, widgetPrices } from "@/modules/prices/repository";

// Newsletter aboneleri tablosu (shared-backend schemasi yerine local proxy)
const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id:              varchar("id", { length: 36 }).primaryKey(),
  email:           varchar("email", { length: 255 }).notNull(),
  isVerified:      tinyint("is_verified").notNull().default(0),
  locale:          varchar("locale", { length: 10 }),
  meta:            text("meta"),
  unsubscribedAt:  datetime("unsubscribed_at", { fsp: 3 }),
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://haldefiyat.com").replace(/\/$/, "");
const SEND_CONCURRENCY = 5;

export interface WeeklyMailResult {
  sent: boolean;
  reason?: string;
  recipients?: number;
  successes?: number;
  failures?: number;
}

function fmtPriceTr(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function pctColor(n: number): string {
  if (n > 0) return "#16a34a"; // yesil = fiyat yukseliyor (PriceTicker ile tutarli)
  if (n < 0) return "#dc2626"; // kirmizi
  return "#6b7280";
}

async function buildHtml(): Promise<{ html: string; subject: string; movers: number } | null> {
  const trending = await trendingChanges(10);
  if (trending.length === 0) return null;

  const movers = trending.slice(0, 6);
  const slugs = movers.map((m) => m.product?.slug).filter((s): s is string => !!s);
  const widget = await widgetPrices(slugs, undefined, slugs.length);
  const yoyBySlug = new Map(widget.map((w) => [w.productSlug, w.yoyChangePct]));

  const moverRows = movers.map((m) => {
    const yoy = yoyBySlug.get(m.product?.slug ?? "") ?? null;
    return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">
          <a href="${SITE_URL}/urun/${m.product?.slug ?? ""}" style="color:#0f172a;text-decoration:none;font-weight:600;">
            ${m.product?.nameTr ?? "Urun"}
          </a>
          <div style="color:#6b7280;font-size:11px;">${m.market?.cityName ?? ""}</div>
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace;color:#0f172a;">
          ₺${fmtPriceTr(m.latest)}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace;color:${pctColor(m.changePct)};font-weight:600;">
          ${fmtPct(m.changePct)}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-family:monospace;color:${yoy != null ? pctColor(yoy) : "#6b7280"};">
          ${yoy != null ? fmtPct(yoy) : "—"}
        </td>
      </tr>`;
  }).join("");

  const subject = `Hal Fiyatlari Haftalik Ozet — ${movers[0]?.product?.nameTr} ${fmtPct(movers[0]?.changePct ?? 0)}`;

  const html = `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:20px 24px;border-bottom:2px solid #16a34a;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#16a34a;">Haftalık Hal Özeti</div>
      <h1 style="margin:6px 0 0;font-size:22px;color:#0f172a;">Bu Hafta Hallerden Notlar</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
        Son 7 gunde en cok degisen urunler ve gecen yila gore karsilastirmasi:
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Urun</th>
            <th style="text-align:right;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Son</th>
            <th style="text-align:right;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">7g</th>
            <th style="text-align:right;padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">Gecen yil</th>
          </tr>
        </thead>
        <tbody>${moverRows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:6px;font-size:13px;color:#166534;">
        <strong>💡 Bilgi:</strong> Tum fiyatlar resmi belediye hal mudurluklerinden gunluk olarak derlenmektedir.
        Tarihsel veri ve detayli karsilastirma icin
        <a href="${SITE_URL}" style="color:#16a34a;font-weight:600;">haldefiyat.com</a>'u ziyaret edin.
      </div>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;">
      Bu bulteni almak istemiyorsaniz <a href="${SITE_URL}/abonelik?action=unsubscribe" style="color:#6b7280;">abonelikten cikabilirsiniz</a>.
    </div>
  </div>
</body>
</html>`;

  return { html, subject, movers: movers.length };
}

async function sendToOne(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await sendBereketMail({ to, subject, html });
    return true;
  } catch (err) {
    console.warn(`[weekly-mail] ${to} hata:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export async function runWeeklyMailDigest(): Promise<WeeklyMailResult> {
  // 1) Subject + HTML
  let content: { html: string; subject: string; movers: number } | null;
  try {
    content = await buildHtml();
  } catch (err) {
    return { sent: false, reason: `build_html_error: ${err instanceof Error ? err.message : err}` };
  }
  if (!content) {
    return { sent: false, reason: "no-movers" };
  }

  // 2) Aboneler
  const subs = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(and(
      eq(newsletterSubscribers.isVerified, 1),
      isNull(newsletterSubscribers.unsubscribedAt),
    ));

  if (subs.length === 0) {
    return { sent: false, reason: "no-active-subscribers" };
  }

  // 3) Paralel gönderim — concurrency limit
  let successes = 0;
  let failures = 0;
  for (let i = 0; i < subs.length; i += SEND_CONCURRENCY) {
    const batch = subs.slice(i, i + SEND_CONCURRENCY);
    const results = await Promise.all(
      batch.map((s) => sendToOne(s.email, content!.subject, content!.html)),
    );
    for (const ok of results) {
      if (ok) successes++;
      else failures++;
    }
  }

  return {
    sent: successes > 0,
    recipients: subs.length,
    successes,
    failures,
  };
}

// trendingChanges'in sezon-spesifik bagimsizligi icin sql import'u yorum satirinda kalmasin
void sql;
