import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadOgBrandAssets, OgBackground, OgBrand } from "@/lib/og-brand";

const BRAND = "#6FBD0F";
const INK = "#0A0E1A";

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "fonts", "Outfit-800.ttf"));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
}

export async function renderPageOg(input: {
  kicker: string;
  title: string;
  subtitle?: string;
  chips?: string[];
}) {
  const [font, brandAssets] = await Promise.all([loadFont(), loadOgBrandAssets()]);
  const chips = (input.chips ?? []).filter(Boolean).slice(0, 3);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", flexDirection: "column", background: `linear-gradient(135deg, ${INK} 0%, #11203a 60%, ${INK} 100%)`, color: "#fff", padding: 72, fontFamily: font ? "Outfit" : "sans-serif" }}>
      <OgBackground src={brandAssets.background} />
      <OgBrand logo={brandAssets.logo} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", gap: 14 }}>
        <div style={{ display: "flex", fontSize: 30, color: BRAND, fontWeight: 700 }}>{input.kicker}</div>
        <div style={{ display: "flex", fontSize: input.title.length > 34 ? 60 : 76, fontWeight: 800, lineHeight: 1.05 }}>{input.title}</div>
        {input.subtitle ? <div style={{ display: "flex", fontSize: 27, color: "#aebdd1" }}>{input.subtitle}</div> : null}
        {chips.length ? <div style={{ display: "flex", gap: 14, marginTop: 8 }}>{chips.map((chip) => <div key={chip} style={{ display: "flex", padding: "12px 18px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", fontSize: 23 }}>{chip}</div>)}</div> : null}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 38, borderTop: "2px solid rgba(255,255,255,0.12)", paddingTop: 22, fontSize: 26, color: "#cdd7e6" }}>
        <div>haldefiyat.com</div><div>Veriye dayalı tarım ve hal piyasası</div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" }, fonts: font ? [{ name: "Outfit", data: font, weight: 800 as const, style: "normal" as const }] : [] },
  );
}
