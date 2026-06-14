"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { AdminImageUploadField } from "@/app/(main)/admin/_components/common/admin-image-upload-field";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePopupAdminMutation, useGetPopupAdminQuery, useUpdatePopupAdminMutation } from "@/integrations/hooks";
import {
  createEmptyPopupDetailForm,
  mapPopupToDetailForm,
  POPUP_DEFAULT_LOCALE,
  POPUP_DISPLAY_FREQUENCY_OPTIONS,
  POPUP_LINK_TARGET_OPTIONS,
  POPUP_TEXT_BEHAVIOR_OPTIONS,
  POPUP_TYPE_OPTIONS,
  type PopupDetailTabKey,
  parseTargetPaths,
} from "@/integrations/shared";

interface Props {
  id: string;
}

export default function PopupDetailClient({ id }: Props) {
  const t = useAdminT("admin.popups");
  const router = useRouter();
  const isNew = id === "new";

  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();
  const [activeLocale, setActiveLocale] = React.useState(() => coerceLocale(defaultLocaleFromDb, POPUP_DEFAULT_LOCALE));
  const [activeTab, setActiveTab] = React.useState<PopupDetailTabKey>("content");

  React.useEffect(() => {
    setActiveLocale((prev: string) => coerceLocale(prev, defaultLocaleFromDb || POPUP_DEFAULT_LOCALE));
  }, [coerceLocale, defaultLocaleFromDb]);

  const numericId = isNew ? 0 : Number.parseInt(id, 10);

  const {
    data: popup,
    isFetching,
    refetch,
  } = useGetPopupAdminQuery({ id: numericId, locale: activeLocale }, { skip: isNew });

  const [createPopup, { isLoading: isCreating }] = useCreatePopupAdminMutation();
  const [updatePopup, { isLoading: isUpdating }] = useUpdatePopupAdminMutation();

  const [formData, setFormData] = React.useState(() => createEmptyPopupDetailForm(activeLocale));
  const formInitRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!popup || isNew) return;
    const key = `${popup.id}-${activeLocale}`;
    if (formInitRef.current === key) return;
    formInitRef.current = key;
    setFormData(mapPopupToDetailForm(popup, activeLocale));
  }, [popup, isNew, activeLocale]);

  React.useEffect(() => {
    if (!isNew && id) {
      formInitRef.current = null;
      refetch();
    }
  }, [id, isNew, refetch]);

  const handleChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // AI
  const { assist: aiAssist, loading: aiLoading } = useAIContentAssist();
  const [aiResults, setAiResults] = React.useState<LocaleContent[] | null>(null);

  const handleAIAction = async (action: AIAction) => {
    const targetLocales = (localeOptions || []).map((localeOption: { value?: string }) => String(localeOption.value || "")).filter(Boolean);
    if (!targetLocales.length) {
      const fallbackLocale = String(activeLocale || defaultLocaleFromDb || POPUP_DEFAULT_LOCALE).trim();
      if (fallbackLocale) targetLocales.push(fallbackLocale);
    }
    const result = await aiAssist({
      title: formData.title,
      summary: "",
      content: formData.content,
      locale: activeLocale,
      target_locales: targetLocales,
      module_key: "popups",
      action,
    });
    if (!result) return;
    setAiResults(result);
    const current = result.find((r) => r.locale === activeLocale) || result[0];
    if (current) {
      setFormData((prev) => ({
        ...prev,
        title: current.title ?? prev.title,
        content: current.content ?? prev.content,
      }));
    }
  };

  const handleApplyAILocale = (lc: LocaleContent) => {
    formInitRef.current = `${id}-${lc.locale}`;
    setActiveLocale(lc.locale);
    setFormData((prev) => ({
      ...prev,
      locale: lc.locale,
      title: lc.title || "",
      content: lc.content || lc.summary || "",
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast.error(t("messages.requiredError"));
      return;
    }
    try {
      const payload = {
        locale: activeLocale,
        type: formData.type,
        title: formData.title,
        content: formData.content || "",
        link_url: formData.link_url || null,
        link_target: formData.link_target || "_self",
        target_paths: parseTargetPaths(formData.target_paths),
        background_color: formData.background_color || null,
        text_color: formData.text_color || null,
        button_text: formData.button_text || null,
        button_color: formData.button_color || null,
        button_hover_color: formData.button_hover_color || null,
        button_text_color: formData.button_text_color || null,
        text_behavior: formData.text_behavior || "static",
        scroll_speed: formData.scroll_speed,
        closeable: formData.closeable,
        delay_seconds: formData.delay_seconds,
        display_frequency: formData.display_frequency || "always",
        is_active: formData.is_active,
        display_order: formData.display_order,
        start_at: formData.start_at || null,
        end_at: formData.end_at || null,
        image_url: formData.image_url || null,
        image_asset_id: formData.image_asset_id || null,
        alt: formData.alt || null,
      };
      if (isNew) {
        const result = await createPopup(payload).unwrap();
        toast.success(t("messages.created"));
        if (result?.id) router.push(`/admin/popups/${result.id}`);
      } else {
        await updatePopup({ id: numericId, patch: payload }).unwrap();
        formInitRef.current = null;
        toast.success(t("messages.updated"));
      }
    } catch (error) {
      const errMsg =
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        typeof error.data === "object" &&
        error.data !== null &&
        "error" in error.data &&
        typeof error.data.error === "object" &&
        error.data.error !== null &&
        "message" in error.data.error &&
        typeof error.data.error.message === "string"
          ? error.data.error.message
          : error instanceof Error
            ? error.message
            : t("messages.unknownError");
      toast.error(`${t("messages.errorPrefix")}: ${errMsg}`);
    }
  };

  const isSaving = isCreating || isUpdating;

  const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/popups")}
            title={t("actions.back")}
            aria-label={t("actions.back")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("actions.back")}
          </Button>
          <h1 className="font-semibold text-lg">{isNew ? t("detail.newTitle") : t("detail.editTitle")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {localeOptions && localeOptions.length > 0 && (
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
            disabled={isSaving || isFetching || !formData.title.trim()}
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PopupDetailTabKey)}>
        <TabsList>
          <TabsTrigger value="content">{t("tabs.content")}</TabsTrigger>
          <TabsTrigger value="styling">{t("tabs.styling")}</TabsTrigger>
          <TabsTrigger value="behavior">{t("tabs.behavior")}</TabsTrigger>
          <TabsTrigger value="seo">{t("tabs.seo")}</TabsTrigger>
        </TabsList>

        {/* CONTENT */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.contentTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.type")}</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className={selectClass}
                  >
                    {POPUP_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`form.typeOptions.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("form.title")}</Label>
                  <Input
                    placeholder={t("form.titlePlaceholder")}
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("form.content")}</Label>
                <Textarea
                  placeholder={t("form.contentPlaceholder")}
                  value={formData.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.linkUrl")}</Label>
                  <Input
                    placeholder={t("form.linkUrlPlaceholder")}
                    value={formData.link_url}
                    onChange={(e) => handleChange("link_url", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.linkTarget")}</Label>
                  <select
                    value={formData.link_target}
                    onChange={(e) => handleChange("link_target", e.target.value)}
                    className={selectClass}
                  >
                    {POPUP_LINK_TARGET_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`form.linkTargetOptions.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("form.targetPaths")}</Label>
                <Textarea
                  placeholder={t("form.targetPathsPlaceholder")}
                  value={formData.target_paths}
                  onChange={(e) => handleChange("target_paths", e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STYLING */}
        <TabsContent value="styling">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.stylingTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.backgroundColor")}</Label>
                  <Input
                    type="color"
                    value={formData.background_color || "#000000"}
                    onChange={(e) => handleChange("background_color", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.textColor")}</Label>
                  <Input
                    type="color"
                    value={formData.text_color || "#ffffff"}
                    onChange={(e) => handleChange("text_color", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("form.buttonText")}</Label>
                <Input
                  placeholder={t("form.buttonTextPlaceholder")}
                  value={formData.button_text}
                  onChange={(e) => handleChange("button_text", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.buttonColor")}</Label>
                  <Input
                    type="color"
                    value={formData.button_color || "#3b82f6"}
                    onChange={(e) => handleChange("button_color", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.buttonHoverColor")}</Label>
                  <Input
                    type="color"
                    value={formData.button_hover_color || "#2563eb"}
                    onChange={(e) => handleChange("button_hover_color", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.buttonTextColor")}</Label>
                  <Input
                    type="color"
                    value={formData.button_text_color || "#ffffff"}
                    onChange={(e) => handleChange("button_text_color", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BEHAVIOR */}
        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.behaviorTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.textBehavior")}</Label>
                  <select
                    value={formData.text_behavior}
                    onChange={(e) => handleChange("text_behavior", e.target.value)}
                    className={selectClass}
                  >
                    {POPUP_TEXT_BEHAVIOR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`form.textBehaviorOptions.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("form.scrollSpeed")}</Label>
                  <Input
                    type="number"
                    value={formData.scroll_speed || ""}
                    onChange={(e) => handleChange("scroll_speed", Number.parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.delaySeconds")}</Label>
                  <Input
                    type="number"
                    value={formData.delay_seconds || ""}
                    onChange={(e) => handleChange("delay_seconds", Number.parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.displayFrequency")}</Label>
                  <select
                    value={formData.display_frequency}
                    onChange={(e) => handleChange("display_frequency", e.target.value)}
                    className={selectClass}
                  >
                    {POPUP_DISPLAY_FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {t(`form.displayFrequencyOptions.${opt}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.closeable} onCheckedChange={(v) => handleChange("closeable", v)} />
                  <Label>{t("form.closeable")}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={(v) => handleChange("is_active", v)} />
                  <Label>{t("form.isActive")}</Label>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("form.displayOrder")}</Label>
                  <Input
                    type="number"
                    value={formData.display_order || ""}
                    onChange={(e) => handleChange("display_order", Number.parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.startAt")}</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_at}
                    onChange={(e) => handleChange("start_at", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("form.endAt")}</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_at}
                    onChange={(e) => handleChange("end_at", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.seoTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">{t("detail.imageHelp")}</p>
                <div className="max-w-md">
                  <AdminImageUploadField
                    label={t("form.imageUpload")}
                    value={formData.image_url}
                    onChange={(url) => handleChange("image_url", url)}
                    disabled={isSaving || isFetching}
                    folder="uploads/popups"
                    previewAspect="4x3"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("form.alt")}</Label>
                <Input
                  placeholder={t("form.altPlaceholder")}
                  value={formData.alt}
                  onChange={(e) => handleChange("alt", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
