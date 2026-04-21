// =============================================================
// FILE: src/integrations/shared/slider.ts
// Slider types + normalizers
// =============================================================
import { cleanParams } from '@/integrations/shared/api';
import { toBool, toNumber, toStr } from '@/integrations/shared/common';

/* -------------------- API tipleri (RAW) -------------------- */

/**
 * Admin controller'ın döndürdüğü şekil
 * toAdminView() ile oluşan obje (parent + i18n join edilmiş)
 */
export interface ApiSliderAdmin {
  /** Parent slider.id */
  id: number;
  /** Parent slider.uuid */
  uuid: string;

  /** i18n.locale */
  locale: string;
  /** i18n.name */
  name: string;
  /** i18n.slug */
  slug: string;
  /** i18n.description */
  description: string | null;

  /** Parent image_url (veya publicUrlOf ile hesaplanmış) */
  image_url: string | null;
  /** Parent image_asset_id (storage_assets.id) */
  image_asset_id: string | null;
  /** storage üzerinden efektif URL (asset_url || image_url) */
  image_effective_url: string | null;

  /** i18n.alt */
  alt: string | null;
  image2_url?: string | null;
  badge_text?: string | null;
  badge_color?: string | null;
  gradient?: string | null;
  /** i18n.button_text */
  buttonText: string | null;
  /** i18n.button_link */
  buttonLink: string | null;

  /** Parent featured / is_active / order */
  featured: boolean | 0 | 1;
  is_active: boolean | 0 | 1;
  display_order: number;

  created_at: string;
  updated_at: string;

  /** Esnek JSON alan (çok dilli ayarlar, flags vs.) */
  meta?: Record<string, unknown> | null;
}

/**
 * Public controller'daki SlideData tipi
 * rowToPublic() ile dönen obje (i18n + parent)
 */
export interface ApiSliderPublic {
  /** Parent slider.id (string'e çevrilmiş) */
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  locale: string;
}

/* -------------------- FE DTO tipleri -------------------- */

/**
 * Admin tarafında kullanılacak normalize DTO
 * (id'yi string'e çeviriyoruz, diğer alanlar korunuyor)
 */
export interface SliderAdminDto {
  id: string;
  uuid: string;

  locale: string;
  name: string;
  slug: string;
  description: string | null;

  image_url: string | null;
  image_asset_id: string | null;
  image_effective_url: string | null;

  alt: string | null;
  image2_url: string | null;
  badge_text: string | null;
  badge_color: string | null;
  gradient: string | null;
  buttonText: string | null;
  buttonLink: string | null;

  featured: boolean;
  is_active: boolean;
  display_order: number;

  created_at: string;
  updated_at: string;

  /** Esnek JSON alan – FE & BE ortak (şu an zorunlu değil) */
  meta: Record<string, unknown> | null;
}

/**
 * Public tarafında (Hero slider vs) kullanılacak DTO
 * API ile neredeyse aynı, sadece type safety için normalize ediyoruz.
 */
export interface SliderPublicDto {
  id: string;
  title: string;
  description: string;
  image: string;
  alt?: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
  order: number;
  priority?: 'low' | 'medium' | 'high';
  showOnMobile?: boolean;
  showOnDesktop?: boolean;
  locale: string;
}

/* -------------------- Query param tipleri -------------------- */

export type SliderSortField = 'display_order' | 'name' | 'created_at' | 'updated_at';

export type SliderSortOrder = 'asc' | 'desc';

/**
 * Admin list query (adminListQuerySchema ile uyumlu)
 * - locale opsiyonel (verilmezse tüm diller)
 */
export interface SliderAdminListQueryParams {
  q?: string;
  locale?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  sort?: SliderSortField;
  order?: SliderSortOrder;
}

/**
 * Public list query (publicListQuerySchema ile uyumlu)
 * - locale verilmezse backend default 'de'
 */
export interface SliderPublicListQueryParams {
  locale?: string;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: SliderSortField;
  order?: SliderSortOrder;
}

/**
 * Public detail – slug + locale
 * GET /sliders/:slug?locale=tr
 */
export interface SliderPublicDetailQuery {
  slug: string;
  locale?: string;
}

/* -------------------- Create / Update payload'ları -------------------- */

/**
 * CreateBody (createSchema) ile uyumlu payload
 * - Hem parent hem i18n alanlarını içerir
 */
