export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import CategoryPriceLanding from "@/components/sections/CategoryPriceLanding";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Canlı Hayvan Fiyatları — Dana, Kuzu, Koyun, Keçi | HaldeFiyat",
    description:
      "Türkiye ticaret borsalarından güncel canlı hayvan (canlı ağırlık) fiyatları: besilik dana, kuzu, koyun, keçi, düve ve inek. Kaynak ve tarih etiketli, günlük güncellenir.",
    alternates: { canonical: `/${locale}/canli-hayvan-fiyatlari` },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <CategoryPriceLanding
      category="canli-hayvan"
      slug="canli-hayvan-fiyatlari"
      breadcrumbLabel="Canlı Hayvan Fiyatları"
      kicker="Canlı ağırlık · ticaret borsası kaynaklı"
      title="Canlı hayvan fiyatları"
      description="Besilik dana, kuzu, koyun, keçi, düve ve inek için ticaret borsalarından derlenen canlı ağırlık (TL/kg) fiyatları. Besici ve üreticiler için günlük güncellenen referans."
      unitNote="Fiyatlar canlı ağırlık TL/kg'dır; karkas (kesilmiş et) fiyatından farklıdır. Karkas için et fiyatları sayfasına bakın."
    />
  );
}
