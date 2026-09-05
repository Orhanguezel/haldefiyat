'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdSlotAvailabilityAdminQuery, useGetAdPaymentAlertsAdminQuery, useGetAdSelfServiceRequestsAdminQuery, useListAdSlotsAdminQuery, useListBannersAdminQuery } from '@/integrations/hooks';
import { SummaryTiles } from '../../_components/common/summary-tiles';
import { useAdminT } from '../../_components/common/use-admin-t';
import { AlertsPanel } from './_components/alerts-panel';
import { CalendarPanel } from './_components/calendar-panel';
import { CampaignSheet } from './_components/campaign-sheet';
import { CampaignsTable } from './_components/campaigns-table';
import { PackagesPanel } from './_components/packages-panel';
import { RevenuePanel } from './_components/revenue-panel';
import { SlotsPanel } from './_components/slots-panel';
import { WaitlistPanel } from './_components/waitlist-panel';
import { ALL, applyFilters, EMPTY_FILTERS, type Filters, LIFECYCLES, money, SORT_KEYS, type SortKey, SOURCE_TYPES, summarize } from './_lib/banner-meta';

const CHIPS = ['all', 'live', 'scheduled', 'open', 'endingSoon', 'problem', 'completed', 'draft'] as const;

export default function Page() {
  const t = useAdminT('admin.banners');
  const tc = useAdminT('admin.common');
  const { data, isLoading } = useListBannersAdminQuery(undefined);
  const { data: slotsData } = useListAdSlotsAdminQuery();
  const today = new Date().toISOString().slice(0, 10);
  const { data: availability } = useAdSlotAvailabilityAdminQuery({ at: today, device: 'all', horizonDays: 365 });
  const { data: alerts } = useGetAdPaymentAlertsAdminQuery();
  const { data: requests } = useGetAdSelfServiceRequestsAdminQuery({ status: 'pending' });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<number | null>(null);

  const banners = data?.items ?? [];
  const slots = slotsData?.items ?? [];
  const stats = useMemo(() => summarize(banners), [banners]);
  const visible = useMemo(() => applyFilters(banners, filters), [banners, filters]);
  const open = useMemo(() => banners.find((b) => b.id === openId) ?? null, [banners, openId]);
  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.q || filters.position !== ALL || filters.lifecycle !== ALL || filters.sourceType !== ALL || filters.device !== ALL;
  const attention = (alerts?.items.length ?? 0) + (requests?.items.length ?? 0) + stats.problem;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? tc('loading') : t('subtitle', { total: stats.total, live: stats.live, scheduled: stats.scheduled, reserved: money(stats.reservedRevenue) })}</p>
        </div>
        <Button asChild><Link href="/admin/banners/new"><Plus className="size-4" /> {t('new')}</Link></Button>
      </div>

      <SummaryTiles tiles={[
        { key: 'total', label: t('tiles.total'), value: stats.total, hint: t('tiles.totalHint'), active: filters.lifecycle === ALL, onClick: () => patch({ lifecycle: ALL }) },
        { key: 'live', label: t('tiles.live'), value: stats.live, hint: t('tiles.liveHint'), tone: 'text-emerald-600', active: filters.lifecycle === 'live', onClick: () => patch({ lifecycle: 'live' }) },
        { key: 'scheduled', label: t('tiles.scheduled'), value: stats.scheduled, hint: t('tiles.scheduledHint'), active: filters.lifecycle === 'scheduled', onClick: () => patch({ lifecycle: 'scheduled' }) },
        { key: 'open', label: t('tiles.open'), value: stats.open, hint: t('tiles.openHint'), tone: stats.open ? 'text-amber-600' : '', active: filters.lifecycle === 'open', onClick: () => patch({ lifecycle: 'open' }) },
        { key: 'endingSoon', label: t('tiles.endingSoon'), value: stats.endingSoon, hint: t('tiles.endingSoonHint'), active: filters.lifecycle === 'endingSoon', onClick: () => patch({ lifecycle: 'endingSoon' }) },
        { key: 'attention', label: t('tiles.attention'), value: attention, hint: t('tiles.attentionHint'), tone: attention ? 'text-rose-600' : '' },
      ]} />

      <Tabs defaultValue="campaigns">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="campaigns">{t('tabs.campaigns')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('tabs.alerts')}{attention ? <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{attention}</span> : null}</TabsTrigger>
          <TabsTrigger value="revenue">{t('tabs.revenue')}</TabsTrigger>
          <TabsTrigger value="calendar">{t('tabs.calendar')}</TabsTrigger>
          <TabsTrigger value="slots">{t('tabs.slots')}</TabsTrigger>
          <TabsTrigger value="waitlist">{t('tabs.waitlist')}</TabsTrigger>
          <TabsTrigger value="packages">{t('tabs.packages')}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
            </div>
            <Select value={filters.position} onValueChange={(v) => patch({ position: v })}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>{t('allSlots')}</SelectItem>{slots.map((s) => <SelectItem key={s.slotKey} value={s.slotKey}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.lifecycle} onValueChange={(v) => patch({ lifecycle: v })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>{t('allStatuses')}</SelectItem>{LIFECYCLES.map((k) => <SelectItem key={k} value={k}>{t(`lifecycles.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.sourceType} onValueChange={(v) => patch({ sourceType: v })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>{t('allSources')}</SelectItem>{SOURCE_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`sources.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.sort} onValueChange={(v) => patch({ sort: v as SortKey })}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{SORT_KEYS.map((k) => <SelectItem key={k} value={k}>{t(`sort.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
            {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((k) => <Button key={k} size="sm" variant={filters.lifecycle === k ? 'default' : 'outline'} onClick={() => patch({ lifecycle: k })}>{t(`chips.${k}`)}</Button>)}
            <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
          </div>
          <CampaignsTable rows={visible} slots={slots} loading={isLoading} activeId={openId ?? undefined} onSelect={(b) => setOpenId(b.id)} t={t} tc={tc} />
        </TabsContent>
        <TabsContent value="alerts" className="mt-4"><AlertsPanel banners={banners} t={t} tc={tc} /></TabsContent>
        <TabsContent value="revenue" className="mt-4"><RevenuePanel banners={banners} slots={slots} t={t} /></TabsContent>
        <TabsContent value="calendar" className="mt-4"><CalendarPanel slots={slots} t={t} tc={tc} /></TabsContent>
        <TabsContent value="slots" className="mt-4"><SlotsPanel slots={slots} availability={availability?.items ?? []} t={t} /></TabsContent>
        <TabsContent value="waitlist" className="mt-4"><WaitlistPanel slots={slots} t={t} tc={tc} /></TabsContent>
        <TabsContent value="packages" className="mt-4"><PackagesPanel slots={slots} t={t} tc={tc} /></TabsContent>
      </Tabs>

      <CampaignSheet row={open} slots={slots} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
