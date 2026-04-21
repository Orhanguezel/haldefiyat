"use client";

import * as React from "react";

import { CircleDot, Palette, RotateCcw, Save, Type } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetThemeAdminQuery, useResetThemeAdminMutation, useUpdateThemeAdminMutation } from "@/integrations/hooks";
import type { ColorTokens, ThemeConfig } from "@/integrations/shared";
import {
  groupThemeColorTokens,
  RADIUS_OPTIONS,
  THEME_DARK_MODE_OPTIONS,
  THEME_FONT_BODY_PLACEHOLDER,
  THEME_FONT_HEADING_PLACEHOLDER,
  THEME_RADIUS_PREVIEW_SIZES,
  toThemeDraft,
} from "@/integrations/shared";

import { ColorField } from "./color-field";
import { ThemePreview } from "./theme-preview";

/* ── Main Component ── */

export default function AdminThemeClient() {
  const t = useAdminT("admin.theme");
  const { data: theme, isLoading } = useGetThemeAdminQuery();
  const [updateTheme, { isLoading: saving }] = useUpdateThemeAdminMutation();
  const [resetTheme, { isLoading: resetting }] = useResetThemeAdminMutation();

  const [draft, setDraft] = React.useState<ThemeConfig | null>(null);

  React.useEffect(() => {
    if (theme && !draft) setDraft(toThemeDraft(theme));
  }, [theme, draft]);

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="size-8" />
      </div>
    );
  }

  const setColor = (key: keyof ColorTokens, val: string) => {
    setDraft((prev) => (prev ? { ...prev, colors: { ...prev.colors, [key]: val } } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    try {
      await updateTheme({
        colors: {
          primary: draft.colors.primary,
          accent: draft.colors.accent,
          background: draft.colors.background,
          foreground: draft.colors.textStrong,
          mutedFg: draft.colors.textMuted,
          border: draft.colors.border,
          navBg: draft.colors.navBg,
          navFg: draft.colors.navFg,
          footerBg: draft.colors.footerBg,
          footerFg: draft.colors.footerFg,
        },
        fontFamily: draft.typography.fontBody,
        radius: draft.radius,
        darkMode: draft.darkMode,
      }).unwrap();
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleReset = async () => {
    try {
      const result = await resetTheme().unwrap();
      setDraft(toThemeDraft(result));
      toast.success(t("reset"));
    } catch {
      toast.error(t("resetError"));
    }
  };

  // Group colors by group
  const groups = groupThemeColorTokens();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} disabled={saving || resetting}>
                <RotateCcw className="mr-2 size-4" />
                {t("resetButton")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || resetting}>
                <Save className="mr-2 size-4" />
                {saving ? t("saving") : t("saveButton")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sol: Ayarlar */}
        <div className="xl:col-span-2 space-y-6">
          <Tabs defaultValue="colors">
            <TabsList>
              <TabsTrigger value="colors">
                <Palette className="mr-2 size-4" />
                {t("colorsTab")}
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="mr-2 size-4" />
                {t("typographyTab")}
              </TabsTrigger>
              <TabsTrigger value="general">
                <CircleDot className="mr-2 size-4" />
                {t("generalTab")}
              </TabsTrigger>
            </TabsList>

            {/* ── Colors Tab ── */}
            <TabsContent value="colors" className="space-y-4 mt-4">
              {Array.from(groups.entries()).map(([group, keys]) => (
                <Card key={group}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{group}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {keys.map((key) => (
                        <ColorField key={key} tokenKey={key} value={draft.colors[key]} onChange={setColor} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ── Typography Tab ── */}
            <TabsContent value="typography" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("fonts")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("fontHeading")}</Label>
                    <Input
                      value={draft.typography.fontHeading}
                      onChange={(e) =>
                        setDraft((p) =>
                          p ? { ...p, typography: { ...p.typography, fontHeading: e.target.value } } : p,
                        )
                      }
                      placeholder={THEME_FONT_HEADING_PLACEHOLDER}
                    />
                    <div className="text-2xl font-bold mt-2" style={{ fontFamily: draft.typography.fontHeading }}>
                      {t("fontHeadingPreview")}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>{t("fontBody")}</Label>
                    <Input
                      value={draft.typography.fontBody}
                      onChange={(e) =>
                        setDraft((p) => (p ? { ...p, typography: { ...p.typography, fontBody: e.target.value } } : p))
                      }
                      placeholder={THEME_FONT_BODY_PLACEHOLDER}
                    />
                    <div className="text-sm mt-2" style={{ fontFamily: draft.typography.fontBody }}>
                      {t("fontBodyPreview")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── General Tab ── */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("borderRadius")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={draft.radius}
                    onValueChange={(v) => setDraft((p) => (p ? { ...p, radius: v as any } : p))}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-3 mt-3">
                    {THEME_RADIUS_PREVIEW_SIZES.map((size, i) => (
                      <div
                        key={size}
                        className="size-16 border-2 flex items-center justify-center text-xs font-medium"
                        style={{
                          borderRadius: `calc(${draft.radius} * ${0.5 + i * 0.5})`,
                          borderColor: draft.colors.primary,
                          color: draft.colors.textBody,
                        }}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">{t("darkModeLabel")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {THEME_DARK_MODE_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                      <Button
                        key={value}
                        variant={draft.darkMode === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDraft((p) => (p ? { ...p, darkMode: value } : p))}
                      >
                        <Icon className="mr-2 size-4" />
                        {t(labelKey)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sağ: Canlı Önizleme */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t("preview.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemePreview colors={draft.colors} t={t} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
