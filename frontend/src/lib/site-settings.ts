/**
 * Site Settings — Backend'den site ayarlarini ceker.
 * Kullanim: Header, Footer, Layout gibi yerlerde branding bilgisi icin.
 */

// BACKEND_URL: server-only, runtime'da okunur (build'e baked olmaz)
// NEXT_PUBLIC_API_URL: client-side fallback (baked olur — lokal geliştirme için yeterli)
export const API_URL = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8088"
).replace(/\/$/, "");
const API_V1 = `${API_URL}/api/v1`;

export interface SiteSettings {
  site_name: string;
  site_logo: string;
  site_logo_dark: string;
  site_favicon: string;
  site_apple_touch: string;
  site_description: string;
  theme_font_size: string;
  theme_font_scale: number;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  contact_map_lat: string;
  contact_map_lng: string;
  contact_map_iframe: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_linkedin: string;
  social_youtube: string;
  whatsapp_number: string;
}

// DB'deki gerçek key isimleri (seed 004_site_settings_schema.sql ile eşleşmeli)
const BRANDING_KEYS = [
  "brand_name",
  "site_logo",
  "site_favicon",
  "site_apple_touch",
  "site_description",
  "contact_email",
  "contact_phone",
  "contact_address",
  "contact_map_lat",
  "contact_map_lng",
  "contact_map_iframe",
  "social_facebook",
  "social_instagram",
  "social_twitter",
  "social_linkedin",
  "social_youtube",
  "whatsapp_number",
];

interface SettingRow {
  key: string;
  value: unknown;
}

