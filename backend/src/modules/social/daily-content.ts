// ===================================================================
// FILE: src/modules/social/daily-content.ts
// Günlük otomatik X içeriği — hal'in fiyat/movers verisinden üretilir.
// (ekosistem-sosyal-medya'dan taşındı; veri kaynağı artık hal'in kendisi.)
// ===================================================================

import { randomUUID } from "crypto";
import { queueTweet, repoInsertTweet } from "@agro/shared-backend/modules/twitter";
import { trendingChanges } from "@/modules/prices/repository";
import { isPlanSlotActive } from "./repository";
import { buildMoversChartUrl, type ChartRow } from "./chart";

const SITE = "https://haldefiyat.com";
const HASHTAGS = "#haldefiyat #halfiyatları #sebze #meyve #tarım";
const MAX_LEN = 280;

function istanbulDateLabel(d = new Date()): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", timeZone: "Europe/Istanbul" }).format(d);
}

function istanbulIso(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(d);
}

// Bir sonraki 09:00 Istanbul (= 06:00 UTC, TR sabit UTC+3). Günlük tweet bu saate planlanır.
function nextMorningUtc(): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0));
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

  const build = (rCount: number, fCount: number): string => {
    const body: string[] = [];
    risers.slice(0, rCount).forEach((t, i) => body.push(line("🔺", t, i === 0)));
    fallers.slice(0, fCount).forEach((t) => body.push(line("🔻", t, false)));
    return [header, ...body, footer, HASHTAGS].join("\n");
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
  const scheduledAt = nextMorningUtc();
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
