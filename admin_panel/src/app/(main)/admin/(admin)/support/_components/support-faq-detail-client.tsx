"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { AIActionDropdown } from "@/app/(main)/admin/_components/common/ai-action-dropdown";
import { AIResultsPanel } from "@/app/(main)/admin/_components/common/ai-results-panel";
import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import {
  type AIAction,
  type LocaleContent,
  useAIContentAssist,
} from "@/app/(main)/admin/_components/common/use-ai-content-assist";
import { AdminLocaleSelect } from "@/components/common/admin-locale-select";
import { useAdminLocales } from "@/components/common/use-admin-locales";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSupportFaqAdminMutation,
  useGetSupportFaqAdminQuery,
  useListSupportFaqsAdminQuery,
  useUpdateSupportFaqAdminMutation,
} from "@/integrations/hooks";
import {
  type AdminLocaleOption,
  buildSupportFaqsListQueryParams,
  FAQ_CATEGORY_OPTIONS,
  type FaqCategory,
  SUPPORT_DEFAULT_LOCALE,
  type SupportFaqCreatePayload,
  type SupportFaqDto,
} from "@/integrations/shared";

type SupportFaqDetailTabKey = "content" | "seo" | "json";

type SupportFaqFormState = {
  locale: string;
  question: string;
  answer: string;
  category: FaqCategory;
  display_order: number;
  is_published: boolean;
};

function createEmptySupportFaqForm(locale: string): SupportFaqFormState {
  return {
    locale,
    question: "",
    answer: "",
    category: "genel",
    display_order: 0,
    is_published: true,
  };
}

function mapSupportFaqToForm(item: SupportFaqDto, locale: string): SupportFaqFormState {
  return {
    locale,
    question: item.question || "",
    answer: item.answer || "",
    category: item.category || "genel",
    display_order: item.display_order || 0,
    is_published: Boolean(item.is_published),
  };
}

