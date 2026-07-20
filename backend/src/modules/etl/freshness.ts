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
 *  2) SICRAMA — bir (hal x urun) serisinin degeri kendi yakin gecmisine gore uctu.
 *     Bu genelde donma degil, YANLIS ESLESME belirtisidir: 2026-07-07'de Kayseri'de
 *     arpacik soganin fiyati (110 TL) sade kuru sogana yazilmaya basladi; seri
 *     15 TL'den 110 TL'ye sicradi ve 14 gun oyle kaldi.
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
/** Sicrama esigi: serinin kendi medyanina gore bu katin uzeri/alti supheli. */
const JUMP_FACTOR = 4;

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
  from:        number;
  to:          number;
  since:       string;
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
 * Bir (hal x urun) serisinin kendi 30 gunluk medyanina gore uctugu ve o seviyede
 * KALDIGI durumlar. Tek gunluk sicrama gecici olabilir; kalici sicrama yanlis
 * eslesme belirtisidir.
 */
export async function detectPriceJumps(minDays = 3): Promise<PriceJump[]> {
  const rows = await db.execute(sql`
    SELECT m.name AS market_name, p.slug AS product_slug,
           cur.val AS to_val, cur.days AS days, cur.since AS since,
           base.med AS from_val
    FROM (
      SELECT market_id, product_id, avg_price AS val,
             COUNT(*) AS days, MIN(recorded_date) AS since
      FROM hf_price_history
      WHERE recorded_date >= CURDATE() - INTERVAL 21 DAY AND unit = 'kg' AND avg_price > 0
      GROUP BY market_id, product_id, avg_price
      HAVING COUNT(*) >= ${minDays} AND MAX(recorded_date) >= CURDATE() - INTERVAL 2 DAY
    ) cur
    JOIN (
      SELECT market_id, product_id, AVG(avg_price) AS med
      FROM hf_price_history
      WHERE recorded_date BETWEEN CURDATE() - INTERVAL 90 DAY AND CURDATE() - INTERVAL 22 DAY
        AND unit = 'kg' AND avg_price > 0
      GROUP BY market_id, product_id
      HAVING COUNT(*) >= 10
    ) base ON base.market_id = cur.market_id AND base.product_id = cur.product_id
    JOIN hf_markets m ON m.id = cur.market_id
    JOIN hf_products p ON p.id = cur.product_id
    WHERE base.med > 0
      AND (cur.val / base.med >= ${JUMP_FACTOR} OR base.med / cur.val >= ${JUMP_FACTOR})
    ORDER BY cur.val / base.med DESC
    LIMIT 40
  `);

  const list = (Array.isArray(rows) ? rows[0] : rows) as unknown as Array<{
    market_name: string; product_slug: string; to_val: string; from_val: string;
    since: unknown; days: number;
  }>;

  return list.map((r) => ({
    marketName:  r.market_name,
    productSlug: r.product_slug,
    from:        Math.round(parseFloat(String(r.from_val)) * 100) / 100,
    to:          Math.round(parseFloat(String(r.to_val)) * 100) / 100,
    since:       String(r.since).slice(0, 10),
    days:        Number(r.days),
  }));
}
