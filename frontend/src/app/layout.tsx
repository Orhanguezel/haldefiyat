export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";
import { Outfit, IBM_Plex_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale } from "@/i18n/routing";
import { fetchSiteSettings, fetchAnalyticsConfig } from "@/lib/site-settings";
import Analytics, { GtmNoscript } from "@/components/seo/Analytics";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { OneSignalProvider } from "@/components/providers/OneSignalProvider";
import { FavoriteSyncManager } from "@/components/providers/FavoriteSyncManager";
import { ToastProvider } from "@/components/providers/ToastProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033").replace(/\/$/, "");
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "");
const API_V1 = `${API_URL}/api/v1`;
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "HalDeFiyat";

async function fetchGlobalSeo(locale: string) {
  try {
    const [seoRes, metaRes] = await Promise.all([
      fetch(`${API_V1}/site_settings/site_seo?locale=${encodeURIComponent(locale)}`, { next: { revalidate: 300 } }),
      fetch(`${API_V1}/site_settings/site_meta_default?locale=${encodeURIComponent(locale)}`, { next: { revalidate: 300 } }),
    ]);
    const seo = seoRes.ok ? ((await seoRes.json())?.value ?? null) : null;
    const meta = metaRes.ok ? ((await metaRes.json())?.value ?? null) : null;
    return { seo, meta };
  } catch {
    return { seo: null, meta: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = defaultLocale;
  const [branding, { seo, meta }] = await Promise.all([
    fetchSiteSettings(locale),
    fetchGlobalSeo(locale),
  ]);

  const siteName = branding.site_name || seo?.site_name || SITE_NAME;
  const rawTemplate = seo?.title_template;
  const titleTemplate = rawTemplate
    ? rawTemplate.replace(/\{\{title\}\}/gi, "%s").replace(/\{\{SITE_NAME\}\}/gi, siteName)
    : (siteName ? `%s | ${siteName}` : "%s");
  const titleDefault = meta?.title || seo?.title_default || siteName;
  const description = meta?.description || seo?.description || branding.site_description || "Turkiye hal fiyatlari — gunluk, gercek zamanli";
  const keywords = meta?.keywords
    ? meta.keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
    : ["hal fiyatlari", "sebze fiyatlari", "meyve fiyatlari", "gunluk hal fiyatlari"];

  const ogImages = seo?.open_graph?.images?.length
    ? seo.open_graph.images.map((img: string) => img.startsWith("/") ? `${SITE_URL}${img}` : img)
    : branding.site_logo
      ? [branding.site_logo]
      : [`${SITE_URL}/brand-logo.png`];

  return {
    title: { default: titleDefault, template: titleTemplate },
    description,
    keywords,
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: branding.site_favicon || "/favicon.png",
      shortcut: branding.site_favicon || "/favicon.png",
      apple: branding.site_apple_touch || branding.site_logo || "/apple-touch-icon.png",
    },
    openGraph: {
      siteName,
      type: "website",
      locale: "tr_TR",
      url: SITE_URL,
      ...(ogImages.length > 0 && { images: ogImages }),
    },
    twitter: { card: "summary_large_image" },
  };
}

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export const viewport: Viewport = {
  themeColor: "#84f04c",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [, analytics] = await Promise.all([
    fetchSiteSettings(defaultLocale),
    fetchAnalyticsConfig(),
  ]);

  return (
    <html
      lang="tr"
      data-brand="hal-fiyatlari"
      suppressHydrationWarning
      className={`${outfit.variable} ${ibmPlexSans.variable} font-sans`}
    >
      <head>
        <Analytics ga4Id={analytics.ga4Id} gtmId={analytics.gtmId} />
      </head>
      <body suppressHydrationWarning>
        {analytics.gtmId && <GtmNoscript gtmId={analytics.gtmId} />}
        <ThemeProvider>
          <NextIntlClientProvider>
            <AuthSessionProvider>
              <ToastProvider>
                <OneSignalProvider />
                <FavoriteSyncManager />
                {children}
              </ToastProvider>
            </AuthSessionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
