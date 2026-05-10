export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("kvkk", {
    locale,
    pathname: "/kvkk",
    title: "KVKK Aydınlatma Metni | HaldeFiyat",
    description: "HaldeFiyat KVKK aydınlatma metni ve kişisel veri işleme süreçleri.",
  });
}

export default async function KvkkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("kvkk", locale);

  return <LegalPageContent page={page} fallbackTitle="KVKK Aydınlatma Metni" />;
}
