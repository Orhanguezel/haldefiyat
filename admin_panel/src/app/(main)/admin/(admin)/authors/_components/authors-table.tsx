'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { AuthorAdmin } from '@/integrations/endpoints/authors-admin-endpoints';

type Props = { rows: AuthorAdmin[]; loading: boolean; activeId?: number; onSelect: (row: AuthorAdmin) => void; t: TranslateFn; tc: TranslateFn };

export function AuthorsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[300px]">{t('table.author')}</TableHead>
            <TableHead className="min-w-[280px]">{t('table.expertise')}</TableHead>
            <TableHead className="w-32">{t('table.profile')}</TableHead>
            <TableHead className="w-24">{t('table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} onClick={() => onSelect(r)} className={`cursor-pointer ${activeId === r.id ? 'bg-primary/5' : ''}`}>
              <TableCell className="py-2.5">
                <div className="flex items-center gap-3">
                  {r.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatarUrl} alt="" className="size-9 rounded-full border object-cover" />
                  ) : <div className="flex size-9 items-center justify-center rounded-full border bg-muted text-xs font-medium">{r.fullName.slice(0, 2).toLocaleUpperCase('tr')}</div>}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.title || `/yazar/${r.slug}`}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{r.expertise.slice(0, 5).map((e) => <Badge key={e} variant="outline" className="font-normal">{e}</Badge>)}{r.expertise.length > 5 ? <span className="text-xs text-muted-foreground">+{r.expertise.length - 5}</span> : null}</div></TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {[r.bio ? t('table.bio') : null, r.credentials ? t('table.credentials') : null, Object.keys(r.socialLinks ?? {}).length ? t('table.social', { count: Object.keys(r.socialLinks).length }) : null].filter(Boolean).join(' · ') || <span className="text-amber-600">{t('table.thin')}</span>}
              </TableCell>
              <TableCell><Badge variant={r.isActive ? 'default' : 'secondary'} className="font-normal">{r.isActive ? tc('active') : tc('passive')}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
