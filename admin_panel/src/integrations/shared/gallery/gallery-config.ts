// =============================================================
// FILE: src/integrations/shared/gallery/gallery-config.ts
// Gallery module config, helpers, formatters
// =============================================================

import type { AdminLocaleOption } from "@/integrations/shared/admin-locales";

import type { GalleryDto, GalleryListQueryParams } from "./gallery-types";

export const GALLERY_ADMIN_BASE = "/admin/galleries";
export const GALLERY_DEFAULT_LOCALE = "tr";
export const GALLERY_META_TITLE_LIMIT = 60;
export const GALLERY_META_DESCRIPTION_LIMIT = 155;

export type GalleryDetailTabKey = "content" | "seo" | "images";

export interface GalleryDetailFormState {
  title: string;
  slug: string;
  locale: string;
  description: string;
  module_key: string;
  cover_image: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  meta_title: string;
  meta_description: string;
}

export function createEmptyGalleryDetailForm(locale: string): GalleryDetailFormState {
  return {
    title: "",
    slug: "",
    locale,
    description: "",
    module_key: "support",
    cover_image: "",
    images: [],
    is_active: true,
    is_featured: false,
    display_order: 0,
    meta_title: "",
    meta_description: "",
  };
}

export function mapGalleryToDetailForm(
  gallery: Partial<GalleryDto> | Record<string, unknown> | null | undefined,
  activeLocale: string,
): GalleryDetailFormState {
  const fallback = createEmptyGalleryDetailForm(activeLocale);
  if (!gallery) return fallback;
  const s = gallery as Partial<GalleryDto>;
  return {
    title: s.title || "",
    slug: s.slug || "",
    locale: activeLocale,
    description: s.description || "",
    module_key: s.module_key || "support",
    cover_image: "",
    images: [],
    is_active: s.is_active ?? true,
    is_featured: s.is_featured ?? false,
    display_order: s.display_order ?? 0,
    meta_title: s.meta_title || "",
    meta_description: s.meta_description || "",
  };
}

export function buildGalleryListQueryParams(input: {
  search?: string;
  locale?: string;
  moduleKey?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
}): GalleryListQueryParams {
  const params: GalleryListQueryParams = {
    locale: input.locale || GALLERY_DEFAULT_LOCALE,
  };
  if (input.search) params.q = input.search;
  if (input.moduleKey) params.module_key = input.moduleKey;
  if (input.isActive) params.is_active = true;
  if (input.isFeatured) params.is_featured = true;
  if (input.limit) params.limit = input.limit;
  if (input.offset) params.offset = input.offset;
  if (input.sort) params.sort = input.sort as GalleryListQueryParams["sort"];
  if (input.order) params.order = input.order as GalleryListQueryParams["order"];
  return params;
}

export function buildGalleryLocaleOptions(
  localeOptions: Array<{ value: unknown; label?: string }> | null | undefined,
  normalizeLocale: (value: unknown) => string,
): AdminLocaleOption[] {
  return (localeOptions ?? []).map((option) => ({
    value: normalizeLocale(option.value) || String(option.value || ""),
    label: option.label || normalizeLocale(option.value)?.toUpperCase() || String(option.value || ""),
  }));
}

export function buildGalleryToastMessage(title: string, message: string): string {
  return `${title}: ${message}`;
}
