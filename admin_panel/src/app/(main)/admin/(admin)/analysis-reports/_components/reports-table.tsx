'use client';

import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportCover } from './report-cover';
import type { TranslateFn } from '@/i18n';
import type { AnalysisReportAdmin } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import { formatDate, STATUS_VARIANT, wordCount } from '../_lib/report-meta';

type Props = { rows: AnalysisReportAdmin[]; loading: boolean; activeId?: number; onSelect: (row: AnalysisReportAdmin) => void; t: TranslateFn; tc: TranslateFn };

export function ReportsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
      {rows.map((r) => <li key={r.id} className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5 ${activeId === r.id ? 'bg-primary/5' : ''}`}>
        <button type="button" onClick={() => onSelect(r)} aria-label={`${r.baslik} — önizle`} className="shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-primary sm:w-44">
          <ReportCover src={r.ogImage} slug={r.slug} published={r.status === 'published'} alt={r.imageAlt || r.baslik} className="aspect-video w-full" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2"><Badge variant={STATUS_VARIANT[r.status]}>{t(`statuses.${r.status}`)}</Badge><span className="text-xs text-muted-foreground">{formatDate(r.tarih)} · {t(`sources.${r.source}`)}</span></div>
          <button type="button" onClick={() => onSelect(r)} className="text-left text-base font-semibold leading-snug hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">{r.baslik}</button>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{r.ozet}</p>
          <p className="text-xs text-muted-foreground">{r.yazar} · {r.totalRecords.toLocaleString('tr-TR')} {t('sheet.records')} · {wordCount(r.icerik)} {t('sheet.words')}</p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col xl:flex-row">
          <Button variant="outline" size="sm" onClick={() => onSelect(r)}><Eye className="size-4" /> Önizle</Button>
          <Button asChild variant="outline" size="sm"><Link href={`/admin/analysis-reports/${r.id}`}><Pencil className="size-4" />{t('sheet.edit')}</Link></Button>
        </div>
      </li>)}
    </ul>
  );
}
