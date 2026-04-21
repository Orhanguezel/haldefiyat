export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCustomPageBySlug } from "@/lib/api";
import LegalPageContent from "@/components/LegalPageContent";

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("kullanim-kosullari", locale);

  return <LegalPageContent page={page} fallbackTitle="Kullanım Koşulları" />;
}
