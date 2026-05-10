export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("gizlilik_politikasi", {
    locale,
    pathname: "/gizlilik-politikasi",
    title: "Gizlilik Politikası | HaldeFiyat",
    description: "HaldeFiyat gizlilik politikası ve kişisel verilerin korunmasına ilişkin bilgilendirme.",
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("gizlilik-politikasi", locale);

  return <LegalPageContent page={page} fallbackTitle="Gizlilik Politikası" />;
}
