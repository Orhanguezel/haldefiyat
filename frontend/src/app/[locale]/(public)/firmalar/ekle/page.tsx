export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AuthGuard } from "@/components/providers/AuthGuard";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { FirmOwnerForm } from "@/components/firms/owner/FirmOwnerForm";

type Props = { params: Promise<{ locale: string }> };

export default async function FirmCreatePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <AuthGuard locale={locale}>
      <main className="relative z-10 mx-auto max-w-[980px] px-8 py-12">
        <Breadcrumb items={[
          { name: "Anasayfa", href: "/" },
          { name: "Firmalar", href: "/firmalar" },
          { name: "Firma Ekle", href: "/firmalar/ekle" },
        ]} />
        <FirmOwnerForm mode="create" locale={locale} />
      </main>
    </AuthGuard>
  );
}
