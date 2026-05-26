'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FileUp, Globe, Save, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { AIActionDropdown } from '@/app/(main)/admin/_components/common/ai-action-dropdown';
import type { AIAction } from '@/app/(main)/admin/_components/common/use-ai-content-assist';
import { useAIContentAssist } from '@/app/(main)/admin/_components/common/use-ai-content-assist';
import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { resolveMediaUrl } from '@/lib/media-url';

type EditorState = {
  title: string;
  summary: string;
  content: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  imageAlt: string;
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
  const metaTitle = report.metaTitle || buildDefaultMetaTitle(report.baslik);
  const metaDescription = report.metaDescription || buildDefaultMetaDescription(report.ozet);

  return {
    title: report.baslik,
    summary: report.ozet,
    content: report.icerik,
    tags: report.etiketler.join(', '),
    metaTitle,
    metaDescription,
    ogImage: report.ogImage || '',
    imageAlt: report.imageAlt || report.baslik,
  };
}

function splitTags(value: string): string[] {
  return value.split(',').map((tag) => tag.trim()).filter(Boolean);
}

function truncateAtWord(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1).trimEnd();
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trimEnd()}…`;
}

function buildDefaultMetaTitle(title: string): string {
  const clean = title.replace(/\s+/g, ' ').trim();
  return truncateAtWord(clean, 47);
}

function buildDefaultMetaDescription(summary: string): string {
  return truncateAtWord(summary, 155);
}

function isHtmlContent(content: string): boolean {
  return content.trimStart().startsWith('<');
}

function renderPlainPreview(content: string) {
  return content.split('\n\n').map((para, index) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return <h2 key={index} className="mt-6 font-semibold text-xl">{trimmed.slice(2, -2)}</h2>;
    }

    return <p key={index} className="leading-7 text-muted-foreground">{trimmed}</p>;
  });
}

function characterHint(value: string, idealMax: number) {
  const over = value.length > idealMax;
  return (
    <span className={over ? 'text-destructive' : 'text-muted-foreground'}>
      {value.length}/{idealMax}
    </span>
  );
}

export default function Page() {
  const { data, isLoading, refetch } = useListAnalysisReportsAdminQuery({ status: 'all', limit: 60 });
  const [generateReport, { isLoading: isGenerating }] = useGenerateAnalysisReportAdminMutation();
  const [updateReport, { isLoading: isSaving }] = useUpdateAnalysisReportAdminMutation();
  const [publishReport] = usePublishAnalysisReportAdminMutation();
  const [draftReport] = useDraftAnalysisReportAdminMutation();
  const [archiveReport] = useArchiveAnalysisReportAdminMutation();
  const { assist: aiAssist, loading: aiLoading } = useAIContentAssist();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const importInputRef = useRef<HTMLInputElement | null>(null);

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
    toast.success('Haftalık taslak oluşturuldu');
  }

  async function handleSelect(report: AnalysisReportAdmin) {
    setSelectedId(report.id);
    setEditor(toEditor(report));
  }

  async function handleSave(nextStatus?: AnalysisReportStatus) {
    if (!selected || !editor) return;
    await updateReport({
      id: selected.id,
      patch: {
        title: editor.title,
        summary: editor.summary,
        content: editor.content,
        tags: splitTags(editor.tags),
        metaTitle: editor.metaTitle || null,
        metaDescription: editor.metaDescription || null,
        ogImage: editor.ogImage || null,
        imageAlt: editor.imageAlt || null,
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    }).unwrap();
    await refetch();
    toast.success(nextStatus === 'published' ? 'Kaydedildi ve yayınlandı' : 'Analiz kaydedildi');
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

  async function handleAIAction(action: AIAction) {
    if (!editor) return;
    const result = await aiAssist({
      title: editor.title,
      summary: editor.summary,
      content: editor.content,
      tags: editor.tags,
      locale: 'tr',
      target_locales: ['tr'],
      module_key: 'hal_analysis_report',
      action,
    });
    const current = result?.[0];
    if (!current) return;

    setEditor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        title: current.title || prev.title,
        summary: current.summary || prev.summary,
        content: current.content || prev.content,
        tags: current.tags || prev.tags,
        metaTitle: current.meta_title || prev.metaTitle,
        metaDescription: current.meta_description || prev.metaDescription,
      };
    });
    setActiveTab(action === 'generate_meta' ? 'seo' : 'preview');
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setEditor((prev) => prev ? { ...prev, content: text } : prev);
    toast.success('İçerik içe aktarıldı');
  }

  const previewUrl = selected ? `https://haldefiyat.com/analiz/${selected.slug}` : '';
  const tags = editor ? splitTags(editor.tags) : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_620px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Analiz Yazıları</CardTitle>
            <p className="mt-1 text-muted-foreground text-xs">
              Haftalık taslakları düzenle, önizle ve editoryal onaydan sonra yayına al.
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
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Editoryal Onay</CardTitle>
              {selected && (
                <p className="mt-1 text-muted-foreground text-xs">
                  {selected.status === 'published'
                    ? `Yayında: ${formatDate(selected.publishedAt)}`
                    : 'Taslak kaydedilir; Yayınla public sayfayı açar.'}
                </p>
              )}
            </div>
            {selected && editor && (
              <div className="flex flex-wrap gap-2">
                <AIActionDropdown
                  onAction={handleAIAction}
                  loading={aiLoading}
                  disabled={isSaving || !editor.title.trim()}
                />
                <Button size="sm" variant="outline" onClick={() => setActiveTab('preview')}>
                  <Eye className="mr-1.5 h-4 w-4" />
                  Önizle
                </Button>
                <Button size="sm" onClick={() => handleSave()} disabled={isSaving}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
                {selected.status !== 'published' && (
                  <Button size="sm" variant="default" onClick={() => handleSave('published')} disabled={isSaving}>
                    <Send className="mr-1.5 h-4 w-4" />
                    Onayla
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selected || !editor ? (
            <p className="text-muted-foreground text-sm">Düzenlemek için bir analiz yazısı seç.</p>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">İçerik</TabsTrigger>
                <TabsTrigger value="preview">Önizleme</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="image">Görsel</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="analysis-title">Başlık</Label>
                  <Input
                    id="analysis-title"
                    value={editor.title}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, title: event.target.value } : prev)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analysis-summary">Özet</Label>
                    <span className="text-xs">{characterHint(editor.summary, 220)}</span>
                  </div>
                  <Textarea
                    id="analysis-summary"
                    className="min-h-28"
                    value={editor.summary}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, summary: event.target.value } : prev)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="analysis-content">İçerik</Label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={importInputRef}
                        type="file"
                        accept=".html,.htm,.md,.txt"
                        className="hidden"
                        onChange={(event) => handleImportFile(event.target.files?.[0])}
                      />
                      <Button size="sm" variant="outline" type="button" onClick={() => importInputRef.current?.click()}>
                        <FileUp className="mr-1.5 h-4 w-4" />
                        İçe Aktar
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="analysis-content"
                    className="min-h-[520px] font-mono text-xs"
                    value={editor.content}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, content: event.target.value } : prev)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="analysis-tags">Etiketler</Label>
                  <Input
                    id="analysis-tags"
                    value={editor.tags}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, tags: event.target.value } : prev)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4 pt-4">
                <div className="rounded-md border bg-background p-5">
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Badge variant={statusVariant(selected.status)}>{statusLabel[selected.status]}</Badge>
                    {tags.slice(0, 6).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                  <h1 className="font-semibold text-2xl leading-tight">{editor.title}</h1>
                  <p className="mt-3 border-l-4 border-primary bg-muted/40 px-4 py-3 text-sm leading-6">
                    {editor.summary}
                  </p>
                  {editor.ogImage && (
                    <img
                      src={resolveMediaUrl(editor.ogImage)}
                      alt={editor.imageAlt || editor.title}
                      className="mt-4 aspect-video w-full rounded-md border object-cover"
                    />
                  )}
                  {isHtmlContent(editor.content) ? (
                    <div className="mt-5" dangerouslySetInnerHTML={{ __html: editor.content }} />
                  ) : (
                    <div className="mt-5 space-y-4">{renderPlainPreview(editor.content)}</div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">Public bağlantı</div>
                    <div className="truncate text-muted-foreground text-xs">{previewUrl}</div>
                  </div>
                  <Button size="sm" variant="outline" asChild disabled={selected.status !== 'published'}>
                    <a href={previewUrl} target="_blank" rel="noreferrer">
                      <Globe className="mr-1.5 h-4 w-4" />
                      Aç
                    </a>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 pt-4">
                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  AI menüsünden <span className="font-medium text-foreground">SEO Meta Oluştur</span> seçeneği bu
                  alanları doldurur. Boş bırakılırsa public sayfa başlık ve özet alanlarını kullanır.
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analysis-meta-title">Meta başlık</Label>
                    <span className="text-xs">{characterHint(editor.metaTitle, 60)}</span>
                  </div>
                  <Input
                    id="analysis-meta-title"
                    value={editor.metaTitle}
                    placeholder={buildDefaultMetaTitle(editor.title)}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, metaTitle: event.target.value } : prev)}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analysis-meta-description">Meta açıklama</Label>
                    <span className="text-xs">{characterHint(editor.metaDescription, 155)}</span>
                  </div>
                  <Textarea
                    id="analysis-meta-description"
                    className="min-h-24"
                    value={editor.metaDescription}
                    placeholder={buildDefaultMetaDescription(editor.summary)}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, metaDescription: event.target.value } : prev)}
                  />
                </div>
                <div className="rounded-md border p-4">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    Google önizleme
                  </div>
                  <div className="text-[#1a0dab] text-base">
                    {(editor.metaTitle || buildDefaultMetaTitle(editor.title)) + ' | HaldeFiyat'}
                  </div>
                  <div className="text-[#006621] text-xs">haldefiyat.com/analiz/{selected.slug}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {editor.metaDescription || buildDefaultMetaDescription(editor.summary)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4 pt-4">
                <AdminImageUploadField
                  label="Meta / OG görseli"
                  helperText="Sosyal medya paylaşımı ve arama sonuçları için kullanılacak kapak görseli."
                  value={editor.ogImage}
                  onChange={(url) => setEditor((prev) => prev ? { ...prev, ogImage: url } : prev)}
                  folder="uploads/analysis-reports"
                  previewAspect="16x9"
                  previewObjectFit="cover"
                />
                <div className="grid gap-2">
                  <Label htmlFor="analysis-image-alt">Görsel alt metni</Label>
                  <Input
                    id="analysis-image-alt"
                    value={editor.imageAlt}
                    placeholder={editor.title}
                    onChange={(event) => setEditor((prev) => prev ? { ...prev, imageAlt: event.target.value } : prev)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
