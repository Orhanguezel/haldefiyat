import { formatDateTr } from "@/lib/date-format";

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  return Math.max(0, Math.floor((todayUtc - date.getTime()) / 86_400_000));
}

export default function FreshnessBadge({ recordedDate }: { recordedDate?: string | null }) {
  const days = daysSince(recordedDate);
  if (days == null || !recordedDate) return null;

  const tone = days > 45
    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    : days > 14
    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
    : days > 7
      ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
      : "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
  const label = days > 45
    ? "Geçen sezon verisi"
    : days === 0
    ? "Bugün güncellendi"
    : days === 1
      ? "Son güncelleme dün"
      : `Son güncelleme ${days} gün önce`;
  const formatted = formatDateTr(recordedDate);
  const suffix = days > 0 && formatted ? `; en son ${formatted} tarihli veri gösteriliyor` : "";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {label}{suffix}
    </span>
  );
}
