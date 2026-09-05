'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListAuthorsAdminQuery } from '@/integrations/hooks';
import { SummaryTiles } from '../../_components/common/summary-tiles';
import { useAdminT } from '../../_components/common/use-admin-t';
import { AuthorSheet } from './_components/author-sheet';
import { AuthorsTable } from './_components/authors-table';

const CHIPS = ['all', 'active', 'passive', 'thin'] as const;
type Chip = (typeof CHIPS)[number];

function isThin(a: { bio: string | null; credentials: string | null; expertise: string[] }) {
  return !a.bio || !a.credentials || a.expertise.length === 0;
}

export default function Page() {
  const t = useAdminT('admin.authors');
  const tc = useAdminT('admin.common');
  const { data, isLoading } = useListAuthorsAdminQuery({ active: 'all', limit: 500 });
  const [q, setQ] = useState('');
  const [chip, setChip] = useState<Chip>('all');
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = data?.items ?? [];
  const stats = useMemo(() => ({ total: rows.length, active: rows.filter((r) => r.isActive).length, thin: rows.filter(isThin).length }), [rows]);
  const visible = useMemo(() => {
    const term = q.trim().toLocaleLowerCase('tr');
    return rows.filter((r) => {
      if (term && !`${r.fullName} ${r.slug} ${r.title ?? ''} ${r.expertise.join(' ')}`.toLocaleLowerCase('tr').includes(term)) return false;
      if (chip === 'active') return r.isActive;
      if (chip === 'passive') return !r.isActive;
      if (chip === 'thin') return isThin(r);
      return true;
    }).sort((a, b) => a.displayOrder - b.displayOrder || a.fullName.localeCompare(b.fullName, 'tr'));
  }, [rows, q, chip]);
  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild><Link href="/admin/authors/new"><Plus className="size-4" /> {t('new')}</Link></Button>
      </div>

      <SummaryTiles columns="sm:grid-cols-3" tiles={[
        { key: 'total', label: t('tiles.total'), value: stats.total, active: chip === 'all', onClick: () => setChip('all') },
        { key: 'active', label: t('tiles.active'), value: stats.active, hint: t('tiles.activeHint'), tone: 'text-emerald-600', active: chip === 'active', onClick: () => setChip('active') },
        { key: 'thin', label: t('tiles.thin'), value: stats.thin, hint: t('tiles.thinHint'), tone: stats.thin ? 'text-amber-600' : '', active: chip === 'thin', onClick: () => setChip('thin') },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {CHIPS.map((k) => <Button key={k} size="sm" variant={chip === k ? 'default' : 'outline'} onClick={() => setChip(k)}>{t(`chips.${k}`)}</Button>)}
        {q || chip !== 'all' ? <Button variant="ghost" size="sm" onClick={() => { setQ(''); setChip('all'); }}><X className="size-3.5" /> {tc('clear')}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
      </div>

      <AuthorsTable rows={visible} loading={isLoading} activeId={openId ?? undefined} onSelect={(r) => setOpenId(r.id)} t={t} tc={tc} />
      <AuthorSheet row={open} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
