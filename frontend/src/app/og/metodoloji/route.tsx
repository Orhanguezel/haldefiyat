import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadOgBrandAssets, OgBackground, OgBrand } from "@/lib/og-brand";

export const revalidate = 86400;

const IMAGE_SIZES = {
  "1x1": { width: 1200, height: 1200 },
  "4x3": { width: 1200, height: 900 },
  "16x9": { width: 1200, height: 675 },
} as const;

const BRAND = "#6FBD0F";
const INK = "#0A0E1A";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buffer = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const ratio = new URL(req.url).searchParams.get("ratio");
  const size = IMAGE_SIZES[ratio === "1x1" || ratio === "4x3" ? ratio : "16x9"];
  const [font, brandAssets] = await Promise.all([loadFont(), loadOgBrandAssets()]);

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

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 18 }}>
          <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>
            Şeffaflık ve Güvenilirlik
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            Hal Fiyatları Veri Metodolojisi
          </div>
          <div style={{ fontSize: 28, color: "#9fb0c8", display: "flex", maxWidth: 980 }}>
            Resmi kaynaklar · günlük ETL · normalizasyon · veri kalitesi
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
          <div>Türkiye toptancı hal verileri</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }] : [],
    },
  );
}
