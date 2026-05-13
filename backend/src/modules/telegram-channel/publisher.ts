import { env } from "@/core/env";
import { trendingChanges } from "@/modules/prices/repository";
import { getEmojiByCategorySlug } from "./emoji-map";

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
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

async function postToChannel(text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const channelId = env.TELEGRAM_CHANNEL_ID;
  if (!token || !channelId) {
    console.warn("[channel-publisher] TELEGRAM_BOT_TOKEN veya TELEGRAM_CHANNEL_ID eksik, atlandı");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: channelId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const body = await res.text().catch(() => "");
  if (!res.ok) {
    console.warn(`[channel-publisher] Telegram API hatası HTTP ${res.status} — ${body.slice(0, 200)}`);
  } else {
    console.log("[channel-publisher] Kanal paylaşımı başarılı");
  }
}

export async function publishDailyReport(): Promise<void> {
  const trending = await trendingChanges(20);
  if (!trending.length) {
    console.warn("[channel-publisher] Trending veri yok, paylaşım atlandı");
    return;
  }

  const risers = trending.filter((t) => t.changePct > 0).slice(0, 5);
  const fallers = trending.filter((t) => t.changePct < 0).slice(0, 5);

  const today = fmtDate(new Date());

  const lines: string[] = [
    `📊 <b>HaldeFiyat Günlük Rapor</b>`,
    `📅 ${today}`,
    ``,
  ];

  if (risers.length) {
    lines.push(`🔺 <b>En Çok Artan Fiyatlar</b>`);
    for (const [i, t] of risers.entries()) {
      const emoji = getEmojiByCategorySlug(t.product?.categorySlug ?? "");
      const name = t.product?.nameTr ?? "—";
      const city = t.market?.cityName ?? "";
      lines.push(
        `${i + 1}. ${emoji} <b>${name}</b> — ₺${fmtPrice(t.latest)} <code>(${fmtPct(t.changePct)})</code>${city ? ` · ${city}` : ""}`,
      );
    }
    lines.push(``);
  }

  if (fallers.length) {
    lines.push(`🔻 <b>En Çok Düşen Fiyatlar</b>`);
    for (const [i, t] of fallers.entries()) {
      const emoji = getEmojiByCategorySlug(t.product?.categorySlug ?? "");
      const name = t.product?.nameTr ?? "—";
      const city = t.market?.cityName ?? "";
      lines.push(
        `${i + 1}. ${emoji} <b>${name}</b> — ₺${fmtPrice(t.latest)} <code>(${fmtPct(t.changePct)})</code>${city ? ` · ${city}` : ""}`,
      );
    }
    lines.push(``);
  }

  lines.push(`🌐 <a href="${SITE_URL}/fiyatlar">Tüm hal fiyatları → haldefiyat.com</a>`);

  await postToChannel(lines.join("\n"));
}

export async function publishWeeklySummary(
  risers: { name: string; city: string; categorySlug: string; changePct: number; latestAvg: number }[],
  fallers: { name: string; city: string; categorySlug: string; changePct: number; latestAvg: number }[],
  week: string,
): Promise<void> {
  const lines: string[] = [
    `📈 <b>HaldeFiyat Haftalık Özet</b>`,
    `🗓 ${week} haftası`,
    ``,
  ];

  if (risers.length) {
    lines.push(`🔺 <b>Haftanın En Çok Artanları</b>`);
    for (const [i, r] of risers.entries()) {
      const emoji = getEmojiByCategorySlug(r.categorySlug);
      lines.push(`${i + 1}. ${emoji} <b>${r.name}</b> — ₺${fmtPrice(r.latestAvg)} <code>(${fmtPct(r.changePct)})</code>${r.city ? ` · ${r.city}` : ""}`);
    }
    lines.push(``);
  }

  if (fallers.length) {
    lines.push(`🔻 <b>Haftanın En Çok Düşenleri</b>`);
    for (const [i, f] of fallers.entries()) {
      const emoji = getEmojiByCategorySlug(f.categorySlug);
      lines.push(`${i + 1}. ${emoji} <b>${f.name}</b> — ₺${fmtPrice(f.latestAvg)} <code>(${fmtPct(f.changePct)})</code>${f.city ? ` · ${f.city}` : ""}`);
    }
    lines.push(``);
  }

  lines.push(`🌐 <a href="${SITE_URL}/fiyatlar">Detaylı analiz → haldefiyat.com</a>`);

  await postToChannel(lines.join("\n"));
}
