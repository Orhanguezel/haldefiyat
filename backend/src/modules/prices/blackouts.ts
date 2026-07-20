/**
 * Hal x tarih karantinasi — guvenilmez veri araliklarini toplama disi birakir.
 *
 * Neden: bazi hallerin gecmis verisi uydurma (tek anlik goruntu 1097 gun boyunca her gune
 * kopyalanmis; bkz. docs/checklists/DONMUS-HAL-VERISI-DUZELTME.md). Satirlar silinmiyor —
 * dogru veriyle backfill edilecekler — ama o zamana kadar ortalamalari zehirliyorlar.
 *
 * Somut etki: endeksin BAZ HAFTASI (2025-17) bu donemin icindeydi ve sepet ortalamasina
 * Bursa (ort. 78,5 TL) ile Denizli (53,9 TL) donmus degerleriyle hakimdi; temiz haller
 * 32–38 bandindaydi. Baz bozuk oldugu icin TUM endeks seviyeleri kayiyordu.
 *
 * Kullanim: toplama sorgusunun where() zincirine `await blackoutFilter(dateCol, marketCol)`
 * ekle. Elle NOT (...) yazma — karantina araligi degistiginde tek yerden guncellensin.
 */

import { sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { hfMarketBlackouts } from "@/db/schema";
import { WAYBACK_SOURCE_SUFFIX } from "@/modules/etl/fetcher";

interface Blackout { marketId: number; from: string; to: string }

let _cache: Blackout[] | null = null;
let _at = 0;
const TTL_MS = 5 * 60 * 1000;

export function invalidateBlackoutCache(): void {
  _cache = null;
  _at = 0;
}

async function load(): Promise<Blackout[]> {
  const now = Date.now();
  if (_cache && now - _at < TTL_MS) return _cache;

  const rows = await db
    .select({
      marketId: hfMarketBlackouts.marketId,
      from:     hfMarketBlackouts.fromDate,
      to:       hfMarketBlackouts.toDate,
    })
    .from(hfMarketBlackouts);

  _cache = rows.map((r) => ({
    marketId: r.marketId,
    from: String(r.from).slice(0, 10),
    to:   String(r.to).slice(0, 10),
  }));
  _at = now;
  return _cache;
}

/**
 * Karantinali (hal x tarih) kombinasyonlarini disliyan SQL kosulu.
 * Karantina yoksa `undefined` doner — where() zincirinde zararsizca atlanir.
 */
export async function blackoutFilter(
  dateCol: SQL | unknown,
  marketCol: SQL | unknown,
  sourceCol?: SQL | unknown,
): Promise<SQL | undefined> {
  const list = await load();
  if (!list.length) return undefined;

  // Arsivden kurtarilan satirlar karantinadan MUAF: karantina uydurma veriyi gizlemek
  // icin var, gercek veriyi degil. Boylece Wayback backfill ilerledikce o gunler
  // kendiliginden gorunur hale gelir — blackout kaydini elle daraltmak gerekmez.
  const rescued = sourceCol
    ? sql` AND ${sourceCol} NOT LIKE ${"%" + WAYBACK_SOURCE_SUFFIX}`
    : sql``;

  const parts = list.map(
    (b) => sql`NOT (${marketCol} = ${b.marketId} AND ${dateCol} BETWEEN ${b.from} AND ${b.to}${rescued})`,
  );
  return sql.join(parts, sql` AND `);
}
