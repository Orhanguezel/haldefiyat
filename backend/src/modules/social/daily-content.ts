// ===================================================================
// FILE: src/modules/social/daily-content.ts
// Günlük otomatik X içeriği — hal'in fiyat/movers verisinden üretilir.
// (ekosistem-sosyal-medya'dan taşındı; veri kaynağı artık hal'in kendisi.)
// ===================================================================

import { randomUUID } from "crypto";
import { queueTweet, repoInsertTweet } from "@agro/shared-backend/modules/twitter";
import { trendingChanges, widgetPrices } from "@/modules/prices/repository";
import { getProductEmoji } from "@/modules/telegram-channel/emoji-map";
import { isPlanSlotActive } from "./repository";
import { buildMoversChartUrl, buildStaplesChartUrl, type ChartRow, type StapleRow } from "./chart";

// Popüler / mevsim ürünleri — günün fiyat tablosu için.
const POPULAR_SLUGS = [
  "domates", "biber", "patlican", "salatalik", "patates", "sogan", "kabak", "havuc",
  "karpuz", "kavun", "kiraz", "seftali", "kayisi", "uzum", "cilek", "limon", "elma", "muz",
];

const SITE = "https://haldefiyat.com";
const HASHTAGS = "#haldefiyat #halfiyatları #sebze #meyve #tarım";
const MAX_LEN = 280;

function istanbulDateLabel(d = new Date()): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", timeZone: "Europe/Istanbul" }).format(d);
}

function istanbulIso(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
}

// Bir sonraki <hourUtc>:00 UTC. TR sabit UTC+3 → 06:00 UTC=09:00 TR, 10:00 UTC=13:00 TR.
function nextUtcHour(hourUtc: number): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc, 0, 0));
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { maximumFractionDigits: n >= 100 ? 0 : 1 });
}

type Trend = Awaited<ReturnType<typeof trendingChanges>>[number];

function line(arrow: string, t: Trend, withPrice: boolean): string {
  const name = t.product?.nameTr ?? "—";
  const pct = `%${Math.abs(t.changePct).toFixed(0)}`;
  return withPrice ? `${arrow} ${name} ${pct} (₺${fmtPrice(t.latest)})` : `${arrow} ${name} ${pct}`;
}

/** Günün hareketi caption'ı — 280 karaktere sığacak şekilde kısaltır. */
export async function buildDailyMoversText(): Promise<string | null> {
  return buildTextFromTrend(await trendingChanges(10), istanbulDateLabel());
}

function buildTextFromTrend(trending: Awaited<ReturnType<typeof trendingChanges>>, dateLabel: string): string | null {
  const risers = trending.filter((t) => t.changePct > 0).slice(0, 3);
  const fallers = trending.filter((t) => t.changePct < 0).slice(0, 2);
  if (!risers.length && !fallers.length) return null;

  const footer = `Güncel fiyatlar 👇 ${SITE}`;
  const header = `📊 Günün hal hareketleri (${dateLabel})`;
  // Reply-bait: düz veri yerine yorum doğuran spesifik soru (engagement stratejisi).
  const question = "💬 Sizin pazarınızda en çok ne değişti?";

  const build = (rCount: number, fCount: number): string => {
    const body: string[] = [];
    risers.slice(0, rCount).forEach((t, i) => body.push(line("🔺", t, i === 0)));
    fallers.slice(0, fCount).forEach((t) => body.push(line("🔻", t, false)));
    return [header, ...body, "", question, footer, HASHTAGS].join("\n");
  };

  // Sığana kadar madde sayısını azalt.
  for (const [r, f] of [[3, 2], [2, 2], [2, 1], [1, 1], [1, 0]] as const) {
    const text = build(r, f);
    if (text.length <= MAX_LEN) return text;
  }
  return build(1, 0).slice(0, MAX_LEN);
}

function chartRowsFrom(trending: Awaited<ReturnType<typeof trendingChanges>>): ChartRow[] {
  return [...trending]
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 5)
    .map((t) => ({ name: t.product?.nameTr ?? "—", changePct: t.changePct, latest: t.latest }));
}

/** Bugünün movers grafiğini üretip URL döner (tweet atmaz — önizleme/manuel). */
export async function buildTodayChartUrl(): Promise<string | null> {
  const trending = await trendingChanges(10);
  return buildMoversChartUrl(chartRowsFrom(trending), istanbulDateLabel(), istanbulIso());
}

/**
 * Günlük "Günün hareketi" tweet'ini bir sonraki 09:00 TR'ye PLANLAR (kuyruğa ileri tarihli ekler).
 * Taslak & Kuyruk'ta görünür; dispatcher vakti gelince yayınlar. sourceRef ile tekilleştirilir.
 */
