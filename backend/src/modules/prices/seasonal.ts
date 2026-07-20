/**
 * Mevsimlik urunler — sezon basindan bu yana fiyat seyri.
 *
 * Neden yillik kiyas DEGIL: mevsimlik urunlerde gecen yilin ayni takvim haftasiyla
 * karsilastirmak yalan uretir. Hasat bir hafta kaysa fiyat carpiliyor: kiraz gecen yil
 * ayni hafta sezon basiydi (439 TL), bu yil sezon zirvesi (70 TL) — tabloya "-%76,7"
 * diye dusuyor, sanki kiraz ucuzlamis gibi. Oysa ucuzlayan sey kiraz degil, takvim kaymis.
 *
 * Anlamli olan sey: urunun KENDI sezonu icindeki konumu. "Kiraz sezon basinda 440 TL'ydi,
 * simdi 70 TL" — takvimden bagimsiz, dogru ve okura dogrudan "simdi al" sinyali veriyor.
 *
 * Sezon tespiti veriden gelir, sabit takvim listesinden degil: bir urun yilin kac ayri
 * haftasinda hallerde olculmus? Yil boyu bulunanlar (domates, patates...) sabit sepete
 * girer; yilin bir kismi kaybolanlar mevsimliktir. Boylece yeni urun eklendiginde veya
 * bir urunun sezonu kaydiginda elle bakim gerekmez.
 */

import { and, between, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfBasketProducts, hfPriceHistory, hfProducts } from "@/db/schema";
import { isoShift, latestRecordedDate, MIN_MARKETS, MOVER_EXCLUDED_CATEGORIES } from "./movers";

/** Yilin bu kadar ayri haftasindan azinda gorulen urun mevsimlik sayilir. */
const YEAR_ROUND_WEEKS = 44;
/** Sezon basi fiyatinin guvenilir olmasi icin o hafta en az bu kadar halde olculmus olmali. */
const MIN_MARKETS_SEASON_START = 3;
/** Sezon bu kadar haftadir suruyor olmali — 1 haftalik sezonda "seyir" diye bir sey yok. */
const MIN_SEASON_WEEKS = 3;

export interface SeasonalRow {
  productSlug:   string;
  productName:   string;
  seasonStart:   number;
  price:         number;
  changePct:     number;
  marketCount:   number;
  /** Sezon kac haftadir suruyor — okura "sezon yeni basladi / zirvede" bilgisi verir. */
  seasonWeeks:   number;
}

interface WeekCell { halls: Set<number>; prices: Map<number, { sum: number; n: number }> }

/** ISO hafta anahtari (YEARWEEK mode 3) — yil sonu kaymalarinda dogru gruplar. */
type WeekKey = number;

/**
 * Son ~1 yilin (master, hafta, hal) fiyat tablosu. Mevsimsellik tespiti ve sezon basi
 * fiyati ayni veriden cikar; ikinci sorgu gerekmez.
 */
async function weeklyGrid(fromIso: string, toIso: string): Promise<Map<string, Map<WeekKey, WeekCell>>> {
  const rows = await db
    .select({
      masterSlug: sql<string>`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
      week:       sql<number>`YEARWEEK(${hfPriceHistory.recordedDate}, 3)`,
      marketId:   hfPriceHistory.marketId,
      price:      sql<string>`AVG(${hfPriceHistory.avgPrice})`,
      obs:        sql<string>`COUNT(*)`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(
      and(
        between(hfPriceHistory.recordedDate, sql`${fromIso}`, sql`${toIso}`),
        eq(hfProducts.isActive, 1),
        eq(hfPriceHistory.unit, "kg"),
        sql`${hfPriceHistory.avgPrice} > 0`,
        sql`${hfProducts.categorySlug} NOT IN (${sql.join(MOVER_EXCLUDED_CATEGORIES.map((c) => sql`${c}`), sql`, `)})`,
      ),
    )
    .groupBy(
      sql`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
      sql`YEARWEEK(${hfPriceHistory.recordedDate}, 3)`,
      hfPriceHistory.marketId,
    );

  const grid = new Map<string, Map<WeekKey, WeekCell>>();
  for (const r of rows) {
    const v = parseFloat(String(r.price));
    const n = parseInt(String(r.obs), 10);
    if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(n) || n <= 0) continue;

    let weeks = grid.get(r.masterSlug);
    if (!weeks) { weeks = new Map(); grid.set(r.masterSlug, weeks); }

    const wk = Number(r.week);
    let cell = weeks.get(wk);
    if (!cell) { cell = { halls: new Set(), prices: new Map() }; weeks.set(wk, cell); }

    cell.halls.add(r.marketId);
    const acc = cell.prices.get(r.marketId);
    if (acc) { acc.sum += v * n; acc.n += n; }
    else cell.prices.set(r.marketId, { sum: v * n, n });
  }
  return grid;
}

