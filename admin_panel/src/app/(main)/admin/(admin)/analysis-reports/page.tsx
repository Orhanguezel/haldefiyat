'use client';

import Link from 'next/link';
import { Edit, FilePlus2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AnalysisReportAdmin, AnalysisReportStatus } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import {
  useArchiveAnalysisReportAdminMutation,
  useDraftAnalysisReportAdminMutation,
  useGenerateAnalysisReportAdminMutation,
  useListAnalysisReportsAdminQuery,
  usePublishAnalysisReportAdminMutation,
} from '@/integrations/hooks';

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

export default function Page() {
  const { data, isLoading, refetch } = useListAnalysisReportsAdminQuery({ status: 'all', limit: 100 });
  const [generateReport, { isLoading: isGenerating }] = useGenerateAnalysisReportAdminMutation();
  const [publishReport] = usePublishAnalysisReportAdminMutation();
  const [draftReport] = useDraftAnalysisReportAdminMutation();
  const [archiveReport] = useArchiveAnalysisReportAdminMutation();

  const reports = data?.items ?? [];

  async function handleGenerate() {
    const result = await generateReport({}).unwrap();
    await refetch();
    toast.success('Haftalık taslak oluşturuldu');
    window.location.href = `/admin/analysis-reports/${result.data.id}`;
  }

  async function handlePublish(report: AnalysisReportAdmin) {
    await publishReport({ id: report.id }).unwrap();
    await refetch();
    toast.success('Analiz yayına alındı');
  }

  async function handleDraft(report: AnalysisReportAdmin) {
    await draftReport({ id: report.id }).unwrap();
    await refetch();
    toast.success('Analiz taslağa alındı');
  }

  async function handleArchive(report: AnalysisReportAdmin) {
    await archiveReport({ id: report.id }).unwrap();
    await refetch();
    toast.success('Analiz arşivlendi');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Analiz Yazıları</CardTitle>
            <CardDescription>
              Tüm analiz kayıtlarını listele, detay sayfasında düzenle, önizle ve editoryal onayla yayına al.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/analysis-reports/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Yeni Analiz
              </Link>
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
              <FilePlus2 className="mr-1.5 h-4 w-4" />
              {isGenerating ? 'Üretiliyor...' : 'Haftalık Taslak Üret'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Başlık</TableHead>
                <TableHead>Hafta</TableHead>
                <TableHead>Kayıt</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Yayın</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && reports.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>Henüz analiz yazısı yok.</TableCell>
                </TableRow>
              )}
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="min-w-[360px] whitespace-normal">
                    <Link
                      href={`/admin/analysis-reports/${report.id}`}
                      className="font-medium hover:underline"
                    >
                      {report.baslik}
                    </Link>
                    <div className="mt-1 text-muted-foreground text-xs">
                      /analiz/{report.slug} · {formatDate(report.tarih)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{report.hafta}</TableCell>
                  <TableCell className="text-sm">{report.totalRecords}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(report.status)}>{statusLabel[report.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(report.publishedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/analysis-reports/${report.id}`}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Düzenle
                        </Link>
                      </Button>
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
    </div>
  );
}
