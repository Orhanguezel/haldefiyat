export function money(value: string | number | null | undefined) {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

export function shortDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dayDiff(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`).getTime();
  if (Number.isNaN(date)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - date) / 86400000);
}

export function ageLabel(value?: string | null) {
  const days = dayDiff(value);
  if (days == null) return '';
  if (days <= 0) return 'bugün';
  if (days === 1) return 'dün';
  return `${days} gün önce`;
}

export function percentDiff(a: string | number | null, b: string | number | null) {
  const left = Number(a);
  const right = Number(b);
  if (!Number.isFinite(left) || !Number.isFinite(right) || right === 0) return null;
  return ((left - right) / right) * 100;
}

export const MARKET_TYPE_LABEL: Record<string, string> = {
  hal: 'Hal', borsa: 'Borsa', resmi: 'Resmî', kooperatif: 'Kooperatif',
};

export const AVG_METHOD_LABEL: Record<string, string> = {
  reported: 'kaynaktan geldi',
  midpoint: 'min-maks ortası',
  single: 'tek fiyat',
  unknown: 'bilinmiyor',
};
