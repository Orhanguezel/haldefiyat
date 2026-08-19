import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
const AI_PUBLIC_API_PATHS = [
  "/api/v1/prices",
  "/api/v1/index",
  "/api/v1/sources/status",
  "/api/docs/json",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/*?_rsc="],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "ClaudeBot", "PerplexityBot", "Google-Extended"],
        allow: ["/", ...AI_PUBLIC_API_PATHS],
        // export CSV anonim kotaya (10/gün) çarpıp 429 üretiyor — botlara kapalı,
        // JSON fiyat endpoint'leri (üstteki allow) açık kalır.
        disallow: ["/api/", "/_next/", "/api/v1/prices/export"],
      },
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
      {
        userAgent: "PetalBot",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        allow: ["/", ...AI_PUBLIC_API_PATHS],
        disallow: ["/api/", "/_next/", "/api/v1/prices/export"],
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
    host: SITE_URL,
  };
}
