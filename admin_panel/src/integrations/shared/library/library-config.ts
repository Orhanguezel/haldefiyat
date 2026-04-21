// =============================================================
// FILE: src/integrations/shared/library/library-config.ts
// Library module config, helpers, formatters
// =============================================================

import type { AdminLocaleOption } from "@/integrations/shared/admin-locales";

import type { LibraryDto, LibraryListQueryParams } from "./library-types";

export const LIBRARY_ADMIN_BASE = "/admin/library";
export const LIBRARY_DEFAULT_LOCALE = "tr";
export const LIBRARY_META_TITLE_LIMIT = 60;
export const LIBRARY_META_DESCRIPTION_LIMIT = 155;

export type LibraryDetailTabKey = "content" | "seo" | "images" | "files";

export interface LibraryDetailFormState {
  name: string;
  slug: string;
  locale: string;
  description: string;
  type: string;
  category_id: string;
  sub_category_id: string;
  cover_image: string;
  images: string[];
  image_url: string;
  image_asset_id: string;
  image_alt: string;
  tags: string;
  featured: boolean;
  is_published: boolean;
  is_active: boolean;
  display_order: number;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

export function createEmptyLibraryDetailForm(locale: string): LibraryDetailFormState {
  return {
    name: "",
    slug: "",
    locale,
    description: "",
    type: "other",
    category_id: "",
    sub_category_id: "",
    cover_image: "",
    images: [],
    image_url: "",
    image_asset_id: "",
    image_alt: "",
    tags: "",
    featured: false,
    is_published: false,
    is_active: true,
    display_order: 0,
    meta_title: "",
    meta_description: "",
    meta_keywords: "",
  };
}

export function mapLibraryToDetailForm(
  item: Partial<LibraryDto> | Record<string, unknown> | null | undefined,
  activeLocale: string,
): LibraryDetailFormState {
  const fallback = createEmptyLibraryDetailForm(activeLocale);
  if (!item) return fallback;
  const s = item as Partial<LibraryDto>;
  return {
    name: s.name || "",
    slug: s.slug || "",
    locale: activeLocale,
    description: s.description || "",
    type: s.type || "other",
    category_id: s.category_id || "",
    sub_category_id: s.sub_category_id || "",
    cover_image: s.featured_image || s.image_url || "",
    images: [],
    image_url: s.image_url || "",
    image_asset_id: s.image_asset_id || "",
    image_alt: s.image_alt || "",
    tags: s.tags || "",
    featured: s.featured ?? false,
    is_published: s.is_published ?? false,
    is_active: s.is_active ?? true,
    display_order: s.display_order ?? 0,
    meta_title: s.meta_title || "",
    meta_description: s.meta_description || "",
    meta_keywords: s.meta_keywords || "",
  };
}

export function buildLibraryListQueryParams(input: {
  search?: string;
  locale?: string;
  type?: string;
  categoryId?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
  orderDir?: string;
}): LibraryListQueryParams {
  const params: LibraryListQueryParams = {
    locale: input.locale || LIBRARY_DEFAULT_LOCALE,
  };
  if (input.search) params.q = input.search;
  if (input.type) params.type = input.type;
  if (input.categoryId) params.category_id = input.categoryId;
  if (input.isPublished) params.is_published = true;
  if (input.isFeatured) params.featured = true;
  if (input.limit) params.limit = input.limit;
  if (input.offset) params.offset = input.offset;
  if (input.sort) params.sort = input.sort as LibraryListQueryParams["sort"];
  if (input.orderDir) params.orderDir = input.orderDir as LibraryListQueryParams["orderDir"];
  return params;
}

export function buildLibraryLocaleOptions(
  localeOptions: Array<{ value: unknown; label?: string }> | null | undefined,
  normalizeLocale: (value: unknown) => string,
): AdminLocaleOption[] {
  return (localeOptions ?? []).map((option) => ({
    value: normalizeLocale(option.value) || String(option.value || ""),
    label: option.label || normalizeLocale(option.value)?.toUpperCase() || String(option.value || ""),
  }));
}

export function buildLibraryToastMessage(title: string, message: string): string {
  return `${title}: ${message}`;
}
