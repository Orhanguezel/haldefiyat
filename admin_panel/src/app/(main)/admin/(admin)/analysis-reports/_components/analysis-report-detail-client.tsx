'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, FileUp, Globe, Megaphone, Save, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import RichContentEditor from '@/app/(main)/admin/_components/common/rich-content-editor';
import { AIActionDropdown } from '@/app/(main)/admin/_components/common/ai-action-dropdown';
import type { AIAction } from '@/app/(main)/admin/_components/common/use-ai-content-assist';
import { useAIContentAssist } from '@/app/(main)/admin/_components/common/use-ai-content-assist';
import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { AnalysisReportAdmin, AnalysisReportStatus } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import {
  useAnnounceAnalysisReportAdminMutation,
  useCreateAnalysisReportAdminMutation,
  useGetAnalysisReportAdminQuery,
  useListAuthorsAdminQuery,
  useUpdateAnalysisReportAdminMutation,
} from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { BASE_URL } from '@/integrations/api-base';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

import { AnalysisReportQualityPanel } from './analysis-report-quality-panel';

// Marka koddan gelmez: site adresi env'den, yoksa API tabanindan turetilir.
function publicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? BASE_URL.replace(/\/api\/v1\/?$/, '');
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
}

const SITE_URL = publicSiteOrigin();
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME ?? '').trim();

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
  authorId: string;
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
    ogImage: '',
    imageAlt: '',
    authorId: '',
  };
}

function isDefaultOgImage(value: string | null | undefined): boolean {
  return !String(value || '').trim() || /og-default/.test(String(value));
}

