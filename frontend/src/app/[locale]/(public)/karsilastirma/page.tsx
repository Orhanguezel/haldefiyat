export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchProducts, fetchMarkets } from "@/lib/api";
import ComparisonClient from "@/components/sections/ComparisonClient";
import { getPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("karsilastirma", {
    locale,
    pathname: "/karsilastirma",
    title: "Fiyat Karşılaştırma | HaldeFiyat",
    description:
      "Aynı grafikte birden fazla ürünün fiyat trendini karşılaştır. Haftalık, aylık ve üç aylık dönemlerde min/max/ortalama değerleri incele.",
  });
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, markets] = await Promise.all([fetchProducts(), fetchMarkets()]);
  const rawProducts = await searchParams;
  const productParam = Array.isArray(rawProducts?.products) ? rawProducts?.products[0] : rawProducts?.products;
  const allowed = new Set(products.map((product) => product.slug));
  const initialProductSlugs = (productParam ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value, index, values) => value && allowed.has(value) && values.indexOf(value) === index)
    .slice(0, 4);

  return <ComparisonClient products={products} markets={markets} initialProductSlugs={initialProductSlugs} />;
}
