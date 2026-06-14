'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { formatGa4Date, formatGa4Number, type Ga4DatePoint, type Ga4MetricRow, type Ga4Row } from '@/integrations/shared';

type T = (k: string) => string;

export function Bars({ rows, t }: { rows: Ga4Row[]; t: T }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-muted-foreground text-sm">{t('empty')}</p>;
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li key={`${r.label}-${r.value}`} className="text-sm">
          <div className="flex justify-between gap-2">
            <span className="truncate" title={r.label}>{r.label || '-'}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{formatGa4Number(r.value)}</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded bg-muted">
            <div className="h-1.5 rounded bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TrendChart({ rows, label }: { rows: Ga4DatePoint[]; label: string }) {
  const series = rows.map((d) => ({ ...d, label: formatGa4Date(d.date) }));
  if (!series.length) return null;
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <Tooltip />
          <Area type="monotone" dataKey="sessions" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.18} name={label} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricBarChart({ rows }: { rows: Ga4MetricRow[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={rows.slice(0, 10)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis tick={{ fontSize: 11 }} width={42} />
          <Tooltip formatter={(v) => formatGa4Number(Number(v))} />
          <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MetricTable({ rows, t, action }: { rows: Ga4MetricRow[]; t: T; action?: (name: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-border border-b text-left text-muted-foreground text-xs">
          <th className="py-1.5 pr-3">{t('cols.name')}</th><th className="py-1.5 pr-3">{t('cols.extra')}</th>
          <th className="py-1.5 pr-3 text-right">{t('cols.value')}</th>{action ? <th className="py-1.5 text-right">{t('cols.action')}</th> : null}
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.label}-${r.extra ?? ''}`} className="border-border/60 border-b">
              <td className="max-w-[320px] truncate py-1.5 pr-3 font-medium" title={r.label}>{r.label || '-'}</td>
              <td className="py-1.5 pr-3 text-muted-foreground">{r.extra || '-'}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{formatGa4Number(r.value)}</td>
              {action ? <td className="py-1.5 text-right"><Button variant="link" size="sm" onClick={() => action(r.label)}>{t('events.makeKey')}</Button></td> : null}
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan={action ? 4 : 3} className="py-3 text-muted-foreground">{t('empty')}</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
