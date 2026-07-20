/**
 * Haftalik e-bulten — newsletter_subscribers tablosundaki verified + active
 * abonelere SMTP uzerinden HTML mail gonderir.
 *
 * Icerik:
 *  - Temel urunler: sabit sepet, gecen yilin ayni haftasina gore degisim
 *  - Mevsimin urunleri: su an sezonunda olanlar, sezon basina gore seyir
 *
 * Neden bu ikisi: haftalik degisim cogu hafta gurultudur (bu hafta domates -%2,3,
 * biber %0,0) — okura bir sey soylemez. Yillik degisim ise hem haber degeri tasir hem
 * de 5 yillik tarihsel seri sayesinde rakiplerin uretemedigi veridir. Mevsimlik urunlerde
 * ise yillik kiyas yalan uretir (hasat kaymasi), o yuzden ayri bolum + ayri metodoloji.
 *
 * Tetikleyici:
 *  - Cron: `0 6 * * 1` (pazartesi 06:00 UTC = 09:00 TRT, push'tan 1 saat sonra)
 *  - Admin manuel: POST /admin/hal/newsletter/weekly-mail
 *
 * SMTP yapilandirilmamissa veya hic abone yoksa silently skip.
 */

import { sql, isNull } from "drizzle-orm";
import { mysqlTable, varchar, datetime, tinyint, text } from "drizzle-orm/mysql-core";

import { db } from "@/db/client";
import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { weeklyBasket, type BasketRow } from "@/modules/prices/basket";
import { seasonalProducts, type SeasonalRow } from "@/modules/prices/seasonal";
import { unsubUrl, unsubHeaders } from "@/modules/newsletter/token";
import { getSend, markSent, recordSend } from "./newsletter-archive";

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

const TH = "padding:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;";
const TD = "padding:10px 8px;border-bottom:1px solid #e5e7eb;";
const NUM = `${TD}text-align:right;font-family:monospace;`;

function productCell(slug: string, name: string, sub: string): string {
  return `<td style="${TD}">
    <a href="${SITE_URL}/urun/${slug}" style="color:#0f172a;text-decoration:none;font-weight:600;">${name}</a>
    <div style="color:#6b7280;font-size:11px;">${sub}</div>
  </td>`;
}