function parseValue(raw: unknown): any {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export async function fetchSiteSettings(locale = "tr"): Promise<SiteSettings> {
  const defaults: SiteSettings = {
    site_name: process.env.NEXT_PUBLIC_SITE_NAME ?? "HalDeFiyat",
    site_logo: "/brand-logo.png",
    site_logo_dark: "/brand-logo.png",
    site_favicon: "/favicon.png",
    site_apple_touch: "/apple-touch-icon.png",
    site_description: "",
    theme_font_size: "16px",
    theme_font_scale: 1,
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    contact_map_lat: "",
    contact_map_lng: "",
    contact_map_iframe: "",
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    social_linkedin: "",
    social_youtube: "",
    whatsapp_number: "",
  };

  try {
    const keys = BRANDING_KEYS.join(",");
    const res = await fetch(
      `${API_V1}/site_settings?key_in=${keys}&locale=${locale}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return defaults;
    const rows: SettingRow[] = await res.json();
    if (!Array.isArray(rows)) return defaults;

    const result = { ...defaults };
    for (const row of rows) {
      const dbKey = row.key as keyof SiteSettings;
      const val = parseValue(row.value);
      // brand_name → site_name
      if (row.key === "brand_name") {
        result.site_name = typeof val === "string" ? val : result.site_name;
      } else if (dbKey in result) {
        (result as any)[dbKey] = typeof val === "string" ? val : (val?.value ?? "");
      }
    }

    // Replace {{SITE_NAME}} placeholder if present
    const sName = result.site_name || "HalDeFiyat";
    Object.keys(result).forEach((k) => {
      const key = k as keyof SiteSettings;
      const value = result[key];
      if (typeof value === "string") {
        (result as Record<keyof SiteSettings, SiteSettings[keyof SiteSettings]>)[key] =
          value.replace(/{{SITE_NAME}}/g, sName) as SiteSettings[keyof SiteSettings];
      }
    });

    // /uploads yollari tarayicida dogrudan API host'una verilmez; Next rewrites ile ayni origin.

    return result;
  } catch {
    return defaults;
  }
}

export interface HomepageData {
  hero: Record<string, unknown> | null;
  sections: Record<string, unknown> | null;
  banners: Record<string, unknown> | null;
}

export interface AboutPageData {
  hero?: {
    title?: string;
    description?: string;
    image_url?: string;
    image_alt?: string;
  };
  intro?: { title?: string; subtitle?: string; content?: string };
  vision?: { title?: string; content?: string };
  mission?: { title?: string; content?: string };
  values?: Array<{ title: string; description: string; icon?: string }>;
  stats?: Array<{ value: string; label: string; description?: string }>;
  timeline?: Array<{ year: string; title: string; description?: string }>;
  activities?: { title?: string; items?: Array<{ title: string; description: string }> };
  feature_panels?: Array<{ title: string; description: string; image_url?: string; image_alt?: string }>;
  memberships?: {
    title?: string;
    items?: Array<{ name: string; logo_url?: string; website_url?: string; description?: string }>;
  };
}

export async function fetchHomepageSettings(locale = "tr"): Promise<HomepageData> {
  try {
    const res = await fetch(
      `${API_V1}/site_settings/homepage?locale=${locale}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return { hero: null, sections: null, banners: null };
    return res.json();
  } catch {
    return { hero: null, sections: null, banners: null };
  }
}

export async function fetchAboutPageData(locale = "tr"): Promise<AboutPageData | null> {
  const fetchLocale = async (targetLocale: string) => {
    const res = await fetch(`${API_V1}/site_settings/about_page?locale=${encodeURIComponent(targetLocale)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const row = await res.json();
    const value = row?.value;
    if (!value) return null;
    return typeof value === "string" ? JSON.parse(value) as AboutPageData : value as AboutPageData;
  };

  try {
    const localized = await fetchLocale(locale);
    if (localized) return localized;
    if (locale !== "tr") return await fetchLocale("tr");
    return null;
  } catch {
    return null;
  }
}

async function fetchSettingValue<T>(key: string, locale = "tr"): Promise<T | null> {
  try {
    const res = await fetch(`${API_V1}/site_settings/${key}?locale=${locale}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const row = await res.json();
    return (row?.value ?? null) as T;
  } catch {
    return null;
  }
}

export async function fetchTrustBadges(locale = "tr") {
  return fetchSettingValue<Array<{ icon: string; label: string; description?: string }>>("trust_badges", locale);
}

export async function fetchPlantingGuide(locale = "tr") {
  return fetchSettingValue<{
    title?: string;
    description?: string;
    seasons?: Array<{ key: string; label: string; months: string; tips: string[] }>;
  }>("planting_guide", locale);
}

export async function fetchNewsletterConfig(locale = "tr") {
  return fetchSettingValue<{
    title?: string;
    description?: string;
    button_label?: string;
    placeholder?: string;
  }>("newsletter_config", locale);
}

export async function fetchHomepageFeaturePanels(locale = "tr") {
  return fetchSettingValue<{
    title?: string;
    subtitle?: string;
    cover_image_url?: string;
    cover_image_alt?: string;
    items?: Array<{
      title: string;
      description?: string;
      image_url?: string;
      image_alt?: string;
    }>;
  }>("homepage_feature_panels", locale);
}

export interface CustomPageData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  summary: string | null;
  featured_image: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AnalyticsConfig {
  ga4Id: string | null;
  gtmId: string | null;
}

export async function fetchAnalyticsConfig(): Promise<AnalyticsConfig> {
  const result: AnalyticsConfig = { ga4Id: null, gtmId: null };
  try {
    const [ga4Res, gtmRes] = await Promise.all([
      fetch(`${API_V1}/site_settings/ga4_measurement_id`, { next: { revalidate: 300 } }),
      fetch(`${API_V1}/site_settings/gtm_container_id`, { next: { revalidate: 300 } }),
    ]);
    if (ga4Res.ok) {
      const row = await ga4Res.json();
      const v = typeof row?.value === "string" ? row.value.trim() : "";
      if (v) result.ga4Id = v;
    }
    if (gtmRes.ok) {
      const row = await gtmRes.json();
      const v = typeof row?.value === "string" ? row.value.trim() : "";
      if (v) result.gtmId = v;
    }
  } catch { /* analytics fetch failure is non-critical */ }
  return result;
}

export async function fetchCustomPageBySlug(slug: string, locale = "tr"): Promise<CustomPageData | null> {
  try {
    const res = await fetch(`${API_V1}/custom-pages/by-slug/${slug}?locale=${locale}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
