// ===================================================================
// FILE: src/integrations/shared/ga4.ts
// Google Analytics 4 admin API tipleri + sabitler
// ===================================================================

export const GA4_ADMIN_BASE = '/admin/ga4';

export const GA4_RANGES = ['LAST_7_DAYS', 'LAST_28_DAYS', 'LAST_3_MONTHS'] as const;
export type Ga4Range = (typeof GA4_RANGES)[number];

export const GA4_RANGE_LABELS: Record<Ga4Range, string> = {
  LAST_7_DAYS: 'Son 7 gün',
  LAST_28_DAYS: 'Son 28 gün',
  LAST_3_MONTHS: 'Son 3 ay',
};

export type Ga4Totals = { users: number; sessions: number; views: number; conversions: number };
export type Ga4DatePoint = { date: string; sessions: number; users: number };
export type Ga4Row = { label: string; value: number };
export type Ga4MetricRow = { label: string; value: number; extra?: string };
export type Ga4CountingMethod = 'ONCE_PER_EVENT' | 'ONCE_PER_SESSION';
export type Ga4KeyEvent = { id: string; name: string; counting: string; custom: boolean; defaultValue?: number; currencyCode?: string };
export type Ga4CreateKeyEventArgs = { event_name: string; counting_method?: Ga4CountingMethod; default_value?: number; currency_code?: string };
export type Ga4EngagementTotals = Ga4Totals & { engagementRate?: number; bounceRate?: number; averageSessionDuration?: number };

export type Ga4StatusResp = { connected: boolean; property: string };
export type Ga4OverviewResp = {
  property: string;
  range: Ga4Range;
  totals: Ga4Totals;
  byDate: Ga4DatePoint[];
  channels: Ga4Row[];
  pages: Ga4Row[];
  devices: Ga4Row[];
};
export type Ga4KeyEventsResp = { items: Ga4KeyEvent[] };
export type Ga4DeepReportResp = {
  property: string;
  range: Ga4Range;
  totals: Ga4EngagementTotals;
  previous: Ga4Totals;
  delta: Ga4EngagementTotals;
  acquisition: { sources: Ga4MetricRow[]; sourceMediums: Ga4MetricRow[]; channels: Ga4MetricRow[]; newReturning: Ga4MetricRow[] };
  geo: Ga4MetricRow[];
  engagement: Ga4EngagementTotals & { engagedSessions: number; userEngagementDuration: number };
  events: Ga4MetricRow[];
  ecommerce: { totals: { revenue: number; transactions: number }; items: Ga4MetricRow[] };
};
export type Ga4RealtimeResp = { property: string; activeUsers: number; screens: Ga4MetricRow[]; countries: Ga4MetricRow[] };
export type Ga4DataStream = { id: string; name: string; displayName: string; type: string; measurementId: string; enhancedMeasurement: string };
export type Ga4CustomDimension = { id: string; parameterName: string; displayName: string; scope: string; description: string };
export type Ga4Audience = { id: string; displayName: string; description: string };
export type Ga4GoogleAdsLink = { id: string; customerId: string; canManageClients: boolean; adsPersonalizationEnabled: boolean };
export type Ga4ConfigResp = { property: string; dataStreams: Ga4DataStream[]; customDimensions: Ga4CustomDimension[]; audiences: Ga4Audience[]; googleAdsLinks: Ga4GoogleAdsLink[] };

export function formatGa4Number(v: number): string {
  return v.toLocaleString('tr-TR');
}

export function formatGa4Percent(v: number): string {
  return `%${(v * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
}

export function formatGa4Duration(seconds: number): string {
  if (!seconds) return '0 sn';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return mins > 0 ? `${mins} dk ${secs} sn` : `${secs} sn`;
}

/** "20260612" → "12 Haz" */
export function formatGa4Date(d: string): string {
  if (d.length !== 8) return d;
  const month = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${Number(d.slice(6, 8))} ${month[Number(d.slice(4, 6)) - 1] ?? ''}`;
}

export const GA4_COUNTING_LABELS: Record<string, string> = {
  ONCE_PER_EVENT: 'Olay başına 1',
  ONCE_PER_SESSION: 'Oturum başına 1',
};
