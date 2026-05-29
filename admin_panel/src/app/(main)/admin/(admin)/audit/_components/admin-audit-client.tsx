'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/audit/_components/admin-audit-client.tsx
// Admin Audit (Requests / Auth Events / Daily Metrics / Map)
// - i18n: useAdminT() ile tüm statikler dil kontrollü
// - Tabs: requests | auth | metrics | map
// - URL state: filters + pagination
// =============================================================

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity,
  ShieldCheck,
  UserCheck,
  RefreshCcw,
  Search,
  Filter,
  Loader2,
  Globe,
  Trash2,
  BarChart3,
  KeyRound,
  MousePointerClick,
  Smartphone,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AuditDailyChart } from './audit-daily-chart';
import { AuditGeoMap } from './audit-geo-map';
import { AuditTurkeyMap } from './audit-turkey-map';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

import type {
  AuditAuthEvent,
  AuditAuthEventDto,
  AuditRequestLogDto,
  AuditListResponse,
  AuditGeoStatsResponseDto,
} from '@/integrations/shared';
import {
  ADMIN_AUDIT_ALL_VALUE,
  AUDIT_AUTH_EVENTS,
  buildAdminAuditQueryString,
  formatAdminAuditWhen,
  getErrorMessage,
  getAdminAuditAuthEventVariant,
  getAdminAuditGeoLabel,
  getAdminAuditStatusVariant,
  normalizeAdminAuditBoolLike,
  normalizeAdminAuditTab,
  parseAdminAuditStatusCode,
  safeText,
  toNonNegativeInt,
  truncateNullable,
  type AdminAuditSortKey,
} from '@/integrations/shared';
import {
  useListAuditRequestLogsAdminQuery,
  useListAuditAuthEventsAdminQuery,
  useGetAuditGeoStatsAdminQuery,
  useClearAuditLogsAdminMutation,
  useGetAnalyticsOverviewAdminQuery,
  useGetAnalyticsAdsAttributionAdminQuery,
  useGetAnalyticsAdsDailyAdminQuery,
  useGetAnalyticsDeviceDailyAdminQuery,
  useGetAnalyticsFunnelAdminQuery,
  useGetAnalyticsHeatmapAdminQuery,
  useGetAnalyticsRetentionAdminQuery,
  useAdminGetApiKeyDailyUsageQuery,
  useAdminListApiKeysQuery,
  useAdminRevokeApiKeyMutation,
  useAdminSetApiKeyTierMutation,
  useGetAuditDataPullersAdminQuery,
  useGetAuditGeoCitiesAdminQuery,
  useGetAuditWidgetEmbeddersAdminQuery,
} from '@/integrations/hooks';
import {
  API_KEY_TIERS,
  formatApiKeyDate,
  formatApiKeyUsage,
  type AdminApiKeyDailyUsageDto,
  type AdminApiKeyDto,
  type ApiKeyTier,
} from '@/integrations/shared';
import type { AnalyticsRange } from '@/integrations/endpoints/analytics-admin-endpoints';
import type { AuditGeoTrafficKind } from '@/integrations/endpoints/admin/audit-consumers-admin-endpoints';

function fmtNumber(value: number | undefined): string {
  return new Intl.NumberFormat('tr-TR').format(value ?? 0);
}

function fmtPct(value: number | undefined): string {
  return `${(value ?? 0).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`;
}

function deviceLabel(value: string): string {
  if (value === 'mobile') return 'Mobil';
  if (value === 'tablet') return 'Tablet';
  return 'Masaüstü';
}

function apiKeyUsagePct(key: AdminApiKeyDto): number {
  if (key.dailyLimit <= 0) return 0;
  return Math.min(100, Math.round((key.usedToday / key.dailyLimit) * 100));
}

function locationLabel(country?: string | null, city?: string | null): string {
  return [city, country].filter(Boolean).join(', ') || '-';
}

function isBotUserAgent(value?: string | null): boolean {
  return /bot|crawl|spider|python|curl|wget|http|axios|go-http/i.test(value ?? '');
}

function refererHost(value?: string | null): string {
  if (!value) return '-';
  try {
    return new URL(value).host || value;
  } catch {
    return value;
  }
}

function isInternalReferer(value?: string | null): boolean {
  return /(^|\.)haldefiyat\.com$/i.test(refererHost(value));
}

const REQUEST_PATH_PRESETS = [
  { label: 'Widget', q: '/api/v1/prices/widget' },
  { label: 'Fiyat API', q: '/api/v1/prices' },
  { label: 'Export', q: '/api/v1/prices/export' },
  { label: 'Ads', q: 'gclid=' },
] as const;

/* ----------------------------- component ----------------------------- */

