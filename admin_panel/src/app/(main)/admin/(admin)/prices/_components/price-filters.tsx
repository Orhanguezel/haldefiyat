'use client';

import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ALL = 'all';

export type FilterState = {
  q: string; category: string; city: string; market: string;
  source: string; issue: string; days: string; sort: string;
};

const DAY_OPTIONS = [
  { value: '30', label: 'Son 30 gün' },
  { value: '90', label: 'Son 90 gün' },
  { value: '365', label: 'Son 1 yıl' },
  { value: '3650', label: 'Tüm zamanlar' },
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'En yeni önce' },
  { value: 'date_asc', label: 'En eski önce' },
  { value: 'price_desc', label: 'Fiyat: yüksekten' },
  { value: 'price_asc', label: 'Fiyat: düşükten' },
  { value: 'product', label: 'Ürün adı' },
];

const ISSUE_CHIPS = [
  { value: ALL, label: 'Tümü' },
  { value: 'any', label: 'Sorunlu kayıtlar' },
  { value: 'quarantined', label: 'Karantinada' },
  { value: 'unit_mismatch', label: 'Birim uyuşmuyor' },
  { value: 'inactive_product', label: 'Pasif ürün' },
];

type Props = {
  value: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
  categories: Array<{ slug: string; count: number }>;
  cities: string[];
  markets: Array<{ slug: string; name: string }>;
  sources: Array<{ source: string; count: number; recentlyActive: boolean }>;
  dirty: boolean;
};

export function PriceFilters({ value, onChange, onReset, categories, cities, markets, sources, dirty }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Ürün ara: domates, biber…"
            value={value.q}
            onChange={(event) => onChange({ q: event.target.value })}
          />
        </div>

        <Select value={value.category} onValueChange={(next) => onChange({ category: next })}>
          <SelectTrigger><SelectValue placeholder="Kategori" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm kategoriler</SelectItem>
            {categories.map((entry) => (
              <SelectItem key={entry.slug} value={entry.slug}>{entry.slug} ({entry.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.city} onValueChange={(next) => onChange({ city: next })}>
          <SelectTrigger><SelectValue placeholder="Şehir" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm şehirler</SelectItem>
            {cities.map((city) => <SelectItem key={city} value={city}>{city}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.market} onValueChange={(next) => onChange({ market: next })}>
          <SelectTrigger><SelectValue placeholder="Hal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm haller</SelectItem>
            {markets.map((market) => <SelectItem key={market.slug} value={market.slug}>{market.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={value.source} onValueChange={(next) => onChange({ source: next })}>
          <SelectTrigger><SelectValue placeholder="Kaynak" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm kaynaklar</SelectItem>
            {sources.map((entry) => (
              <SelectItem key={entry.source} value={entry.source}>
                {entry.source} {entry.recentlyActive ? `(${entry.count})` : '· pasif'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ISSUE_CHIPS.map((chip) => (
          <Button
            key={chip.value}
            size="sm"
            variant={value.issue === chip.value ? 'default' : 'outline'}
            onClick={() => onChange({ issue: chip.value })}
          >
            {chip.label}
          </Button>
        ))}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={value.days} onValueChange={(next) => onChange({ days: next })}>
            <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={value.sort} onValueChange={(next) => onChange({ sort: next })}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {dirty ? (
            <Button size="sm" variant="ghost" onClick={onReset}><X className="size-3.5" /> Temizle</Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
