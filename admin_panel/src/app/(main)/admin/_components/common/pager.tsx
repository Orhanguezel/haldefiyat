'use client';

import { Button } from '@/components/ui/button';
import type { TranslateFn } from '@/i18n';

type Props = { page: number; pageCount: number; onChange: (page: number) => void; summary?: string; tc: TranslateFn };

/** Sunucu sayfalamasi icin ortak alt serit (0 tabanli sayfa). */
export function Pager({ page, pageCount, onChange, summary, tc }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
      <p className="text-sm text-muted-foreground">{summary ?? ''}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}>{tc('previous')}</Button>
        <span className="px-2 text-sm text-muted-foreground">{tc('pageOf', { page: page + 1, total: pageCount })}</span>
        <Button size="sm" variant="outline" onClick={() => onChange(page + 1)} disabled={page + 1 >= pageCount}>{tc('next')}</Button>
      </div>
    </div>
  );
}
