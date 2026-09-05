'use client';

import { AlertTriangle, ImageOff, Ruler, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PriceAdminItem } from '@/integrations/endpoints/prices-admin-endpoints';
import { ageLabel, MARKET_TYPE_LABEL, money, shortDate } from '../_lib/format';

function ProductCell({ item }: { item: PriceAdminItem }) {
  return (
    <div className="flex items-center gap-3">
      {item.productImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.productImage} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
          <ImageOff className="size-3.5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{item.productName}</span>
          {item.productActive === false ? <Badge variant="outline" className="font-normal">pasif ürün</Badge> : null}
          {item.unitMismatch ? (
            <Badge variant="outline" className="gap-1 border-amber-500/50 font-normal text-amber-700">
              <Ruler className="size-3" /> birim
            </Badge>
          ) : null}
          {item.quarantined ? (
            <Badge variant="destructive" className="gap-1 font-normal">
              <ShieldAlert className="size-3" /> karantina
            </Badge>
          ) : null}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {item.categorySlug ?? '—'}
          {item.canonicalSlug && item.canonicalSlug !== item.productSlug ? ` · ${item.canonicalSlug} varyantı` : ''}
        </div>
      </div>
    </div>
  );
}

type Props = {
  items: PriceAdminItem[];
  loading: boolean;
  activeId?: number;
  onSelect: (item: PriceAdminItem) => void;
};

export function PricesTable({ items, loading, activeId, onSelect }: Props) {
  if (loading) {
    return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">Yükleniyor…</div>;
  }
  if (!items.length) {
    return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">Bu filtrede kayıt yok.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[240px]">Ürün</TableHead>
            <TableHead className="min-w-[180px]">Hal</TableHead>
            <TableHead className="w-32">Tarih</TableHead>
            <TableHead className="w-24 text-right">Min</TableHead>
            <TableHead className="w-24 text-right">Ort</TableHead>
            <TableHead className="w-24 text-right">Maks</TableHead>
            <TableHead className="w-20">Birim</TableHead>
            <TableHead className="min-w-[140px]">Kaynak</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              onClick={() => onSelect(item)}
              className={`cursor-pointer ${activeId === item.id ? 'bg-primary/5' : ''}`}
            >
              <TableCell className="py-2.5"><ProductCell item={item} /></TableCell>
              <TableCell>
                <div className="text-sm">{item.marketName}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{item.cityName}</span>
                  {item.marketType && item.marketType !== 'hal' ? (
                    <Badge variant="secondary" className="font-normal">{MARKET_TYPE_LABEL[item.marketType] ?? item.marketType}</Badge>
                  ) : null}
                  {item.marketActive === false ? <Badge variant="outline" className="font-normal">pasif</Badge> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm whitespace-nowrap">{shortDate(item.recordedDate)}</div>
                <div className="text-xs text-muted-foreground">{ageLabel(item.recordedDate)}</div>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{money(item.minPrice)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{money(item.avgPrice)}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{money(item.maxPrice)}</TableCell>
              <TableCell className="text-sm">
                <span className={item.unitMismatch ? 'text-amber-700' : ''}>{item.unit}</span>
                {item.unitMismatch ? (
                  <span className="block text-xs text-muted-foreground">ürün: {item.productUnit}</span>
                ) : null}
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">{item.sourceApi}</span>
                {item.avgPriceMethod === 'midpoint' ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="size-3" /> ortalama türetildi
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
