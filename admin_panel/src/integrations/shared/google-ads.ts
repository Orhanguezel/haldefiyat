// ===================================================================
// FILE: src/integrations/shared/google-ads.ts
// Google Ads Admin API types + settings keys
// ===================================================================

export const GOOGLE_ADS_ADMIN_BASE = '/admin/google-ads';

export const GOOGLE_ADS_SETTINGS_KEYS = [
  'google_ads_enabled',
  'google_ads_developer_token',
  'google_ads_client_id',
  'google_ads_client_secret',
  'google_ads_refresh_token',
  'google_ads_customer_id',
  'google_ads_login_customer_id',
] as const;

export type GoogleAdsSettingsKey = (typeof GOOGLE_ADS_SETTINGS_KEYS)[number];
export type GoogleAdsSettingsModel = Record<GoogleAdsSettingsKey, string>;

export const GOOGLE_ADS_BOOLEAN_SETTINGS_KEYS = new Set<GoogleAdsSettingsKey>([
  'google_ads_enabled',
]);

export function createGoogleAdsSettingsDefaults(): GoogleAdsSettingsModel {
  return {
    google_ads_enabled: 'false',
    google_ads_developer_token: '',
    google_ads_client_id: '',
    google_ads_client_secret: '',
    google_ads_refresh_token: '',
    google_ads_customer_id: '',
    google_ads_login_customer_id: '',
  };
}

export type GoogleAdsCredentialFieldDef = {
  settingsKey: GoogleAdsSettingsKey;
  i18nKey: string;
};

export const GOOGLE_ADS_CREDENTIAL_FIELDS: GoogleAdsCredentialFieldDef[] = [
  { settingsKey: 'google_ads_developer_token', i18nKey: 'developerToken' },
  { settingsKey: 'google_ads_client_id', i18nKey: 'clientId' },
  { settingsKey: 'google_ads_client_secret', i18nKey: 'clientSecret' },
  { settingsKey: 'google_ads_refresh_token', i18nKey: 'refreshToken' },
  { settingsKey: 'google_ads_customer_id', i18nKey: 'customerId' },
  { settingsKey: 'google_ads_login_customer_id', i18nKey: 'loginCustomerId' },
] as const;

export const GOOGLE_ADS_DATE_RANGES = [
  'TODAY',
  'YESTERDAY',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'THIS_MONTH',
  'LAST_MONTH',
] as const;
export type GoogleAdsDateRange = (typeof GOOGLE_ADS_DATE_RANGES)[number];

export type GoogleAdsStatusResp = {
  enabled: boolean;
  has_credentials: boolean;
  customer_id: string;
};

export type GoogleAdsVerifyResp = {
  ok: boolean;
  customers?: string[];
};

export type GoogleAdsCampaignRow = {
  id: string;
  name: string;
  status: string;
  channel_type: string;
  budget_id: string;
  budget_micros: number;
  impressions: number;
  clicks: number;
  ctr: number;
  average_cpc_micros: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
  bidding_strategy_type: string;
  target_cpa_micros: number;
  target_roas: number;
};

export type GoogleAdsCampaignsResp = {
  items: GoogleAdsCampaignRow[];
  range: GoogleAdsDateRange;
};

