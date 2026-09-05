'use client';

import Link from 'next/link';
import { Edit, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TranslateFn } from '@/i18n';
import { BASE_URL } from '@/integrations/api-base';
import type { AuthorAdmin } from '@/integrations/endpoints/authors-admin-endpoints';

const SITE = BASE_URL.replace(/\/api\/v1\/?$/, '');

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1 text-xs text-muted-foreground">{label}</div>{children}</div>;
}

type Props = { row: AuthorAdmin | null; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function AuthorSheet({ row, onClose, t, tc }: Props) {
  return (
    <Sheet open={Boolean(row)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        {row ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-center gap-3">
                {row.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={row.avatarUrl} alt="" className="size-14 rounded-full border object-cover" />
                ) : <div className="flex size-14 items-center justify-center rounded-full border bg-muted font-medium">{row.fullName.slice(0, 2).toLocaleUpperCase('tr')}</div>}
                <div className="min-w-0">
                  <SheetTitle className="text-base">{row.fullName}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={row.isActive ? 'default' : 'secondary'} className="font-normal">{row.isActive ? tc('active') : tc('passive')}</Badge>
                    <span>{row.title || '—'}</span><span aria-hidden>·</span>
                    <span className="font-mono text-xs">/yazar/{row.slug}</span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
              <Block label={t('sheet.bio')}><p className="rounded-md border bg-muted/40 p-3 leading-6">{row.bio || <span className="text-amber-600">{t('sheet.missing')}</span>}</p></Block>
              <Block label={t('sheet.credentials')}><p>{row.credentials || <span className="text-amber-600">{t('sheet.missing')}</span>}</p></Block>
              <Block label={t('sheet.expertise')}>{row.expertise.length ? <div className="flex flex-wrap gap-1">{row.expertise.map((e) => <Badge key={e} variant="outline" className="font-normal">{e}</Badge>)}</div> : <span className="text-amber-600">{t('sheet.missing')}</span>}</Block>
              <Block label={t('sheet.social')}>
                {Object.keys(row.socialLinks ?? {}).length ? (
                  <ul className="space-y-1">{Object.entries(row.socialLinks).map(([k, v]) => <li key={k} className="flex gap-2"><span className="w-24 text-muted-foreground">{k}</span><a href={v} target="_blank" rel="noreferrer" className="truncate hover:underline">{v}</a></li>)}</ul>
                ) : <span className="text-muted-foreground">—</span>}
              </Block>
              <Block label={t('sheet.email')}><span>{row.email || '—'}</span></Block>
              <a href={`${SITE}/yazar/${row.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3.5" /> {tc('openPage')}</a>
            </div>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex w-full justify-end">
                <Button asChild size="sm"><Link href={`/admin/authors/${row.id}`}><Edit className="size-3.5" /> {t('sheet.edit')}</Link></Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
