import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { hfIndexSnapshots } from "@/db/schema";

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

function normalizeRow(row: IndexSnapshotRow): IndexSnapshotRow {
  return {
    ...row,
    weekStart: String(row.weekStart).slice(0, 10),
    weekEnd:   String(row.weekEnd).slice(0, 10),
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