export default function SupportFaqDetailClient({ id }: { id: string }) {
  const t = useAdminT("admin.support");
  const router = useRouter();
  const isNew = id === "new";

  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();
  const [activeLocale, setActiveLocale] = React.useState(() =>
    coerceLocale(defaultLocaleFromDb, SUPPORT_DEFAULT_LOCALE),
  );
  const [activeTab, setActiveTab] = React.useState<SupportFaqDetailTabKey>("content");
  const [formData, setFormData] = React.useState<SupportFaqFormState>(() =>
    createEmptySupportFaqForm(coerceLocale(defaultLocaleFromDb, SUPPORT_DEFAULT_LOCALE)),
  );
  const [aiResults, setAiResults] = React.useState<LocaleContent[] | null>(null);
  const formInitRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setActiveLocale((prev: string) => coerceLocale(prev, defaultLocaleFromDb || SUPPORT_DEFAULT_LOCALE));
  }, [coerceLocale, defaultLocaleFromDb]);

  const fallbackListQueryParams = React.useMemo(
    () => ({
      ...buildSupportFaqsListQueryParams({ locale: activeLocale }),
      limit: 100,
      offset: 0,
    }),
    [activeLocale],
  );

  const { data: faq, isFetching } = useGetSupportFaqAdminQuery({ id, locale: activeLocale }, { skip: isNew });
  const { data: faqList = [] } = useListSupportFaqsAdminQuery(fallbackListQueryParams, { skip: isNew });

  const [createFaq, { isLoading: isCreating }] = useCreateSupportFaqAdminMutation();
  const [updateFaq, { isLoading: isUpdating }] = useUpdateSupportFaqAdminMutation();
  const { assist: aiAssist, loading: aiLoading } = useAIContentAssist();

  const resolvedFaq = React.useMemo(() => faq || faqList.find((item) => item.id === id) || null, [faq, faqList, id]);

  React.useEffect(() => {
    if (!resolvedFaq || isNew) return;
    const key = `${resolvedFaq.id}-${activeLocale}`;
    if (formInitRef.current === key) return;
    formInitRef.current = key;
    setFormData(mapSupportFaqToForm(resolvedFaq, activeLocale));
  }, [activeLocale, isNew, resolvedFaq]);

  const handleChange = <K extends keyof SupportFaqFormState>(field: K, value: SupportFaqFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAIAction = async (action: AIAction) => {
    const targetLocales = (localeOptions || [])
      .map((item: AdminLocaleOption) => String(item.value || "").trim())
      .filter(Boolean);

    if (!targetLocales.length) {
      const fallbackLocale = String(activeLocale || defaultLocaleFromDb || SUPPORT_DEFAULT_LOCALE).trim();
      if (fallbackLocale) targetLocales.push(fallbackLocale);
    }

    const result = await aiAssist({
      title: formData.question,
      content: formData.answer,
      locale: activeLocale,
      target_locales: targetLocales,
      module_key: "support_faqs",
      action,
    });

    if (!result) return;
    setAiResults(result);

    const current = result.find((item) => item.locale === activeLocale) || result[0];
    if (!current) return;

    setFormData((prev) => ({
      ...prev,
      question: current.title || prev.question,
      answer: current.content || current.summary || prev.answer,
    }));
  };

  const handleApplyAILocale = (item: LocaleContent) => {
    formInitRef.current = `${id}-${item.locale}`;
    setActiveLocale(item.locale);
    setFormData((prev) => ({
      ...prev,
      locale: item.locale,
      question: item.title || prev.question,
      answer: item.content || item.summary || prev.answer,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error(t("messages.requiredError"));
      return;
    }

    const payload: SupportFaqCreatePayload & { locale: string } = {
      locale: activeLocale,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category: formData.category,
      display_order: Number(formData.display_order) || 0,
      is_published: formData.is_published,
    };

    try {
      if (isNew) {
        const result = await createFaq(payload).unwrap();
        toast.success(t("faqs.created"));
        if (result?.id) router.push(`/admin/support/faqs/${result.id}`);
      } else {
        await updateFaq({ id, body: payload }).unwrap();
        formInitRef.current = null;
        toast.success(t("faqs.updated"));
      }
    } catch (error: unknown) {
      const errMsg =
        typeof error === "object" && error !== null && "data" in error
          ? String(
              (
                error as {
                  data?: { error?: { message?: string } };
                  message?: string;
                }
              ).data?.error?.message ||
                (error as { message?: string }).message ||
                t("messages.unknownError"),
            )
          : t("messages.unknownError");
      toast.error(`${t("messages.errorPrefix")}: ${errMsg}`);
    }
  };

  const seoQuestionPreview = formData.question.trim() || t("detail.seoQuestionFallback");
  const seoAnswerPreview = formData.answer.trim() || t("detail.seoAnswerFallback");
  const seoSchemaPreview = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: seoQuestionPreview,
          acceptedAnswer: {
            "@type": "Answer",
            text: seoAnswerPreview,
          },
        },
      ],
    },
    null,
    2,
  );
  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/support")}
            title={t("actions.back")}
            aria-label={t("actions.back")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("actions.back")}
          </Button>
          <h1 className="font-semibold text-lg">{isNew ? t("detail.newTitle") : t("detail.editTitle")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {localeOptions.length > 0 && (
            <AdminLocaleSelect
              value={activeLocale}
              onChange={(value: string) => {
                setActiveLocale(value);
                setFormData((prev) => ({ ...prev, locale: value }));
              }}
              options={localeOptions}
            />
          )}
          <AIActionDropdown
            onAction={handleAIAction}
            loading={aiLoading}
            disabled={isSaving || isFetching || !formData.question.trim()}
          />
          <Button size="sm" onClick={handleSubmit} disabled={isSaving || isFetching}>
            <Save className="mr-1 h-4 w-4" />
            {t("actions.save")}
          </Button>
        </div>
      </div>

      {aiResults && aiResults.length > 1 && (
        <AIResultsPanel
          results={aiResults}
          currentLocale={activeLocale}
          onApply={handleApplyAILocale}
          onClose={() => setAiResults(null)}
        />
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SupportFaqDetailTabKey)}>
        <TabsList>
          <TabsTrigger value="content">{t("detail.tabs.content")}</TabsTrigger>
          <TabsTrigger value="seo">{t("detail.tabs.seo")}</TabsTrigger>
          <TabsTrigger value="json">{t("detail.tabs.json")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.contentTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="faq-category">{t("faqs.category")}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value as FaqCategory)}
                    disabled={isSaving}
                  >
                    <SelectTrigger id="faq-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faq-order">{t("faqs.displayOrder")}</Label>
                  <Input
                    id="faq-order"
                    type="number"
                    min={0}
                    value={String(formData.display_order)}
                    onChange={(e) => handleChange("display_order", Number.parseInt(e.target.value || "0", 10) || 0)}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-question">{t("faqs.question")}</Label>
                <Input
                  id="faq-question"
                  value={formData.question}
                  onChange={(e) => handleChange("question", e.target.value)}
                  placeholder={t("faqs.questionPlaceholder")}
                  disabled={isSaving}
                />
                <p className="text-muted-foreground text-xs">{t("faqs.questionSeoHint")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-answer">{t("faqs.answer")}</Label>
                <Textarea
                  id="faq-answer"
                  rows={10}
                  value={formData.answer}
                  onChange={(e) => handleChange("answer", e.target.value)}
                  placeholder={t("faqs.answerPlaceholder")}
                  disabled={isSaving}
                />
                <p className="text-muted-foreground text-xs">{t("faqs.answerSeoHint")}</p>
              </div>

              <div className="flex items-center gap-3 rounded-md border p-3">
                <Switch
                  id="faq-published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => handleChange("is_published", checked)}
                  disabled={isSaving}
                />
                <div className="space-y-1">
                  <Label htmlFor="faq-published">{t("faqs.isPublished")}</Label>
                  <p className="text-muted-foreground text-xs">{t("faqs.publishHint")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.seoTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 rounded-md border p-4">
                  <h3 className="font-medium">{t("detail.seoChecklistTitle")}</h3>
                  <p className="text-muted-foreground text-sm">{t("detail.seoChecklistQuestion")}</p>
                  <p className="text-muted-foreground text-sm">{t("detail.seoChecklistAnswer")}</p>
                  <p className="text-muted-foreground text-sm">{t("detail.seoChecklistLocale")}</p>
                </div>
                <div className="space-y-2 rounded-md border p-4">
                  <h3 className="font-medium">{t("detail.seoPreviewTitle")}</h3>
                  <p className="text-muted-foreground text-sm">{seoQuestionPreview}</p>
                  <p className="text-muted-foreground text-sm">{seoAnswerPreview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="json">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.jsonTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("detail.schemaTitle")}</Label>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-4 text-xs leading-6">
                  {seoSchemaPreview}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
