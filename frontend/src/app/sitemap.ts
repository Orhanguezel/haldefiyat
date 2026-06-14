export const revalidate = 3600;

import type { MetadataRoute } from "next";
import { getProductImage } from "@/lib/product-images";
import { getSonMakaleler } from "@/lib/analiz";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
// SSR'da BACKEND_URL (internal) kullan; yoksa NEXT_PUBLIC_API_URL'ye düş
const API_URL = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8088"
).replace(/\/$/, "");

const FETCH_TIMEOUT = 10_000;
const FIRM_COMBO_CITY_SLUGS = new Set(["mersin", "antalya", "adana"]);
const MIN_FIRM_COMBO_TOTAL = 10;

interface PriceSitemapItem {
  slug: string;
  nameTr?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface FirmSitemapItem {
  slug: string;
  updatedAt?: string;
  lastSeenAt?: string;
  name?: string;
  citySlug?: string | null;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  seoIndex?: number | boolean;
}

interface FirmCitySitemapItem {
  citySlug: string;
  cityName?: string;
  total: number;
  byType?: Record<FirmTypeSitemapItem["firmType"], number>;
}

interface FirmTypeSitemapItem {
  firmType: "komisyoncu" | "soguk_hava" | "nakliye" | "zirai_ilac";
  total: number;
}

async function fetchActiveProducts(): Promise<PriceSitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/prices/products?seoIndex=true`, {
      next: { revalidate },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (Array.isArray(data) ? data : data.items ?? data.data ?? []) as PriceSitemapItem[];
    return items.map((p) => ({
      slug: p.slug,
      nameTr: p.nameTr,
      updatedAt: p.updatedAt,
      updated_at: p.updated_at,
    }));
  } catch {
    return [];
  }
}

async function fetchMarkets(): Promise<PriceSitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/prices/markets?seoIndex=true`, {
      next: { revalidate },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = (Array.isArray(data) ? data : data.items ?? data.data ?? []) as PriceSitemapItem[];
    return items.map((m) => ({
      slug: m.slug,
      updatedAt: m.updatedAt,
      updated_at: m.updated_at,
    }));
  } catch {
    return [];
  }
}

async function fetchFirms(): Promise<FirmSitemapItem[]> {
  // Public /firms limit tavanı 200 → tüm firmaları kapsamak için sayfalayarak çek.
  const PAGE = 200;
  const MAX_PAGES = 30; // güvenlik: en fazla 6000 firma
  const all: FirmSitemapItem[] = [];
  try {
    for (let page = 0; page < MAX_PAGES; page++) {
      const offset = page * PAGE;
      const res = await fetch(`${API_URL}/api/v1/firms?limit=${PAGE}&offset=${offset}`, {
        next: { revalidate },
        signal: AbortSignal.timeout(FETCH_TIMEOUT),
      });
      if (!res.ok) break;
      const data = await res.json();
      const items = (Array.isArray(data) ? data : data.items ?? data.data ?? []) as FirmSitemapItem[];
      all.push(...items);
      const total: number | undefined = data?.meta?.total;
      if (items.length < PAGE || (typeof total === "number" && offset + items.length >= total)) break;
    }
    // Firmalar seo_index=1 olana dek sitemap disi; kesif hub'lardan.
    return all.filter((firm) => firm.slug && (firm.seoIndex === true || firm.seoIndex === 1));
  } catch {
    return all.filter((firm) => firm.slug && (firm.seoIndex === true || firm.seoIndex === 1));
  }
}

async function fetchFirmCities(): Promise<FirmCitySitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/firms/cities`, {
      next: { revalidate },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? data.data ?? []) as FirmCitySitemapItem[];
  } catch {
    return [];
  }
}

async function fetchFirmTypes(): Promise<FirmTypeSitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/firms/types`, {
      next: { revalidate },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? data.data ?? []) as FirmTypeSitemapItem[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, markets, firms, firmCities, firmTypes] = await Promise.all([
    fetchActiveProducts(),
    fetchMarkets(),
    fetchFirms(),
    fetchFirmCities(),
    fetchFirmTypes(),
  ]);
  const now = new Date().toISOString().split("T")[0];

  const publicPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/canli-hal-fiyatlari`, lastModified: now, changeFrequency: "daily", priority: 0.98 },
    { url: `${SITE_URL}/fiyatlar`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/harita`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/endeks`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/embed`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/basin`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${SITE_URL}/hal`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/firmalar`, lastModified: now, changeFrequency: "weekly", priority: 0.78 },
    { url: `${SITE_URL}/karsilastirma`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/analiz`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_URL}/metodoloji`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/api-docs`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/gizlilik-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kullanim-kosullari`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kvkk`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => {
    const imgPath = getProductImage(p.slug);
    return {
      url: `${SITE_URL}/urun/${p.slug}`,
      lastModified: (p.updatedAt ?? p.updated_at) ? new Date(p.updatedAt ?? p.updated_at!) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
      ...(imgPath && {
        images: [`${SITE_URL}${imgPath}`],
      }),
    };
  });

  const marketPages: MetadataRoute.Sitemap = markets.map((m) => ({
    url: `${SITE_URL}/hal/${m.slug}`,
    lastModified: (m.updatedAt ?? m.updated_at) ? new Date(m.updatedAt ?? m.updated_at!) : now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const firmPages: MetadataRoute.Sitemap = firms.map((firm) => ({
    url: `${SITE_URL}/firma/${firm.slug}`,
    lastModified: firm.updatedAt || firm.lastSeenAt ? new Date(firm.updatedAt ?? firm.lastSeenAt!) : now,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  const firmCityHubs: MetadataRoute.Sitemap = firmCities
    .filter((city) => city.citySlug && city.total >= 5)
    .map((city) => ({
      url: `${SITE_URL}/firmalar/${city.citySlug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    }));

  const typeSlug: Record<FirmTypeSitemapItem["firmType"], string> = {
    komisyoncu: "komisyoncu",
    soguk_hava: "soguk-hava",
    nakliye: "nakliye",
    zirai_ilac: "zirai-ilac",
  };
  const firmTypeHubs: MetadataRoute.Sitemap = firmTypes
    .filter((type) => type.total > 0)
    .map((type) => ({
      url: `${SITE_URL}/firmalar/${typeSlug[type.firmType]}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: type.firmType === "komisyoncu" ? 0.74 : 0.68,
    }));

  const firmComboHubs: MetadataRoute.Sitemap = firmCities.flatMap((city) => (
    Object.entries(typeSlug)
      .filter(([firmType]) => (
        FIRM_COMBO_CITY_SLUGS.has(city.citySlug) &&
        (city.byType?.[firmType as FirmTypeSitemapItem["firmType"]] ?? 0) >= MIN_FIRM_COMBO_TOTAL
      ))
      .map(([, slug]) => ({
        url: `${SITE_URL}/firmalar/${city.citySlug}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: slug === "komisyoncu" ? 0.73 : 0.66,
      }))
  ));

  const analizPages: MetadataRoute.Sitemap = getSonMakaleler(100).map((m) => ({
    url: `${SITE_URL}/analiz/${m.slug}`,
    lastModified: m.tarih ? new Date(m.tarih) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...publicPages, ...productPages, ...marketPages, ...firmCityHubs, ...firmTypeHubs, ...firmComboHubs, ...firmPages, ...analizPages];
}
