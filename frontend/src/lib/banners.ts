// Reklam/banner — server-side fetch. /api/v1/banners?position= aktif banneri döner
// (reklam kapalıysa veya yoksa null). BACKEND_URL runtime'da okunur (lib/api ile aynı).
const API: string = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8091";

export type PublicBanner = {
  id: number;
  position: string;
  type: "image" | "code";
  sourceType?: "custom" | "listing" | "firm" | "code";
  listingId?: number | null;
  firmId?: number | null;
  title: string;
  advertiser: string | null;
  imageUrl: string | null;
  alt: string | null;
  linkUrl: string | null;
  linkTarget: string;
  rel: string;
  code: string | null;
  caption: string | null;
  ctaLabel: string | null;
  creativeTemplate?: "image" | "firm" | "listing" | "sponsorship" | "leaderboard" | "split" | "mpu" | "mobile";
  creativeConfig?: {
    backgroundColor?: string; textColor?: string; accentColor?: string; animation?: boolean;
    logoUrl?: string; backgroundImageUrl?: string; description?: string;
    focalX?: number; focalY?: number; imageFit?: "cover" | "contain";
  } | null;
  device: "all" | "desktop" | "mobile";
  desktopRow?: number;
  desktopColumns?: number;
  listing?: {
    id: number;
    slug: string;
    title: string;
    productName: string;
    citySlug: string | null;
    priceMin: string | number | null;
    priceMax: string | number | null;
    priceUnit: string;
    currency: string;
    imageUrl: string | null;
  };
};

export type BannerContext = {
  page_type?: string;
  city?: string | null;
  district?: string | null;
  product?: string | null;
  category?: string | null;
  market?: string | null;
  firm?: number | string | null;
  listing?: number | string | null;
};

function bannerUrl(path: string, position: string, context: BannerContext = {}) {
  const params = new URLSearchParams({ position });
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null && String(value).trim()) params.set(key, String(value));
  }
  return `${API}/api/v1/${path}?${params.toString()}`;
}

export async function fetchBanner(position: string, context: BannerContext = {}, requestHeaders?: HeadersInit): Promise<PublicBanner | null> {
  try {
    const res = await fetch(bannerUrl("banners", position, context), {
      cache: requestHeaders ? "no-store" : "force-cache",
      headers: requestHeaders,
      ...(requestHeaders ? {} : { next: { revalidate: 120 } }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data ?? null) as PublicBanner | null;
  } catch {
    return null;
  }
}

export async function fetchBanners(position: string, context: BannerContext = {}, requestHeaders?: HeadersInit): Promise<PublicBanner[]> {
  try {
    const res = await fetch(bannerUrl("banners/grid", position, context), {
      cache: requestHeaders ? "no-store" : "force-cache",
      headers: requestHeaders,
      ...(requestHeaders ? {} : { next: { revalidate: 60 } }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data as PublicBanner[] : [];
  } catch {
    return [];
  }
}
