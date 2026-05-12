import { db } from "@/db/client";
import { hfCompetitorSites, hfCompetitorSnapshots } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { fetchViaScraper, isScraperEnabled } from "@/modules/etl/scraper-client";
import { parseCompetitorHtml, buildDiffSummary } from "./parser";
import { env } from "@/core/env";

const SIGNIFICANT_PRODUCT_DELTA = 10;

export interface CompetitorCheckResult {
  siteKey: string;
  ok: boolean;
  productCount: number | null;
  marketCount: number | null;
  diffSummary: string | null;
  durationMs: number;
  error?: string;
}

async function fetchHtml(url: string): Promise<{ html: string | null; error?: string }> {
  if (isScraperEnabled()) {
    const result = await fetchViaScraper(url, { mode: "stealthy", timeoutSeconds: 45 });
    if (result.ok && result.html) return { html: result.html };
  }

  // Scraper devre dışı veya başarısız → direct fetch
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HalDeFiyat-Monitor/1.0)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { html: null, error: `HTTP ${res.status}` };
    return { html: await res.text() };
  } catch (err) {
    return { html: null, error: err instanceof Error ? err.message : String(err) };
  }
}

async function getLastSnapshot(siteKey: string) {
  const rows = await db
    .select({
      productCount: hfCompetitorSnapshots.productCount,
      marketCount: hfCompetitorSnapshots.marketCount,
      detectedFeatures: hfCompetitorSnapshots.detectedFeatures,
    })
    .from(hfCompetitorSnapshots)
    .where(eq(hfCompetitorSnapshots.siteKey, siteKey))
    .orderBy(desc(hfCompetitorSnapshots.checkedAt))
    .limit(1);

  return rows[0] ?? null;
}

async function sendTelegramAlert(text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || chatIds.length === 0) return;

  for (const chatId of chatIds) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    }).catch(() => {});
  }
}

async function checkOneSite(site: { siteKey: string; name: string; url: string }): Promise<CompetitorCheckResult> {
  const t0 = Date.now();

  const { html, error: fetchError } = await fetchHtml(site.url);
  if (!html) {
    await db.insert(hfCompetitorSnapshots).values({
      siteKey: site.siteKey,
      scrapeOk: 0,
      errorMsg: (fetchError ?? "empty_response").slice(0, 511),
    });
    await db.update(hfCompetitorSites)
      .set({ lastCheckedAt: sql`NOW(3)` })
      .where(eq(hfCompetitorSites.siteKey, site.siteKey));
    return { siteKey: site.siteKey, ok: false, productCount: null, marketCount: null, diffSummary: null, durationMs: Date.now() - t0, error: fetchError };
  }

  const metrics = parseCompetitorHtml(site.siteKey, html);
  const prev = await getLastSnapshot(site.siteKey);
  const diffSummary = buildDiffSummary(prev, metrics);

  await db.insert(hfCompetitorSnapshots).values({
    siteKey: site.siteKey,
    productCount: metrics.productCount,
    marketCount: metrics.marketCount,
    detectedFeatures: metrics.detectedFeatures,
    rawMetrics: metrics.rawMetrics,
    diffSummary,
    scrapeOk: 1,
  });

  await db.update(hfCompetitorSites)
    .set({ lastCheckedAt: sql`NOW(3)` })
    .where(eq(hfCompetitorSites.siteKey, site.siteKey));

  // Anlamlı değişiklik varsa Telegram bildirimi gönder
  const hasSignificantChange =
    prev !== null &&
    diffSummary !== null &&
    diffSummary !== "Değişiklik yok." &&
    (
      (prev.productCount !== null && metrics.productCount !== null &&
        Math.abs(metrics.productCount - prev.productCount) >= SIGNIFICANT_PRODUCT_DELTA) ||
      diffSummary.includes("Yeni özellik")
    );

  if (hasSignificantChange) {
    const msg =
      `🔍 <b>Rakip Değişikliği: ${site.name}</b>\n` +
      `🔗 ${site.url}\n\n` +
      `<pre>${diffSummary}</pre>`;
    await sendTelegramAlert(msg);
  }

  return {
    siteKey: site.siteKey,
    ok: true,
    productCount: metrics.productCount,
    marketCount: metrics.marketCount,
    diffSummary,
    durationMs: Date.now() - t0,
  };
}

export async function runCompetitorCheck(targetKey?: string): Promise<CompetitorCheckResult[]> {
  const query = db
    .select({
      siteKey: hfCompetitorSites.siteKey,
      name: hfCompetitorSites.name,
      url: hfCompetitorSites.url,
    })
    .from(hfCompetitorSites)
    .where(eq(hfCompetitorSites.isActive, 1));

  const sites = await query;
  const targets = targetKey ? sites.filter((s) => s.siteKey === targetKey) : sites;

  const results: CompetitorCheckResult[] = [];
  for (const site of targets) {
    const result = await checkOneSite(site);
    results.push(result);
  }
  return results;
}
