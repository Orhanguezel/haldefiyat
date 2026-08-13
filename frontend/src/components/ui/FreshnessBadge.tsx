import { formatDateTr } from "@/lib/date-format";
import { CheckCircle2, Clock3, History } from "lucide-react";
import { Badge } from "./Badge";

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

  const tone = days > 14 ? "danger" : days > 7 ? "warning" : "success";
  const label = days > 45
    ? "Geçen sezon verisi"
    : days === 0
    ? "Bugün güncellendi"
    : days === 1
      ? "Son güncelleme dün"
      : `Son güncelleme ${days} gün önce`;
  const formatted = formatDateTr(recordedDate);
  const suffix = days > 0 && formatted ? `; en son ${formatted} tarihli veri gösteriliyor` : "";
  const icon = days > 45
    ? <History className="h-3.5 w-3.5" aria-hidden="true" />
    : days > 7
      ? <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
      : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />;

  return (
    <Badge color={tone} icon={icon} className="text-[11px]">
      {label}{suffix}
    </Badge>
  );
}
