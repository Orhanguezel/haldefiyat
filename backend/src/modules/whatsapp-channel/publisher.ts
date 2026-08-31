import { pool } from "@/db/client";
import { env } from "@/core/env";
import { trendingChanges } from "@/modules/prices/repository";
import { buildDailyReportImageUrl } from "@/modules/telegram-channel/report-image";

// WhatsApp KANALLARINA resmi API ile gonderim YOK (Meta, 2026 itibariyla kanal
// otomasyonu sunmuyor; gayriresmi web-protokol araclari numara/kanal bani riski
// tasir). Bu modul RISKSIZ kopruyu kurar: gunluk gonderinin WhatsApp-formatli
// ikizi Telegram ADMIN sohbetine "kopyala -> kanala yapistir" olarak dusurulur.
// Meta ileride resmi Channels API acarsa postToWhatsapp() buraya eklenir;
// icerik uretimi hazir oldugundan tek degisiklik transport katmani olur.

const SITE_URL = "https://haldefiyat.com";

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

async function getWhatsappChannelUrl(): Promise<string> {
  try {
    const [rows] = await pool.query(
      "SELECT value FROM site_settings WHERE `key` = 'social_whatsapp' LIMIT 1",
    );
    const raw = String((rows as Array<{ value?: string }>)[0]?.value ?? "");
    return raw.replace(/^"|"$/g, "").trim();
  } catch {
    return "";
  }
}

function formatItemWa(i: number, item: {
  latest: number;
  changePct: number;
  product?: { nameTr?: string; displayName?: string | null; categorySlug?: string } | null;
  market?: { cityName?: string } | null;
}): string {
  const name = item.product?.displayName || item.product?.nameTr || "—";
  const city = item.market?.cityName ?? "";
  const prev = item.latest / (1 + item.changePct / 100);
  return (
    `${i}. *${name}* — ₺${fmtPrice(item.latest)} (${fmtPct(item.changePct)}, önceki ₺${fmtPrice(prev)})` +
    (city ? ` · ${city}` : "")
  );
}

/** Gunluk raporun WhatsApp kanal formati: *kalin*, HTML yok, duz link. */
export async function buildWhatsappDailyText(): Promise<string | null> {
  const trending = await trendingChanges(10);
  if (!trending.length) return null;

  const risers = trending.filter((t) => t.changePct > 0).slice(0, 5);
  const fallers = trending.filter((t) => t.changePct < 0).slice(0, 5);

  const lines: string[] = [
    `📊 *HaldeFiyat — Günlük Fiyat Raporu*`,
    `📅 ${fmtDate(new Date())}`,
    ``,
  ];

  if (risers.length) {
    lines.push(`🔺 *En Çok Artanlar*`);
    risers.forEach((t, i) => lines.push(formatItemWa(i + 1, t)));
    lines.push(``);
  }

  if (fallers.length) {
    lines.push(`🔻 *En Çok Düşenler*`);
    fallers.forEach((t, i) => lines.push(formatItemWa(i + 1, t)));
    lines.push(``);
  } else if (risers.length) {
    lines.push(`🔻 *En Çok Düşenler*`);
    lines.push(`Bugün belirgin bir fiyat düşüşü tespit edilmedi.`);
    lines.push(``);
  }

  lines.push(`🌐 Tüm hal fiyatları: ${SITE_URL}/fiyatlar`);
  return lines.join("\n");
}

async function sendTelegram(chatId: string, text: string, html: boolean): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(html ? { parse_mode: "HTML" } : {}),
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`[whatsapp-bridge] Telegram HTTP ${res.status} — ${body.slice(0, 200)}`);
  }
  return res.ok;
}

async function sendTelegramPhoto(chatId: string, photo: string, caption: string): Promise<boolean> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo, caption }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`[whatsapp-bridge] Telegram foto HTTP ${res.status} — ${body.slice(0, 200)}`);
  }
  return res.ok;
}

/**
 * Gunluk WhatsApp taslagini admin sohbetine dusurur: (1) yonerge basligi,
 * (2) TEMIZ payload mesaji — uzun-bas kopyala, kanala yapistir.
 * parse_mode kapali: *yildizlar* WhatsApp'a oldugu gibi tasinir.
 */
