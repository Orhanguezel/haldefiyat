import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// KANONİK DİNAMİK OG REFERANSI — Codex bu pattern'i hal/[slug] ve
// analiz/[slug] segmentlerine birebir replike eder. Marka şablonu
// (renk/oran/tipografi) Antigravity checklist'iyle senkron tutulur.

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HalDeFiyat — Güncel Hal Fiyatı";

const API: string =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8091";

const BRAND = "#6FBD0F"; // --brand rgb(111,189,15)
const INK = "#0A0E1A";

type Props = { params: Promise<{ slug: string; locale: string }> };

async function loadFont(): Promise<ArrayBuffer | null> {
  // Bundled Outfit-800 (Antigravity teslimi) — ağ bağımsız, Türkçe (Latin Ext)
  // glyph güvenli. Standalone build'de public/ server dizinine sync edilir.
  try {
    const buf = await readFile(
      join(process.cwd(), "public", "fonts", "Outfit-800.ttf"),
    );
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

async function fetchProduct(slug: string) {
  try {
    const res = await fetch(`${API}/api/v1/prices/products?limit=2000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return items.find((p: { slug: string }) => p.slug === slug) ?? null;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: Props) {
  const { slug } = await params;
  const [product, font] = await Promise.all([fetchProduct(slug), loadFont()]);
  const name: string = product?.nameTr ?? "Hal Fiyatı";
  const category: string = product?.categorySlug ?? "sebze-meyve";
  const today = new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${INK} 0%, #11203a 60%, ${INK} 100%)`,
          color: "#fff",
          padding: 72,
          fontFamily: font ? "Outfit" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: BRAND,
              color: INK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div style={{ fontSize: 34, fontWeight: 800 }}>HalDeFiyat</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>
            Güncel Hal Fiyatı
          </div>
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </div>
          <div style={{ fontSize: 28, color: "#9fb0c8" }}>
            {category} · 81 ilde günlük fiyat · {today}
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
      fonts: font
        ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }]
        : [],
    },
  );
}
