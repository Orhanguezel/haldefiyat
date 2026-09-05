'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { SummaryTiles } from '@/app/(main)/admin/_components/common/summary-tiles';
import { useDeleteContactAdminMutation, useListContactsAdminQuery, useReplyContactAdminMutation, useUpdateContactAdminMutation } from '@/integrations/hooks';
import {
  ADMIN_CONTACTS_DEFAULT_FILTERS, ADMIN_CONTACTS_ORDER_BY_OPTIONS, ADMIN_CONTACTS_STATUS_OPTIONS, buildAdminContactsListParams,
  formatAdminContactDateYmd, getAdminContactStatusKey, getAdminContactStatusVariant, type AdminContactsFilters, type ContactStatus, type ContactView,
} from '@/integrations/shared';

// Marka/alan adi koda gomulmez — dagitim ortaminin .env'inden gelir.
const DEFAULT_REPLY_TO = process.env.NEXT_PUBLIC_CONTACT_REPLY_TO ?? '';
const ALL = 'all';

function errMsg(err: unknown, fallback: string) {
  const e = err as { data?: { error?: { message?: string } | string }; message?: string };
  const m = typeof e?.data?.error === 'string' ? e.data.error : e?.data?.error?.message;
  return m || e?.message || fallback;
}

export default function AdminContactsClient() {
  const t = useAdminT('admin.contacts');
  const tc = useAdminT('admin.common');
  const [filters, setFilters] = useState<AdminContactsFilters>(ADMIN_CONTACTS_DEFAULT_FILTERS);
  const listQ = useListContactsAdminQuery(useMemo(() => buildAdminContactsListParams(filters), [filters]), { refetchOnMountOrArgChange: true });
  const rows = useMemo(() => (Array.isArray(listQ.data) ? (listQ.data as ContactView[]) : []), [listQ.data]);
  const [updateContact, upd] = useUpdateContactAdminMutation();
  const [removeContact, rm] = useDeleteContactAdminMutation();
  const [replyContact, rp] = useReplyContactAdminMutation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ContactView | null>(null);
  const open = rows.find((r) => r.id === openId) ?? null;
  const [edit, setEdit] = useState({ status: 'new' as ContactStatus, is_resolved: false, admin_note: '' });
  const [reply, setReply] = useState({ subject: '', message: '', replyTo: DEFAULT_REPLY_TO });
  const busy = upd.isLoading || rm.isLoading || rp.isLoading;
  // biome-ignore lint/correctness/useExhaustiveDependencies: form yalniz baska kayit acilinca sifirlanir
  useEffect(() => {
    if (!open) return;
    setEdit({ status: open.status, is_resolved: open.is_resolved, admin_note: open.admin_note ?? '' });
    setReply({ subject: open.subject ? `Re: ${open.subject}` : 'Re: ', message: '', replyTo: DEFAULT_REPLY_TO });
  }, [openId]);

  const stats = useMemo(() => ({
    total: rows.length,
    unresolved: rows.filter((r) => !r.is_resolved).length,
    fresh: rows.filter((r) => r.status === 'new').length,
    inProgress: rows.filter((r) => r.status === 'in_progress').length,
    closed: rows.filter((r) => r.status === 'closed').length,
  }), [rows]);
  const patch = (p: Partial<AdminContactsFilters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.search || filters.status || filters.onlyUnresolved;

  async function save() {
    if (!open) return;
    try {
      await updateContact({ id: open.id, patch: { status: edit.status, is_resolved: edit.is_resolved, admin_note: edit.admin_note.trim() || null } }).unwrap();
      toast.success(t('messages.saved'));
    } catch (err) { toast.error(errMsg(err, t('messages.saveError'))); }
  }
  async function send() {
    if (!open) return;
    if (!reply.subject.trim()) { toast.error(t('reply.subjectRequired')); return; }
    if (reply.message.trim().length < 10) { toast.error(t('reply.messageRequired')); return; }
    try {
      await replyContact({ id: open.id, payload: { subject: reply.subject.trim(), message: reply.message.trim(), replyTo: reply.replyTo.trim() || null } }).unwrap();
      toast.success(t('messages.replied')); setReply((p) => ({ ...p, message: '' }));
    } catch (err) { toast.error(errMsg(err, t('messages.replyError'))); }
  }
  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await removeContact(pendingDelete.id).unwrap();
      toast.success(t('messages.deleted')); if (openId === pendingDelete.id) setOpenId(null);
    } catch (err) { toast.error(errMsg(err, t('messages.deleteError'))); }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">{t('header.title')}</h1><p className="text-sm text-muted-foreground">{t('header.subtitle')}</p></div>
        <Button variant="outline" onClick={() => listQ.refetch()} disabled={listQ.isFetching}><RefreshCcw className={`size-4 ${listQ.isFetching ? 'animate-spin' : ''}`} /> {tc('refresh')}</Button>
      </div>
      {listQ.error ? <div className="rounded-lg border p-3 text-sm text-destructive">{t('messages.loadError')}</div> : null}

      <SummaryTiles columns="sm:grid-cols-3 xl:grid-cols-5" tiles={[
        { key: 'total', label: t('tiles.total'), value: stats.total, active: !filters.status && !filters.onlyUnresolved, onClick: () => patch({ status: '', onlyUnresolved: false }) },
        { key: 'unresolved', label: t('filters.onlyUnresolved'), value: stats.unresolved, tone: stats.unresolved ? 'text-amber-600' : '', active: filters.onlyUnresolved, onClick: () => patch({ onlyUnresolved: !filters.onlyUnresolved }) },
        { key: 'new', label: t('status.new'), value: stats.fresh, active: filters.status === 'new', onClick: () => patch({ status: 'new' }) },
        { key: 'inProgress', label: t('status.inProgress'), value: stats.inProgress, active: filters.status === 'in_progress', onClick: () => patch({ status: 'in_progress' }) },
        { key: 'closed', label: t('status.closed'), value: stats.closed, tone: 'text-emerald-600', active: filters.status === 'closed', onClick: () => patch({ status: 'closed' }) },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={filters.search} onChange={(e) => patch({ search: e.target.value })} placeholder={t('filters.searchPlaceholder')} />
        </div>
        <Select value={filters.status || ALL} onValueChange={(v) => patch({ status: v === ALL ? '' : (v as ContactStatus) })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('filters.statusAll')}</SelectItem>{ADMIN_CONTACTS_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(`filters.${o.labelKey}`)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={`${filters.orderBy}:${filters.order}`} onValueChange={(v) => { const [orderBy, order] = v.split(':'); patch({ orderBy: orderBy as AdminContactsFilters['orderBy'], order: order as AdminContactsFilters['order'] }); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{ADMIN_CONTACTS_ORDER_BY_OPTIONS.flatMap((o) => (['desc', 'asc'] as const).map((dir) => <SelectItem key={`${o.value}:${dir}`} value={`${o.value}:${dir}`}>{t(`filters.${o.labelKey}`)} · {t(dir === 'desc' ? 'filters.orderDesc' : 'filters.orderAsc')}</SelectItem>))}</SelectContent>
        </Select>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(ADMIN_CONTACTS_DEFAULT_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{tc('rowCount', { count: rows.length })}</span>
      </div>

      {listQ.isFetching && !rows.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('list.loading')}</div>
        : !rows.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('list.empty')}</div> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[220px]">{t('columns.name')}</TableHead>
              <TableHead className="min-w-[320px]">{t('columns.subject')}</TableHead>
              <TableHead className="w-32">{t('columns.status')}</TableHead>
              <TableHead className="w-28">{t('columns.createdAt')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} onClick={() => setOpenId(r.id)} className={`cursor-pointer ${openId === r.id ? 'bg-primary/5' : ''}`}>
                  <TableCell className="py-2.5"><div className="font-medium">{r.name}</div><div className="truncate text-xs text-muted-foreground">{r.email}{r.phone ? ` · ${r.phone}` : ''}</div></TableCell>
                  <TableCell className="py-2.5"><div className="truncate font-medium">{r.subject}</div><div className="line-clamp-1 text-xs text-muted-foreground">{r.message}</div></TableCell>
                  <TableCell><div className="flex items-center gap-1.5"><Badge variant={getAdminContactStatusVariant(r.status)} className="font-normal">{t(`status.${getAdminContactStatusKey(r.status)}`)}</Badge>{r.is_resolved ? <span className="size-2 rounded-full bg-emerald-500" title={t('editDialog.resolvedLabel')} /> : null}</div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatAdminContactDateYmd(r.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(next) => { if (!next) setOpenId(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{open.subject}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={getAdminContactStatusVariant(open.status)} className="font-normal">{t(`status.${getAdminContactStatusKey(open.status)}`)}</Badge>
                  <span>{open.name}</span><span aria-hidden>·</span><span>{open.email}</span>{open.phone ? <><span aria-hidden>·</span><span>{open.phone}</span></> : null}<span aria-hidden>·</span><span>{formatAdminContactDateYmd(open.created_at)}</span>
                </SheetDescription>
              </SheetHeader>
              <Tabs defaultValue="message" className="flex min-h-0 flex-1 flex-col">
                <div className="border-b px-6 pt-3"><TabsList><TabsTrigger value="message">{t('details.title')}</TabsTrigger><TabsTrigger value="reply">{t('reply.title')}</TabsTrigger></TabsList></div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <TabsContent value="message" className="mt-0 space-y-4">
                    <div className="whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 text-sm leading-6">{open.message || t('details.emptyMessage')}</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5"><Label className="text-sm">{t('editDialog.statusLabel')}</Label>
                        <Select value={edit.status} onValueChange={(v) => setEdit((p) => ({ ...p, status: v as ContactStatus }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ADMIN_CONTACTS_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(`filters.${o.labelKey}`)}</SelectItem>)}</SelectContent></Select></div>
                      <div className="flex items-center justify-between rounded-md border p-3"><Label className="text-sm">{t('editDialog.resolvedLabel')}</Label><Switch checked={edit.is_resolved} onCheckedChange={(v) => setEdit((p) => ({ ...p, is_resolved: v }))} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-sm">{t('editDialog.adminNoteLabel')}</Label><Textarea rows={4} value={edit.admin_note} onChange={(e) => setEdit((p) => ({ ...p, admin_note: e.target.value }))} placeholder={t('editDialog.adminNotePlaceholder')} /></div>
                    <p className="text-xs text-muted-foreground">{t('details.id')}: <code>{open.id}</code> · {t('details.updatedAt')}: {formatAdminContactDateYmd(open.updated_at)}</p>
                  </TabsContent>
                  <TabsContent value="reply" className="mt-0 space-y-3">
                    <p className="text-xs text-muted-foreground">{t('reply.description')}</p>
                    <div className="space-y-1.5"><Label className="text-sm">{t('reply.subjectLabel')}</Label><Input value={reply.subject} onChange={(e) => setReply((p) => ({ ...p, subject: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label className="text-sm">{t('reply.messageLabel')}</Label><Textarea rows={10} value={reply.message} onChange={(e) => setReply((p) => ({ ...p, message: e.target.value }))} placeholder={t('reply.messagePlaceholder', { name: open.name })} /></div>
                    <div className="space-y-1.5"><Label className="text-sm">{t('reply.replyToLabel')}</Label><Input type="email" value={reply.replyTo} onChange={(e) => setReply((p) => ({ ...p, replyTo: e.target.value }))} placeholder={t('reply.replyToPlaceholder')} /></div>
                    <div className="flex justify-end"><Button onClick={send} disabled={busy || !reply.subject.trim() || reply.message.trim().length < 10}><Send className="size-3.5" /> {rp.isLoading ? t('reply.sending') : t('reply.sendButton')}</Button></div>
                  </TabsContent>
                </div>
              </Tabs>
              <SheetFooter className="border-t px-6 py-3">
                <div className="flex w-full items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDelete(open)} disabled={busy}><Trash2 className="size-3.5" /> {tc('delete')}</Button>
                  <span className="flex-1" />
                  <Button variant="outline" onClick={() => setOpenId(null)}>{tc('close')}</Button>
                  <Button onClick={save} disabled={busy}>{upd.isLoading ? tc('saving') : tc('save')}</Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{tc('delete')}</AlertDialogTitle><AlertDialogDescription>{pendingDelete ? t('confirmDelete', { name: pendingDelete.name, email: pendingDelete.email, subject: pendingDelete.subject, id: pendingDelete.id }) : ''}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>{tc('delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