function basketTable(rows: BasketRow[]): string {
  const body = rows.map((r) => `
    <tr>
      ${productCell(r.productSlug, r.productName, `${r.marketCount} halde medyan`)}
      <td style="${NUM}color:#6b7280;">${r.lastYearAvg != null ? `₺${fmtPriceTr(r.lastYearAvg)}` : "—"}</td>
      <td style="${NUM}color:#0f172a;font-weight:600;">₺${fmtPriceTr(r.price)}</td>
      <td style="${NUM}color:${r.yoyPct != null ? pctColor(r.yoyPct) : "#6b7280"};font-weight:600;">
        ${r.yoyPct != null ? fmtPct(r.yoyPct) : "—"}
      </td>
    </tr>`).join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:#f9fafb;">
      <th style="text-align:left;${TH}">Urun</th>
      <th style="text-align:right;${TH}">Gecen yil</th>
      <th style="text-align:right;${TH}">Bu hafta</th>
      <th style="text-align:right;${TH}">Degisim</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

function seasonalTable(rows: SeasonalRow[]): string {
  const body = rows.map((r) => `
    <tr>
      ${productCell(r.productSlug, r.productName, `${r.seasonWeeks}. sezon haftasi, ${r.marketCount} halde`)}
      <td style="${NUM}color:#6b7280;">₺${fmtPriceTr(r.seasonStart)}</td>
      <td style="${NUM}color:#0f172a;font-weight:600;">₺${fmtPriceTr(r.price)}</td>
      <td style="${NUM}color:${pctColor(r.changePct)};font-weight:600;">${fmtPct(r.changePct)}</td>
    </tr>`).join("");

  return `<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:#f9fafb;">
      <th style="text-align:left;${TH}">Urun</th>
      <th style="text-align:right;${TH}">Sezon basi</th>
      <th style="text-align:right;${TH}">Bu hafta</th>
      <th style="text-align:right;${TH}">Degisim</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

/**
 * Konu satiri sabit sepetten uretilir — okurun tanidigi urun ismi acilma oranini belirler.
 * Eskiden "en cok yuzde degisen" urunden ureluyordu ve "Bamya +%33" gibi kimseyi
 * ilgilendirmeyen basliklar cikiyordu.
 */
function buildSubject(basket: BasketRow[]): string {
  const moved = basket
    .filter((r) => r.yoyPct != null)
    .sort((a, b) => Math.abs(b.yoyPct!) - Math.abs(a.yoyPct!))
    .slice(0, 2)
    .map((r) => `${r.productName} ${fmtPct(r.yoyPct!)}`);

  return moved.length
    ? `Gecen yila gore ${moved.join(", ")}`
    : "Hal fiyatlari haftalik ozet";
}

async function buildHtml(): Promise<{ html: string; subject: string; movers: number } | null> {
  const [basket, seasonal] = await Promise.all([weeklyBasket(), seasonalProducts(8)]);
  if (basket.length === 0) return null;

  const subject = buildSubject(basket);

  // Mevsimlik bolum veri yoksa tamamen dusurulur — bos tablo basmaktansa hic gosterme.
  const seasonalSection = seasonal.length ? `
      <h2 style="margin:32px 0 4px;font-size:16px;color:#0f172a;">Mevsimin Urunleri</h2>
      <p style="margin:0 0 12px;color:#6b7280;font-size:12px;line-height:1.6;">
        Su an sezonunda olan urunler. Mevsimlik urunlerde gecen yilla karsilastirma yaniltir —
        hasat bir hafta kaysa fiyat carpilir. Onun yerine urunun <strong>kendi sezonu icindeki
        seyri</strong> gosteriliyor: sezon basindaki fiyat ile bugunku fiyat.
      </p>
      ${seasonalTable(seasonal)}` : "";

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
      <h2 style="margin:0 0 4px;font-size:16px;color:#0f172a;">Temel Urunler</h2>
      <p style="margin:0 0 12px;color:#6b7280;font-size:12px;line-height:1.6;">
        En cok tuketilen urunler, her hafta ayni sirada. Gecen yilin ayni haftasiyla karsilastirma;
        yalnizca her iki yilda da <strong>ayni halde ve ayni urun kaydiyla</strong> olculmus
        fiyatlar kiyaslanir. Fiyatlar haller arasindaki medyandir (₺/kg).
      </p>
      ${basketTable(basket)}
      ${seasonalSection}
      <div style="margin-top:28px;padding:16px;background:#f0fdf4;border-radius:6px;font-size:13px;color:#166534;">
        <strong>💡 Bilgi:</strong> Tum fiyatlar resmi belediye hal mudurluklerinden gunluk olarak derlenmektedir.
        Tarihsel veri ve detayli karsilastirma icin
        <a href="${SITE_URL}" style="color:#16a34a;font-weight:600;">haldefiyat.com</a>'u ziyaret edin.
      </div>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;">
      Bu bulteni almak istemiyorsaniz <a href="{{UNSUB_URL}}" style="color:#6b7280;">abonelikten cikabilirsiniz</a>.
    </div>
  </div>
</body>
</html>`;

  return { html, subject, movers: basket.length };
}

/** HTML preview için — mail göndermeden sadece şablonu üretir */
export async function buildWeeklyMailPreview(): Promise<{ html: string; subject: string } | null> {
  const content = await buildHtml();
  if (!content) return null;
  // Önizlemede token yok — genel sayfaya işaret et.
  const html = content.html.replace(/\{\{UNSUB_URL\}\}/g, `${SITE_URL}/abonelik`);
  return { html, subject: content.subject };
}

/** Tek bir adrese test maili gönderir (admin panel test akışı için) */
export async function sendWeeklyMailTest(to: string): Promise<{ sent: boolean; reason?: string }> {
  const content = await buildHtml();
  if (!content) return { sent: false, reason: "no-movers" };
  try {
    const html = content.html.replace(/\{\{UNSUB_URL\}\}/g, unsubUrl(to));
    await sendBereketMail({ to, subject: `[TEST] ${content.subject}`, html });
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

async function sendToOne(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const personalized = html.replace(/\{\{UNSUB_URL\}\}/g, unsubUrl(to));
    await sendBereketMail({ to, subject, html: personalized, headers: unsubHeaders(to) } as Parameters<typeof sendBereketMail>[0]);
    return true;
  } catch (err) {
    console.warn(`[weekly-mail] ${to} hata:`, err instanceof Error ? err.message : err);
    return false;
  }
}

/** Guncel veriden bulten uretip TASLAK olarak arsive yazar — gonderim yok. */
export async function createWeeklyDraft(): Promise<{ ok: boolean; id?: string; subject?: string; reason?: string }> {
  let content: { html: string; subject: string; movers: number } | null;
  try {
    content = await buildHtml();
  } catch (err) {
    return { ok: false, reason: `build_html_error: ${err instanceof Error ? err.message : err}` };
  }
  if (!content) return { ok: false, reason: "no-data" };

  const id = await recordSend({ status: "draft", subject: content.subject, html: content.html });
  return { ok: true, id, subject: content.subject };
}

/** Abonelere gonderir. Arsivdeki HTML degistirilmeden aynen kullanilir. */
async function deliver(subject: string, html: string): Promise<{ recipients: number; successes: number; failures: number } | { reason: string }> {
  // Single opt-in: explicit form girişi = açık rıza. is_verified şartı yok,
  // sadece unsubscribe etmemiş aboneler. (Bkz. newsletter-activation.md)
  const subs = await db
    .select({ email: newsletterSubscribers.email })
    .from(newsletterSubscribers)
    .where(isNull(newsletterSubscribers.unsubscribedAt));

  if (subs.length === 0) return { reason: "no-active-subscribers" };

  let successes = 0;
  let failures = 0;
  for (let i = 0; i < subs.length; i += SEND_CONCURRENCY) {
    const batch = subs.slice(i, i + SEND_CONCURRENCY);
    const results = await Promise.all(batch.map((s) => sendToOne(s.email, subject, html)));
    for (const ok of results) {
      if (ok) successes++;
      else failures++;
    }
  }
  return { recipients: subs.length, successes, failures };
}

/** Arsivdeki bir taslagi — panelde incelenmis/duzenlenmis haliyle — gonderir. */
export async function sendStoredDraft(id: string): Promise<WeeklyMailResult> {
  const row = await getSend(id);
  if (!row) return { sent: false, reason: "not-found" };
  if (row.status !== "draft") return { sent: false, reason: "already-sent" };

  const out = await deliver(row.subject, row.html);
  if ("reason" in out) {
    await markSent(id, { status: "skipped", recipients: 0, successes: 0, failures: 0, reason: out.reason });
    return { sent: false, reason: out.reason };
  }

  await markSent(id, {
    status: out.successes > 0 ? "sent" : "failed",
    ...out,
  });
  return { sent: out.successes > 0, ...out };
}

export async function runWeeklyMailDigest(): Promise<WeeklyMailResult> {
  let content: { html: string; subject: string; movers: number } | null;
  try {
    content = await buildHtml();
  } catch (err) {
    return { sent: false, reason: `build_html_error: ${err instanceof Error ? err.message : err}` };
  }
  if (!content) {
    await recordSend({ status: "skipped", subject: "(uretilemedi)", html: "", reason: "no-data" });
    return { sent: false, reason: "no-data" };
  }

  const out = await deliver(content.subject, content.html);
  if ("reason" in out) {
    await recordSend({ status: "skipped", subject: content.subject, html: content.html, reason: out.reason });
    return { sent: false, reason: out.reason };
  }

  // Arsiv her zaman tam olsun: cron dogrudan gonderse de kayit dusulur.
  await recordSend({
    status: out.successes > 0 ? "sent" : "failed",
    subject: content.subject,
    html: content.html,
    ...out,
  });

  return { sent: out.successes > 0, ...out };
}

// trendingChanges'in sezon-spesifik bagimsizligi icin sql import'u yorum satirinda kalmasin
void sql;
