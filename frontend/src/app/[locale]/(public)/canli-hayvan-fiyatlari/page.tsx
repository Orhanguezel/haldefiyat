export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import CategoryPriceLanding from "@/components/sections/CategoryPriceLanding";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("canli_hayvan_fiyatlari", {
    locale,
    pathname: "/canli-hayvan-fiyatlari",
    title: "Canlı Hayvan Fiyatları — Dana, Kuzu, Koyun, Keçi | HaldeFiyat",
    description:
      "Türkiye ticaret borsalarından güncel canlı hayvan (canlı ağırlık) fiyatları: besilik dana, kuzu, koyun, keçi, düve ve inek. Her satırda kaynak ve tarih etiketlidir; borsalar periyodik yayımlar.",
  });
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
      description="Besilik dana, kuzu, koyun, keçi, düve ve inek için ticaret borsalarından derlenen canlı ağırlık (TL/kg) fiyatları. Besici ve üreticiler için referans. Borsalar periyodik yayımlar; her satırda kaynak ve tarih etiketlidir."
      unitNote="Fiyatlar canlı ağırlık TL/kg'dır; karkas (kesilmiş et) fiyatından farklıdır. Karkas için et fiyatları sayfasına bakın."
    />
  );
}
