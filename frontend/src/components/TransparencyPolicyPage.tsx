import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";
import { fetchSiteSettings } from "@/lib/site-settings";

export default async function TransparencyPolicyPage({
  locale,
  slug,
  title,
}: {
  locale: string;
  slug: string;
  title: string;
}) {
  setRequestLocale(locale);
  const [page, settings] = await Promise.all([fetchCustomPageBySlug(slug, locale), fetchSiteSettings(locale)]);

  return <LegalPageContent page={page} fallbackTitle={title} pathname={`/${slug}`} corporateDetails={slug === "sahiplik-finansman" ? {
    legalEntity: settings.legal_entity_name || "GZL Teknoloji",
    responsiblePublisher: settings.responsible_publisher_name || "Atakan Şahin",
    technicalContact: settings.technical_contact_name || "Orhan Güzel",
    email: settings.contact_email || "info@gzlteknoloji.com",
  } : undefined} />;
}
