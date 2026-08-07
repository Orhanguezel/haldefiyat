import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadOgBrandAssets, OgBackground, OgBrand } from "@/lib/og-brand";

export const revalidate = 86400;

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buffer = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch {
    return null;
  }
}

export async function GET() {
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
          background: "#0A0E1A",
          color: "#fff",
          padding: 72,
          fontFamily: font ? "Outfit" : "sans-serif",
        }}
      >
        <OgBackground src={brandAssets.background} />
        <OgBrand logo={brandAssets.logo} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", maxWidth: 930, gap: 18 }}>
          <div style={{ fontSize: 30, color: "#8BD32A", fontWeight: 800 }}>Türkiye’nin Hal Fiyatları Platformu</div>
          <div style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.04 }}>Piyasanın nabzı, verinin gücü.</div>
          <div style={{ display: "flex", fontSize: 28, color: "#c6d1df" }}>
            Güncel fiyatlar · HalDeFiyat Endeksi · Haftalık piyasa analizleri
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 38, borderTop: "2px solid rgba(255,255,255,.16)", paddingTop: 22, fontSize: 25, color: "#d9e1eb" }}>
          <div>haldefiyat.com</div>
          <div>Resmi belediye + HKS verileri</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: font ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }] : [],
    },
  );
}
