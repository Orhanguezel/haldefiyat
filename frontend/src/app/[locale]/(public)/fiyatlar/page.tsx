import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { fetchPrices, fetchMarkets } from "@/lib/api";
import PriceTable from "@/components/ui/PriceTable";
import ExportButton from "@/components/ui/ExportButton";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Güncel Hal Fiyatları",
    description:
      "Tüm Türkiye hal fiyatlarını filtreleyin: şehir, kategori, tarih aralığı.",
    openGraph: {
      title: "Güncel Hal Fiyatları | HaldeFiyat",
      description:
        "Türkiye'nin 81 ilindeki hal fiyatlarını tek tabloda filtreleyin.",
      type: "website",
      locale: "tr_TR",
    },
    alternates: { canonical: "/fiyatlar" },
  };
}

export default async function FiyatlarPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [prices, markets] = await Promise.all([
    // latestOnly: her (ürün, market) çifti için sadece en güncel kayıt.
    // Böylece İzmir balık gibi 1 gün geriden gelen kaynaklar limit'e kurban
    // gitmez; tablo ETL biriktikçe sabit boyutta kalır.
    fetchPrices({ range: "7d", limit: 1000, latestOnly: true }),
    fetchMarkets(),
  ]);

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Hal Fiyatları
          </span>
          <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
            Güncel Fiyat Tablosu
          </h1>
        </div>
        <ExportButton params={{ range: "7d" }} />
      </div>
      <PriceTable initialPrices={prices} markets={markets} />
    </main>
  );
}
