'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetCompetitorHistoryAdminQuery,
  useListCompetitorSitesAdminQuery,
  useRunCompetitorCheckAdminMutation,
  useToggleCompetitorSiteAdminMutation,
} from '@/integrations/hooks';

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return String(value).slice(0, 16).replace('T', ' ');
}

function parseFeatures(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function HistoryPanel({ siteKey }: { siteKey: string }) {
  const { data, isLoading } = useGetCompetitorHistoryAdminQuery({ siteKey, limit: 10 });
  const items = data?.items ?? [];

  if (isLoading) {
    return <p className="text-xs text-muted-foreground py-2">Geçmiş yükleniyor…</p>;
  }
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">Bu site için henüz snapshot kaydı yok.</p>;
  }

  // Önce-sonra karşılaştırması: ardışık snapshot'lar arasında productCount değişimini hesapla
  return (
    <div className="border-l-2 border-muted ml-2 pl-4 py-2 space-y-3">
      {items.map((snap, idx) => {
        const next = items[idx + 1]; // listede daha eski olan
        const prodDelta = next?.productCount != null && snap.productCount != null
          ? snap.productCount - next.productCount
          : null;
        const featuresNow = parseFeatures(snap.detectedFeatures);
        const featuresPrev = parseFeatures(next?.detectedFeatures ?? null);
        const featuresAdded = featuresNow.filter((f) => !featuresPrev.includes(f));
        const featuresRemoved = featuresPrev.filter((f) => !featuresNow.includes(f));

        return (
          <div key={snap.id} className="text-xs space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-muted-foreground">{formatDateTime(snap.checkedAt)}</span>
              <Badge variant={snap.scrapeOk === 1 ? 'default' : 'destructive'} className="text-[10px] px-1 py-0">
                {snap.scrapeOk === 1 ? 'OK' : 'HATA'}
              </Badge>
              <span className="text-muted-foreground">
                {snap.productCount ?? '—'} ürün
                {prodDelta != null && prodDelta !== 0 && (
                  <span className={prodDelta > 0 ? 'text-emerald-600 ml-1' : 'text-rose-600 ml-1'}>
                    ({prodDelta > 0 ? '+' : ''}{prodDelta})
                  </span>
                )}
                {snap.marketCount != null && ` · ${snap.marketCount} hal`}
              </span>
            </div>
            {(featuresAdded.length > 0 || featuresRemoved.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {featuresAdded.map((f) => (
                  <Badge key={`add-${f}`} className="text-[10px] px-1 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    + {f}
                  </Badge>
                ))}
                {featuresRemoved.map((f) => (
                  <Badge key={`rem-${f}`} className="text-[10px] px-1 py-0 bg-rose-100 text-rose-700 hover:bg-rose-100">
                    − {f}
                  </Badge>
                ))}
              </div>
            )}
            {snap.diffSummary && (
              <p className="text-muted-foreground italic wrap-break-word">{snap.diffSummary}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Page() {
  const { data, isLoading, refetch } = useListCompetitorSitesAdminQuery();
  const [runCheck, { isLoading: isRunning }] = useRunCompetitorCheckAdminMutation();
  const [toggleSite] = useToggleCompetitorSiteAdminMutation();
  const [runningKey, setRunningKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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

  function handleToggleHistory(siteKey: string) {
    setExpandedKey((prev) => (prev === siteKey ? null : siteKey));
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
              const features = parseFeatures(snap?.detectedFeatures ?? null);
              const isExpanded = expandedKey === site.siteKey;
              return (
                <>
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
                      {formatDateTime(snap?.checkedAt)}
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
                    <TableCell className="max-w-50 truncate text-xs text-muted-foreground">
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
                          onClick={() => handleToggleHistory(site.siteKey)}
                        >
                          {isExpanded ? 'Gizle' : 'Geçmiş'}
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
                  {isExpanded && (
                    <TableRow key={`${site.siteKey}-history`} className="bg-muted/30">
                      <TableCell colSpan={8} className="py-2">
                        <HistoryPanel siteKey={site.siteKey} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
