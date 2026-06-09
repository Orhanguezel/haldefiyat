function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  return Math.max(0, Math.floor((todayUtc - date.getTime()) / 86_400_000));
}

function formatDateTr(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export default function FreshnessBadge({ recordedDate }: { recordedDate?: string | null }) {
  const days = daysSince(recordedDate);
  if (days == null || !recordedDate) return null;

  const tone = days > 45
    ? "border-red-400/30 bg-red-400/10 text-red-100"
    : days > 14
    ? "border-red-400/30 bg-red-400/10 text-red-100"
    : days > 7
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  const label = days > 45
    ? "Geçen sezon verisi"
    : days === 0
    ? "Bugün güncellendi"
    : days === 1
      ? "Son güncelleme dün"
      : `Son güncelleme ${days} gün önce`;
  const suffix = days > 0 ? `; en son ${formatDateTr(recordedDate)} tarihli veri gösteriliyor` : "";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
      {label}{suffix}
    </span>
  );
}
