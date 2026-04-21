export const SITE_SETTINGS_SOCIAL_KEYS = [
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'x',
] as const;

export type SiteSettingsSocialKey = (typeof SITE_SETTINGS_SOCIAL_KEYS)[number];

export const SITE_SETTINGS_CONTACT_EMPTY = {
  company_name: '',
  phone: '',
  phone_2: '',
  email: '',
  email_2: '',
  address: '',
  city: '',
  country: '',
  working_hours: '',
  maps_embed_url: '',
  maps_lat: '',
  maps_lng: '',
} as const;

export type SiteSettingsContactField = {
  key: keyof typeof SITE_SETTINGS_CONTACT_EMPTY;
  labelKey: string;
  colSpan2?: boolean;
  textarea?: boolean;
};

export const SITE_SETTINGS_CONTACT_FIELDS: readonly SiteSettingsContactField[] = [
  { key: 'company_name', labelKey: 'companyName', colSpan2: true },
  { key: 'phone', labelKey: 'phone' },
  { key: 'phone_2', labelKey: 'phone2' },
  { key: 'email', labelKey: 'email' },
  { key: 'email_2', labelKey: 'email2' },
  { key: 'address', labelKey: 'address', colSpan2: true, textarea: true },
  { key: 'city', labelKey: 'city' },
  { key: 'country', labelKey: 'country' },
  { key: 'working_hours', labelKey: 'workingHours', colSpan2: true },
  { key: 'maps_embed_url', labelKey: 'mapsEmbedUrl', colSpan2: true },
  { key: 'maps_lat', labelKey: 'mapsLat' },
  { key: 'maps_lng', labelKey: 'mapsLng' },
] as const;

export type SiteSettingsHeroTextField = {
  key: keyof typeof SITE_SETTINGS_HERO_EMPTY;
  labelKey: string;
  textarea?: boolean;
  colSpan2?: boolean;
  placeholderKey?: string;
};

export const SITE_SETTINGS_UI_HEADER_EMPTY = {
  nav_home: '',
  nav_products: '',
  nav_services: '',
  nav_news: '',
  nav_about: '',
  nav_contact: '',
  cta_label: '',
} as const;

export const SITE_SETTINGS_UI_HEADER_FIELDS = [
  { key: 'nav_home', labelKey: 'navHome' },
  { key: 'nav_products', labelKey: 'navProducts' },
  { key: 'nav_services', labelKey: 'navServices' },
  { key: 'nav_news', labelKey: 'navNews' },
  { key: 'nav_about', labelKey: 'navAbout' },
  { key: 'nav_contact', labelKey: 'navContact' },
  { key: 'cta_label', labelKey: 'ctaLabel' },
] as const;

export const SITE_SETTINGS_BUSINESS_HOUR_DAYS = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;

export type SiteSettingsBusinessHourDay = (typeof SITE_SETTINGS_BUSINESS_HOUR_DAYS)[number];

export const SITE_SETTINGS_BUSINESS_HOURS_EMPTY = [
  { day: 'mon', open: '09:00', close: '18:00', closed: false },
  { day: 'tue', open: '09:00', close: '18:00', closed: false },
  { day: 'wed', open: '09:00', close: '18:00', closed: false },
  { day: 'thu', open: '09:00', close: '18:00', closed: false },
  { day: 'fri', open: '09:00', close: '18:00', closed: false },
  { day: 'sat', open: '10:00', close: '14:00', closed: false },
  { day: 'sun', open: '00:00', close: '00:00', closed: true },
] as const;

export function toStructuredObjectSeed<T extends object>(value: unknown, seed: T): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : seed;
}

export const SITE_SETTINGS_COMPANY_PROFILE_EMPTY = {
  company_name: 'guezelwebdesign',
  slogan: '',
  about: '',
} as const;

export const SITE_SETTINGS_COMPANY_PROFILE_FIELDS = [
  { key: 'company_name', labelKey: 'companyName', textarea: false, colSpan2: false },
  { key: 'slogan', labelKey: 'slogan', textarea: false, colSpan2: false },
  { key: 'about', labelKey: 'about', textarea: true, colSpan2: true },
] as const;

export const SITE_SETTINGS_AVAILABLE_LANGUAGES = [
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'sv', label: 'Svenska' },
  { code: 'no', label: 'Norsk' },
  { code: 'da', label: 'Dansk' },
  { code: 'fi', label: 'Suomi' },
  { code: 'el', label: 'Ελληνικά' },
] as const;

export const SITE_SETTINGS_SEO_PAGE_CONFIG = [
  { key: 'home', labelKey: 'home', path: '/' },
  { key: 'projeler', labelKey: 'projects', path: '/projeler' },
  { key: 'hizmetler', labelKey: 'services', path: '/hizmetler' },
  { key: 'haberler', labelKey: 'news', path: '/haberler' },
  { key: 'hakkimizda', labelKey: 'about', path: '/hakkimizda' },
  { key: 'iletisim', labelKey: 'contact', path: '/iletisim' },
  { key: 'teklif', labelKey: 'offer', path: '/teklif' },
  { key: 'legal_privacy', labelKey: 'privacy', path: '/legal/privacy' },
  { key: 'legal_terms', labelKey: 'terms', path: '/legal/terms' },
] as const;

