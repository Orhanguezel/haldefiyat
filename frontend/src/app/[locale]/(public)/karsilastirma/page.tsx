import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { fetchProducts, fetchMarkets } from "@/lib/api";
import ComparisonClient from "@/components/sections/ComparisonClient";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Fiyat Karşılaştırma | HaldeFiyat",
    description:
      "Aynı grafikte birden fazla ürünün fiyat trendini karşılaştır. Haftalık, aylık ve üç aylık dönemlerde min/max/ortalama değerleri incele.",
  };
}

export default async function ComparePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, markets] = await Promise.all([fetchProducts(), fetchMarkets()]);

  return <ComparisonClient products={products} markets={markets} />;
}
