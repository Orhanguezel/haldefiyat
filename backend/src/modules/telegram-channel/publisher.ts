import { env } from "@/core/env";
import { pool } from "@/db/client";
import { trendingChanges } from "@/modules/prices/repository";
import { buildCard } from "@/modules/social/cards";

const SITE_URL = "https://haldefiyat.com";

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** TR yazimi: isaret + %% + ondalik virgul — "+%77,4". */
function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "-" : "";
  const abs = Math.abs(n).toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${sign}%${abs}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

async function postToChannel(text: string, photoUrl?: string | null): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const channelId = env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) {
    console.warn("[channel-publisher] TELEGRAM_BOT_TOKEN veya TELEGRAM_CHANNEL_ID eksik, atlandı");
    return;
  }

  const useCaption = Boolean(photoUrl) && text.length <= 1024;
  const method = useCaption ? "sendPhoto" : "sendMessage";
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      ...(useCaption ? { photo: photoUrl, caption: text } : { text }),
      parse_mode: "HTML",
      ...(!useCaption ? { disable_web_page_preview: true } : {}),
    }),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    console.warn(`[channel-publisher] Telegram API hatası HTTP ${res.status} — ${body.slice(0, 200)}`);
    if (useCaption) await postToChannel(text, null);
  } else {
    console.log("[channel-publisher] Kanal paylaşımı başarılı");
  }
}

function formatItem(
  i: number,
  item: {
    latest: number;
    changePct: number;
    product?: { nameTr?: string; displayName?: string | null; categorySlug?: string } | null;
    market?: { cityName?: string } | null;
  },
): string {
  // Gorunen ad: ham ETL adi CILEK gibi BUYUK HARF olabiliyor — display_name tercih edilir.
  const name = item.product?.displayName || item.product?.nameTr || "—";
  const city = item.market?.cityName ?? "";
  const prev = item.latest / (1 + item.changePct / 100);
  return (
    `${i}. <b>${name}</b>\n` +
    `   ₺${fmtPrice(item.latest)} <i>(önceki: ₺${fmtPrice(prev)})</i>` +
    ` · <code>${fmtPct(item.changePct)}</code>` +
    (city ? `\n   📍 ${city}` : "")
  );
}

export async function publishDailyReport(): Promise<void> {
  // Secim ve gorsel artik ortak kart modulunde (modules/social/cards): temel gida
  // bandi, en az 2 hal, sezon kapisi. Eski `trendingChanges` secimi Eylul'de kiraz,
  // rambutan gibi UC kayitlari one cikariyordu.
  const card = await buildCard("k1", "tg");
  if (!card) {
    console.warn("[channel-publisher] Kart uretilemedi, paylasim atlandi");
    return;
  }
  const today = fmtDate(new Date());
  const lines = [
    `📊 <b>HaldeFiyat — Günlük Fiyat Raporu</b>`,
    `📅 ${today}`,
    `─────────────────────────`,
    "",
    card.caption,
    "",
    `─────────────────────────`,
    `🌐 <a href="${SITE_URL}/fiyatlar">Tüm hal fiyatları → haldefiyat.com</a>`,
  ];
  await postToChannel(lines.join("\n"), card.imageUrl);
}

export async function publishWeeklySummary(
  risers: { name: string; city: string; categorySlug: string; changePct: number; latestAvg: number }[],
  fallers: { name: string; city: string; categorySlug: string; changePct: number; latestAvg: number }[],
  week: string,
): Promise<void> {
  const lines: string[] = [
    `📈 <b>HaldeFiyat — Haftalık Özet</b>`,
    `🗓 ${week} haftası`,
    `─────────────────────────`,
  ];

  if (risers.length) {
    lines.push(`\n🔺 <b>Haftanın En Çok Artanları</b>`);
    for (const [i, r] of risers.entries()) {
      lines.push(
        `${i + 1}. <b>${r.name}</b>\n` +
        `   ₺${fmtPrice(r.latestAvg)} · <code>${fmtPct(r.changePct)}</code>` +
        (r.city ? `\n   📍 ${r.city}` : ""),
      );
    }
  }

  if (fallers.length) {
    lines.push(`\n🔻 <b>Haftanın En Çok Düşenleri</b>`);
    for (const [i, f] of fallers.entries()) {
      lines.push(
        `${i + 1}. <b>${f.name}</b>\n` +
        `   ₺${fmtPrice(f.latestAvg)} · <code>${fmtPct(f.changePct)}</code>` +
        (f.city ? `\n   📍 ${f.city}` : ""),
      );
    }
  }

  lines.push(`\n─────────────────────────`);
  lines.push(`🌐 <a href="${SITE_URL}/fiyatlar">Detaylı analiz → haldefiyat.com</a>`);

  await postToChannel(lines.join("\n"));
}

