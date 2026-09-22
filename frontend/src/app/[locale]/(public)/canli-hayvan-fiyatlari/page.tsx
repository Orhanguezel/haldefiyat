export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import CategoryPriceLanding from "@/components/sections/CategoryPriceLanding";
import { getPageMetadata } from "@/lib/seo";
import { categoryDescription, categoryTitle, fetchCategoryHeadline } from "@/lib/category-price-meta";
import { sectionOgImage } from "@/lib/og-sections";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const headline = await fetchCategoryHeadline("canli-hayvan");
  return getPageMetadata("canli_hayvan_fiyatlari", {
    locale,
    pathname: "/canli-hayvan-fiyatlari",
    openGraph: { images: [sectionOgImage("canli-hayvan-fiyatlari")] },
    title: categoryTitle("Canlı Hayvan Fiyatları — Dana, Kuzu, Koyun", headline),
    description: categoryDescription(
      "Ticaret borsalarından canlı ağırlık fiyatları: besilik dana, kuzu, koyun, keçi, düve ve inek.",
      headline,
    ),
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
