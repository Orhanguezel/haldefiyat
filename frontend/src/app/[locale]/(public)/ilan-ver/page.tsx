export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { ListingForm } from "@/components/listings/ListingForm";
import { fetchProducts } from "@/lib/api";

type Props = { params: Promise<{ locale: string }> };

export default async function CreateListingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const products = await fetchProducts(undefined, undefined, { seoIndex: true });

  return (
    <PageContainer wide={false}>
      <Breadcrumb items={[{ name: "Anasayfa", href: "/" }, { name: "İlan ver", href: "/ilan-ver" }]} />
      <h1 className="mb-2 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">İlan ver</h1>
      <p className="mb-6 text-sm text-(--color-muted)">İlanlar moderasyon sonrası yayınlanır; fiyatlar resmi hal verisine yazılmaz.</p>
      <ListingForm products={products.slice(0, 500)} />
    </PageContainer>
  );
}

