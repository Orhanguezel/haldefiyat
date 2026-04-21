'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/users/_components/users-list-client.tsx
// Admin Users List
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import {
  ADMIN_USERS_ALL_ROLES,
  ADMIN_USERS_DEFAULT_LIMIT,
  getAdminUserDisplayName,
  getAdminUserPrimaryRole,
  getAdminUserRoleLocaleKey,
  getAdminUsersNextOffset,
  getAdminUsersPreviousOffset,
  pickAdminUsersQuery,
  toAdminUsersSearchParams,
  type UserRoleName,
  type AdminUserView,
  type AdminUsersListParams,
} from '@/integrations/shared';
import { useListUsersAdminQuery } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

export default function UsersListClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const t = useAdminT('admin.users');

  function roleLabel(r: UserRoleName) {
    return t(`roles.${getAdminUserRoleLocaleKey(r)}`);
  }

  function statusBadge(u: AdminUserView) {
    if (!u.is_active) return <Badge variant="destructive">{t('list.table.statusInactive')}</Badge>;
    return <Badge variant="secondary">{t('list.table.statusActive')}</Badge>;
  }

  function displayName(u: Pick<AdminUserView, 'full_name'>) {
    return getAdminUserDisplayName(u, t('list.table.unknownUser'));
  }

  const params = React.useMemo(() => pickAdminUsersQuery(sp), [sp]);
  const usersQ = useListUsersAdminQuery(params);

  // UI state (controlled) – URL ile senkron
  const [q, setQ] = React.useState(params.q ?? '');
  const [role, setRole] = React.useState<UserRoleName | 'all'>((params.role as any) ?? 'all');
  const [onlyActive, setOnlyActive] = React.useState<boolean | 'all'>(
    typeof params.is_active === 'boolean' ? (params.is_active ? true : false) : 'all',
  );

  React.useEffect(() => {
    setQ(params.q ?? '');
    setRole((params.role as any) ?? 'all');
    setOnlyActive(
      typeof params.is_active === 'boolean' ? (params.is_active ? true : false) : 'all',
    );
  }, [params.q, params.role, params.is_active]);

  function apply(next: Partial<AdminUsersListParams>) {
    const merged: AdminUsersListParams = {
      ...params,
      ...next,
      offset: next.offset != null ? next.offset : 0,
    };

    if (!merged.q) delete (merged as any).q;
    if (!merged.role) delete (merged as any).role;
    if (typeof merged.is_active !== 'boolean') delete (merged as any).is_active;

    const qs = toAdminUsersSearchParams(merged);
    router.push(qs ? `/admin/users?${qs}` : `/admin/users`);
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    apply({ q: q.trim() || undefined });
  }

  const limit = params.limit ?? ADMIN_USERS_DEFAULT_LIMIT;
  const offset = params.offset ?? 0;

  const canPrev = offset > 0;
  const canNext = (usersQ.data?.length ?? 0) >= limit;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('list.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('list.description')}
        </p>
      </div>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('list.filters.title')}</CardTitle>
          <CardDescription>{t('list.filters.description')}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="q">{t('list.filters.searchLabel')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t('list.filters.searchPlaceholder')}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="w-full space-y-2 lg:w-56">
              <Label>{t('list.filters.roleLabel')}</Label>
              <Select
                value={role}
                onValueChange={(v) => {
                  const vv = v as UserRoleName | 'all';
                  setRole(vv);
                  apply({ role: vv === 'all' ? undefined : (vv as UserRoleName) });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('list.filters.rolePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('roles.all')}</SelectItem>
                  {ADMIN_USERS_ALL_ROLES.map((roleOption) => (
                    <SelectItem key={roleOption} value={roleOption}>
                      {roleLabel(roleOption)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Label className="text-sm">{t('list.filters.onlyActive')}</Label>
              <Switch
                checked={onlyActive === true}
                onCheckedChange={(v) => {
                  const next = v ? true : 'all';
                  setOnlyActive(next);
                  apply({ is_active: v ? true : undefined });
                }}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={usersQ.isFetching}>
                {t('list.filters.searchButton')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQ('');
                  setRole('all');
                  setOnlyActive('all');
                  router.push('/admin/users');
                }}
                disabled={usersQ.isFetching}
              >
                {t('list.filters.resetButton')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => usersQ.refetch()}
                disabled={usersQ.isFetching}
                title={t('list.filters.refreshButton')}
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('list.table.title')}</CardTitle>
          <CardDescription>
            {usersQ.isFetching
              ? t('list.table.loading')
              : t('list.table.totalRecords', { count: usersQ.data?.length ?? 0 })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {usersQ.isError ? (
            <div className="rounded-md border p-4 text-sm">
              {t('list.table.loadError')}{' '}
              <Button
                variant="link"
                className="px-1"
                onClick={() => {
                  toast.error(t('list.table.loadError'));
                  usersQ.refetch();
                }}
              >
                {t('list.table.retryButton')}
              </Button>
            </div>
          ) : null}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('list.table.fullName')}</TableHead>
                  <TableHead>{t('list.table.email')}</TableHead>
                  <TableHead>{t('list.table.phone')}</TableHead>
                  <TableHead>{t('list.table.status')}</TableHead>
                  <TableHead>{t('list.table.role')}</TableHead>
                  <TableHead className="text-right">{t('list.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {(usersQ.data ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{displayName(u)}</TableCell>
                    <TableCell>{u.email ?? t('list.table.emptyValue')}</TableCell>
                    <TableCell>{u.phone ?? t('list.table.emptyValue')}</TableCell>
                    <TableCell>{statusBadge(u)}</TableCell>
                    <TableCell>
                      <Badge variant={u.roles.includes('admin') ? 'default' : 'secondary'}>
                        {roleLabel(getAdminUserPrimaryRole(u))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link prefetch={false} href={`/admin/users/${encodeURIComponent(u.id)}`}>
                          {t('list.table.viewButton')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!usersQ.isFetching && (usersQ.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      {t('list.table.noRecords')}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {t('list.pagination.offset', { offset })} • {t('list.pagination.limit', { limit })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev || usersQ.isFetching}
                onClick={() => apply({ offset: getAdminUsersPreviousOffset(offset, limit) })}
              >
                <ChevronLeft className="mr-1 size-4" />
                {t('list.pagination.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext || usersQ.isFetching}
                onClick={() => apply({ offset: getAdminUsersNextOffset(offset, limit) })}
              >
                {t('list.pagination.next')}
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