export default function AdminAuditClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.audit');

  // Tab = client-side state (URL'den türetilir ama tıklamada anında değişir).
  // Eskiden doğrudan sp.get('tab')'dan okunuyordu; her tab tıklaması router.push
  // → RSC round-trip → "takılma" yapıyordu. Artık tab anlık, URL history ile senkron.
  const urlTab = normalizeAdminAuditTab(sp.get('tab'));
  const [tab, setTab] = React.useState(urlTab);
  React.useEffect(() => {
    setTab(urlTab);
  }, [urlTab]);

  const q = sp.get('q') ?? '';
  const method = sp.get('method') ?? '';
  const status = sp.get('status') ?? '';
  const from = sp.get('from') ?? '';
  const to = sp.get('to') ?? '';
  const onlyAdmin = normalizeAdminAuditBoolLike(sp.get('only_admin'));

  const reqUserId = sp.get('req_user_id') ?? '';
  const reqIp = sp.get('req_ip') ?? '';
  const sort = (sp.get('sort') ?? 'created_at') as AdminAuditSortKey;
  const orderDir = (sp.get('orderDir') ?? 'desc') as 'asc' | 'desc';

  const event = sp.get('event') ?? '';
  const email = sp.get('email') ?? '';
  const user_id = sp.get('user_id') ?? '';
  const ip = sp.get('ip') ?? '';

  const days = String(toNonNegativeInt(sp.get('days'), 14) || 14);
  const range = (sp.get('range') === '30d' ? '30d' : '7d') as AnalyticsRange;
  const geoTraffic = (['human', 'bot'].includes(sp.get('traffic') ?? '') ? sp.get('traffic') : 'all') as AuditGeoTrafficKind;

  const limit = toNonNegativeInt(sp.get('limit'), 50) || 50;
  const offset = toNonNegativeInt(sp.get('offset'), 0);

  // NOT: useMemo factory'leri (authParams) render sirasinda calisir; bu sabit
  // onlardan ONCE tanimlanmali, aksi halde TDZ -> "Cannot access 'ALL' before
  // initialization" ile tum sayfa cokar (tablar gezilemez).
  const ALL = ADMIN_AUDIT_ALL_VALUE;

  // local state for request filters
  const [qText, setQText] = React.useState(q);
  const [methodText, setMethodText] = React.useState(method);
  const [statusText, setStatusText] = React.useState(status);
  const [fromText, setFromText] = React.useState(from);
  const [toText, setToText] = React.useState(to);
  const [onlyAdminFlag, setOnlyAdminFlag] = React.useState(onlyAdmin);
  const [reqUserIdText, setReqUserIdText] = React.useState(reqUserId);
  const [reqIpText, setReqIpText] = React.useState(reqIp);
  const [sortText, setSortText] = React.useState<AdminAuditSortKey>(sort);
  const [orderDirText, setOrderDirText] = React.useState<'asc' | 'desc'>(orderDir);

  // local state for auth filters
  const [eventText, setEventText] = React.useState(event);
  const [emailText, setEmailText] = React.useState(email);
  const [userIdText, setUserIdText] = React.useState(user_id);
  const [ipText, setIpText] = React.useState(ip);

  React.useEffect(() => setQText(q), [q]);
  React.useEffect(() => setMethodText(method), [method]);
  React.useEffect(() => setStatusText(status), [status]);
  React.useEffect(() => setFromText(from), [from]);
  React.useEffect(() => setToText(to), [to]);
  React.useEffect(() => setOnlyAdminFlag(onlyAdmin), [onlyAdmin]);
  React.useEffect(() => setReqUserIdText(reqUserId), [reqUserId]);
  React.useEffect(() => setReqIpText(reqIp), [reqIp]);
  React.useEffect(() => setSortText(sort), [sort]);
  React.useEffect(() => setOrderDirText(orderDir), [orderDir]);

  React.useEffect(() => setEventText(event), [event]);
  React.useEffect(() => setEmailText(email), [email]);
  React.useEffect(() => setUserIdText(user_id), [user_id]);
  React.useEffect(() => setIpText(ip), [ip]);

  function buildAuditUrl(next: Partial<Record<string, any>>) {
    const merged = {
      tab,
      q,
      method,
      status,
      from,
      to,
      only_admin: onlyAdmin ? '1' : '',
      req_user_id: reqUserId,
      req_ip: reqIp,
      sort,
      orderDir,
      event,
      email,
      user_id,
      ip,
      days,
      range,
      traffic: geoTraffic,
      limit,
      offset,
      ...next,
    };

    if (next.offset == null) merged.offset = 0;

    const qs = buildAdminAuditQueryString({
      tab: merged.tab,
      q: merged.q || undefined,
      method: merged.method || undefined,
      status: merged.status || undefined,
      from: merged.from || undefined,
      to: merged.to || undefined,
      only_admin: merged.only_admin || undefined,
      req_user_id: merged.req_user_id || undefined,
      req_ip: merged.req_ip || undefined,
      sort: merged.sort !== 'created_at' ? merged.sort : undefined,
      orderDir: merged.orderDir !== 'desc' ? merged.orderDir : undefined,
      event: merged.event && merged.event !== ALL ? merged.event : undefined,
      email: merged.email || undefined,
      user_id: merged.user_id || undefined,
      ip: merged.ip || undefined,
      days: merged.days || undefined,
      range: merged.range || undefined,
      traffic: merged.traffic !== 'all' ? merged.traffic : undefined,
      limit: merged.limit || undefined,
      offset: merged.offset || undefined,
    });

    return `/admin/audit${qs}`;
  }

  function apply(next: Partial<Record<string, any>>) {
    router.push(buildAuditUrl(next));
  }

  // Tab geçişi anlık (client-side); RSC navigasyonu yapmaz. URL'yi history ile
  // senkron tutar → paylaşılabilir link + tarayıcı geri/ileri çalışır, takılma yok.
  function onTabChange(next: string) {
    const nextTab = normalizeAdminAuditTab(next);
    setTab(nextTab);
    window.history.replaceState(
      window.history.state,
      '',
      buildAuditUrl({ tab: nextTab, offset: 0 }),
    );
  }

  function onSubmitRequests(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'requests',
      q: qText.trim(),
      method: methodText.trim().toUpperCase(),
      status: statusText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      only_admin: onlyAdminFlag ? '1' : '',
      req_user_id: reqUserIdText.trim(),
      req_ip: reqIpText.trim(),
      sort: sortText,
      orderDir: orderDirText,
      offset: 0,
    });
  }

  function onResetRequests() {
    setQText('');
    setMethodText('');
    setStatusText('');
    setFromText('');
    setToText('');
    setOnlyAdminFlag(false);
    setReqUserIdText('');
    setReqIpText('');
    setSortText('created_at');
    setOrderDirText('desc');
    apply({
      tab: 'requests',
      q: '',
      method: '',
      status: '',
      from: '',
      to: '',
      only_admin: '',
      req_user_id: '',
      req_ip: '',
      sort: 'created_at',
      orderDir: 'desc',
      offset: 0,
    });
  }

  function onSubmitAuth(e: React.FormEvent) {
    e.preventDefault();
    apply({
      tab: 'auth',
      event: eventText,
      email: emailText.trim(),
      user_id: userIdText.trim(),
      ip: ipText.trim(),
      from: fromText.trim(),
      to: toText.trim(),
      offset: 0,
    });
  }

  function onResetAuth() {
    setEventText('');
    setEmailText('');
    setUserIdText('');
    setIpText('');
    setFromText('');
    setToText('');
    apply({
      tab: 'auth',
      event: '',
      email: '',
      user_id: '',
      ip: '',
      from: '',
      to: '',
      offset: 0,
    });
  }

  /* ----------------------------- queries ----------------------------- */

  const reqParams = React.useMemo(() => {
    const code = parseAdminAuditStatusCode(status);
    return {
      q: q || undefined,
      method: method || undefined,
      status_code: code,
      user_id: reqUserId || undefined,
      ip: reqIp || undefined,
      only_admin: onlyAdmin ? 1 : undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: sort as 'created_at' | 'response_time_ms' | 'status_code',
      orderDir: orderDir as 'asc' | 'desc',
      limit,
      offset,
    };
  }, [q, method, status, reqUserId, reqIp, onlyAdmin, from, to, sort, orderDir, limit, offset]);

  const authParams = React.useMemo(() => {
    const ev = event && event !== ALL ? event : undefined;
    return {
      event: ev as AuditAuthEvent | undefined,
      email: email || undefined,
      user_id: user_id || undefined,
      ip: ip || undefined,
      created_from: from || undefined,
      created_to: to || undefined,
      sort: 'created_at' as const,
      orderDir: 'desc' as const,
      limit,
      offset,
    };
  }, [event, email, user_id, ip, from, to, limit, offset]);

  const reqQ = useListAuditRequestLogsAdminQuery(
    tab === 'requests' ? (reqParams as any) : (undefined as any),
    { skip: tab !== 'requests', refetchOnFocus: true } as any,
  ) as any;

  const authQ = useListAuditAuthEventsAdminQuery(
    tab === 'auth' ? (authParams as any) : (undefined as any),
    { skip: tab !== 'auth', refetchOnFocus: true } as any,
  ) as any;

  const geoParams = React.useMemo(() => {
    const d = toNonNegativeInt(days, 30) || 30;
    return {
      days: d,
      only_admin: onlyAdmin ? 1 : undefined,
      source: 'requests' as const,
    };
  }, [days, onlyAdmin]);

  const geoQ = useGetAuditGeoStatsAdminQuery(
    tab === 'map' ? (geoParams as any) : (undefined as any),
    { skip: tab !== 'map', refetchOnFocus: true } as any,
  ) as any;

  const geoCitiesQ = useGetAuditGeoCitiesAdminQuery(
    tab === 'map' ? { days: geoParams.days, traffic: geoTraffic } : undefined,
    { skip: tab !== 'map', refetchOnFocus: true } as any,
  ) as any;

  const analyticsOverviewQ = useGetAnalyticsOverviewAdminQuery(
    ['general', 'daily', 'device'].includes(tab) ? { range } : undefined,
    { skip: !['general', 'daily', 'device'].includes(tab), refetchOnFocus: true } as any,
  ) as any;

  const retentionQ = useGetAnalyticsRetentionAdminQuery(
    tab === 'general' ? { range } : undefined,
    { skip: tab !== 'general', refetchOnFocus: true } as any,
  ) as any;

  const adsQ = useGetAnalyticsAdsAttributionAdminQuery(
    tab === 'ads' ? { range } : undefined,
    { skip: tab !== 'ads', refetchOnFocus: true } as any,
  ) as any;

  const adsDailyQ = useGetAnalyticsAdsDailyAdminQuery(
    tab === 'ads' ? { range } : undefined,
    { skip: tab !== 'ads', refetchOnFocus: true } as any,
  ) as any;

  const funnelQ = useGetAnalyticsFunnelAdminQuery(
    tab === 'ads' ? { range } : undefined,
    { skip: tab !== 'ads', refetchOnFocus: true } as any,
  ) as any;

  const deviceDailyQ = useGetAnalyticsDeviceDailyAdminQuery(
    tab === 'device' ? { range } : undefined,
    { skip: tab !== 'device', refetchOnFocus: true } as any,
  ) as any;

  const heatmapQ = useGetAnalyticsHeatmapAdminQuery(
    tab === 'device' ? { range } : undefined,
    { skip: tab !== 'device', refetchOnFocus: true } as any,
  ) as any;

  const apiKeysQ = useAdminListApiKeysQuery(undefined, {
    skip: tab !== 'consumers',
    refetchOnFocus: true,
  } as any) as any;
  const apiKeyDailyUsageQ = useAdminGetApiKeyDailyUsageQuery(
    tab === 'consumers' ? { days: range === '30d' ? 30 : 14 } : undefined,
    { skip: tab !== 'consumers', refetchOnFocus: true } as any,
  ) as any;
  const widgetEmbeddersQ = useGetAuditWidgetEmbeddersAdminQuery(
    tab === 'consumers' ? { days: range === '30d' ? 30 : 7 } : undefined,
    { skip: tab !== 'consumers', refetchOnFocus: true } as any,
  ) as any;
  const dataPullersQ = useGetAuditDataPullersAdminQuery(
    tab === 'consumers' ? { days: range === '30d' ? 30 : 7, min_hits: 500 } : undefined,
    { skip: tab !== 'consumers', refetchOnFocus: true } as any,
  ) as any;
  const [setApiKeyTier, apiKeyTierState] = useAdminSetApiKeyTierMutation();
  const [revokeApiKey, revokeApiKeyState] = useAdminRevokeApiKeyMutation();

  const reqData = (reqQ.data as AuditListResponse<AuditRequestLogDto> | undefined) ?? {
    items: [],
    total: 0,
  };
  const authData = (authQ.data as AuditListResponse<AuditAuthEventDto> | undefined) ?? {
    items: [],
    total: 0,
  };
  const geoData = (geoQ.data as AuditGeoStatsResponseDto | undefined) ?? { items: [] };
  const geoCitiesData = geoCitiesQ.data?.items ?? [];
  // LOCAL = localhost/sunucu-içi trafik (SSR fetch, health check, ETL) — gerçek
  // ziyaretçi değil, analizden çıkarılır. Boş ülke de gösterilmez.
  const geoItemsVisible = (geoData.items ?? []).filter(
    (i: any) => i.country && i.country !== 'LOCAL',
  );
  const geoCitiesVisible = geoCitiesData.filter(
    (r: any) => r.country && r.country !== 'LOCAL',
  );
  const geoCitiesTR = geoCitiesData.filter((r: any) => r.country === 'TR');
  const overviewData = analyticsOverviewQ.data;
  const adsData = adsQ.data;
  const adsDailyData = adsDailyQ.data;
  const funnelData = funnelQ.data;
  const retentionData = retentionQ.data;
  const deviceDailyData = deviceDailyQ.data;
  const heatmapData = heatmapQ.data;
  const apiKeysData = apiKeysQ.data?.items ?? [];
  const apiKeyDailyUsageData = apiKeyDailyUsageQ.data?.items ?? [];
  const widgetEmbeddersData = widgetEmbeddersQ.data?.items ?? [];
  const dataPullersData = dataPullersQ.data?.items ?? [];

  const reqLoading = reqQ.isLoading || reqQ.isFetching;
  const authLoading = authQ.isLoading || authQ.isFetching;
  const geoLoading = geoQ.isLoading || geoQ.isFetching || geoCitiesQ.isLoading || geoCitiesQ.isFetching;
  const overviewLoading = analyticsOverviewQ.isLoading || analyticsOverviewQ.isFetching || retentionQ.isLoading || retentionQ.isFetching;
  const adsLoading = adsQ.isLoading || adsQ.isFetching || adsDailyQ.isLoading || adsDailyQ.isFetching || funnelQ.isLoading || funnelQ.isFetching;
  const deviceLoading = analyticsOverviewQ.isLoading || analyticsOverviewQ.isFetching || deviceDailyQ.isLoading || deviceDailyQ.isFetching || heatmapQ.isLoading || heatmapQ.isFetching;
  const consumersLoading = apiKeysQ.isLoading || apiKeysQ.isFetching || apiKeyDailyUsageQ.isLoading || apiKeyDailyUsageQ.isFetching || widgetEmbeddersQ.isLoading || widgetEmbeddersQ.isFetching || dataPullersQ.isLoading || dataPullersQ.isFetching || apiKeyTierState.isLoading || revokeApiKeyState.isLoading;

  const reqTotal = reqData.total ?? 0;
  const authTotal = authData.total ?? 0;

  const canPrev = offset > 0;
  const canNextReq = offset + limit < reqTotal;
  const canNextAuth = offset + limit < authTotal;

  const [clearAuditLogs, { isLoading: isClearing }] = useClearAuditLogsAdminMutation();

  async function onRefresh() {
    try {
      if (tab === 'general') {
        await analyticsOverviewQ.refetch();
        await retentionQ.refetch();
      }
      if (tab === 'requests') await reqQ.refetch();
      if (tab === 'auth') await authQ.refetch();
      if (tab === 'daily') await analyticsOverviewQ.refetch();
      if (tab === 'ads') {
        await adsQ.refetch();
        await adsDailyQ.refetch();
        await funnelQ.refetch();
      }
      if (tab === 'device') {
        await analyticsOverviewQ.refetch();
        await deviceDailyQ.refetch();
        await heatmapQ.refetch();
      }
      if (tab === 'map') {
        await geoQ.refetch();
        await geoCitiesQ.refetch();
      }
      if (tab === 'consumers') {
        await apiKeysQ.refetch();
        await apiKeyDailyUsageQ.refetch();
        await widgetEmbeddersQ.refetch();
        await dataPullersQ.refetch();
      }
      toast.success(t('refreshed'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('error')));
    }
  }

  async function onClearLogs() {
    if (!window.confirm(t('clear.dialogDescription'))) return;
    const target = tab === 'requests' ? 'requests' : tab === 'auth' ? 'auth' : 'all';
    try {
      const data = await clearAuditLogs({ target }).unwrap();
      const total = (data.deletedRequests ?? 0) + (data.deletedAuth ?? 0);
      toast.success(t('clear.success', { count: String(total) }));
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('error'));
    }
  }

  const anyLoading = reqLoading || authLoading || geoLoading || overviewLoading || adsLoading || deviceLoading || consumersLoading || isClearing;

  async function onSetApiKeyTier(key: AdminApiKeyDto, tier: ApiKeyTier) {
    if (key.tier === tier) return;
    try {
      await setApiKeyTier({ id: key.id, tier }).unwrap();
      toast.success(`${key.keyPrefix} tier güncellendi.`);
    } catch (err) {
      toast.error(getErrorMessage(err, t('error')));
    }
  }

  async function onRevokeApiKey(key: AdminApiKeyDto) {
    if (key.revoked) return;
    if (!window.confirm(`${key.keyPrefix} API key iptal edilsin mi?`)) return;
    try {
      await revokeApiKey({ id: key.id }).unwrap();
      toast.success(`${key.keyPrefix} iptal edildi.`);
    } catch (err) {
      toast.error(getErrorMessage(err, t('error')));
    }
  }

  const apiKeyUsageByKey = React.useMemo(() => {
    const map = new Map<number, AdminApiKeyDailyUsageDto[]>();
    for (const row of apiKeyDailyUsageData as AdminApiKeyDailyUsageDto[]) {
      const list = map.get(row.keyId) ?? [];
      list.push(row);
      map.set(row.keyId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    return map;
  }, [apiKeyDailyUsageData]);

  return (
    <div className="space-y-6">
      {/* ---- HEADER ---- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('header.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('header.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={anyLoading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('refresh')}
          </Button>
          <Button variant="destructive" onClick={onClearLogs} disabled={isClearing}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('clear.button')}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="general">
            <BarChart3 className="mr-2 h-4 w-4" /> {t('tabs.general')}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Activity className="mr-2 h-4 w-4" /> {t('tabs.requests')}
          </TabsTrigger>
          <TabsTrigger value="auth">
            <UserCheck className="mr-2 h-4 w-4" /> {t('tabs.auth')}
          </TabsTrigger>
          <TabsTrigger value="daily">
            <ShieldCheck className="mr-2 h-4 w-4" /> {t('tabs.daily')}
          </TabsTrigger>
          <TabsTrigger value="ads">
            <MousePointerClick className="mr-2 h-4 w-4" /> {t('tabs.ads')}
          </TabsTrigger>
          <TabsTrigger value="device">
            <Smartphone className="mr-2 h-4 w-4" /> {t('tabs.device')}
          </TabsTrigger>
          <TabsTrigger value="map">
            <Globe className="mr-2 h-4 w-4" /> {t('tabs.map')}
          </TabsTrigger>
          <TabsTrigger value="consumers">
            <KeyRound className="mr-2 h-4 w-4" /> {t('tabs.consumers')}
          </TabsTrigger>
        </TabsList>

        {/* ==================== GENERAL TAB ==================== */}
        <TabsContent value="general" className="space-y-4">
          <RangeControls range={range} onChange={(next) => apply({ tab: 'general', range: next })} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard title="İnsan Trafiği" value={fmtNumber(overviewData?.summary?.humanRequests)} sub={`${fmtNumber(overviewData?.summary?.pageviews)} pageview`} />
            <MetricCard title="Bot Trafiği" value={fmtNumber(overviewData?.summary?.botRequests)} sub={`${fmtNumber(overviewData?.summary?.totalRequests)} toplam request`} />
            <MetricCard title="Ads Unique IP" value={fmtNumber(overviewData?.summary?.adsUniqueIps)} sub={`${fmtNumber(overviewData?.summary?.adsPageviews)} Ads pageview`} />
            <MetricCard title="Direct Trafik" value={fmtPct(overviewData?.summary?.directTrafficPct)} sub={`${fmtNumber(overviewData?.summary?.returningIps)} returning IP`} />
            <MetricCard title="B2B-like IP" value={fmtNumber(overviewData?.summary?.b2bLikeIps)} sub={`${fmtNumber(overviewData?.summary?.b2bIntentIps)} yüksek niyet`} />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <SimpleRowsCard title="Top Landing Page" rows={overviewData?.topLandingPages ?? []} loading={overviewLoading} />
            <SimpleRowsCard title="Top Referrer" rows={overviewData?.topReferrers ?? []} loading={overviewLoading} />
            <SimpleRowsCard title="Cihaz Dağılımı" rows={(overviewData?.devices ?? []).map((row: any) => ({ name: deviceLabel(row.device), count: row.count }))} loading={overviewLoading} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cohort Retention</CardTitle>
              <CardDescription>İlk kez gelen IP'lerin sonraki günlerde tekrar görünme oranı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İlk Gün</TableHead>
                    <TableHead className="text-right">Yeni IP</TableHead>
                    <TableHead className="text-right">D+1</TableHead>
                    <TableHead className="text-right">D+3</TableHead>
                    <TableHead className="text-right">D+7</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(retentionData?.cohorts ?? []).map((row: any) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.visitors)}</TableCell>
                      <TableCell className="text-right">
                        {fmtNumber(row.d1)} <span className="text-muted-foreground">({fmtPct(row.d1Pct)})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtNumber(row.d3)} <span className="text-muted-foreground">({fmtPct(row.d3Pct)})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtNumber(row.d7)} <span className="text-muted-foreground">({fmtPct(row.d7Pct)})</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!overviewLoading && (retentionData?.cohorts?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== REQUESTS TAB ==================== */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" /> {t('requests.filtersTitle')}
              </CardTitle>
              <CardDescription>{t('requests.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitRequests} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('requests.search')}</Label>
                  <Input
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    placeholder={t('requests.placeholders.search')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('requests.method')}</Label>
                  <Input
                    value={methodText}
                    onChange={(e) => setMethodText(e.target.value)}
                    placeholder={t('requests.placeholders.method')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('requests.status')}</Label>
                  <Input
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder={t('requests.placeholders.status')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.from')}</Label>
                  <Input type="datetime-local" value={fromText} onChange={(e) => setFromText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.to')}</Label>
                  <Input type="datetime-local" value={toText} onChange={(e) => setToText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.userId')}</Label>
                  <Input value={reqUserIdText} onChange={(e) => setReqUserIdText(e.target.value)} placeholder={t('common.userId')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.ip')}</Label>
                  <Input
                    value={reqIpText}
                    onChange={(e) => setReqIpText(e.target.value)}
                    placeholder={t('requests.placeholders.ip')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('requests.sort')}</Label>
                  <div className="flex gap-2">
                    <Select value={sortText} onValueChange={(v) => setSortText(v as AdminAuditSortKey)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">{t('requests.sortDate')}</SelectItem>
                        <SelectItem value="response_time_ms">{t('requests.sortResponseTime')}</SelectItem>
                        <SelectItem value="status_code">{t('requests.sortStatusCode')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={orderDirText} onValueChange={(v) => setOrderDirText(v as 'asc' | 'desc')}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">{t('common.desc')}</SelectItem>
                        <SelectItem value="asc">{t('common.asc')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>{t('common.onlyAdmin')}</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Switch checked={onlyAdminFlag} onCheckedChange={setOnlyAdminFlag} />
                    <span className="text-sm text-muted-foreground">{t('common.adminRequests')}</span>
                  </div>
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  {REQUEST_PATH_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQText(preset.q);
                        apply({ tab: 'requests', q: preset.q, offset: 0 });
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetRequests}>
                    {t('common.reset')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('requests.logsTitle')}</CardTitle>
                  <CardDescription>
                    {t('common.totalRecords', { count: String(reqTotal) })}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {reqLoading ? t('common.loading') : t('common.recordCount', { count: String(reqData.items.length) })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {reqQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrorMessage(reqQ.error, t('error'))}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.date')}</TableHead>
                      <TableHead>{t('columns.request')}</TableHead>
                      <TableHead>{t('columns.status')}</TableHead>
                      <TableHead>{t('columns.ipUser')}</TableHead>
                      <TableHead className="hidden xl:table-cell">Referer</TableHead>
                      <TableHead>{t('columns.location')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('columns.userAgent')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reqData.items.length === 0 && !reqLoading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                          {t('common.noRecords')}
                        </TableCell>
                      </TableRow>
                    )}

                    {reqData.items.map((r) => {
                      const code = Number(r.status_code ?? 0);
                      const geo = getAdminAuditGeoLabel(r.country, r.city);
                      return (
                        <TableRow key={String(r.id)}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatAdminAuditWhen(r.created_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.method)}</div>
                            <div className="text-muted-foreground">{safeText(r.path)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAdminAuditStatusVariant(code)}>{code || '—'}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {Number(r.response_time_ms ?? 0)}ms
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.ip)}</div>
                            <div className="text-muted-foreground">
                              {r.user_id ? `uid:${r.user_id}` : t('common.anon')}
                              {r.is_admin ? ' · admin' : ''}
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs">
                            {r.referer ? (
                              <div className="max-w-[180px] space-y-1">
                                <div className="truncate font-medium" title={r.referer}>
                                  {refererHost(r.referer)}
                                </div>
                                <Badge variant={isInternalReferer(r.referer) ? 'secondary' : 'outline'}>
                                  {isInternalReferer(r.referer) ? 'İç' : 'Dış'}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Direct</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {geo || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[220px]" title={r.user_agent ?? ''}>
                            <div className="flex items-center gap-2">
                              <Badge variant={isBotUserAgent(r.user_agent) ? 'secondary' : 'outline'}>
                                {isBotUserAgent(r.user_agent) ? 'Bot' : 'İnsan'}
                              </Badge>
                              <span className="truncate">{truncateNullable(r.user_agent, 50) || '—'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {reqTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, reqTotal)}`}
                  {' / '} {reqTotal}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextReq}
                    onClick={() => apply({ offset: offset + limit })}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== AUTH TAB ==================== */}
        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4" /> {t('auth.filtersTitle')}
              </CardTitle>
              <CardDescription>{t('auth.filtersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitAuth} className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>{t('auth.event')}</Label>
                  <Select value={eventText || ''} onValueChange={setEventText}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                      {AUDIT_AUTH_EVENTS.map((ev) => (
                        <SelectItem key={ev} value={ev}>
                          {ev}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('auth.email')}</Label>
                  <Input value={emailText} onChange={(e) => setEmailText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.userId')}</Label>
                  <Input value={userIdText} onChange={(e) => setUserIdText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.ip')}</Label>
                  <Input value={ipText} onChange={(e) => setIpText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.from')}</Label>
                  <Input type="datetime-local" value={fromText} onChange={(e) => setFromText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.to')}</Label>
                  <Input type="datetime-local" value={toText} onChange={(e) => setToText(e.target.value)} />
                </div>

                <div className="md:col-span-3 flex flex-wrap items-center gap-2">
                  <Button type="submit">
                    <Search className="mr-2 h-4 w-4" /> {t('common.apply')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={onResetAuth}>
                    {t('common.reset')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('auth.eventsTitle')}</CardTitle>
                  <CardDescription>
                    {t('common.totalRecords', { count: String(authTotal) })}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {authLoading ? t('common.loading') : t('common.recordCount', { count: String(authData.items.length) })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {authQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrorMessage(authQ.error, t('error'))}
                </div>
              )}

              <div className="mt-3 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.date')}</TableHead>
                      <TableHead>{t('auth.event')}</TableHead>
                      <TableHead>{t('columns.user')}</TableHead>
                      <TableHead>{t('common.ip')}</TableHead>
                      <TableHead>{t('columns.location')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('columns.userAgent')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authData.items.length === 0 && !authLoading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                          {t('common.noRecords')}
                        </TableCell>
                      </TableRow>
                    )}

                    {authData.items.map((r) => {
                      const geo = getAdminAuditGeoLabel(r.country, r.city);
                      return (
                        <TableRow key={String(r.id)}>
                          <TableCell className="whitespace-nowrap text-sm">{formatAdminAuditWhen(r.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={getAdminAuditAuthEventVariant(r.event)}>{safeText(r.event)}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="font-medium">{safeText(r.email || r.user_id || '—')}</div>
                            <div className="text-muted-foreground">{r.user_id ? `uid:${r.user_id}` : ''}</div>
                          </TableCell>
                          <TableCell className="text-sm">{safeText(r.ip)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {geo || '—'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate" title={r.user_agent ?? ''}>
                            {truncateNullable(r.user_agent, 50) || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {authTotal === 0 ? '0' : `${offset + 1}-${Math.min(offset + limit, authTotal)}`}
                  {' / '} {authTotal}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canPrev}
                    onClick={() => apply({ offset: Math.max(0, offset - limit) })}
                  >
                    {t('common.prev')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNextAuth}
                    onClick={() => apply({ offset: offset + limit })}
                  >
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DAILY TAB ==================== */}
        <TabsContent value="daily" className="space-y-4">
          <RangeControls range={range} onChange={(next) => apply({ tab: 'daily', range: next })} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analytics Günlük Akış</CardTitle>
              <CardDescription>Request, insan trafik, Ads ve unique IP kırılımı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Request</TableHead>
                    <TableHead className="text-right">İnsan</TableHead>
                    <TableHead className="text-right">Bot</TableHead>
                    <TableHead className="text-right">Ads</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                    <TableHead className="text-right">Hata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overviewData?.daily ?? []).map((row: any) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.requests)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.humans)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.bots)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.ads)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.errors)}</TableCell>
                    </TableRow>
                  ))}
                  {!overviewLoading && (overviewData?.daily?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{t('metrics.chartTitle')}</CardTitle>
                  <CardDescription>{t('metrics.lastNDays', { n: String(overviewData?.daily?.length ?? 0) })}</CardDescription>
                </div>
                {overviewLoading && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t('common.loading')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AuditDailyChart rows={(overviewData?.daily ?? []) as any} loading={overviewLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ADS TAB ==================== */}
        <TabsContent value="ads" className="space-y-4">
          <RangeControls range={range} onChange={(next) => apply({ tab: 'ads', range: next })} />
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ads Attribution</CardTitle>
                <CardDescription>Kampanya, source/medium, pageview ve unique IP kırılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Source / Medium</TableHead>
                      <TableHead className="text-right">Pageview</TableHead>
                      <TableHead className="text-right">Unique IP</TableHead>
                      <TableHead className="text-right">İstekler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(adsData?.items ?? []).map((row: any) => (
                      <TableRow key={`${row.campaign}-${row.source}-${row.medium}`}>
                        <TableCell className="font-medium">{row.campaign || '-'}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{row.source || '-'} / {row.medium || '-'}</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.pageviews)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => apply({ tab: 'requests', q: row.campaign && row.campaign !== 'unknown' ? row.campaign : 'gclid=', offset: 0 })}
                          >
                            Aç
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!adsLoading && (adsData?.items?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>{t('common.noRecords')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <SimpleRowsCard title="Ads Funnel" rows={funnelData?.items ?? []} loading={adsLoading} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gün Gün Kampanya Trafiği</CardTitle>
              <CardDescription>gclid taşıyan isteklerde tarih ve kampanya bazlı pageview / unique IP.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Source / Medium</TableHead>
                      <TableHead className="text-right">Pageview</TableHead>
                      <TableHead className="text-right">Unique IP</TableHead>
                      <TableHead className="text-right">İstekler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {(adsDailyData?.items ?? []).map((row: any) => (
                    <TableRow key={`${row.date}-${row.campaign}-${row.source}-${row.medium}`}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="font-medium">{row.campaign || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{row.source || '-'} / {row.medium || '-'}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.pageviews)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => apply({ tab: 'requests', q: row.campaign && row.campaign !== 'unknown' ? row.campaign : 'gclid=', offset: 0 })}
                        >
                          Aç
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!adsLoading && (adsDailyData?.items?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== DEVICE TAB ==================== */}
        <TabsContent value="device" className="space-y-4">
          <RangeControls range={range} onChange={(next) => apply({ tab: 'device', range: next })} />
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <SimpleRowsCard title="Cihaz Dağılımı" rows={(overviewData?.devices ?? []).map((row: any) => ({ name: deviceLabel(row.device), count: row.count }))} loading={deviceLoading} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saatlik Heatmap</CardTitle>
                <CardDescription>Haftanın günü ve saate göre insan trafik / unique IP.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gün</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead className="text-right">İnsan</TableHead>
                      <TableHead className="text-right">Unique IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(heatmapData?.items ?? []).slice(0, 24).map((row: any) => (
                      <TableRow key={`${row.weekday}-${row.hour}`}>
                        <TableCell>{row.weekday}</TableCell>
                        <TableCell>{String(row.hour).padStart(2, '0')}:00</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.humans)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      </TableRow>
                    ))}
                    {!deviceLoading && (heatmapData?.items?.length ?? 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={4}>{t('common.noRecords')}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cihaz Günlük Trend</CardTitle>
              <CardDescription>Mobil/tablet/masaüstü trafiği ve Ads cihaz kırılımı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Cihaz</TableHead>
                    <TableHead className="text-right">Request</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                    <TableHead className="text-right">Ads Request</TableHead>
                    <TableHead className="text-right">Ads Unique IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(deviceDailyData?.items ?? []).map((row: any) => (
                    <TableRow key={`${row.date}-${row.device}`}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{deviceLabel(row.device)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.requests)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.adsRequests)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.adsUniqueIps)}</TableCell>
                    </TableRow>
                  ))}
                  {!deviceLoading && (deviceDailyData?.items?.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== CONSUMERS TAB ==================== */}
        <TabsContent value="consumers" className="space-y-4">
          <RangeControls range={range} onChange={(next) => apply({ tab: 'consumers', range: next })} />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4" /> API Key Sahipleri
              </CardTitle>
              <CardDescription>Kullanıcı, tier, günlük limit ve revoke yönetimi.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Kullanım</TableHead>
                    <TableHead>Son Kullanım</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeysData.map((key: AdminApiKeyDto) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div className="max-w-[220px] truncate font-medium">{key.userEmail || key.userId}</div>
                        <div className="text-muted-foreground text-xs">{key.userFullName || key.name || key.userId}</div>
                      </TableCell>
                      <TableCell className="font-mono">{key.keyPrefix}</TableCell>
                      <TableCell><Badge variant={key.tier === 'pro' ? 'default' : 'outline'}>{key.tier}</Badge></TableCell>
                      <TableCell>
                        <div className="font-medium">{formatApiKeyUsage(key)}</div>
                        <div className="mt-1 h-1.5 rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${apiKeyUsagePct(key)}%` }} />
                        </div>
                      </TableCell>
                      <TableCell>{formatApiKeyDate(key.lastUsedAt)}</TableCell>
                      <TableCell>{key.revoked ? <Badge variant="destructive">Revoked</Badge> : <Badge>Aktif</Badge>}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {API_KEY_TIERS.map((tier) => (
                            <Button
                              key={tier}
                              size="sm"
                              variant={key.tier === tier ? 'secondary' : 'outline'}
                              disabled={consumersLoading || key.revoked || key.tier === tier}
                              onClick={() => onSetApiKeyTier(key, tier)}
                            >
                              {tier === 'pro' ? 'Pro yap' : 'Free yap'}
                            </Button>
                          ))}
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={consumersLoading || key.revoked}
                            onClick={() => onRevokeApiKey(key)}
                          >
                            Revoke
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!consumersLoading && apiKeysData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-key Günlük Kullanım</CardTitle>
              <CardDescription>Audit loglarında `api_key_id` dolu olan isteklerin gün bazlı grafiği.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Günlük Grafik</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeysData.map((key: AdminApiKeyDto) => {
                    const rows = apiKeyUsageByKey.get(key.id) ?? [];
                    const max = Math.max(...rows.map((row) => row.requests), 0);
                    const total = rows.reduce((sum, row) => sum + row.requests, 0);
                    const uniqueIps = rows.reduce((sum, row) => sum + row.uniqueIps, 0);
                    return (
                      <TableRow key={`usage-${key.id}`}>
                        <TableCell className="font-mono">{key.keyPrefix}</TableCell>
                        <TableCell>
                          <div className="flex h-10 items-end gap-1">
                            {rows.length === 0 ? (
                              <span className="text-sm text-muted-foreground">Veri yok</span>
                            ) : (
                              rows.map((row) => (
                                <div
                                  key={`${key.id}-${row.date}`}
                                  className="w-3 rounded-t bg-primary"
                                  title={`${row.date}: ${fmtNumber(row.requests)} istek, ${fmtNumber(row.uniqueIps)} IP`}
                                  style={{ height: `${Math.max(10, Math.round((row.requests / Math.max(max, 1)) * 40))}px` }}
                                />
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{fmtNumber(total)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(uniqueIps)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!consumersLoading && apiKeysData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Widget Gömen Siteler</CardTitle>
              <CardDescription>Fiyat widget endpoint'ine referer ile gelen dış/iç host listesi.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Host</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead className="text-right">Hit</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                    <TableHead>Son Görülme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {widgetEmbeddersData.map((row: any) => (
                    <TableRow key={row.host}>
                      <TableCell className="font-medium">{row.host}</TableCell>
                      <TableCell>
                        <Badge variant={row.internal ? 'secondary' : 'outline'}>
                          {row.internal ? 'İç' : 'Dış'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{fmtNumber(row.hits)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell>{formatApiKeyDate(row.lastSeen)}</TableCell>
                    </TableRow>
                  ))}
                  {!consumersLoading && widgetEmbeddersData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yoğun Veri Çekenler</CardTitle>
              <CardDescription>Son {range === '30d' ? '30' : '7'} günde fiyat API isteği 500+ olan IP / user-agent kırılımı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP</TableHead>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Konum</TableHead>
                    <TableHead className="text-right">Hit</TableHead>
                    <TableHead className="text-right">Path</TableHead>
                    <TableHead className="text-right">Export</TableHead>
                    <TableHead>Son Görülme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataPullersData.map((row: any) => (
                    <TableRow key={`${row.ip}-${row.userAgent ?? ''}`}>
                      <TableCell className="font-mono">{row.ip}</TableCell>
                      <TableCell className="max-w-[320px]">
                        <div className="flex items-center gap-2">
                          {row.bot ? <Badge variant="secondary">Bot</Badge> : <Badge variant="outline">İnsan?</Badge>}
                          <span className="truncate text-xs text-muted-foreground" title={row.userAgent ?? ''}>
                            {truncateNullable(row.userAgent, 80) || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{locationLabel(row.country, row.city)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.hits)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniquePaths)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.exportHits)}</TableCell>
                      <TableCell>{formatApiKeyDate(row.lastSeen)}</TableCell>
                    </TableRow>
                  ))}
                  {!consumersLoading && dataPullersData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== MAP TAB ==================== */}
        <TabsContent value="map" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex rounded-md border bg-muted/30 p-1">
              {([
                ['all', 'Tümü'],
                ['human', 'İnsan'],
                ['bot', 'Bot'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant={geoTraffic === value ? 'default' : 'ghost'}
                  onClick={() => apply({ tab: 'map', traffic: value })}
                  className="h-8"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Globe className="h-4 w-4" /> {t('map.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('map.description', { days: String(geoParams.days) })}
                  </CardDescription>
                </div>
                {geoLoading && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" /> {t('common.loading')}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {geoQ.error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  {getErrorMessage(geoQ.error, t('error'))}
                </div>
              )}
              <AuditGeoMap items={geoItemsVisible} loading={geoLoading} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" /> Türkiye Haritası
              </CardTitle>
              <CardDescription>Ziyaretçilerin geldiği iller (geoip şehir → il). LOCAL/sunucu-içi trafik hariç.</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditTurkeyMap cities={geoCitiesTR} loading={geoLoading} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Şehir / Ülke Kırılımı</CardTitle>
              <CardDescription>Top lokasyon; istek sayısı, unique IP ve bot request kırılımı (LOCAL hariç).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Şehir</TableHead>
                    <TableHead>Ülke</TableHead>
                    <TableHead className="text-right">İstek</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                    <TableHead className="text-right">Bot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoCitiesVisible.map((row: any) => (
                    <TableRow key={`${row.country}-${row.city}`}>
                      <TableCell className="font-medium">{row.city || '-'}</TableCell>
                      <TableCell>{row.country || '-'}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.hits)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.botHits)}</TableCell>
                    </TableRow>
                  ))}
                  {!geoLoading && geoCitiesVisible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>{t('common.noRecords')}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RangeControls({ range, onChange }: { range: AnalyticsRange; onChange: (range: AnalyticsRange) => void }) {
  return (
    <div className="flex justify-end">
      <div className="flex rounded-md border bg-muted/30 p-1">
        {(['7d', '30d'] as const).map((item) => (
          <Button
            key={item}
            size="sm"
            variant={range === item ? 'default' : 'ghost'}
            onClick={() => onChange(item)}
            className="h-8"
          >
            {item === '7d' ? '7 Gün' : '30 Gün'}
          </Button>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {sub ? <div className="text-muted-foreground text-xs">{sub}</div> : null}
      </CardHeader>
    </Card>
  );
}

function SimpleRowsCard({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: Array<{ name: string; count: number }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{row.name || '-'}</span>
            <Badge variant="outline">{fmtNumber(row.count)}</Badge>
          </div>
        ))}
        {!loading && rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Kayıt bulunamadı.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
