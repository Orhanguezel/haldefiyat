export const revalidate = 300;

import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "@fontsource-variable/ibm-plex-sans/wght.css";
import { NextIntlClientProvider } from "next-intl";
import { Suspense } from "react";
import { defaultLocale } from "@/i18n/routing";
import { fetchSiteSettings, fetchAnalyticsConfig } from "@/lib/site-settings";
import Analytics, { GtmNoscript } from "@/components/seo/Analytics";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { OneSignalProvider } from "@/components/providers/OneSignalProvider";
import { FavoriteSyncManager } from "@/components/providers/FavoriteSyncManager";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AttributionProvider } from "@/components/providers/AttributionProvider";
import { CookieConsentBanner } from "@/components/providers/CookieConsentBanner";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";
import { PageviewTracker } from "@/components/providers/PageviewTracker";
import "./globals.css";

const outfit = localFont({
  src: "../../public/fonts/Outfit-800.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "800",
  preload: true,
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
    : [`${SITE_URL}/og/default`];

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
import WebVitals from "@/components/analytics/WebVitals";

export const viewport: Viewport = {
  // Marka renkleri logodan olculdu (logohaldefiyat_light.png piksel sayimi):
  // turuncu #FE7107 (baskin isaret rengi) + lacivert #01142A (yazi rengi).
  // Onceki #10b981/#0c5e3a zumrut cifti NE logoyla NE de globals.css'teki
  // --brand tonuyla (hsl 157 85% 20%) eslesiyordu — hicbir marka kaynagi yoktu.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FE7107" },
    { media: "(prefers-color-scheme: dark)", color: "#01142A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      className={`${outfit.variable} font-sans`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Tema-dinamik favicon: SVG icinde prefers-color-scheme ile acik/koyu
            mark degisir (kaynak: logohaldefiyat_light + _dark_theme). PNG/ICO
            fallback'lar metadata.icons'tan (site_settings) gelmeye devam eder. */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HaldeFiyat" />
        <Analytics ga4Id={analytics.ga4Id} gtmId={analytics.gtmId} adsConversionId={analytics.adsConversionId} />
      </head>
      <body suppressHydrationWarning>
        {analytics.gtmId && <GtmNoscript gtmId={analytics.gtmId} />}
        <WebVitals />
        <ThemeProvider>
          <NextIntlClientProvider>
            <AuthSessionProvider>
              <ToastProvider>
                <OneSignalProvider />
                <AttributionProvider />
                <FavoriteSyncManager />
                <ServiceWorkerProvider />
                <Suspense fallback={null}>
                  <PageviewTracker />
                </Suspense>
                {children}
                <CookieConsentBanner />
              </ToastProvider>
            </AuthSessionProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
