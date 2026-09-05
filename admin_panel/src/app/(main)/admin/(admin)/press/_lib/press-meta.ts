import { BASE_URL } from '@/integrations/api-base';
import type { PressContact, PressContactStatus, PressLogStatus, PressPublicationType } from '@/integrations/endpoints/admin/press-admin-endpoints';

export const ALL = 'all';
export const CONTACT_STATUSES: PressContactStatus[] = ['target', 'contacted', 'replied', 'published', 'blocked'];
export const PUBLICATION_TYPES: PressPublicationType[] = ['newspaper', 'website', 'association', 'chamber', 'agency', 'other'];
export const LOG_STATUSES: PressLogStatus[] = ['planned', 'sent', 'replied', 'published', 'bounced', 'rejected'];

// Marka koddan gelmez: site adresi/adi env'den, yoksa API tabanindan / bos.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? BASE_URL.replace(/\/api\/v1\/?$/, '')).replace(/\/$/, '');
export const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME ?? '').trim();

export type Filters = { q: string; status: string; type: string; hasPhone: string };
export const EMPTY_FILTERS: Filters = { q: '', status: ALL, type: ALL, hasPhone: ALL };

export const STATUS_VARIANT: Record<PressContactStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  published: 'default', replied: 'secondary', contacted: 'outline', target: 'outline', blocked: 'destructive',
};

export function splitTags(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
export function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function htmlToPlainText(value: string) {
  return value.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n').trim();
}
export function renderTemplateText(value: string, vars: Record<string, string>) {
  return value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => vars[key] ?? '');
}
export function mailto(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function applyFilters(rows: PressContact[], f: Filters) {
  const q = f.q.trim().toLocaleLowerCase('tr');
  return rows.filter((c) => {
    if (q && !`${c.organization} ${c.contactName ?? ''} ${c.email} ${c.city ?? ''} ${c.tags.join(' ')}`.toLocaleLowerCase('tr').includes(q)) return false;
    if (f.status !== ALL && c.status !== f.status) return false;
    if (f.type !== ALL && c.publicationType !== f.type) return false;
    if (f.hasPhone === 'yes' && !c.phone) return false;
    return true;
  });
}

export function summarize(rows: PressContact[]) {
  const c = (fn: (r: PressContact) => boolean) => rows.filter(fn).length;
  return {
    loaded: rows.length,
    target: c((r) => r.status === 'target'),
    contacted: c((r) => r.status === 'contacted'),
    replied: c((r) => r.status === 'replied'),
    published: c((r) => r.status === 'published'),
    blocked: c((r) => r.status === 'blocked'),
  };
}
