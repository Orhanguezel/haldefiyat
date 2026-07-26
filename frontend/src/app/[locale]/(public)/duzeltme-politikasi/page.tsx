import { getPageMetadata } from "@/lib/seo";
import TransparencyPolicyPage from "@/components/TransparencyPolicyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("duzeltme_politikasi", {
    locale,
    pathname: "/duzeltme-politikasi",
    title: "Düzeltme Politikası | HalDeFiyat",
    description: "HalDeFiyat veri ve içerik hatalarının bildirilmesi, incelenmesi ve düzeltilmesi süreci.",
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <TransparencyPolicyPage locale={locale} slug="duzeltme-politikasi" title="Düzeltme Politikası" />;
}
