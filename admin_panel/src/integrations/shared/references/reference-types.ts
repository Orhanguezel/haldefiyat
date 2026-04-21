// =============================================================
// FILE: src/integrations/shared/references/reference-types.ts
// Reference domain types for admin panel
// =============================================================

export interface ReferenceDto {
  id: string;
  is_published: boolean;
  is_featured: boolean;
  display_order: number;
  featured_image: string | null;
  featured_image_asset_id: string | null;
  website_url: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  images?: string[];
  storage_image_ids?: string[];
  locale: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReferenceListQueryParams {
  q?: string;
  category_id?: string;
  is_published?: boolean;
  is_featured?: boolean;
  has_website?: boolean;
  module_key?: string;
  locale?: string;
  limit?: number;
  offset?: number;
  sort?: 'created_at' | 'updated_at' | 'display_order';
  orderDir?: 'asc' | 'desc';
}

export interface ReferenceCreatePayload {
  locale?: string;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  featured_image?: string | null;
  featured_image_asset_id?: string | null;
  featured_image_alt?: string | null;
  website_url?: string | null;
  category_id?: string | null;
  is_published?: boolean;
  is_featured?: boolean;
  display_order?: number;
  meta_title?: string | null;
  meta_description?: string | null;
  images?: string[];
  storage_image_ids?: string[];
}

export type ReferenceUpdatePayload = Partial<ReferenceCreatePayload>;

export interface ReferenceReorderItem {
  id: string;
  display_order: number;
}

export interface ReferenceReorderPayload {
  items: ReferenceReorderItem[];
}

export interface ReferenceImageDto {
  id: string;
  reference_id: string;
  image_url: string | null;
  storage_asset_id: string | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  title: string | null;
  alt: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferenceImageCreatePayload {
  image_url: string;
  storage_asset_id?: string;
  display_order?: number;
  is_featured?: boolean;
  title?: string;
  alt?: string;
  locale?: string;
}
