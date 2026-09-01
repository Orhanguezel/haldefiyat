import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

function apiRemotePattern() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return [];

  try {
    const parsed = new URL(raw);
    return [
      {
        protocol: parsed.protocol.replace(":", "") as "http" | "https",
        hostname: parsed.hostname,
        port: parsed.port || undefined,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Canlı ISR cache'i ile deploy build çıktısını ayırmak için release distDir desteği.
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  experimental: {
    // Router cache (client-side) TTL for force-dynamic pages.
    // Default is 30s — prefetched empty payloads would be served for 30s.
    // Setting to 0 ensures every navigation makes a fresh server request.
    staleTimes: { dynamic: 0 },
  },
  transpilePackages: ["@agro/shared-ui"],
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  // Public frontend kaynak kodu GitHub'da; browser source map'leri production
  // hata ayıklama ve Lighthouse Best Practices doğrulaması için yayımlanabilir.
  // Server/env değerleri client bundle'a dahil edilmediği için map'e de girmez.
  productionBrowserSourceMaps: true,
  turbopack: {
    root: path.resolve(process.cwd(), "../../.."),
  },
  images: {
    // `unoptimized: true` ilk commit'ten beri duruyordu, gerekcesi yazili
    // degil ve bu kurulumda gecerli degil: `output: "standalone"` ile Node
    // sunucusu calisiyor ve sharp (0.33.5) monorepo'da kurulu. Kapali oldugu
    // surece her urun fotografi HAM dosya olarak iniyordu — PSI mobil olcumu
    // (2026-09-01) hero'daki 96px kavun gorseli icin 795x795 / 235 KB, tek
    // basina 231 KB israf raporladi; footer logosu 137 KB. Acildiginda ayni
    // gorseller ~5-10 KB webp'e dusuyor.
    formats: ["image/webp"],
    // AVIF daha kucuk ama kutu bellek olarak dar (bkz. deploy OOM gecmisi);
    // webp kazancin buyuk kismini cok daha ucuza veriyor.
    minimumCacheTTL: 2_592_000,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.halfiyatlari.com" },
      ...apiRemotePattern(),
    ],
  },
  serverExternalPackages: [],
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async rewrites() {
    const apiUrl = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/:authPage(giris|kayit)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
      {
        source: "/:locale/:authPage(giris|kayit)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
});

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  telemetry: false,
});
