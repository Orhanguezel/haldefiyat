export const revalidate = 3600;

import type { MetadataRoute } from "next";
import { getProductImage } from "@/lib/product-images";
import { getSonMakaleler } from "@/lib/analiz";
import { fetchAnnualReportYears, fetchAuthors, fetchAutoWeeklyReports } from "@/lib/api";
import { latestSitemapDate, validSitemapDate } from "@/lib/sitemap-date";
import { getMarketEditorial } from "@/lib/market-content";
import { PIYASA_PAGES } from "@/lib/piyasa";
import { REHBER_PAGES } from "@/lib/rehber";

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
  name?: string;
  cityName?: string;
  regionSlug?: string | null;
  canonicalSlug?: string | null;
  seoIndex?: number | boolean;
  updatedAt?: string;
  updated_at?: string;
  latestRecordedDate?: string | null;
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

interface ActiveRedirect {
  sourcePath: string;
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
      canonicalSlug: p.canonicalSlug,
      seoIndex: p.seoIndex,
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
      name: m.name,
      cityName: m.cityName,
      regionSlug: m.regionSlug,
      seoIndex: m.seoIndex,
      latestRecordedDate: m.latestRecordedDate,
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

async function fetchActiveRedirects(): Promise<ActiveRedirect[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/redirects`, {
      next: { revalidate },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []) as ActiveRedirect[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, markets, firms, firmCities, firmTypes, activeRedirects] = await Promise.all([
    fetchActiveProducts(),
    fetchMarkets(),
    fetchFirms(),
    fetchFirmCities(),
    fetchFirmTypes(),
    fetchActiveRedirects(),
  ]);
  const redirectSourcePaths = new Set(activeRedirects.map((redirect) => redirect.sourcePath));
  const priceLastModified = latestSitemapDate([
    ...products.map((item) => item.updatedAt ?? item.updated_at),
  ]);
  const firmLastModified = latestSitemapDate(
    firms.map((item) => item.lastSeenAt ?? item.updatedAt),
  );

  const publicPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, ...(priceLastModified && { lastModified: priceLastModified }), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/canli-hal-fiyatlari`, ...(priceLastModified && { lastModified: priceLastModified }), changeFrequency: "daily", priority: 0.98 },
    ...Object.keys(PIYASA_PAGES).map((slug) => ({
      url: `${SITE_URL}/piyasa/${slug}`,
      ...(priceLastModified && { lastModified: priceLastModified }),
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
    { url: `${SITE_URL}/rehber`, changeFrequency: "weekly" as const, priority: 0.8 },
    ...Object.keys(REHBER_PAGES).map((slug) => ({
      url: `${SITE_URL}/rehber/${slug}`,
      ...(priceLastModified && { lastModified: priceLastModified }),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/fiyatlar`, ...(priceLastModified && { lastModified: priceLastModified }), changeFrequency: "daily", priority: 0.95 },
    { url: `${SITE_URL}/borsa`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/canli-hayvan-fiyatlari`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/et-fiyatlari`, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/harita`, ...(priceLastModified && { lastModified: priceLastModified }), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/endeks`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/embed`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_URL}/basin`, changeFrequency: "monthly", priority: 0.65 },
    { url: `${SITE_URL}/reklam-ver`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/hal`, ...(priceLastModified && { lastModified: priceLastModified }), changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/firmalar`, ...(firmLastModified && { lastModified: firmLastModified }), changeFrequency: "weekly", priority: 0.78 },
    { url: `${SITE_URL}/karsilastirma`, ...(priceLastModified && { lastModified: priceLastModified }), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/analiz`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_URL}/metodoloji`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/editoryal-politika`, changeFrequency: "monthly", priority: 0.45 },
    { url: `${SITE_URL}/duzeltme-politikasi`, changeFrequency: "monthly", priority: 0.45 },
    { url: `${SITE_URL}/veri-kaynagi-politikasi`, changeFrequency: "monthly", priority: 0.45 },
    { url: `${SITE_URL}/sahiplik-finansman`, changeFrequency: "monthly", priority: 0.45 },
    { url: `${SITE_URL}/hakkimizda`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/iletisim`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/gizlilik-politikasi`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kullanim-kosullari`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kvkk`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products
    .filter((product) => !product.canonicalSlug)
    .map((p) => {
    const imgPath = getProductImage(p.slug);
    const lastModified = validSitemapDate(p.updatedAt ?? p.updated_at);
    return {
      url: `${SITE_URL}/urun/${p.slug}`,
      ...(lastModified && { lastModified }),
      changeFrequency: "daily" as const,
      priority: 0.8,
      ...(imgPath && {
        images: [`${SITE_URL}${imgPath}`],
      }),
    };
    });

  const marketPages: MetadataRoute.Sitemap = markets
    .filter((market) => {
      const editorial = getMarketEditorial({
        slug: market.slug,
        name: market.name ?? market.slug,
        cityName: market.cityName ?? "",
        regionSlug: market.regionSlug,
      });
      return (market.seoIndex === true || market.seoIndex === 1)
        && editorial.source !== "template";
    })
    .map((m) => {
      const lastModified = validSitemapDate(m.latestRecordedDate) ?? priceLastModified;
      return {
        url: `${SITE_URL}/hal/${m.slug}`,
        ...(lastModified && { lastModified }),
        changeFrequency: "daily" as const,
        priority: 0.7,
      };
    });

  const firmPages: MetadataRoute.Sitemap = firms.map((firm) => {
    const lastModified = validSitemapDate(firm.lastSeenAt ?? firm.updatedAt);
    return {
      url: `${SITE_URL}/firma/${firm.slug}`,
      ...(lastModified && { lastModified }),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    };
  });

  const firmCityHubs: MetadataRoute.Sitemap = firmCities
    .filter((city) => city.citySlug && city.total >= 5)
    .map((city) => ({
      url: `${SITE_URL}/firmalar/${city.citySlug}`,
      ...(firmLastModified && { lastModified: firmLastModified }),
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
      ...(firmLastModified && { lastModified: firmLastModified }),
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
        ...(firmLastModified && { lastModified: firmLastModified }),
        changeFrequency: "weekly" as const,
        priority: slug === "komisyoncu" ? 0.73 : 0.66,
      }))
  ));

  // Statik makaleler (lib/analiz) + DB'den gelen otomatik haftalik raporlar.
  // Haftalik raporlar sadece statik diziden uretildigi icin sitemap'e HIC girmiyordu —
  // haziran/temmuz raporlarinin tamami arama motorlarina sitemap uzerinden gorunmuyordu.
  const [autoReports, annualReportYears, authors] = await Promise.all([
    fetchAutoWeeklyReports(200),
    fetchAnnualReportYears(),
    fetchAuthors(),
  ]);
  const staticArticles = getSonMakaleler(100);
  const staticSlugs = new Set(staticArticles.map((m) => m.slug));
  const analysisLastModified = latestSitemapDate([
    ...staticArticles.map((article) => article.updatedAt ?? article.tarih),
    ...autoReports.map((article) => article.updatedAt ?? article.reviewedAt ?? article.tarih),
  ]);
  const analysisIndex = publicPages.find((item) => item.url === `${SITE_URL}/analiz`);
  if (analysisIndex && analysisLastModified) {
    analysisIndex.lastModified = analysisLastModified;
  }

  const analizPages: MetadataRoute.Sitemap = [
    ...staticArticles.map((m) => {
      const lastModified = validSitemapDate(m.updatedAt ?? m.tarih);
      return {
        url: `${SITE_URL}/analiz/${m.slug}`,
        ...(lastModified && { lastModified }),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    }),
    ...autoReports
      .filter((r) => !staticSlugs.has(r.slug))
      .map((r) => {
        const lastModified = validSitemapDate(r.updatedAt ?? r.reviewedAt ?? r.tarih);
        return {
          url: `${SITE_URL}/analiz/${r.slug}`,
          ...(lastModified && { lastModified }),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        };
      }),
  ];

  const annualReportPages: MetadataRoute.Sitemap = annualReportYears.map((reportYear) => {
    const lastModified = validSitemapDate(reportYear.newestDate);
    return {
      url: `${SITE_URL}/rapor/yillik/${reportYear.year}`,
      ...(lastModified && { lastModified }),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    };
  });

  const authorLatestArticle = new Map<string, string>();
  for (const article of [...staticArticles, ...autoReports]) {
    const authorSlug = article.authorProfile?.slug;
    if (!authorSlug) continue;
    const previous = authorLatestArticle.get(authorSlug);
    if (!previous || article.tarih > previous) {
      authorLatestArticle.set(authorSlug, article.tarih);
    }
  }
  const authorPages: MetadataRoute.Sitemap = authors
    .filter((author) => authorLatestArticle.has(author.slug))
    .map((author) => {
      const lastModified = validSitemapDate(authorLatestArticle.get(author.slug));
      return {
        url: `${SITE_URL}/yazar/${author.slug}`,
        ...(lastModified && { lastModified }),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      };
    });

  return [
    ...publicPages,
    ...productPages,
    ...marketPages,
    ...firmCityHubs,
    ...firmTypeHubs,
    ...firmComboHubs,
    ...firmPages,
    ...analizPages,
    ...annualReportPages,
    ...authorPages,
  ].filter((item) => !redirectSourcePaths.has(new URL(item.url).pathname));
}
