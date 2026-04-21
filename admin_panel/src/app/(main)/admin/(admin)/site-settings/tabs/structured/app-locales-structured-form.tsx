// =============================================================
// app-locales-structured-form.tsx — Dil yönetimi
// =============================================================

"use client";

import React from "react";
import { SITE_SETTINGS_AVAILABLE_LANGUAGES } from '@/integrations/shared';

import { useAdminTranslations } from "@/i18n";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

/* ── types ── */

export type LocaleItem = {
  code: string;
  label: string;
  is_default: boolean;
  is_active: boolean;
};

export type AppLocalesStructuredFormProps = {
  value: any;
  onChange: (next: LocaleItem[]) => void;
  disabled?: boolean;
};

/* ── helpers ── */

function toArray(v: any): LocaleItem[] {
  if (Array.isArray(v)) return v.filter((i) => i && typeof i === "object" && i.code);
  return [];
}

export function appLocalesObjToForm(v: any): LocaleItem[] {
  return toArray(v).map((item) => ({
    code: String(item.code || "").trim(),
    label: String(item.label || "").trim(),
    is_default: !!item.is_default,
    is_active: !!item.is_active,
  }));
}

export function appLocalesFormToObj(items: LocaleItem[]): LocaleItem[] {
  return items.map((item) => ({
    code: item.code.trim().toLowerCase(),
    label: item.label.trim(),
    is_default: item.is_default,
    is_active: item.is_active,
  }));
}

/* ── component ── */

export const AppLocalesStructuredForm: React.FC<AppLocalesStructuredFormProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const items = appLocalesObjToForm(value);
  const [addValue, setAddValue] = React.useState("");

  const existingCodes = new Set(items.map((i) => i.code));
  const availableToAdd = SITE_SETTINGS_AVAILABLE_LANGUAGES.filter((l) => !existingCodes.has(l.code));

  const update = (index: number, patch: Partial<LocaleItem>) => {
    const next = items.map((item, i) => {
      if (i !== index) return item;
      return { ...item, ...patch };
    });

    if (patch.is_default) {
      for (let i = 0; i < next.length; i++) {
        if (i !== index) next[i] = { ...next[i], is_default: false };
      }
    }

    onChange(appLocalesFormToObj(next));
  };

  const add = (code: string) => {
    const lang = SITE_SETTINGS_AVAILABLE_LANGUAGES.find((l) => l.code === code);
    if (!lang) return;
    const next = [...items, { code: lang.code, label: lang.label, is_default: false, is_active: true }];
    onChange(appLocalesFormToObj(next));
    setAddValue("");
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onChange(appLocalesFormToObj(next));
  };

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.appLocales.description')}
        </AlertDescription>
      </Alert>

      {/* Mevcut diller */}
      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={`${item.code}-${i}`}
            className="flex items-center gap-3 rounded-md border px-3 py-2"
          >
            <span className="w-8 text-center font-mono text-sm font-medium uppercase">
              {item.code}
            </span>
            <span className="flex-1 text-sm">{item.label}</span>

            <div className="flex items-center gap-2">
              <Switch
                checked={item.is_default}
                onCheckedChange={(v) => update(i, { is_default: v })}
                disabled={disabled}
              />
              <Label className="text-[10px] w-16">{t('admin.siteSettings.structured.appLocales.defaultLabel')}</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={item.is_active}
                onCheckedChange={(v) => update(i, { is_active: v })}
                disabled={disabled}
              />
              <Label className="text-[10px] w-8">{t('admin.siteSettings.structured.appLocales.activeLabel')}</Label>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
              onClick={() => remove(i)}
              disabled={disabled || item.is_default}
              title={item.is_default ? t('admin.siteSettings.structured.appLocales.defaultCannotDelete') : t('admin.siteSettings.structured.appLocales.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Yeni dil ekle */}
      {availableToAdd.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={addValue} onValueChange={(v) => add(v)} disabled={disabled}>
            <SelectTrigger className="w-60 h-8">
              <SelectValue placeholder={t('admin.siteSettings.structured.appLocales.selectLocale')} />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  <span className="font-mono text-xs mr-2">{l.code}</span>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{t('admin.siteSettings.structured.appLocales.addNew')}</span>
        </div>
      )}
    </div>
  );
};

AppLocalesStructuredForm.displayName = "AppLocalesStructuredForm";
