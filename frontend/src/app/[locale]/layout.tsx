import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { appLocales, type AppLocale } from "@/i18n/routing";

export function generateStaticParams() {
  return appLocales.map((locale) => ({ locale }));
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com"
).replace(/\/$/, "");

/**
 * Locale-level metadata defaults.
 *
 * NEDEN: Root layout.tsx SEO'yu DB'den cekiyor; burada statik fallback + OG
 * + keywords tanimi veriyoruz. Next.js metadata merge dinamik oldugu icin
 * sayfa bazli `generateMetadata` bunlarin uzerine yazabilir.
 */
export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "HaldeFiyat — Türkiye Hal Fiyatları",
      template: "%s | HaldeFiyat",
    },
    description:
      "Türkiye'nin 81 ilindeki hal fiyatlarını anlık takip edin. İstanbul, Ankara, İzmir ve daha fazlası.",
    keywords: [
      "hal fiyatları",
      "sebze fiyatları",
      "meyve fiyatları",
      "İstanbul hal",
      "türkiye hal fiyatları",
    ],
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: "HaldeFiyat",
      title: "HaldeFiyat — Türkiye Hal Fiyatları",
      description:
        "Türkiye'nin 81 ilindeki hal fiyatlarını anlık takip edin. Şehir, kategori ve tarih aralığı bazında filtreleyin.",
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: "HaldeFiyat — Türkiye Hal Fiyatları",
      description:
        "Türkiye'nin 81 ilindeki hal fiyatlarını anlık takip edin.",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!appLocales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  return children;
}
