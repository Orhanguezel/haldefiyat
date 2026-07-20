/**
 * ETL tazelik denetimi — "basarili calisti" ile "yeni veri geldi" ayni sey degil.
 *
 * Neden: hf_etl_runs yalnizca kac satir islendigini tutuyor. Bir kaynak her gun ayni
 * degerleri tekrar yazarsa `status='ok'` ve `rows_inserted=1900` gorunur; hicbir alarm
 * calmaz. Bu sekilde uc halin verisi 1.097 GUN boyunca donmus halde yayinlandi ve kimse
 * fark etmedi (bkz. docs/checklists/DONMUS-HAL-VERISI-DUZELTME.md).
 *
 * Iki ayri basarisizlik modunu yakalar:
 *
 *  1) DONMA  — kaynagin gunluk parmak izi (satir sayisi + fiyat toplami) degismiyor.
 *  2) SAPMA — bir (hal x urun) serisi, ayni urunu satan DIGER hallerden kalici olarak
 *     ayrisiyor. Bu YANLIS ESLESME belirtisidir: 2026-07-07'de Kayseri'de arpacik
 *     soganin fiyati (110 TL) sade kuru sogana yazilmaya basladi; diger haller 45 TL'de
 *     iken o hal 110'da kaldi. Mevsimsel hareket tum halleri birlikte tasidigi icin
 *     bu testten gecmez (kiraz sezon sonu her yerde duser — alarm degildir).
 *
 * ONEMLI — esik mutlak DEGIL, kaynagin KENDI gecmisine gore: bazi haller kronik yapiskan
 * fiyatli (Konya %71, Kutahya %80 seri "14 gunde hic degismedi" tabani NORMAL). Mutlak
 * esikle bakildiginda bu kaynaklar surekli yanlis alarm uretir — nitekim ilk denemede
 * uretti. O yuzden her kaynak kendi tarihsel donma suresiyle kiyaslanir.
 *
 * Tablo eklemedik: parmak izi fiyat gecmisinden anlik hesaplanir, boylece denetim
 * GECMISE de uygulanabilir (backfill gerekmez).
 */

import { sql } from "drizzle-orm";
import { db } from "@/db/client";

/** Bu kadar gunden kisa donma hicbir kaynakta alarm sayilmaz (hafta sonu/tatil payi). */
const MIN_STALE_DAYS = 4;
/** Kaynagin kendi tarihsel donma suresine eklenen guvenlik payi. */
const BASELINE_MARGIN = 2;
/**
 * Sicrama esigi — AKRAN hallerden sapma kati.
 *
 * Serinin kendi gecmisiyle kiyaslamak yetmiyor: mevsim gecisinde kiraz her yerde 4 kat
 * duser, bu gercek piyasa hareketidir ve alarm olmamalidir. Ayirt edici sinyal, ayni
 * urunu ayni gunlerde satan DIGER hallerden sapma: mevsimsel hareket tum halleri birlikte
 * tasir, yanlis eslesme ise tek hali ayirir.
 */
const PEER_DIVERGENCE = 2.5;

export interface StaleSource {
  sourceApi:    string;
  staleDays:    number;
  baselineDays: number;
  lastChanged:  string;
  rows:         number;
}

export interface PriceJump {
  marketName:  string;
  productSlug: string;
  /** Ayni urunun DIGER hallerdeki medyani (referans). */
  peerMedian:  number;
  value:       number;
  ratio:       number;
  days:        number;
}

/**
 * Gunluk parmak izi degismeyen kaynaklar. `baselineDays`, o kaynagin son 180 gundeki
 * EN UZUN normal donma suresi — alarm ancak bunu asinca uretilir.
 */