/** micros → TL (para birimi hesabın kendi birimi) */
export function microsToUnit(micros: number): string {
  return (micros / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

export function formatCtr(ctr: number): string {
  return `%${(ctr * 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}

/** CPA = maliyet / dönüşüm (para birimi). Dönüşüm yoksa "—". */
export function formatCpa(costMicros: number, conversions: number): string {
  if (!conversions) return '—';
  return microsToUnit(costMicros / conversions);
}

/** ROAS = dönüşüm değeri / maliyet (×kat). Maliyet yoksa "—". */
export function formatRoas(conversionsValue: number, costMicros: number): string {
  if (!costMicros) return '—';
  const roas = conversionsValue / (costMicros / 1_000_000);
  return `×${roas.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}

export function formatNumber(v: number): string {
  return v.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

/** POST /admin/google-ads/campaigns/:id/status */
export type GoogleAdsSetStatusBody = {
  id: string;
  status: "ENABLED" | "PAUSED";
  customer_id?: string;
};

export type GoogleAdsSetStatusResp = {
  ok: boolean;
  campaign_id: string;
  status: string;
};

/** POST /admin/google-ads/campaigns/budget */
export type GoogleAdsSetBudgetBody = {
  budget_id: string;
  amount: number;
  customer_id?: string;
};

export type GoogleAdsSetBudgetResp = {
  ok: boolean;
  budget_id: string;
  amount_micros: number;
};

/** Durum/kanal etiketleri (TR) — bilinmeyen değer ham haliyle gösterilir */
export const ADS_STATUS_LABELS: Record<string, string> = {
  ENABLED: "Etkin",
  PAUSED: "Duraklatıldı",
  REMOVED: "Kaldırıldı",
  HIDDEN: "Gizli",
  UNKNOWN: "Bilinmiyor",
};

export const ADS_CHANNEL_LABELS: Record<string, string> = {
  SEARCH: "Arama",
  PERFORMANCE_MAX: "Maks. Performans",
  DISPLAY: "Görüntülü",
  VIDEO: "Video",
  SHOPPING: "Alışveriş",
  DEMAND_GEN: "Talep Yaratma",
  MULTI_CHANNEL: "Çoklu Kanal",
};

export const ADS_DEVICE_LABELS: Record<string, string> = {
  MOBILE: "Mobil",
  DESKTOP: "Masaüstü",
  TABLET: "Tablet",
  CONNECTED_TV: "TV",
  OTHER: "Diğer",
};

export const ADS_MATCH_TYPE_LABELS: Record<string, string> = {
  BROAD: "Geniş",
  PHRASE: "Sıralı",
  EXACT: "Tam",
};

export function adsLabel(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

/** GET /admin/google-ads/insights */
export type GoogleAdsConversionAction = {
  name: string;
  status: string;
  type: string;
  category: string;
  primary: boolean;
  counting_type: string;
  default_value: number;
};

export const ADS_CONV_CATEGORY_LABELS: Record<string, string> = {
  PURCHASE: "Satın Alma",
  LEAD: "Potansiyel Müşteri",
  REQUEST_QUOTE: "Teklif İsteği",
  CONTACT: "İletişim",
  SUBMIT_LEAD_FORM: "Form Gönderimi",
  SIGN_UP: "Kayıt",
  QUALIFIED_LEAD: "Nitelikli Müşteri",
  CONVERTED_LEAD: "Dönüşen Müşteri",
  GET_DIRECTIONS: "Yol Tarifi",
  ENGAGEMENT: "Etkileşim",
  PAGE_VIEW: "Sayfa Görüntüleme",
  DOWNLOAD: "İndirme",
  ADD_TO_CART: "Sepete Ekleme",
  BEGIN_CHECKOUT: "Ödemeye Başlama",
  PHONE_CALL_LEAD: "Telefon Araması",
};

export const ADS_COUNTING_LABELS: Record<string, string> = {
  ONE_PER_CLICK: "Tıklama başına 1 (lead)",
  MANY_PER_CLICK: "Tıklama başına çok (satış)",
};

export type GoogleAdsTermRow = {
  term: string;
  match_type?: string;
  resource_name?: string;
  status?: string;
  campaign: string;
  clicks: number;
  impressions: number;
  ctr: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
};

export type GoogleAdsDeviceRow = {
  campaign: string;
  device: string;
  clicks: number;
  cost_micros: number;
  conversions: number;
};

export type GoogleAdsRecommendationRow = {
  type: string;
  dismissed: boolean;
  campaign: string;
};

export const ADS_RECOMMENDATION_LABELS: Record<string, string> = {
  IMPROVE_PERFORMANCE_MAX_AD_STRENGTH: "Maks. Performans reklam gücünü iyileştir (başlık/açıklama/görsel ekle)",
  CAMPAIGN_BUDGET: "Kampanya bütçesini artır",
  KEYWORD: "Yeni anahtar kelime ekle",
  TARGET_CPA_OPT_IN: "Hedef EBM teklif stratejisine geç",
  MAXIMIZE_CONVERSIONS_OPT_IN: "Dönüşümleri en üst düzeye çıkar stratejisine geç",
  ENHANCED_CPC_OPT_IN: "Geliştirilmiş TBM'ye geç",
  RESPONSIVE_SEARCH_AD: "Yeni duyarlı arama reklamı ekle",
  SITELINK_ASSET: "Site bağlantısı öğesi ekle",
  CALLOUT_ASSET: "Açıklama metni öğesi ekle",
};

export type GoogleAdsInsightsResp = {
  recommendations: GoogleAdsRecommendationRow[];
  conversion_actions: GoogleAdsConversionAction[];
  search_terms: GoogleAdsTermRow[];
  keywords: GoogleAdsTermRow[];
  devices: GoogleAdsDeviceRow[];
  range: GoogleAdsDateRange;
};

/** POST /admin/google-ads/keywords/status */
export type GoogleAdsKeywordStatusBody = {
  resource_name: string;
  status: "ENABLED" | "PAUSED";
  customer_id?: string;
};

export type GoogleAdsKeywordStatusResp = {
  ok: boolean;
  resource_name: string;
  status: string;
};

/* ---------------- teklif stratejisi ---------------- */

export const ADS_BIDDING_LABELS: Record<string, string> = {
  MAXIMIZE_CONVERSIONS: "Maks. Dönüşüm",
  MAXIMIZE_CONVERSION_VALUE: "Maks. Dönüşüm Değeri",
  TARGET_CPA: "Hedef EBM",
  TARGET_ROAS: "Hedef ROAS",
  TARGET_SPEND: "Tıklamaları Artır",
  MANUAL_CPC: "Manuel TBM",
};

export type GoogleAdsBiddingStrategy = "MAXIMIZE_CONVERSIONS" | "MAXIMIZE_CONVERSION_VALUE";

export type GoogleAdsBiddingArgs = {
  id: string;
  strategy: GoogleAdsBiddingStrategy;
  target_cpa?: number;
  target_roas?: number;
  customer_id?: string;
};
export type GoogleAdsBiddingResp = { ok: boolean; campaign_id: string; strategy: string };

/* ---------------- kelime ekleme ---------------- */

export type GoogleAdsMatchType = "BROAD" | "PHRASE" | "EXACT";

export type GoogleAdsAdGroup = {
  id: string;
  name: string;
  status: string;
  campaign: string;
};
export type GoogleAdsAdGroupsResp = { items: GoogleAdsAdGroup[] };

export type GoogleAdsNegativeKeywordArgs = {
  campaign_id: string;
  text: string;
  match_type: GoogleAdsMatchType;
  customer_id?: string;
};
export type GoogleAdsKeywordAddArgs = {
  ad_group_id: string;
  text: string;
  match_type: GoogleAdsMatchType;
  customer_id?: string;
};
export type GoogleAdsKeywordMutationResp = { ok: boolean };

/* ---------------- raporlama ---------------- */

export type GoogleAdsTotals = {
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
};
export type GoogleAdsReportCampaign = GoogleAdsTotals & { name: string };

export type GoogleAdsReportResp = {
  range: GoogleAdsDateRange;
  current: GoogleAdsTotals;
  previous: GoogleAdsTotals;
  current_dates: { start: string; end: string };
  previous_dates: { start: string; end: string };
  campaigns: GoogleAdsReportCampaign[];
};

/** Önceki döneme göre yüzde değişim (önceki 0 ise null). */
export function pctDelta(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

/* ---------------- çoklu hesap + ürün (Shopping) ---------------- */

export type GoogleAdsAccount = {
  id: string;
  name: string;
  currency: string;
  aw_id: string;
  manager: boolean;
  is_default: boolean;
};
export type GoogleAdsAccountsResp = { items: GoogleAdsAccount[] };

export type GoogleAdsProductRow = {
  item_id: string;
  title: string;
  campaign: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversions_value: number;
};
export type GoogleAdsProductsResp = { items: GoogleAdsProductRow[]; range: GoogleAdsDateRange };

/** Hesap seçici ortak query parçası — boş string gönderme. */
export type GoogleAdsCustomerArg = { customer_id?: string };

/* ---------------- dönüşüm sağlığı / izleme ---------------- */

export type GoogleAdsConversionStat = {
  name: string;
  origin: string;
  category: string;
  status: string;
  primary: boolean;
  conversions: number;
  all_conversions: number;
};

export type GoogleAdsConversionHealthResp = {
  range: GoogleAdsDateRange;
  clicks: number;
  conversions: number;
  all_conversions: number;
  website_conversions: number;
  website_all_conversions: number;
  verdict: 'OK' | 'WEBSITE_ZERO' | 'LOW_TRAFFIC';
  actions: GoogleAdsConversionStat[];
};

export const ADS_CONV_ORIGIN_LABELS: Record<string, string> = {
  WEBSITE: 'Web (etiket)',
  GOOGLE_HOSTED: 'Google otomatik',
  APP: 'Uygulama',
  CALL_FROM_ADS: 'Reklamdan arama',
  STORE: 'Mağaza',
  YOUTUBE_HOSTED: 'YouTube',
};

export type GoogleAdsOfflineStatus = {
  with_gclid: number;
  uploaded: number;
  pending: number;
  ready: number;
};

export type GoogleAdsOfflineUploadResp = {
  action: string;
  received: number;
  uploaded: number;
  failed: number;
  errors: string[];
  uploaded_refs: string[];
  status: GoogleAdsOfflineStatus;
};

export const ADS_CONV_VERDICT: Record<string, { label: string; tone: 'ok' | 'warn' | 'info' }> = {
  OK: { label: 'Web dönüşümleri kaydediliyor', tone: 'ok' },
  WEBSITE_ZERO: { label: 'Trafik var ama web formu dönüşümü 0 — etiket/teslimi kontrol et', tone: 'warn' },
  LOW_TRAFFIC: { label: 'Dönüşüm için yeterli tıklama birikmedi', tone: 'info' },
};

/* ---------------- PMax öğe grubu öğeleri (metin/görsel/video) ---------------- */

export const GOOGLE_ADS_IMAGE_FIELD_TYPES = [
  "MARKETING_IMAGE",
  "SQUARE_MARKETING_IMAGE",
  "PORTRAIT_MARKETING_IMAGE",
  "LOGO",
  "LANDSCAPE_LOGO",
] as const;
export type GoogleAdsImageFieldType = (typeof GOOGLE_ADS_IMAGE_FIELD_TYPES)[number];

export const GOOGLE_ADS_TEXT_FIELD_TYPES = [
  "HEADLINE",
  "LONG_HEADLINE",
  "DESCRIPTION",
  "BUSINESS_NAME",
] as const;
export type GoogleAdsTextFieldType = (typeof GOOGLE_ADS_TEXT_FIELD_TYPES)[number];

export type GoogleAdsAssetKind = "text" | "image" | "video";

/** Field type → TR etiket */
export const ADS_FIELD_TYPE_LABELS: Record<string, string> = {
  HEADLINE: "Başlık",
  LONG_HEADLINE: "Uzun Başlık",
  DESCRIPTION: "Açıklama",
  BUSINESS_NAME: "İşletme Adı",
  MARKETING_IMAGE: "Yatay Görsel (1.91:1)",
  SQUARE_MARKETING_IMAGE: "Kare Görsel (1:1)",
  PORTRAIT_MARKETING_IMAGE: "Dikey Görsel (4:5)",
  LOGO: "Logo (1:1)",
  LANDSCAPE_LOGO: "Yatay Logo (4:1)",
  YOUTUBE_VIDEO: "Video (YouTube)",
};

/** Reklam gücü → TR etiket */
export const ADS_STRENGTH_LABELS: Record<string, string> = {
  PENDING: "Hesaplanıyor",
  POOR: "Zayıf",
  AVERAGE: "Ortalama",
  GOOD: "İyi",
  EXCELLENT: "Mükemmel",
  UNSPECIFIED: "Belirsiz",
  UNKNOWN: "Bilinmiyor",
};

/** Öğe türü tanımları — panel bölümleri ve limitler bundan türetilir.
 *  max: Google üst sınırı, target: sağlıklı sayı (rozet ✓ eşiği), maxLen: metin karakter limiti */
export type GoogleAdsFieldDescriptor = {
  fieldType: string;
  kind: GoogleAdsAssetKind;
  max: number;
  target: number;
  maxLen?: number;
};

export const GOOGLE_ADS_FIELD_DESCRIPTORS: GoogleAdsFieldDescriptor[] = [
  { fieldType: "HEADLINE", kind: "text", max: 15, target: 11, maxLen: 30 },
  { fieldType: "LONG_HEADLINE", kind: "text", max: 5, target: 5, maxLen: 90 },
  { fieldType: "DESCRIPTION", kind: "text", max: 5, target: 4, maxLen: 90 },
  { fieldType: "BUSINESS_NAME", kind: "text", max: 1, target: 1, maxLen: 25 },
  { fieldType: "MARKETING_IMAGE", kind: "image", max: 20, target: 3 },
  { fieldType: "SQUARE_MARKETING_IMAGE", kind: "image", max: 20, target: 3 },
  { fieldType: "PORTRAIT_MARKETING_IMAGE", kind: "image", max: 20, target: 1 },
  { fieldType: "LOGO", kind: "image", max: 5, target: 1 },
  { fieldType: "LANDSCAPE_LOGO", kind: "image", max: 5, target: 1 },
  { fieldType: "YOUTUBE_VIDEO", kind: "video", max: 5, target: 1 },
];

export type GoogleAdsAssetGroup = {
  id: string;
  name: string;
  status: string;
  ad_strength: string;
  campaign_id: string;
  campaign: string;
};

export type GoogleAdsAssetGroupsResp = { items: GoogleAdsAssetGroup[] };

export type GoogleAdsAssetItem = {
  resource_name: string;
  field_type: string;
  kind: "text" | "image" | "video" | "other";
  asset_id: string;
  name: string;
  text: string;
  image_url: string;
  video_id: string;
  width: number;
  height: number;
};

export type GoogleAdsAssetsResp = { items: GoogleAdsAssetItem[] };

export type GoogleAdsAssetUploadArgs = {
  assetGroupId: string;
  fieldType: GoogleAdsImageFieldType;
  file: File;
  customer_id?: string;
};
export type GoogleAdsAssetUrlArgs = {
  assetGroupId: string;
  fieldType: GoogleAdsImageFieldType;
  url: string;
  customer_id?: string;
};
export type GoogleAdsAssetTextArgs = {
  assetGroupId: string;
  fieldType: GoogleAdsTextFieldType;
  text: string;
  customer_id?: string;
};
export type GoogleAdsAssetVideoArgs = { assetGroupId: string; youtube: string; customer_id?: string };

export type GoogleAdsAssetMutationResp = {
  ok: boolean;
  asset: string;
  asset_group_asset: string;
};

export type GoogleAdsAssetRemoveBody = { resource_name: string; customer_id?: string };
export type GoogleAdsAssetRemoveResp = { ok: boolean; resource_name: string };
