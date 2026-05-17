/**
 * Yillik fiyat raporu API.
 *
 * Endpoint: GET /api/v1/reports/annual?year=2025
 * Cache: 6 saat (Cache-Control header)
 *
 * Veri:
 *   - overview: ürün/market/satir sayilari, ortalama enflasyon
 *   - topRisers: yil basi vs sonu en cok artan 10 urun (cross-market median, outlier-filter)
 *   - topFallers: ayni mantik dusenler
 *   - seasonalPeaks: en yuksek 5 sezon kombinasyonu (urun + ay)
 *   - cityComparison: en pahali ve ucuz 5 sehir (sebze-meyve sepeti AVG)
 */

import type { FastifyInstance } from "fastify";
import { db } from "@/db/client";
import { hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

const EXCLUDED_MARKET_SLUGS = ["ulusal-hal-gov-tr"]; // aggregate, gun ici varyans yuksek

interface YearOverview {
  year: number;
  uniqueProducts: number;
  uniqueMarkets: number;
  totalRows: number;
  oldestDate: string;
  newestDate: string;
  avgInflationPct: number | null;
}

interface MoverRow {
  productSlug: string;
  productName: string;
  startAvg: number;
  endAvg: number;
  changePct: number;
}

interface SeasonalPeak {
  productSlug: string;
  productName: string;
  month: number;
  monthAvg: number;
  yearAvg: number;
  peakRatio: number; // monthAvg / yearAvg
}

interface CityRank {
  citySlug: string;
  cityName: string;
  basketAvg: number;
  marketCount: number;
}

interface AnnualReport {
  overview: YearOverview;
  topRisers: MoverRow[];
  topFallers: MoverRow[];
  seasonalPeaks: SeasonalPeak[];
  cityCheapest: CityRank[];
  cityMostExpensive: CityRank[];
}

function startOfYear(year: number): string {
  return `${year}-01-01`;
}
function endOfYear(year: number): string {
  return `${year}-12-31`;
}

async function fetchOverview(year: number): Promise<YearOverview> {
  const rows = await db
    .select({
      uniqueProducts: sql<number>`COUNT(DISTINCT product_id)`,
      uniqueMarkets: sql<number>`COUNT(DISTINCT market_id)`,
      totalRows:     sql<number>`COUNT(*)`,
      oldest:        sql<string>`MIN(recorded_date)`,
      newest:        sql<string>`MAX(recorded_date)`,
    })
    .from(hfPriceHistory)
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`${startOfYear(year)}`),
      lte(hfPriceHistory.recordedDate, sql`${endOfYear(year)}`),
    ));
  const r = rows[0]!;
  // Yillik ortalama enflasyon: Q1 (Oca-Mar) AVG vs Q4 (Eki-Ara) AVG (ulusal hariç)
  // Tek satir cevap — GROUP BY alias bug'i icin CASE expressions ayrı sutunda.
  const startEndRows = await db
    .select({
      startAvg: sql<number>`AVG(CASE WHEN ${hfPriceHistory.recordedDate} BETWEEN ${`${year}-01-01`} AND ${`${year}-03-31`} THEN ${hfPriceHistory.avgPrice} END)`,
      endAvg:   sql<number>`AVG(CASE WHEN ${hfPriceHistory.recordedDate} BETWEEN ${`${year}-10-01`} AND ${`${year}-12-31`} THEN ${hfPriceHistory.avgPrice} END)`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(
      sql`${hfMarkets.slug} NOT IN ('ulusal-hal-gov-tr')`,
      gte(hfPriceHistory.recordedDate, sql`${`${year}-01-01`}`),
      lte(hfPriceHistory.recordedDate, sql`${`${year}-12-31`}`),
    ));
  let avgInf: number | null = null;
  const s = Number(startEndRows[0]?.startAvg);
  const e = Number(startEndRows[0]?.endAvg);
  if (Number.isFinite(s) && Number.isFinite(e) && s > 0) {
    avgInf = Math.round(((e - s) / s) * 10000) / 100;
  }
  return {
    year,
    uniqueProducts: Number(r.uniqueProducts),
    uniqueMarkets:  Number(r.uniqueMarkets),
    totalRows:      Number(r.totalRows),
    oldestDate:     String(r.oldest).slice(0, 10),
    newestDate:     String(r.newest).slice(0, 10),
    avgInflationPct: avgInf,
  };
}

async function fetchMovers(year: number, direction: "up" | "down", limit = 10): Promise<MoverRow[]> {
  // Yilin ilk + son 30 gun AVG'leri (cross-market median, ulusal hariç)
  const rows = await db
    .select({
      productSlug:  hfProducts.slug,
      productName:  hfProducts.nameTr,
      startAvg:     sql<number>`AVG(CASE WHEN ${hfPriceHistory.recordedDate} BETWEEN ${`${year}-01-01`} AND ${`${year}-01-31`} THEN ${hfPriceHistory.avgPrice} END)`,
      endAvg:       sql<number>`AVG(CASE WHEN ${hfPriceHistory.recordedDate} BETWEEN ${`${year}-11-30`} AND ${`${year}-12-31`} THEN ${hfPriceHistory.avgPrice} END)`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`${startOfYear(year)}`),
      lte(hfPriceHistory.recordedDate, sql`${endOfYear(year)}`),
      sql`${hfMarkets.slug} NOT IN ('ulusal-hal-gov-tr')`,
      eq(hfProducts.isActive, 1),
    ))
    .groupBy(hfProducts.slug, hfProducts.nameTr);

  const movers: MoverRow[] = [];
  for (const r of rows) {
    const start = Number(r.startAvg);
    const end = Number(r.endAvg);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start <= 0 || end <= 0) continue;
    const pct = ((end - start) / start) * 100;
    // Outlier guard: %200+ değişim ETL hatası olasılığı
    if (Math.abs(pct) > 200) continue;
    movers.push({
      productSlug:  r.productSlug,
      productName:  r.productName,
      startAvg:     Math.round(start * 100) / 100,
      endAvg:       Math.round(end * 100) / 100,
      changePct:    Math.round(pct * 100) / 100,
    });
  }

  movers.sort((a, b) => direction === "up" ? b.changePct - a.changePct : a.changePct - b.changePct);
  return movers.slice(0, limit);
}

