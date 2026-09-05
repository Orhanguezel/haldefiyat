'use client';

import { AlertTriangle, ImageOff, Ruler, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { PriceAdminItem } from '@/integrations/endpoints/prices-admin-endpoints';
import { ageLabel, money, shortDate } from '../_lib/format';
import { useProductImage } from '../_lib/product-images';

function ProductCell({ item, image, t }: { item: PriceAdminItem; image: string | null; t: TranslateFn }) {
  return (
    <div className="flex items-center gap-3">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" className="size-9 shrink-0 rounded-md border object-cover" />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground">
          <ImageOff className="size-3.5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{item.productName}</span>
          {item.productActive === false ? <Badge variant="outline" className="font-normal">{t('table.passiveProduct')}</Badge> : null}
          {item.unitMismatch ? (
            <Badge variant="outline" className="gap-1 border-amber-500/50 font-normal text-amber-700">
              <Ruler className="size-3" /> {t('table.unitBadge')}
            </Badge>
          ) : null}
          {item.quarantined ? (
            <Badge variant="destructive" className="gap-1 font-normal">
              <ShieldAlert className="size-3" /> {t('table.quarantine')}
            </Badge>
          ) : null}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {item.categorySlug ?? '—'}
          {item.canonicalSlug && item.canonicalSlug !== item.productSlug ? ` · ${t('table.variantOf', { slug: item.canonicalSlug })}` : ''}
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
  t: TranslateFn;
  tc: TranslateFn;
};

export function PricesTable({ items, loading, activeId, onSelect, t, tc }: Props) {
  const productImage = useProductImage();

  if (loading) {
    return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  }
  if (!items.length) {
    return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[240px]">{t('table.product')}</TableHead>
            <TableHead className="min-w-[180px]">{t('table.market')}</TableHead>
            <TableHead className="w-32">{t('table.date')}</TableHead>
            <TableHead className="w-24 text-right">{t('table.min')}</TableHead>
            <TableHead className="w-24 text-right">{t('table.avg')}</TableHead>
            <TableHead className="w-24 text-right">{t('table.max')}</TableHead>
            <TableHead className="w-20">{t('table.unit')}</TableHead>
            <TableHead className="min-w-[140px]">{t('table.source')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              onClick={() => onSelect(item)}
              className={`cursor-pointer ${activeId === item.id ? 'bg-primary/5' : ''}`}
            >
              <TableCell className="py-2.5">
                <ProductCell item={item} image={productImage(item.productSlug, item.canonicalSlug)} t={t} />
              </TableCell>
              <TableCell>
                <div className="text-sm">{item.marketName}</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{item.cityName}</span>
                  {item.marketType && item.marketType !== 'hal' ? (
                    <Badge variant="secondary" className="font-normal">{t(`marketTypes.${item.marketType}`, undefined, item.marketType)}</Badge>
                  ) : null}
                  {item.marketActive === false ? <Badge variant="outline" className="font-normal">{t('table.passive')}</Badge> : null}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm whitespace-nowrap">{shortDate(item.recordedDate)}</div>
                <div className="text-xs text-muted-foreground">{ageLabel(item.recordedDate, tc)}</div>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{money(item.minPrice)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{money(item.avgPrice)}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{money(item.maxPrice)}</TableCell>
              <TableCell className="text-sm">
                <span className={item.unitMismatch ? 'text-amber-700' : ''}>{item.unit}</span>
                {item.unitMismatch ? (
                  <span className="block text-xs text-muted-foreground">{t('table.productUnit', { unit: item.productUnit ?? '' })}</span>
                ) : null}
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">{item.sourceApi}</span>
                {item.avgPriceMethod === 'midpoint' ? (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-700">
                    <AlertTriangle className="size-3" /> {t('table.derivedAvg')}
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
