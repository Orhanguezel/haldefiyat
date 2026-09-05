'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { TranslateFn } from '@/i18n';
import type { BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { useGetAdPaymentAlertsAdminQuery, useGetAdSelfServiceRequestsAdminQuery, useReviewAdSelfServiceRequestAdminMutation } from '@/integrations/hooks';
import { errorMessage, money, shortDate } from '../_lib/banner-meta';

/** Odeme gecikmesi, sorunlu kampanya ve self-servis onay kuyrugu — mudahale gerektirenler. */
export function AlertsPanel({ banners, t, tc }: { banners: BannerAdmin[]; t: TranslateFn; tc: TranslateFn }) {
  const { data: alerts } = useGetAdPaymentAlertsAdminQuery();
  const { data: requests } = useGetAdSelfServiceRequestsAdminQuery({ status: 'pending' });
  const [review, state] = useReviewAdSelfServiceRequestAdminMutation();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const problems = banners.filter((b) => b.lifecycleStatus === 'problem');

  async function decide(id: number, status: 'approved' | 'rejected' | 'revision_requested') {
    const reviewNote = notes[id]?.trim();
    if (!reviewNote) { toast.error(t('alerts.noteRequired')); return; }
    try {
      await review({ id, status, reviewNote }).unwrap();
      setNotes((v) => ({ ...v, [id]: '' }));
      toast.success(t(`alerts.reviewed.${status}`));
    } catch (err) { toast.error(errorMessage(err, tc('saveFailed'))); }
  }

  const empty = !(alerts?.items.length) && !problems.length && !(requests?.items.length);
  return (
    <div className="space-y-4">
      {empty ? <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">{t('alerts.empty')}</div> : null}
      {alerts?.items.length ? (
        <Card className="border-amber-300">
          <CardHeader><CardTitle className="text-base">{t('alerts.paymentTitle')}</CardTitle><CardDescription>{t('alerts.paymentHint')}</CardDescription></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {alerts.items.map((item) => (
              <Link key={item.id} href={`/admin/banners/${item.id}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted/40">
                <div><div className="font-medium">{item.title}</div><div className="text-xs text-muted-foreground">{item.advertiser || t('table.noAdvertiser')} · {t('alerts.owner', { name: item.salesOwner || t('alerts.unassigned') })}</div></div>
                <div className="text-right"><div className="font-semibold text-amber-700">{money(item.totalAmount)}</div><div className="text-xs text-muted-foreground">{shortDate(item.paymentDueAt)}</div></div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {problems.length ? (
        <Card className="border-rose-300">
          <CardHeader><CardTitle className="text-base">{t('alerts.problemTitle')}</CardTitle><CardDescription>{t('alerts.problemHint')}</CardDescription></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {problems.map((b) => <Link key={b.id} href={`/admin/banners/${b.id}`} className="rounded-lg border p-3 hover:bg-muted/40"><div className="font-medium">{b.title}</div><div className="mt-1 text-xs text-muted-foreground">{b.advertiser || t('table.noAdvertiser')} · {b.notes || t('alerts.openQuality')}</div></Link>)}
          </CardContent>
        </Card>
      ) : null}
      {requests?.items.length ? (
        <Card className="border-sky-300">
          <CardHeader><CardTitle className="text-base">{t('alerts.requestsTitle')}</CardTitle><CardDescription>{t('alerts.requestsHint')}</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {requests.items.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><strong>{item.firmName}</strong><p className="text-xs text-muted-foreground">{item.bannerTitle || t('alerts.newCampaign')} · {t(`alerts.requestTypes.${item.requestType}`, undefined, item.requestType)} · {new Date(item.createdAt).toLocaleString('tr-TR')}</p></div>
                  <Badge variant="secondary">{t('alerts.pending')}</Badge>
                </div>
                <p className="mt-2 text-sm">{item.requesterNote || t('alerts.noNote')}</p>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(item.payload, null, 2)}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input className="min-w-64 flex-1" value={notes[item.id] ?? ''} onChange={(e) => setNotes((v) => ({ ...v, [item.id]: e.target.value }))} placeholder={t('alerts.notePlaceholder')} />
                  <Button size="sm" disabled={state.isLoading} onClick={() => void decide(item.id, 'approved')}>{tc('approve')}</Button>
                  <Button size="sm" variant="outline" disabled={state.isLoading} onClick={() => void decide(item.id, 'revision_requested')}>{t('alerts.revision')}</Button>
                  <Button size="sm" variant="destructive" disabled={state.isLoading} onClick={() => void decide(item.id, 'rejected')}>{tc('reject')}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
