import { env } from "@/core/env";
import { db } from "@/db/client";
import { hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { resolveProductSlug } from "@/modules/etl/normalizer";
import { trendingChanges } from "@/modules/prices/repository";

const SITE_URL = "https://haldefiyat.com";

export interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id?: number;
    from?: { id: number; first_name?: string; username?: string };
    chat: { id: number; type?: string };
    text?: string;
  };
}

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendMessage(chatId: number, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram-bot] TELEGRAM_BOT_TOKEN eksik, mesaj atılamadı");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`[telegram-bot] sendMessage HTTP ${res.status} — ${body.slice(0, 200)}`);
  }
}

function helpText(): string {
  return [
    "👋 <b>HalDeFiyat Bot</b>",
    "Türkiye toptan hal fiyatlarını sorgulayın.",
    "",
    "<b>Komutlar:</b>",
    "• /domates — domates için güncel fiyatlar",
    "• /salatalik — salatalık fiyatları (Türkçe karakter atlanabilir)",
    "• /trending — son haftanın en çok değişen ürünleri",
    "• /yardim — bu mesaj",
    "",
    "Komut yerine sadece ürün adı da yazabilirsiniz: <i>domates sera</i>, <i>biber çarliston</i>",
    "",
    `🌐 ${SITE_URL}`,
  ].join("\n");
}

// Son 3 günde ürün için (slug) min/max/avg fiyat + market dağılımı
async function fetchLatestPrices(slug: string): Promise<{
  productName: string;
  unit: string;
  rows: { marketSlug: string; cityName: string | null; avg: number; recordedDate: string }[];
} | null> {
  const product = await db
    .select({ id: hfProducts.id, name: hfProducts.nameTr, unit: hfProducts.unit })
    .from(hfProducts)
    .where(and(eq(hfProducts.slug, slug), eq(hfProducts.isActive, 1)))
    .limit(1);
  if (!product[0]) return null;

  const rows = await db
    .select({
      marketSlug:   hfMarkets.slug,
      cityName:     hfMarkets.cityName,
      avgPrice:     sql<string>`AVG(${hfPriceHistory.avgPrice})`,
      recordedDate: sql<string>`MAX(${hfPriceHistory.recordedDate})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(
      eq(hfPriceHistory.productId, product[0].id),
      gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 3 DAY)`),
    ))
    .groupBy(hfMarkets.slug, hfMarkets.cityName)
    .orderBy(desc(sql`MAX(${hfPriceHistory.recordedDate})`));

  return {
    productName: product[0].name,
    unit: product[0].unit ?? "kg",
    rows: rows
      .map((r) => ({
        marketSlug:   r.marketSlug,
        cityName:     r.cityName,
        avg:          Number(r.avgPrice),
        recordedDate: String(r.recordedDate).slice(0, 10),
      }))
      .filter((r) => Number.isFinite(r.avg) && r.avg > 0),
  };
}

function formatProductReport(slug: string, data: {
  productName: string;
  unit: string;
  rows: { marketSlug: string; cityName: string | null; avg: number; recordedDate: string }[];
}): string {
  if (data.rows.length === 0) {
    return `📭 <b>${escapeHtml(data.productName)}</b> için son 3 günde veri bulunamadı.\n\n🌐 ${SITE_URL}/urun/${encodeURIComponent(slug)}`;
  }
  const prices = data.rows.map((r) => r.avg);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((s, n) => s + n, 0) / prices.length;

  const lines: string[] = [];
  lines.push(`🥬 <b>${escapeHtml(data.productName)}</b>`);
  lines.push(`🇹🇷 Türkiye ortalama: <b>${fmtPrice(avg)} ₺/${escapeHtml(data.unit)}</b>`);
  lines.push(`📉 En düşük: ${fmtPrice(min)} ₺  ·  📈 En yüksek: ${fmtPrice(max)} ₺`);
  lines.push("");
  lines.push("<b>Hal bazında:</b>");
  for (const r of data.rows.slice(0, 8)) {
    const where = r.cityName ? escapeHtml(r.cityName) : escapeHtml(r.marketSlug);
    lines.push(`• ${where}: <b>${fmtPrice(r.avg)} ₺</b>  <i>(${r.recordedDate})</i>`);
  }
  if (data.rows.length > 8) {
    lines.push(`<i>… ve ${data.rows.length - 8} hal daha</i>`);
  }
  lines.push("");
  lines.push(`🔗 ${SITE_URL}/urun/${encodeURIComponent(slug)}`);
  return lines.join("\n");
}

