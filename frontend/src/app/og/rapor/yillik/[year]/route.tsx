import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const revalidate = 86400;

const IMAGE_SIZES = {
  "1x1": { width: 1200, height: 1200 },
  "4x3": { width: 1200, height: 900 },
  "16x9": { width: 1200, height: 675 },
} as const;

const BRAND = "#6FBD0F";
const INK = "#0A0E1A";

type Props = { params: Promise<{ year: string }> };

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buffer = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch {
    return null;
  }
}

export async function GET(req: Request, { params }: Props) {
  const { year } = await params;
  const ratio = new URL(req.url).searchParams.get("ratio");
  const size = IMAGE_SIZES[ratio === "1x1" || ratio === "4x3" ? ratio : "16x9"];
  const font = await loadFont();
  const reportYear = /^\d{4}$/.test(year) ? year : "Yıllık";

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

        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 16 }}>
          <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>
            Türkiye Toptancı Hal Verileri
          </div>
          <div style={{ fontSize: 108, fontWeight: 800, lineHeight: 1 }}>
            {reportYear}
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.08 }}>
            Hal Fiyatları Yıllık Raporu
          </div>
          <div style={{ fontSize: 27, color: "#9fb0c8", display: "flex" }}>
            Ürün hareketleri · sezon trendleri · şehir karşılaştırmaları
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
          <div>Resmi belediye + HKS verileri</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }] : [],
    },
  );
}
