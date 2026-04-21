// =============================================================
// FILE: src/integrations/shared/custom-pages/custom-page-types.ts
// =============================================================

export interface CustomPageDto {
  id: string;
  module_key: string;
  is_published: boolean;
  display_order: number;
  featured_image: string | null;
  storage_asset_id: string | null;
  images: string[];
  storage_image_ids: string[];
  title: string;
  slug: string;
  content: string | null;
  summary: string | null;
  meta_title: string | null;
  meta_description: string | null;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface CustomPageListQueryParams {
  locale?: string;
  module_key?: string;
  is_published?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CustomPageCreatePayload {
  module_key?: string;
  locale?: string;
  title: string;
  slug: string;
  content?: string;
  summary?: string;
  meta_title?: string;
  meta_description?: string;
  is_published?: boolean;
  display_order?: number;
  featured_image?: string | null;
  storage_asset_id?: string | null;
  images?: string[];
  storage_image_ids?: string[];
}

export type CustomPageUpdatePayload = Partial<CustomPageCreatePayload> & { locale: string };

export interface CustomPageReorderItem {
  id: string;
  display_order: number;
}

export interface CustomPageReorderPayload {
  items: CustomPageReorderItem[];
}
