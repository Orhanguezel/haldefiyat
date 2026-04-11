// =============================================================
// FILE: src/modules/products/validation.ts  ✅ FIXED
// - productCreateSchema / updateSchema içine item_type eklendi
// =============================================================
import { z } from 'zod';

/* ----------------- helpers ----------------- */
export const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema);

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

export const productItemType = z.enum(['product', 'sparepart', 'bereketfide']);
export type ProductItemTypeInput = z.infer<typeof productItemType>;

export const plantingSeason = z.enum(['ilkbahar', 'yaz', 'sonbahar', 'kis']);
export const climateZone = z.enum([
  'akdeniz',
  'ege',
  'marmara',
  'ic-anadolu',
  'karadeniz',
  'dogu-anadolu',
  'guneydogu',
]);
export const soilType = z.enum(['kumlu', 'killi', 'humuslu', 'balikli', 'torflu']);
export const waterNeed = z.enum(['low', 'medium', 'high']);
export const sunExposure = z.enum(['full', 'partial', 'shade']);

// ❗ Storage asset ID'leri için (uuid'e zorlamıyoruz)
const assetId = z.string().min(1).max(64);

// ❗ Admin tarafında client'tan gelen id alanları için (FAQ, SPEC vs.)
const entityId = z.preprocess((v) => {
  if (v == null || v === '') return undefined;
  return String(v);
}, z.string().max(64));

/* ----------------- PRODUCT ----------------- */
export const productCreateSchema = z.object({
  id: z.string().uuid().optional(),

  // ✅ type: base products.item_type
  item_type: productItemType.optional().default('product'),

  // 🌍 Çok dilli – ürün bazında locale (product_i18n.locale)
  locale: z.string().min(2).max(8).optional(), // yoksa backend "de" ile dolduracak

  // I18N alanlar
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: emptyToNull(z.string().optional().nullable()),
  alt: emptyToNull(z.string().max(255).optional().nullable()),
  tags: z.array(z.string()).optional().default([]),

  // Teknik özellikler: serbest key/value
  specifications: z.record(z.string(), z.string()).optional(),

  // Base alanlar
  price: z.coerce.number().nonnegative(),
  category_id: z.string().uuid(),
  sub_category_id: emptyToNull(z.string().uuid().optional().nullable()),

  image_url: emptyToNull(z.string().min(1).optional().nullable()),
  images: z.array(z.string().min(1)).optional().default([]),

  storage_asset_id: emptyToNull(assetId.optional().nullable()),
  storage_image_ids: z.array(assetId).optional().default([]),

  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),

  product_code: emptyToNull(z.string().max(64).optional().nullable()),
  stock_quantity: z.coerce.number().int().min(0).optional().default(0),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),

  order_num: z.coerce.number().int().min(0).optional().default(0),

  botanical_name: emptyToNull(z.string().max(255).optional().nullable()),
  planting_seasons: z.array(plantingSeason).optional().default([]),
  harvest_days: emptyToNull(z.coerce.number().int().min(0).optional().nullable()),
  climate_zones: z.array(climateZone).optional().default([]),
  soil_types: z.array(soilType).optional().default([]),
  water_need: emptyToNull(waterNeed.optional().nullable()),
  sun_exposure: emptyToNull(sunExposure.optional().nullable()),
  min_temp: emptyToNull(z.coerce.number().optional().nullable()),
  max_temp: emptyToNull(z.coerce.number().optional().nullable()),
  germination_days: emptyToNull(z.coerce.number().int().min(0).optional().nullable()),
  seed_depth_cm: emptyToNull(z.coerce.number().optional().nullable()),
  row_spacing_cm: emptyToNull(z.coerce.number().int().min(0).optional().nullable()),
  plant_spacing_cm: emptyToNull(z.coerce.number().int().min(0).optional().nullable()),
  yield_per_sqm: emptyToNull(z.string().max(50).optional().nullable()),

  meta_title: emptyToNull(z.string().max(255).optional().nullable()),
  meta_description: emptyToNull(z.string().max(500).optional().nullable()),
});

export const productUpdateSchema = productCreateSchema.partial();

/* ------------ Images ------------ */
export const productSetImagesSchema = z.object({
  cover_id: emptyToNull(assetId.optional().nullable()),
  image_ids: z.array(assetId).min(0),
  alt: emptyToNull(z.string().max(255).optional().nullable()),
});
export type ProductSetImagesInput = z.infer<typeof productSetImagesSchema>;

/* ----------------- FAQ ----------------- */
export const productFaqCreateSchema = z.object({
  id: entityId.optional(),
  product_id: z.string().uuid(),
  locale: z.string().min(2).max(8).optional(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  display_order: z.coerce.number().int().min(0).optional().default(0),
  is_active: boolLike.optional(),
});

/** Public: musteri soru gonderimi (answer bos, is_active=0 → admin onaylar) */
export const productFaqPublicSubmitSchema = z.object({
  product_id: z.string().uuid(),
  locale: z.string().min(2).max(8).optional(),
  question: z.string().min(3).max(500),
});
export type ProductFaqPublicSubmitInput = z.infer<typeof productFaqPublicSubmitSchema>;
export const productFaqUpdateSchema = productFaqCreateSchema.partial();
export type ProductFaqCreateInput = z.infer<typeof productFaqCreateSchema>;
export type ProductFaqUpdateInput = z.infer<typeof productFaqUpdateSchema>;

/* ----------------- SPEC ----------------- */
export const productSpecCreateSchema = z.object({
  id: entityId.optional(),
  product_id: z.string().uuid(),
  locale: z.string().min(2).max(8).optional(),
  name: z.string().min(1).max(255),
  value: z.string().min(1),
  category: z.enum(['physical', 'material', 'service', 'custom']).default('custom'),
  order_num: z.coerce.number().int().min(0).optional().default(0),
});
export const productSpecUpdateSchema = productSpecCreateSchema.partial();
export type ProductSpecCreateInput = z.infer<typeof productSpecCreateSchema>;
export type ProductSpecUpdateInput = z.infer<typeof productSpecUpdateSchema>;

/* ----------------- REVIEW ----------------- */
export const productReviewCreateSchema = z.object({
  id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  user_id: emptyToNull(z.string().uuid().optional().nullable()),
  rating: z.coerce.number().int().min(1).max(5),
  comment: emptyToNull(z.string().optional().nullable()),
  is_active: boolLike.optional(),
  customer_name: emptyToNull(z.string().max(255).optional().nullable()),
  review_date: emptyToNull(z.string().datetime().optional().nullable()),
});
export const productReviewUpdateSchema = productReviewCreateSchema.partial();
export type ProductReviewCreateInput = z.infer<typeof productReviewCreateSchema>;
export type ProductReviewUpdateInput = z.infer<typeof productReviewUpdateSchema>;

/** Public: musteri degerlendirme gonderimi (is_active=0 → admin onaylar) */
export const productReviewPublicSubmitSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
  customer_name: z.string().min(2).max(255),
});
export type ProductReviewPublicSubmitInput = z.infer<typeof productReviewPublicSubmitSchema>;
