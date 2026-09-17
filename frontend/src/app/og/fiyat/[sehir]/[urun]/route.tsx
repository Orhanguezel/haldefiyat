import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatOgDate } from "@/lib/og-date";
import { loadOgBrandAssets, OgBackground, OgBrand } from "@/lib/og-brand";
import { loadProductPhoto } from "@/lib/og-product-photo";
import { ogFallbackResponse } from "@/lib/og-fallback";

// DİNAMİK OG (route handler — i18n bağımsız), /og/urun/[slug] pattern'inin
// şehir×ürün replikası. URL: /og/fiyat/[sehir]/[urun].
// 16 Eyl 2026 taraması: bu ailenin 149/149 sayfasında og:image yoktu, ama sayfa
// `twitter:card = summary_large_image` bildiriyordu — paylaşım önizlemesi boş
// kutuydu. Kapak, paylaşılan şeyin taşıdığı tek bilgiyi gösterir: güncel fiyat.

export const revalidate = 3600;
const size = { width: 1200, height: 630 };

const API: string = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8091";
const BRAND = "#6FBD0F";
const INK = "#0A0E1A";

type Props = { params: Promise<{ sehir: string; urun: string }> };

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

type CityProductLite = {
  pair?: { cityName?: string; productName?: string; productSlug?: string; unit?: string; marketName?: string };
  latest?: { recordedDate?: string; avgPrice?: number; minPrice?: number; maxPrice?: number } | null;
};

async function fetchPair(sehir: string, urun: string): Promise<CityProductLite | null> {
  try {
    const res = await fetch(
      `${API}/api/v1/prices/city-products/${encodeURIComponent(sehir)}/${encodeURIComponent(urun)}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.item ?? data ?? null) as CityProductLite | null;
  } catch {
    return null;
  }
}

function titleFontSize(value: string, hasPhoto: boolean): number {
  const budget = hasPhoto ? 14 : 22;
  if (value.length > budget + 8) return hasPhoto ? 52 : 62;
  if (value.length > budget) return hasPhoto ? 62 : 74;
  return hasPhoto ? 74 : 88;
}

function formatTry(value: number): string {
  return value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function GET(_req: Request, { params }: Props) {
  const { sehir, urun } = await params;
  try {
    return await renderFiyatOg(sehir, urun);
  } catch {
    // Kapak uretilemezse 502 yerine sade kapak; gerekce og-fallback.tsx'te.
    // Bu rotanin cokusunu 17 Eyl'de GOOGLEBOT tetiklemisti (/og/fiyat/manisa/erik).
    const baslik = (s: string) => s.replace(/-/g, " ").replace(/\b\p{Ll}/gu, (c) => c.toLocaleUpperCase("tr-TR"));
    return ogFallbackResponse(`${baslik(urun)} · ${baslik(sehir)}`, "Şehir bazında günlük hal fiyatı");
  }
}

async function renderFiyatOg(sehir: string, urun: string) {
  const [detail, font, brandAssets] = await Promise.all([fetchPair(sehir, urun), loadFont(), loadOgBrandAssets()]);
  const photo = await loadProductPhoto(detail?.pair?.productSlug ?? urun);

  const cityName = detail?.pair?.cityName ?? "";
  const productName = detail?.pair?.productName ?? "";
  const unit = detail?.pair?.unit ?? "kg";
  const heading = [cityName, productName].filter(Boolean).join(" ") || "Hal Fiyatı";
  const price = typeof detail?.latest?.avgPrice === "number" ? `${formatTry(detail.latest.avgPrice)} TL/${unit}` : null;
  const range =
    typeof detail?.latest?.minPrice === "number" && typeof detail?.latest?.maxPrice === "number"
      ? `${formatTry(detail.latest.minPrice)} – ${formatTry(detail.latest.maxPrice)} TL`
      : null;
  const dataDate = formatOgDate(detail?.latest?.recordedDate);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${INK} 0%, #11203a 60%, ${INK} 100%)`,
          color: "#fff",
          padding: 72,
          fontFamily: font ? "Outfit" : "sans-serif",
        }}
      >
        <OgBackground src={brandAssets.background} />
        <OgBrand logo={brandAssets.logo} />

        {photo && (
          /* Sag yarida tam boy: Google/Twitter kare kirpimi merkezden alir,
             merkez-sag urunle dolar; sol ustteki logo tek basina kalmaz. */
          <div style={{ position: "absolute", right: 0, top: 0, width: 520, height: 630, display: "flex", overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" width={520} height={630} style={{ width: 520, height: 630, objectFit: "cover" }} />
            <div style={{ position: "absolute", left: 0, top: 0, width: 220, height: 630, display: "flex", background: `linear-gradient(90deg, ${INK} 0%, rgba(10,14,26,0) 100%)` }} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 12, maxWidth: photo ? 640 : undefined }}>
          <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>Güncel Hal Fiyatı</div>
          <div style={{ fontSize: titleFontSize(heading, Boolean(photo)), fontWeight: 800, lineHeight: 1.05 }}>{heading}</div>
          {price && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
              <div style={{ fontSize: 64, fontWeight: 800, color: BRAND }}>{price}</div>
              {range && <div style={{ fontSize: 28, color: "#9fb0c8" }}>{range}</div>}
            </div>
          )}
          <div style={{ fontSize: 28, color: "#9fb0c8", display: "flex" }}>
            {[detail?.pair?.marketName, dataDate].filter(Boolean).join(" · ")}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 40,
            borderTop: "2px solid rgba(255,255,255,0.12)",
            paddingTop: 24,
            fontSize: 26,
            color: "#cdd7e6",
          }}
        >
          <div>haldefiyat.com</div>
          <div>Resmi belediye verileri</div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
      fonts: font ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }] : [],
    },
  );
}