export async function detectStaleSources(windowDays = 180): Promise<StaleSource[]> {
  const rows = await db.execute(sql`
    SELECT source_api, recorded_date,
           COUNT(*) AS n,
           ROUND(SUM(avg_price), 2) AS s
    FROM hf_price_history
    WHERE recorded_date >= CURDATE() - INTERVAL ${windowDays} DAY
    GROUP BY source_api, recorded_date
    ORDER BY source_api, recorded_date
  `);

  const list = (Array.isArray(rows) ? rows[0] : rows) as unknown as Array<{
    source_api: string; recorded_date: unknown; n: number; s: string;
  }>;

  const bySource = new Map<string, Array<{ date: string; fp: string; n: number }>>();
  for (const r of list) {
    const date = String(r.recorded_date).slice(0, 10);
    const fp = `${r.n}_${r.s}`;
    const arr = bySource.get(r.source_api);
    if (arr) arr.push({ date, fp, n: Number(r.n) });
    else bySource.set(r.source_api, [{ date, fp, n: Number(r.n) }]);
  }

  const out: StaleSource[] = [];
  for (const [source, days] of bySource) {
    if (days.length < MIN_STALE_DAYS) continue;

    // Ardisik ayni-parmak-izi bloklarina ayir.
    const runs: Array<{ fp: string; from: string; to: string; len: number; n: number }> = [];
    for (const d of days) {
      const last = runs[runs.length - 1];
      if (last && last.fp === d.fp) { last.to = d.date; last.len++; }
      else runs.push({ fp: d.fp, from: d.date, to: d.date, len: 1, n: d.n });
    }

    const current = runs[runs.length - 1]!;
    // Kaynagin KENDI normali: gecmisteki en uzun donma (guncel blok haric).
    const baseline = runs.slice(0, -1).reduce((m, r) => Math.max(m, r.len), 1);
    const threshold = Math.max(MIN_STALE_DAYS, baseline + BASELINE_MARGIN);

    if (current.len >= threshold) {
      out.push({
        sourceApi:    source,
        staleDays:    current.len,
        baselineDays: baseline,
        lastChanged:  current.from,
        rows:         current.n,
      });
    }
  }
  return out.sort((a, b) => b.staleDays - a.staleDays);
}

/**
 * Ayni urunu satan diger hallerden kalici olarak ayrisan seriler.
 *
 * Yanlis eslesmenin imzasi budur: Kayseri'de arpacik soganin fiyati (110 TL) sade kuru
 * sogana yazilinca, diger haller 45 TL'deyken o hal 110'da kaldi. Mevsimsel hareketler
 * tum halleri birlikte tasidigi icin bu testten gecmez.
 */
export async function detectPriceJumps(minDays = 3): Promise<PriceJump[]> {
  const rows = await db.execute(sql`
    SELECT m.name AS market_name, p.slug AS product_slug,
           cur.val AS value, cur.days AS days, peer.med AS peer_median
    FROM (
      SELECT h.market_id, h.product_id,
             AVG(h.avg_price) AS val, COUNT(DISTINCT h.recorded_date) AS days
      FROM hf_price_history h
      WHERE h.recorded_date >= CURDATE() - INTERVAL 14 DAY AND h.unit = 'kg' AND h.avg_price > 0
      GROUP BY h.market_id, h.product_id
      HAVING COUNT(DISTINCT h.recorded_date) >= ${minDays}
    ) cur
    JOIN (
      SELECT h.product_id, COUNT(DISTINCT h.market_id) AS halls,
             AVG(h.avg_price) AS med
      FROM hf_price_history h
      WHERE h.recorded_date >= CURDATE() - INTERVAL 14 DAY AND h.unit = 'kg' AND h.avg_price > 0
      GROUP BY h.product_id
      HAVING COUNT(DISTINCT h.market_id) >= 4
    ) peer ON peer.product_id = cur.product_id
    JOIN hf_markets m ON m.id = cur.market_id
    JOIN hf_products p ON p.id = cur.product_id
    WHERE peer.med > 0
      AND (cur.val / peer.med >= ${PEER_DIVERGENCE} OR peer.med / cur.val >= ${PEER_DIVERGENCE})
    ORDER BY GREATEST(cur.val / peer.med, peer.med / cur.val) DESC
    LIMIT 40
  `);

  const list = (Array.isArray(rows) ? rows[0] : rows) as unknown as Array<{
    market_name: string; product_slug: string; value: string; peer_median: string; days: number;
  }>;

  return list.map((r) => {
    const value = parseFloat(String(r.value));
    const peer = parseFloat(String(r.peer_median));
    return {
      marketName:  r.market_name,
      productSlug: r.product_slug,
      peerMedian:  Math.round(peer * 100) / 100,
      value:       Math.round(value * 100) / 100,
      ratio:       Math.round((value / peer) * 100) / 100,
      days:        Number(r.days),
    };
  });
}
