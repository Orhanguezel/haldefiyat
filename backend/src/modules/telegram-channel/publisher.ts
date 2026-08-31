import { env } from "@/core/env";
import { trendingChanges } from "@/modules/prices/repository";
import { buildDailyReportImageUrl } from "./report-image";

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
  // trendingChanges(10) → 5 artan + 5 düşen döner
  const trending = await trendingChanges(10);
  if (!trending.length) {
    console.warn("[channel-publisher] Trending veri yok, paylaşım atlandı");
    return;
  }

  const risers = trending.filter((t) => t.changePct > 0).slice(0, 5);
  const fallers = trending.filter((t) => t.changePct < 0).slice(0, 5);

  const today = fmtDate(new Date());

  const lines: string[] = [
    `📊 <b>HaldeFiyat — Günlük Fiyat Raporu</b>`,
    `📅 ${today}`,
    `─────────────────────────`,
  ];

  if (risers.length) {
    lines.push(`\n🔺 <b>En Çok Artan Fiyatlar</b>`);
    risers.forEach((t, i) => lines.push(formatItem(i + 1, t)));
  }

  if (fallers.length) {
    lines.push(`\n🔻 <b>En Çok Düşen Fiyatlar</b>`);
    fallers.forEach((t, i) => lines.push(formatItem(i + 1, t)));
  }

  if (!fallers.length && risers.length) {
    lines.push(`\n🔻 <b>En Çok Düşen Fiyatlar</b>`);
    lines.push(`<i>Bugün belirgin bir fiyat düşüşü tespit edilmedi.</i>`);
  }

  lines.push(`\n─────────────────────────`);
  lines.push(`🌐 <a href="${SITE_URL}/fiyatlar">Tüm hal fiyatları → haldefiyat.com</a>`);

  const dateSlug = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  const imageUrl = await buildDailyReportImageUrl(trending, today, dateSlug);
  await postToChannel(lines.join("\n"), imageUrl);
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
