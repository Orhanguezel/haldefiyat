// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/structured/company-profile-structured-form.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  SITE_SETTINGS_COMPANY_PROFILE_EMPTY,
  SITE_SETTINGS_COMPANY_PROFILE_FIELDS,
  toStructuredObjectSeed,
} from '@/integrations/shared';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const companyProfileSchema = z
  .object({
    company_name: z.string().trim().optional(),
    slogan: z.string().trim().optional(),
    about: z.string().trim().optional(),
  })
  .passthrough();

export type CompanyProfileFormState = z.infer<typeof companyProfileSchema>;

export type CompanyProfileStructuredFormProps = {
  value: any;
  onChange: (next: CompanyProfileFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: CompanyProfileFormState;
};

export function companyObjToForm(v: any, seed: CompanyProfileFormState): CompanyProfileFormState {
  const base = toStructuredObjectSeed(v, seed);
  const parsed = companyProfileSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function companyFormToObj(s: CompanyProfileFormState) {
  return companyProfileSchema.parse({
    company_name: s.company_name?.trim() || '',
    slogan: s.slogan?.trim() || '',
    about: s.about?.trim() || '',
  });
}

export const CompanyProfileStructuredForm: React.FC<CompanyProfileStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s = (seed || { ...SITE_SETTINGS_COMPANY_PROFILE_EMPTY }) as CompanyProfileFormState;
  const form = companyObjToForm(value, s);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {SITE_SETTINGS_COMPANY_PROFILE_FIELDS.map((field) => (
        <div
          key={field.key}
          className={`space-y-2 ${field.colSpan2 ? 'md:col-span-2' : ''}`}
        >
          <Label htmlFor={`company-${field.key.replace('_', '-')}`} className="text-sm">
            {t(`admin.siteSettings.structured.companyProfile.labels.${field.labelKey}`)}
          </Label>
          {field.textarea ? (
            <Textarea
              id={`company-${field.key.replace('_', '-')}`}
              rows={6}
              value={(form[field.key as keyof CompanyProfileFormState] as string) || ''}
              onChange={(e) => onChange({ ...form, [field.key]: e.target.value })}
              disabled={disabled}
              className="text-sm"
            />
          ) : (
            <Input
              id={`company-${field.key.replace('_', '-')}`}
              className="h-8"
              value={(form[field.key as keyof CompanyProfileFormState] as string) || ''}
              onChange={(e) => onChange({ ...form, [field.key]: e.target.value })}
              disabled={disabled}
            />
          )}
          {errors?.[field.key] && <p className="text-xs text-destructive">{errors[field.key]}</p>}
        </div>
      ))}
    </div>
  );
};

CompanyProfileStructuredForm.displayName = 'CompanyProfileStructuredForm';
