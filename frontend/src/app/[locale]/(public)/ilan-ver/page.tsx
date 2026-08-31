export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { ListingForm } from "@/components/listings/ListingForm";
import { fetchProducts } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return {
    ...getPageMetadata("ilan_ver", {
      locale,
      pathname: "/ilan-ver",
      title: "Ücretsiz İlan Ver — Tarım Ürünü Alım Satım İlanı",
      description: "Ürününüzü hal fiyatlarını takip eden alıcılara ücretsiz duyurun. Komisyon yok, üyelik ücretsiz; ilan moderasyondan sonra yayınlanır.",
    }),
    // 31 Agustos 2026: sayfa noindex'ti — ilan kazanmanin TEK yuzeyi aramada
    // gorunmuyordu. Modul icerik uretmiyorsa sebebi talep degil gorunmezlikti.
    robots: { index: true, follow: true },
  };
}

export default async function CreateListingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const products = await fetchProducts(undefined, undefined, { seoIndex: true });

  return (
    <PageContainer wide={false}>
      <Breadcrumb items={[{ name: "Anasayfa", href: "/" }, { name: "İlan ver", href: "/ilan-ver" }]} />
      <h1 className="mb-2 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">Ücretsiz ilan ver</h1>
      <p className="mb-2 text-sm leading-6 text-(--color-muted)">
        Ürününüzü, her gün hal fiyatlarına bakan alıcılara duyurun. <strong className="text-(--color-foreground)">Ücretsiz ve komisyonsuz</strong> —
        satıştan pay alınmaz. İlanınız moderasyondan sonra yayınlanır.
      </p>
      <p className="mb-6 text-xs text-(--color-muted)">
        İlan fiyatları resmi hal verisine karışmaz; site tablolarını etkilemez.
      </p>
      <ListingForm products={products.slice(0, 500)} />
    </PageContainer>
  );
}