function cellMedian(cell: WeekCell): number {
  const vals = [...cell.prices.values()].map((p) => p.sum / p.n).sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid]! : (vals[mid - 1]! + vals[mid]!) / 2;
}

/**
 * Su an sezonunda olan mevsimlik urunler, sezon basina gore fiyat degisimiyle.
 * Sabit sepetteki (yil boyu) urunler haric — onlar zaten ana tabloda.
 */
export async function seasonalProducts(limit = 8): Promise<SeasonalRow[]> {
  const latest = await latestRecordedDate();
  if (!latest) return [];

  const grid = await weeklyGrid(isoShift(latest, -370), latest);
  if (!grid.size) return [];

  const basket = await db
    .select({ slug: hfBasketProducts.slug })
    .from(hfBasketProducts)
    .where(eq(hfBasketProducts.isActive, 1));
  const inBasket = new Set(basket.map((b) => b.slug));

  const scored: SeasonalRow[] = [];

  for (const [slug, weeks] of grid) {
    if (inBasket.has(slug)) continue;

    // Yil boyu bulunan urun mevsimlik degil.
    const activeWeeks = [...weeks.values()].filter((c) => c.halls.size >= MIN_MARKETS_SEASON_START).length;
    if (activeWeeks >= YEAR_ROUND_WEEKS) continue;

    const ordered = [...weeks.keys()].sort((a, b) => a - b);
    const currentWeek = ordered[ordered.length - 1]!;
    const curCell = weeks.get(currentWeek)!;
    // Su an gercekten sezonunda mi?
    if (curCell.halls.size < MIN_MARKETS) continue;

    // Sezon basi: bugunden geriye dogru KESINTISIZ veri olan ilk hafta.
    let startIdx = ordered.length - 1;
    while (startIdx > 0) {
      const prevWeek = ordered[startIdx - 1]!;
      const gap = ordered[startIdx]! - prevWeek;
      // YEARWEEK ardisik haftalarda 1 artar; yil doneminde sicrar, o yuzden gap toleransi.
      const contiguous = gap === 1 || (gap > 50 && gap < 80);
      if (!contiguous) break;
      if (weeks.get(prevWeek)!.halls.size < MIN_MARKETS_SEASON_START) break;
      startIdx--;
    }

    const seasonWeeks = ordered.length - startIdx;
    if (seasonWeeks < MIN_SEASON_WEEKS) continue;

    const startCell = weeks.get(ordered[startIdx]!)!;
    const seasonStart = cellMedian(startCell);
    const price = cellMedian(curCell);
    if (!(seasonStart > 0) || !(price > 0)) continue;

    scored.push({
      productSlug: slug,
      productName: slug,
      seasonStart,
      price,
      changePct:   Math.round((10000 * (price - seasonStart)) / seasonStart) / 100,
      marketCount: curCell.halls.size,
      seasonWeeks,
    });
  }

  // Once en yaygin bulunan urunler — okurun gercekten pazarda karsilastiklari.
  const top = scored.sort((a, b) => b.marketCount - a.marketCount).slice(0, limit);
  if (!top.length) return [];

  const names = await db
    .select({
      slug: hfProducts.slug,
      name: sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
    })
    .from(hfProducts)
    .where(inArray(hfProducts.slug, top.map((t) => t.productSlug)));
  const nameMap = new Map(names.map((n) => [n.slug, n.name]));

  return top.map((t) => ({ ...t, productName: nameMap.get(t.productSlug) ?? t.productSlug }));
}
