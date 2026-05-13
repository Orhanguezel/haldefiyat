import { env } from "@/core/env";
import { trendingChanges } from "@/modules/prices/repository";
import { getProductEmoji } from "./emoji-map";

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

function formatItem(
  i: number,
  item: {
    latest: number;
    changePct: number;
    product?: { nameTr?: string; categorySlug?: string } | null;
    market?: { cityName?: string } | null;
  },
): string {
  const emoji = getProductEmoji(item.product?.nameTr ?? "", item.product?.categorySlug ?? "");
  const name = item.product?.nameTr ?? "—";
  const city = item.market?.cityName ?? "";
  const prev = item.latest / (1 + item.changePct / 100);
  return (
    `${i}. ${emoji} <b>${name}</b>\n` +
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

  await postToChannel(lines.join("\n"));
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
      const emoji = getProductEmoji(r.name, r.categorySlug);
      lines.push(
        `${i + 1}. ${emoji} <b>${r.name}</b>\n` +
        `   ₺${fmtPrice(r.latestAvg)} · <code>${fmtPct(r.changePct)}</code>` +
        (r.city ? `\n   📍 ${r.city}` : ""),
      );
    }
  }

  if (fallers.length) {
    lines.push(`\n🔻 <b>Haftanın En Çok Düşenleri</b>`);
    for (const [i, f] of fallers.entries()) {
      const emoji = getProductEmoji(f.name, f.categorySlug);
      lines.push(
        `${i + 1}. ${emoji} <b>${f.name}</b>\n` +
        `   ₺${fmtPrice(f.latestAvg)} · <code>${fmtPct(f.changePct)}</code>` +
        (f.city ? `\n   📍 ${f.city}` : ""),
      );
    }
  }

  lines.push(`\n─────────────────────────`);
  lines.push(`🌐 <a href="${SITE_URL}/fiyatlar">Detaylı analiz → haldefiyat.com</a>`);

  await postToChannel(lines.join("\n"));
}
