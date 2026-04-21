/** @type {import('next').NextConfig} */
const nextConfig = {

  transpilePackages: ['@agro/shared-ui', '@agro/shared-types'],
  typescript: { ignoreBuildErrors: true },
  experimental: {},
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  output: 'standalone',
  basePath: '/admin',

  // ✅ Image optimization config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8088',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'haldefiyat.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.haldefiyat.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.haldefiyat.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ kaldırıyoruz: /admin/dashboard -> /admin/dashboard/default
  async redirects() {
    return [
      // İstersen eski linkleri yakalamak için tersine redirect bırakabilirsin:
      // { source: '/admin/dashboard/default', destination: '/admin/dashboard', permanent: false },
    ];
  },

  async rewrites() {
    const fromApiUrl = (() => {
      const raw =
        process.env.PANEL_API_URL ||
        process.env.NEXT_PUBLIC_PANEL_API_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        '';
      const val = String(raw || '').trim().replace(/\/+$/, '');
      if (!val) return '';
      return val.endsWith('/api') ? val.slice(0, -4) : val;
    })();

    const base = fromApiUrl || 'http://localhost:8088';

    return [
      {
        source: '/api/:path*',
        destination: `${base}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${base}/uploads/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${base}/api/storage/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
  },
};

export default nextConfig;
