'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListFirmsAdminQuery,
  useListStaleFirmsAdminQuery,
  useRunFirmsEtlAdminMutation,
} from '@/integrations/hooks';

const TYPE_LABELS: Record<string, string> = {
  komisyoncu: 'Komisyoncu',
  soguk_hava: 'Soğuk Hava',
  nakliye: 'Nakliye',
  zirai_ilac: 'Zirai İlaç',
};

export default function FirmsAdminPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('all');
  const [lastRun, setLastRun] = useState<string>('');

  const filters = useMemo(() => ({
    q: q || undefined,
    city: city || undefined,
    type: type === 'all' ? undefined : type,
    limit: 100,
  }), [q, city, type]);

  const { data, isLoading, refetch } = useListFirmsAdminQuery(filters);
  const { data: staleData } = useListStaleFirmsAdminQuery({ days: 45 });
  const [runEtl, { isLoading: isRunning }] = useRunFirmsEtlAdminMutation();

  async function handleDryRun() {
    const result = await runEtl({
      city: city || 'adana',
      type: type === 'all' ? 'komisyoncu' : type as any,
      dryRun: true,
      limit: 100,
      delayMs: 0,
      includeDetails: false,
    }).unwrap();
    setLastRun(`Dry-run: ${result.discovered} firma bulundu.`);
  }

  async function handleRunCity() {
    const result = await runEtl({
      city: city || 'adana',
      type: type === 'all' ? 'komisyoncu' : type as any,
      limit: 250,
      delayMs: 750,
      includeDetails: true,
    }).unwrap();
    setLastRun(`ETL: ${result.discovered} bulundu, ${result.inserted ?? 0} yeni, ${result.updated ?? 0} güncel, ${result.skipped ?? 0} atlandı.`);
    await refetch();
  }

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Toplam" value={summary?.total ?? 0} />
        <Metric title="Aktif" value={summary?.active ?? 0} />
        <Metric title="Stale" value={summary?.stale ?? staleData?.items?.length ?? 0} />
        <Metric title="Sponsor" value={summary?.activeSponsorships ?? 0} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Firma Rehberi</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDryRun} disabled={isRunning}>
              Dry-run
            </Button>
            <Button size="sm" onClick={handleRunCity} disabled={isRunning}>
              İl ETL Çalıştır
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Firma adı, adres, telefon" />
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="İl slug (adana)" />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Tür" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm türler</SelectItem>
                <SelectItem value="komisyoncu">Komisyoncu</SelectItem>
                <SelectItem value="soguk_hava">Soğuk Hava</SelectItem>
                <SelectItem value="nakliye">Nakliye</SelectItem>
                <SelectItem value="zirai_ilac">Zirai İlaç</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lastRun && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {lastRun}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>İl / İlçe</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Son Görülme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>Yükleniyor...</TableCell></TableRow>}
              {(data?.items || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <a className="text-xs text-primary" href={item.sourceUrl} target="_blank" rel="noreferrer">
                      {item.slug}
                    </a>
                  </TableCell>
                  <TableCell>{TYPE_LABELS[item.firmType] ?? item.firmType}</TableCell>
                  <TableCell>{item.citySlug || '-'}{item.districtSlug ? ` / ${item.districtSlug}` : ''}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>{item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleDateString('tr-TR') : '-'}</TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <TableRow><TableCell colSpan={5}>Kayıt bulunamadı.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stale Firma Raporu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>İl</TableHead>
                <TableHead>Son Görülme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(staleData?.items || []).slice(0, 20).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.citySlug || '-'}</TableCell>
                  <TableCell>{item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleDateString('tr-TR') : '-'}</TableCell>
                </TableRow>
              ))}
              {(staleData?.items || []).length === 0 && (
                <TableRow><TableCell colSpan={3}>Stale kayıt yok.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value.toLocaleString('tr-TR')}</div>
      </CardContent>
    </Card>
  );
}
