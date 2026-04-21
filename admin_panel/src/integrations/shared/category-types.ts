// =============================================================
// FILE: src/integrations/shared/category-types.ts
// Ensotek – Kategori tipleri (DB/DTO + payloadlar)
// =============================================================

/**
 * Backend'deki CategoryRow ile bire bir DTO
 */
export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  locale?: string | null;
  module_key?: string | null;

  description: string | null;

  image_url: string | null;
  storage_asset_id: string | null;

  alt: string | null;
  icon: string | null;

  is_active: boolean;
  is_featured: boolean;
  has_cart: boolean;
  is_unlimited: boolean;
  display_order: number;

  whatsapp_number: string | null;
  phone_number: string | null;

  created_at: string;
  updated_at: string;
}

/**
 * Admin list endpoint'ine giden query parametreleri
 * (AdminListCategoriesQS ile uyumlu)
 */
export interface CategoryListQueryParams {
  q?: string;
  locale?: string;
  module_key?: string;
  is_active?: boolean | string;
  is_featured?: boolean | string;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'name' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

/**
 * Create payload – categoryCreateSchema ile uyumlu olacak şekilde
 */
export interface CategoryCreatePayload {
  id?: string; // genelde backend randomUUID, ama opsiyonel bırakıyoruz

  name: string;
  slug: string;

  description?: string | null;
  image_url?: string | null;
  alt?: string | null;

  icon?: string | null;

  // boolLike ile uyumlu tip
  is_active?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  is_featured?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  has_cart?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  is_unlimited?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';

  display_order?: number;

  whatsapp_number?: string | null;
  phone_number?: string | null;
}

/**
 * Update payload – categoryUpdateSchema.partial()
 *  - id body’de beklenmediği için hariç tutuldu
 */
export type CategoryUpdatePayload = Partial<Omit<CategoryCreatePayload, 'id'>>;

/**
 * Sıralama endpoint’i için payload
 * POST /admin/categories/reorder
 */
export interface CategoryReorderItem {
  id: string;
  display_order: number;
}

export interface CategoryReorderPayload {
  items: CategoryReorderItem[];
}

/**
 * Kapak görseli ayarlama payload’ı
 * PATCH /admin/categories/:id/image
 */
export interface CategorySetImagePayload {
  id: string;
  asset_id?: string | null;
  alt?: string | null;
}

/**
 * Public list için de aynı query tipini kullanabiliriz.
 * (listCategories controller ile uyumlu)
 */
export type CategoryPublicListQueryParams = CategoryListQueryParams;
