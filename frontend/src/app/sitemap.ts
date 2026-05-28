export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getProductImage } from "@/lib/product-images";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
// SSR'da BACKEND_URL (internal) kullan; yoksa NEXT_PUBLIC_API_URL'ye düş
const API_URL = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8088"
).replace(/\/$/, "");

const FETCH_TIMEOUT = 10_000;

interface PriceSitemapItem {
  slug: string;
  nameTr?: string;
  updatedAt?: string;
  updated_at?: string;
}

async function fetchActiveProducts(): Promise<PriceSitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/prices/products?seoIndex=true`, {
      cache: "no-store",
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
      cache: "no-store",
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, markets] = await Promise.all([fetchActiveProducts(), fetchMarkets()]);
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
    { url: `${SITE_URL}/karsilastirma`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
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

  return [...publicPages, ...productPages, ...marketPages];
}
