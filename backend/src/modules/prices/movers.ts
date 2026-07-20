/**
 * Ulusal fiyat hareketleri — TEK doğru kaynak.
 *
 * Neden: eski `trendingChanges` tek (ürün × hal) çifti üzerinden çalışıyordu; tek bir halin
 * ETL sıçraması "haftanın hareketi" olarak yayınlanıyordu (ör. e-bültende "TURP (Kırmızı)
 * Bursa +%76, geçen yıl +%372"). Burada hareket ÜRÜN AİLESİ (kanonik master) düzeyinde ve
 * ÇOK HALDE gözlem şartıyla hesaplanır — yayınlanan haftalık raporlarla aynı metodoloji.
 */

import { and, between, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfPriceHistory, hfProducts } from "@/db/schema";

// Hareket listesinde fiyat düzeyi kıyaslanabilir olmayan kategoriler yer almaz
// (kategori ortalaması tablolarında yine görünürler).
export const MOVER_EXCLUDED_CATEGORIES = [
  "balik-deniz", "balik-ithal", "balik-kultur", "et", "canli-hayvan", "hububat", "bakliyat",
];

// Hafta-içi hareket için en az bu kadar ayrı halde gözlem şartı (tek hal glitch'i elenir).
export const MIN_MARKETS = 6;
// Geçen yıl karşılaştırmasında tarihsel kapsam daha düşük — eşik gevşek, ama tek-hal değil.
// Burada sayılan şey EŞLEŞEN (hal × ürün) çifti sayısıdır, ham gözlem değil.
export const MIN_PAIRS_YOY = 3;

export interface NationalMover {
  productSlug: string;
  productName: string;
  latest:      number;
  previous:    number;
  changePct:   number;
  marketCount: number;
  /** Geçen yıl karşılaştırmasının dayandığı eşleşmiş (hal × ürün) çifti sayısı. */
  yoyPairs:    number | null;
  lastYearAvg: number | null;
  yoyPct:      number | null;
}

export interface Agg {
  avg:     number;
  markets: number;
  /** `${marketId}|${productSlug}` → o çiftin ortalama fiyatı. Yıllık kıyas sepetini eşlemek için. */
  pairs:   Map<string, number>;
}

