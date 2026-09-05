'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCcw, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListUsersAdminQuery } from '@/integrations/hooks';
import {
  ADMIN_USERS_ALL_ROLES, ADMIN_USERS_DEFAULT_LIMIT, getAdminUserDisplayName, getAdminUserPrimaryRole, getAdminUserRoleLocaleKey,
  getAdminUsersNextOffset, getAdminUsersPreviousOffset, pickAdminUsersQuery, toAdminUsersSearchParams, type AdminUsersListParams, type AdminUserView, type UserRoleName,
} from '@/integrations/shared';
import { Pager } from '../../../_components/common/pager';
import { SummaryTiles } from '../../../_components/common/summary-tiles';
import { useAdminT } from '../../../_components/common/use-admin-t';
import UserDetailClient from './user-detail-client';

const ALL = 'all';
function shortDate(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsersListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.users');
  const tc = useAdminT('admin.common');
  const params = useMemo(() => pickAdminUsersQuery(sp), [sp]);
  const usersQ = useListUsersAdminQuery(params);
  const [q, setQ] = useState(params.q ?? '');
  const [openId, setOpenId] = useState<string | null>(null);
  const rows = usersQ.data ?? [];
  const limit = params.limit ?? ADMIN_USERS_DEFAULT_LIMIT;
  const offset = params.offset ?? 0;
  const roleLabel = (r: UserRoleName) => t(`roles.${getAdminUserRoleLocaleKey(r)}`);
  const open = rows.find((u) => u.id === openId) ?? null;

  // Filtreler URL'de yasar: paylasilabilir, geri tusuyla uyumlu.
  function apply(next: Partial<AdminUsersListParams>) {
    const merged: AdminUsersListParams = { ...params, ...next, offset: next.offset != null ? next.offset : 0 };
    if (!merged.q) delete (merged as { q?: string }).q;
    if (!merged.role) delete (merged as { role?: string }).role;
    if (typeof merged.is_active !== 'boolean') delete (merged as { is_active?: boolean }).is_active;
    const qs = toAdminUsersSearchParams(merged);
    router.push(qs ? `/admin/users?${qs}` : '/admin/users');
  }
  const stats = useMemo(() => ({
    loaded: rows.length,
    active: rows.filter((u) => u.is_active).length,
    admins: rows.filter((u) => u.roles.includes('admin')).length,
    unverified: rows.filter((u) => !u.email_verified).length,
    recent: rows.filter((u) => u.last_sign_in_at && Date.now() - new Date(u.last_sign_in_at).getTime() < 7 * 86400000).length,
  }), [rows]);
  const activeFilter = typeof params.is_active === 'boolean' ? String(params.is_active) : ALL;
  const dirty = params.q || params.role || typeof params.is_active === 'boolean';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">{t('list.title')}</h1><p className="text-sm text-muted-foreground">{t('list.description')}</p></div>
        <Button variant="outline" onClick={() => usersQ.refetch()} disabled={usersQ.isFetching}><RefreshCcw className={`size-4 ${usersQ.isFetching ? 'animate-spin' : ''}`} /> {tc('refresh')}</Button>
      </div>

      <SummaryTiles columns="sm:grid-cols-3 xl:grid-cols-5" tiles={[
        { key: 'loaded', label: t('list.tiles.loaded'), value: stats.loaded, hint: t('list.tiles.loadedHint', { limit }), active: activeFilter === ALL && !params.role, onClick: () => apply({ is_active: undefined, role: undefined }) },
        { key: 'active', label: t('list.tiles.active'), value: stats.active, tone: 'text-emerald-600', active: activeFilter === 'true', onClick: () => apply({ is_active: true }) },
        { key: 'admins', label: t('list.tiles.admins'), value: stats.admins, active: params.role === 'admin', onClick: () => apply({ role: 'admin' }) },
        { key: 'unverified', label: t('list.tiles.unverified'), value: stats.unverified, hint: t('list.tiles.unverifiedHint'), tone: stats.unverified ? 'text-amber-600' : '' },
        { key: 'recent', label: t('list.tiles.recent'), value: stats.recent, hint: t('list.tiles.recentHint') },
      ]} />

      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); apply({ q: q.trim() || undefined }); }}>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('list.filters.searchPlaceholder')} />
        </div>
        <Select value={params.role ?? ALL} onValueChange={(v) => apply({ role: v === ALL ? undefined : (v as UserRoleName) })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('roles.all')}</SelectItem>{ADMIN_USERS_ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={(v) => apply({ is_active: v === ALL ? undefined : v === 'true' })}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{tc('all')}</SelectItem><SelectItem value="true">{tc('active')}</SelectItem><SelectItem value="false">{tc('passive')}</SelectItem></SelectContent>
        </Select>
        <Button type="submit" size="sm" variant="outline" disabled={usersQ.isFetching}>{t('list.filters.searchButton')}</Button>
        {dirty ? <Button type="button" variant="ghost" size="sm" onClick={() => { setQ(''); router.push('/admin/users'); }}><X className="size-3.5" /> {tc('clear')}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{t('list.table.totalRecords', { count: rows.length })}</span>
      </form>

      {usersQ.isError ? <div className="rounded-md border p-4 text-sm text-destructive">{t('list.table.loadError')} <Button variant="link" className="px-1" onClick={() => usersQ.refetch()}>{t('list.table.retryButton')}</Button></div> : null}
      {usersQ.isFetching && !rows.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>
        : !rows.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('list.table.noRecords')}</div> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[260px]">{t('list.table.fullName')}</TableHead>
              <TableHead className="w-40">{t('list.table.phone')}</TableHead>
              <TableHead className="w-32">{t('list.table.role')}</TableHead>
              <TableHead className="w-36">{t('list.tiles.recent')}</TableHead>
              <TableHead className="w-28">{t('list.table.status')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((u: AdminUserView) => (
                <TableRow key={u.id} onClick={() => setOpenId(u.id)} className={`cursor-pointer ${openId === u.id ? 'bg-primary/5' : ''}`}>
                  <TableCell className="py-2.5">
                    <div className="font-medium">{getAdminUserDisplayName(u, t('list.table.unknownUser'))}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.email ?? t('list.table.emptyValue')}{!u.email_verified ? ` · ${t('list.tiles.unverified').toLocaleLowerCase('tr')}` : ''}</div>
                  </TableCell>
                  <TableCell className="text-sm">{u.phone ?? t('list.table.emptyValue')}</TableCell>
                  <TableCell><Badge variant={u.roles.includes('admin') ? 'default' : 'secondary'} className="font-normal">{roleLabel(getAdminUserPrimaryRole(u))}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{shortDate(u.last_sign_in_at)}</TableCell>
                  <TableCell><Badge variant={u.is_active ? 'secondary' : 'destructive'} className="font-normal">{u.is_active ? t('list.table.statusActive') : t('list.table.statusInactive')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager page={Math.floor(offset / limit)} pageCount={rows.length >= limit ? Math.floor(offset / limit) + 2 : Math.floor(offset / limit) + 1} onChange={(p) => apply({ offset: p > Math.floor(offset / limit) ? getAdminUsersNextOffset(offset, limit) : getAdminUsersPreviousOffset(offset, limit) })} summary={t('list.pagination.offset', { offset })} tc={tc} />

      <Sheet open={Boolean(open)} onOpenChange={(next) => { if (!next) setOpenId(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{getAdminUserDisplayName(open, t('list.table.unknownUser'))}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={open.is_active ? 'secondary' : 'destructive'} className="font-normal">{open.is_active ? t('list.table.statusActive') : t('list.table.statusInactive')}</Badge>
                  <span>{open.email}</span>
                  <Link href={`/admin/users/${encodeURIComponent(open.id)}`} className="ml-auto inline-flex items-center gap-1 text-primary hover:underline"><ExternalLink className="size-3.5" /> {tc('fullPage')}</Link>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5"><UserDetailClient id={open.id} embedded /></div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
