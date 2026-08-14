export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AuthGuard } from "@/components/providers/AuthGuard";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { FirmOwnerForm } from "@/components/firms/owner/FirmOwnerForm";
import { getPageMetadata } from "@/lib/seo";
import PageContainer from "@/components/layout/PageContainer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    ...getPageMetadata("firma_ekle", {
      locale,
      pathname: "/firmalar/ekle",
      title: "Firma Ekle | HalDeFiyat",
      description: "Firmanızı HalDeFiyat firma rehberine ekleyin.",
    }),
    robots: { index: false, follow: false },
  };
}

export default async function FirmCreatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard locale={locale}>
      <PageContainer wide={false}>
        <Breadcrumb items={[
          { name: "Anasayfa", href: "/" },
          { name: "Firmalar", href: "/firmalar" },
          { name: "Firma Ekle", href: "/firmalar/ekle" },
        ]} />
        <FirmOwnerForm mode="create" locale={locale} />
      </PageContainer>
    </AuthGuard>
  );
}
