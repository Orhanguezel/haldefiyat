'use client';

// =============================================================
// FILE: audit/_components/audit-turkey-map.tsx
// Türkiye il choropleth'i — ziyaretçilerin geldiği iller (geo-cities TR satırları).
// geoip-lite şehir adları ASCII/karışık (Istanbul, Mugla, Eyuepsultan, Silifke);
// NFKD ASCII-fold + ilçe→il sözlüğü ile il adına eşlenir.
// =============================================================

import * as React from 'react';
import { TURKEY_PROVINCES, TURKEY_VIEWBOX } from '@/lib/turkey-geo';

type CityRow = { country: string; city: string; hits: number; uniqueIps: number };

/** Türkçe-I + aksan sorunlarını çöz: "İstanbul"/"Istanbul" → "istanbul". */
function fold(value: string): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z]/g, '');
}

// geoip ilçe/alias → il (gözlenen değerler; gerektikçe genişletilir).
const ALIAS_TO_PROVINCE: Record<string, string> = {
  eyuepsultan: 'istanbul',
  eyupsultan: 'istanbul',
  silifke: 'mersin',
  afyon: 'afyonkarahisar',
  icel: 'mersin',
  maras: 'kahramanmaras',
  urfa: 'sanliurfa',
};

function provinceKey(value: string): string {
  const f = fold(value);
  return ALIAS_TO_PROVINCE[f] ?? f;
}

function fmt(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value);
}

function fillFor(hits: number, max: number): string {
  if (hits <= 0 || max <= 0) return 'var(--muted)';
  const ratio = Math.min(1, hits / max);
  // açık mavi → koyu mavi
  return `hsl(217 90% ${72 - ratio * 40}%)`;
}

type Props = {
  cities: CityRow[];
  loading?: boolean;
};

export const AuditTurkeyMap: React.FC<Props> = ({ cities, loading }) => {
  const { hitsByProvince, total, max, top } = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const row of cities) {
      const key = provinceKey(row.city);
      map.set(key, (map.get(key) ?? 0) + (Number(row.hits) || 0));
    }
    const provinceHits = TURKEY_PROVINCES.map((p) => ({
      code: p.code,
      name: p.name,
      hits: map.get(provinceKey(p.name)) ?? 0,
    }));
    const totalHits = provinceHits.reduce((s, p) => s + p.hits, 0);
    const maxHits = provinceHits.reduce((m, p) => Math.max(m, p.hits), 0);
    const topList = [...provinceHits].filter((p) => p.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 8);
    return { hitsByProvince: new Map(provinceHits.map((p) => [p.name, p.hits])), total: totalHits, max: maxHits, top: topList };
  }, [cities]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="relative overflow-hidden rounded-lg border bg-muted/20 p-2">
        <svg
          viewBox={`0 0 ${TURKEY_VIEWBOX.width} ${TURKEY_VIEWBOX.height}`}
          role="img"
          aria-label="Türkiye il bazlı ziyaretçi haritası"
          className="h-auto w-full"
        >
          {TURKEY_PROVINCES.map((p) => {
            const hits = hitsByProvince.get(p.name) ?? 0;
            return (
              <path
                key={p.code}
                d={p.d}
                fill={fillFor(hits, max)}
                stroke="var(--border)"
                strokeWidth={0.8}
                className="transition-opacity hover:opacity-80"
              >
                <title>{`${p.name} — ${fmt(hits)} istek`}</title>
              </path>
            );
          })}
        </svg>
        {!loading && total === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Bu aralıkta Türkiye verisi yok.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">
          Toplam TR isteği: <span className="font-semibold text-foreground">{fmt(total)}</span>
        </div>
        {top.map((p, i) => (
          <div key={p.code} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-sm">
            <span className="font-medium">{i + 1}. {p.name}</span>
            <span className="font-mono text-xs text-muted-foreground">{fmt(p.hits)}</span>
          </div>
        ))}
        {top.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">İl verisi yok.</p>
        )}
      </div>
    </div>
  );
};
