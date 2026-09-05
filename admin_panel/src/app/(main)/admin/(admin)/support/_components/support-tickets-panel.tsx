'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { SummaryTiles } from '@/app/(main)/admin/_components/common/summary-tiles';
import { useDeleteSupportTicketAdminMutation, useListSupportTicketsAdminQuery, useUpdateSupportTicketAdminMutation } from '@/integrations/hooks';
import { buildSupportTicketsListQueryParams, getTicketPriorityVariant, getTicketStatusVariant, type SupportTicketDto, type TicketPriority, type TicketStatus } from '@/integrations/shared';

const ALL = 'all';
const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES: TicketPriority[] = ['low', 'normal', 'high', 'urgent'];
function shortDate(v: string) { const d = new Date(v); return Number.isNaN(d.getTime()) ? v.slice(0, 10) : d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }

export default function SupportTicketsPanel() {
  const t = useAdminT('admin.support');
  const tc = useAdminT('admin.common');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [priority, setPriority] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SupportTicketDto | null>(null);
  const params = useMemo(() => buildSupportTicketsListQueryParams({ search }), [search]);
  const { data: tickets = [], isFetching, refetch } = useListSupportTicketsAdminQuery(params, { refetchOnMountOrArgChange: true });
  const [update, upd] = useUpdateSupportTicketAdminMutation();
  const [remove] = useDeleteSupportTicketAdminMutation();
  const open = tickets.find((x) => x.id === openId) ?? null;
  const [edit, setEdit] = useState({ status: 'open' as TicketStatus, priority: 'normal' as TicketPriority, admin_note: '' });
  // biome-ignore lint/correctness/useExhaustiveDependencies: form yalniz baska talep acilinca sifirlanir
  useEffect(() => { if (open) setEdit({ status: open.status, priority: open.priority, admin_note: open.admin_note ?? '' }); }, [openId]);

  const visible = useMemo(() => tickets.filter((x) => (status === ALL || x.status === status) && (priority === ALL || x.priority === priority)), [tickets, status, priority]);
  const stats = useMemo(() => ({
    total: tickets.length, open: tickets.filter((x) => x.status === 'open').length, inProgress: tickets.filter((x) => x.status === 'in_progress').length,
    urgent: tickets.filter((x) => (x.priority === 'urgent' || x.priority === 'high') && x.status !== 'closed' && x.status !== 'resolved').length, resolved: tickets.filter((x) => x.status === 'resolved' || x.status === 'closed').length,
  }), [tickets]);

  async function save() {
    if (!open) return;
    try { await update({ id: open.id, body: { status: edit.status, priority: edit.priority, admin_note: edit.admin_note.trim() } }).unwrap(); toast.success(t('tickets.updated')); }
    catch { toast.error(tc('saveFailed')); }
  }
  async function doDelete() {
    if (!pendingDelete) return;
    try { await remove(pendingDelete.id).unwrap(); toast.success(t('tickets.deleted')); if (openId === pendingDelete.id) setOpenId(null); refetch(); }
    catch { toast.error(t('messages.deleteError')); }
    setPendingDelete(null);
  }
  const dirty = search || status !== ALL || priority !== ALL;

  return (
    <div className="space-y-4">
      <SummaryTiles columns="sm:grid-cols-3 xl:grid-cols-5" tiles={[
        { key: 'total', label: t('tickets.tiles.total'), value: stats.total, active: status === ALL, onClick: () => setStatus(ALL) },
        { key: 'open', label: t('ticketStatuses.open'), value: stats.open, tone: stats.open ? 'text-amber-600' : '', active: status === 'open', onClick: () => setStatus('open') },
        { key: 'inProgress', label: t('ticketStatuses.in_progress'), value: stats.inProgress, active: status === 'in_progress', onClick: () => setStatus('in_progress') },
        { key: 'urgent', label: t('tickets.tiles.urgent'), value: stats.urgent, hint: t('tickets.tiles.urgentHint'), tone: stats.urgent ? 'text-rose-600' : '', active: priority === 'urgent', onClick: () => setPriority(priority === 'urgent' ? ALL : 'urgent') },
        { key: 'resolved', label: t('tickets.tiles.resolved'), value: stats.resolved, tone: 'text-emerald-600', active: status === 'resolved', onClick: () => setStatus('resolved') },
      ]} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('tickets.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>{tc('all')}</SelectItem>{STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`ticketStatuses.${k}`)}</SelectItem>)}</SelectContent></Select>
        <Select value={priority} onValueChange={setPriority}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={ALL}>{tc('all')}</SelectItem>{PRIORITIES.map((k) => <SelectItem key={k} value={k}>{t(`ticketPriorities.${k}`)}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} /> {tc('refresh')}</Button>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus(ALL); setPriority(ALL); }}><X className="size-3.5" /> {tc('clear')}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{tc('rowCount', { count: visible.length })}</span>
      </div>
      {isFetching && !tickets.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('tickets.loading')}</div>
        : !visible.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('tickets.empty')}</div> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="min-w-[320px]">{t('tickets.subject')}</TableHead><TableHead className="min-w-[200px]">{t('tickets.name')}</TableHead><TableHead className="w-28">{t('tickets.status')}</TableHead><TableHead className="w-24">{t('tickets.priority')}</TableHead><TableHead className="w-32">{tc('date')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {visible.map((x) => (
                <TableRow key={x.id} onClick={() => setOpenId(x.id)} className={`cursor-pointer ${openId === x.id ? 'bg-primary/5' : ''}`}>
                  <TableCell className="py-2.5"><div className="truncate font-medium">{x.subject}</div><div className="line-clamp-1 text-xs text-muted-foreground">{x.message}</div></TableCell>
                  <TableCell className="py-2.5 text-sm"><div>{x.name}</div><div className="truncate text-xs text-muted-foreground">{x.email}</div></TableCell>
                  <TableCell><Badge variant={getTicketStatusVariant(x.status)} className="font-normal">{t(`ticketStatuses.${x.status}`)}</Badge></TableCell>
                  <TableCell><Badge variant={getTicketPriorityVariant(x.priority)} className="font-normal">{t(`ticketPriorities.${x.priority}`)}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{shortDate(x.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenId(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{open.subject}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={getTicketStatusVariant(open.status)} className="font-normal">{t(`ticketStatuses.${open.status}`)}</Badge>
                  <Badge variant={getTicketPriorityVariant(open.priority)} className="font-normal">{t(`ticketPriorities.${open.priority}`)}</Badge>
                  <span>{open.name}</span><span aria-hidden>·</span><span>{open.email}</span><span aria-hidden>·</span><span>{shortDate(open.created_at)}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="whitespace-pre-wrap break-words rounded-md border bg-muted/40 p-3 text-sm leading-6">{open.message}</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label className="text-sm">{t('tickets.status')}</Label><Select value={edit.status} onValueChange={(v) => setEdit((p) => ({ ...p, status: v as TicketStatus }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`ticketStatuses.${k}`)}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('tickets.priority')}</Label><Select value={edit.priority} onValueChange={(v) => setEdit((p) => ({ ...p, priority: v as TicketPriority }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((k) => <SelectItem key={k} value={k}>{t(`ticketPriorities.${k}`)}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm">{t('tickets.adminNote')}</Label><Textarea rows={4} value={edit.admin_note} onChange={(e) => setEdit((p) => ({ ...p, admin_note: e.target.value }))} placeholder={t('tickets.adminNotePlaceholder')} /></div>
                <p className="text-xs text-muted-foreground">{open.category}{open.ip ? ` · ${open.ip}` : ''}{open.user_agent ? ` · ${open.user_agent.slice(0, 80)}` : ''}</p>
              </div>
              <SheetFooter className="border-t px-6 py-3">
                <div className="flex w-full items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDelete(open)}><Trash2 className="size-3.5" /> {t('tickets.delete')}</Button>
                  <span className="flex-1" />
                  <Button variant="outline" onClick={() => setOpenId(null)}>{tc('close')}</Button>
                  <Button onClick={save} disabled={upd.isLoading}>{upd.isLoading ? tc('saving') : tc('save')}</Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('tickets.delete')}</AlertDialogTitle><AlertDialogDescription>{t('tickets.confirmDelete')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel><AlertDialogAction onClick={doDelete}>{tc('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
