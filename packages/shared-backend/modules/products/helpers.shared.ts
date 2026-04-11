// =============================================================
// FILE: src/modules/products/helpers.shared.ts
// Shared helpers for products controller + admin.controller
// =============================================================
import { toNum } from '../_shared';
import type { ProductItemType } from './schema';

export type ItemType = ProductItemType;

export const normalizeItemType = (raw?: unknown, fallback: ItemType = 'product'): ItemType => {
  if (raw === 'sparepart') return 'sparepart';
  if (raw === 'bereketfide') return 'bereketfide';
  if (raw === 'product') return 'product';
  return fallback;
};

export function normalizeProduct(row: any) {
  if (!row) return row;
  const p: any = { ...row };

  p.price = toNum(p.price);
  p.rating = toNum(p.rating);
  p.review_count = toNum(p.review_count) ?? 0;
  p.stock_quantity = toNum(p.stock_quantity) ?? 0;

  if (typeof p.images === 'string') {
    try { p.images = JSON.parse(p.images); } catch {}
  }
  if (!Array.isArray(p.images)) p.images = [];

  if (typeof p.tags === 'string') {
    try { p.tags = JSON.parse(p.tags); } catch {}
  }
  if (!Array.isArray(p.tags)) p.tags = [];

  if (typeof p.specifications === 'string') {
    try { p.specifications = JSON.parse(p.specifications); } catch {}
  }

  if (typeof p.storage_image_ids === 'string') {
    try { p.storage_image_ids = JSON.parse(p.storage_image_ids); } catch {}
  }
  if (!Array.isArray(p.storage_image_ids)) p.storage_image_ids = [];

  for (const key of ['planting_seasons', 'climate_zones', 'soil_types'] as const) {
    if (typeof p[key] === 'string') {
      try {
        p[key] = JSON.parse(p[key]);
      } catch {
        p[key] = [];
      }
    }
    if (!Array.isArray(p[key])) p[key] = [];
  }

  if (p.min_temp != null) p.min_temp = toNum(p.min_temp);
  if (p.max_temp != null) p.max_temp = toNum(p.max_temp);
  if (p.seed_depth_cm != null) p.seed_depth_cm = toNum(p.seed_depth_cm);
  if (p.harvest_days != null) p.harvest_days = toNum(p.harvest_days) ?? null;
  if (p.germination_days != null) p.germination_days = toNum(p.germination_days) ?? null;
  if (p.row_spacing_cm != null) p.row_spacing_cm = toNum(p.row_spacing_cm) ?? null;
  if (p.plant_spacing_cm != null) p.plant_spacing_cm = toNum(p.plant_spacing_cm) ?? null;

  return p;
}

/** Kamuya acik API yanitlarinda liste/detay fiyat gostermez (bayi endpoint ayri). */
export function publicProductJson<T extends Record<string, unknown>>(payload: T): Omit<T, "price"> {
  const { price: _omit, ...rest } = payload;
  return rest as Omit<T, "price">;
}
