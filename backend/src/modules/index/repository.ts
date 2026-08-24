import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { hfIndexSnapshots } from "@/db/schema";
import { normalizeMysqlDate } from "@/modules/prices/blackout-date";

export type IndexSnapshotRow = {
  indexWeek:     string;
  indexValue:    string;
  baseWeek:      string;
  basketAvg:     string;
  productsCount: number;
  weekStart:     Date | string;
  weekEnd:       Date | string;
  createdAt:     Date | null;
};

// Drizzle `date()` kolonu Date nesnesi dondurur; String(date) yerel bicim verir
// ("Mon Aug 17 2026...") ve ilk 10 karakter ISO tarih DEGILDIR. Rapor tarafinda
// bu sessizce bos donem etiketi ("2026-30 ()") uretiyordu.
function normalizeRow(row: IndexSnapshotRow): IndexSnapshotRow {
  return {
    ...row,
    weekStart: normalizeMysqlDate(row.weekStart),
    weekEnd:   normalizeMysqlDate(row.weekEnd),
  };
}

export async function repoGetLatestSnapshot(): Promise<IndexSnapshotRow | null> {
  const [row] = await db
    .select()
    .from(hfIndexSnapshots)
    .orderBy(desc(hfIndexSnapshots.indexWeek))
    .limit(1);
  return row ? normalizeRow(row as IndexSnapshotRow) : null;
}

export async function repoGetSnapshotHistory(weeks = 26): Promise<IndexSnapshotRow[]> {
  const rows = await db
    .select()
    .from(hfIndexSnapshots)
    .orderBy(desc(hfIndexSnapshots.indexWeek))
    .limit(Math.min(weeks, 104));
  return (rows as IndexSnapshotRow[]).map(normalizeRow).reverse();
}
