export const ADMIN_AUDIT_ALL_VALUE = '__all__';

export type AdminAuditTabKey = 'requests' | 'auth' | 'metrics' | 'map';
export type AdminAuditSortKey = 'created_at' | 'response_time_ms' | 'status_code';
export type AdminAuditBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export function parseAdminAuditStatusCode(value: string): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n < 100 || n > 599) return undefined;
  return Math.floor(n);
}

export function normalizeAdminAuditTab(value: string | null): AdminAuditTabKey {
  const s = String(value ?? '').toLowerCase();
  if (s === 'auth') return 'auth';
  if (s === 'metrics') return 'metrics';
  if (s === 'map') return 'map';
  return 'requests';
}

export function normalizeAdminAuditBoolLike(value: string | null): boolean {
  return value === '1' || value === 'true';
}

export function buildAdminAuditQueryString(next: Record<string, unknown>) {
  const sp = new URLSearchParams();

  Object.entries(next).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    sp.set(key, String(value));
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export function formatAdminAuditWhen(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

export function getAdminAuditStatusVariant(code: number): AdminAuditBadgeVariant {
  if (code >= 500) return 'destructive';
  if (code >= 400) return 'secondary';
  if (code >= 300) return 'outline';
  return 'default';
}

export function getAdminAuditAuthEventVariant(event: string): AdminAuditBadgeVariant {
  if (event === 'login_success') return 'default';
  if (event === 'login_failed') return 'destructive';
  if (event === 'logout') return 'secondary';
  return 'outline';
}

export function getAdminAuditGeoLabel(
  country: string | null | undefined,
  city: string | null | undefined,
): string {
  if (country === 'LOCAL') return 'Localhost';
  const parts: string[] = [];
  if (city) parts.push(city);
  if (country) parts.push(country);
  return parts.join(', ') || '';
}
