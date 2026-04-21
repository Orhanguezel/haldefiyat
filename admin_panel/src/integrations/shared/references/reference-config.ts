// =============================================================
// FILE: src/integrations/shared/references/reference-config.ts
// Reference module config, helpers, formatters
// =============================================================

import type { AdminLocaleOption } from '@/integrations/shared/admin-locales';
import type { ReferenceDto, ReferenceListQueryParams } from './reference-types';

export const REFERENCES_ADMIN_BASE = '/admin/references';
export const REFERENCE_DEFAULT_LOCALE = 'tr';
export const REFERENCE_META_TITLE_LIMIT = 60;
export const REFERENCE_META_DESCRIPTION_LIMIT = 155;

export type ReferenceDetailTabKey = 'content' | 'seo' | 'images';

export interface ReferenceDetailFormState {
  title: string;
  slug: string;
  locale: string;
  summary: string;
  content: string;
  featured_image: string;
  featured_image_asset_id: string;
  featured_image_alt: string;
  website_url: string;
  category_id: string;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  meta_title: string;
  meta_description: string;
  images: string[];
  storage_image_ids: string[];
}

export function createEmptyReferenceDetailForm(locale: string): ReferenceDetailFormState {
  return {
    title: '',
    slug: '',
    locale,
    summary: '',
    content: '',
    featured_image: '',
    featured_image_asset_id: '',
    featured_image_alt: '',
    website_url: '',
    category_id: '',
    is_published: false,
    is_featured: false,
    display_order: 0,
    meta_title: '',
    meta_description: '',
    images: [],
    storage_image_ids: [],
  };
}

export function mapReferenceToDetailForm(
  reference: Partial<ReferenceDto> | Record<string, unknown> | null | undefined,
  activeLocale: string,
): ReferenceDetailFormState {
  const fallback = createEmptyReferenceDetailForm(activeLocale);
  if (!reference) return fallback;
  const s = reference as Partial<ReferenceDto>;
  return {
    title: s.title || '',
    slug: s.slug || '',
    locale: activeLocale,
    summary: s.summary || '',
    content: s.content || '',
    featured_image: s.featured_image || '',
    featured_image_asset_id: s.featured_image_asset_id || '',
    featured_image_alt: s.featured_image_alt || '',
    website_url: s.website_url || '',
    category_id: s.category_id || '',
    is_published: s.is_published ?? false,
    is_featured: s.is_featured ?? false,
    display_order: s.display_order ?? 0,
    meta_title: s.meta_title || '',
    meta_description: s.meta_description || '',
    images: Array.isArray(s.images) ? s.images : [],
    storage_image_ids: Array.isArray(s.storage_image_ids) ? s.storage_image_ids : [],
  };
}

export function buildReferencesListQueryParams(input: {
  search?: string;
  locale?: string;
  categoryId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
  orderDir?: string;
}): ReferenceListQueryParams {
  const params: ReferenceListQueryParams = {
    locale: input.locale || REFERENCE_DEFAULT_LOCALE,
  };
  if (input.search) params.q = input.search;
  if (input.categoryId) params.category_id = input.categoryId;
  if (input.isPublished) params.is_published = true;
  if (input.isFeatured) params.is_featured = true;
  if (input.limit) params.limit = input.limit;
  if (input.offset) params.offset = input.offset;
  if (input.sort) params.sort = input.sort as ReferenceListQueryParams['sort'];
  if (input.orderDir) params.orderDir = input.orderDir as ReferenceListQueryParams['orderDir'];
  return params;
}

export function buildReferenceLocaleOptions(
  localeOptions: Array<{ value: unknown; label?: string }> | null | undefined,
  normalizeLocale: (value: unknown) => string,
): AdminLocaleOption[] {
  return (localeOptions ?? []).map((option) => ({
    value: normalizeLocale(option.value) || String(option.value || ''),
    label: option.label || normalizeLocale(option.value)?.toUpperCase() || String(option.value || ''),
  }));
}

export function buildReferenceToastMessage(title: string, message: string): string {
  return `${title}: ${message}`;
}
