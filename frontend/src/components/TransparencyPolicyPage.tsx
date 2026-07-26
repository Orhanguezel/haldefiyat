import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";

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
  const page = await fetchCustomPageBySlug(slug, locale);

  return <LegalPageContent page={page} fallbackTitle={title} pathname={`/${slug}`} />;
}
