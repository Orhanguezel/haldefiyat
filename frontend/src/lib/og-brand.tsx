import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function imageDataUri(path: string, mime: "image/png" | "image/jpeg"): Promise<string | null> {
  try {
    const data = await readFile(join(process.cwd(), "public", path));
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function loadOgBrandAssets() {
  const [logo, background] = await Promise.all([
    imageDataUri("logohaldefiyat_dark_theme.png", "image/png"),
    imageDataUri("images/og/market-intelligence-bg-v1.jpg", "image/jpeg"),
  ]);
  return { logo, background };
}

export function OgBackground({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(90deg, rgba(10,14,26,.42) 0%, rgba(10,14,26,.88) 32%, rgba(10,14,26,.84) 72%, rgba(10,14,26,.50) 100%)",
        }}
      />
    </div>
  );
}

export function OgBrand({ logo }: { logo: string | null }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: 310,
        height: 88,
        padding: "12px 20px",
        borderRadius: 18,
        background: "rgba(10,14,26,.78)",
        border: "1px solid rgba(255,255,255,.14)",
      }}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="HalDeFiyat" width={270} height={64} style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: "#fff" }}>HalDeFiyat</div>
      )}
    </div>
  );
}
