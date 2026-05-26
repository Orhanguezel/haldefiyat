'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, FileUp, Globe, Save, Send, Sparkles } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { AnalysisReportAdmin, AnalysisReportStatus } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import {
  useCreateAnalysisReportAdminMutation,
  useGetAnalysisReportAdminQuery,
  useUpdateAnalysisReportAdminMutation,
} from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';

type EditorState = {
  title: string;
  slug: string;
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

function emptyEditor(): EditorState {
  return {
    title: '',
    slug: '',
    summary: '',
    content: '',
    tags: 'hal fiyatları, piyasa analizi',
    metaTitle: '',
    metaDescription: '',
    ogImage: '/og-default.png',
    imageAlt: '',
  };
}

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
    slug: report.slug,
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

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
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

interface Props {
  id: string;
}

export function AnalysisReportDetailClient({ id }: Props) {
  const router = useRouter();
  const isNew = id === 'new';
  const { data: report, isFetching, refetch } = useGetAnalysisReportAdminQuery({ id }, { skip: isNew });
  const [createReport, { isLoading: isCreating }] = useCreateAnalysisReportAdminMutation();
  const [updateReport, { isLoading: isUpdating }] = useUpdateAnalysisReportAdminMutation();
  const { assist: aiAssist, loading: aiLoading } = useAIContentAssist();

  const [editor, setEditor] = useState<EditorState>(() => emptyEditor());
  const [activeTab, setActiveTab] = useState('content');
  const initializedRef = useRef<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isNew) {
      initializedRef.current = 'new';
      setEditor(emptyEditor());
      return;
    }
    if (!report) return;
    const key = `${report.id}-${report.updatedAt ?? ''}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    setEditor(toEditor(report));
  }, [isNew, report]);

  const isSaving = isCreating || isUpdating;
  const status = report?.status ?? 'draft';
  const previewUrl = editor.slug ? `https://haldefiyat.com/analiz/${editor.slug}` : '';
  const tags = splitTags(editor.tags);

  async function handleSave(nextStatus?: AnalysisReportStatus) {
    if (!editor.title.trim() || !editor.summary.trim() || !editor.content.trim()) {
      toast.error('Başlık, özet ve içerik alanları zorunlu.');
      return;
    }

    const payload = {
      title: editor.title,
      slug: editor.slug || slugify(editor.title),
      summary: editor.summary,
      content: editor.content,
      tags,
      metaTitle: editor.metaTitle || null,
      metaDescription: editor.metaDescription || null,
      ogImage: editor.ogImage || null,
      imageAlt: editor.imageAlt || editor.title,
      ...(nextStatus ? { status: nextStatus } : {}),
    };

    if (isNew) {
      const result = await createReport({ ...payload, status: nextStatus ?? 'draft' }).unwrap();
      toast.success(nextStatus === 'published' ? 'Analiz oluşturuldu ve yayınlandı' : 'Analiz oluşturuldu');
      router.replace(`/admin/analysis-reports/${result.data.id}`);
      return;
    }

    if (!report) return;
    await updateReport({ id: report.id, patch: payload }).unwrap();
    initializedRef.current = null;
    await refetch();
    toast.success(nextStatus === 'published' ? 'Kaydedildi ve yayınlandı' : 'Analiz kaydedildi');
  }

  async function handleAIAction(action: AIAction) {
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

    setEditor((prev) => ({
      ...prev,
      title: current.title || prev.title,
      slug: current.slug || prev.slug,
      summary: current.summary || prev.summary,
      content: current.content || prev.content,
      tags: current.tags || prev.tags,
      metaTitle: current.meta_title || prev.metaTitle,
      metaDescription: current.meta_description || prev.metaDescription,
    }));
    setActiveTab(action === 'generate_meta' ? 'seo' : 'preview');
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setEditor((prev) => ({ ...prev, content: text }));
    toast.success('İçerik içe aktarıldı');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/analysis-reports')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Liste
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{isNew ? 'Yeni Analiz Yazısı' : 'Analiz Yazısını Düzenle'}</h1>
            <p className="text-muted-foreground text-xs">
              {isNew ? 'Yeni kayıt taslak olarak oluşturulur.' : `Durum: ${statusLabel[status]} · ${formatDate(report?.tarih)}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AIActionDropdown onAction={handleAIAction} loading={aiLoading} disabled={isSaving || !editor.title.trim()} />
          <Button size="sm" variant="outline" onClick={() => setActiveTab('preview')}>
            <Eye className="mr-1.5 h-4 w-4" />
            Önizle
          </Button>
          <Button size="sm" onClick={() => handleSave()} disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          {status !== 'published' && (
            <Button size="sm" onClick={() => handleSave('published')} disabled={isSaving}>
              <Send className="mr-1.5 h-4 w-4" />
              Onayla
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Editoryal Onay</CardTitle>
          {!isNew && isFetching && <p className="text-muted-foreground text-xs">Kayıt yenileniyor...</p>}
        </CardHeader>
        <CardContent>
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
                  onChange={(event) => setEditor((prev) => ({ ...prev, title: event.target.value }))}
                  onBlur={() => setEditor((prev) => (prev.slug ? prev : { ...prev, slug: slugify(prev.title) }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysis-slug">Slug</Label>
                <Input
                  id="analysis-slug"
                  value={editor.slug}
                  placeholder={slugify(editor.title)}
                  onChange={(event) => setEditor((prev) => ({ ...prev, slug: slugify(event.target.value) }))}
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
                  onChange={(event) => setEditor((prev) => ({ ...prev, summary: event.target.value }))}
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
                  onChange={(event) => setEditor((prev) => ({ ...prev, content: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysis-tags">Etiketler</Label>
                <Input
                  id="analysis-tags"
                  value={editor.tags}
                  onChange={(event) => setEditor((prev) => ({ ...prev, tags: event.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 pt-4">
              <div className="rounded-md border bg-background p-5">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant={statusVariant(status)}>{statusLabel[status]}</Badge>
                  {tags.slice(0, 6).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
                <h1 className="font-semibold text-2xl leading-tight">{editor.title || 'Başlık'}</h1>
                <p className="mt-3 border-l-4 border-primary bg-muted/40 px-4 py-3 text-sm leading-6">
                  {editor.summary || 'Özet'}
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
                  <div className="truncate text-muted-foreground text-xs">{previewUrl || 'Kaydedince oluşur'}</div>
                </div>
                <Button size="sm" variant="outline" asChild disabled={!previewUrl || status !== 'published'}>
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
                  onChange={(event) => setEditor((prev) => ({ ...prev, metaTitle: event.target.value }))}
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
                  onChange={(event) => setEditor((prev) => ({ ...prev, metaDescription: event.target.value }))}
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
                <div className="text-[#006621] text-xs">haldefiyat.com/analiz/{editor.slug || slugify(editor.title)}</div>
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
                onChange={(url) => setEditor((prev) => ({ ...prev, ogImage: url }))}
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
                  onChange={(event) => setEditor((prev) => ({ ...prev, imageAlt: event.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
