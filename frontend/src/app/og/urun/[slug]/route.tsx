import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatOgDate } from "@/lib/og-date";
import { loadOgBrandAssets, OgBackground, OgBrand } from "@/lib/og-brand";
import { loadProductPhoto } from "@/lib/og-product-photo";

// KANONİK DİNAMİK OG REFERANSI (route handler — i18n bağımsız).
// URL: /og/urun/[slug]. `/api/` nginx'te Fastify backend'e gittiği için OG
// namespace'i `/og/`; proxy matcher `og/` ile bypass eder. file-convention
// opengraph-image.tsx [locale]/as-needed altında 307 döngüsüne girdiği için
// route handler'a çevrildi. Codex bu pattern'i hal/analiz'e replike eder.

export const revalidate = 3600;
const size = { width: 1200, height: 630 };

const API: string =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8091";

const BRAND = "#6FBD0F"; // --brand rgb(111,189,15)
const INK = "#0A0E1A";

type Props = { params: Promise<{ slug: string }> };

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

type ProductLite = { slug: string; nameTr?: string; displayName?: string; categorySlug?: string; canonicalSlug?: string | null };

/**
 * Urun adi ULKE KATALOGUNDAN okunur, sitemap filtresinden DEGIL.
 *
 * Eski hali `/prices/products/seo-eligible` listesinde ariyordu; o liste
 * `isSeoEligibleProductName` ile adinda parantez olan veya tamami BUYUK HARF
 * olan urunleri eliyor. Katalogda limon "LİMON", domates "DOMATES" olarak
 * kayitli — yani en cok aranan urunlerin HICBIRI listede yok ve hepsi jenerik
 * "Hal Fiyati" kapagina dusuyordu. 16 Eyl 2026 dogrulamasi: /og/urun/limon,
 * /og/urun/domates ve /og/urun/nar birebir ayni md5'i veriyordu.
 */
async function fetchProduct(slug: string): Promise<ProductLite | null> {
  try {
    const res = await fetch(`${API}/api/v1/prices/products?q=${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items: ProductLite[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];
    return items.find((product) => product.slug === slug) ?? null;
  } catch {
    return null;
  }
}

/** Kapak tarihi: urunun gercek son fiyat kaydi. */
async function fetchLatestDate(slug: string): Promise<string | undefined> {
  try {
    const res = await fetch(`${API}/api/v1/prices?product=${encodeURIComponent(slug)}&range=1d&limit=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    return (data?.items ?? [])[0]?.recordedDate;
  } catch {
    return undefined;
  }
}

/** Uzun urun adi (ornegin "Salcalik Domates") 88 punto ile kapaktan tasiyordu. */
function titleFontSize(value: string, hasPhoto: boolean): number {
  const budget = hasPhoto ? 16 : 26;
  if (value.length > budget + 8) return hasPhoto ? 50 : 58;
  if (value.length > budget) return hasPhoto ? 62 : 70;
  return hasPhoto ? 76 : 88;
}

/** Baslikta birim parantezi ("Limon (Kg)") arama diliyle uyusmaz — urun sayfasi da atiyor. */
function cleanName(value: string): string {
  return value.replace(/\s*\((kg|kilogram|koli|kasa|adet|bağ|demet|sandık|çuval|paket)\)\s*$/iu, "").trim() || value;
}

export async function GET(_req: Request, { params }: Props) {
  const { slug } = await params;
  const [product, latestDate, font, brandAssets] = await Promise.all([
    fetchProduct(slug),
    fetchLatestDate(slug),
    loadFont(),
    loadOgBrandAssets(),
  ]);
  const photo = await loadProductPhoto(slug, product?.canonicalSlug);
  const rawName = product?.displayName || product?.nameTr || "";
  const name: string = rawName ? cleanName(rawName) : "Hal Fiyatı";
  const category: string = product?.categorySlug ?? "sebze-meyve";
  const dataDate = formatOgDate(latestDate);

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
          <div
            style={{
              position: "absolute",
              right: 72,
              top: 125,
              width: 380,
              height: 380,
              display: "flex",
              borderRadius: 28,
              overflow: "hidden",
              border: "3px solid rgba(255,255,255,0.18)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="" width={380} height={380} style={{ width: 380, height: 380, objectFit: "cover" }} />
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            gap: 12,
            // Fotograf sagda 380px yer kapliyor; metin sutunu altina girmesin.
            maxWidth: photo ? 640 : undefined,
          }}
        >
          <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>
            Güncel Hal Fiyatı
          </div>
          <div style={{ fontSize: titleFontSize(name, Boolean(photo)), fontWeight: 800, lineHeight: 1.05 }}>
            {name}
          </div>
          <div style={{ fontSize: 28, color: "#9fb0c8", display: "flex" }}>
            {[category, "Türkiye genelinde günlük fiyat", dataDate].filter(Boolean).join(" · ")}
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
        // Kapak gorseli her istekte yeniden uretiliyordu (~680 KB, ~1 sn). Icerik
        // slug'a bagli; tarayici ve ara katman onbellege alsin, arka planda tazelensin.
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
      fonts: font
        ? [{ name: "Outfit", data: font, weight: 800, style: "normal" }]
        : [],
    },
  );
}
