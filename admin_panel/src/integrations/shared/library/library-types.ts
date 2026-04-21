// =============================================================
// FILE: src/integrations/shared/library/library-types.ts
// Library domain types for admin panel
// =============================================================

export interface LibraryDto {
  id: string;
  type: string;
  category_id: string | null;
  sub_category_id: string | null;
  featured: boolean;
  is_published: boolean;
  is_active: boolean;
  display_order: number;
  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;
  views: number;
  download_count: number;
  published_at: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_alt: string | null;
  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  locale: string;
  category?: { id: string; name: string; slug: string } | null;
  sub_category?: { id: string; name: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryListQueryParams {
  q?: string;
  type?: string;
  category_id?: string;
  sub_category_id?: string;
  module_key?: string;
  featured?: boolean;
  is_published?: boolean;
  is_active?: boolean;
  locale?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "published_at" | "display_order" | "views" | "download_count";
  orderDir?: "asc" | "desc";
}

export interface LibraryCreatePayload {
  locale?: string;
  name: string;
  slug: string;
  description?: string | null;
  type?: string;
  category_id?: string | null;
  sub_category_id?: string | null;
  image_url?: string | null;
  image_asset_id?: string | null;
  image_alt?: string | null;
  tags?: string | null;
  featured?: boolean;
  is_published?: boolean;
  is_active?: boolean;
  display_order?: number;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  replicate_all_locales?: boolean;
}

export type LibraryUpdatePayload = Partial<Omit<LibraryCreatePayload, "id">>;

export interface LibraryReorderItem {
  id: string;
  display_order: number;
}

export interface LibraryReorderPayload {
  items: LibraryReorderItem[];
}

export interface LibraryImageDto {
  id: string;
  library_id: string;
  image_asset_id: string | null;
  image_url: string | null;
  img_asset_url?: string | null;
  is_active: boolean;
  display_order: number;
  title: string | null;
  alt: string | null;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryImageCreatePayload {
  image_url: string;
  image_asset_id?: string;
  display_order?: number;
  is_active?: boolean;
  title?: string;
  alt?: string;
  caption?: string;
  locale?: string;
}

export interface LibraryFileDto {
  id: string;
  library_id: string;
  asset_id: string | null;
  file_url: string | null;
  name: string;
  size_bytes: number | null;
  mime_type: string | null;
  tags: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryFileCreatePayload {
  file_url: string;
  asset_id?: string;
  name?: string;
  size_bytes?: number;
  mime_type?: string;
  tags?: string[];
  display_order?: number;
  is_active?: boolean;
}

export type LibraryFileUpdatePayload = Partial<LibraryFileCreatePayload>;