async function fetchSeasonalPeaks(year: number, limit = 8): Promise<SeasonalPeak[]> {
  // En yuksek ay (urun bazinda) — monthAvg / yearAvg orani
  const rows = await db
    .select({
      productSlug:  hfProducts.slug,
      productName:  hfProducts.nameTr,
      month:        sql<number>`MONTH(${hfPriceHistory.recordedDate})`,
      monthAvg:     sql<number>`AVG(${hfPriceHistory.avgPrice})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`${startOfYear(year)}`),
      lte(hfPriceHistory.recordedDate, sql`${endOfYear(year)}`),
      sql`${hfMarkets.slug} NOT IN ('ulusal-hal-gov-tr')`,
      eq(hfProducts.isActive, 1),
    ))
    .groupBy(hfProducts.slug, hfProducts.nameTr, sql`MONTH(${hfPriceHistory.recordedDate})`);

  // Urun bazinda gruplama
  const byProduct = new Map<string, { name: string; months: { month: number; avg: number }[] }>();
  for (const r of rows) {
    const avg = Number(r.monthAvg);
    if (!Number.isFinite(avg) || avg <= 0) continue;
    if (!byProduct.has(r.productSlug)) {
      byProduct.set(r.productSlug, { name: r.productName, months: [] });
    }
    byProduct.get(r.productSlug)!.months.push({ month: Number(r.month), avg });
  }

  const peaks: SeasonalPeak[] = [];
  for (const [slug, p] of byProduct.entries()) {
    if (p.months.length < 6) continue; // yeterli ay verisi
    const yearAvg = p.months.reduce((s, m) => s + m.avg, 0) / p.months.length;
    if (yearAvg <= 0) continue;
    let peak = p.months[0]!;
    for (const m of p.months) if (m.avg > peak.avg) peak = m;
    const ratio = peak.avg / yearAvg;
    if (ratio < 1.5) continue; // anlamli sezonlik
    peaks.push({
      productSlug:  slug,
      productName:  p.name,
      month:        peak.month,
      monthAvg:     Math.round(peak.avg * 100) / 100,
      yearAvg:      Math.round(yearAvg * 100) / 100,
      peakRatio:    Math.round(ratio * 100) / 100,
    });
  }
  peaks.sort((a, b) => b.peakRatio - a.peakRatio);
  return peaks.slice(0, limit);
}

async function fetchCityRanks(year: number): Promise<{ cheapest: CityRank[]; mostExpensive: CityRank[] }> {
  // Sehir basina yillik basket AVG (tum urunlerin yillik ortalama AVG'si)
  const rows = await db
    .select({
      citySlug:    hfMarkets.slug,
      cityName:    hfMarkets.cityName,
      basketAvg:   sql<number>`AVG(${hfPriceHistory.avgPrice})`,
      marketCount: sql<number>`COUNT(DISTINCT ${hfMarkets.id})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`${startOfYear(year)}`),
      lte(hfPriceHistory.recordedDate, sql`${endOfYear(year)}`),
      sql`${hfMarkets.slug} NOT IN ('ulusal-hal-gov-tr')`,
    ))
    .groupBy(hfMarkets.slug, hfMarkets.cityName)
    .having(sql`COUNT(*) > 100`); // yeterli veri olan sehirler

  const cities: CityRank[] = rows.map((r) => ({
    citySlug:    r.citySlug,
    cityName:    r.cityName,
    basketAvg:   Math.round(Number(r.basketAvg) * 100) / 100,
    marketCount: Number(r.marketCount),
  })).filter((c) => Number.isFinite(c.basketAvg) && c.basketAvg > 0);

  const sorted = [...cities].sort((a, b) => a.basketAvg - b.basketAvg);
  return {
    cheapest:      sorted.slice(0, 5),
    mostExpensive: sorted.slice(-5).reverse(),
  };
}

async function buildReport(year: number): Promise<AnnualReport> {
  const [overview, topRisers, topFallers, seasonalPeaks, cityRanks] = await Promise.all([
    fetchOverview(year),
    fetchMovers(year, "up", 10),
    fetchMovers(year, "down", 10),
    fetchSeasonalPeaks(year, 8),
    fetchCityRanks(year),
  ]);
  return {
    overview,
    topRisers,
    topFallers,
    seasonalPeaks,
    cityCheapest:       cityRanks.cheapest,
    cityMostExpensive:  cityRanks.mostExpensive,
  };
}

export async function registerAnnualReport(api: FastifyInstance) {
  api.get<{ Querystring: { year?: string } }>(
    "/reports/annual",
    async (req, reply) => {
      const yearRaw = parseInt(req.query.year ?? "", 10);
      const year = Number.isFinite(yearRaw) && yearRaw >= 2020 && yearRaw <= 2099
        ? yearRaw
        : new Date().getFullYear() - 1;
      try {
        const report = await buildReport(year);
        reply.header("Cache-Control", "public, max-age=21600"); // 6 saat
        return reply.send(report);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return reply.status(500).send({ error: msg });
      }
    },
  );
}

export { buildReport };
export type { AnnualReport, MoverRow, SeasonalPeak, CityRank, YearOverview };
