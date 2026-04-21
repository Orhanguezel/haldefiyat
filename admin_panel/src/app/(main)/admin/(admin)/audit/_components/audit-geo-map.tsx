'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

import type { AuditGeoStatsRowDto } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

const COUNTRY_NAMES: Record<string, string> = {
  TR: 'Türkiye', DE: 'Almanya', US: 'ABD', GB: 'Birleşik Krallık',
  FR: 'Fransa', NL: 'Hollanda', IT: 'İtalya', ES: 'İspanya',
  AT: 'Avusturya', CH: 'İsviçre', BE: 'Belçika', PL: 'Polonya',
  SE: 'İsveç', NO: 'Norveç', DK: 'Danimarka', FI: 'Finlandiya',
  RU: 'Rusya', UA: 'Ukrayna', CN: 'Çin', JP: 'Japonya',
  KR: 'Güney Kore', IN: 'Hindistan', BR: 'Brezilya', CA: 'Kanada',
  AU: 'Avustralya', MX: 'Meksika', SA: 'Suudi Arabistan', AE: 'BAE',
  EG: 'Mısır', ZA: 'Güney Afrika', IR: 'İran', IQ: 'Irak',
  SY: 'Suriye', GR: 'Yunanistan', PT: 'Portekiz', IE: 'İrlanda',
  CZ: 'Çekya', RO: 'Romanya', HU: 'Macaristan', BG: 'Bulgaristan',
  RS: 'Sırbistan', HR: 'Hırvatistan', SK: 'Slovakya', SI: 'Slovenya',
  BA: 'Bosna', AL: 'Arnavutluk', MK: 'K. Makedonya', XK: 'Kosova',
  ME: 'Karadağ', GE: 'Gürcistan', AZ: 'Azerbaycan', AM: 'Ermenistan',
  KZ: 'Kazakistan', UZ: 'Özbekistan', TM: 'Türkmenistan',
  KG: 'Kırgızistan', TJ: 'Tacikistan', PK: 'Pakistan', BD: 'Bangladeş',
  ID: 'Endonezya', MY: 'Malezya', TH: 'Tayland', VN: 'Vietnam',
  PH: 'Filipinler', SG: 'Singapur', NZ: 'Yeni Zelanda',
  AR: 'Arjantin', CL: 'Şili', CO: 'Kolombiya', PE: 'Peru',
  LOCAL: 'Localhost',
};

const BAR_COLORS = ['#1e40af', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff', '#f8fafc'];

type Props = {
  items: AuditGeoStatsRowDto[];
  loading?: boolean;
};

export const AuditGeoMap: React.FC<Props> = ({ items, loading }) => {
  const t = useAdminT('admin.audit.geoMap');
  const countByCode = useMemo(() => {
    const map = new Map<string, { count: number; unique_ips: number }>();
    for (const r of items) {
      const c = r.country?.toUpperCase();
      if (!c) continue;
      const prev = map.get(c) ?? { count: 0, unique_ips: 0 };
      map.set(c, {
        count: prev.count + r.count,
        unique_ips: prev.unique_ips + r.unique_ips,
      });
    }
    return map;
  }, [items]);

  const totalRequests = useMemo(
    () => items.reduce((s, r) => s + r.count, 0),
    [items],
  );

  const topCountries = useMemo(() => {
    return [...countByCode.entries()]
      .map(([code, v]) => ({
        code,
        name: COUNTRY_NAMES[code] || code,
        ...v,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [countByCode]);

  if (loading) {
    return (
      <div className="flex min-h-75 items-center justify-center rounded-lg border bg-card">
        <span className="animate-pulse text-sm text-muted-foreground">{t('loading')}</span>
      </div>
    );
  }

  if (topCountries.length === 0) {
    return (
      <div className="flex min-h-50 items-center justify-center rounded-lg border bg-card">
        <span className="text-sm text-muted-foreground">{t('empty')}</span>
      </div>
    );
  }

  const chartConfig = {
    count: { label: t('requestsLabel') },
  };

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 text-sm font-medium">
          {t('distributionTitle', { total: String(totalRequests) })}
        </div>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart data={topCountries} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="code"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={50}
            />
            <YAxis tick={{ fontSize: 11 }} width={40} />
            <Tooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" name={t('requestsLabel')} radius={[4, 4, 0, 0]}>
              {topCountries.map((_, i) => (
                <Cell key={`cell-${i}`} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Top Countries Table */}
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm font-medium">{t('topCountries')}</div>
        <div className="space-y-1">
          {topCountries.map((c, i) => {
            const maxCount = topCountries[0]?.count ?? 1;
            const pct = totalRequests > 0 ? ((c.count / totalRequests) * 100).toFixed(1) : '0';
            return (
              <div key={c.code} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-right text-muted-foreground">{i + 1}.</span>
                <span className="w-8 font-mono text-xs">{c.code}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="font-medium tabular-nums">{c.count}</span>
                <span className="w-12 text-right text-xs text-muted-foreground">{pct}%</span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${Math.min(100, (c.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