function analysisCoverUrl(ogImage: string | null | undefined, slug: string): string {
  const raw = String(ogImage || '').trim();
  if (!isDefaultOgImage(raw)) return resolveMediaUrl(raw);
  const safeSlug = slug.trim();
  return safeSlug ? `${SITE_URL}/og/analiz/${safeSlug}` : '';
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
    authorId: report.authorId ? String(report.authorId) : '',
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
  const t = useAdminT('admin.analysis.detail');
  const ta = useAdminT('admin.analysis');
  const tc = useAdminT('admin.common');
  const isNew = id === 'new';
  const { data: report, isFetching, refetch } = useGetAnalysisReportAdminQuery({ id }, { skip: isNew });
  const { data: authorsData } = useListAuthorsAdminQuery({ active: '1', limit: 100 });
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

  const [announceReport, { isLoading: isAnnouncing }] = useAnnounceAnalysisReportAdminMutation();
  const isSaving = isCreating || isUpdating;
  const status = report?.status ?? 'draft';
  const previewUrl = editor.slug && SITE_URL ? `${SITE_URL}/analiz/${editor.slug}` : '';
  const customOgImage = isDefaultOgImage(editor.ogImage) ? '' : editor.ogImage;
  const effectiveCoverUrl = analysisCoverUrl(editor.ogImage, editor.slug || slugify(editor.title));
  const tags = splitTags(editor.tags);
  const authors = authorsData?.items ?? [];

  async function handleSave(nextStatus?: AnalysisReportStatus) {
    if (!editor.title.trim() || !editor.summary.trim() || !editor.content.trim()) {
      toast.error(t('toasts.required'));
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
      ogImage: customOgImage || null,
      imageAlt: editor.imageAlt || editor.title,
      authorId: editor.authorId ? Number(editor.authorId) : null,
      ...(nextStatus ? { status: nextStatus } : {}),
    };

    if (isNew) {
      const result = await createReport({ ...payload, status: nextStatus ?? 'draft' }).unwrap();
      toast.success(nextStatus === 'published' ? t('toasts.createdPublished') : t('toasts.created'));
      router.replace(`/admin/analysis-reports/${result.data.id}`);
      return;
    }

    if (!report) return;
    await updateReport({ id: report.id, patch: payload }).unwrap();
    initializedRef.current = null;
    await refetch();
    toast.success(nextStatus === 'published' ? t('toasts.savedPublished') : t('toasts.saved'));
  }

  // Duyuru yayindan AYRI bir adim: kanala giden gonderi geri alinamiyor, rapor
  // metni ise yayindan sonra da duzeltilebiliyor.
  async function handleAnnounce() {
    if (!report) return;
    const result = await announceReport({ id: report.id }).unwrap();
    const ok: string[] = [];
    const failed: string[] = [];
    (result.telegram.sent ? ok : failed).push(
      result.telegram.sent ? t('announce.telegram') : `Telegram: ${result.telegram.reason ?? t('announce.failed')}`,
    );
    (result.whatsapp.sent ? ok : failed).push(
      result.whatsapp.sent ? t('announce.whatsapp') : `WhatsApp: ${result.whatsapp.reason ?? t('announce.failed')}`,
    );
    if (ok.length) toast.success(t('announce.shared', { list: ok.join(' · ') }));
    if (failed.length) toast.error(failed.join(' · '));
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
    toast.success(t('toasts.imported'));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/analysis-reports')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {t('back')}
          </Button>
          <div>
            <h1 className="font-semibold text-lg">{isNew ? t('newTitle') : t('editTitle')}</h1>
            <p className="text-muted-foreground text-xs">
              {isNew ? t('newHint') : t('statusLine', { status: ta(`statuses.${status}`), date: formatDate(report?.tarih) })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AIActionDropdown onAction={handleAIAction} loading={aiLoading} disabled={isSaving || !editor.title.trim()} />
          <Button size="sm" variant="outline" onClick={() => setActiveTab('preview')}>
            <Eye className="mr-1.5 h-4 w-4" />
            {t('preview')}
          </Button>
          <Button size="sm" onClick={() => handleSave()} disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSaving ? tc('saving') : tc('save')}
          </Button>
          {status !== 'published' && (
            <Button size="sm" onClick={() => handleSave('published')} disabled={isSaving}>
              <Send className="mr-1.5 h-4 w-4" />
              {t('approve')}
            </Button>
          )}
          {status === 'published' && !isNew && (
            <Button size="sm" variant="outline" onClick={handleAnnounce} disabled={isAnnouncing}>
              <Megaphone className="mr-1.5 h-4 w-4" />
              {isAnnouncing ? t('announcing') : t('announceBtn')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('cardTitle')}</CardTitle>
          {!isNew && isFetching && <p className="text-muted-foreground text-xs">{t('refreshing')}</p>}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">{t('tabs.content')}</TabsTrigger>
              <TabsTrigger value="preview">{t('tabs.preview')}</TabsTrigger>
              <TabsTrigger value="seo">{t('tabs.seo')}</TabsTrigger>
              <TabsTrigger value="image">{t('tabs.image')}</TabsTrigger>
              <TabsTrigger value="quality">{t('tabs.quality')}</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="analysis-title">{t('fields.title')}</Label>
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
                <Label htmlFor="analysis-author">{t('fields.author')}</Label>
                <Select
                  value={editor.authorId || 'none'}
                  onValueChange={(value) => setEditor((prev) => ({ ...prev, authorId: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger id="analysis-author">
                    <SelectValue placeholder={SITE_NAME ? `${SITE_NAME} ${t('fields.defaultAuthor')}` : t('fields.defaultAuthor')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{SITE_NAME ? `${SITE_NAME} ${t('fields.defaultAuthor')}` : t('fields.defaultAuthor')}</SelectItem>
                    {authors.map((author) => (
                      <SelectItem key={author.id} value={String(author.id)}>
                        {author.fullName}{author.title ? ` — ${author.title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="analysis-summary">{t('fields.summary')}</Label>
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
                  <Label htmlFor="analysis-content">{t('fields.content')}</Label>
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
                      {t('import')}
                    </Button>
                  </div>
                </div>
                <RichContentEditor
                  value={editor.content}
                  onChange={(v) => setEditor((prev) => ({ ...prev, content: v }))}
                  height="520px"
                />
                <p className="text-muted-foreground text-xs">
                  {t('editorHint')} <code>class=&quot;down&quot;</code> / <code>class=&quot;up&quot;</code>. {t('editorHint2')}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysis-tags">{t('fields.tags')}</Label>
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
                  <Badge variant={statusVariant(status)}>{ta(`statuses.${status}`)}</Badge>
                  {tags.slice(0, 6).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}
                </div>
                <h1 className="font-semibold text-2xl leading-tight">{editor.title || t('fields.title')}</h1>
                <p className="mt-3 border-l-4 border-primary bg-muted/40 px-4 py-3 text-sm leading-6">
                  {editor.summary || t('fields.summary')}
                </p>
                {effectiveCoverUrl && (
                  <img
                    src={effectiveCoverUrl}
                    alt={editor.imageAlt || editor.title}
                    className="mt-4 aspect-video w-full rounded-md border object-cover"
                  />
                )}
                {isHtmlContent(editor.content) ? (
                  <div className="report-prose mt-5" dangerouslySetInnerHTML={{ __html: editor.content }} />
                ) : (
                  <div className="mt-5 space-y-4">{renderPlainPreview(editor.content)}</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium">{t('publicLink')}</div>
                  <div className="truncate text-muted-foreground text-xs">{previewUrl || t('afterSave')}</div>
                </div>
                <Button size="sm" variant="outline" asChild disabled={!previewUrl || status !== 'published'}>
                  <a href={previewUrl} target="_blank" rel="noreferrer">
                    <Globe className="mr-1.5 h-4 w-4" />
                    {tc('openPage')}
                  </a>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                {t('seoHint')}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="analysis-meta-title">{t('fields.metaTitle')}</Label>
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
                  <Label htmlFor="analysis-meta-description">{t('fields.metaDescription')}</Label>
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
                  {t('googlePreview')}
                </div>
                <div className="text-[#1a0dab] text-base">
                  {(editor.metaTitle || buildDefaultMetaTitle(editor.title)) + (SITE_NAME ? ` | ${SITE_NAME}` : '')}
                </div>
                <div className="text-[#006621] text-xs">{SITE_HOST}/analiz/{editor.slug || slugify(editor.title)}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {editor.metaDescription || buildDefaultMetaDescription(editor.summary)}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 pt-4">
              {effectiveCoverUrl && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">{t('coverShown')}</div>
                  <img
                    src={effectiveCoverUrl}
                    alt={editor.imageAlt || editor.title}
                    className="aspect-[1200/630] w-full rounded-md border bg-background object-cover"
                  />
                </div>
              )}
              <AdminImageUploadField
                label={t('cover.label')}
                helperText={t('cover.hint')}
                value={customOgImage}
                onChange={(url) => setEditor((prev) => ({ ...prev, ogImage: url }))}
                folder="uploads/analysis-reports"
                previewAspect="16x9"
                previewObjectFit="cover"
              />
              <div className="grid gap-2">
                <Label htmlFor="analysis-image-alt">{t('fields.imageAlt')}</Label>
                <Input
                  id="analysis-image-alt"
                  value={editor.imageAlt}
                  placeholder={editor.title}
                  onChange={(event) => setEditor((prev) => ({ ...prev, imageAlt: event.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="quality" className="pt-4">
              <AnalysisReportQualityPanel id={id} isNew={isNew} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
