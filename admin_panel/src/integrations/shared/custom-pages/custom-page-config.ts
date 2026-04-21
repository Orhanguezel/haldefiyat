// =============================================================
// FILE: src/integrations/shared/custom-pages/custom-page-config.ts
// =============================================================

import type { AdminLocaleOption } from '@/integrations/shared/admin-locales';
import type { CustomPageDto } from './custom-page-types';

export const CUSTOM_PAGES_ADMIN_BASE = '/admin/custom-pages';
export const CUSTOM_PAGE_DEFAULT_LOCALE = 'tr';
export const CUSTOM_PAGE_DEFAULT_MODULE_KEY = 'kurumsal';

export type CustomPageDetailTabKey = 'content' | 'images' | 'seo';

export interface CustomPageDetailFormState {
  title: string;
  slug: string;
  locale: string;
  module_key: string;
  content: string;
  summary: string;
  meta_title: string;
  meta_description: string;
  is_published: boolean;
  display_order: number;
  featured_image: string;
  storage_asset_id: string;
  images: string[];
  storage_image_ids: string[];
}

export function createEmptyCustomPageDetailForm(locale: string): CustomPageDetailFormState {
  return {
    title: '',
    slug: '',
    locale,
    module_key: CUSTOM_PAGE_DEFAULT_MODULE_KEY,
    content: '',
    summary: '',
    meta_title: '',
    meta_description: '',
    is_published: false,
    display_order: 0,
    featured_image: '',
    storage_asset_id: '',
    images: [],
    storage_image_ids: [],
  };
}

export function mapCustomPageToDetailForm(
  page: Partial<CustomPageDto> | Record<string, unknown> | null | undefined,
  activeLocale: string,
): CustomPageDetailFormState {
  const fallback = createEmptyCustomPageDetailForm(activeLocale);
  if (!page) return fallback;
  const s = page as Partial<CustomPageDto>;
  return {
    title: s.title || '',
    slug: s.slug || '',
    locale: activeLocale,
    module_key: s.module_key || CUSTOM_PAGE_DEFAULT_MODULE_KEY,
    content: s.content || '',
    summary: s.summary || '',
    meta_title: s.meta_title || '',
    meta_description: s.meta_description || '',
    is_published: s.is_published ?? false,
    display_order: s.display_order ?? 0,
    featured_image: s.featured_image || '',
    storage_asset_id: s.storage_asset_id || '',
    images: Array.isArray(s.images) ? s.images : [],
    storage_image_ids: Array.isArray(s.storage_image_ids) ? s.storage_image_ids : [],
  };
}

export function buildCustomPagesListQueryParams(input: {
  search?: string;
  locale?: string;
  moduleKey?: string;
  isPublished?: boolean;
}): CustomPageDto extends never ? never : Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {
    locale: input.locale || CUSTOM_PAGE_DEFAULT_LOCALE,
  };
  if (input.search) params.search = input.search;
  if (input.moduleKey) params.module_key = input.moduleKey;
  if (input.isPublished) params.is_published = true;
  return params;
}

export function buildCustomPageLocaleOptions(
  localeOptions: Array<{ value: unknown; label?: string }> | null | undefined,
  normalizeLocale: (value: unknown) => string,
): AdminLocaleOption[] {
  return (localeOptions ?? []).map((option) => ({
    value: normalizeLocale(option.value) || String(option.value || ''),
    label: option.label || normalizeLocale(option.value)?.toUpperCase() || String(option.value || ''),
  }));
}

export function buildCustomPageToastMessage(title: string, message: string): string {
  return `${title}: ${message}`;
}
