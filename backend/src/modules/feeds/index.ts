/**
 * Atom 1.0 RSS feed — IFTTT/Zapier gibi RSS-tabanlı köprülerin tüketebileceği biçim.
 *
 * Endpoint: GET /api/v1/feeds/daily-trending.atom
 * Cache: 1 saat (Cache-Control)
 *
 * Her gün için bir <entry> — son 7 günün trending özetleri.
 * IFTTT "New feed item" trigger'ı yeni entry'leri yakalar → Twitter'a tweet atar.
 *
 * Kullanım (IFTTT):
 *   If This: RSS Feed → New feed item
 *     Feed URL: https://haldefiyat.com/api/v1/feeds/daily-trending.atom
 *   Then That: Twitter → Post a tweet
 *     Tweet text: {{EntryTitle}} {{EntryUrl}}
 */

import type { FastifyInstance } from "fastify";
import { db } from "@/db/client";
import { hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

const SITE_URL = "https://haldefiyat.com";

interface DailyHighlight {
  date: string;
  topRiser?: { name: string; pct: number; price: number };
  topFaller?: { name: string; pct: number; price: number };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}%`;
}

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtDate(iso: string): string {
  // 14 Mayıs 2026 formatı
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  });
}

/**
 * Son N günün günlük top riser + top faller özeti.
 * Kayseri-style cross-market median olmadan basit per-day calculation —
 * trending API'sinden daha hafif (RSS sık çağrılır, IFTTT 15dk'da bir poll).
 */
async function fetchLastNDaysHighlights(days = 7): Promise<DailyHighlight[]> {
  const rows = await db
    .select({
      productSlug: hfProducts.slug,
      productName: hfProducts.nameTr,
      recordedDate: hfPriceHistory.recordedDate,
      avgPrice: sql<number>`AVG(${hfPriceHistory.avgPrice})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL ${sql.raw(String(days + 1))} DAY)`),
      eq(hfProducts.isActive, 1),
      sql`${hfMarkets.slug} NOT IN ('ulusal-hal-gov-tr')`,
    ))
    .groupBy(hfProducts.slug, hfProducts.nameTr, hfPriceHistory.recordedDate)
    .orderBy(desc(hfPriceHistory.recordedDate));

  // Her gün için günlük product → AVG map
  const byDate = new Map<string, Map<string, { name: string; avg: number }>>();
  for (const r of rows) {
    const iso = r.recordedDate instanceof Date
      ? r.recordedDate.toISOString().slice(0, 10)
      : String(r.recordedDate).slice(0, 10);
    const avg = Number(r.avgPrice);
    if (!Number.isFinite(avg) || avg <= 0) continue;
    if (!byDate.has(iso)) byDate.set(iso, new Map());
    byDate.get(iso)!.set(r.productSlug, { name: r.productName, avg });
  }

  const sortedDates = [...byDate.keys()].sort().reverse();
  const out: DailyHighlight[] = [];

  for (let i = 0; i < Math.min(days, sortedDates.length - 1); i++) {
    const today = sortedDates[i]!;
    const yesterday = sortedDates[i + 1]!;
    const todayMap = byDate.get(today)!;
    const ystMap = byDate.get(yesterday)!;

    let topRiser: DailyHighlight["topRiser"];
    let topFaller: DailyHighlight["topFaller"];
    let maxRise = 0;
    let maxFall = 0;

    for (const [slug, t] of todayMap) {
      const y = ystMap.get(slug);
      if (!y || y.avg <= 0) continue;
      const pct = ((t.avg - y.avg) / y.avg) * 100;
      // Outlier: %80+ değişim ETL parse hatası kokar
      if (Math.abs(pct) > 80) continue;
      if (pct > maxRise) {
        maxRise = pct;
        topRiser = { name: t.name, pct, price: t.avg };
      }
      if (pct < maxFall) {
        maxFall = pct;
        topFaller = { name: t.name, pct, price: t.avg };
      }
    }

    out.push({ date: today, topRiser, topFaller });
  }

  return out;
}

function buildAtomFeed(highlights: DailyHighlight[]): string {
  const updated = highlights[0]?.date
    ? `${highlights[0].date}T08:00:00Z`
    : new Date().toISOString();

  const entries = highlights.map((h) => {
    const dateLabel = fmtDate(h.date);
    const parts: string[] = [];
    if (h.topRiser) {
      parts.push(`📈 ${h.topRiser.name} ${fmtPct(h.topRiser.pct)} (${fmtPrice(h.topRiser.price)} ₺/kg)`);
    }
    if (h.topFaller) {
      parts.push(`📉 ${h.topFaller.name} ${fmtPct(h.topFaller.pct)} (${fmtPrice(h.topFaller.price)} ₺/kg)`);
    }
    const summary = parts.length > 0
      ? parts.join(" · ")
      : "Bugünkü hal fiyatları için detaylara bakın.";

    // IFTTT için kısa title (max ~100 char) — tweet'in çekirdeği
    const title = `🌱 ${dateLabel} hal fiyatları: ${parts.length > 0 ? parts.join(" · ") : "günlük rapor"}`;

    const url = `${SITE_URL}/?fiyat=${h.date}`;
    const id = `${SITE_URL}/feeds/daily-trending/${h.date}`;
    const ts = `${h.date}T08:00:00Z`;

    return `  <entry>
    <id>${escapeXml(id)}</id>
    <title>${escapeXml(title)}</title>
    <link href="${escapeXml(url)}" />
    <published>${ts}</published>
    <updated>${ts}</updated>
    <summary>${escapeXml(summary)}</summary>
    <author><name>HaldeFiyat</name></author>
  </entry>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>HaldeFiyat — Günlük Hal Fiyatları</title>
  <subtitle>Türkiye toptan hal fiyatları, en çok değişen ürünler</subtitle>
  <link href="${SITE_URL}/" />
  <link rel="self" href="${SITE_URL}/api/v1/feeds/daily-trending.atom" />
  <id>${SITE_URL}/feeds/daily-trending</id>
  <updated>${updated}</updated>
  <author><name>HaldeFiyat</name><uri>${SITE_URL}</uri></author>
${entries}
</feed>`;
}

export async function registerFeeds(api: FastifyInstance) {
  api.get("/feeds/daily-trending.atom", async (_req, reply) => {
    try {
      const highlights = await fetchLastNDaysHighlights(7);
      const xml = buildAtomFeed(highlights);
      reply.type("application/atom+xml; charset=utf-8");
      reply.header("Cache-Control", "public, max-age=3600");
      return reply.send(xml);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      reply.type("application/xml");
      return reply.status(500).send(`<?xml version="1.0"?><error>${escapeXml(msg)}</error>`);
    }
  });
}
