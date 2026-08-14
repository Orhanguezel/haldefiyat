export const revalidate = 300;

import JsonLd from "@/components/seo/JsonLd";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AlertModalProvider from "@/components/ui/AlertModalProvider";
import { fetchSiteSettings } from "@/lib/site-settings";
import { fetchPricesOverview } from "@/lib/api";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import PublicPopups from "@/components/popups/PublicPopups";
import BannerSlot from "@/components/ads/BannerSlot";
import type { AppLocale } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3033";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locale as AppLocale;
  const [settings, overview] = await Promise.all([
    fetchSiteSettings(currentLocale),
    fetchPricesOverview(),
  ]);

  // Telegram ve WhatsApp kanali da sameAs'e girer: ikisi de markanin dogrulanabilir
  // profilleri ve varlik taninmasinda (entity recognition) sayiliyor.
  const sameAs = [
    settings.social_facebook,
    settings.social_instagram,
    settings.social_twitter,
    settings.social_linkedin,
    settings.social_youtube,
    settings.social_telegram,
    settings.social_whatsapp,
  ].filter(Boolean);

  // Kanonik @id capalari: tum sayfalardaki schema'lar (Dataset.creator,
  // Article.publisher vb.) bu tek Organization/WebSite varligina referans verir.
  // Boylece marka kimligi tek kaynaktan gelir, isim tekrari/cakismasi olmaz.
  const orgId = `${SITE_URL}/#organization`;
  const siteId = `${SITE_URL}/#website`;

  const organizationSchema = {
    "@id": orgId,
    name: settings.site_name,
    legalName: settings.legal_entity_name,
    url: SITE_URL,
    ...(settings.site_logo && {
      logo: settings.site_logo.startsWith("http")
        ? settings.site_logo
        : `${SITE_URL}${settings.site_logo}`,
    }),
    ...(settings.contact_email && { email: settings.contact_email }),
    ...(settings.contact_phone && { telephone: settings.contact_phone }),
    ...(settings.responsible_publisher_name && {
      founder: { "@type": "Person", name: settings.responsible_publisher_name },
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  const webSiteSchema = {
    "@id": siteId,
    name: settings.site_name,
    url: SITE_URL,
    publisher: { "@id": orgId },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/fiyatlar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <JsonLd type="Organization" data={organizationSchema} />
      <JsonLd type="WebSite" data={webSiteSchema} />

      <Header
        siteName={settings.site_name || "HalDeFiyat"}
        siteSubtitle={settings.site_description}
        logoUrl={settings.site_logo}
        logoDarkUrl={settings.site_logo_dark}
        logoLightUrl={settings.site_logo_light}
        trackedProducts={overview.trackedProducts}
        activeCities={overview.activeCities}
        targetCoverage={overview.targetCoverage}
        latestRecordedDate={overview.latestRecordedDate}
        freshness={overview.freshness}
      />
      <PublicPopups locale={currentLocale} />

      <main className="relative z-10 grow pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>

      {/* Tüm sayfalarda görünen global reklam (footer üstü) */}
      <BannerSlot position="global_footer" />

      <Footer
        siteName={settings.site_name || "HalDeFiyat"}
        logoUrl={settings.site_logo}
        logoDarkUrl={settings.site_logo_dark}
        logoLightUrl={settings.site_logo_light}
        locale={currentLocale}
        contactEmail={settings.contact_email}
        contactPhone={settings.contact_phone}
        legalEntityName={settings.legal_entity_name}
        responsiblePublisherName={settings.responsible_publisher_name}
        socialFacebook={settings.social_facebook}
        socialInstagram={settings.social_instagram}
        socialTwitter={settings.social_twitter}
        socialLinkedin={settings.social_linkedin}
        socialYoutube={settings.social_youtube}
        socialTelegram={settings.social_telegram}
        socialWhatsapp={settings.social_whatsapp}
      />

      <AlertModalProvider />
      <MobileBottomNav locale={currentLocale} />
    </div>
  );
}
