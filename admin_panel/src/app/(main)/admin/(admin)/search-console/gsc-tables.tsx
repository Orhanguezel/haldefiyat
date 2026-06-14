'use client';

import * as React from 'react';
import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatGscCtr, formatGscNumber, formatGscPosition, type GscBreakdownRow, type GscDateRow, type GscIndexItem, type GscRow } from '@/integrations/shared';

type T = (k: string) => string;

export function RowTable({ rows, t, head, onPick }: { rows: GscRow[]; t: T; head: string; onPick?: (key: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-border border-b text-left text-muted-foreground text-xs">
          <th className="py-1.5 pr-3">{head}</th><th className="py-1.5 pr-3 text-right">{t('cols.clicks')}</th>
          <th className="py-1.5 pr-3 text-right">{t('cols.impressions')}</th><th className="py-1.5 pr-3 text-right">{t('cols.ctr')}</th>
          <th className="py-1.5 text-right">{t('cols.position')}</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.key}-${i}`} className="border-border/60 border-b">
              <td className="max-w-[420px] truncate py-1.5 pr-3 font-medium" title={r.key}>
                {onPick ? <Button variant="link" className="h-auto max-w-full truncate p-0 text-left" onClick={() => onPick(r.key)}>{r.key}</Button> : r.key}
              </td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{formatGscNumber(r.clicks)}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{formatGscNumber(r.impressions)}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{formatGscCtr(r.ctr)}</td>
              <td className="py-1.5 text-right tabular-nums">{formatGscPosition(r.position)}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={5} className="py-3 text-muted-foreground text-sm">{t('empty')}</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

export function SeriesChart({ data }: { data: GscDateRow[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis tick={{ fontSize: 11 }} width={42} />
          <Tooltip formatter={(v) => formatGscNumber(Number(v))} />
          <Line type="monotone" dataKey="clicks" stroke="#15803d" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="impressions" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownChart({ data }: { data: GscBreakdownRow[] }) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={data.slice(0, 8)} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis tick={{ fontSize: 11 }} width={42} />
          <Tooltip formatter={(v) => formatGscNumber(Number(v))} />
          <Bar dataKey="clicks" fill="#15803d" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IndexRows({ items, t }: { items: GscIndexItem[]; t: T }) {
  const variant = (c: GscIndexItem['category']) => c === 'indexed' ? 'default' : c === 'issue' ? 'destructive' : 'secondary';
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-border border-b text-left text-muted-foreground text-xs">
          <th className="py-1.5 pr-3">{t('index.url')}</th><th className="py-1.5 pr-3">{t('index.status')}</th>
          <th className="py-1.5 pr-3">{t('index.lastCrawl')}</th><th className="py-1.5">{t('index.recommendation')}</th>
        </tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.url} className="border-border/60 border-b align-top">
              <td className="max-w-[340px] truncate py-2 pr-3 font-medium" title={item.url}>{item.url}</td>
              <td className="py-2 pr-3"><Badge variant={variant(item.category)}>{item.label}</Badge></td>
              <td className="py-2 pr-3 text-muted-foreground">{item.last_crawl ? new Date(item.last_crawl).toLocaleDateString('tr-TR') : '-'}</td>
              <td className="max-w-[420px] py-2 text-muted-foreground">{item.recommendation}</td>
            </tr>
          ))}
          {items.length === 0 ? <tr><td colSpan={4} className="py-3 text-muted-foreground">{t('index.empty')}</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
