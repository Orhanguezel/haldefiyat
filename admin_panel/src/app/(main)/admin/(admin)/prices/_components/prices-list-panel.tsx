'use client';

import Link from 'next/link';
import * as React from 'react';
import { ChevronLeft, ChevronRight, ListFilter, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  useListMarketsAdminQuery,
  useListPriceCategoriesAdminQuery,
  useListPriceSourcesAdminQuery,
  useListPricesAdminQuery,
} from '@/integrations/hooks';
import type { PriceAdminItem } from '@/integrations/endpoints/prices-admin-endpoints';
import { ALL, PriceFilters, type FilterState } from './price-filters';
import { PriceDetailSheet } from './price-detail-sheet';
import { PricesTable } from './prices-table';
import { useAdminT } from '../../../_components/common/use-admin-t';

const PAGE_SIZES = [25, 50, 100, 250];

const EMPTY: FilterState = {
  q: '', category: ALL, city: ALL, market: ALL, source: ALL,
  issue: ALL, days: '365', sort: 'date_desc',
};

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

interface Props {
  initialFilters?: { q?: string; market?: string; city?: string; category?: string; range?: string };
}

export default function PricesListPanel({ initialFilters }: Props) {
  const t = useAdminT('admin.prices.list');
  const tc = useAdminT('admin.common');
  const [filters, setFilters] = React.useState<FilterState>({
    ...EMPTY,
    q: initialFilters?.q ?? '',
    category: initialFilters?.category ?? ALL,
    city: initialFilters?.city ?? ALL,
    market: initialFilters?.market ?? ALL,
  });
  const [latestOnly, setLatestOnly] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);
  const [selected, setSelected] = React.useState<PriceAdminItem | null>(null);

  const debouncedQ = useDebounced(filters.q, 400);

  const { data: marketsData } = useListMarketsAdminQuery(undefined);
  const { data: categoriesData } = useListPriceCategoriesAdminQuery();
  const { data: sourcesData } = useListPriceSourcesAdminQuery();

  const markets = React.useMemo(() => marketsData?.items ?? [], [marketsData]);
  const cities = React.useMemo(
    () => Array.from(new Set(markets.map((entry) => entry.cityName).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')),
    [markets],
  );

  React.useEffect(() => { setPage(1); }, [debouncedQ, filters.category, filters.city, filters.market, filters.source, filters.issue, filters.days, filters.sort, latestOnly, pageSize]);

  const { data, isLoading, isFetching } = useListPricesAdminQuery({
    q: debouncedQ || undefined,
    category: filters.category === ALL ? undefined : filters.category,
    city: filters.city === ALL ? undefined : filters.city,
    market: filters.market === ALL ? undefined : filters.market,
    source: filters.source === ALL ? undefined : filters.source,
    issue: filters.issue === ALL ? undefined : (filters.issue as 'any'),
    sort: filters.sort as 'date_desc',
    days: Number(filters.days),
    latestOnly,
    page,
    limit: pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const dirty = JSON.stringify(filters) !== JSON.stringify(EMPTY);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? tc('loading') : t('count', { count: total.toLocaleString('tr-TR') })}
            {isFetching && !isLoading ? ` · ${tc('updating')}` : ''}
            {data?.meta?.latestRecordedDate ? ` · ${t('latest', { date: String(data.meta.latestRecordedDate).slice(0, 10) })}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/prices/quarantine"><ShieldAlert className="size-4" /> {t('reviewQueue')}</Link>
          </Button>
          <Button asChild size="sm"><Link href="/admin/prices/new"><Plus className="size-4" /> {t('new')}</Link></Button>
        </div>
      </div>

      <PriceFilters
        value={filters}
        onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
        onReset={() => setFilters(EMPTY)}
        categories={categoriesData?.items ?? []}
        cities={cities}
        markets={markets}
        sources={sourcesData?.items ?? []}
        dirty={dirty}
        t={t}
        tc={tc}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={latestOnly} onCheckedChange={setLatestOnly} />
          <span className="flex items-center gap-1.5">
            <ListFilter className="size-3.5 text-muted-foreground" />
            {t('latestOnly')}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">{tc('pageSize')}</Label>
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <PricesTable items={items} loading={isLoading} activeId={selected?.id} onSelect={setSelected} t={t} tc={tc} />

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{tc('pageOf', { page, total: totalPages })}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            <ChevronLeft className="size-4" /> {tc('previous')}
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
            {tc('next')} <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <PriceDetailSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
