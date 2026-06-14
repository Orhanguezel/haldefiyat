import { lt } from "drizzle-orm";

import { db } from "@/db/client";
import { hfEtlRuns } from "@/db/schema";

export function etlRunRetentionCutoff(retentionDays: number, now = new Date()): Date {
  const days = Math.max(1, Math.floor(retentionDays));
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function cleanupOldEtlRuns(retentionDays: number): Promise<{ deleted: number; cutoff: Date }> {
  const cutoff = etlRunRetentionCutoff(retentionDays);
  const result = await db.delete(hfEtlRuns).where(lt(hfEtlRuns.createdAt, cutoff));
  return {
    deleted: Number(result[0]?.affectedRows ?? 0),
    cutoff,
  };
}
