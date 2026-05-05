import type { MetadataRoute } from "next";

/**
 * PWA manifest.
 *
 * İkonlar `src/app/icon.tsx` (ImageResponse) ile `/icon` üzerinden üretilir;
 * eksik public PNG yüzünden 404 oluşmaz.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HaldeFiyat — Türkiye Hal Fiyatları",
    short_name: "HaldeFiyat",
    description:
      "Türkiye'nin 81 ilindeki hal fiyatlarını anlık takip edin.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0e1a",
    theme_color: "#84f04c",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png" },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Güncel Fiyatlar",
        url: "/fiyatlar",
        description: "Tüm hal fiyatlarına bak",
      },
      {
        name: "Favorilerim",
        url: "/favoriler",
        description: "Favori ürünlerimi gör",
      },
    ],
    categories: ["food", "utilities"],
    lang: "tr",
    dir: "ltr",
  };
}
