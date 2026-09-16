import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatOgDate } from "@/lib/og-date";
import { loadOgBrandAssets, OgBackground, OgBrand } from "@/lib/og-brand";

// DİNAMİK OG (route handler — i18n bağımsız), /og/urun/[slug] pattern'inin hal
// replikası. URL: /og/hal/[slug]. Kapak, hal sayfasının satış argümanını taşır:
// şehir + o günün gerçek fiyatlarından üç örnek.

export const revalidate = 3600;
const size = { width: 1200, height: 630 };

const API: string = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8091";
const BRAND = "#6FBD0F";
const INK = "#0A0E1A";

type Props = { params: Promise<{ slug: string }> };

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

type MarketLite = { slug: string; name?: string; cityName?: string };
type PriceLite = { productName?: string; avgPrice?: number | string; unit?: string; recordedDate?: string };

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function formatTry(value: number): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  const [markets, prices, font, brandAssets] = await Promise.all([
    fetchJson<{ items?: MarketLite[] }>("/api/v1/markets"),
    fetchJson<{ items?: PriceLite[] }>(`/api/v1/prices?market=${encodeURIComponent(slug)}&range=1d&limit=12`),
    loadFont(),
    loadOgBrandAssets(),
  ]);

  const market = markets?.items?.find((item) => item.slug === slug) ?? null;
  const cityName = market?.cityName ?? "";
  const heading = cityName ? `${cityName} Hal Fiyatları` : "Hal Fiyatları";
  const rows = (prices?.items ?? [])
    .filter((row) => Number(row.avgPrice) > 0 && Boolean(row.productName))
    .slice(0, 3);
  const dataDate = formatOgDate(rows[0]?.recordedDate);

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

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 14 }}>
          <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>Toptancı Hali · Günlük Liste</div>
          <div style={{ fontSize: heading.length > 26 ? 66 : 80, fontWeight: 800, lineHeight: 1.05 }}>{heading}</div>
          {rows.length > 0 && (
            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              {rows.map((row) => (
                <div
                  key={row.productName}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    padding: "14px 22px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <div style={{ fontSize: 24, color: "#cdd7e6" }}>{row.productName}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: BRAND }}>
                    {formatTry(Number(row.avgPrice))} TL/{row.unit || "kg"}
                  </div>
                </div>
              ))}
            </div>
          )}
          {dataDate && <div style={{ fontSize: 28, color: "#9fb0c8", display: "flex" }}>{dataDate}</div>}
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
