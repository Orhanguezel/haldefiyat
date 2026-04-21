
// =============================================================
// FILE: contact-info-structured-form.tsx
// Bereket Fide — contact_info structured editor
// =============================================================

"use client";

import React from "react";
import { z } from "zod";
import { useAdminTranslations } from "@/i18n";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";
import {
  SITE_SETTINGS_CONTACT_EMPTY,
  SITE_SETTINGS_CONTACT_FIELDS,
  toStructuredObjectSeed,
} from '@/integrations/shared';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export const contactInfoSchema = z
  .object({
    company_name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    phone_2: z.string().trim().optional(),
    email: z.string().trim().optional(),
    email_2: z.string().trim().optional(),
    address: z.string().trim().optional(),
    city: z.string().trim().optional(),
    country: z.string().trim().optional(),
    working_hours: z.string().trim().optional(),
    maps_embed_url: z.string().trim().optional(),
    maps_lat: z.string().trim().optional(),
    maps_lng: z.string().trim().optional(),
  })
  .passthrough();

export type ContactInfoFormState = z.infer<typeof contactInfoSchema>;

export type ContactInfoStructuredFormProps = {
  value: any;
  onChange: (next: ContactInfoFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: ContactInfoFormState;
};

const EMPTY_SEED: ContactInfoFormState = { ...SITE_SETTINGS_CONTACT_EMPTY };

export function contactObjToForm(v: any, seed: ContactInfoFormState): ContactInfoFormState {
  const base = toStructuredObjectSeed(v, seed);
  const parsed = contactInfoSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function contactFormToObj(s: ContactInfoFormState) {
  return contactInfoSchema.parse({
    company_name: s.company_name?.trim() || "",
    phone: s.phone?.trim() || "",
    phone_2: s.phone_2?.trim() || "",
    email: s.email?.trim() || "",
    email_2: s.email_2?.trim() || "",
    address: s.address?.trim() || "",
    city: s.city?.trim() || "",
    country: s.country?.trim() || "",
    working_hours: s.working_hours?.trim() || "",
    maps_embed_url: s.maps_embed_url?.trim() || "",
    maps_lat: s.maps_lat?.trim() || "",
    maps_lng: s.maps_lng?.trim() || "",
  });
}

export const ContactInfoStructuredForm: React.FC<ContactInfoStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s = (seed || EMPTY_SEED) as ContactInfoFormState;
  const form = contactObjToForm(value, s);

  const field = (key: keyof ContactInfoFormState, label: string, opts?: { colSpan2?: boolean; textarea?: boolean }) => (
    <div className={`space-y-2 ${opts?.colSpan2 ? 'md:col-span-2' : ''}`} key={key}>
      <Label htmlFor={`contact-${key}`} className="text-sm">{label}</Label>
      {opts?.textarea ? (
        <Textarea
          id={`contact-${key}`}
          rows={3}
          value={(form[key] as string) || ""}
          onChange={(e) => onChange({ ...form, [key]: e.target.value })}
          disabled={disabled}
          className="text-sm"
        />
      ) : (
        <Input
          id={`contact-${key}`}
          className="h-8"
          value={(form[key] as string) || ""}
          onChange={(e) => onChange({ ...form, [key]: e.target.value })}
          disabled={disabled}
        />
      )}
      {errors?.[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t("admin.siteSettings.structured.contact.description")}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SITE_SETTINGS_CONTACT_FIELDS.map((item) =>
          field(
            item.key as keyof ContactInfoFormState,
            t(`admin.siteSettings.structured.contact.labels.${item.labelKey}`),
            { colSpan2: item.colSpan2, textarea: item.textarea },
          ),
        )}
      </div>
    </div>
  );
};

ContactInfoStructuredForm.displayName = "ContactInfoStructuredForm";
