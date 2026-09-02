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
import { normalizeMysqlDate } from "@/modules/prices/blackout-date";
import { isStaleAgainstOwnBaseline, MIN_STALE_DAYS } from "./freshness-policy";
import { activeSources } from "@/config/etl-sources";

/**
 * Sicrama esigi — AKRAN hallerden sapma kati.
 *
 * Serinin kendi gecmisiyle kiyaslamak yetmiyor: mevsim gecisinde kiraz her yerde 4 kat
 * duser, bu gercek piyasa hareketidir ve alarm olmamalidir. Ayirt edici sinyal, ayni
 * urunu ayni gunlerde satan DIGER hallerden sapma: mevsimsel hareket tum halleri birlikte
 * tasir, yanlis eslesme ise tek hali ayirir.
 */
const PEER_DIVERGENCE = 2.5;
// Konum kaymis OLSA BILE su an akran medyanina yakinsa (converge etmis) alarm uretme:
// yalnizca hem kaymis HEM su an medyandan >=%40 sapmis olanlar insan incelemesine deger.
const CURRENT_DIVERGENCE_MIN = 0.4;

export interface StaleSource {
  sourceApi:    string;
  staleDays:    number;
  baselineDays: number;
  lastChanged:  string;
  rows:         number;
  /** Kaynagin KENDI tabanina gore donmus sayilip sayilmadigi. */
  isStale:      boolean;
}

export interface PriceJump {
  marketName:  string;
  productSlug: string;
  /** Ayni urunun DIGER hallerdeki guncel medyani (referans). */
  peerMedian:  number;
  value:       number;
  /** Akranlara gore konumun kac kat kaydigi (1 = degismedi). */
  ratio:       number;
  /** Su anki deger / akran medyani (1 = medyanda). */
  nowRatio:    number;
  days:        number;
}

/**
 * TUM kaynaklarin tazelik durumu: son degisim tarihi, kac gundur sabit, kendi tabani.
 * `isStale` yalnizca kaynagin KENDI tabanini asanlarda true — bazi haller kronik
 * yapiskan fiyatlidir ve bu normaldir.
 */
export async function sourceFreshness(windowDays = 180): Promise<StaleSource[]> {
  const rows = await db.execute(sql`
    SELECT ph.source_api, ph.recorded_date,
           COUNT(*) AS n,
           ROUND(SUM(ph.avg_price), 2) AS s
    FROM hf_price_history ph
    WHERE ph.recorded_date >= CURDATE() - INTERVAL ${windowDays} DAY
      -- Karantinaya alinmis (market x tarih) araliklari donma denetiminden cikar:
      -- bilincli isaretlenmis donmus kaynak tekrar alarm uretmesin.
      AND NOT EXISTS (
        SELECT 1 FROM hf_market_blackouts b
        WHERE b.market_id = ph.market_id
          AND ph.recorded_date BETWEEN b.from_date AND b.to_date
      )
      -- Yonetici onayindan gecen (kaynak + :reviewed) ve arsivden kurtarilan
      -- (kaynak + _wayback) satirlar CANLI besleme DEGILDIR: tek urunluk, seyrek
      -- backfill kayitlaridir, parmak izleri dogal olarak sabit gorunur. Denetime
      -- girerlerse kendi basina "kaynak donmus" alarmi uretirler — 32 karantina
      -- onayi 2026-09-02 tarihinde manisa_resmi:reviewed diye kritik alarm cikardi.
      AND RIGHT(ph.source_api, 9) <> ':reviewed'
      AND RIGHT(ph.source_api, 8) <> '_wayback'
    GROUP BY ph.source_api, ph.recorded_date
    ORDER BY ph.source_api, ph.recorded_date
  `);

  const list = (Array.isArray(rows) ? rows[0] : rows) as unknown as Array<{
    source_api: string; recorded_date: unknown; n: number; s: string;
  }>;

  const bySource = new Map<string, Array<{ date: string; fp: string; n: number }>>();
  for (const r of list) {
    const date = normalizeMysqlDate(r.recorded_date);
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
    out.push({
      sourceApi:    source,
      staleDays:    current.len,
      baselineDays: baseline,
      lastChanged:  current.from,
      rows:         current.n,
      isStale:      isStaleAgainstOwnBaseline(current.len, baseline),
    });
  }
  return out.sort((a, b) => b.staleDays - a.staleDays);
}

