import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "");

interface PriceSitemapItem {
  slug: string;
  updated_at?: string;
}

async function fetchActiveProducts(): Promise<PriceSitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/prices/products?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data.data ?? []).map((p: PriceSitemapItem) => ({
      slug: p.slug,
      updated_at: p.updated_at,
    }));
  } catch {
    return [];
  }
}

async function fetchMarkets(): Promise<PriceSitemapItem[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/markets?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data.data ?? []).map((m: PriceSitemapItem) => ({
      slug: m.slug,
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
    { url: `${SITE_URL}/fiyatlar`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/karsilastirma`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/gizlilik-politikasi`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/urun/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const marketPages: MetadataRoute.Sitemap = markets.map((m) => ({
    url: `${SITE_URL}/hal/${m.slug}`,
    lastModified: m.updated_at ? new Date(m.updated_at) : now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...publicPages, ...productPages, ...marketPages];
}
