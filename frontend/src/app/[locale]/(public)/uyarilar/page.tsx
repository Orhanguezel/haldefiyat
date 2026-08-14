export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import AlertsClient from "@/components/sections/AlertsClient";
import { getPageMetadata } from "@/lib/seo";
import PageContainer from "@/components/layout/PageContainer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("uyarilar", {
    locale,
    pathname: "/uyarilar",
    title: "Fiyat Uyarıları | HaldeFiyat",
    description:
      "Seçtiğiniz ürün ve hal için fiyat eşiği belirleyin. Hedef fiyata ulaşınca e-posta ile bildirim alın.",
  });
}

export default async function UyarilarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageContainer>
      <div className="mb-8">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Fiyat Takibi
        </span>
        <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
          Fiyat Uyarıları
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] text-(--color-muted)">
          Bir ürün belirlenen eşiğe düştüğünde veya yükseldiğinde e-posta
          bildirim alın. Hesap gerekmez.
        </p>
      </div>
      <AlertsClient />
    </PageContainer>
  );
}
