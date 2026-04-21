// =============================================================
// FILE: src/integrations/shared/products/product-types.ts
// Product domain types for admin panel
// =============================================================

import type {
  ClimateZone,
  PlantingSeason,
  ProductAgriculturalMetadata,
  SoilType,
  SunExposure,
  WaterNeed,
} from '@agro/shared-types';
export type {
  ClimateZone,
  PlantingSeason,
  ProductAgriculturalMetadata,
  SoilType,
  SunExposure,
  WaterNeed,
} from '@agro/shared-types';

export type ItemType = 'product' | 'sparepart' | 'bereketfide';
export type SpecCategory = 'physical' | 'material' | 'service' | 'custom';

export interface ProductDto extends ProductAgriculturalMetadata {
  id: string;
  item_type: ItemType;
  category_id: string | null;
  sub_category_id: string | null;
  price: number;
  image_url: string | null;
  storage_asset_id: string | null;
  images: string[];
  storage_image_ids: string[];
  is_active: boolean;
  is_featured: boolean;
  order_num: number;
  product_code: string | null;
  stock_quantity: number;
  rating: number;
  review_count: number;
  title: string;
  slug: string;
  description: string | null;
  alt: string | null;
  tags: string[];
  specifications: Record<string, string>;
  meta_title: string | null;
  meta_description: string | null;
  locale: string;
  category?: { id: string; name: string; slug: string } | null;
  sub_category?: { id: string; name: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListQueryParams {
  q?: string;
  category_id?: string;
  sub_category_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  item_type?: ItemType;
  locale?: string;
  limit?: number;
  offset?: number;
  sort?: 'price' | 'rating' | 'created_at' | 'order_num';
  order?: 'asc' | 'desc';
}

export interface ProductCreatePayload extends ProductAgriculturalMetadata {
  id?: string;
  item_type?: ItemType;
  locale?: string;
  title: string;
  slug: string;
  description?: string | null;
  alt?: string | null;
  tags?: string[];
  specifications?: Record<string, string>;
  meta_title?: string | null;
  meta_description?: string | null;
  price: number;
  category_id: string;
  sub_category_id?: string | null;
  image_url?: string | null;
  images?: string[];
  storage_asset_id?: string | null;
  storage_image_ids?: string[];
  is_active?: boolean;
  is_featured?: boolean;
  product_code?: string | null;
  stock_quantity?: number;
  rating?: number;
  review_count?: number;
}

export type ProductUpdatePayload = Partial<Omit<ProductCreatePayload, 'id'>>;

export interface ProductReorderItem {
  id: string;
  order_num: number;
}

export interface ProductReorderPayload {
  items: ProductReorderItem[];
}

export interface ProductImageDto {
  id: string;
  product_id: string;
  locale: string;
  image_url: string;
  image_asset_id: string | null;
  title: string | null;
  alt: string | null;
  caption: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImageCreatePayload {
  image_url: string;
  image_asset_id?: string;
  is_active?: boolean;
  display_order?: number;
  title?: string;
  alt?: string;
  caption?: string;
  locale?: string;
  replicate_all_locales?: boolean;
}

export interface ProductFaqDto {
  id: string;
  product_id: string;
  locale: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFaqCreatePayload {
  question: string;
  answer: string;
  locale?: string;
  display_order?: number;
  is_active?: boolean;
}

export type ProductFaqUpdatePayload = Partial<ProductFaqCreatePayload>;

export interface ProductSpecDto {
  id: string;
  product_id: string;
  locale: string;
  name: string;
  value: string;
  category: SpecCategory;
  order_num: number;
  created_at: string;
  updated_at: string;
}

export interface ProductSpecCreatePayload {
  name: string;
  value: string;
  locale?: string;
  category?: SpecCategory;
  order_num?: number;
}

export type ProductSpecUpdatePayload = Partial<ProductSpecCreatePayload>;

export interface ProductReviewDto {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  comment: string | null;
  is_active: boolean;
  customer_name: string | null;
  review_date: string;
  created_at: string;
  updated_at: string;
}

export interface ProductReviewCreatePayload {
  rating: number;
  comment?: string | null;
  user_id?: string | null;
  is_active?: boolean;
  customer_name?: string | null;
  review_date?: string | null;
}

export type ProductReviewUpdatePayload = Partial<ProductReviewCreatePayload>;
