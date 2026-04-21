// =============================================================
// hero-structured-form.tsx — Anasayfa hero video ve metin ayarları
// =============================================================

"use client";

import React from "react";
import {
  SITE_SETTINGS_HERO_EMPTY,
  SITE_SETTINGS_HERO_MEDIA_FIELDS,
  SITE_SETTINGS_HERO_TEXT_FIELDS,
  toStructuredObjectSeed,
} from '@/integrations/shared';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminImageUploadField } from "@/app/(main)/admin/_components/common/admin-image-upload-field";

/* ── types ── */

type HeroData = {
  video_desktop: string;
  video_mobile: string;
  video_poster: string;
  headline_tr: string;
  headline_en: string;
  subheadline_tr: string;
  subheadline_en: string;
  cta_text_tr: string;
  cta_text_en: string;
  cta_url: string;
};

export type HeroStructuredFormProps = {
  value: any;
  onChange: (next: HeroData) => void;
  disabled?: boolean;
};

/* ── helpers ── */

function toHero(v: any): HeroData {
  const o = toStructuredObjectSeed(v, SITE_SETTINGS_HERO_EMPTY);
  return {
    video_desktop: String(o.video_desktop ?? ""),
    video_mobile: String(o.video_mobile ?? ""),
    video_poster: String(o.video_poster ?? ""),
    headline_tr: String(o.headline_tr ?? ""),
    headline_en: String(o.headline_en ?? ""),
    subheadline_tr: String(o.subheadline_tr ?? ""),
    subheadline_en: String(o.subheadline_en ?? ""),
    cta_text_tr: String(o.cta_text_tr ?? ""),
    cta_text_en: String(o.cta_text_en ?? ""),
    cta_url: String(o.cta_url ?? ""),
  };
}

export function heroObjToForm(v: any): HeroData {
  return toHero(v);
}

export function heroFormToObj(v: HeroData): HeroData {
  return v;
}

/* ── component ── */

export const HeroStructuredForm: React.FC<HeroStructuredFormProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const hero = React.useMemo(() => toHero(value), [value]);
  const set = (patch: Partial<HeroData>) => onChange({ ...hero, ...patch });

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.hero.description')}
        </AlertDescription>
      </Alert>

      {/* Video section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t('admin.siteSettings.structured.hero.sections.media')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <AdminImageUploadField
              label={t(`admin.siteSettings.structured.hero.labels.${SITE_SETTINGS_HERO_MEDIA_FIELDS[0].labelKey}`)}
              helperText={t(`admin.siteSettings.structured.hero.help.${SITE_SETTINGS_HERO_MEDIA_FIELDS[0].helperKey}`)}
              bucket="public"
              folder={SITE_SETTINGS_HERO_MEDIA_FIELDS[0].folder}
              value={hero.video_desktop}
              onChange={(url) => set({ video_desktop: url })}
              disabled={disabled}
            />
            {hero.video_desktop && (
              <video
                src={hero.video_desktop}
                muted
                playsInline
                loop
                autoPlay
                className="mt-2 w-full rounded-md border aspect-video object-cover"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <AdminImageUploadField
              label={t(`admin.siteSettings.structured.hero.labels.${SITE_SETTINGS_HERO_MEDIA_FIELDS[1].labelKey}`)}
              helperText={t(`admin.siteSettings.structured.hero.help.${SITE_SETTINGS_HERO_MEDIA_FIELDS[1].helperKey}`)}
              bucket="public"
              folder={SITE_SETTINGS_HERO_MEDIA_FIELDS[1].folder}
              value={hero.video_mobile}
              onChange={(url) => set({ video_mobile: url })}
              disabled={disabled}
            />
            {hero.video_mobile && (
              <video
                src={hero.video_mobile}
                muted
                playsInline
                loop
                autoPlay
                className="mt-2 w-full max-w-[200px] rounded-md border aspect-[9/16] object-cover"
              />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <AdminImageUploadField
            label={t(`admin.siteSettings.structured.hero.labels.${SITE_SETTINGS_HERO_MEDIA_FIELDS[2].labelKey}`)}
            helperText={t(`admin.siteSettings.structured.hero.help.${SITE_SETTINGS_HERO_MEDIA_FIELDS[2].helperKey}`)}
            bucket="public"
            folder={SITE_SETTINGS_HERO_MEDIA_FIELDS[2].folder}
            value={hero.video_poster}
            onChange={(url) => set({ video_poster: url })}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Text section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t('admin.siteSettings.structured.hero.sections.content')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SITE_SETTINGS_HERO_TEXT_FIELDS.map((field) => (
            <div
              key={field.key}
              className={`space-y-1.5 ${field.colSpan2 ? 'md:col-span-2' : ''}`}
            >
              <Label className="text-xs text-muted-foreground">
                {t(`admin.siteSettings.structured.hero.labels.${field.labelKey}`)}
              </Label>
              {field.textarea ? (
                <Textarea
                  value={(hero[field.key as keyof HeroData] as string) || ''}
                  onChange={(e) => set({ [field.key]: e.target.value } as Partial<HeroData>)}
                  disabled={disabled}
                  rows={2}
                  className="text-sm"
                />
              ) : (
                <Input
                  value={(hero[field.key as keyof HeroData] as string) || ''}
                  onChange={(e) => set({ [field.key]: e.target.value } as Partial<HeroData>)}
                  disabled={disabled}
                  className="h-8"
                  placeholder={
                    field.placeholderKey
                      ? t(`admin.siteSettings.structured.hero.placeholders.${field.placeholderKey}`)
                      : undefined
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

HeroStructuredForm.displayName = "HeroStructuredForm";
