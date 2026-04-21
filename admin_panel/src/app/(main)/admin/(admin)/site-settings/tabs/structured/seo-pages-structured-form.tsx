// =============================================================
// FILE: seo-pages-structured-form.tsx
// Bereket Fide — Sayfa bazlı SEO yönetimi (seo_pages)
// =============================================================

"use client";

import React from "react";
import { SITE_SETTINGS_SEO_PAGE_CONFIG, toStructuredObjectSeed } from '@/integrations/shared';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ── types ── */

type PageSeo = {
  title: string;
  description: string;
  og_image: string;
  no_index: boolean;
};

type SeoPages = Record<string, PageSeo>;

export type SeoPagesStructuredFormProps = {
  value: any;
  onChange: (next: SeoPages) => void;
  disabled?: boolean;
};

/* ── page config ── */

function toSeoPages(v: any): SeoPages {
  const source = toStructuredObjectSeed(v, {} as Record<string, unknown>);
  const result: SeoPages = {};
  for (const cfg of SITE_SETTINGS_SEO_PAGE_CONFIG) {
    const page = source[cfg.key as keyof typeof source] as Record<string, unknown> | undefined;
    result[cfg.key] = {
      title: String(page?.title ?? ""),
      description: String(page?.description ?? ""),
      og_image: String(page?.og_image ?? ""),
      no_index: Boolean(page?.no_index),
    };
  }
  return result;
}

export function seoPagesObjToForm(v: any): SeoPages {
  return toSeoPages(v);
}

export function seoPagesFormToObj(v: SeoPages): SeoPages {
  return v;
}

/* ── component ── */

export const SeoPagesStructuredForm: React.FC<SeoPagesStructuredFormProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const pages = React.useMemo(() => toSeoPages(value), [value]);

  const updatePage = (key: string, patch: Partial<PageSeo>) => {
    const next = { ...pages };
    next[key] = { ...next[key], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.seoPages.description')}
        </AlertDescription>
      </Alert>

      <Accordion type="multiple" className="w-full" defaultValue={["home"]}>
        {SITE_SETTINGS_SEO_PAGE_CONFIG.map((cfg) => {
          const page = pages[cfg.key] || { title: "", description: "", og_image: "", no_index: false };

          return (
            <AccordionItem key={cfg.key} value={cfg.key}>
              <AccordionTrigger className="text-sm hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {t(`admin.siteSettings.structured.seoPages.pages.${cfg.labelKey}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">{cfg.path}</span>
                  {page.no_index && (
                    <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive">
                      {t('admin.siteSettings.structured.seoPages.noIndexBadge')}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {t('admin.siteSettings.structured.seoPages.fields.title')}
                    </Label>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePage(cfg.key, { title: e.target.value })}
                      disabled={disabled}
                      className="h-8"
                      placeholder={t('admin.siteSettings.structured.seoPages.placeholders.title')}
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {t('admin.siteSettings.structured.seoPages.fields.description')}
                    </Label>
                    <Textarea
                      value={page.description}
                      onChange={(e) => updatePage(cfg.key, { description: e.target.value })}
                      disabled={disabled}
                      rows={2}
                      className="text-sm"
                      placeholder={t('admin.siteSettings.structured.seoPages.placeholders.description')}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {t('admin.siteSettings.structured.seoPages.descriptionLength', {
                        count: String(page.description.length),
                      })}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {t('admin.siteSettings.structured.seoPages.fields.ogImage')}
                    </Label>
                    <Input
                      value={page.og_image}
                      onChange={(e) => updatePage(cfg.key, { og_image: e.target.value })}
                      disabled={disabled}
                      className="h-8"
                      placeholder={t('admin.siteSettings.structured.seoPages.placeholders.ogImage')}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <Switch
                      checked={page.no_index}
                      onCheckedChange={(v) => updatePage(cfg.key, { no_index: v })}
                      disabled={disabled}
                    />
                    <Label className="text-xs">
                      {t('admin.siteSettings.structured.seoPages.fields.noIndex')}
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

SeoPagesStructuredForm.displayName = "SeoPagesStructuredForm";
