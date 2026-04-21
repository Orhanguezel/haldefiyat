import type { ReactNode } from 'react';

export type AdminLocaleOption = {
  value: string;
  label?: string;
};

export type AdminLocaleSelectProps = {
  value: string;
  onChange: (locale: string) => void;
  options: AdminLocaleOption[];
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  allowEmpty?: boolean;
  emptySentinel?: string;
};

export type AppLocaleItem = {
  code: string;
  label?: string;
  is_active?: boolean;
  is_default?: boolean;
};

export type AdminLocaleMeta = {
  defaultLocaleFromDb: string;
  activeLocaleCodes: string[];
};

export type UseAdminLocalesResult = AdminLocaleMeta & {
  localeOptions: AdminLocaleOption[];
  hasLocale: (locale: unknown) => boolean;
  coerceLocale: (locale: unknown, fallback?: string) => string;
  loading: boolean;
  fetching: boolean;
};

export type AdminLocaleFieldLabel = string | ReactNode | undefined;

export function normalizeAdminLocaleValue(v: unknown): string {
  return String(v ?? '').trim();
}

export function toShortAdminLocale(v: unknown): string {
  return normalizeAdminLocaleValue(v).toLowerCase().replace('_', '-').split('-')[0].trim();
}

export function mapAdminLocaleToUiValue(
  value: string,
  allowEmpty = true,
  emptySentinel = '__all__',
): string {
  const normalized = normalizeAdminLocaleValue(value);
  if (!allowEmpty) return normalized;
  return normalized === '' ? emptySentinel : normalized;
}

export function mapAdminLocaleFromUiValue(
  value: string,
  allowEmpty = true,
  emptySentinel = '__all__',
): string {
  const normalized = normalizeAdminLocaleValue(value);
  if (!allowEmpty) return normalized;
  return normalized === emptySentinel ? '' : normalized;
}

export function toAdminLocaleOptions(options: AdminLocaleOption[]): AdminLocaleOption[] {
  return (Array.isArray(options) ? options : [])
    .map((option) => {
      const value = toShortAdminLocale(option.value);
      const label = option.label
        ? normalizeAdminLocaleValue(option.label)
        : value.toUpperCase();

      return { value, label };
    })
    .filter((option) => Boolean(option.value));
}

export function parseAdminAppLocalesValue(raw: unknown): AppLocaleItem[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => ({
        code: toShortAdminLocale((item as { code?: unknown })?.code ?? item),
        label: typeof (item as { label?: unknown })?.label === 'string'
          ? (item as { label: string }).label
          : undefined,
        is_active: (item as { is_active?: boolean })?.is_active,
        is_default: (item as { is_default?: boolean })?.is_default,
      }))
      .filter((item) => Boolean(item.code));
  }

  if (typeof raw === 'string') {
    const normalized = raw.trim();
    if (!normalized) return [];

    try {
      return parseAdminAppLocalesValue(JSON.parse(normalized));
    } catch {
      return [];
    }
  }

  if (typeof raw === 'object' && raw !== null) {
    const objectValue = raw as { locales?: unknown };
    if (Array.isArray(objectValue.locales)) {
      return parseAdminAppLocalesValue(objectValue.locales);
    }
  }

  return [];
}

export function uniqAdminLocalesByCode(items: AppLocaleItem[]): AppLocaleItem[] {
  const seen = new Set<string>();
  const next: AppLocaleItem[] = [];

  for (const item of items) {
    const code = toShortAdminLocale(item?.code);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    next.push({ ...item, code });
  }

  return next;
}

export function buildAdminLocaleLabel(
  item: AppLocaleItem,
  fallbackLocale: string,
): string {
  const code = toShortAdminLocale(item.code);
  const label = normalizeAdminLocaleValue(item.label);
  if (label) return `${label} (${code})`;

  try {
    const displayNames = new Intl.DisplayNames([fallbackLocale], { type: 'language' });
    const displayName = displayNames.of(code) ?? '';
    return displayName ? `${displayName} (${code})` : `${code.toUpperCase()} (${code})`;
  } catch {
    return `${code.toUpperCase()} (${code})`;
  }
}
