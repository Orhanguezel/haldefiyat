// =============================================================
// FILE: src/app/(main)/admin/_components/common/use-admin-locales.ts
// guezelwebdesign – Admin Locales (Centralized)
// Source: site_settings.app_locales + site_settings.default_locale
// - No static locale map
// - Produces AdminLocaleOption[]
// =============================================================

import { useMemo } from 'react';
import { useListSiteSettingsAdminQuery } from '@/integrations/hooks';
import { FALLBACK_LOCALE } from '@/i18n/config';
import {
  buildAdminLocaleLabel,
  parseAdminAppLocalesValue,
  toShortAdminLocale,
  uniqAdminLocalesByCode,
  SITE_SETTINGS_BRAND_PREFIX,
  type AdminLocaleOption,
  type UseAdminLocalesResult,
} from '@/integrations/shared';

export type { AdminLocaleMeta, AdminLocaleOption, UseAdminLocalesResult } from '@/integrations/shared';

export function useAdminLocales(): UseAdminLocalesResult {
  const prefix = SITE_SETTINGS_BRAND_PREFIX || '';
  const appLocalesKey = `${prefix}app_locales`;
  const defaultLocaleKey = `${prefix}default_locale`;

  const {
    data: rows,
    isLoading,
    isFetching,
  } = useListSiteSettingsAdminQuery({
    keys: [appLocalesKey, defaultLocaleKey],
    locale: '*',
  });

  const computed = useMemo(() => {
    const list = rows ?? [];
    const appRow = list.find((r: any) => r.key === appLocalesKey);
    const defRow = list.find((r: any) => r.key === defaultLocaleKey);

    const itemsRaw = parseAdminAppLocalesValue(appRow?.value);

    // active filter: default true unless explicitly false
    const active = itemsRaw.filter((x) => x && x.code && x.is_active !== false);
    const uniq = uniqAdminLocalesByCode(active);

    let codes = uniq.map((x) => toShortAdminLocale(x.code)).filter(Boolean);

    // default locale
    let def = toShortAdminLocale(defRow?.value);

    // if default_locale empty -> try app_locales is_default
    if (!def) {
      const flagged = uniq.find((x) => x.is_default === true);
      def = flagged ? toShortAdminLocale(flagged.code) : '';
    }

    // if default still not in active list -> pick first active
    if (def && !codes.includes(def)) {
      def = codes[0] ?? '';
    }

    let options: AdminLocaleOption[] = uniq.map((it) => ({
      value: toShortAdminLocale(it.code),
      label: buildAdminLocaleLabel(it, FALLBACK_LOCALE),
    }));

    // Fallback: app_locales yoksa admin UI bloklanmasin.
    if (codes.length === 0) {
      const fb = toShortAdminLocale(def || FALLBACK_LOCALE) || FALLBACK_LOCALE;
      codes = [fb];
      options = [{ value: fb, label: fb.toUpperCase() }];
      def = fb;
    }

    const set = new Set(codes);
    const hasLocale = (locale: unknown) => {
      const v = toShortAdminLocale(locale);
      return !!v && set.has(v);
    };

    const coerceLocale = (locale: unknown, fallback?: string) => {
      const v = toShortAdminLocale(locale);
      if (v && set.has(v)) return v;

      const fb = toShortAdminLocale(fallback);
      if (fb && set.has(fb)) return fb;

      // last resort: default or first active
      if (def && set.has(def)) return def;
      return codes[0] ?? '';
    };

    return {
      localeOptions: options,
      defaultLocaleFromDb: def,
      activeLocaleCodes: codes,
      hasLocale,
      coerceLocale,
    };
  }, [rows]);

  const result = useMemo(() => {
    return {
      ...computed,
      loading: isLoading,
      fetching: isFetching,
    };
  }, [computed, isLoading, isFetching]);

  return result;
}
