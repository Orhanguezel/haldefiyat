export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import CategoryPriceLanding from "@/components/sections/CategoryPriceLanding";
import { getPageMetadata } from "@/lib/seo";
import { categoryDescription, categoryTitle, fetchCategoryHeadline } from "@/lib/category-price-meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const headline = await fetchCategoryHeadline("et");
  return getPageMetadata("et_fiyatlari", {
    locale,
    pathname: "/et-fiyatlari",
    title: categoryTitle("Et Fiyatları — Dana ve Kuzu Karkas", headline),
    description: categoryDescription(
      "Türkiye ticaret borsalarından karkas et fiyatları; her satırda kaynak ve tarih etiketli.",
      headline,
      ["Karkas fiyatı canlı ağırlık ve kasap fiyatından farklıdır."],
    ),
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <CategoryPriceLanding
      category="et"
      slug="et-fiyatlari"
      breadcrumbLabel="Et Fiyatları"
      kicker="Karkas (kesilmiş) · ticaret borsası kaynaklı"
      title="Et fiyatları (karkas)"
      description="Dana karkas ve kuzu karkas için ticaret borsalarından derlenen karkas et (TL/kg) fiyatları. Canlı ağırlık için canlı hayvan fiyatları sayfasına bakın."
      unitNote="Fiyatlar karkas (kesilmiş, kemikli) TL/kg'dır; canlı ağırlık ve perakende kasap fiyatından farklıdır."
    />
  );
}
