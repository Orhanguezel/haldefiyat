/**
 * Haftalik bultenin iki bolumu: SABIT SEPET ve YILLIK HAREKETLER.
 *
 * Neden ayri: eski bulten tek tabloda hem haftalik hem yillik yuzdeyi gosteriyordu, ustelik
 * urunler haftalik harekete gore secilip yanlarina alakasiz bir yillik oran yaziliyordu.
 * Okur hangi sayiya bakacagini bilemiyordu. Artik her tablonun tek zaman ekseni ve tek yuzdesi var.
 *
 * Fiyat ve yillik degisim metodolojisi movers.ts ile AYNI (haller arasi medyan + eslestirilmis
 * sepet) — iki yerde iki farkli sayi cikmasin diye ayni fonksiyonlar yeniden kullanilir.
 */

import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfBasketProducts, hfProducts } from "@/db/schema";
import {
  isoShift,
  latestRecordedDate,
  matchedYoy,
  windowByMaster,
  MIN_MARKETS,
  type Agg,
} from "./movers";

export interface BasketRow {
  productSlug: string;
  productName: string;
  price:       number;
  marketCount: number;
  /**
   * Yillik kiyasin gosterilecek guncel fiyati: eslesmis sepetten gelir, tum hallerin
   * medyanindan degil. Iki fiyat ile yuzde ayni kumeden olsun ki okur dogrulayabilsin.
   */
  yoyCurrent:  number | null;
  /** Gecen haftanin fiyati — su an tabloda gosterilmiyor, fikir degisirse hazir. */
  prevPrice:   number | null;
  weeklyPct:   number | null;
  lastYearAvg: number | null;
  yoyPct:      number | null;
  yoyPairs:    number | null;
}

export interface YearlyMove {
  productSlug: string;
  productName: string;
  price:       number;
  lastYearAvg: number;
  yoyPct:      number;
  yoyPairs:    number;
}

async function displayNames(slugs: string[]): Promise<Map<string, string>> {
  if (!slugs.length) return new Map();
  const rows = await db
    .select({
      slug: hfProducts.slug,
      name: sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
    })
    .from(hfProducts)
    .where(inArray(hfProducts.slug, slugs));
  return new Map(rows.map((r) => [r.slug, r.name]));
}

interface Windows { cur: Map<string, Agg>; prev: Map<string, Agg>; lastYear: Map<string, Agg> }

async function loadWindows(): Promise<{ latest: string; w: Windows } | null> {
  const latest = await latestRecordedDate();
  if (!latest) return null;
  const [cur, prev, lastYear] = await Promise.all([
    windowByMaster(isoShift(latest, -2), latest),
    windowByMaster(isoShift(latest, -9), isoShift(latest, -7)),
    windowByMaster(isoShift(latest, -368), isoShift(latest, -362)),
  ]);
  return { latest, w: { cur, prev, lastYear } };
}

/**
 * Sabit sepet: hf_basket_products'taki urunler, tabloda hep ayni sirada.
 * Bir urun o hafta yeterli halde olculmediyse satiri atlanir — bulten yaniltici
 * tek-hal fiyati basmaktansa eksik satir gosterir.
 */
export async function weeklyBasket(): Promise<BasketRow[]> {
  const loaded = await loadWindows();
  if (!loaded) return [];
  const { cur, prev, lastYear } = loaded.w;

  const basket = await db
    .select({ slug: hfBasketProducts.slug })
    .from(hfBasketProducts)
    .where(eq(hfBasketProducts.isActive, 1))
    .orderBy(asc(hfBasketProducts.sortOrder));

  const rows: BasketRow[] = [];
  for (const b of basket) {
    const c = cur.get(b.slug);
    if (!c || c.markets < MIN_MARKETS) continue;

    const p = prev.get(b.slug);
    const comparable = p && p.avg > 0 && p.markets >= MIN_MARKETS;

    const ly = lastYear.get(b.slug);
    const yoy = ly ? matchedYoy(c, ly) : null;

    rows.push({
      productSlug: b.slug,
      productName: b.slug,
      price:       c.avg,
      marketCount: c.markets,
      prevPrice:   comparable ? p!.avg : null,
      weeklyPct:   comparable ? Math.round((10000 * (c.avg - p!.avg)) / p!.avg) / 100 : null,
      yoyCurrent:  yoy?.currentAvg ?? null,
      lastYearAvg: yoy?.lastYearAvg ?? null,
      yoyPct:      yoy?.yoyPct ?? null,
      yoyPairs:    yoy?.pairs ?? null,
    });
  }

  const names = await displayNames(rows.map((r) => r.productSlug));
  return rows.map((r) => ({ ...r, productName: names.get(r.productSlug) ?? r.productSlug }));
}

/**
 * Gecen yila gore en cok pahalilasan / ucuzlayan urunler — sepetten bagimsiz, tum katalog.
 * Sadece eslestirilmis sepet uzerinden hesaplanir (bkz. matchedYoy), yani kapsam degisimi
 * artis gibi gorunmez. Sonuc: yarisi artan, yarisi azalan.
 */
export async function yearlyMovers(limit = 10): Promise<{ up: YearlyMove[]; down: YearlyMove[] }> {
  const loaded = await loadWindows();
  if (!loaded) return { up: [], down: [] };
  const { cur, lastYear } = loaded.w;

  const scored: YearlyMove[] = [];
  for (const [slug, c] of cur) {
    if (c.markets < MIN_MARKETS) continue;
    const ly = lastYear.get(slug);
    if (!ly) continue;
    const yoy = matchedYoy(c, ly);
    if (!yoy) continue;

    scored.push({
      productSlug: slug,
      productName: slug,
      price:       yoy.currentAvg,
      lastYearAvg: yoy.lastYearAvg,
      yoyPct:      yoy.yoyPct,
      yoyPairs:    yoy.pairs,
    });
  }

  const half = Math.max(1, Math.floor(limit / 2));
  const up   = scored.filter((s) => s.yoyPct > 0).sort((a, b) => b.yoyPct - a.yoyPct).slice(0, half);
  const down = scored.filter((s) => s.yoyPct < 0).sort((a, b) => a.yoyPct - b.yoyPct).slice(0, half);

  const names = await displayNames([...up, ...down].map((r) => r.productSlug));
  const named = (r: YearlyMove) => ({ ...r, productName: names.get(r.productSlug) ?? r.productSlug });
  return { up: up.map(named), down: down.map(named) };
}
