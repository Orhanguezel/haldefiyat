export const CATEGORY_API_FALLBACK_ORIGIN = 'http://localhost:8086';
export const CATEGORY_DEFAULT_LOCALE = 'tr';
export const CATEGORY_META_TITLE_LIMIT = 60;
export const CATEGORY_META_DESCRIPTION_LIMIT = 155;

export const CATEGORY_MODULE_KEYS = [
  'product',
  'services',
  'news',
  'library',
  'about',
  'sparepart',
  'references',
] as const;

export type CategoryModuleKey = (typeof CATEGORY_MODULE_KEYS)[number];

export type CategoryDetailTabKey = 'content' | 'seo' | 'image';

export type CategoryLocaleOptionInput = {
  value?: string;
  label?: string;
};

export type CategoryDetailFormState = {
  name: string;
  slug: string;
  locale: string;
  module_key: string;
  description: string;
  alt: string;
  image_url: string;
  storage_asset_id: string;
  icon: string;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  meta_title: string;
  meta_description: string;
  i18n_data: Record<string, unknown>;
};

export const CATEGORY_DETAIL_INPUT_CLASS =
  'w-full rounded border border-[#ccc] bg-white px-4 py-3 text-sm text-[#333] placeholder-[#999] outline-none focus:border-[#946e1c] focus:ring-1 focus:ring-[#946e1c]/30';

export function getCategoryApiOrigin(): string {
  if (typeof window === 'undefined') return CATEGORY_API_FALLBACK_ORIGIN;
  return `${window.location.protocol}//${window.location.hostname}:8086`;
}

export function createEmptyCategoryDetailForm(locale: string): CategoryDetailFormState {
  return {
    name: '',
    slug: '',
    locale,
    module_key: 'product',
    description: '',
    alt: '',
    image_url: '',
    storage_asset_id: '',
    icon: '',
    is_active: true,
    is_featured: false,
    display_order: 0,
    meta_title: '',
    meta_description: '',
    i18n_data: {},
  };
}

export function mapCategoryToDetailForm(
  category: Partial<CategoryDetailFormState> | Record<string, unknown> | null | undefined,
  activeLocale: string,
): CategoryDetailFormState {
  const fallback = createEmptyCategoryDetailForm(activeLocale);
  const source = (category ?? {}) as Partial<CategoryDetailFormState>;

  return {
    ...fallback,
    name: source.name || '',
    slug: source.slug || '',
    locale: source.locale || activeLocale,
    module_key: source.module_key || 'product',
    description: source.description || '',
    alt: source.alt || '',
    image_url: source.image_url || '',
    storage_asset_id: source.storage_asset_id || '',
    icon: source.icon || '',
    is_active: source.is_active ?? true,
    is_featured: source.is_featured ?? false,
    display_order: source.display_order || 0,
    meta_title: source.meta_title || '',
    meta_description: source.meta_description || '',
    i18n_data: source.i18n_data || {},
  };
}

export function buildCategoryLocaleOptions(
  localeOptions: CategoryLocaleOptionInput[] | null | undefined,
  normalizeLocale: (value: unknown) => string,
): AdminLocaleOption[] {
  return (localeOptions ?? []).map((option) => {
    const normalizedValue = normalizeLocale(option.value) || String(option.value || '');
    return {
      value: normalizedValue,
      label: option.label || normalizeLocale(option.value)?.toUpperCase() || String(option.value || ''),
    };
  });
}

export function buildCategoriesListQueryParams(input: {
  search?: string;
  locale?: string;
  moduleKey?: string;
  showOnlyActive?: boolean;
  showOnlyFeatured?: boolean;
}): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {
    locale: input.locale || CATEGORY_DEFAULT_LOCALE,
  };

  if (input.search) params.q = input.search;
  if (input.moduleKey) params.module_key = input.moduleKey;
  if (input.showOnlyActive) params.is_active = true;
  if (input.showOnlyFeatured) params.is_featured = true;

  return params;
}

export function buildCategorySeoPreviewUrl(
  baseUrl: string,
  slug: string,
  slugFallback: string,
): string {
  return `${baseUrl}/${slug || slugFallback}`;
}

export function buildCategoryImageSrc(apiOrigin: string, imageUrl: string): string {
  return imageUrl.startsWith('http') ? imageUrl : `${apiOrigin}${imageUrl}`;
}

export function buildCategoryToastMessage(
  title: string,
  message: string,
): string {
  return `${title}: ${message}`;
}
import type { AdminLocaleOption } from '@/integrations/shared/admin-locales';
