// =============================================================
// FILE: src/integrations/shared/product-images-admin-types.ts
// Ensotek – Admin Product Images types (product_images)
// =============================================================

import type { BoolLike } from '@/integrations/shared/common';

export type ProductImageDto = {
  id: string;
  product_id: string;

  locale: string;

  image_url: string | null;
  image_asset_id: string | null;

  title: string | null;
  alt: string | null;
  caption: string | null;

  display_order: number | null;
  is_active: boolean;

  created_at?: string | null;
  updated_at?: string | null;
};

export type ProductImageCreatePayload = {
  image_url: string;
  image_asset_id?: string | null;

  is_active?: BoolLike;
  display_order?: number | null;

  title?: string | null;
  alt?: string | null;
  caption?: string | null;

  locale: string;

  // services pattern
  replicate_all_locales?: boolean;
};
