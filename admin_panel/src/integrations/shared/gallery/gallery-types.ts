// =============================================================
// FILE: src/integrations/shared/gallery/gallery-types.ts
// Gallery domain types for admin panel
// =============================================================

export interface GalleryDto {
  id: string;
  module_key: string;
  source_id: string | null;
  source_type: string | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  title: string;
  slug: string;
  description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryListQueryParams {
  q?: string;
  module_key?: string;
  is_active?: boolean;
  is_featured?: boolean;
  locale?: string;
  limit?: number;
  offset?: number;
  sort?: "created_at" | "updated_at" | "display_order";
  order?: "asc" | "desc";
}

export interface GalleryCreatePayload {
  id?: string;
  locale?: string;
  title: string;
  slug: string;
  description?: string | null;
  module_key?: string;
  source_id?: string | null;
  source_type?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  cover_image?: string | null;
  cover_asset_id?: string | null;
  cover_image_alt?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
}

export type GalleryUpdatePayload = Partial<Omit<GalleryCreatePayload, "id">>;

export interface GalleryReorderItem {
  id: string;
  display_order: number;
}

export interface GalleryReorderPayload {
  items: GalleryReorderItem[];
}

export interface GalleryImageDto {
  id: string;
  gallery_id: string;
  storage_asset_id: string | null;
  image_url: string | null;
  asset_url?: string | null;
  asset_width?: number | null;
  asset_height?: number | null;
  asset_mime?: string | null;
  display_order: number;
  is_cover: boolean;
  alt: string | null;
  caption: string | null;
  created_at: string;
}

export interface GalleryImageCreatePayload {
  image_url: string;
  storage_asset_id?: string;
  display_order?: number;
  is_cover?: boolean;
  alt?: string;
  caption?: string;
  locale?: string;
}