export interface SliderCreatePayload {
  /** i18n.locale; verilmezse backend default 'de' kullanır */
  locale?: string;

  /** i18n alanları */
  name: string;
  slug?: string;
  description?: string | null;
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  /** Parent alanları */
  image_url?: string | null;
  image_asset_id?: string | null;
  image2_url?: string | null;
  badge_text?: string | null;
  badge_color?: string | null;
  gradient?: string | null;
  featured?: boolean;
  is_active?: boolean;
  display_order?: number;

  /** Esnek JSON meta – backend şu an ignore edebilir */
  meta?: Record<string, unknown> | null;
}

/**
 * UpdateBody (updateSchema.partial) ile uyumlu payload
 * - Hem parent hem i18n alanlarını opsiyonel olarak günceller
 */
export interface SliderUpdatePayload {
  locale?: string;

  name?: string;
  slug?: string;
  description?: string | null;
  alt?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;

  image_url?: string | null;
  image_asset_id?: string | null;
  image2_url?: string | null;
  badge_text?: string | null;
  badge_color?: string | null;
  gradient?: string | null;
  featured?: boolean;
  is_active?: boolean;
  display_order?: number;

  meta?: Record<string, unknown> | null;
}

/**
 * Reorder body – reorderSchema (ids: number[])
 * - ids: parent slider.id listesi
 */
export interface SliderReorderPayload {
  ids: number[];
}

/**
 * Status set – setStatusSchema
 * - Parent is_active toggling
 */
export interface SliderSetStatusPayload {
  is_active: boolean;
}

/**
 * Image set – setImageSchema (asset_id null ise image temizlenir)
 * - Parent image_url / image_asset_id ayarlanır
 */
export interface SliderSetImagePayload {
  asset_id: string | null;
}

/* -------------------- Normalizer'lar -------------------- */

export const normalizeSliderAdmin = (api: ApiSliderAdmin): SliderAdminDto => ({
  id: toStr(api.id),
  uuid: toStr(api.uuid),
  locale: toStr(api.locale || 'tr'),
  name: toStr(api.name),
  slug: toStr(api.slug),
  description: api.description ?? null,

  image_url: api.image_url ?? null,
  image_asset_id: api.image_asset_id ?? null,
  image_effective_url: api.image_effective_url ?? api.image_url ?? null,

  alt: api.alt ?? null,
  image2_url: api.image2_url ?? null,
  badge_text: api.badge_text ?? null,
  badge_color: api.badge_color ?? null,
  gradient: api.gradient ?? null,
  buttonText: api.buttonText ?? null,
  buttonLink: api.buttonLink ?? null,

  featured: toBool(api.featured),
  is_active: toBool(api.is_active),
  display_order: toNumber(api.display_order),

  created_at: toStr(api.created_at),
  updated_at: toStr(api.updated_at),

  meta: api.meta ?? null,
});

export const normalizeSliderPublic = (api: ApiSliderPublic): SliderPublicDto => ({
  id: toStr(api.id),
  title: toStr(api.title),
  description: toStr(api.description ?? ''),
  image: toStr(api.image ?? ''),
  alt: api.alt ?? undefined,
  buttonText: toStr(api.buttonText ?? 'İncele'),
  buttonLink: toStr(api.buttonLink ?? ''),

  isActive: toBool(api.isActive),
  order: toNumber(api.order),
  priority: api.priority,
  showOnMobile: api.showOnMobile,
  showOnDesktop: api.showOnDesktop,
  locale: toStr(api.locale || 'tr'),
});

/* -------------------- Helper fonksiyonlar (endpoint'ler için) -------------------- */

// Type aliases for compatibility
export type SliderAdminView = SliderAdminDto;
export type SliderAdminRow = ApiSliderAdmin;
export type SliderRow = ApiSliderAdmin;

/**
 * Admin list query parametrelerini temizle
 */
export function buildSliderParams(params?: SliderAdminListQueryParams): Record<string, unknown> | undefined {
  return cleanParams(params as Record<string, unknown>);
}

/**
 * Admin row'u view'a çevir (normalizeSliderAdmin alias)
 */
export function toAdminSliderView(row: SliderAdminRow): SliderAdminView {
  return normalizeSliderAdmin(row);
}
