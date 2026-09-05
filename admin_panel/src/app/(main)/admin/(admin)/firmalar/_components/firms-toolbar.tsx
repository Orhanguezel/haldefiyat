'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { TranslateFn } from '@/i18n';
import type { FirmFacets } from '@/integrations/endpoints/firms-admin-endpoints';
import { ALL, CLAIMS, EMPTY_FILTERS, FIRM_TYPES, type Filters, SORTS, SOURCES, STATUSES } from '../_lib/firm-meta';

type Props = { filters: Filters; onChange: (p: Partial<Filters>) => void; facets?: FirmFacets; t: TranslateFn; tc: TranslateFn };

export function FirmsToolbar({ filters, onChange, facets, t, tc }: Props) {
  const advanced = [filters.claim !== ALL, filters.source !== ALL, filters.phone !== ALL, filters.sponsored, filters.stale].filter(Boolean).length;
  const chips: Array<{ key: keyof Filters; label: string; reset: Partial<Filters> }> = [];
  if (filters.city !== ALL) chips.push({ key: 'city', label: filters.city, reset: { city: ALL } });
  if (filters.type !== ALL) chips.push({ key: 'type', label: t(`types.${filters.type}`), reset: { type: ALL } });
  if (filters.claim !== ALL) chips.push({ key: 'claim', label: t(`claim.${filters.claim}`), reset: { claim: ALL } });
  if (filters.source !== ALL) chips.push({ key: 'source', label: t(`source.${filters.source}`), reset: { source: ALL } });
  if (filters.phone !== ALL) chips.push({ key: 'phone', label: t(filters.phone === 'true' ? 'filters.phoneYes' : 'filters.phoneNo'), reset: { phone: ALL } });
  if (filters.sponsored) chips.push({ key: 'sponsored', label: t('filters.sponsored'), reset: { sponsored: false } });
  if (filters.stale) chips.push({ key: 'stale', label: t('filters.stale'), reset: { stale: false } });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => onChange({ q: e.target.value })} />
        </div>
        <Select value={filters.city} onValueChange={(v) => onChange({ city: v })}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t('allCities')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allCities')}</SelectItem>
            {(facets?.cities ?? []).map((c) => <SelectItem key={c.key} value={c.key}>{c.key} ({c.count})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.type} onValueChange={(v) => onChange({ type: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allTypes')}</SelectItem>
            {FIRM_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline"><SlidersHorizontal className="size-4" /> {tc('filters')}{advanced ? <Badge className="ml-1 h-5 min-w-5 justify-center px-1.5">{advanced}</Badge> : null}</Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-3">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{t('filters.claim')}</Label>
              <Select value={filters.claim} onValueChange={(v) => onChange({ claim: v })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>{tc('all')}</SelectItem>{CLAIMS.map((k) => <SelectItem key={k} value={k}>{t(`claim.${k}`)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{t('filters.source')}</Label>
              <Select value={filters.source} onValueChange={(v) => onChange({ source: v })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>{tc('all')}</SelectItem>{SOURCES.map((k) => <SelectItem key={k} value={k}>{t(`source.${k}`)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{t('filters.phone')}</Label>
              <Select value={filters.phone} onValueChange={(v) => onChange({ phone: v })}><SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>{tc('all')}</SelectItem><SelectItem value="true">{t('filters.phoneYes')}</SelectItem><SelectItem value="false">{t('filters.phoneNo')}</SelectItem></SelectContent></Select></div>
            <label className="flex items-center justify-between text-sm"><span>{t('filters.sponsored')}</span><Switch checked={filters.sponsored} onCheckedChange={(v) => onChange({ sponsored: v })} /></label>
            <label className="flex items-center justify-between text-sm"><span>{t('filters.stale')}</span><Switch checked={filters.stale} onCheckedChange={(v) => onChange({ stale: v })} /></label>
            <Button size="sm" variant="ghost" className="w-full" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q, status: filters.status, sort: filters.sort })}>{tc('clearFilters')}</Button>
          </PopoverContent>
        </Popover>
        <Select value={filters.sort} onValueChange={(v) => onChange({ sort: v as Filters['sort'] })}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{SORTS.map((k) => <SelectItem key={k} value={k}>{t(`sort.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={filters.status === s ? 'default' : 'outline'} onClick={() => onChange({ status: s })}>
            {t(`status.${s}`)}{facets && s !== 'all' ? <span className="ml-1 tabular-nums opacity-70">{facets.statuses.find((x) => x.key === s)?.count ?? 0}</span> : null}
          </Button>
        ))}
        {chips.map((chip) => (
          <Badge key={chip.key} variant="secondary" className="gap-1 pr-1 font-normal">{chip.label}
            <button type="button" className="rounded-sm hover:bg-foreground/10" onClick={() => onChange(chip.reset)} aria-label={tc('clear')}><X className="size-3" /></button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
