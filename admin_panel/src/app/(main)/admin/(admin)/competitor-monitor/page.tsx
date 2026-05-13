'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListCompetitorSitesAdminQuery,
  useRunCompetitorCheckAdminMutation,
  useToggleCompetitorSiteAdminMutation,
} from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading, refetch } = useListCompetitorSitesAdminQuery();
  const [runCheck, { isLoading: isRunning }] = useRunCompetitorCheckAdminMutation();
  const [toggleSite] = useToggleCompetitorSiteAdminMutation();
  const [runningKey, setRunningKey] = useState<string | null>(null);

  async function handleRunAll() {
    await runCheck({});
    refetch();
  }

  async function handleRunOne(siteKey: string) {
    setRunningKey(siteKey);
    await runCheck({ siteKey });
    setRunningKey(null);
    refetch();
  }

  async function handleToggle(siteKey: string, currentActive: number) {
    await toggleSite({ siteKey, isActive: currentActive === 1 ? 0 : 1 });
  }

  const sites = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Rakip İzleme</CardTitle>
        <Button size="sm" onClick={handleRunAll} disabled={isRunning}>
          {isRunning ? 'Çalışıyor...' : 'Tümünü Kontrol Et'}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Son Kontrol</TableHead>
              <TableHead>Ürün Sayısı</TableHead>
              <TableHead>Özellikler</TableHead>
              <TableHead>Değişiklik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8}>Yükleniyor...</TableCell>
              </TableRow>
            )}
            {sites.map((site) => {
              const snap = site.lastSnapshot;
              const features = snap?.detectedFeatures
                ? (JSON.parse(snap.detectedFeatures) as string[])
                : [];
              return (
                <TableRow key={site.siteKey}>
                  <TableCell className="font-medium">{site.displayName}</TableCell>
                  <TableCell>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      {site.url.replace(/^https?:\/\//, '')}
                    </a>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {snap?.checkedAt ? String(snap.checkedAt).slice(0, 16).replace('T', ' ') : '—'}
                  </TableCell>
                  <TableCell>{snap?.productCount ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {features.slice(0, 4).map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px] px-1 py-0">
                          {f}
                        </Badge>
                      ))}
                      {features.length > 4 && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          +{features.length - 4}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {snap?.diffSummary ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={site.isActive ? 'default' : 'secondary'}>
                      {site.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={runningKey === site.siteKey}
                        onClick={() => handleRunOne(site.siteKey)}
                      >
                        {runningKey === site.siteKey ? '...' : 'Kontrol'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(site.siteKey, site.isActive)}
                      >
                        {site.isActive ? 'Durdur' : 'Başlat'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
