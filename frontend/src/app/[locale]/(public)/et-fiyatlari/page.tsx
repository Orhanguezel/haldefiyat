export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import CategoryPriceLanding from "@/components/sections/CategoryPriceLanding";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("et_fiyatlari", {
    locale,
    pathname: "/et-fiyatlari",
    title: "Et Fiyatları — Dana Karkas, Kuzu Karkas | HaldeFiyat",
    description:
      "Türkiye ticaret borsalarından güncel karkas et fiyatları: dana karkas ve kuzu karkas (TL/kg). Her satırda kaynak ve tarih etiketlidir; borsalar periyodik yayımlar.",
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
