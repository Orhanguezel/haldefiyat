// Reklam/banner — server-side fetch. /api/v1/banners?position= aktif banneri döner
// (reklam kapalıysa veya yoksa null). BACKEND_URL runtime'da okunur (lib/api ile aynı).
const API: string = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8091";

export type PublicBanner = {
  id: number;
  position: string;
  type: "image" | "code";
  title: string;
  advertiser: string | null;
  imageUrl: string | null;
  alt: string | null;
  linkUrl: string | null;
  linkTarget: string;
  rel: string;
  code: string | null;
  device: "all" | "desktop" | "mobile";
};

export async function fetchBanner(position: string): Promise<PublicBanner | null> {
  try {
    const res = await fetch(`${API}/api/v1/banners?position=${encodeURIComponent(position)}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.data ?? null) as PublicBanner | null;
  } catch {
    return null;
  }
}
