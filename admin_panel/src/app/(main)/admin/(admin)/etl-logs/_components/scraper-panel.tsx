'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScraperStatusAdminQuery } from '@/integrations/hooks';

export function ScraperPanel() {
  const { data, isLoading, isError } = useScraperStatusAdminQuery();

  if (isLoading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Scraper durumu yükleniyor...</CardContent></Card>;
  }
  if (isError || !data) {
    return <Card><CardContent className="py-6 text-sm text-red-600">Scraper durumu alınamadı.</CardContent></Card>;
  }

  const online = data.enabled && data.reachable;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Scraper Mikroservisi (hal-scraper)</CardTitle>
          <Badge className={online ? 'bg-emerald-600' : 'bg-red-600'}>
            {online ? '● Çalışıyor' : data.enabled ? '● Erişilemiyor' : '○ Kapalı'}
          </Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Etkin (SCRAPER_ENABLED)</dt>
              <dd className="font-medium">{data.enabled ? 'Evet' : 'Hayır'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Erişim</dt>
              <dd className="font-medium">{data.reachable ? 'Bağlı' : 'Yok'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gecikme</dt>
              <dd className="font-medium">{data.latencyMs != null ? `${data.latencyMs} ms` : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">URL</dt>
              <dd className="truncate font-mono text-xs" title={data.url ?? ''}>{data.url ?? '-'}</dd>
            </div>
          </dl>

          {data.health && (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(data.health).map(([k, v]) => (
                <Badge key={k} variant="outline" className="font-mono text-xs">
                  {k}: {String(v)}
                </Badge>
              ))}
            </div>
          )}

          {data.error && (
            <p className="mt-4 rounded bg-red-50 px-3 py-2 font-mono text-xs text-red-700">{data.error}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Scraper'a Yönlenen Kaynaklar ({data.sources.length})</CardTitle></CardHeader>
          <CardContent>
            {data.sources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Liste boş (HF_SCRAPER_SOURCES).</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.sources.map((s) => (
                  <Badge key={s} variant="secondary" className="font-mono text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Dynamic Mode (JS Render) ({data.dynamicSources.length})</CardTitle></CardHeader>
          <CardContent>
            {data.dynamicSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Liste boş (HF_SCRAPER_DYNAMIC).</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.dynamicSources.map((s) => (
                  <Badge key={s} className="bg-indigo-600 font-mono text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
