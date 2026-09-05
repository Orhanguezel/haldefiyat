'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PressContactStatus, PressPublicationType } from '@/integrations/endpoints/admin/press-admin-endpoints';
import { useGetPressSummaryAdminQuery, useListPressCampaignsAdminQuery, useListPressContactsAdminQuery } from '@/integrations/hooks';
import { SummaryTiles } from '../../_components/common/summary-tiles';
import { useAdminT } from '../../_components/common/use-admin-t';
import { CampaignsPanel } from './_components/campaigns-panel';
import { ContactSheet } from './_components/contact-sheet';
import { ContactsTable } from './_components/contacts-table';
import { CsvPanel } from './_components/csv-panel';
import { ALL, applyFilters, CONTACT_STATUSES, EMPTY_FILTERS, type Filters, PUBLICATION_TYPES, summarize } from './_lib/press-meta';

export default function Page() {
  const t = useAdminT('admin.press');
  const tc = useAdminT('admin.common');
  const { data: summary } = useGetPressSummaryAdminQuery();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<number | null>(null);
  const [campaignId, setCampaignId] = useState<number | null>(null);
  // Durum ve yayin tipi sunucuda; arama ve telefon filtresi yuklenen kume icinde.
  const { data, isLoading } = useListPressContactsAdminQuery({ limit: 500, status: filters.status === ALL ? undefined : (filters.status as PressContactStatus), publicationType: filters.type === ALL ? undefined : (filters.type as PressPublicationType) });
  const { data: campaignsData, isLoading: campaignsLoading } = useListPressCampaignsAdminQuery({ limit: 40 });

  const rows = data?.items ?? [];
  const campaigns = campaignsData?.items ?? [];
  const selectedCampaign = useMemo(() => campaigns.find((c) => c.id === campaignId) ?? campaigns.find((c) => c.status === 'active') ?? campaigns[0] ?? null, [campaigns, campaignId]);
  const stats = useMemo(() => summarize(rows), [rows]);
  const visible = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);
  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.q || filters.status !== ALL || filters.type !== ALL || filters.hasPhone !== ALL;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle', { contacts: summary?.totals.contacts ?? 0, campaigns: summary?.totals.campaigns ?? 0, links: summary?.totals.publishedLinks ?? 0 })}</p>
      </div>

      <SummaryTiles tiles={[
        { key: 'contacts', label: t('tiles.contacts'), value: summary?.totals.contacts ?? stats.loaded, hint: t('tiles.contactsHint'), active: filters.status === ALL, onClick: () => patch({ status: ALL }) },
        { key: 'target', label: t('statuses.target'), value: stats.target, hint: t('tiles.targetHint'), active: filters.status === 'target', onClick: () => patch({ status: 'target' }) },
        { key: 'contacted', label: t('statuses.contacted'), value: stats.contacted, hint: t('tiles.contactedHint'), active: filters.status === 'contacted', onClick: () => patch({ status: 'contacted' }) },
        { key: 'replied', label: t('statuses.replied'), value: stats.replied, hint: t('tiles.repliedHint'), tone: stats.replied ? 'text-amber-600' : '', active: filters.status === 'replied', onClick: () => patch({ status: 'replied' }) },
        { key: 'published', label: t('statuses.published'), value: stats.published, hint: t('tiles.publishedHint', { links: summary?.totals.publishedLinks ?? 0 }), tone: 'text-emerald-600', active: filters.status === 'published', onClick: () => patch({ status: 'published' }) },
        { key: 'campaigns', label: t('tiles.campaigns'), value: summary?.totals.campaigns ?? campaigns.length, hint: selectedCampaign ? t('tiles.activeCampaign', { name: selectedCampaign.name }) : t('tiles.noCampaign') },
      ]} />

      <Tabs defaultValue="contacts">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="contacts">{t('tabs.contacts')}</TabsTrigger>
          <TabsTrigger value="campaigns">{t('tabs.campaigns')}</TabsTrigger>
          <TabsTrigger value="import">{t('tabs.import')}</TabsTrigger>
        </TabsList>
        <TabsContent value="contacts" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
            </div>
            <Select value={filters.status} onValueChange={(v) => patch({ status: v })}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>{t('allStatuses')}</SelectItem>{CONTACT_STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`statuses.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={(v) => patch({ type: v })}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>{t('allTypes')}</SelectItem>{PUBLICATION_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedCampaign ? String(selectedCampaign.id) : 'none'} onValueChange={(v) => setCampaignId(Number(v) || null)}>
              <SelectTrigger className="w-56"><SelectValue placeholder={t('tiles.noCampaign')} /></SelectTrigger>
              <SelectContent>{campaigns.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant={filters.hasPhone === 'yes' ? 'default' : 'outline'} onClick={() => patch({ hasPhone: filters.hasPhone === 'yes' ? ALL : 'yes' })}>{t('chips.hasPhone')}</Button>
            {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
            <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
          </div>
          <ContactsTable rows={visible} loading={isLoading} activeId={openId ?? undefined} onSelect={(r) => setOpenId(r.id)} t={t} tc={tc} />
        </TabsContent>
        <TabsContent value="campaigns" className="mt-4"><CampaignsPanel campaigns={campaigns} loading={campaignsLoading} selected={selectedCampaign} onSelect={setCampaignId} t={t} tc={tc} /></TabsContent>
        <TabsContent value="import" className="mt-4"><CsvPanel t={t} tc={tc} /></TabsContent>
      </Tabs>

      <ContactSheet row={open} campaign={selectedCampaign} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
