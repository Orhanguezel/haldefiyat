export { cn } from "@agro/shared-ui/public/lib/cn";

/**
 * Sürücü adını gizler: "Ahmet Hakan" → "A.H."
 */
export function maskName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() + ".")
    .join("");
}

/**
 * Tarih formatlar: "2026-03-15" → "15 Mar 2026"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * KG aralığını okuma dostu stringe çevirir
 */
export function formatKg(min: number, max: number): string {
  if (min === max) return `${min} kg`;
  return `${min}–${max} kg`;
}

/**
 * Backend görsel URL'sini frontend için çözümler.
 * /uploads/... — Next.js `next.config` rewrites ile ayni origin uzerinden backend'e proxy (or. :3033 -> :8088).
 * Dogrudan NEXT_PUBLIC_API_URL kullanmak tarayicida :8088'e baglanir; backend kapaliyken ERR_CONNECTION_REFUSED verir.
 * http(s):// veya /assets/ degismez.
 */
export function resolveImageUrl(url: string | null | undefined, fallback = "/assets/images/noImage.png"): string {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return fallback;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/assets/")) return trimmed;
  if (trimmed.startsWith("/uploads/")) return trimmed;
  return trimmed.startsWith("/") ? trimmed : fallback;
}

const SITE_ORIGIN = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");

/** JSON-LD / Open Graph icin mutlak URL (site origin + path). */
export function absolutePublicAssetUrl(path: string | null | undefined): string | undefined {
  const p = typeof path === "string" ? path.trim() : "";
  if (!p) return undefined;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return p.startsWith("/") ? `${SITE_ORIGIN}${p}` : `${SITE_ORIGIN}/${p}`;
}
