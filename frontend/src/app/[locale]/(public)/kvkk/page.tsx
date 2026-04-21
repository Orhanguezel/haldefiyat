export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";

type Props = { params: Promise<{ locale: string }> };

export default async function KvkkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("kvkk", locale);

  return <LegalPageContent page={page} fallbackTitle="KVKK Aydınlatma Metni" />;
}
