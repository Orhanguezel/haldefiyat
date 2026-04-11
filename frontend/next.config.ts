import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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
  transpilePackages: ["@agro/shared-ui"],
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
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
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
});

export default withNextIntl(nextConfig);
