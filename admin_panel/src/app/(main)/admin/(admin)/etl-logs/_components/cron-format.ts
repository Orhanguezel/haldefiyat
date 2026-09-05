import type { TranslateFn } from '@/i18n';

function pad(n: string): string {
  return n.padStart(2, '0');
}

/** UTC saatini TRT'ye (UTC+3) cevir — cron env UTC calisir. */
function toTrt(hour: number, minute: number): string {
  const h = (hour + 3) % 24;
  return `${pad(String(h))}:${pad(String(minute))}`;
}

/** 5 alanli cron ifadesini okunur ozete cevirir (UTC->TRT). Tanimadigini ham gosterir. */
export function cronToHuman(expr: string, t: TranslateFn): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;
  const [min, hour, dom, mon, dow] = parts;
  if (min.startsWith('*/') && hour === '*' && dom === '*' && dow === '*') return t('cron.everyMinutes', { count: min.slice(2) });
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && mon === '*' && dow === '*') return t('cron.daily', { time: toTrt(Number(hour), Number(min)) });
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && dom === '*' && /^\d+$/.test(dow)) return t('cron.weekly', { day: t(`cron.days.${Number(dow) % 7}`), time: toTrt(Number(hour), Number(min)) });
  if (/^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && mon === '*' && dow === '*') return t('cron.monthly', { day: dom, time: toTrt(Number(hour), Number(min)) });
  if (hour.startsWith('*/')) return t('cron.everyHours', { count: hour.slice(2) });
  return expr;
}

export const CRON_CATEGORY_ORDER = ['etl', 'seo', 'icerik', 'bildirim', 'sosyal', 'reklam', 'bakim'];
