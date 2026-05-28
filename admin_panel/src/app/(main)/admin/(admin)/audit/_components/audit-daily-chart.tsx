// =============================================================
// FILE: src/app/(main)/admin/(admin)/audit/_components/audit-daily-chart.tsx
// FIX:
//  - date can be "YYYY-MM-DD" OR ISO datetime -> normalize to "YYYY-MM-DD"
//  - tolerate alternate keys: day, dt, ts, created_at
// =============================================================

'use client';

import React, { useMemo, useState } from 'react';

import type { AuditMetricsDailyRowDto } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

type Props = {
  rows: AuditMetricsDailyRowDto[];
  loading?: boolean;
  height?: number; // default 220
};

function n(v: unknown, fallback = 0) {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function toYmd(input: unknown): string {
  const s = String(input ?? '').trim();
  if (!s) return '';
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO datetime -> take first 10 chars
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  // fallback: try Date parse
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s; // last resort (won't crash)
}

function fmtDayLabel(isoOrDate: string) {
  const ymd = toYmd(isoOrDate);
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoOrDate || '');
  return `${m[3]}.${m[2]}`;
}

function fmtIsoNice(isoOrDate: string) {
  const ymd = toYmd(isoOrDate);
  const m = String(ymd).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return String(isoOrDate || '');
  return `${m[3]}.${m[2]}.${m[1]}`;
}