export function isoShift(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * Verilen tarih aralığında ürün ailesi başına ulusal fiyat + kaç halde gözlendiği.
 *
 * Ulusal fiyat = önce HER HAL için ortalama, sonra haller arasında MEDYAN.
 * Neden medyan: bazı kaynaklar (özellikle "Türkiye Ulusal Ortalama / hal.gov.tr" agregatörü)
 * ara sıra çöp değer basıyor — turp için 507 ₺/kg gibi (gerçek haller 22–50 ₺). Düz ortalamada
 * bu tek kaynak tabloyu zehirliyordu; medyan tek bozuk kaynaktan etkilenmez. Sabit "şu kaynağı
 * dışla" listesi yerine istatistiksel dayanıklılık — yeni bozuk kaynak çıkarsa da korur.
 */
export async function windowByMaster(from: string, to: string): Promise<Map<string, Agg>> {
  const rows = await db
    .select({
      masterSlug:  sql<string>`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
      marketId:    hfPriceHistory.marketId,
      productSlug: hfProducts.slug,
      hallAvg:     sql<string>`AVG(${hfPriceHistory.avgPrice})`,
      obs:         sql<string>`COUNT(*)`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(
      and(
        between(hfPriceHistory.recordedDate, sql`${from}`, sql`${to}`),
        eq(hfProducts.isActive, 1),
        eq(hfPriceHistory.unit, "kg"),
        sql`${hfPriceHistory.avgPrice} > 0`,
        sql`${hfProducts.categorySlug} NOT IN (${sql.join(MOVER_EXCLUDED_CATEGORIES.map((c) => sql`${c}`), sql`, `)})`,
      ),
    )
    .groupBy(
      sql`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
      hfPriceHistory.marketId,
      hfProducts.slug,
    );

  // (master, hal) → varyantların gözlem-ağırlıklı ortalaması; ayrıca (hal, varyant) çiftleri.
  interface Acc { halls: Map<number, { sum: number; n: number }>; pairs: Map<string, number> }
  const byMaster = new Map<string, Acc>();
  for (const r of rows) {
    const v = parseFloat(String(r.hallAvg));
    const n = parseInt(String(r.obs), 10);
    if (!Number.isFinite(v) || v <= 0 || !Number.isFinite(n) || n <= 0) continue;

    let acc = byMaster.get(r.masterSlug);
    if (!acc) { acc = { halls: new Map(), pairs: new Map() }; byMaster.set(r.masterSlug, acc); }

    const hall = acc.halls.get(r.marketId);
    if (hall) { hall.sum += v * n; hall.n += n; }
    else acc.halls.set(r.marketId, { sum: v * n, n });

    acc.pairs.set(`${r.marketId}|${r.productSlug}`, v);
  }

  const out = new Map<string, Agg>();
  for (const [slug, acc] of byMaster) {
    const hallAvgs = [...acc.halls.values()].map((h) => h.sum / h.n);
    out.set(slug, { avg: median(hallAvgs), markets: hallAvgs.length, pairs: acc.pairs });
  }
  return out;
}

/**
 * Yıllık değişim — EŞLEŞTİRİLMİŞ SEPET.
 *
 * Neden: iki yılın ham medyanını kıyaslamak elmayla armut kıyaslamaktı. İki taraf ne aynı
 * halleri ne de aynı varyantları içeriyordu; oran gerçek fiyat hareketini değil sepet
 * değişimini ölçüyordu. Somut vaka (2026-07-20 bülteni): `sogan-kuru` ailesinde 2025 sepeti
 * 7 haldi ve içinde bugün hiç görünmeyen ucuz varyantlar vardı (`sogan-kuru-ii-taze` 5 ₺,
 * `sogan-arpacik` 13 ₺) → medyan 10,5 ₺. 2026 sepeti ise 14 halde düz `sogan-kuru` → 47,88 ₺.
 * Çıkan "+%356" fiyat artışı değil, kapsam artışıydı. Aynı hata tere'de `tere-70-100gr`
 * (100 gramlık paket, kg fiyatı gibi 3,1 ₺) ve greyfurt'ta `greyfurt-diger` üzerinden tekrarlıyordu.
 *
 * Çözüm: yalnızca HER İKİ dönemde de aynı (hal × ürün) çiftinde gözlenmiş fiyatlar kıyaslanır.
 * Sepet iki tarafta tanımı gereği özdeş olduğundan geriye sadece fiyat hareketi kalır.
 */
export function matchedYoy(cur: Agg, ly: Agg): { lastYearAvg: number; yoyPct: number; pairs: number } | null {
  const curVals: number[] = [];
  const lyVals:  number[] = [];
  for (const [key, lyPrice] of ly.pairs) {
    const curPrice = cur.pairs.get(key);
    if (curPrice == null || lyPrice <= 0 || curPrice <= 0) continue;
    curVals.push(curPrice);
    lyVals.push(lyPrice);
  }
  if (curVals.length < MIN_PAIRS_YOY) return null;

  const curMed = median(curVals);
  const lyMed  = median(lyVals);
  if (lyMed <= 0) return null;

  return {
    lastYearAvg: lyMed,
    yoyPct:      Math.round((10000 * (curMed - lyMed)) / lyMed) / 100,
    pairs:       curVals.length,
  };
}

export async function latestRecordedDate(): Promise<string | null> {
  const rows = await db
    .select({ d: sql<string>`MAX(${hfPriceHistory.recordedDate})` })
    .from(hfPriceHistory);
  const d = rows[0]?.d;
  return d ? String(d).slice(0, 10) : null;
}

/**
 * Son ~7 günün ulusal hareketleri: güncel pencere (son 3 gün) vs bir hafta öncesi (7–9 gün önce),
 * ayrıca geçen yılın aynı dönemi (±3 gün) ile karşılaştırma. Her ürün ailesi en az MIN_MARKETS
 * ayrı halde gözlenmiş olmalı. Sonuç: en çok artan yarısı + en çok düşen yarısı.
 */
export async function nationalMovers(limit = 10): Promise<NationalMover[]> {
  const latest = await latestRecordedDate();
  if (!latest) return [];

  const [cur, prev, lastYear] = await Promise.all([
    windowByMaster(isoShift(latest, -2), latest),
    windowByMaster(isoShift(latest, -9), isoShift(latest, -7)),
    windowByMaster(isoShift(latest, -368), isoShift(latest, -362)),
  ]);

  const scored: NationalMover[] = [];
  for (const [slug, c] of cur) {
    const p = prev.get(slug);
    if (!p) continue;
    if (c.markets < MIN_MARKETS || p.markets < MIN_MARKETS) continue;
    if (p.avg <= 0) continue;

    const changePct = Math.round((10000 * (c.avg - p.avg)) / p.avg) / 100;
    // Ulusal ortalama + çok-hal şartı anomalilerin çoğunu eler; bu son emniyet kemeri.
    if (Math.abs(changePct) > 80) continue;

    const ly = lastYear.get(slug);
    const yoy = ly ? matchedYoy(c, ly) : null;

    scored.push({
      productSlug: slug,
      productName: slug,
      latest:      c.avg,
      previous:    p.avg,
      changePct,
      marketCount: Math.min(c.markets, p.markets),
      yoyPairs:    yoy?.pairs ?? null,
      lastYearAvg: yoy?.lastYearAvg ?? null,
      yoyPct:      yoy?.yoyPct ?? null,
    });
  }
  if (!scored.length) return [];

  const half = Math.ceil(limit / 2);
  const risers  = scored.filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, half);
  const fallers = scored.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, half);
  const top = [...risers, ...fallers];
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
