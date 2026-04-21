// =============================================================
// FILE: src/integrations/shared/products/product-config.ts
// Product module config, helpers, formatters
// =============================================================

import {
  climateZoneValues,
  plantingSeasonValues,
  soilTypeValues,
  sunExposureValues,
  waterNeedValues,
} from '@agro/shared-types';
import type { AdminLocaleOption } from '@/integrations/shared/admin-locales';
import type {
  ProductDto,
  ProductListQueryParams,
  ItemType,
  PlantingSeason,
  ClimateZone,
  SoilType,
  WaterNeed,
  SunExposure,
} from './product-types';

export const PLANTING_SEASON_OPTIONS: readonly PlantingSeason[] = plantingSeasonValues;
export const CLIMATE_ZONE_OPTIONS: readonly ClimateZone[] = climateZoneValues;
export const SOIL_TYPE_OPTIONS: readonly SoilType[] = soilTypeValues;
export const WATER_NEED_OPTIONS: readonly WaterNeed[] = waterNeedValues;
export const SUN_EXPOSURE_OPTIONS: readonly SunExposure[] = sunExposureValues;

export const PRODUCTS_ADMIN_BASE = '/admin/products';
export const PRODUCT_DEFAULT_LOCALE = 'tr';
export const PRODUCT_META_TITLE_LIMIT = 60;
export const PRODUCT_META_DESCRIPTION_LIMIT = 155;
export const PRODUCT_DEFAULT_ITEM_TYPE: ItemType = 'product';

export type ProductDetailTabKey =
  | 'content'
  | 'seo'
  | 'images'
  | 'faqs'
  | 'specs'
  | 'reviews'
  | 'agriculture';

export interface ProductDetailFormState {
  title: string;
  slug: string;
  locale: string;
  item_type: ItemType;
  description: string;
  alt: string;
  image_url: string;
  storage_asset_id: string;
  images: string[];
  storage_image_ids: string[];
  tags: string[];
  specifications: Record<string, string>;
  price: number;
  category_id: string;
  sub_category_id: string;
  product_code: string;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  order_num: number;
  meta_title: string;
  meta_description: string;

  botanical_name: string;
  planting_seasons: PlantingSeason[];
  harvest_days: number | '';
  climate_zones: ClimateZone[];
  soil_types: SoilType[];
  water_need: WaterNeed | '';
  sun_exposure: SunExposure | '';
  min_temp: number | '';
  max_temp: number | '';
  germination_days: number | '';
  seed_depth_cm: number | '';
  row_spacing_cm: number | '';
  plant_spacing_cm: number | '';
  yield_per_sqm: string;
}

export function createEmptyProductDetailForm(locale: string): ProductDetailFormState {
  return {
    title: '',
    slug: '',
    locale,
    item_type: PRODUCT_DEFAULT_ITEM_TYPE,
    description: '',
    alt: '',
    image_url: '',
    storage_asset_id: '',
    images: [],
    storage_image_ids: [],
    tags: [],
    specifications: {},
    price: 0,
    category_id: '',
    sub_category_id: '',
    product_code: '',
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
    order_num: 0,
    meta_title: '',
    meta_description: '',
    botanical_name: '',
    planting_seasons: [],
    harvest_days: '',
    climate_zones: [],
    soil_types: [],
    water_need: '',
    sun_exposure: '',
    min_temp: '',
    max_temp: '',
    germination_days: '',
    seed_depth_cm: '',
    row_spacing_cm: '',
    plant_spacing_cm: '',
    yield_per_sqm: '',
  };
}

export function mapProductToDetailForm(
  product: Partial<ProductDto> | Record<string, unknown> | null | undefined,
  activeLocale: string,
): ProductDetailFormState {
  const fallback = createEmptyProductDetailForm(activeLocale);
  if (!product) return fallback;
  const s = product as Partial<ProductDto>;
  return {
    title: s.title || '',
    slug: s.slug || '',
    locale: activeLocale,
    item_type: s.item_type || PRODUCT_DEFAULT_ITEM_TYPE,
    description: s.description || '',
    alt: s.alt || '',
    image_url: s.image_url || '',
    storage_asset_id: s.storage_asset_id || '',
    images: s.images || [],
    storage_image_ids: s.storage_image_ids || [],
    tags: s.tags || [],
    specifications: s.specifications || {},
    price: s.price ?? 0,
    category_id: s.category_id || '',
    sub_category_id: s.sub_category_id || '',
    product_code: s.product_code || '',
    stock_quantity: s.stock_quantity ?? 0,
    is_active: s.is_active ?? true,
    is_featured: s.is_featured ?? false,
    order_num: s.order_num ?? 0,
    meta_title: s.meta_title || '',
    meta_description: s.meta_description || '',
    botanical_name: s.botanical_name || '',
    planting_seasons: (s.planting_seasons as PlantingSeason[] | undefined) ?? [],
    harvest_days: s.harvest_days ?? '',
    climate_zones: (s.climate_zones as ClimateZone[] | undefined) ?? [],
    soil_types: (s.soil_types as SoilType[] | undefined) ?? [],
    water_need: (s.water_need as WaterNeed | null | undefined) ?? '',
    sun_exposure: (s.sun_exposure as SunExposure | null | undefined) ?? '',
    min_temp: s.min_temp ?? '',
    max_temp: s.max_temp ?? '',
    germination_days: s.germination_days ?? '',
    seed_depth_cm: s.seed_depth_cm ?? '',
    row_spacing_cm: s.row_spacing_cm ?? '',
    plant_spacing_cm: s.plant_spacing_cm ?? '',
    yield_per_sqm: s.yield_per_sqm || '',
  };
}

export function buildProductsListQueryParams(input: {
  search?: string;
  locale?: string;
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  itemType?: ItemType;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: string;
}): ProductListQueryParams {
  const params: ProductListQueryParams = {
    locale: input.locale || PRODUCT_DEFAULT_LOCALE,
    item_type: input.itemType || PRODUCT_DEFAULT_ITEM_TYPE,
  };
  if (input.search) params.q = input.search;
  if (input.categoryId) params.category_id = input.categoryId;
  if (input.isActive) params.is_active = true;
  if (input.isFeatured) params.is_featured = true;
  if (input.limit) params.limit = input.limit;
  if (input.offset) params.offset = input.offset;
  if (input.sort) params.sort = input.sort as ProductListQueryParams['sort'];
  if (input.order) params.order = input.order as ProductListQueryParams['order'];
  return params;
}

export function buildProductLocaleOptions(
  localeOptions: Array<{ value: unknown; label?: string }> | null | undefined,
  normalizeLocale: (value: unknown) => string,
): AdminLocaleOption[] {
  return (localeOptions ?? []).map((option) => ({
    value: normalizeLocale(option.value) || String(option.value || ''),
    label: option.label || normalizeLocale(option.value)?.toUpperCase() || String(option.value || ''),
  }));
}

export function buildProductToastMessage(title: string, message: string): string {
  return `${title}: ${message}`;
}

export function formatProductPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price);
}