export const AuditDailyChart: React.FC<Props> = ({ rows, loading, height = 220 }) => {
  const t = useAdminT('admin.audit.chart');
  const [showHumans, setShowHumans] = useState(true);
  const [showAds, setShowAds] = useState(true);
  const [showUnique, setShowUnique] = useState(true);
  const [showErrors, setShowErrors] = useState(true);

  const data = useMemo(() => {
    const a = Array.isArray(rows) ? rows : [];
    return [...a]
      .map((r) => {
        const rawDate =
          (r as any).date ??
          (r as any).day ??
          (r as any).dt ??
          (r as any).ts ??
          (r as any).created_at ??
          '';
        const date = toYmd(rawDate);

        return {
          date,
          label: fmtDayLabel(date),
          requests: n((r as any).requests ?? (r as any).count ?? (r as any).total_requests),
          humans: n((r as any).humans ?? (r as any).humanRequests),
          ads: n((r as any).ads ?? (r as any).adsPageviews),
          unique_ips: n((r as any).unique_ips ?? (r as any).uniqueIps ?? (r as any).unique ?? (r as any).uniq_ips),
          errors: n((r as any).errors ?? (r as any).error_count ?? (r as any).fails),
        };
      })
      .filter((x) => !!x.date && /^\d{4}-\d{2}-\d{2}/.test(x.date))
      .sort((x, y) => String(x.date).localeCompare(String(y.date)));
  }, [rows]);

  const hasAny = data.length > 0;

  // ---- SVG layout ----
  const W = 980;
  const H = Math.max(140, Math.min(360, height));
  const padL = 42;
  const padR = 14;
  const padT = 12;
  const padB = 30;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxRequests = useMemo(() => {
    const m = data.reduce((acc, r) => Math.max(acc, r.requests), 0);
    return Math.max(1, m);
  }, [data]);

  const yTicks = 4;
  const tickVals = Array.from({ length: yTicks + 1 }).map((_, i) =>
    Math.round((maxRequests * (yTicks - i)) / yTicks),
  );

  const barGap = 6;
  const barCount = Math.max(1, data.length);
  const barW = Math.max(8, Math.floor((chartW - barGap * (barCount - 1)) / barCount));

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const linePoints = (key: 'humans' | 'ads' | 'unique_ips' | 'errors') =>
    data
      .map((r, idx) => {
        const x = padL + idx * (barW + barGap) + barW / 2;
        const y = padT + chartH - (Math.min(maxRequests, r[key]) / maxRequests) * chartH;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <div className="text-sm text-muted-foreground">
          {t('summary', {
            days: String(data.length || 0),
            requests: t('labels.requests'),
            uniqueSuffix: showUnique ? t('summaryUniqueSuffix') : '',
            errorsSuffix: showErrors ? t('summaryErrorsSuffix') : '',
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="mb-0 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showHumans}
              onChange={(e) => setShowHumans(e.target.checked)}
            />
            {t('labels.humans')}
          </label>

          <label className="mb-0 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showAds}
              onChange={(e) => setShowAds(e.target.checked)}
            />
            {t('labels.ads')}
          </label>

          <label className="mb-0 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showUnique}
              onChange={(e) => setShowUnique(e.target.checked)}
            />
            {t('labels.uniqueIps')}
          </label>

          <label className="mb-0 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(e) => setShowErrors(e.target.checked)}
            />
            {t('labels.errors')}
          </label>

          {loading && <span className="text-sm text-muted-foreground">{t('loading')}</span>}
        </div>
      </div>

      {!hasAny && !loading && (
        <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-sm">
          {t('empty')}
        </div>
      )}

      <div className="overflow-hidden rounded border bg-card">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          role="img"
          aria-label={t('ariaLabel')}
        >
          <rect x="0" y="0" width={W} height={H} fill="white" />

          {tickVals.map((tv, i) => {
            const y = padT + (chartH * i) / yTicks;
            return (
              <g key={`t-${i}`}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e9ecef" strokeWidth="1" />
                <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#6c757d">
                  {tv}
                </text>
              </g>
            );
          })}

          {data.map((r, idx) => {
            const x = padL + idx * (barW + barGap);
            const h = Math.round((r.requests / maxRequests) * chartH);
            const y = padT + (chartH - h);
            const isHover = hoverIdx === idx;

            return (
              <g
                key={`${r.date}-${idx}`}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx="3"
                  fill={isHover ? '#0b5ed7' : '#0d6efd'}
                  opacity={r.requests === 0 ? 0.25 : 0.9}
                />
                {(data.length <= 14 || idx % 2 === 0) && (
                  <text
                    x={x + barW / 2}
                    y={H - 10}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#6c757d"
                  >
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}

          {showHumans && data.length > 1 && (
            <polyline fill="none" stroke="#16a34a" strokeWidth="3" points={linePoints('humans')} />
          )}
          {showAds && data.length > 1 && (
            <polyline fill="none" stroke="#f59e0b" strokeWidth="3" points={linePoints('ads')} />
          )}
          {showUnique && data.length > 1 && (
            <polyline fill="none" stroke="#7c3aed" strokeWidth="2.5" points={linePoints('unique_ips')} />
          )}
          {showErrors && data.length > 1 && (
            <polyline fill="none" stroke="#dc2626" strokeWidth="2.5" points={linePoints('errors')} />
          )}

          {hoverIdx !== null &&
            data[hoverIdx] &&
            (() => {
              const r = data[hoverIdx];
              const xBar = padL + hoverIdx * (barW + barGap);
              const boxW = 220;
              const boxH = 100;

              const px = xBar + barW + 10 + boxW <= W - padR ? xBar + barW + 10 : xBar - boxW - 10;
              const py = padT + 10;

              return (
                <g>
                  <rect
                    x={px}
                    y={py}
                    width={boxW}
                    height={boxH}
                    rx="8"
                    fill="white"
                    stroke="#dee2e6"
                  />
                  <text x={px + 12} y={py + 20} fontSize="12" fill="#212529">
                    <tspan fontWeight="600">{fmtIsoNice(r.date)}</tspan>
                  </text>
                  <text x={px + 12} y={py + 40} fontSize="12" fill="#212529">
                    {t('labels.requests')}: <tspan fontWeight="600">{r.requests}</tspan>
                  </text>
                  <text x={px + 12} y={py + 58} fontSize="12" fill="#212529">
                    {t('labels.humans')}: <tspan fontWeight="600">{r.humans}</tspan>
                    <tspan> · </tspan>
                    {t('labels.ads')}: <tspan fontWeight="600">{r.ads}</tspan>
                  </text>
                  <text x={px + 12} y={py + 76} fontSize="12" fill="#212529">
                    {t('labels.unique')}: <tspan fontWeight="600">{r.unique_ips}</tspan>
                    <tspan> · </tspan>
                    {t('labels.errors')}: <tspan fontWeight="600">{r.errors}</tspan>
                  </text>
                </g>
              );
            })()}

          <line
            x1={padL}
            y1={padT + chartH}
            x2={W - padR}
            y2={padT + chartH}
            stroke="#dee2e6"
            strokeWidth="1"
          />
        </svg>

        {hasAny && (
          <div className="flex items-center justify-between border-t px-3 py-2 text-sm text-muted-foreground">
            <div>{data[data.length - 1]?.date ? fmtIsoNice(data[data.length - 1].date) : '-'}</div>
            <div className="flex gap-3">
              <span>
                {t('labels.requests')}:{' '}
                <strong className="text-foreground">{data[data.length - 1]?.requests ?? 0}</strong>
              </span>
              {showHumans && (
                <span>
                  {t('labels.humans')}:{' '}
                  <strong className="text-foreground">{data[data.length - 1]?.humans ?? 0}</strong>
                </span>
              )}
              {showAds && (
                <span>
                  {t('labels.ads')}:{' '}
                  <strong className="text-foreground">{data[data.length - 1]?.ads ?? 0}</strong>
                </span>
              )}
              {showUnique && (
                <span>
                  {t('labels.unique')}:{' '}
                  <strong className="text-foreground">
                    {data[data.length - 1]?.unique_ips ?? 0}
                  </strong>
                </span>
              )}
              {showErrors && (
                <span>
                  {t('labels.errors')}:{' '}
                  <strong className="text-foreground">{data[data.length - 1]?.errors ?? 0}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
