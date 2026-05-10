export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("kullanim_kosullari", {
    locale,
    pathname: "/kullanim-kosullari",
    title: "Kullanım Koşulları | HaldeFiyat",
    description: "HaldeFiyat kullanım koşulları ve platform kullanımına ilişkin kurallar.",
  });
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("kullanim-kosullari", locale);

  return <LegalPageContent page={page} fallbackTitle="Kullanım Koşulları" />;
}
