const DAY_MS = 86_400_000;

export function retailFreshnessLabel(recordedDate: string, now = new Date()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(recordedDate);
  if (!match) return "Tarih doğrulanamadı";
  const observed = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.max(0, Math.floor((today - observed) / DAY_MS));
  if (days === 0) return "Bugün güncellendi";
  if (days === 1) return "1 gün önce güncellendi";
  return `${days} gün önce güncellendi`;
}
