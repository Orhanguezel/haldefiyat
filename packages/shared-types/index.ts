/**
 * @eco/shared-types
 * Ekosistem genelinde paylasilan tip tanimlari.
 */

// ============================================
// Locale & i18n
// ============================================
export type Locale = 'tr' | 'en' | 'de';
export type LocaleRecord<T> = Partial<Record<Locale, T>>;

// ============================================
// Platform & Auth
// ============================================
export type Platform =
  | 'bereketfide'
  | 'vistaseed'
  | 'agroplatform'
  | 'targo'
  | 'katalogai';

export type UserRole = 'user' | 'dealer' | 'seller' | 'editor' | 'admin';

export interface EcosystemUser {
  id: number;
  ecosystemId: string | null;
  email: string;
  phone?: string | null;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  locale: Locale;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Product (Tarimsal Metadata Dahil)
// ============================================
export const plantingSeasonValues = ['ilkbahar', 'yaz', 'sonbahar', 'kis'] as const;
export type PlantingSeason = (typeof plantingSeasonValues)[number];
export type Season = PlantingSeason;

export const climateZoneValues = ['akdeniz', 'ege', 'marmara', 'ic-anadolu', 'karadeniz', 'dogu-anadolu', 'guneydogu'] as const;
export type ClimateZone = (typeof climateZoneValues)[number];

export const soilTypeValues = ['kumlu', 'killi', 'humuslu', 'balikli', 'torflu'] as const;
export type SoilType = (typeof soilTypeValues)[number];

export const waterNeedValues = ['low', 'medium', 'high'] as const;
export type WaterNeed = (typeof waterNeedValues)[number];

export const sunExposureValues = ['full', 'partial', 'shade'] as const;
export type SunExposure = (typeof sunExposureValues)[number];

export interface ProductAgriculturalMetadata {
  botanical_name?: string | null;
  planting_seasons?: PlantingSeason[];
  harvest_days?: number | null;
  climate_zones?: ClimateZone[];
  soil_types?: SoilType[];
  water_need?: WaterNeed | null;
  sun_exposure?: SunExposure | null;
  min_temp?: number | null;
  max_temp?: number | null;
  germination_days?: number | null;
  seed_depth_cm?: number | null;
  row_spacing_cm?: number | null;
  plant_spacing_cm?: number | null;
  yield_per_sqm?: string | null;
}

export interface EcosystemProduct {
  id: number;
  source: Platform;
  type: 'fide' | 'tohum' | 'girdi' | 'ekipman';
  name: LocaleRecord<string>;
  slug: string;
  category: string;
  subcategory?: string;

  // Tarimsal metadata
  botanicalName?: string;
  plantingSeasons?: PlantingSeason[];
  harvestDays?: number;
  climateZones?: ClimateZone[];
  soilTypes?: SoilType[];
  waterNeed?: WaterNeed;
  sunExposure?: SunExposure;
  minTemp?: number;
  maxTemp?: number;
  germinationDays?: number;
  seedDepthCm?: number;
  rowSpacingCm?: number;
  plantSpacingCm?: number;
  yieldPerSqm?: string;

  // Ticari
  priceRange?: { min: number; max: number; currency: string };
  inStock: boolean;
  moq?: number;

  // Medya
  images: { url: string; alt: string; isPrimary: boolean }[];
  documents?: { url: string; title: string; type: string }[];

  // SEO
  seoTitle: LocaleRecord<string>;
  seoDescription: LocaleRecord<string>;
}

// ============================================
// Content Federation
// ============================================
export interface ContentFeedItem {
  title: string;
  slug: string;
  excerpt: string;
  image?: string;
  url: string;
  source: Platform;
  type: 'blog' | 'product' | 'knowledge' | 'planting-guide' | 'news';
  category?: string;
  locale: Locale;
  publishedAt: string;
}

export interface ContentFeedResponse {
  items: ContentFeedItem[];
  total: number;
  page: number;
  limit: number;
}

// ============================================
// Ecosystem Link
// ============================================
export interface EcosystemLink {
  sourcePlatform: Platform;
  sourceType: string;
  sourceId: number;
  targetPlatform: Platform;
  targetUrl: string;
  targetTitle: string;
  linkType: 'related' | 'cross-sell' | 'reference';
}

// ============================================
// IoT & Sensor
// ============================================
export type MetricType = 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'ph';

export interface SensorReading {
  deviceId: string;
  metricType: MetricType;
  value: number;
  timestamp: Date;
}

// ============================================
// API Response Standart
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
