import type { FirmLeadItem } from '@/integrations/endpoints/firms-admin-endpoints';

export const ALL = 'all';
export const PAGE_SIZE = 200;
export const DEAL_STATUSES = ['lead', 'contacted', 'negotiating', 'won', 'lost'] as const;
export const DEAL_TYPES = ['reklam', 'sponsorluk', 'premium', 'diger'] as const;

export type ParsedLead = { name?: string; phone?: string; email?: string; channel?: string; consent?: string; message?: string };
export type LeadRow = FirmLeadItem & { parsed: ParsedLead; ageDays: number | null };
export type Filters = { q: string; status: string; dealType: string; contact: string };
export const EMPTY_FILTERS: Filters = { q: '', status: ALL, dealType: ALL, contact: ALL };

/** "Public lead: Ad | Telefon: X | ... | Mesaj: Z" serbest metnini alanlara ayirir.
 *  `Mesaj:` satirindan SONRASI tumuyle mesajdir (cok satirli mesajlar dusmesin). */
export function parseLead(notes: string | null): ParsedLead {
  const out: ParsedLead = {};
  const lines = (notes ?? '').split('\n');
  let messageFrom = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^([^:]+):\s*(.*)$/.exec(lines[i]!.trim());
    if (!m) continue;
    const key = m[1]!.trim().toLowerCase();
    const value = m[2]!.trim();
    if (key.startsWith('public lead')) out.name = value;
    else if (key.startsWith('telefon')) out.phone = value;
    else if (key.startsWith('e-posta')) out.email = value;
    else if (key.startsWith('tercih')) out.channel = value;
    else if (key.startsWith('gizlilik')) out.consent = value;
    else if (key.startsWith('mesaj')) { messageFrom = i; out.message = value; break; }
  }
  if (messageFrom >= 0) {
    out.message = [out.message ?? '', ...lines.slice(messageFrom + 1)].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  return out;
}

export function telHref(phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `tel:${digits}` : null;
}

export function waHref(phone?: string) {
  let d = (phone ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = `90${d.slice(1)}`;
  else if (!d.startsWith('90')) d = `90${d}`;
  return `https://wa.me/${d}`;
}

function ageDays(value: string | null) {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

export function enrich(items: FirmLeadItem[]): LeadRow[] {
  return items.map((item) => ({ ...item, parsed: parseLead(item.notes), ageDays: ageDays(item.createdAt) }));
}

export function applyFilters(rows: LeadRow[], f: Filters) {
  const q = f.q.trim().toLocaleLowerCase('tr');
  return rows.filter((r) => {
    if (q && !`${r.parsed.name ?? ''} ${r.parsed.phone ?? ''} ${r.parsed.email ?? ''} ${r.parsed.message ?? ''} ${r.firmName} ${r.citySlug ?? ''}`.toLocaleLowerCase('tr').includes(q)) return false;
    if (f.status !== ALL && r.status !== f.status) return false;
    if (f.dealType !== ALL && r.dealType !== f.dealType) return false;
    if (f.contact === 'phone' && !r.parsed.phone) return false;
    if (f.contact === 'email' && !r.parsed.email) return false;
    if (f.contact === 'none' && (r.parsed.phone || r.parsed.email)) return false;
    return true;
  });
}

export function summarize(rows: LeadRow[]) {
  const c = (fn: (r: LeadRow) => boolean) => rows.filter(fn).length;
  return {
    loaded: rows.length,
    today: c((r) => r.ageDays === 0),
    week: c((r) => r.ageDays != null && r.ageDays <= 7),
    open: c((r) => r.status === 'lead'),
    phone: c((r) => Boolean(r.parsed.phone)),
    email: c((r) => Boolean(r.parsed.email)),
  };
}

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
