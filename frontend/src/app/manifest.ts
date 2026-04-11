import type { MetadataRoute } from "next";

/**
 * PWA manifest.
 *
 * NEDEN static TS: Runtime fetch gerektirmez, Next.js build sirasinda
 * /manifest.webmanifest olarak yayinlar. Ikon dosyalari public/icons/'ta
 * bulunmali; bunlar icin ayri generate script'i var.
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
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
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
