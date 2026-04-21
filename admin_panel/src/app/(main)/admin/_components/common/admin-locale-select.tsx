'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/common/admin-locale-select.tsx
// FINAL — Admin Locale Select (shadcn)
// - Bootstrap yok
// - Loading badge + disabled logic
// - ✅ FIX: empty string value support via sentinel mapping (no breaking change)
// - ✅ FIX: Type safety with proper option type
// =============================================================

import React from 'react';
import { Languages, Loader2 } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  mapAdminLocaleFromUiValue,
  mapAdminLocaleToUiValue,
  normalizeAdminLocaleValue,
  toAdminLocaleOptions,
  toShortAdminLocale,
  type AdminLocaleOption,
  type AdminLocaleSelectProps,
} from '@/integrations/shared';

export type { AdminLocaleOption, AdminLocaleSelectProps } from '@/integrations/shared';

export const AdminLocaleSelect: React.FC<AdminLocaleSelectProps> = ({
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  label,
  allowEmpty = true,
  emptySentinel = '__all__',
}) => {
  const t = useAdminT('admin.common');
  const hasOptions = Array.isArray(options) && options.length > 0;
  const isDisabled = disabled || loading || !hasOptions;

  const resolvedLabel = String(label ?? t('locale')).trim() || t('locale');
  const placeholderText = t('localePlaceholder', undefined, t('locale'));
  const uiValue = mapAdminLocaleToUiValue(normalizeAdminLocaleValue(value), allowEmpty, emptySentinel);

  const uiOptions = React.useMemo(() => {
    return toAdminLocaleOptions(options).map((option) => ({
      value: mapAdminLocaleToUiValue(toShortAdminLocale(option.value), allowEmpty, emptySentinel),
      raw: toShortAdminLocale(option.value),
      label: option.label ?? toShortAdminLocale(option.value).toUpperCase(),
    }));
  }, [allowEmpty, emptySentinel, options]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm">{resolvedLabel}</Label>
        {loading ? (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="size-3.5 animate-spin" />
            {t('loading')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1">
            <Languages className="size-3.5" />
            {t('locale')}
          </Badge>
        )}
      </div>

      <Select
        value={uiValue}
        onValueChange={(v) => onChange(mapAdminLocaleFromUiValue(v, allowEmpty, emptySentinel))}
        disabled={isDisabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {uiOptions.map((opt) => (
            <SelectItem key={`${opt.value}:${opt.label}`} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!hasOptions && !loading ? (
        <div className="text-xs text-muted-foreground">{t('localeOptionsMissing')}</div>
      ) : null}
    </div>
  );
};
