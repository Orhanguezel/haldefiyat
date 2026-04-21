'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/contacts/_components/admin-contacts-client.tsx
// Admin Contacts
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Search, Trash2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

import {
  ADMIN_CONTACTS_DEFAULT_FILTERS,
  ADMIN_CONTACTS_ORDER_BY_OPTIONS,
  ADMIN_CONTACTS_ORDER_OPTIONS,
  ADMIN_CONTACTS_STATUS_OPTIONS,
  buildAdminContactsListParams,
  createAdminContactEditState,
  formatAdminContactDateYmd,
  getAdminContactStatusKey,
  getAdminContactStatusVariant,
  type AdminContactsEditState,
  type AdminContactsFilters,
  type ContactView,
  type ContactStatus,
} from '@/integrations/shared';
import {
  useListContactsAdminQuery,
  useUpdateContactAdminMutation,
  useDeleteContactAdminMutation,
} from '@/integrations/hooks';

export default function AdminContactsClient() {
  const t = useAdminT('admin.contacts');

  const [filters, setFilters] = React.useState<AdminContactsFilters>(ADMIN_CONTACTS_DEFAULT_FILTERS);

  const listParams = React.useMemo(
    () => buildAdminContactsListParams(filters),
    [filters],
  );

  const listQ = useListContactsAdminQuery(listParams, { refetchOnMountOrArgChange: true });

  const [rows, setRows] = React.useState<ContactView[]>([]);
  React.useEffect(() => {
    const d = listQ.data;
    setRows(Array.isArray(d) ? (d as ContactView[]) : []);
  }, [listQ.data]);

  const [updateContact, updateState] = useUpdateContactAdminMutation();
  const [removeContact, removeState] = useDeleteContactAdminMutation();

  const listBusy = listQ.isLoading || listQ.isFetching;
  const busy = listBusy || updateState.isLoading || removeState.isLoading;

  const [editOpen, setEditOpen] = React.useState(false);
  const [editState, setEditState] = React.useState<AdminContactsEditState | null>(null);
  const [selected, setSelected] = React.useState<ContactView | null>(null);

  function openEdit(item: ContactView) {
    setEditState(createAdminContactEditState(item));
    setSelected(item);
    setEditOpen(true);
  }

  function closeEdit() {
    if (busy) return;
    setEditOpen(false);
    setEditState(null);
    setSelected(null);
  }

  async function onSaveEdit() {
    if (!editState) return;
    try {
      await updateContact({
        id: editState.id,
        patch: {
          status: editState.status,
          is_resolved: editState.is_resolved,
          admin_note: editState.admin_note.trim() || null,
        },
      }).unwrap();
      toast.success(t('messages.saved'));
      closeEdit();
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.saveError'));
    }
  }

  async function onDelete(item: ContactView) {
    const msg = t('confirmDelete', {
      name: item.name,
      email: item.email,
      subject: item.subject,
      id: item.id,
    });
    if (!window.confirm(msg)) return;

    try {
      await removeContact(item.id).unwrap();
      toast.success(t('messages.deleted'));
      listQ.refetch();
    } catch (err: any) {
      toast.error(err?.data?.error?.message || err?.message || t('messages.deleteError'));
    }
  }

  const statusLabel = React.useCallback(
    (s: ContactStatus) => {
      return t(`status.${getAdminContactStatusKey(s)}`);
    },
    [t],
  );

  const statusBadge = React.useCallback(
    (s: ContactStatus) => {
      return <Badge variant={getAdminContactStatusVariant(s)}>{statusLabel(s)}</Badge>;
    },
    [statusLabel],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{t('header.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('header.subtitle')}</p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => listQ.refetch()}
          disabled={busy}
        >
          <RefreshCcw className="mr-2 size-4" />
          {t('admin.common.refresh')}
        </Button>
      </div>

      {listQ.error ? (
        <div className="rounded-lg border bg-card p-3 text-sm text-destructive">
          {t('messages.loadError')}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('filters.title')}</CardTitle>
          <CardDescription>{t('filters.description')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>{t('admin.common.search')}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder={t('filters.searchPlaceholder')}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('filters.statusLabel')}</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, status: v === 'all' ? '' : (v as ContactStatus) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filters.statusAll')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
                {ADMIN_CONTACTS_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`filters.${option.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('filters.orderByLabel')}</Label>
            <Select
              value={filters.orderBy}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, orderBy: v as AdminContactsFilters['orderBy'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_CONTACTS_ORDER_BY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`filters.${option.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('filters.orderLabel')}</Label>
            <Select
              value={filters.order}
              onValueChange={(v) =>
                setFilters((p) => ({ ...p, order: v as AdminContactsFilters['order'] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_CONTACTS_ORDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`filters.${option.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={filters.onlyUnresolved}
              onCheckedChange={(v) => setFilters((p) => ({ ...p, onlyUnresolved: v }))}
            />
            <Label>{t('filters.onlyUnresolved')}</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-base">{t('list.title')}</CardTitle>
          <CardDescription>{t('list.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.email')}</TableHead>
                <TableHead>{t('columns.subject')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead>{t('columns.createdAt')}</TableHead>
                <TableHead className="text-right">{t('admin.common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && listBusy && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {t('list.loading')}
                  </TableCell>
                </TableRow>
              )}

              {rows.length === 0 && !listBusy && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    {t('list.empty')}
                  </TableCell>
                </TableRow>
              )}

              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>
                    {statusBadge(item.status)}
                  </TableCell>
                  <TableCell>{formatAdminContactDateYmd(item.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(item)}
                        disabled={busy}
                      >
                        <Pencil className="mr-2 size-4" />
                        {t('admin.common.edit')}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(item)}
                        disabled={busy}
                      >
                        <Trash2 className="mr-2 size-4" />
                        {t('admin.common.delete')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(v) => (v ? null : closeEdit())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editDialog.title')}</DialogTitle>
            <DialogDescription>{t('editDialog.description')}</DialogDescription>
          </DialogHeader>

          {editState && (
            <div className="grid gap-4">
              {selected ? (
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="text-xs text-muted-foreground">{t('details.title')}</div>
                  <div className="grid gap-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('details.name')}:</span>{' '}
                      <span className="font-medium">{selected.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('details.email')}:</span>{' '}
                      <span className="font-medium">{selected.email}</span>
                    </div>
                    {selected.phone ? (
                      <div>
                        <span className="text-muted-foreground">{t('details.phone')}:</span>{' '}
                        <span className="font-medium">{selected.phone}</span>
                      </div>
                    ) : null}
                    <div>
                      <span className="text-muted-foreground">{t('details.subject')}:</span>{' '}
                      <span className="font-medium">{selected.subject}</span>
                    </div>
                    <div className="text-muted-foreground">{t('details.message')}:</div>
                    <div className="whitespace-pre-wrap break-words rounded-md border bg-background p-2 text-sm">
                      {selected.message || t('details.emptyMessage')}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        {t('details.createdAt')}: <code>{formatAdminContactDateYmd(selected.created_at)}</code>
                      </span>
                      <span>
                        {t('details.updatedAt')}: <code>{formatAdminContactDateYmd(selected.updated_at)}</code>
                      </span>
                      <span>
                        {t('details.id')}: <code>{selected.id}</code>
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>{t('editDialog.statusLabel')}</Label>
                <Select
                  value={editState.status}
                  onValueChange={(v) =>
                    setEditState((p) => (p ? { ...p, status: v as ContactStatus } : p))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_CONTACTS_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`filters.${option.labelKey}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editState.is_resolved}
                  onCheckedChange={(v) =>
                    setEditState((p) => (p ? { ...p, is_resolved: v } : p))
                  }
                />
                <Label>{t('editDialog.resolvedLabel')}</Label>
              </div>

              <div className="space-y-2">
                <Label>{t('editDialog.adminNoteLabel')}</Label>
                <Textarea
                  value={editState.admin_note}
                  onChange={(e) =>
                    setEditState((p) => (p ? { ...p, admin_note: e.target.value } : p))
                  }
                  placeholder={t('editDialog.adminNotePlaceholder')}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={busy}>
              {t('admin.common.cancel')}
            </Button>
            <Button onClick={onSaveEdit} disabled={busy || !editState}>
              {t('admin.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