async function formatTrending(): Promise<string> {
  const items = await trendingChanges(10);
  if (items.length === 0) {
    return "📭 Şu an trending listesi boş — yarın tekrar bakın.";
  }
  const risers = items.filter((it) => it.changePct > 0);
  const fallers = items.filter((it) => it.changePct < 0);

  const lines: string[] = [];
  lines.push("📊 <b>Son 7 Günün Trendleri</b>");
  if (risers.length > 0) {
    lines.push("");
    lines.push("📈 <b>Yükselenler:</b>");
    for (const it of risers) {
      const name = escapeHtml(it.product?.nameTr ?? "?");
      const city = escapeHtml(it.market?.cityName ?? "");
      lines.push(`• ${name} <i>(${city})</i>: ${fmtPct(it.changePct)} → ${fmtPrice(it.latest)} ₺`);
    }
  }
  if (fallers.length > 0) {
    lines.push("");
    lines.push("📉 <b>Düşenler:</b>");
    for (const it of fallers) {
      const name = escapeHtml(it.product?.nameTr ?? "?");
      const city = escapeHtml(it.market?.cityName ?? "");
      lines.push(`• ${name} <i>(${city})</i>: ${fmtPct(it.changePct)} → ${fmtPrice(it.latest)} ₺`);
    }
  }
  lines.push("");
  lines.push(`🌐 ${SITE_URL}/trending`);
  return lines.join("\n");
}

// Mesajdan komut + argüman çıkar
function parseCommand(raw: string): { cmd: string; arg: string } {
  const text = raw.trim();
  // /komut@botadi formatını botadi'sini at
  const stripped = text.replace(/^(\/[a-zA-Z0-9_]+)@\w+/, "$1");
  // /komut arg... veya düz metin
  if (stripped.startsWith("/")) {
    const idx = stripped.indexOf(" ");
    if (idx < 0) return { cmd: stripped.slice(1).toLowerCase(), arg: "" };
    return { cmd: stripped.slice(1, idx).toLowerCase(), arg: stripped.slice(idx + 1).trim() };
  }
  return { cmd: "", arg: stripped };
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const msg = update.message;
  if (!msg || !msg.chat || !msg.text) return;
  const chatId = msg.chat.id;
  const { cmd, arg } = parseCommand(msg.text);

  // 1) Yardım / başlangıç komutları
  if (cmd === "start" || cmd === "help" || cmd === "yardim") {
    await sendMessage(chatId, helpText());
    return;
  }

  // 2) Trending
  if (cmd === "trending") {
    const text = await formatTrending();
    await sendMessage(chatId, text);
    return;
  }

  // 3) /<urun-adi> veya serbest metin → alias map'ten slug bul
  // Telegram komutları sadece a-z 0-9 _ destekler; tire içeren ürünler için arg ile dene
  const candidates: string[] = [];
  if (cmd) {
    candidates.push(cmd.replace(/_/g, " "));
    if (arg) candidates.push(`${cmd} ${arg}`.replace(/_/g, " "));
  }
  if (arg) candidates.push(arg);
  if (!cmd && msg.text) candidates.push(msg.text);

  let foundSlug: string | null = null;
  for (const c of candidates) {
    if (!c) continue;
    const slug = await resolveProductSlug(c);
    if (slug) {
      foundSlug = slug;
      break;
    }
  }

  if (!foundSlug) {
    await sendMessage(
      chatId,
      `❓ Ürün bulunamadı.\nÖrnekler: /domates, /salatalik, /trending\nYardım için /yardim`,
    );
    return;
  }

  const data = await fetchLatestPrices(foundSlug);
  if (!data) {
    await sendMessage(chatId, "❌ Veri alınamadı. Lütfen tekrar deneyin.");
    return;
  }
  await sendMessage(chatId, formatProductReport(foundSlug, data));
}
