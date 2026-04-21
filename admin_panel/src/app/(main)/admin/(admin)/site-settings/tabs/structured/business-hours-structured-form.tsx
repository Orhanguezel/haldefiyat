// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/structured/business-hours-structured-form.tsx
// =============================================================

'use client';

import React from 'react';
import { z } from 'zod';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  SITE_SETTINGS_BUSINESS_HOURS_EMPTY,
  SITE_SETTINGS_BUSINESS_HOUR_DAYS,
} from '@/integrations/shared';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const dayEnum = z.enum(SITE_SETTINGS_BUSINESS_HOUR_DAYS);
const hhmm = z
  .string()
  .trim()
  .refine((s) => /^\d{2}:\d{2}$/.test(s), 'HH:MM');

export const businessHourRowSchema = z
  .object({
    day: dayEnum,
    open: hhmm,
    close: hhmm,
    closed: z.boolean().default(false),
  })
  .passthrough();

export const businessHoursSchema = z.array(businessHourRowSchema).default([]);

export type BusinessHoursFormState = z.infer<typeof businessHoursSchema>;

export type BusinessHoursStructuredFormProps = {
  value: any;
  onChange: (next: BusinessHoursFormState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  seed?: BusinessHoursFormState;
};

export function businessHoursObjToForm(
  v: any,
  seed: BusinessHoursFormState,
): BusinessHoursFormState {
  const base = Array.isArray(v) ? v : seed;
  const parsed = businessHoursSchema.safeParse(base);
  return parsed.success ? parsed.data : seed;
}

export function businessHoursFormToObj(s: BusinessHoursFormState) {
  return businessHoursSchema.parse(
    (s || []).map((r) => ({
      day: r.day,
      open: r.open,
      close: r.close,
      closed: !!r.closed,
    })),
  );
}

export const BusinessHoursStructuredForm: React.FC<BusinessHoursStructuredFormProps> = ({
  value,
  onChange,
  errors,
  disabled,
  seed,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const s = (seed ||
    ([...SITE_SETTINGS_BUSINESS_HOURS_EMPTY] as any)) as BusinessHoursFormState;

  const form = businessHoursObjToForm(value, s);

  const dayLabel: Record<string, string> = Object.fromEntries(
    SITE_SETTINGS_BUSINESS_HOUR_DAYS.map((day) => [
      day,
      t(`admin.siteSettings.structured.businessHours.days.${day}`, undefined, day),
    ]),
  );

  const setRow = (idx: number, patch: Partial<(typeof form)[number]>) => {
    const next = [...form];
    next[idx] = { ...next[idx], ...patch } as any;
    onChange(next);
  };

  const addRow = () => {
    onChange([
      ...(form || []),
      { ...SITE_SETTINGS_BUSINESS_HOURS_EMPTY[0] } as any,
    ]);
  };

  const removeRow = (idx: number) => {
    const next = [...form];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.businessHours.description')}
        </AlertDescription>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">{t('admin.siteSettings.structured.businessHours.columns.day')}</TableHead>
              <TableHead className="w-40">{t('admin.siteSettings.structured.businessHours.columns.open')}</TableHead>
              <TableHead className="w-40">{t('admin.siteSettings.structured.businessHours.columns.close')}</TableHead>
              <TableHead className="w-32">{t('admin.siteSettings.structured.businessHours.columns.closed')}</TableHead>
              <TableHead className="text-right w-24"> </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {form.map((r, idx) => (
              <TableRow key={`${r.day}_${idx}`}>
                <TableCell>
                  <Select
                    value={r.day}
                    onValueChange={(value) => setRow(idx, { day: value as any })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITE_SETTINGS_BUSINESS_HOUR_DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {dayLabel[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.[`${idx}.day`] && (
                    <p className="text-xs text-destructive">{errors[`${idx}.day`]}</p>
                  )}
                </TableCell>

                <TableCell>
                  <Input
                    className="h-8 font-mono"
                    value={r.open}
                    onChange={(e) => setRow(idx, { open: e.target.value })}
                    placeholder={t('admin.siteSettings.structured.businessHours.placeholders.open')}
                    disabled={disabled || !!r.closed}
                  />
                  {errors?.[`${idx}.open`] && (
                    <p className="text-xs text-destructive">{errors[`${idx}.open`]}</p>
                  )}
                </TableCell>

                <TableCell>
                  <Input
                    className="h-8 font-mono"
                    value={r.close}
                    onChange={(e) => setRow(idx, { close: e.target.value })}
                    placeholder={t('admin.siteSettings.structured.businessHours.placeholders.close')}
                    disabled={disabled || !!r.closed}
                  />
                  {errors?.[`${idx}.close`] && (
                    <p className="text-xs text-destructive">{errors[`${idx}.close`]}</p>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`closed-${idx}`}
                      checked={!!r.closed}
                      onCheckedChange={(checked) => setRow(idx, { closed: !!checked })}
                      disabled={disabled}
                    />
                    <Label htmlFor={`closed-${idx}`} className="text-xs">
                      {t('admin.siteSettings.structured.businessHours.closedLabel')}
                    </Label>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeRow(idx)}
                    disabled={disabled}
                  >
                    {t('admin.siteSettings.structured.businessHours.removeRow')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {errors?.form && <p className="p-3 text-xs text-destructive">{errors.form}</p>}
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled}
        >
          {t('admin.siteSettings.structured.businessHours.addRow')}
        </Button>
      </div>
    </div>
  );
};

BusinessHoursStructuredForm.displayName = 'BusinessHoursStructuredForm';
