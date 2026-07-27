'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListEtlLogsAdminQuery } from '@/integrations/hooks';
import type { EtlLogItem } from '@/integrations/endpoints/etl-logs-admin-endpoints';

function StatusBadge({ status }: { status: EtlLogItem['status'] }) {
  const map: Record<EtlLogItem['status'], string> = {
    ok: 'bg-emerald-600',
    partial: 'bg-amber-500',
    error: 'bg-red-600',
  };
  const label: Record<EtlLogItem['status'], string> = { ok: 'OK', partial: 'Kısmi', error: 'Hata' };
  return <Badge className={map[status] ?? 'bg-slate-500'}>{label[status] ?? status}</Badge>;
}

export function LogsPanel({ onlyErrors = false }: { onlyErrors?: boolean }) {
  const { data, isLoading } = useListEtlLogsAdminQuery();
  const logs = data?.logs ?? [];

  const summary = useMemo(() => {
    const s = { ok: 0, partial: 0, error: 0, inserted: 0 };
    for (const l of logs) {
      if (l.status === 'ok') s.ok++;
      else if (l.status === 'partial') s.partial++;
      else if (l.status === 'error') s.error++;
      s.inserted += l.rowsInserted ?? 0;
    }
    return s;
  }, [logs]);

  const rows = onlyErrors ? logs.filter((l) => l.status === 'error' || l.status === 'partial') : logs;

  return (
    <div className="space-y-4">
      {!onlyErrors && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Başarılı" value={summary.ok} tone="emerald" />
          <SummaryCard label="Kısmi" value={summary.partial} tone="amber" />
          <SummaryCard label="Hatalı" value={summary.error} tone="red" />
          <SummaryCard label="Eklenen Satır" value={summary.inserted} tone="slate" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{onlyErrors ? 'Hatalı / Kısmi Çalışmalar' : 'ETL Çalışma Logları (son 100)'}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kaynak</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Çekilen</TableHead>
                <TableHead className="text-right">Eklenen</TableHead>
                <TableHead className="text-right">Atlanan</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Süre</TableHead>
                {onlyErrors && <TableHead>Hata</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={onlyErrors ? 8 : 7}>Yükleniyor...</TableCell></TableRow>}
              {!isLoading && rows.length === 0 && (
                <TableRow><TableCell colSpan={onlyErrors ? 8 : 7} className="text-sm text-muted-foreground">
                  {onlyErrors ? 'Son 100 çalışmada hata yok 🎉' : 'Kayıt yok.'}
                </TableCell></TableRow>
              )}
              {rows.map((item) => (
                <TableRow key={item.id} className={item.status === 'error' ? 'bg-red-50/50' : undefined}>
                  <TableCell className="font-mono text-xs">{item.sourceApi}</TableCell>
                  <TableCell className="whitespace-nowrap">{String(item.runDate).slice(0, 10)}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.rowsFetched ?? '-'}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.rowsInserted ?? '-'}</TableCell>
                  <TableCell className="text-right tabular-nums">{item.rowsSkipped ?? '-'}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{item.durationMs != null ? `${item.durationMs} ms` : '-'}</TableCell>
                  {onlyErrors && (
                    <TableCell className="max-w-md text-xs text-red-700" title={item.errorMsg ?? ''}>
                      <span className="line-clamp-2 font-mono">{item.errorMsg ?? '-'}</span>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!onlyErrors && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hata mesajlarının tamamı için <strong>Hatalar</strong> sekmesine bakın.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'amber' | 'red' | 'slate' }) {
  const border: Record<string, string> = {
    emerald: 'border-emerald-200',
    amber: 'border-amber-200',
    red: 'border-red-200',
    slate: 'border-slate-200',
  };
  const text: Record<string, string> = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
    slate: 'text-slate-700',
  };
  return (
    <div className={`rounded-lg border ${border[tone]} bg-card p-3`}>
      <div className={`text-2xl font-semibold tabular-nums ${text[tone]}`}>{value.toLocaleString('tr-TR')}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
