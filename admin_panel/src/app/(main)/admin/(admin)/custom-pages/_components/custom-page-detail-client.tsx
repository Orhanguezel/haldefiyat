'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { ImagesGalleryTab } from '@/app/(main)/admin/_components/common/images-gallery-tab';
import RichContentEditor from '@/app/(main)/admin/_components/common/rich-content-editor';
import { AIActionDropdown } from '@/app/(main)/admin/_components/common/ai-action-dropdown';
import { AIResultsPanel } from '@/app/(main)/admin/_components/common/ai-results-panel';
import { useAIContentAssist, type AIAction, type LocaleContent } from '@/app/(main)/admin/_components/common/use-ai-content-assist';
import { useAdminLocales } from '@/components/common/use-admin-locales';
import { AdminLocaleSelect } from '@/components/common/admin-locale-select';
import {
  useGetCustomPageAdminQuery,
  useCreateCustomPageAdminMutation,
  useUpdateCustomPageAdminMutation,
} from '@/integrations/hooks';
import {
  createEmptyCustomPageDetailForm,
  mapCustomPageToDetailForm,
  CUSTOM_PAGE_DEFAULT_LOCALE,
  type CustomPageDetailTabKey,
} from '@/integrations/shared';

interface Props {
  id: string;
}

export default function CustomPageDetailClient({ id }: Props) {
  const t = useAdminT('admin.custom-pages');
  const router = useRouter();
  const isNew = id === 'new';

  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();
  const [activeLocale, setActiveLocale] = React.useState(() =>
    coerceLocale(defaultLocaleFromDb, CUSTOM_PAGE_DEFAULT_LOCALE),
  );
  const [activeTab, setActiveTab] = React.useState<CustomPageDetailTabKey>('content');

  React.useEffect(() => {
    setActiveLocale((prev: string) => coerceLocale(prev, defaultLocaleFromDb || CUSTOM_PAGE_DEFAULT_LOCALE));
  }, [coerceLocale, defaultLocaleFromDb]);

  const { data: page, isFetching, refetch } = useGetCustomPageAdminQuery(
    { id, locale: activeLocale },
    { skip: isNew },
  );

  const [createPage, { isLoading: isCreating }] = useCreateCustomPageAdminMutation();
  const [updatePage, { isLoading: isUpdating }] = useUpdateCustomPageAdminMutation();

  const [formData, setFormData] = React.useState(() => createEmptyCustomPageDetailForm(activeLocale));
  const formInitRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!page || isNew) return;
    const key = `${page.id}-${activeLocale}`;
    if (formInitRef.current === key) return;
    formInitRef.current = key;
    setFormData(mapCustomPageToDetailForm(page, activeLocale));
  }, [page, isNew, activeLocale]);

  React.useEffect(() => {
    if (!isNew && id) {
      formInitRef.current = null;
      refetch();
    }
  }, [activeLocale, id, isNew, refetch]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // AI
  const { assist: aiAssist, loading: aiLoading } = useAIContentAssist();
  const [aiResults, setAiResults] = React.useState<LocaleContent[] | null>(null);

  const handleAIAction = async (action: AIAction) => {
    const targetLocales = (localeOptions || []).map((l: any) => String(l.value || '')).filter(Boolean);
    if (!targetLocales.length) {
      const fallbackLocale = String(activeLocale || defaultLocaleFromDb || CUSTOM_PAGE_DEFAULT_LOCALE).trim();
      if (fallbackLocale) targetLocales.push(fallbackLocale);
    }
    const result = await aiAssist({
      title: formData.title,
      summary: formData.summary,
      content: formData.content,
      locale: activeLocale,
      target_locales: targetLocales,
      module_key: 'custom_pages',
      action,
    });
    if (!result) return;
    setAiResults(result);
    const current = result.find((r) => r.locale === activeLocale) || result[0];
    if (current) {
      setFormData((prev) => ({
        ...prev,
        title: current.title ?? prev.title,
        slug: current.slug ?? prev.slug,
        content: current.content ?? prev.content,
        summary: current.summary ?? prev.summary,
        meta_title: current.meta_title ?? prev.meta_title,
        meta_description: current.meta_description ?? prev.meta_description,
      }));
    }
  };

  const handleApplyAILocale = (lc: LocaleContent) => {
    // formInitRef'i set et ki refetch sonrasi AI verileri ezilmesin
    formInitRef.current = `${id}-${lc.locale}`;
    setActiveLocale(lc.locale);
    setFormData((prev) => ({
      ...prev,
      locale: lc.locale,
      title: lc.title || '',
      slug: lc.slug || prev.slug,
      content: lc.content || lc.summary || '',
      summary: lc.summary || prev.summary,
      meta_title: lc.meta_title || '',
      meta_description: lc.meta_description || '',
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.slug) {
      toast.error(t('messages.requiredError'));
      return;
    }
    try {
      const payload = {
        ...formData,
        locale: activeLocale,
        featured_image: formData.featured_image || null,
        images: formData.images || [],
      };
      if (isNew) {
        const result = await createPage(payload).unwrap();
        toast.success(t('messages.created'));
        if ((result as any)?.id) router.push(`/admin/custom-pages/${(result as any).id}`);
      } else {
        await updatePage({ id, patch: payload }).unwrap();
        formInitRef.current = null;
        toast.success(t('messages.updated'));
      }
    } catch (error: any) {
      const errMsg = error?.data?.error?.message || error?.message || t('messages.unknownError');
      toast.error(`${t('messages.errorPrefix')}: ${errMsg}`);
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/custom-pages')}
            title={t('actions.back')}
            aria-label={t('actions.back')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />{t('actions.back')}
          </Button>
          <h1 className="text-lg font-semibold">{isNew ? t('detail.newTitle') : t('detail.editTitle')}</h1>
        </div>
        <div className="flex items-center gap-3">
          {localeOptions && localeOptions.length > 0 && (
            <AdminLocaleSelect
              value={activeLocale}
              onChange={(v: string) => { setActiveLocale(v); setFormData((p) => ({ ...p, locale: v })); }}
              options={localeOptions as any}
            />
          )}
          <AIActionDropdown onAction={handleAIAction} loading={aiLoading} disabled={isSaving || isFetching || !formData.title.trim()} />
          <Button size="sm" onClick={handleSubmit} disabled={isSaving || isFetching}>
            <Save className="mr-1 h-4 w-4" />{t('actions.save')}
          </Button>
        </div>
      </div>

      {aiResults && aiResults.length > 1 && (
        <AIResultsPanel results={aiResults} currentLocale={activeLocale} onApply={handleApplyAILocale} onClose={() => setAiResults(null)} />
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CustomPageDetailTabKey)}>
        <TabsList>
          <TabsTrigger value="content">{t('tabs.content')}</TabsTrigger>
          <TabsTrigger value="images">{t('tabs.images')}</TabsTrigger>
          <TabsTrigger value="seo">{t('tabs.seo')}</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('detail.contentTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.title')}</Label>
                  <Input placeholder={t('form.titlePlaceholder')} value={formData.title} onChange={(e) => handleChange('title', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t('form.slug')}</Label>
                  <Input placeholder={t('form.slugPlaceholder')} value={formData.slug} onChange={(e) => handleChange('slug', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('form.summary')}</Label>
                <Textarea placeholder={t('form.summaryPlaceholder')} value={formData.summary} onChange={(e) => handleChange('summary', e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.content')}</Label>
                <RichContentEditor value={formData.content} onChange={(v) => handleChange('content', v)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('form.displayOrder')}</Label>
                  <Input type="number" value={formData.display_order || ''} onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={formData.is_published} onCheckedChange={(v) => handleChange('is_published', v)} />
                  <Label>{t('form.isPublished')}</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('detail.imagesTitle')}</CardTitle></CardHeader>
            <CardContent>
              <ImagesGalleryTab
                coverUrl={formData.featured_image}
                images={formData.images}
                onCoverChange={(url) => setFormData((p) => ({ ...p, featured_image: url }))}
                onImagesChange={(urls) => {
                  setFormData((p) => {
                    const cover = p.featured_image;
                    const merged = cover && !urls.includes(cover) ? [cover, ...urls] : urls;
                    return { ...p, images: merged, featured_image: cover || (urls.length > 0 ? urls[0] : '') };
                  });
                }}
                disabled={isSaving || isFetching}
                folder="uploads/custom-pages"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('detail.seoTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('form.metaTitle')}</Label>
                <Input placeholder={t('form.metaTitlePlaceholder')} value={formData.meta_title} onChange={(e) => handleChange('meta_title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t('form.metaDescription')}</Label>
                <Textarea placeholder={t('form.metaDescriptionPlaceholder')} value={formData.meta_description} onChange={(e) => handleChange('meta_description', e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
