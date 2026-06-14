// =============================================================
// FILE: src/app/(main)/admin/(admin)/gtm/gtm.tsx
// Google Tag Manager — etiket/tetikleyici/değişken listele + yayınla
// =============================================================

'use client';

import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGtmOverviewQuery, useGtmPublishMutation, useGtmStatusQuery } from '@/integrations/hooks';
import { getErrorMessage, type GtmItem } from '@/integrations/shared';

function ItemTable({ rows, t }: { rows: GtmItem[]; t: (k: string) => string }) {
  if (!rows.length) return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b text-left text-muted-foreground text-xs">
            <th className="py-1.5 pr-3">{t('cols.name')}</th>
            <th className="py-1.5 pr-3">{t('cols.type')}</th>
            <th className="py-1.5 text-right">{t('cols.status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-border/60 border-b">
              <td className="py-1.5 pr-3 font-medium">{r.name}</td>
              <td className="py-1.5 pr-3 text-muted-foreground text-xs">{r.type}</td>
              <td className="py-1.5 text-right">
                <Badge variant={r.paused ? 'secondary' : 'default'}>{r.paused ? t('paused') : t('active')}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GtmPage() {
  const t = useAdminT('admin.gtm');
  const { data: status } = useGtmStatusQuery();
  const { data: ov } = useGtmOverviewQuery();
  const [publish, { isLoading: publishing }] = useGtmPublishMutation();

  const handlePublish = async () => {
    try {
      const res = await publish().unwrap();
      toast.success(t('published').replace('{v}', res.version));
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg.includes('no_version') ? t('noChanges') : `${t('publishFailed')}: ${msg}`);
    }
  };

  const container = status?.container ?? ov?.container ?? null;
  const empty = (ov?.tags?.length ?? 0) === 0 && (ov?.triggers?.length ?? 0) === 0 && (ov?.variables?.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{t('title')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant={status?.connected ? 'default' : 'destructive'}>
                {status?.connected ? t('connected') : t('disconnected')}
              </Badge>
              {container ? <Badge variant="outline">{container.public_id} · {container.name}</Badge> : null}
            </div>
          </div>
          <Button size="sm" onClick={handlePublish} disabled={publishing}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {publishing ? t('publishing') : t('publish')}
          </Button>
        </CardHeader>
      </Card>

      {empty ? (
        <Card className="border-emerald-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t('intentionalTitle')}</CardTitle>
            <CardDescription>{t('intentionalBody')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="font-medium text-xs text-muted-foreground uppercase tracking-wide">{t('directTitle')}</div>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2"><Badge variant="default">GA4</Badge>{t('directGa4')}</li>
              <li className="flex items-center gap-2"><Badge variant="default">Ads</Badge>{t('directAds')}</li>
              <li className="flex items-center gap-2"><Badge variant="secondary">Meta</Badge>{t('directMeta')}</li>
            </ul>
            <p className="text-muted-foreground text-xs">{t('directNote')}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('tags')} ({ov?.tags?.length ?? 0})</CardTitle></CardHeader>
        <CardContent><ItemTable rows={ov?.tags ?? []} t={t} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('triggers')} ({ov?.triggers?.length ?? 0})</CardTitle></CardHeader>
        <CardContent><ItemTable rows={ov?.triggers ?? []} t={t} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('variables')} ({ov?.variables?.length ?? 0})</CardTitle></CardHeader>
        <CardContent><ItemTable rows={ov?.variables ?? []} t={t} /></CardContent>
      </Card>
    </div>
  );
}
