'use client';

import Link from 'next/link';
import { Archive, Edit, ExternalLink, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TranslateFn } from '@/i18n';
import { BASE_URL } from '@/integrations/api-base';
import type { AnalysisReportAdmin } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import { useArchiveAnalysisReportAdminMutation, useDraftAnalysisReportAdminMutation, usePublishAnalysisReportAdminMutation } from '@/integrations/hooks';
import { formatDate, STATUS_VARIANT, wordCount } from '../_lib/report-meta';

const SITE = BASE_URL.replace(/\/api\/v1\/?$/, '');

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold tabular-nums">{value}</div></div>;
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-b py-1.5 text-sm last:border-0"><span className="text-muted-foreground">{label}</span><span className="text-right">{value}</span></div>;
}

type Props = { row: AnalysisReportAdmin | null; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function ReportSheet({ row, onClose, t, tc }: Props) {
  const [publish, pub] = usePublishAnalysisReportAdminMutation();
  const [draft, dr] = useDraftAnalysisReportAdminMutation();
  const [archive, ar] = useArchiveAnalysisReportAdminMutation();
  const busy = pub.isLoading || dr.isLoading || ar.isLoading;

  async function act(kind: 'publish' | 'draft' | 'archive') {
    if (!row) return;
    try {
      if (kind === 'publish') await publish({ id: row.id }).unwrap();
      else if (kind === 'draft') await draft({ id: row.id }).unwrap();
      else await archive({ id: row.id }).unwrap();
      toast.success(t(`toasts.${kind}`));
    } catch { toast.error(tc('saveFailed')); }
  }

  return (
    <Sheet open={Boolean(row)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-base leading-snug">{row.baslik}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant={STATUS_VARIANT[row.status]} className="font-normal">{t(`statuses.${row.status}`)}</Badge>
                <span>#{row.id}</span><span aria-hidden>·</span>
                <span>{row.hafta}</span><span aria-hidden>·</span>
                <span>{t(`sources.${row.source}`)}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t('sheet.records')} value={row.totalRecords.toLocaleString('tr-TR')} />
                <Stat label={t('sheet.words')} value={wordCount(row.icerik)} />
                <Stat label={t('sheet.tags')} value={row.etiketler.length} />
                <Stat label={t('sheet.published')} value={<span className="text-sm">{formatDate(row.publishedAt)}</span>} />
              </div>
              <div>
                <Row label={t('sheet.slug')} value={<span className="font-mono text-xs">/analiz/{row.slug}</span>} />
                <Row label={t('sheet.period')} value={`${formatDate(row.weekStart)} – ${formatDate(row.weekEnd)}`} />
                <Row label={t('sheet.author')} value={row.yazar || '—'} />
                <Row label={t('sheet.date')} value={formatDate(row.tarih)} />
                <Row label={t('sheet.updated')} value={formatDate(row.updatedAt)} />
                <Row label={t('sheet.metaTitle')} value={row.metaTitle || <span className="text-amber-600">{t('sheet.missing')}</span>} />
                <Row label={t('sheet.metaDescription')} value={row.metaDescription ? `${row.metaDescription.length} ${t('sheet.chars')}` : <span className="text-amber-600">{t('sheet.missing')}</span>} />
                <Row label={t('sheet.ogImage')} value={row.ogImage ? tc('yes') : <span className="text-amber-600">{t('sheet.missing')}</span>} />
              </div>
              {row.etiketler.length ? <div className="flex flex-wrap gap-1">{row.etiketler.map((tag) => <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>)}</div> : null}
              <div>
                <div className="mb-1 text-xs text-muted-foreground">{t('sheet.summary')}</div>
                <p className="rounded-md border bg-muted/40 p-3 text-sm leading-6">{row.ozet || '—'}</p>
              </div>
              {row.status === 'published' ? (
                <a href={`${SITE}/analiz/${row.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline"><ExternalLink className="size-3.5" /> {tc('openPage')}</a>
              ) : null}
            </div>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex w-full flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm"><Link href={`/admin/analysis-reports/${row.id}`}><Edit className="size-3.5" /> {t('sheet.edit')}</Link></Button>
                {row.status !== 'archived' ? <Button variant="ghost" size="sm" onClick={() => act('archive')} disabled={busy}><Archive className="size-3.5" /> {t('actions.archive')}</Button> : null}
                <span className="flex-1" />
                {row.status === 'published'
                  ? <Button variant="outline" size="sm" onClick={() => act('draft')} disabled={busy}><FileText className="size-3.5" /> {t('actions.draft')}</Button>
                  : <Button size="sm" onClick={() => act('publish')} disabled={busy}><Send className="size-3.5" /> {t('actions.publish')}</Button>}
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