export const SITE_SETTINGS_HERO_EMPTY = {
  video_desktop: '',
  video_mobile: '',
  video_poster: '',
  headline_tr: '',
  headline_en: '',
  subheadline_tr: '',
  subheadline_en: '',
  cta_text_tr: '',
  cta_text_en: '',
  cta_url: '',
} as const;

export const SITE_SETTINGS_HERO_TEXT_FIELDS: readonly SiteSettingsHeroTextField[] = [
  { key: 'headline_tr', labelKey: 'headlineTr', textarea: false, colSpan2: false },
  { key: 'headline_en', labelKey: 'headlineEn', textarea: false, colSpan2: false },
  { key: 'subheadline_tr', labelKey: 'subheadlineTr', textarea: true, colSpan2: false },
  { key: 'subheadline_en', labelKey: 'subheadlineEn', textarea: true, colSpan2: false },
  { key: 'cta_text_tr', labelKey: 'ctaTextTr', textarea: false, colSpan2: false },
  { key: 'cta_text_en', labelKey: 'ctaTextEn', textarea: false, colSpan2: false },
  { key: 'cta_url', labelKey: 'ctaUrl', textarea: false, colSpan2: true, placeholderKey: 'ctaUrlPlaceholder' },
] as const;

export const SITE_SETTINGS_HERO_MEDIA_FIELDS = [
  {
    key: 'video_desktop',
    labelKey: 'videoDesktop',
    helperKey: 'videoDesktopHelp',
    folder: 'uploads/video',
  },
  {
    key: 'video_mobile',
    labelKey: 'videoMobile',
    helperKey: 'videoMobileHelp',
    folder: 'uploads/video',
  },
  {
    key: 'video_poster',
    labelKey: 'videoPoster',
    helperKey: 'videoPosterHelp',
    folder: 'uploads/video',
  },
] as const;

export const SITE_SETTINGS_BACKGROUND_EMPTY_ITEM = {
  url: '',
  alt: '',
} as const;

export type SiteSettingsSimpleSeo = {
  site_title: string;
  site_description: string;
  keywords: string;
  og_image: string;
  og_type: string;
};

export type SiteSettingsAdvancedSeo = {
  site_name: string;
  title_default: string;
  title_template: string;
  description: string;
  og_type: string;
  og_image: string;
  twitter_card: string;
  noindex: boolean;
};

export const SITE_SETTINGS_SEO_OG_TYPE_OPTIONS = [
  { value: 'website', labelKey: 'website' },
  { value: 'article', labelKey: 'article' },
] as const;

export const SITE_SETTINGS_SEO_TWITTER_CARD_OPTIONS = [
  { value: 'summary_large_image', labelKey: 'summaryLargeImage' },
  { value: 'summary', labelKey: 'summary' },
] as const;

export function coerceSiteSettingsStructuredValue(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return input;
    try {
      return JSON.parse(trimmed);
    } catch {
      return input;
    }
  }

  return input;
}

export function isSiteSettingsSimpleSeoValue(input: unknown): boolean {
  if (!input || typeof input !== 'object') return false;

  return (
    'site_title' in (input as Record<string, unknown>) ||
    'site_description' in (input as Record<string, unknown>) ||
    'keywords' in (input as Record<string, unknown>)
  );
}

export function normalizeSiteSettingsSimpleSeo(input: unknown): SiteSettingsSimpleSeo {
  const value = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};

  return {
    site_title: String(value.site_title ?? ''),
    site_description: String(value.site_description ?? ''),
    keywords: String(value.keywords ?? ''),
    og_image: String(value.og_image ?? ''),
    og_type: String(value.og_type ?? 'website'),
  };
}

export function normalizeSiteSettingsAdvancedSeo(input: unknown): SiteSettingsAdvancedSeo {
  const value = input && typeof input === 'object' ? (input as Record<string, any>) : {};
  const ogImages = Array.isArray(value?.open_graph?.images) ? value.open_graph.images : [];

  return {
    site_name: String(value.site_name ?? ''),
    title_default: String(value.title_default ?? ''),
    title_template: String(value.title_template ?? ''),
    description: String(value.description ?? ''),
    og_type: String(value?.open_graph?.type ?? 'website'),
    og_image: String(ogImages[0] ?? ''),
    twitter_card: String(value?.twitter?.card ?? 'summary_large_image'),
    noindex: Boolean(value?.robots?.noindex),
  };
}

export function toSiteSettingsAdvancedSeoObject(
  value: SiteSettingsAdvancedSeo,
): Record<string, unknown> {
  return {
    site_name: value.site_name,
    title_default: value.title_default,
    title_template: value.title_template,
    description: value.description,
    open_graph: {
      type: value.og_type,
      images: value.og_image ? [value.og_image] : [],
    },
    twitter: { card: value.twitter_card, site: '', creator: '' },
    robots: { noindex: value.noindex, index: !value.noindex, follow: true },
  };
}
