import { pool } from "@/db/client";

// Audit tablolari ~67K satir/gun buyuyor. Retention penceresi disindaki satirlar budanir.
// created/ts kolonlari indexli oldugu icin partili DELETE hizli calisir.
const AUDIT_TABLES: ReadonlyArray<{ table: string; column: string }> = [
  { table: "audit_request_logs", column: "created_at" },
  { table: "audit_events", column: "ts" },
  { table: "audit_auth_events", column: "created_at" },
];

const BATCH = 20000;

export function auditRetentionCutoff(retentionDays: number, now = new Date()): Date {
  const days = Math.max(1, Math.floor(retentionDays));
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

// Buyuk tabloyu tek DELETE ile kilitlememek icin partili siler (en eski satirdan basar).
export async function cleanupOldAuditLogs(
  retentionDays: number,
): Promise<{ deleted: Record<string, number>; cutoff: Date }> {
  const cutoff = auditRetentionCutoff(retentionDays);
  const deleted: Record<string, number> = {};
  for (const { table, column } of AUDIT_TABLES) {
    let total = 0;
    for (;;) {
      const [res] = await pool.query(
        `DELETE FROM \`${table}\` WHERE \`${column}\` < ? ORDER BY \`${column}\` ASC LIMIT ${BATCH}`,
        [cutoff],
      );
      const n = Number((res as { affectedRows?: number }).affectedRows ?? 0);
      total += n;
      if (n < BATCH) break;
    }
    deleted[table] = total;
  }
  return { deleted, cutoff };
}
