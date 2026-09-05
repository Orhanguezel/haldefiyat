'use client';

import { useMemo, useState } from 'react';
import { Eye, Mail, RefreshCcw, Search, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { SummaryTiles } from '@/app/(main)/admin/_components/common/summary-tiles';
import { useDeleteNewsletterAdminMutation, useListNewsletterAdminQuery, useNewsletterFunnelAdminQuery, usePreviewWeeklyMailAdminQuery, useSendWeeklyMailAdminMutation, useSendWeeklyMailTestAdminMutation } from '@/integrations/hooks';
import { formatNewsletterDate, getNewsletterStatus, type NewsletterSubscriber } from '@/integrations/shared';
import { NewsletterFunnelPanel } from './newsletter-funnel-panel';
import { NewsletterSendsPanel } from './newsletter-sends-panel';

const CHIPS = ['all', 'active', 'unsubscribed', 'unverified'] as const;
type Chip = (typeof CHIPS)[number];

export default function AdminNewsletterClient() {
  const t = useAdminT('admin.newsletter');
  const tc = useAdminT('admin.common');
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<Chip>('all');
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<NewsletterSubscriber | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const { data, isLoading, isFetching, refetch } = useListNewsletterAdminQuery(search ? { q: search } : undefined);
  const { data: funnel } = useNewsletterFunnelAdminQuery();
  const [deleteSubscriber] = useDeleteNewsletterAdminMutation();
  const [sendTest, { isLoading: sendingTest }] = useSendWeeklyMailTestAdminMutation();
  const [sendAll, { isLoading: sendingAll }] = useSendWeeklyMailAdminMutation();
  const { data: previewHtml, isFetching: previewLoading } = usePreviewWeeklyMailAdminQuery(undefined, { skip: !showPreview });
  const subscribers = data ?? [];
  const visible = useMemo(() => subscribers.filter((s) => {
    if (chip === 'active') return !s.unsubscribed_at;
    if (chip === 'unsubscribed') return Boolean(s.unsubscribed_at);
    if (chip === 'unverified') return !s.is_verified;
    return true;
  }), [subscribers, chip]);

  async function doDelete() {
    if (!pendingDelete) return;
    try { await deleteSubscriber(pendingDelete.id).unwrap(); toast.success(t('toast.deleted')); } catch { toast.error(t('toast.error')); }
    setPendingDelete(null);
  }
  async function doTest() {
    if (!testEmail.includes('@')) return;
    try { const res = await sendTest({ to: testEmail }).unwrap(); res.sent ? toast.success(t('toast.testSent')) : toast.error(t('toast.testFailed')); } catch { toast.error(t('toast.testFailed')); }
  }
  async function doSendAll() {
    setConfirmSend(false);
    try { const res = await sendAll().unwrap(); res.sent ? toast.success(t('toast.sent', { count: res.recipients ?? 0 })) : toast.error(t('toast.sendFailed')); } catch { toast.error(t('toast.sendFailed')); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">{t('header.title')}</h1><p className="text-sm text-muted-foreground">{t('header.subtitle')}</p></div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCcw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} /> {tc('refresh')}</Button>
      </div>

      <SummaryTiles columns="sm:grid-cols-3 xl:grid-cols-5" tiles={[
        { key: 'total', label: t('stats.total'), value: funnel?.total ?? subscribers.length, active: chip === 'all', onClick: () => setChip('all') },
        { key: 'active', label: t('stats.active'), value: funnel?.active ?? subscribers.filter((s) => !s.unsubscribed_at).length, tone: 'text-emerald-600', active: chip === 'active', onClick: () => setChip('active') },
        { key: 'last7', label: t('funnel.last7'), value: funnel?.last7 ?? 0, hint: t('funnel.last30Hint', { count: funnel?.last30 ?? 0 }) },
        { key: 'unsubscribed', label: t('stats.unsubscribed'), value: funnel?.unsubscribed ?? subscribers.filter((s) => Boolean(s.unsubscribed_at)).length, active: chip === 'unsubscribed', onClick: () => setChip('unsubscribed') },
        { key: 'unverified', label: t('stats.unverified'), value: subscribers.filter((s) => !s.is_verified).length, hint: t('stats.unverifiedHint'), active: chip === 'unverified', onClick: () => setChip('unverified') },
      ]} />

      <Tabs defaultValue="subscribers">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="subscribers">{t('tabs.subscribers')}</TabsTrigger>
          <TabsTrigger value="digest">{t('tabs.digest')}</TabsTrigger>
          <TabsTrigger value="sends">{t('tabs.sends')}</TabsTrigger>
          <TabsTrigger value="funnel">{t('tabs.funnel')}</TabsTrigger>
        </TabsList>

        <TabsContent value="subscribers" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search.placeholder')} />
            </div>
            {CHIPS.map((k) => <Button key={k} size="sm" variant={chip === k ? 'default' : 'outline'} onClick={() => setChip(k)}>{k === 'all' ? tc('all') : k === 'unverified' ? t('stats.unverified') : t(`status.${k}`)}</Button>)}
            {search || chip !== 'all' ? <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setChip('all'); }}><X className="size-3.5" /> {tc('clear')}</Button> : null}
            <span className="ml-auto self-center text-sm text-muted-foreground">{tc('rowCount', { count: visible.length })}</span>
          </div>
          {isLoading ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>
            : !visible.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('table.empty')}</div> : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="min-w-[280px]">{t('table.email')}</TableHead><TableHead className="w-28">{t('table.status')}</TableHead><TableHead className="w-20">{t('table.locale')}</TableHead><TableHead className="w-32">{t('table.created')}</TableHead><TableHead className="w-16 text-right">{t('table.actions')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {visible.map((s) => { const status = getNewsletterStatus(s); return (
                    <TableRow key={s.id}>
                      <TableCell className="py-2.5"><div className="font-medium">{s.email}</div>{!s.is_verified ? <div className="text-xs text-amber-600">{t('stats.unverified')}</div> : null}</TableCell>
                      <TableCell><Badge variant={status === 'active' ? 'default' : 'secondary'} className="font-normal">{t(`status.${status}`)}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.locale ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatNewsletterDate(s.created_at)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => setPendingDelete(s)} aria-label={t('actions.delete')}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ); })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="digest" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Mail className="size-4" />{t('digest.title')}</CardTitle><CardDescription>{t('digest.description')}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}><Eye className="size-4" /> {t('digest.preview')}</Button>
                <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder={t('digest.testPlaceholder')} className="h-9 w-56" />
                <Button variant="outline" size="sm" onClick={doTest} disabled={sendingTest || !testEmail.includes('@')}><Send className="size-4" /> {t('digest.test')}</Button>
                <Button size="sm" className="ml-auto" onClick={() => setConfirmSend(true)} disabled={sendingAll}><Send className="size-4" /> {t('digest.send')}</Button>
              </div>
              {showPreview ? (
                <div className="overflow-hidden rounded-lg border">
                  {previewLoading ? <div className="p-6 text-center text-sm text-muted-foreground">{t('digest.previewLoading')}</div>
                    : previewHtml ? <iframe title="preview" srcDoc={previewHtml} className="h-[480px] w-full bg-white" />
                    : <div className="p-6 text-center text-sm text-muted-foreground">{t('digest.previewEmpty')}</div>}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sends" className="mt-4"><NewsletterSendsPanel /></TabsContent>
        <TabsContent value="funnel" className="mt-4"><NewsletterFunnelPanel t={t} tc={tc} /></TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('actions.delete')}</AlertDialogTitle><AlertDialogDescription>{t('actions.deleteConfirm')} {pendingDelete?.email}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel><AlertDialogAction onClick={doDelete}>{tc('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmSend} onOpenChange={setConfirmSend}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t('digest.send')}</AlertDialogTitle><AlertDialogDescription>{t('digest.sendConfirm')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel><AlertDialogAction onClick={doSendAll}>{t('digest.send')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