/**
 * Yalnizca kendi tabanini asan (donmus) kaynaklar — uyari zinciri bunu kullanir.
 *
 * KAPALI kaynaklar elenir: kapatilan bir kaynak tanim geregi yeni veri uretmez,
 * son gunu oldugu yerde kalir ve her gun "N gundur donmus" alarmi uretir. Donma
 * uyarisinin amaci "kaynak calisiyor gorunup bayat veri yaziyor" durumunu
 * yakalamak; kapali kaynakta boyle bir risk yoktur (2026-09-02: kapatilan bes
 * batiakdeniz kaynagi kapatildiktan sonra da alarm uretmeye devam etti).
 *
 * ILAN fiyatli kaynaklar da elenir (TMO alim fiyati): deger bir hasat sezonu
 * boyunca sabit kalir, donma dogru davranistir. Oradaki gercek risk sezon
 * degisiminde degerin eskimesidir — onu parser'in gecerlilik tarihi yakalar.
 */
export async function detectStaleSources(windowDays = 180): Promise<StaleSource[]> {
  const watched = new Set(activeSources().filter((s) => !s.announcedPrice).map((s) => s.key));
  return (await sourceFreshness(windowDays)).filter((s) => s.isStale && watched.has(s.sourceApi));
}

/**
 * Bir (hal x urun) serisinin akranlarina gore KONUMUNUN DEGISMESI.
 *
 * "Bu hal digerlerinden farkli" tek basina sinyal degil — bolgesel fiyat farki normaldir
 * (Demre uretim bolgesi, salkim domatesi hep akran medyaninin ~%15'i; bu dogru veridir).
 * Anlamli sinyal, oranin KAYMASI: hal eskiden akranlarini izlerken artik izlemiyorsa,
 * o seride bir sey degismistir.
 *
 * Kayseri vakasi: kuru sogan orani 15/45 ≈ 0,33 iken 110/45 ≈ 2,4'e cikti — oran 7 kat
 * kaydi. Demre'de ise oran hep ~0,15; kayma yok, alarm yok.
 */
export async function detectPriceJumps(): Promise<PriceJump[]> {
  const rows = await db.execute(sql`
    SELECT h.product_id, h.market_id, m.name AS market_name, p.slug AS product_slug,
           AVG(CASE WHEN h.recorded_date >= CURDATE() - INTERVAL 14 DAY THEN h.avg_price END) AS now_val,
           AVG(CASE WHEN h.recorded_date BETWEEN CURDATE() - INTERVAL 90 DAY
                                              AND CURDATE() - INTERVAL 30 DAY THEN h.avg_price END) AS then_val
    FROM hf_price_history h
    JOIN hf_markets m ON m.id = h.market_id
    JOIN hf_products p ON p.id = h.product_id
    WHERE h.recorded_date >= CURDATE() - INTERVAL 90 DAY AND h.unit = 'kg' AND h.avg_price > 0
    GROUP BY h.product_id, h.market_id, m.name, p.slug
    HAVING now_val IS NOT NULL AND then_val IS NOT NULL
  `);

  const list = (Array.isArray(rows) ? rows[0] : rows) as unknown as Array<{
    product_id: number; market_name: string; product_slug: string;
    now_val: string; then_val: string;
  }>;

  // Urun basina akran MEDYANI (ortalama degil — tek bozuk hal referansi kaydirmasin).
  const byProduct = new Map<number, { now: number[]; then: number[] }>();
  for (const r of list) {
    const acc = byProduct.get(r.product_id) ?? { now: [], then: [] };
    acc.now.push(parseFloat(String(r.now_val)));
    acc.then.push(parseFloat(String(r.then_val)));
    byProduct.set(r.product_id, acc);
  }
  const median = (v: number[]) => {
    const s = [...v].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
  };

  const out: PriceJump[] = [];
  for (const r of list) {
    const acc = byProduct.get(r.product_id)!;
    if (acc.now.length < 4) continue; // akran karsilastirmasi icin yeterli hal yok

    const peerNow = median(acc.now);
    const peerThen = median(acc.then);
    if (!(peerNow > 0) || !(peerThen > 0)) continue;

    const nowVal = parseFloat(String(r.now_val));
    const thenVal = parseFloat(String(r.then_val));
    if (!(nowVal > 0) || !(thenVal > 0)) continue;

    const ratioNow = nowVal / peerNow;
    const ratioThen = thenVal / peerThen;
    const shift = ratioNow / ratioThen;
    if (shift < PEER_DIVERGENCE && shift > 1 / PEER_DIVERGENCE) continue;
    // Kaymis ama su an medyana yakinsa (converge) — gerçek anomali degil, atla.
    if (Math.abs(ratioNow - 1) < CURRENT_DIVERGENCE_MIN) continue;

    out.push({
      marketName:  r.market_name,
      productSlug: r.product_slug,
      peerMedian:  Math.round(peerNow * 100) / 100,
      value:       Math.round(nowVal * 100) / 100,
      ratio:       Math.round(shift * 100) / 100,
      nowRatio:    Math.round(ratioNow * 100) / 100,
      days:        14,
    });
  }
  return out.sort((a, b) => Math.abs(Math.log(b.ratio)) - Math.abs(Math.log(a.ratio))).slice(0, 30);
}
