"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateEmailTemplateAdminMutation,
  useDeleteEmailTemplateAdminMutation,
  useGetEmailTemplateAdminQuery,
  useUpdateEmailTemplateAdminMutation,
} from "@/integrations/hooks";
import type { EmailTemplateFormValues } from "@/integrations/shared";

interface Props {
  id: string;
}

function createEmptyForm(): EmailTemplateFormValues {
  return {
    template_key: "",
    is_active: true,
    locale: "tr",
    template_name: "",
    subject: "",
    content: "",
    variablesValue: [],
    detectedVariables: [],
  };
}

function parseVariablesInput(input: string): string[] {
  const value = input.trim();
  if (!value) return [];
  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
            .map(String)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EmailTemplateDetailClient({ id }: Props) {
  const t = useAdminT("admin.emailTemplates");
  const router = useRouter();
  const isNew = id === "new";

  const { data, isFetching } = useGetEmailTemplateAdminQuery({ id }, { skip: isNew });
  const [createTemplate, { isLoading: isCreating }] = useCreateEmailTemplateAdminMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateEmailTemplateAdminMutation();
  const [deleteTemplate, { isLoading: isDeleting }] = useDeleteEmailTemplateAdminMutation();

  const [formData, setFormData] = React.useState<EmailTemplateFormValues>(() => createEmptyForm());
  const [activeTab, setActiveTab] = React.useState<"content" | "variables">("content");
  const [variablesText, setVariablesText] = React.useState("");

  React.useEffect(() => {
    if (!data || isNew) return;
    const translation = data.translations[0];
    const vars = Array.isArray(data.variables) ? data.variables : [];
    setFormData({
      template_key: data.template_key || "",
      is_active: data.is_active,
      locale: translation?.locale || "tr",
      template_name: translation?.template_name || "",
      subject: translation?.subject || "",
      content: translation?.content || "",
      variablesValue: vars,
      detectedVariables: translation?.detected_variables || [],
      parentCreatedAt: data.created_at,
      parentUpdatedAt: data.updated_at,
      translationCreatedAt: translation?.created_at,
      translationUpdatedAt: translation?.updated_at,
    });
    setVariablesText(vars.join(", "));
  }, [data, isNew]);

  const handleSubmit = async () => {
    if (
      !formData.template_key.trim() ||
      !formData.template_name.trim() ||
      !formData.subject.trim() ||
      !formData.content.trim()
    ) {
      toast.error(t("detail.validation.contentRequired"));
      return;
    }

    const variables = parseVariablesInput(variablesText);
    const payload = {
      template_key: formData.template_key.trim(),
      template_name: formData.template_name.trim(),
      subject: formData.subject.trim(),
      content: formData.content,
      variables,
      is_active: formData.is_active,
      locale: formData.locale,
    };

    try {
      if (isNew) {
        const created = await createTemplate(payload).unwrap();
        toast.success(t("detail.toast.created"));
        if (created?.id) router.push(`/admin/email-templates/${created.id}`);
      } else {
        await updateTemplate({ id, body: payload }).unwrap();
        toast.success(t("detail.toast.updated"));
      }
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        t("detail.dialog.description", { template: formData.template_name || t("detail.dialog.templateFallback") }),
      )
    )
      return;
    try {
      await deleteTemplate({ id }).unwrap();
      toast.success(t("detail.toast.deleted"));
      router.push("/admin/email-templates");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/admin/email-templates")}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("detail.backToList")}
          </Button>
          <h1 className="font-semibold text-lg">{isNew ? t("detail.titleCreate") : t("detail.titleEdit")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting || isFetching}>
              <Trash2 className="mr-1 h-4 w-4" />
              {t("detail.actions.delete")}
            </Button>
          )}
          <Button size="sm" onClick={handleSubmit} disabled={isSaving || isFetching}>
            <Save className="mr-1 h-4 w-4" />
            {t("detail.actions.save")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "content" | "variables")}>
        <TabsList>
          <TabsTrigger value="content">{t("detail.sections.content")}</TabsTrigger>
          <TabsTrigger value="variables">{t("detail.sections.variables")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.sections.templateInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("detail.fields.templateKeyLabel")}</Label>
                  <Input
                    value={formData.template_key}
                    onChange={(e) => setFormData((prev) => ({ ...prev, template_key: e.target.value }))}
                    placeholder={t("detail.fields.templateKeyPlaceholder")}
                    readOnly={!isNew}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(value) => setFormData((prev) => ({ ...prev, is_active: value }))}
                  />
                  <Label>{t("detail.fields.statusLabel")}</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("detail.fields.templateNameLabel")}</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, template_name: e.target.value }))}
                  placeholder={t("detail.fields.templateNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("detail.fields.subjectLabel")}</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder={t("detail.fields.subjectPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("detail.fields.contentLabel")}</Label>
                <Textarea
                  rows={14}
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={t("detail.fields.contentPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("detail.sections.variables")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("detail.fields.variablesLabel")}</Label>
                <Textarea
                  rows={4}
                  value={variablesText}
                  onChange={(e) => setVariablesText(e.target.value)}
                  placeholder={t("detail.fields.variablesPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("detail.fields.detectedVariablesLabel")}</Label>
                <Input value={formData.detectedVariables.join(", ")} readOnly />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
