import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import FavoritesClient from "@/components/sections/FavoritesClient";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Favori Ürünlerim",
    description:
      "Favori ürünleriniz için güncel hal fiyatlarını tek ekranda takip edin.",
    alternates: { canonical: "/favoriler" },
    robots: { index: false, follow: true },
  };
}

export default async function FavorilerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-8">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Favorilerim
        </span>
        <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
          Favori Ürünlerim
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] text-(--color-muted)">
          Tarayıcınızda saklanan favori ürünleriniz. Her ziyarette güncel ortalama
          fiyatlar otomatik yüklenir.
        </p>
      </div>
      <FavoritesClient />
    </main>
  );
}
