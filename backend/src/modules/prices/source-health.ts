import { sourceInfoFor } from "@/config/source-urls";

export type PublicSourceHealthEvent = {
  id: number;
  sourceApi: string;
  sourceName: string;
  status: "ok" | "partial" | "error";
  runDate: string | null;
  occurredAt: string | null;
  rowsInserted: number;
  message: string;
};

function isoDate(raw: unknown): string | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const value = String(raw);
  return /^\d{4}-\d{2}-\d{2}/u.test(value) ? value.slice(0, 10) : null;
}

function isoDateTime(raw: unknown): string | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString();
  const date = new Date(String(raw));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function toPublicSourceHealthEvent(row: Record<string, unknown>): PublicSourceHealthEvent {
  const sourceApi = String(row.sourceApi ?? "");
  const rawStatus = String(row.status ?? "error");
  const status: PublicSourceHealthEvent["status"] = rawStatus === "ok" || rawStatus === "partial"
    ? rawStatus
    : "error";
  const rawRowsInserted = Number(row.rowsInserted ?? 0);
  const rowsInserted = Number.isFinite(rawRowsInserted) ? Math.max(0, rawRowsInserted) : 0;
  const sourceName = sourceInfoFor(sourceApi)?.name ?? "Resmî fiyat kaynağı";
  const message = status === "ok"
    ? `${rowsInserted.toLocaleString("tr-TR")} satır başarıyla işlendi.`
    : status === "partial"
      ? `Aktarım kısmen tamamlandı; ${rowsInserted.toLocaleString("tr-TR")} satır işlendi.`
      : "Aktarım tamamlanamadı; ekip tarafından yeniden denenecek.";

  return {
    id: Number(row.id ?? 0),
    sourceApi,
    sourceName,
    status,
    runDate: isoDate(row.runDate),
    occurredAt: isoDateTime(row.occurredAt),
    rowsInserted,
    message,
  };
}