export async function runDailyMoversJob(): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isPlanSlotActive("twitter", "morning"))) return { ok: false, reason: "slot_inactive" };
  const trending = await trendingChanges(10);
  const scheduledAt = nextUtcHour(6); // 09:00 TR
  const dateLabel = istanbulDateLabel(scheduledAt);
  const dateIso = istanbulIso(scheduledAt);

  const text = buildTextFromTrend(trending, dateLabel);
  if (!text) return { ok: false, reason: "no_data" };

  const mediaUrl = await buildMoversChartUrl(chartRowsFrom(trending), dateLabel, dateIso);

  const res = await queueTweet({
    text,
    platform: "twitter",
    source: "auto",
    sourceRef: `daily_movers:${dateIso}`,
    scheduledAt,
    mediaUrl,
  });
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}

// ── Popüler ürün fiyatları (2. günlük içerik tipi) ─────────────────────────────

function buildStaplesText(
  items: { productName: string; categorySlug: string; avgPrice: number; changePct: number | null }[],
  dateLabel: string,
): string | null {
  if (!items.length) return null;
  const footer = `Tüm fiyatlar 👇 ${SITE}`;
  const header = `🧺 Popüler ürün fiyatları (${dateLabel})`;
  // Reply-bait: tüketici/esnaf yorumu doğuran soru (engagement stratejisi).
  const question = "💬 Sizin pazarınızda kaça?";
  const line = (it: (typeof items)[number]) => {
    const emoji = getProductEmoji(it.productName, it.categorySlug);
    const arrow = it.changePct == null ? "" : it.changePct >= 0 ? " 🔺" : " 🔻";
    return `${emoji} ${it.productName}: ₺${fmtPrice(it.avgPrice)}${arrow}`;
  };
  for (const n of [7, 6, 5, 4]) {
    const text = [header, ...items.slice(0, n).map(line), "", question, footer, HASHTAGS].join("\n");
    if (text.length <= MAX_LEN) return text;
  }
  return [header, ...items.slice(0, 4).map(line), question, footer].join("\n").slice(0, MAX_LEN);
}

// Sebze/meyve hal fiyatı için akıl-sağlığı tavanı — üstü neredeyse kesin garbage veri
// (ör. limon ₺615, muz ₺449). Public tweet'e hatalı fiyat gitmesin.
const MAX_STAPLE_PRICE = 300;

/** Popüler ürün fiyatlarını bir sonraki 13:00 TR'ye planlar (tablo grafiği ile). */
export async function runStaplesJob(): Promise<{ ok: boolean; reason?: string }> {
  if (!(await isPlanSlotActive("twitter", "popular"))) return { ok: false, reason: "slot_inactive" };
  const raw = await widgetPrices(POPULAR_SLUGS, undefined, POPULAR_SLUGS.length);
  // POPULAR_SLUGS sırasına göre (domates/biber önce) + akıl-sağlığı fiyat filtresi.
  const order = new Map(POPULAR_SLUGS.map((s, i) => [s, i]));
  const items = raw
    .filter((i) => i.avgPrice > 0 && i.avgPrice <= MAX_STAPLE_PRICE)
    .sort((a, b) => (order.get(a.productSlug) ?? 99) - (order.get(b.productSlug) ?? 99));
  if (!items.length) return { ok: false, reason: "no_data" };

  const scheduledAt = nextUtcHour(10); // 13:00 TR
  const dateLabel = istanbulDateLabel(scheduledAt);
  const dateIso = istanbulIso(scheduledAt);

  const text = buildStaplesText(items, dateLabel);
  if (!text) return { ok: false, reason: "no_data" };

  const chartRows: StapleRow[] = items.slice(0, 10).map((i) => ({ name: i.productName, price: i.avgPrice, changePct: i.changePct }));
  const mediaUrl = await buildStaplesChartUrl(chartRows, dateLabel, dateIso);

  const res = await queueTweet({
    text,
    platform: "twitter",
    source: "auto",
    sourceRef: `staples:${dateIso}`,
    scheduledAt,
    mediaUrl,
  });
  return res.ok ? { ok: true } : { ok: false, reason: res.reason };
}

/** Yayınlanmamış TASLAK tweet oluşturur (dispatcher 'draft' statüsünü almaz). */
export async function createDraftTweet(text: string, source = "manual", mediaUrl?: string | null): Promise<string> {
  const id = randomUUID();
  await repoInsertTweet({
    id,
    platform: "twitter",
    content: text.slice(0, MAX_LEN),
    status: "draft",
    source,
    media_url: mediaUrl ?? null,
    post_format: "post",
    retry_count: 0,
    created_at: new Date(),
  });
  return id;
}

/** Haftalık analiz yayınlanınca özet tweet'i TASLAK olarak hazırlar (slot pasifse atlar). */
export async function createWeeklyAnalysisDraft(title: string, slug: string): Promise<string | null> {
  if (!(await isPlanSlotActive("twitter", "weekly"))) return null;
  const url = `${SITE}/analiz/${slug}`;
  const head = "📈 Haftalık hal fiyat analizi yayında:";
  let text = `${head}\n${title}\n${url}\n${HASHTAGS}`;
  if (text.length > MAX_LEN) text = `${head}\n${title}\n${url}`;
  return createDraftTweet(text, "auto-weekly");
}