/** Kanala duyurulacak yayinlanmis rapor; taze degilse (8 gunden eski) duyurulmaz. */
type AnnounceableReport = {
  slug: string; title: string; summary: string | null;
  week_start: Date | string | null; week_end: Date | string | null;
  iso_week: string | null;
  published_at: Date | string;
};

const FRESH_REPORT_DAYS = 8;

async function latestFreshReport(reportId?: number): Promise<AnnounceableReport | null> {
  const [rows] = reportId
    ? await pool.query(
        `SELECT slug, title, summary, week_start, week_end, iso_week, published_at
           FROM hf_analysis_reports
          WHERE id = ? AND status = 'published' AND published_at IS NOT NULL
          LIMIT 1`,
        [reportId],
      )
    : await pool.query(
        `SELECT slug, title, summary, week_start, week_end, iso_week, published_at
           FROM hf_analysis_reports
          WHERE status = 'published' AND published_at IS NOT NULL
          ORDER BY published_at DESC
          LIMIT 1`,
      );
  const report = (rows as AnnounceableReport[])[0];
  if (!report) return null;

  // Taze olmayan rapor "yeni" gibi duyurulmasin — cron kacirildiginda haftalar
  // once yayinlanmis rapor kanala dusmesin diye WhatsApp koprusuyle ayni kural.
  const ageDays = (Date.now() - new Date(report.published_at).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays > FRESH_REPORT_DAYS) return null;
  return report;
}

/**
 * Yayinlanan haftalik analiz raporunu Telegram KANALINA duyurur.
 *
 * Gunluk rapor (publishDailyReport) fiyat hareketlerini veriyor; bu ise makaleye
 * goturur. Bilincli olarak otomatik DEGIL: yayin akisina baglanmadi, admin ucundan
 * acikca tetiklenir — kanala giden her gonderi disariya aciliyor ve rapor metni
 * yayindan sonra da duzeltilebiliyor.
 */
export async function announceWeeklyReportToChannel(
  reportId?: number,
): Promise<{ sent: boolean; reason?: string; slug?: string }> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHANNEL_ID) {
    return { sent: false, reason: "TELEGRAM_BOT_TOKEN veya TELEGRAM_CHANNEL_ID eksik" };
  }
  const report = await latestFreshReport(reportId);
  if (!report) return { sent: false, reason: `son ${FRESH_REPORT_DAYS} gunde yayinlanmis rapor yok` };

  const period = report.week_start && report.week_end
    ? `${fmtDate(new Date(report.week_start))} – ${fmtDate(new Date(report.week_end))}`
    : fmtDate(new Date(report.published_at));

  // Ozet cok uzun olabiliyor; caption 1024 karakteri asarsa gorsel dusuyor.
  const firstSentence = (report.summary ?? "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0] ?? "";

  // Aylik degerlendirme ayni tabloda durur; basligi haftalik rapor gibi atmasin.
  const monthly = /^\d{4}-M\d{2}$/.test(report.iso_week ?? "");
  const lines = [
    `🗞️ <b>HaldeFiyat — ${monthly ? "Aylık Hal Değerlendirmesi" : "Haftalık Hal Raporu"}</b>`,
    `🗓 ${period}`,
    `─────────────────────────`,
    ``,
    `<b>${escapeHtml(report.title)}</b>`,
  ];
  if (firstSentence) lines.push(``, escapeHtml(firstSentence));
  lines.push(``, `📖 <a href="${SITE_URL}/analiz/${report.slug}">Raporun tamamı → haldefiyat.com</a>`);

  await postToChannel(lines.join("\n"), `${SITE_URL}/og/analiz/${report.slug}`);
  return { sent: true, slug: report.slug };
}

/** Telegram parse_mode=HTML yalniz bir avuc etikete izin verir; govde metni kacirilir. */
function escapeHtml(value: string): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