export async function publishWhatsappDraft(): Promise<{ sent: boolean; reason?: string }> {
  const adminChat = env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChat) return { sent: false, reason: "TELEGRAM_ADMIN_CHAT_ID eksik" };

  const text = await buildWhatsappDailyText();
  if (!text) return { sent: false, reason: "trending veri yok" };

  const trending = await trendingChanges(10);
  const now = new Date();
  const dateLabel = fmtDate(now);
  const dateSlug = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(now);
  const imageUrl = await buildDailyReportImageUrl(trending, dateLabel, dateSlug);

  const channelUrl = await getWhatsappChannelUrl();
  const header =
    `📲 <b>WhatsApp kanalı için günlük gönderi hazır</b>\n` +
    `Aşağıdaki mesajı uzun basıp kopyala → kanala yapıştır` +
    (channelUrl ? `\n➡️ <a href="${channelUrl}">Kanalı aç</a>` : "");

  const okHeader = await sendTelegram(adminChat, header, true);
  let okPayload = imageUrl
    ? await sendTelegramPhoto(adminChat, imageUrl, text)
    : await sendTelegram(adminChat, text, false);
  if (imageUrl && !okPayload) okPayload = await sendTelegram(adminChat, text, false);
  return { sent: okHeader && okPayload };
}

/**
 * Haftalik analiz raporunun WhatsApp kanal formati.
 *
 * Gunluk kopru (buildWhatsappDailyText) fiyat hareketlerini veriyor; bu ise
 * yayinlanan HAFTALIK raporu duyuruyor — okuyucuyu makaleye goturur.
 * Ozet cok uzun olabildigi icin ilk cumleye kirpiliyor: WhatsApp'ta uzun
 * mesajin sonu "devamini oku" arkasinda kaliyor ve link gorunmuyor.
 */
export async function buildWhatsappWeeklyText(): Promise<string | null> {
  const [rows] = await pool.query(
    `SELECT slug, title, summary, week_start, week_end, published_at
       FROM hf_analysis_reports
      WHERE status = 'published' AND published_at IS NOT NULL
      ORDER BY published_at DESC
      LIMIT 1`,
  );
  const report = (rows as Array<{
    slug: string; title: string; summary: string | null;
    week_start: Date | string | null; week_end: Date | string | null;
    published_at: Date | string;
  }>)[0];
  if (!report) return null;

  // Yalniz TAZE rapor duyurulur; cron kacirilirsa haftalar sonra eski rapor
  // "yeni" gibi paylasilmasin.
  const publishedAt = new Date(report.published_at);
  const ageDays = (Date.now() - publishedAt.getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays > 8) return null;

  const firstSentence = (report.summary ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s/)[0] ?? "";

  const period = report.week_start && report.week_end
    ? `${fmtDate(new Date(report.week_start))} – ${fmtDate(new Date(report.week_end))}`
    : fmtDate(publishedAt);

  const lines: string[] = [
    `🗞️ *HaldeFiyat — Haftalık Hal Raporu*`,
    `📅 ${period}`,
    ``,
    `*${report.title}*`,
  ];
  if (firstSentence) lines.push(``, firstSentence);
  lines.push(``, `📖 Raporun tamamı: ${SITE_URL}/analiz/${report.slug}`);
  return lines.join("\n");
}

/** Haftalik raporun WhatsApp taslagini admin sohbetine duser. */
export async function publishWhatsappWeeklyDraft(): Promise<{ sent: boolean; reason?: string }> {
  const adminChat = env.TELEGRAM_ADMIN_CHAT_ID;
  if (!adminChat) return { sent: false, reason: "TELEGRAM_ADMIN_CHAT_ID eksik" };

  const text = await buildWhatsappWeeklyText();
  if (!text) return { sent: false, reason: "son 8 gunde yayinlanmis rapor yok" };

  const channelUrl = await getWhatsappChannelUrl();
  const header =
    `📲 <b>WhatsApp kanalı için HAFTALIK gönderi hazır</b>\n` +
    `Aşağıdaki mesajı uzun basıp kopyala → kanala yapıştır` +
    (channelUrl ? `\n➡️ <a href="${channelUrl}">Kanalı aç</a>` : "");

  const okHeader = await sendTelegram(adminChat, header, true);
  const okPayload = await sendTelegram(adminChat, text, false);
  return { sent: okHeader && okPayload };
}
