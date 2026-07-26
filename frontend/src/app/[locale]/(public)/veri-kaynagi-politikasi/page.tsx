import { getPageMetadata } from "@/lib/seo";
import TransparencyPolicyPage from "@/components/TransparencyPolicyPage";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("veri_kaynagi_politikasi", {
    locale,
    pathname: "/veri-kaynagi-politikasi",
    title: "Veri Kaynağı Politikası | HalDeFiyat",
    description: "HalDeFiyat veri kaynağı seçimi, doğrulama, güncellik ve kaynak gösterme standartları.",
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <TransparencyPolicyPage locale={locale} slug="veri-kaynagi-politikasi" title="Veri Kaynağı Politikası" />;
}
