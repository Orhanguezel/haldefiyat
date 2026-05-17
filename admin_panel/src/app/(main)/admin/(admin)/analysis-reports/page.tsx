'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { AnalysisReportAdmin, AnalysisReportStatus } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import {
  useArchiveAnalysisReportAdminMutation,
  useDraftAnalysisReportAdminMutation,
  useGenerateAnalysisReportAdminMutation,
  useListAnalysisReportsAdminQuery,
  usePublishAnalysisReportAdminMutation,
  useUpdateAnalysisReportAdminMutation,
} from '@/integrations/hooks';

type EditorState = {
  title: string;
  summary: string;
  content: string;
  tags: string;
};

const statusLabel: Record<AnalysisReportStatus, string> = {
  draft: 'Taslak',
  published: 'Yayında',
  archived: 'Arşiv',
};

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return value.slice(0, 10);
}

function statusVariant(status: AnalysisReportStatus): 'default' | 'secondary' | 'outline' {
  if (status === 'published') return 'default';
  if (status === 'archived') return 'secondary';
  return 'outline';
}

function toEditor(report: AnalysisReportAdmin): EditorState {
  return {
    title: report.baslik,
    summary: report.ozet,
    content: report.icerik,
    tags: report.etiketler.join(', '),
  };
}

export default function Page() {
  const { data, isLoading, refetch } = useListAnalysisReportsAdminQuery({ status: 'all', limit: 60 });
  const [generateReport, { isLoading: isGenerating }] = useGenerateAnalysisReportAdminMutation();
  const [updateReport, { isLoading: isSaving }] = useUpdateAnalysisReportAdminMutation();
  const [publishReport] = usePublishAnalysisReportAdminMutation();
  const [draftReport] = useDraftAnalysisReportAdminMutation();
  const [archiveReport] = useArchiveAnalysisReportAdminMutation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const reports = data?.items ?? [];
  const selected = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? reports[0] ?? null,
    [reports, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setEditor(toEditor(selected));
  }, [selected?.id]);

  async function handleGenerate() {
    const result = await generateReport({}).unwrap();
    setSelectedId(result.data.id);
    await refetch();
  }

  async function handleSelect(report: AnalysisReportAdmin) {
    setSelectedId(report.id);
    setEditor(toEditor(report));
  }

  async function handleSave() {
    if (!selected || !editor) return;
    await updateReport({
      id: selected.id,
      patch: {
        title: editor.title,
        summary: editor.summary,
        content: editor.content,
        tags: editor.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      },
    }).unwrap();
    await refetch();
  }

  async function handlePublish(report: AnalysisReportAdmin) {
    await publishReport({ id: report.id }).unwrap();
    await refetch();
  }

  async function handleDraft(report: AnalysisReportAdmin) {
    await draftReport({ id: report.id }).unwrap();
    await refetch();
  }

  async function handleArchive(report: AnalysisReportAdmin) {
    await archiveReport({ id: report.id }).unwrap();
    await refetch();
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_520px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Analiz Yazıları</CardTitle>
            <p className="mt-1 text-muted-foreground text-xs">
              Pazartesi otomatik taslakları burada düzenlenir ve onaydan sonra yayına alınır.
            </p>
          </div>
          <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? 'Üretiliyor...' : 'Haftalık Taslak Üret'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Hafta</TableHead>
                <TableHead>Kayıt</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Henüz analiz taslağı yok.</TableCell>
                </TableRow>
              )}
              {reports.map((report) => (
                <TableRow key={report.id} className={selected?.id === report.id ? 'bg-muted/40' : undefined}>
                  <TableCell>
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      onClick={() => handleSelect(report)}
                    >
                      {report.baslik}
                    </button>
                    <div className="mt-1 text-muted-foreground text-xs">
                      /analiz/{report.slug} · {formatDate(report.tarih)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{report.hafta}</TableCell>
                  <TableCell className="text-sm">{report.totalRecords}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(report.status)}>{statusLabel[report.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {report.status !== 'published' ? (
                        <Button size="sm" variant="outline" onClick={() => handlePublish(report)}>
                          Yayınla
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleDraft(report)}>
                          Taslak
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleArchive(report)}>
                        Arşivle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editoryal Onay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selected || !editor ? (
            <p className="text-muted-foreground text-sm">Düzenlemek için bir analiz yazısı seç.</p>
          ) : (
            <>
              <div className="grid gap-2">
                <label className="font-medium text-muted-foreground text-xs" htmlFor="analysis-title">
                  Başlık
                </label>
                <Input
                  id="analysis-title"
                  value={editor.title}
                  onChange={(event) => setEditor((prev) => prev ? { ...prev, title: event.target.value } : prev)}
                />
              </div>
              <div className="grid gap-2">
                <label className="font-medium text-muted-foreground text-xs" htmlFor="analysis-summary">
                  Özet
                </label>
                <Textarea
                  id="analysis-summary"
                  className="min-h-28"
                  value={editor.summary}
                  onChange={(event) => setEditor((prev) => prev ? { ...prev, summary: event.target.value } : prev)}
                />
              </div>
              <div className="grid gap-2">
                <label className="font-medium text-muted-foreground text-xs" htmlFor="analysis-content">
                  İçerik
                </label>
                <Textarea
                  id="analysis-content"
                  className="min-h-96 font-mono text-xs"
                  value={editor.content}
                  onChange={(event) => setEditor((prev) => prev ? { ...prev, content: event.target.value } : prev)}
                />
              </div>
              <div className="grid gap-2">
                <label className="font-medium text-muted-foreground text-xs" htmlFor="analysis-tags">
                  Etiketler
                </label>
                <Input
                  id="analysis-tags"
                  value={editor.tags}
                  onChange={(event) => setEditor((prev) => prev ? { ...prev, tags: event.target.value } : prev)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-muted-foreground text-xs">
                  {selected.status === 'published'
                    ? `Yayın tarihi: ${formatDate(selected.publishedAt)}`
                    : 'Kaydedilen yazı taslak olarak kalır; Yayınla butonu public sayfaya açar.'}
                </div>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
