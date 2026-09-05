'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TranslateFn } from '@/i18n';

export const ALL = 'all';

export type FilterState = {
  q: string; category: string; city: string; market: string;
  source: string; issue: string; days: string; sort: string;
};

const DAY_OPTIONS = ['30', '90', '365', '3650'];
const SORT_OPTIONS = ['date_desc', 'date_asc', 'price_desc', 'price_asc', 'product'];
const ISSUE_CHIPS = [ALL, 'any', 'quarantined', 'unit_mismatch', 'inactive_product'];

type Props = {
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  categories: Array<{ slug: string; count: number }>;
  cities: string[];
  markets: Array<{ slug: string; name: string }>;
  sources: Array<{ source: string; count: number; recentlyActive: boolean }>;
  dirty: boolean;
  t: TranslateFn;
  tc: TranslateFn;
};

export function PriceFilters({ value, onChange, onReset, categories, cities, markets, sources, dirty, t, tc }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('search')}
            value={value.q}
            onChange={(event) => onChange({ q: event.target.value })}
          />
        </div>

        <Select value={value.category} onValueChange={(next) => onChange({ category: next })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allCategories')}</SelectItem>
            {categories.map((entry) => (
              <SelectItem key={entry.slug} value={entry.slug}>{entry.slug} ({entry.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.city} onValueChange={(next) => onChange({ city: next })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allCities')}</SelectItem>
            {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.market} onValueChange={(next) => onChange({ market: next })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allMarkets')}</SelectItem>
            {markets.map((market) => <SelectItem key={market.slug} value={market.slug}>{market.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.source} onValueChange={(next) => onChange({ source: next })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('allSources')}</SelectItem>
            {sources.map((entry) => (
              <SelectItem key={entry.source} value={entry.source}>
                {entry.source} {entry.recentlyActive ? `(${entry.count})` : t('sourcePassive')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ISSUE_CHIPS.map((chip) => (
          <Button key={chip} size="sm" variant={value.issue === chip ? 'default' : 'outline'} onClick={() => onChange({ issue: chip })}>
            {t(`chips.${chip}`)}
          </Button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={value.days} onValueChange={(next) => onChange({ days: next })}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{t(`days.${option}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={value.sort} onValueChange={(next) => onChange({ sort: next })}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => <SelectItem key={option} value={option}>{t(`sort.${option}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          {dirty ? (
            <Button size="sm" variant="ghost" onClick={onReset}><X className="size-3.5" /> {tc('clear')}</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
