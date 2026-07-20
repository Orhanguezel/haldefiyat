'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Mail, RefreshCcw, Send, Trash2, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { NewsletterFunnelPanel } from './newsletter-funnel-panel';
import { NewsletterSendsPanel } from './newsletter-sends-panel';
import {
  useDeleteNewsletterAdminMutation,
  useListNewsletterAdminQuery,
  usePreviewWeeklyMailAdminQuery,
  useSendWeeklyMailAdminMutation,
  useSendWeeklyMailTestAdminMutation,
} from '@/integrations/hooks';
import {
  computeNewsletterStats,
  formatNewsletterDate,
  getNewsletterStatus,
  type NewsletterSubscriber,
} from '@/integrations/shared';

export default function AdminNewsletterClient() {
  const t = useAdminT('admin.newsletter');
  const [search, setSearch] = React.useState('');
  const [testEmail, setTestEmail] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);

  const { data, isLoading, isFetching, refetch } = useListNewsletterAdminQuery(
    search ? { q: search } : undefined,
  );
  const [deleteSubscriber] = useDeleteNewsletterAdminMutation();
  const [sendTest, { isLoading: sendingTest }] = useSendWeeklyMailTestAdminMutation();
  const [sendAll, { isLoading: sendingAll }] = useSendWeeklyMailAdminMutation();
  const { data: previewHtml, isFetching: previewLoading } = usePreviewWeeklyMailAdminQuery(undefined, {
    skip: !showPreview,
  });

  const subscribers: NewsletterSubscriber[] = data ?? [];
  const stats = computeNewsletterStats(subscribers);

  async function handleDelete(s: NewsletterSubscriber) {
    if (!window.confirm(t('actions.deleteConfirm'))) return;
    try {
      await deleteSubscriber(s.id).unwrap();
      toast.success(t('toast.deleted'));
    } catch {
      toast.error(t('toast.error'));
    }
  }

  async function handleTest() {
    if (!testEmail.includes('@')) return;
    try {
      const res = await sendTest({ to: testEmail }).unwrap();
      if (res.sent) toast.success(t('toast.testSent'));
      else toast.error(t('toast.testFailed'));
    } catch {
      toast.error(t('toast.testFailed'));
    }
  }

  async function handleSendAll() {
    if (!window.confirm(t('digest.sendConfirm'))) return;
    try {
      const res = await sendAll().unwrap();
      if (res.sent) toast.success(t('toast.sent', { count: res.recipients ?? 0 }));
      else toast.error(t('toast.sendFailed'));
    } catch {
      toast.error(t('toast.sendFailed'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{t('header.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('header.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {t('actions.refresh')}
        </Button>
      </div>

      <NewsletterFunnelPanel />

      <NewsletterSendsPanel />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t('stats.total')} value={stats.total} />
        <StatCard label={t('stats.active')} value={stats.active} tone="success" />
        <StatCard label={t('stats.unsubscribed')} value={stats.unsubscribed} tone="muted" />
      </div>

      {/* Digest panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            {t('digest.title')}
          </CardTitle>
          <CardDescription>{t('digest.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview((v) => !v)}>
              <Eye className="mr-2 h-4 w-4" />
              {t('digest.preview')}
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder={t('digest.testPlaceholder')}
                className="h-9 w-56"
              />
              <Button variant="outline" size="sm" onClick={handleTest} disabled={sendingTest || !testEmail.includes('@')}>
                <Send className="mr-2 h-4 w-4" />
                {t('digest.test')}
              </Button>
            </div>
            <Button size="sm" onClick={handleSendAll} disabled={sendingAll}>
              <Send className="mr-2 h-4 w-4" />
              {t('digest.send')}
            </Button>
          </div>

          {showPreview && (
            <div className="overflow-hidden rounded-lg border border-border">
              {previewLoading ? (
                <div className="p-6 text-center text-sm text-muted-foreground">{t('digest.previewLoading')}</div>
              ) : previewHtml ? (
                <iframe title="preview" srcDoc={previewHtml} className="h-[480px] w-full bg-white" />
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">{t('digest.previewEmpty')}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriber list */}
      <Card>
        <CardHeader>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search.placeholder')}
            className="h-9 max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.email')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.locale')}</TableHead>
                <TableHead>{t('table.created')}</TableHead>
                <TableHead className="text-right">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    {t('table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((s) => {
                  const status = getNewsletterStatus(s);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.email}</TableCell>
                      <TableCell>
                        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                          {t(`status.${status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.locale ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatNewsletterDate(s.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s)} aria-label={t('actions.delete')}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'muted' }) {
  const color = tone === 'success' ? 'text-emerald-600' : tone === 'muted' ? 'text-muted-foreground' : 'text-foreground';
  return (
    <Card>
      <CardContent className="pt-6">
        <div className={`text-3xl font-bold ${color}`}>{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
