import { getGscAuthHeaders, getGscDateRange, queryGsc, resolveGscSite } from "@agro/shared-backend/modules/searchConsole/service";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfCompetitorSerpResults, hfCompetitorSerpRuns, hfProducts } from "@/db/schema";
import { publicOrigin } from "@/modules/seo/gsc-index";
import { domainOf, fetchBingPage } from "./serp-bing";

export interface DiscoveryQuery { query: string; clicks: number; impressions: number }
export interface DiscoveryOptions { queries?: string[]; limit?: number; pages?: 1 | 2 }

// Rakip degil, her aramada cikan platformlar: sonuc listesine yazilmaz.
const SKIP_DOMAINS = /(^|\.)(google\.[a-z.]+|bing\.com|youtube\.com|facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|wikipedia\.org|apple\.com|pinterest\.[a-z]+|eksisozluk\.com)$/i;
const DELAY_MS = 1500;
let running = false;

export function isDiscoveryRunning(): boolean {
  return running;
}

export function ourHost(): string {
  return domainOf(publicOrigin());
}

/** Marka aramalari rakip gostermez ("haldefiyat" gecen sorgular dislanir). */
function isBrandQuery(q: string): boolean {
  const brand = ourHost().split(".")[0];
  return brand.length > 3 && q.toLowerCase().replace(/\s+/g, "").includes(brand);
}

export async function queriesFromGsc(limit: number): Promise<DiscoveryQuery[]> {
  const headers = await getGscAuthHeaders();
  // gsc_site_url ayari tirnakli saklanabiliyor.
  const site = (await resolveGscSite()).replace(/^"+|"+$/g, "");
  const { startDate, endDate } = getGscDateRange("LAST_28_DAYS");
  const rows = await queryGsc(site, headers, { startDate, endDate, dimensions: ["query"], rowLimit: Math.min(limit * 3, 500), type: "web" });
  return rows
    .map((r) => ({ query: String((r.keys as string[] | undefined)?.[0] ?? "").trim(), clicks: Number(r.clicks ?? 0), impressions: Number(r.impressions ?? 0) }))
    .filter((r) => r.query && !isBrandQuery(r.query))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

/** GSC yoksa: en cok aranan urunlerden "<urun> fiyatlari" sorgulari. */
export async function queriesFromProducts(limit: number): Promise<DiscoveryQuery[]> {
  const rows = await db
    .select({ name: hfProducts.nameTr })
    .from(hfProducts)
    .where(and(eq(hfProducts.isActive, 1), isNull(hfProducts.canonicalSlug)))
    .orderBy(sql`${hfProducts.searchVolume} DESC`)
    .limit(Math.max(1, limit - 1));
  const generic: DiscoveryQuery = { query: "hal fiyatları", clicks: 0, impressions: 0 };
  return [generic, ...rows.map((r) => ({ query: `${r.name.toLocaleLowerCase("tr")} fiyatları`, clicks: 0, impressions: 0 }))];
}

async function resolveQueries(opts: DiscoveryOptions): Promise<{ list: DiscoveryQuery[]; source: string }> {
  const limit = Math.max(1, Math.min(opts.limit ?? 30, 100));
  if (opts.queries?.length) return { list: opts.queries.slice(0, limit).map((q) => ({ query: q.trim(), clicks: 0, impressions: 0 })).filter((q) => q.query), source: "manual" };
  try {
    const list = await queriesFromGsc(limit);
    if (list.length) return { list, source: "gsc" };
  } catch {
    // GSC yetkisi yok ya da kota: urun listesine dus
  }
  return { list: await queriesFromProducts(limit), source: "products" };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function runCompetitorDiscovery(opts: DiscoveryOptions) {
  if (running) throw new Error("discovery_running");
  running = true;
  const pages = opts.pages ?? 2;
  const ours = ourHost();
  try {
    const { list, source } = await resolveQueries(opts);
    const [ins] = await db.insert(hfCompetitorSerpRuns).values({ engine: "bing", querySource: source, queriesTotal: list.length });
    const runId = Number((ins as { insertId: number }).insertId);
    let done = 0;
    let results = 0;
    let failures = 0;
    for (const q of list) {
      for (const page of ([1, 2] as const).slice(0, pages)) {
        const { hits, error } = await fetchBingPage(q.query, page);
        if (error) failures += 1;
        const rows = hits
          .filter((h) => !SKIP_DOMAINS.test(h.domain))
          .map((h) => ({ runId, query: q.query, queryClicks: q.clicks, queryImpressions: q.impressions, position: h.position, page: h.page, url: h.url, domain: h.domain, title: h.title, snippet: h.snippet, isOurs: h.domain === ours || h.domain.endsWith(`.${ours}`) ? 1 : 0 }));
        if (rows.length) await db.insert(hfCompetitorSerpResults).values(rows);
        results += rows.length;
        await sleep(DELAY_MS);
      }
      done += 1;
      await db.update(hfCompetitorSerpRuns).set({ queriesDone: done, resultsTotal: results }).where(eq(hfCompetitorSerpRuns.id, runId));
    }
    const status = failures === 0 ? "ok" : failures >= list.length * pages ? "error" : "partial";
    await db.update(hfCompetitorSerpRuns).set({ status, finishedAt: sql`NOW(3)`, errorMsg: failures ? `${failures} sayfa alinamadi` : null }).where(eq(hfCompetitorSerpRuns.id, runId));
    return { id: runId, status, queriesDone: done, resultsTotal: results, source };
  } finally {
    running = false;
  }
}

/** HTTP istegini bloklamadan arka planda calistirir; ayni anda tek kosu. */
export function startDiscoveryBackground(opts: DiscoveryOptions): boolean {
  if (running) return false;
  void runCompetitorDiscovery(opts).catch(() => undefined);
  return true;
}
