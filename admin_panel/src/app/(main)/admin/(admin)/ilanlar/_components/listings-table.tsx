'use client';

import { MoreHorizontal, Check, X, Trash2, Pencil, ImageOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { daysLeft, formatDate, imageSrc } from '../_lib/api';
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;
import { isLiveAd, isPendingAd } from '../_lib/ads';
import type { AdRow, Listing } from '../_lib/types';

function StatusBadge({ status, t }: { status: string; t: T }) {
  const variant = status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : status === 'pending' ? 'secondary' : 'outline';
  return <Badge variant={variant} className="font-normal">{t(`status.${status}`, undefined, status)}</Badge>;
}

function Thumb({ item }: { item: Listing }) {
  const first = item.images?.[0];
  if (!first) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted/40 text-muted-foreground">
        <ImageOff className="size-4" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageSrc(first)} alt="" className="size-12 shrink-0 rounded-lg border object-cover" />;
}

function Validity({ value, tc }: { value: string; tc: T }) {
  const left = daysLeft(value);
  const tone = left == null ? 'text-muted-foreground' : left < 0 ? 'text-destructive' : left <= 3 ? 'text-amber-600' : 'text-muted-foreground';
  return (
    <div className="whitespace-nowrap">
      <div className="text-sm">{formatDate(value)}</div>
      <div className={`text-xs ${tone}`}>
        {left == null ? '' : left < 0 ? tc('expired') : left === 0 ? tc('endsToday') : tc('daysLeft', { count: left })}
      </div>
    </div>
  );
}

type Props = {
  items: Listing[];
  ads: AdRow[];
  busy: boolean;
  onEdit: (item: Listing) => void;
  onModerate: (id: number, status: 'approved' | 'rejected') => void;
  onDelete: (item: Listing) => void;
  t: T;
  tc: T;
};

export function ListingsTable({ items, ads, busy, onEdit, onModerate, onDelete, t, tc }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
        {busy ? tc('loading') : t('table.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[45%]">{t('table.listing')}</TableHead>
            <TableHead className="w-24">{t('table.type')}</TableHead>
            <TableHead className="w-28">{t('table.status')}</TableHead>
            <TableHead className="w-36">{t('table.validity')}</TableHead>
            <TableHead className="w-36">{t('table.phone')}</TableHead>
            <TableHead className="w-32 text-right">{t('table.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const ad = ads.find((entry) => entry.listingId === item.id);
            return (
              <TableRow key={item.id} className="group cursor-pointer" onClick={() => onEdit(item)}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <Thumb item={item} />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{item.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{item.productName}</span>
                        <span aria-hidden>·</span>
                        <span>{item.citySlug ?? 'TR'}</span>
                        {item.images?.length ? <span className="text-muted-foreground/70">· {t('table.images', { count: item.images.length })}</span> : null}
                        {item.isSuspicious ? <Badge variant="destructive" className="font-normal">{t('badges.suspicious')}</Badge> : null}
                        {isLiveAd(ad) ? <Badge className="font-normal">{t('badges.inAd')}</Badge>
                          : isPendingAd(ad) ? <Badge variant="outline" className="font-normal">{t('badges.adPending')}</Badge>
                          : item.isFeatured ? <Badge variant="secondary" className="font-normal">{t('badges.featured')}</Badge> : null}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{t(`type.${item.listingType}`, undefined, item.listingType)}</TableCell>
                <TableCell><StatusBadge status={item.status} t={t} /></TableCell>
                <TableCell><Validity value={item.validUntil} tc={tc} /></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.contactPhone ?? '—'}</TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                      <Pencil className="size-3.5" /> {tc('edit')}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" aria-label={tc('actions')}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={item.status === 'approved'} onClick={() => onModerate(item.id, 'approved')}>
                          <Check className="size-4" /> {tc('approve')}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={item.status === 'rejected'} onClick={() => onModerate(item.id, 'rejected')}>
                          <X className="size-4" /> {tc('reject')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => onDelete(item)}>
                          <Trash2 className="size-4" /> {tc('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
